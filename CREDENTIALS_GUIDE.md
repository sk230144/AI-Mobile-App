# 🔑 API CREDENTIALS TRACKING GUIDE

**⚠️ IMPORTANT: Never commit this file to GitHub. Keep it safe locally!**

---

## STAGE 2: SUPABASE

### Where to Find:
After your Supabase project is created:
1. Go to: https://supabase.com/dashboard
2. Select your project: `ai-spam-call-app`
3. Go to: **Settings** (gear icon) → **API**

### Credentials to Copy:

#### 1. Project URL
- Label: **Project URL**
- Copy to: `SUPABASE_URL` in `backend/.env`
- Example: `https://abcdefghijklmnop.supabase.co`

#### 2. Anon Public Key
- Label: **Project API keys** → **anon** **public**
- Copy to: `SUPABASE_ANON_KEY` in `backend/.env`
- This is safe to use in frontend apps

#### 3. Service Role Key
- Label: **Project API keys** → **service_role** **secret**
- Copy to: `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env`
- ⚠️ Keep this SECRET - only use in backend

#### 4. Database Password
- You created this during project setup
- Save it somewhere safe
- You'll need it if you want to connect directly to PostgreSQL

---

## CHECKLIST

### Stage 2 - Supabase Setup
- [ ] Project created: `ai-spam-call-app`
- [ ] Database password saved securely
- [ ] SUPABASE_URL copied to `backend/.env`
- [ ] SUPABASE_ANON_KEY copied to `backend/.env`
- [ ] SUPABASE_SERVICE_ROLE_KEY copied to `backend/.env`
- [ ] Database tables created
- [ ] Row Level Security configured
- [ ] Storage bucket created

---

## 📝 MY CREDENTIALS

### Supabase Project Details
```
Project Name: ai-spam-call-app
Database Password: [PASTE HERE]
Region: [YOUR REGION]

SUPABASE_URL=[PASTE HERE]
SUPABASE_ANON_KEY=[PASTE HERE]
SUPABASE_SERVICE_ROLE_KEY=[PASTE HERE]
```

---

## 🔒 SECURITY REMINDERS

1. ✅ `.env` files are in `.gitignore` (won't be committed)
2. ✅ Never share your `service_role` key publicly
3. ✅ Only use `anon` key in frontend/mobile apps
4. ✅ Keep this file locally (don't upload to GitHub)
5. ✅ Backup these credentials somewhere safe

---

## Next Stage Credentials (Stage 4)

We'll add these later:
- Twilio (for phone calls)
- AWS Polly (for AI voice)
- Groq (for speech-to-text)
- Google Gemini (for AI conversations)
