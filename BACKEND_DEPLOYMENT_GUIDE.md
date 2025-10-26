# Backend Deployment Guide

Your frontend is deployed successfully on Vercel, but you need to deploy your backend API separately.

## 🚀 RECOMMENDED: Deploy Backend to Render.com

Render.com offers:
- ✅ Free tier for hobby projects
- ✅ Supports Node.js servers natively
- ✅ Easy PostgreSQL/MySQL integration
- ✅ Automatic HTTPS
- ✅ Simple environment variable management

### Step 1: Prepare Backend for Deployment

First, create a backend-specific configuration:

**Create `backend/package.json` (if it doesn't have a start script):**

Check if your backend/package.json has these scripts:
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

### Step 2: Update CORS Configuration

Your backend needs to allow requests from your Vercel frontend.

**Edit `backend/server.js`** - Add your Vercel URL to allowed origins:

```javascript
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5000',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5000',
      'https://menu-card-ylcn.vercel.app',  // ← ADD THIS
      'https://*.vercel.app'  // Allow all Vercel preview deployments
    ];
    
    // Allow network IPs
    if (origin.match(/^http:\/\/192\.168\.\d+\.\d+:\d+$/)) {
      return callback(null, true);
    }
    
    // Check allowed origins (support wildcards)
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed.includes('*')) {
        const regex = new RegExp(allowed.replace('*', '.*'));
        return regex.test(origin);
      }
      return allowed === origin;
    });
    
    if (isAllowed) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
```

### Step 3: Deploy to Render.com

1. **Sign up** at [render.com](https://render.com)

2. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select your repository

3. **Configure the service**:
   ```
   Name: menu-card-backend
   Region: Choose closest to your users
   Branch: main
   Root Directory: backend
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   ```

4. **Add Environment Variables** (in Render dashboard):
   ```
   NODE_ENV=production
   PORT=5000
   DB_HOST=your-database-host
   DB_PORT=5432
   DB_USER=your-db-user
   DB_PASSWORD=your-db-password
   DB_NAME=your-db-name
   FRONTEND_URL=https://menu-card-ylcn.vercel.app
   ```

5. **Click "Create Web Service"**

6. **Wait for deployment** (usually 2-3 minutes)

7. **Get your backend URL**: 
   - Will be something like: `https://menu-card-backend.onrender.com`

### Step 4: Update Frontend to Use Backend URL

1. **Add environment variable to Vercel**:
   - Go to your Vercel dashboard
   - Select your project
   - Go to Settings → Environment Variables
   - Add:
     ```
     Name: REACT_APP_API_URL
     Value: https://menu-card-backend.onrender.com/api
     Environment: Production, Preview, Development
     ```

2. **Redeploy frontend** (Vercel will auto-redeploy when env vars change)

### Step 5: Test

Visit your frontend:
```
https://menu-card-ylcn.vercel.app/admin/menu/cafe-aroma
```

It should now fetch data successfully! ✅

---

## 🔧 ALTERNATIVE: Deploy Backend to Railway.app

Railway is another great option:

1. Go to [railway.app](https://railway.app)
2. Click "Start a New Project"
3. Select "Deploy from GitHub repo"
4. Select your repository
5. Click "Add variables" and add your environment variables
6. Railway will auto-detect it's a Node.js app and deploy

**Benefits:**
- ✅ $5 free credit per month
- ✅ Very fast deployments
- ✅ Great developer experience
- ✅ Built-in PostgreSQL

---

## 🔧 ALTERNATIVE: Deploy Backend to Vercel as Serverless Functions

This is more complex but keeps everything on Vercel.

**Create `backend/vercel.json`:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ]
}
```

**Note:** This requires significant refactoring:
- Express.js needs to be adapted for serverless
- Database connections need connection pooling
- More complex to debug

**Not recommended for beginners** - use Render or Railway instead.

---

## 🎯 RECOMMENDED SETUP

**Frontend**: Vercel (already done ✅)
- Fast CDN
- Great for React apps
- Free for personal projects

**Backend**: Render.com or Railway.app
- Supports traditional Node.js servers
- Easy database integration
- Free tier available

**Database**: Neon.tech (PostgreSQL) or PlanetScale (MySQL)
- Serverless databases
- Free tier
- Great for hobby projects

---

## 📋 QUICK CHECKLIST

- [ ] Update CORS in backend to allow Vercel URL
- [ ] Deploy backend to Render/Railway
- [ ] Get backend URL from deployment
- [ ] Add REACT_APP_API_URL to Vercel environment variables
- [ ] Redeploy frontend on Vercel
- [ ] Test the application

---

## ⚠️ IMPORTANT: Free Tier Limitations

**Render.com Free Tier:**
- ✅ Free forever
- ⚠️ Spins down after 15 minutes of inactivity
- ⚠️ Takes 30-60 seconds to wake up on first request
- 💡 Tip: Use a service like [cron-job.org](https://cron-job.org) to ping your API every 10 minutes to keep it alive

**Railway Free Tier:**
- ✅ $5 free credit per month
- ✅ No sleep/spin-down
- ⚠️ Credit runs out if you exceed usage
- 💡 Tip: Monitor usage to stay within free tier

**Vercel Free Tier:**
- ✅ Unlimited frontend deployments
- ✅ No bandwidth limits for hobby projects
- ✅ Automatic HTTPS and CDN

---

## 🆘 TROUBLESHOOTING

### Issue: CORS errors after deployment

**Fix:** Make sure your backend's CORS configuration includes your Vercel URL:
```javascript
'https://menu-card-ylcn.vercel.app'
```

### Issue: Backend takes long to respond on first request

**Cause:** Render free tier spins down after inactivity

**Fix:** 
1. Accept the 30-60s delay on first request
2. Set up a ping service to keep it alive
3. Upgrade to paid tier ($7/month for always-on)

### Issue: Database connection fails

**Fix:** Make sure environment variables are set correctly:
- DB_HOST
- DB_PORT
- DB_USER
- DB_PASSWORD
- DB_NAME

### Issue: Frontend still tries to connect to localhost

**Fix:** Make sure REACT_APP_API_URL is set in Vercel and the frontend was redeployed

---

**Ready to deploy? Start with Render.com - it's the easiest!** 🚀

