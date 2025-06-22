import os
import PyPDF2
import google.generativeai as genai
from flask import Flask, request, render_template, jsonify, Response, session
from datetime import datetime, timedelta
from flask_cors import CORS
from dotenv import load_dotenv
import json
import traceback
import logging
import hashlib
import time
import sys
import jwt
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import pandas as pd
from supabase import create_client, Client

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    logger.error("SUPABASE_URL or SUPABASE_KEY environment variables are not set")
    raise ValueError("SUPABASE_URL and SUPABASE_KEY environment variables must be set")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    logger.error("GEMINI_API_KEY environment variable is not set")
    raise ValueError("GEMINI_API_KEY environment variable is not set")

try:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-1.5-flash")
    logger.info("Successfully configured Gemini API")
except Exception as e:
    logger.error(f"Failed to configure Gemini API: {str(e)}")
    raise

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "super-secret-key")  # Needed for session
CORS(app, resources={
    r"/*": {
        "origins": [
            "https://*.onrender.com",
            "http://localhost:5000",
            "http://localhost:5173",
            "http://localhost:8080",
            "https://max-enquiry-chatbot.vercel.app",
            "https://*.vercel.app",
            "https://max-enquiry-chatbot-3qa0xcwdu-khushins-projects.vercel.app"
        ],
        "methods": ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Directory containing PDF files
PDF_DIRECTORY = os.getenv("PDF_DIRECTORY", "pdfs")

# File upload configuration
ALLOWED_EXTENSIONS = {'pdf', 'xlsx', 'xls'}
BUCKET_NAME = "price-lists"  # Name of your Supabase storage bucket

# Initialize Supabase storage bucket if it doesn't exist
def init_storage_bucket():
    try:
        # Check if bucket exists
        response = supabase.storage.get_bucket(BUCKET_NAME)
        logger.info(f"Storage bucket '{BUCKET_NAME}' already exists")
    except Exception as e:
        logger.error(f"Storage bucket '{BUCKET_NAME}' does not exist or could not be accessed: {str(e)}")
        raise

# Initialize storage bucket
init_storage_bucket()

# Global variables to store PDF data and file hashes
product_data = ""
pdf_hashes = {}

def calculate_file_hash(file_path):
    """Calculate MD5 hash of a file."""
    hash_md5 = hashlib.md5()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()

def get_pdf_files():
    """Get list of PDF files in the directory."""
    if not os.path.exists(PDF_DIRECTORY):
        return []
    return [f for f in os.listdir(PDF_DIRECTORY) if f.lower().endswith('.pdf')]

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_pdf_text():
    """Extract text from all PDFs and text files in Supabase Storage."""
    global product_data, pdf_hashes
    pdf_text = ""
    new_hashes = {}
    
    try:
        # List all files in the bucket
        response = supabase.storage.from_(BUCKET_NAME).list()
        
        for file in response:
            if file['name'].endswith(('.pdf', '.txt')):
                try:
                    # Download file content
                    file_content = supabase.storage.from_(BUCKET_NAME).download(file['name'])
                    
                    # Calculate hash of the content
                    content_hash = hashlib.md5(file_content).hexdigest()
                    new_hashes[file['name']] = content_hash
                    
                    # Skip if file hasn't changed
                    if file['name'] in pdf_hashes and pdf_hashes[file['name']] == content_hash:
                        logger.info(f"Skipping unchanged file: {file['name']}")
                        continue
                    
                    logger.info(f"Processing file: {file['name']}")
                    
                    if file['name'].endswith('.pdf'):
                        # Process PDF
                        with open("temp.pdf", "wb") as f:
                            f.write(file_content)
                        reader = PyPDF2.PdfReader("temp.pdf")
                        for page_num, page in enumerate(reader.pages, 1):
                            try:
                                text = page.extract_text()
                                if text:
                                    pdf_text += f"\n--- Page {page_num} from {file['name']} ---\n{text}\n"
                            except Exception as e:
                                logger.error(f"Error extracting text from page {page_num} of {file['name']}: {str(e)}")
                        os.remove("temp.pdf")
                    else:  # .txt file
                        # Process text file
                        text = file_content.decode('utf-8')
                        if text:
                            pdf_text += f"\n--- Content from {file['name']} ---\n{text}\n"
                    
                except Exception as e:
                    logger.error(f"Error processing {file['name']}: {str(e)}")
        
        # Update global variables
        pdf_hashes = new_hashes
        if pdf_text:
            product_data = pdf_text
            logger.info("Successfully updated product data")
        else:
            logger.warning("No text was extracted from any files")
        
        return pdf_text
        
    except Exception as e:
        logger.error(f"Error extracting text from storage: {str(e)}")
        return ""

def poll_pdf_directory():
    """Poll the Supabase Storage for changes."""
    global stop_polling
    while not stop_polling:
        try:
            extract_pdf_text()
            time.sleep(5)  # Poll every 5 seconds
        except Exception as e:
            logger.error(f"Error in storage polling: {str(e)}")
            time.sleep(5)  # Wait before retrying

# JWT configuration
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")  # Change this in production
JWT_ALGORITHM = "HS256"

def generate_token(user_id, role):
    """Generate JWT token for authenticated user."""
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.utcnow() + timedelta(days=1)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("Authorization")
        if not token:
            return jsonify({"error": "Token is missing", "status": "error"}), 401
        try:
            token = token.split(" ")[1]  # Remove "Bearer " prefix
            data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            current_user = data
        except:
            return jsonify({"error": "Token is invalid", "status": "error"}), 401
        return f(current_user, *args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("Authorization")
        if not token:
            return jsonify({"error": "Token is missing", "status": "error"}), 401
        try:
            token = token.split(" ")[1]
            data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            if data["role"] != "admin":
                return jsonify({"error": "Admin access required", "status": "error"}), 403
            current_user = data
        except:
            return jsonify({"error": "Token is invalid", "status": "error"}), 401
        return f(current_user, *args, **kwargs)
    return decorated

# Authentication routes
@app.route("/api/auth/register", methods=["POST"])
def register():
    try:
        data = request.get_json()
        if not data or not all(k in data for k in ["username", "password", "role"]):
            return jsonify({"error": "Missing required fields", "status": "error"}), 400

        username = data["username"]
        password = data["password"]
        role = data["role"]

        if role not in ["admin", "customer"]:
            return jsonify({"error": "Invalid role", "status": "error"}), 400

        # Check if username exists
        response = supabase.table("users").select("id").eq("username", username).execute()
        if response.data:
            return jsonify({"error": "Username already exists", "status": "error"}), 400

        # Create new user
        password_hash = generate_password_hash(password)
        response = supabase.table("users").insert({
            "username": username,
            "password_hash": password_hash,
            "role": role
        }).execute()

        if not response.data:
            return jsonify({"error": "Failed to create user", "status": "error"}), 500

        user_id = response.data[0]["id"]
        token = generate_token(user_id, role)
        
        return jsonify({
            "message": "User registered successfully",
            "token": token,
            "status": "success"
        })

    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        return jsonify({"error": "Registration failed", "status": "error"}), 500

@app.route("/api/auth/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        email = data.get('username')  # We're still using 'username' in the request for compatibility
        password = data.get('password')
        
        if not email or not password:
            return jsonify({"error": "Email and password are required", "status": "error"}), 400
            
        # Query user by email instead of username
        user = supabase.table("users").select("*").eq("email", email).execute()
        
        if not user.data:
            return jsonify({"error": "Invalid username or password", "status": "error"}), 401
            
        user_data = user.data[0]
        
        # Verify password
        if not check_password_hash(user_data['password_hash'], password):
            return jsonify({"error": "Invalid username or password", "status": "error"}), 401
            
        # Generate JWT token
        token = jwt.encode({
            'user_id': user_data['id'],
            'role': user_data['role'],
            'exp': datetime.utcnow() + timedelta(days=1)
        }, JWT_SECRET, algorithm='HS256')
        
        return jsonify({
            "token": token,
            "user": {
                "id": user_data['id'],
                "email": user_data['email'],
                "role": user_data['role']
            }
        })
        
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({"error": "Internal server error", "status": "error"}), 500

# Log user question and response to database
def log_interaction(question, response=None, error=None):
    try:
        supabase.table("queries").insert({
            "question": question,
            "response": response,
            "timestamp": datetime.utcnow().isoformat(),
            "error": error
        }).execute()
        logger.info("Successfully logged interaction")
    except Exception as e:
        logger.error(f"Failed to log interaction: {str(e)}")

# Extract product data once at startup (for Vercel, this will happen on each cold start)
try:
    product_data = extract_pdf_text()
    if not product_data.strip():
        logger.warning("No product data was extracted from PDFs")
    else:
        logger.info("Successfully loaded product data")
except Exception as e:
    logger.error(f"Failed to extract product data: {str(e)}")
    product_data = ""

# Flask route for home page
@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Chatbot API is running", "status": "success"})

# Modify existing chat endpoint to not require authentication
@app.route("/api/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()
        if not data or "message" not in data:
            logger.warning("No message provided in request")
            return jsonify({
                "error": "No message provided. Please enter your question.",
                "suggestion": "Type your question in the chat box.",
                "status": "error"
            }), 400

        user_query = data["message"]
        customer_name = data.get("customerName", "Anonymous")
        language = data.get("language", "en")  # Default to English
        logger.info(f"Received query from {customer_name}: {user_query} (lang={language})")

        # For Vercel, extract product data on each request to ensure freshness
        current_product_data = extract_pdf_text()
        if not current_product_data.strip():
            error_msg = "No product data available. Please upload a price list."
            logger.error(error_msg)
            log_interaction(user_query, error=error_msg)
            return jsonify({
                "error": error_msg,
                "suggestion": "Upload a price list PDF or Excel file.",
                "status": "error"
            }), 500

        # --- Contextual Memory ---
        history = session.get("chat_history", [])
        # Keep only last 5 exchanges
        history = history[-5:]
        # Add current question
        history.append({"role": "user", "content": user_query})
        session["chat_history"] = history

        # --- Prompt Engineering ---
        history_text = "\n".join([
            f"{h['role'].capitalize()}: {h['content']}" for h in history
        ])
        prompt = f"""Based on the following product information:\n{current_product_data}\n\nConversation so far:\n{history_text}\n\nAnswer the user's question: {user_query}\n\nImportant:\n- When providing price information, format it in a clear and readable way.\n- Use bullet points for different price types.\n- Separate prices with clear labels.\n- Use proper spacing and line breaks.\n- Avoid using asterisks or markdown formatting.\n- Make sure the response is easy to read and understand.\n- If possible, return a JSON object with a 'text' field for the answer and a 'prices' field as a list of price items (if relevant).\n"""
        if language == "gu":
            prompt += (
                "\n\nRespond ONLY in Gujarati language. Do NOT use English or any other language. "
                "If you use any language other than Gujarati, it is incorrect. "
                "All explanations, numbers, and price details must be in Gujarati."
            )
        elif language == "en":
            prompt += (
                "\n\nRespond ONLY in English language. Do NOT use Gujarati or any other language. "
                "If you use any language other than English, it is incorrect. "
                "All explanations, numbers, and price details must be in English."
            )
        else:
            prompt += f"\n\nRespond ONLY in {language} language. Do NOT use any other language."

        def stream_response():
            try:
                # Call Gemini API
                logger.info("Calling Gemini API (streaming)")
                gemini_response = model.generate_content(prompt)
                response = gemini_response.text
                # Simulate streaming by splitting into chunks
                chunk_size = 100
                for i in range(0, len(response), chunk_size):
                    yield response[i:i+chunk_size]
                    time.sleep(0.05)
                # Log successful interaction
                log_interaction(user_query, response)
                logger.info("Successfully generated response (streamed)")
            except Exception as e:
                error_msg = f"Error processing query: {str(e)}"
                logger.error(f"Gemini API error: {str(e)}")
                logger.error(traceback.format_exc())
                log_interaction(user_query, error=error_msg)
                yield f"[Error]: {error_msg}\nSuggestion: Try rephrasing your question or check if the price list is uploaded."

        return Response(stream_response(), mimetype='text/plain')

    except Exception as e:
        error_msg = f"Internal server error: {str(e)}"
        logger.error(f"Unexpected error: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            "error": "Internal server error.",
            "suggestion": "Please try again later or contact support.",
            "status": "error"
        }), 500

@app.route("/api/files/upload", methods=["POST"])
@admin_required
def upload_file(current_user):
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file part", "status": "error"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No selected file", "status": "error"}), 400
        
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            
            # Read file content
            file_content = file.read()
            
            # Upload to Supabase Storage
            file_path = f"{current_user['user_id']}/{filename}"
            response = supabase.storage.from_(BUCKET_NAME).upload(
                file_path,
                file_content,
                {"content-type": file.content_type}
            )
            
            # If it's an Excel file, convert it to text and upload
            if filename.endswith(('.xlsx', '.xls')):
                try:
                    # Create a temporary file to process Excel
                    temp_file = f"temp_{filename}"
                    with open(temp_file, "wb") as f:
                        f.write(file_content)
                    
                    # Convert Excel to text
                    df = pd.read_excel(temp_file)
                    text_content = df.to_string()
                    
                    # Upload text version
                    text_filename = f"{filename}.txt"
                    text_file_path = f"{current_user['user_id']}/{text_filename}"
                    supabase.storage.from_(BUCKET_NAME).upload(
                        text_file_path,
                        text_content.encode('utf-8'),
                        {"content-type": "text/plain"}
                    )
                    
                    # Clean up temporary file
                    os.remove(temp_file)
                except Exception as e:
                    logger.error(f"Error converting Excel to text: {str(e)}")
                    return jsonify({"error": "Error processing Excel file", "status": "error"}), 500
            
            # Get public URL for the file
            file_url = supabase.storage.from_(BUCKET_NAME).get_public_url(file_path)
            
            return jsonify({
                "message": "File uploaded successfully",
                "filename": filename,
                "url": file_url,
                "status": "success"
            })
        
        return jsonify({"error": "File type not allowed", "status": "error"}), 400
    
    except Exception as e:
        logger.error(f"File upload error: {str(e)}")
        return jsonify({"error": "File upload failed", "status": "error"}), 500

@app.route("/api/files/list", methods=["GET"])
@admin_required
def list_files(current_user):
    try:
        # List files in the user's directory
        response = supabase.storage.from_(BUCKET_NAME).list(f"{current_user['user_id']}")
        
        files = []
        for file in response:
            if allowed_file(file['name']):
                file_url = supabase.storage.from_(BUCKET_NAME).get_public_url(
                    f"{current_user['user_id']}/{file['name']}"
                )
                files.append({
                    "name": file['name'],
                    "size": file['metadata'].get('size', 0),
                    "modified": file['metadata'].get('lastModified', ''),
                    "url": file_url
                })
        
        return jsonify({
            "files": files,
            "status": "success"
        })
    except Exception as e:
        logger.error(f"Error listing files: {str(e)}")
        return jsonify({"error": "Failed to list files", "status": "error"}), 500

@app.route("/api/files/<filename>", methods=["DELETE"])
@admin_required
def delete_file(current_user, filename):
    try:
        if not allowed_file(filename):
            return jsonify({"error": "Invalid file type", "status": "error"}), 400
        
        file_path = f"{current_user['user_id']}/{filename}"
        
        # Delete the file
        supabase.storage.from_(BUCKET_NAME).remove([file_path])
        
        # If it's an Excel file, also delete the text version
        if filename.endswith(('.xlsx', '.xls')):
            text_file_path = f"{current_user['user_id']}/{filename}.txt"
            try:
                supabase.storage.from_(BUCKET_NAME).remove([text_file_path])
            except Exception as e:
                logger.warning(f"Could not delete text version of {filename}: {str(e)}")
        
        return jsonify({
            "message": "File deleted successfully",
            "status": "success"
        })
    except Exception as e:
        logger.error(f"Error deleting file: {str(e)}")
        return jsonify({"error": "Failed to delete file", "status": "error"}), 500

@app.route("/healthz", methods=["GET"])
def healthz():
    return jsonify({"status": "ok"}), 200

if __name__ == "__main__":
    logger.info("Starting Flask application")
    try:
        # Run without debug mode to avoid watchdog issues
        app.run(host="0.0.0.0", port=5000, debug=False)
    except KeyboardInterrupt:
        logger.info("Received keyboard interrupt")