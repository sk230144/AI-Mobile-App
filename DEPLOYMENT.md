# Deployment Guide

Complete guide for deploying the AI Spam Call Defender to production.

## 📋 Prerequisites

- [ ] Supabase production project
- [ ] Groq API key
- [ ] Domain name (optional)
- [ ] App Store / Play Store accounts (optional)

## 🗄️ Database Deployment

### Step 1: Production Supabase Project

1. **Create Production Project**:
   - Go to https://supabase.com/dashboard
   - Click "New Project"
   - Choose organization
   - Enter project name: "ai-spam-call-prod"
   - Generate secure database password
   - Select region closest to users
   - Click "Create Project"

2. **Run Database Schema**:
   ```sql
   -- In Supabase SQL Editor, run:
   -- 1. backend/database-schema.sql
   -- 2. backend/database-rls.sql
   -- 3. backend/storage-policies.sql
   ```

3. **Configure Storage**:
   - Go to Storage → Create bucket: "call-recordings"
   - Make it public
   - Apply storage policies from SQL script

4. **Save Credentials**:
   ```
   Project URL: https://[project-ref].supabase.co
   Anon Key: eyJhbGc...
   Service Role Key: eyJhbGc... (keep secret!)
   Database Password: [your-password]
   ```

## 🚀 Backend Deployment

### Option 1: Railway (Recommended)

1. **Create Railway Account**:
   - Go to https://railway.app
   - Sign up with GitHub

2. **Deploy Backend**:
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli

   # Login
   railway login

   # Initialize project
   cd backend
   railway init

   # Add environment variables
   railway variables set SUPABASE_URL=https://...
   railway variables set SUPABASE_ANON_KEY=eyJ...
   railway variables set SUPABASE_SERVICE_ROLE_KEY=eyJ...
   railway variables set GROQ_API_KEY=gsk_...
   railway variables set PORT=3000
   railway variables set NODE_ENV=production

   # Deploy
   railway up
   ```

3. **Get Deployment URL**:
   ```
   https://your-app.railway.app
   ```

### Option 2: Render

1. **Create Render Account**:
   - Go to https://render.com
   - Sign up with GitHub

2. **Create Web Service**:
   - Click "New +" → "Web Service"
   - Connect GitHub repository
   - Select backend folder
   - Configure:
     - Name: ai-spam-call-backend
     - Environment: Node
     - Build Command: `npm install && npm run build`
     - Start Command: `npm start`

3. **Add Environment Variables**:
   ```
   SUPABASE_URL=https://...
   SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   GROQ_API_KEY=gsk_...
   PORT=3000
   NODE_ENV=production
   ```

4. **Deploy**:
   - Click "Create Web Service"
   - Wait for deployment
   - Get URL: `https://your-app.onrender.com`

### Option 3: Heroku

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
cd backend
heroku create ai-spam-call-backend

# Set environment variables
heroku config:set SUPABASE_URL=https://...
heroku config:set SUPABASE_ANON_KEY=eyJ...
heroku config:set SUPABASE_SERVICE_ROLE_KEY=eyJ...
heroku config:set GROQ_API_KEY=gsk_...
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

## 📱 Mobile App Deployment

### Step 1: Update Configuration

