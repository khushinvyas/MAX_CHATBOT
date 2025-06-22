# Vercel Deployment Guide for Flask Chatbot

## 🚀 Why Vercel?

- **⚡ Ultra-fast cold starts** (<1 second)
- **🌍 Global edge network** for worldwide performance
- **🔄 Auto-scaling** based on traffic
- **💰 Generous free tier** with 100GB bandwidth
- **🔧 Easy deployment** with GitHub integration

## 📋 Prerequisites

1. **GitHub account** with your code repository
2. **Vercel account** (sign up at [vercel.com](https://vercel.com))
3. **Environment variables** ready:
   - `GEMINI_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `FLASK_SECRET_KEY`
   - `JWT_SECRET`

## 🛠️ Step-by-Step Deployment

### Step 1: Prepare Your Repository

Your repository should now have these files:
- `app.py` (optimized for Vercel)
- `vercel.json` (Vercel configuration)
- `requirements.txt` (with pinned versions)

### Step 2: Deploy to Vercel

1. **Go to [vercel.com](https://vercel.com)** and sign in
2. **Click "New Project"**
3. **Import your GitHub repository**
4. **Configure the project**:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: Leave empty (Vercel will auto-detect)
   - **Output Directory**: Leave empty
   - **Install Command**: Leave empty

### Step 3: Add Environment Variables

1. **Go to Project Settings** → **Environment Variables**
2. **Add each variable**:
   ```
   GEMINI_API_KEY=your_gemini_api_key
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   FLASK_SECRET_KEY=your_flask_secret_key
   JWT_SECRET=your_jwt_secret
   ```
3. **Select all environments** (Production, Preview, Development)
4. **Click "Save"**

### Step 4: Deploy

1. **Click "Deploy"**
2. **Wait for build** (usually 2-3 minutes)
3. **Your app will be live** at `https://your-project.vercel.app`

## 🔧 Configuration Details

### vercel.json Explained

```json
{
  "version": 2,
  "builds": [
    {
      "src": "app.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "app.py"
    }
  ],
  "functions": {
    "app.py": {
      "maxDuration": 30
    }
  }
}
```

- **`@vercel/python`**: Uses Vercel's Python runtime
- **`maxDuration: 30`**: Sets function timeout to 30 seconds
- **Routes**: All requests go to your Flask app

### Key Optimizations Made

1. **Removed polling thread** (not needed in serverless)
2. **Updated CORS origins** to include Vercel domains
3. **Optimized logging** for serverless environment
4. **Fresh data extraction** on each request
5. **Pinned dependency versions** for stability

## 🌐 API Endpoints

Your deployed app will have these endpoints:

- **`GET /`** - Health check
- **`POST /api/chat`** - Main chat endpoint
- **`POST /api/auth/login`** - User login
- **`POST /api/auth/register`** - User registration
- **`POST /api/files/upload`** - File upload (admin only)
- **`GET /api/files/list`** - List files (admin only)
- **`DELETE /api/files/<filename>`** - Delete file (admin only)
- **`GET /healthz`** - Health check

## 🔍 Testing Your Deployment

### 1. Health Check
```bash
curl https://your-project.vercel.app/healthz
```

### 2. Chat API
```bash
curl -X POST https://your-project.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, what products do you have?"}'
```

### 3. Frontend Integration

Update your frontend API base URL to:
```javascript
const API_BASE_URL = 'https://your-project.vercel.app';
```

## 🚨 Troubleshooting

### Common Issues

1. **Build Fails**
   - Check `requirements.txt` for syntax errors
   - Ensure all dependencies are compatible
   - Check Vercel build logs

2. **Environment Variables Not Working**
   - Verify all variables are set in Vercel dashboard
   - Check variable names match your code
   - Redeploy after adding variables

3. **Cold Start Issues**
   - First request might be slow (normal for serverless)
   - Subsequent requests will be fast
   - Consider using Vercel's Edge Functions for even faster starts

4. **CORS Errors**
   - Check your frontend domain is in CORS origins
   - Update `app.py` if needed

### Performance Tips

1. **Keep functions lightweight**
2. **Use connection pooling** for database
3. **Cache frequently accessed data**
4. **Optimize imports** and dependencies

## 📊 Performance Comparison

| Metric | Render | Vercel |
|--------|--------|--------|
| **Cold Start** | 10-30s | <1s |
| **Response Time** | 2-5s | 0.5-2s |
| **Auto-scaling** | Limited | Excellent |
| **Global CDN** | No | Yes |
| **Free Tier** | Limited | Generous |

## 🔄 Updating Your App

1. **Push changes** to GitHub
2. **Vercel auto-deploys** (if connected)
3. **Or manually deploy** from Vercel dashboard

## 💡 Pro Tips

1. **Use Vercel CLI** for local testing:
   ```bash
   npm i -g vercel
   vercel login
   vercel dev
   ```

2. **Monitor performance** in Vercel dashboard

3. **Set up custom domain** if needed

4. **Use Vercel Analytics** to track usage

## 🎉 Success!

Your Flask chatbot is now deployed on Vercel with:
- ⚡ Ultra-fast response times
- 🌍 Global edge network
- 🔄 Automatic scaling
- 💰 Free hosting

Your users will experience much faster response times compared to Render! 