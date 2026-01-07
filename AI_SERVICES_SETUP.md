# 🤖 AI SERVICES SETUP GUIDE

Complete these setups in order. Each service provides FREE tier perfect for demo!

---

## 1️⃣ GOOGLE GEMINI (AI Conversations) - FREE & EASIEST!

### Why First?
- Fastest to set up (2 minutes)
- Completely FREE with generous limits
- No credit card required

### Steps:

1. **Go to**: https://ai.google.dev/
2. Click **"Get API key in Google AI Studio"**
3. Sign in with your Google account
4. Click **"Create API Key"**
5. Copy the API key (starts with `AIza...`)

### Paste it here:
```
GOOGLE_AI_API_KEY=AIza...
```

**Free Tier:**
- 15 requests/minute
- 1,500 requests/day
- **= 45,000 calls/month FREE!** ✅

---

## 2️⃣ GROQ (Speech-to-Text) - UNLIMITED FREE!

### Why Second?
- Completely FREE unlimited transcription
- Super fast Whisper API
- No credit card required

### Steps:

1. **Go to**: https://console.groq.com/
2. Click **"Sign Up"** or **"Login"**
3. Sign in with Google/GitHub
4. Go to: **API Keys** (left sidebar)
5. Click **"Create API Key"**
6. Give it a name: "ai-spam-call-app"
7. Copy the key (starts with `gsk_...`)

### Paste it here:
```
GROQ_API_KEY=gsk_...
```

**Free Tier:**
- **UNLIMITED** transcription ✅
- Fastest Whisper implementation
- Real-time capable

---

## 3️⃣ TWILIO (Phone Calls) - $15 Trial Credit

### Why Third?
- Need phone number for testing
- $15 credit = 150-250 test calls
- Requires phone verification

### Steps:

1. **Go to**: https://www.twilio.com/try-twilio
2. Click **"Sign up"**
3. Fill in:
   - Email
   - Password
   - Phone number (for verification)
4. Verify your phone number (SMS code)
5. Answer the questions:
   - Which product? **Voice**
   - What are you building? **AI voice assistant**
   - Language: **Node.js**
6. Skip tutorial (click "Skip to dashboard")

### Get Your Credentials:

**Account SID & Auth Token:**
1. On dashboard, you'll see:
   - **Account SID**: Starts with `AC...`
   - **Auth Token**: Click "Show" to reveal
2. Copy both

**Get a Phone Number:**
1. Click **"Get a Twilio phone number"** (big button on dashboard)
2. Or go to: Phone Numbers → Manage → Buy a number
3. Choose any number with **Voice** capability
4. Click **"Choose this number"**
5. Cost: ~$1 from your trial credit
6. Copy the number (format: +1234567890)

### Paste them here:
```
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1234567890
```

**Free Trial:**
- $15 credit (enough for 150-250 calls)
- Fully functional for testing

---

## 4️⃣ AWS POLLY (Text-to-Speech) - 5M Chars/Month Free

### Why Last?
- Requires AWS account setup
- Credit card required (but won't charge for free tier)
- Most setup steps

### Steps:

**Part A: Create AWS Account**

1. **Go to**: https://aws.amazon.com/
2. Click **"Create an AWS Account"**
3. Fill in:
   - Email
   - AWS account name: "AI-Spam-Call-Demo"
   - Password
4. Choose: **Personal** account
5. Fill in contact information
6. **Payment**: Enter credit card (required, but free tier won't charge)
7. Verify identity (phone call or SMS)
8. Choose: **Free** support plan
9. Wait for account activation (can take 5-10 minutes)

**Part B: Create IAM User (for API access)**

1. **Go to**: https://console.aws.amazon.com/iam/
2. Sign in to your AWS account
3. Click **"Users"** (left sidebar)
4. Click **"Create user"**
5. User name: `polly-tts-user`
6. Click **"Next"**
7. Permissions: Click **"Attach policies directly"**
8. Search for: `AmazonPollyFullAccess`
9. Check the box next to it
10. Click **"Next"** → **"Create user"**

**Part C: Generate Access Keys**

1. Click on the user you just created: `polly-tts-user`
2. Go to: **Security credentials** tab
3. Scroll to: **Access keys**
4. Click **"Create access key"**
5. Use case: Choose **"Local code"**
6. Check: "I understand..."
7. Click **"Next"** → **"Create access key"**
8. **IMPORTANT**: Copy both:
   - **Access key ID** (starts with `AKIA...`)
   - **Secret access key** (only shown once!)
9. Click **"Download .csv file"** (backup)
10. Click **"Done"**

### Paste them here:
```
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
```

**Free Tier:**
- 5 million characters/month (first 12 months)
- ~800 minutes of speech/month
- Neural voices included ✅

---

## ✅ VERIFICATION CHECKLIST

Mark each as you complete:

- [ ] Google Gemini API key obtained
- [ ] Groq API key obtained
- [ ] Twilio account created
- [ ] Twilio phone number purchased
- [ ] Twilio credentials copied (SID, Token, Number)
- [ ] AWS account created
- [ ] AWS IAM user created
- [ ] AWS access keys generated
- [ ] All credentials pasted above

---

## 📝 QUICK START ORDER

**If you want to test quickly, do in this order:**

1. **Gemini** (2 min) ← Start here!
2. **Groq** (2 min) ← Second!
3. **Twilio** (10 min) ← Third
4. **AWS** (20 min) ← Can skip for now if you want

**You can test the app with just Gemini + Groq + Twilio!**
AWS Polly can be added later.

---

## 🆘 TROUBLESHOOTING

**Twilio trial limitations:**
- Can only call/SMS verified numbers during trial
- Solution: Verify your personal number first

**AWS taking long to activate:**
- Can take up to 24 hours (usually 10 minutes)
- You'll get email when ready
- Can proceed without AWS for now

**Can't find AWS IAM:**
- Search "IAM" in AWS console search bar
- Or use direct link above

---

## 📞 AFTER SETUP

Once you have all credentials, paste them in this chat and I'll:
1. Add them to your `.env` file
2. Install the required npm packages
3. Create the AI service integration code
4. Test the full call flow!

**Let me know when you're ready with the credentials!** 🚀
