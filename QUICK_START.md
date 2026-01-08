# Quick Start Guide

Get your AI Spam Call Defender up and running in 15 minutes!

## ⚡ Prerequisites

- Node.js v22+ installed
- npm v10+ installed
- Git installed
- Smartphone with Expo Go app
- Supabase account (free): https://supabase.com

## 🚀 Setup (5 Commands)

### 1. Clone & Navigate
```bash
cd "AI App"
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create `backend/.env`:
```env
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GROQ_API_KEY=your-groq-api-key
PORT=3000
NODE_ENV=development
```

### 3. Mobile App Setup
```bash
cd ../mobile-app
npm install
```

Create `mobile-app/.env`:
```env
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_API_URL=http://localhost:3000
```

### 4. Database Setup

Go to Supabase SQL Editor and run:
1. `backend/database-schema.sql`
2. `backend/database-rls.sql`
3. `backend/storage-policies.sql`

### 5. Start Everything
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Mobile App
cd mobile-app
npm start
```

## 📱 Use the App

1. **Open Expo Go** on your phone
2. **Scan QR code** from terminal
3. **Sign up** with email/password
4. **Verify email** (check spam folder)
5. **Login** to the app

## 🎯 Add Test Data

```bash
# Terminal 3
cd backend
npm run seed
```

This adds:
- 6 realistic spam calls
- 11 violations (TCPA, FDCPA, FTC)
- Complete transcripts

## ✅ Test Features

1. **Home Screen**: See 6 calls, 11 violations
2. **Call History**: View all spam calls
3. **Call Details**: See violations with confidence scores
4. **Legal Cases**:
   - Tap "⚖️ Legal Cases"
   - Tap "+ New"
   - Select 2-3 calls
   - Enter title
   - Create case
   - View details!

## 🔑 Get API Keys

### Supabase (FREE)
1. Go to https://supabase.com
2. Create project
3. Dashboard → Settings → API
4. Copy: URL, anon key, service_role key

### Groq (FREE - UNLIMITED)
1. Go to https://console.groq.com
2. Sign up
3. API Keys → Create API Key
4. Copy key (gsk_...)

## 📝 Common Issues

**"Module not found"**
```bash
cd mobile-app
npm install
```

**"Port already in use"**
```bash
# Change PORT in backend/.env to 3001
# Change EXPO_PUBLIC_API_URL in mobile-app/.env to http://localhost:3001
```

**"Cannot connect to backend"**
- Make sure backend is running (`npm run dev`)
- Check backend/.env has correct values
- Verify PORT matches in both .env files

**"Expo won't start"**
```bash
# Kill port 8082
npx kill-port 8082
npm start
```

## 🎉 You're Done!

The app is now running with:
- ✅ Backend API on http://localhost:3000
- ✅ Mobile app on your phone
- ✅ Database connected
- ✅ Test data loaded

## 📚 Next Steps

- Read [PROJECT_README.md](PROJECT_README.md) for full documentation
- Check [ROADMAP.md](ROADMAP.md) for features
- Review [DEPLOYMENT.md](DEPLOYMENT.md) for production

## 💡 Pro Tips

1. **Keep backend running** while using mobile app
2. **Pull to refresh** to update data
3. **Create cases** to group spam calls
4. **Update status** by tapping status badges
5. **Check Supabase dashboard** to see database changes

## 🆘 Need Help?

- Check stage completion docs (STAGE_*_COMPLETE.md)
- Review implementation guide (IMPLEMENTATION_GUIDE.md)
- Check database setup in Supabase dashboard
- Verify .env files have correct values

---

**Total Setup Time: 10-15 minutes** ⏱️

**Ready to fight spam calls! 🎯**
