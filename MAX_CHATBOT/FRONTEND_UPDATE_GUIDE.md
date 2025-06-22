# Frontend Configuration Update Guide

## 🔄 Update Your Frontend to Use Vercel Backend

### Current Setup
Your frontend is currently pointing to: `https://max-chatbot-vkds.onrender.com/api`

### After Deploying Backend to Vercel

Once you deploy your backend to Vercel, you'll need to update your frontend configuration.

## 📝 Step 1: Update Environment Variable

### Option A: Update .env file (Recommended)
Create or update `.env` file in your frontend project root:

```env
VITE_API_URL=https://your-backend-project.vercel.app/api
```

### Option B: Update Vercel Environment Variables
1. Go to your **frontend project** in Vercel dashboard
2. Go to **Settings** → **Environment Variables**
3. Add/Update: `VITE_API_URL` = `https://your-backend-project.vercel.app/api`
4. Redeploy your frontend

## 🔧 Step 2: Update API Configuration (if needed)

If you want to hardcode the URL temporarily, update `src/lib/api.ts`:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://your-backend-project.vercel.app/api';
```

## 🚀 Step 3: Deploy Backend to Vercel

1. **Push your backend code** to GitHub (with the new Vercel files)
2. **Go to [vercel.com](https://vercel.com)**
3. **Create new project** → Import your backend repository
4. **Add environment variables**:
   ```
   GEMINI_API_KEY=your_gemini_api_key
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   FLASK_SECRET_KEY=your_flask_secret_key
   JWT_SECRET=your_jwt_secret
   ```
5. **Deploy** - Get your backend URL (e.g., `https://your-backend-project.vercel.app`)

## 🔗 Step 4: Update Frontend

Once you have your backend URL, update your frontend:

1. **Update environment variable** with your backend URL
2. **Redeploy frontend** (Vercel will auto-deploy if connected to GitHub)
3. **Test the connection**

## 🧪 Step 5: Test the Integration

### Test Backend Health
```bash
curl https://your-backend-project.vercel.app/healthz
```

### Test Chat API
```bash
curl -X POST https://your-backend-project.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, what products do you have?"}'
```

### Test Frontend
Visit your frontend: `https://max-enquiry-chatbot-3qa0xcwdu-khushins-projects.vercel.app`

## 📊 Expected Performance Improvement

| Metric | Current (Render) | New (Vercel) |
|--------|------------------|--------------|
| **Response Time** | 2-5 seconds | 0.5-2 seconds |
| **Cold Start** | 10-30 seconds | <1 second |
| **Reliability** | Good | Excellent |

## 🚨 Troubleshooting

### CORS Errors
- ✅ Already fixed in backend CORS configuration
- Your frontend domain is now included: `https://max-enquiry-chatbot-3qa0xcwdu-khushins-projects.vercel.app`

### Environment Variables Not Working
- Check Vercel dashboard for correct variable names
- Ensure `VITE_` prefix for frontend variables
- Redeploy after adding variables

### API Connection Issues
- Verify backend URL is correct
- Check backend is deployed and running
- Test with curl commands first

## 🎯 Quick Checklist

- [ ] Deploy backend to Vercel
- [ ] Get backend URL
- [ ] Update frontend environment variable
- [ ] Redeploy frontend
- [ ] Test chat functionality
- [ ] Test file upload (admin)
- [ ] Test authentication

## 💡 Pro Tips

1. **Use different environment variables** for development and production
2. **Test locally first** with `vercel dev`
3. **Monitor performance** in Vercel dashboard
4. **Set up custom domains** if needed

Your chatbot will be much faster once both frontend and backend are on Vercel! 🚀 