1. **Update mobile-app/.env**:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://[prod-ref].supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ... (production key)
   EXPO_PUBLIC_API_URL=https://your-backend.railway.app
   ```

2. **Update app.json**:
   ```json
   {
     "expo": {
       "name": "AI Spam Call Defender",
       "slug": "ai-spam-call-defender",
       "version": "1.0.0",
       "orientation": "portrait",
       "icon": "./assets/icon.png",
       "splash": {
         "image": "./assets/splash-icon.png",
         "resizeMode": "contain",
         "backgroundColor": "#007AFF"
       },
       "ios": {
         "bundleIdentifier": "com.yourcompany.spamdefender",
         "buildNumber": "1.0.0"
       },
       "android": {
         "package": "com.yourcompany.spamdefender",
         "versionCode": 1
       }
     }
   }
   ```

### Step 2: Build with EAS

1. **Install EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**:
   ```bash
   eas login
   ```

3. **Configure EAS**:
   ```bash
   cd mobile-app
   eas build:configure
   ```

4. **Build for iOS**:
   ```bash
   eas build --platform ios
   ```

5. **Build for Android**:
   ```bash
   eas build --platform android
   ```

### Step 3: Submit to App Stores

**iOS App Store**:
```bash
eas submit --platform ios
```

**Google Play Store**:
```bash
eas submit --platform android
```

## 🔒 Security Checklist

- [ ] Use environment variables for all secrets
- [ ] Enable RLS on all database tables
- [ ] Use HTTPS for all endpoints
- [ ] Rotate API keys regularly
- [ ] Enable CORS only for production domain
- [ ] Set up rate limiting
- [ ] Enable Supabase Auth email verification
- [ ] Use strong database password
- [ ] Keep service role key secret (server-only)
- [ ] Review and test RLS policies

## ⚡ Performance Optimization

### Backend

1. **Add Caching**:
   ```typescript
   // Add to backend
   import NodeCache from 'node-cache';
   const cache = new NodeCache({ stdTTL: 600 });
   ```

2. **Enable Compression**:
   ```typescript
   import compression from 'compression';
   app.use(compression());
   ```

3. **Add Rate Limiting**:
   ```typescript
   import rateLimit from 'express-rate-limit';

   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000,
     max: 100
   });

   app.use('/api/', limiter);
   ```

### Mobile App

1. **Optimize Images**:
   - Compress all images
   - Use appropriate sizes
   - Consider WebP format

2. **Enable Hermes** (app.json):
   ```json
   {
     "expo": {
       "android": {
         "enableHermes": true
       }
     }
   }
   ```

3. **Use Production Build**:
   ```bash
   eas build --platform all --profile production
   ```

## 📊 Monitoring

### Supabase Dashboard

Monitor:
- Database usage
- API requests
- Storage usage
- Auth users
- Real-time connections

### Backend Monitoring

1. **Add Logging**:
   ```typescript
   import morgan from 'morgan';
   app.use(morgan('combined'));
   ```

2. **Error Tracking** (Sentry):
   ```bash
   npm install @sentry/node
   ```

3. **Uptime Monitoring**:
   - Use UptimeRobot (free)
   - Monitor backend health endpoint
   - Set up alerts

## 🔄 CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: cd backend && npm install
      - run: cd backend && npm run build
      # Add deployment step for your platform

  deploy-mobile:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: cd mobile-app && npm install
      - run: npx eas-cli build --platform all --non-interactive
```

## 🧪 Production Testing

### Pre-Launch Checklist

- [ ] Test user signup/login
- [ ] Test call recording and transcription
- [ ] Test violation detection
- [ ] Test case creation
- [ ] Test real-time updates
- [ ] Test on multiple devices
- [ ] Test offline behavior
- [ ] Load test backend API
- [ ] Security audit
- [ ] Privacy policy in place
- [ ] Terms of service in place

### Test Accounts

Create test users:
```bash
# Production Supabase Dashboard
# Auth → Users → Invite User
test1@example.com
test2@example.com
```

## 📝 Environment Variables Summary

### Backend Production
```env
SUPABASE_URL=https://[prod].supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GROQ_API_KEY=gsk_...
PORT=3000
NODE_ENV=production
```

### Mobile App Production
```env
EXPO_PUBLIC_SUPABASE_URL=https://[prod].supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_API_URL=https://your-backend.railway.app
```

## 🚨 Rollback Plan

If deployment fails:

1. **Backend**:
   ```bash
   # Railway
   railway rollback

   # Heroku
   heroku rollback
   ```

2. **Mobile App**:
   - Revert to previous EAS build
   - Or update app.json version and rebuild

3. **Database**:
   - Keep backups via Supabase
   - Use point-in-time recovery if needed

## 📱 App Store Submission

### iOS Requirements
- App icon (1024x1024)
- Screenshots (various sizes)
- Privacy policy URL
- App description
- Keywords
- Category: Utilities
- Age rating: 4+

### Android Requirements
- Feature graphic (1024x500)
- Screenshots
- Privacy policy URL
- App description
- Category: Tools
- Content rating: Everyone

## 🎉 Launch Checklist

- [ ] Production database configured
- [ ] Backend deployed and tested
- [ ] Mobile app built for production
- [ ] Environment variables set
- [ ] SSL/TLS certificates active
- [ ] Monitoring set up
- [ ] Error tracking configured
- [ ] Documentation updated
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Support email set up
- [ ] App store listings ready
- [ ] Marketing materials prepared
- [ ] Soft launch to beta testers
- [ ] Collect feedback
- [ ] Fix critical issues
- [ ] Official launch! 🚀

## 📞 Support

After deployment:
- Monitor error logs daily
- Respond to user feedback
- Update regularly
- Track analytics
- Plan feature updates

---

**You're ready for production! 🎊**
