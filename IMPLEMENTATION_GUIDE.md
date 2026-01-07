# 🚀 STEP-BY-STEP IMPLEMENTATION GUIDE
## AI Spam Call Answering App - From Zero to Launch

---

## 📋 TABLE OF CONTENTS
1. [Prerequisites](#prerequisites)
2. [Phase 1: Development Environment Setup](#phase-1-development-environment-setup)
3. [Phase 2: Backend Infrastructure](#phase-2-backend-infrastructure)
4. [Phase 3: AI Services Integration](#phase-3-ai-services-integration)
5. [Phase 4: Mobile App Development](#phase-4-mobile-app-development)
6. [Phase 5: Core Features Implementation](#phase-5-core-features-implementation)
7. [Phase 6: Testing & Deployment](#phase-6-testing--deployment)
8. [Phase 7: Launch Preparation](#phase-7-launch-preparation)

---

## ✅ PREREQUISITES

### Required Knowledge:
- [ ] Basic JavaScript/TypeScript
- [ ] React fundamentals
- [ ] Basic understanding of APIs
- [ ] Git & GitHub basics

### Required Accounts (All Free):
- [ ] GitHub account
- [ ] Supabase account
- [ ] Vercel account
- [ ] Twilio account (trial)
- [ ] AWS account (free tier)
- [ ] Google AI account (Gemini)
- [ ] Groq account

### Required Software:
- [ ] Node.js (v18 or higher) - https://nodejs.org/
- [ ] Git - https://git-scm.com/
- [ ] VS Code or any code editor
- [ ] Android Studio or Xcode (for mobile testing)

---

## 📱 PHASE 1: DEVELOPMENT ENVIRONMENT SETUP
**Estimated Time: 30-60 minutes**

### Step 1.1: Install Node.js and Git
```bash
# Check if Node.js is installed
node --version
npm --version

# Check if Git is installed
git --version
```

**What to do:**
- If not installed, download from https://nodejs.org/ (LTS version)
- Download Git from https://git-scm.com/

---

### Step 1.2: Create Project Directory
```bash
# Create main project folder
mkdir ai-spam-call-app
cd ai-spam-call-app

# Create project structure
mkdir mobile-app
mkdir backend
mkdir docs
```

**Expected Result:**
```
ai-spam-call-app/
├── mobile-app/    (React Native app)
├── backend/       (Node.js backend)
└── docs/          (Documentation)
```

---

### Step 1.3: Initialize Git Repository
```bash
# Initialize Git
git init

# Create .gitignore file
touch .gitignore
```

**Add to .gitignore:**
```
# Dependencies
node_modules/
.expo/
.expo-shared/

# Environment variables
.env
.env.local
.env.production

# Build files
dist/
build/
*.apk
*.ipa

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/

# Logs
*.log
npm-debug.log*
yarn-debug.log*
```

---

### Step 1.4: Create GitHub Repository
```bash
# Create initial commit
git add .
git commit -m "Initial commit"

# Go to https://github.com/new
# Create new repository named "ai-spam-call-app"
# Then link it:

git remote add origin https://github.com/YOUR_USERNAME/ai-spam-call-app.git
git branch -M main
git push -u origin main
```

**✓ Checkpoint:** Git repository created and pushed to GitHub

---

## 🗄️ PHASE 2: BACKEND INFRASTRUCTURE
**Estimated Time: 1-2 hours**

### Step 2.1: Set Up Supabase (Database + Auth + Storage)

**Go to: https://supabase.com/**

1. Sign up / Log in
2. Click "New Project"
3. Fill in details:
   - Name: `ai-spam-call-app`
   - Database Password: (save this securely!)
   - Region: Choose closest to you
4. Wait for project to be created (2-3 minutes)

**After creation, get your credentials:**
- Go to: Settings → API
- Copy and save:
  - `Project URL` → This is your `SUPABASE_URL`
  - `anon public` key → This is your `SUPABASE_ANON_KEY`
  - `service_role` key → This is your `SUPABASE_SERVICE_ROLE_KEY`

---

### Step 2.2: Create Database Schema

**Go to Supabase SQL Editor:**

```sql
-- Users table (already created by Supabase Auth)

-- Calls table
CREATE TABLE calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  caller_number VARCHAR(20) NOT NULL,
  caller_name VARCHAR(255),
  call_duration INTEGER, -- in seconds
  call_status VARCHAR(50), -- 'completed', 'missed', 'ongoing'
  recording_url TEXT,
  transcript TEXT,
  is_spam BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Violations table
CREATE TABLE violations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  call_id UUID REFERENCES calls(id) ON DELETE CASCADE,
  violation_type VARCHAR(100), -- 'TCPA', 'FDCPA', etc.
  violation_description TEXT,
  timestamp_in_call INTEGER, -- seconds into call
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Legal cases table
CREATE TABLE legal_cases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  case_status VARCHAR(50), -- 'pending', 'filed', 'settled', 'closed'
  estimated_payout DECIMAL(10,2),
  actual_payout DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Case calls (many-to-many relationship)
CREATE TABLE case_calls (
  case_id UUID REFERENCES legal_cases(id) ON DELETE CASCADE,
  call_id UUID REFERENCES calls(id) ON DELETE CASCADE,
  PRIMARY KEY (case_id, call_id)
);

-- User settings
CREATE TABLE user_settings (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  state VARCHAR(2), -- US state code
  phone_number VARCHAR(20),
  virtual_number VARCHAR(20), -- Twilio number assigned to user
  auto_answer_enabled BOOLEAN DEFAULT true,
  recording_consent_given BOOLEAN DEFAULT false,
  notification_preferences JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_calls_user_id ON calls(user_id);
CREATE INDEX idx_calls_created_at ON calls(created_at DESC);
CREATE INDEX idx_violations_call_id ON violations(call_id);
CREATE INDEX idx_legal_cases_user_id ON legal_cases(user_id);
```

**Run this SQL in Supabase SQL Editor**

**✓ Checkpoint:** Database schema created

---

### Step 2.3: Set Up Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policies for calls table
CREATE POLICY "Users can view their own calls"
  ON calls FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calls"
  ON calls FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calls"
  ON calls FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies for violations table
CREATE POLICY "Users can view violations for their calls"
  ON violations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM calls
      WHERE calls.id = violations.call_id
      AND calls.user_id = auth.uid()
    )
  );

-- Policies for legal_cases table
CREATE POLICY "Users can view their own cases"
  ON legal_cases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cases"
  ON legal_cases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies for user_settings table
CREATE POLICY "Users can view their own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**✓ Checkpoint:** Row Level Security configured

---

### Step 2.4: Configure Storage for Call Recordings

**In Supabase Dashboard:**
1. Go to: Storage
2. Click "Create a new bucket"
3. Name: `call-recordings`
4. Make it: Private
5. Click "Create bucket"

**Set up storage policies:**
```sql
-- Allow users to upload their own recordings
CREATE POLICY "Users can upload their own recordings"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'call-recordings' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to view their own recordings
CREATE POLICY "Users can view their own recordings"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'call-recordings' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

**✓ Checkpoint:** Storage configured for call recordings

---

### Step 2.5: Set Up Backend API (Vercel)

```bash
cd backend
npm init -y
npm install express cors dotenv @supabase/supabase-js twilio groq-sdk @google/generative-ai aws-sdk
npm install -D typescript @types/node @types/express @types/cors tsx

# Create TypeScript config
npx tsc --init
```

**Create `backend/package.json` scripts:**
```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

**Create folder structure:**
```bash
mkdir src
mkdir src/routes
mkdir src/services
mkdir src/utils
mkdir src/types
```

**✓ Checkpoint:** Backend project initialized

---

### Step 2.6: Create Environment Variables

**Create `backend/.env`:**
```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Twilio (will fill in Phase 3)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# AWS Polly (will fill in Phase 3)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1

# Groq (will fill in Phase 3)
GROQ_API_KEY=

# Google Gemini (will fill in Phase 3)
GOOGLE_AI_API_KEY=

# Server
PORT=3000
NODE_ENV=development
```

**✓ Checkpoint:** Environment variables file created

---

### Step 2.7: Create Basic Express Server

**Create `backend/src/index.ts`:**
```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes (will add more later)
app.use('/api/calls', (req, res) => {
  res.json({ message: 'Calls API endpoint' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
```

**Test the server:**
```bash
cd backend
npm run dev
```

**Visit: http://localhost:3000/health**

**✓ Checkpoint:** Backend server running successfully

---

## 🤖 PHASE 3: AI SERVICES INTEGRATION
**Estimated Time: 2-3 hours**

### Step 3.1: Set Up Twilio Account

**Go to: https://www.twilio.com/try-twilio**

1. Sign up for free trial ($15 credit)
2. Verify your phone number
3. Complete the setup wizard

**Get your credentials:**
- Go to: Console Dashboard
- Copy and save:
  - `Account SID` → Add to `.env` as `TWILIO_ACCOUNT_SID`
  - `Auth Token` → Add to `.env` as `TWILIO_AUTH_TOKEN`

**Buy a phone number:**
1. Go to: Phone Numbers → Manage → Buy a number
2. Choose a number with Voice capability
3. Buy it (uses ~$1 from your trial credit)
4. Copy the number → Add to `.env` as `TWILIO_PHONE_NUMBER`

**✓ Checkpoint:** Twilio account set up with phone number

---

### Step 3.2: Set Up AWS Account for Polly (TTS)

**Go to: https://aws.amazon.com/**

1. Sign up for AWS Free Tier
2. Complete verification (requires credit card, but won't charge for free tier)

**Create IAM User for API access:**
1. Go to: IAM Console
2. Users → Add users
3. Name: `polly-tts-user`
4. Access type: Programmatic access
5. Permissions: Attach `AmazonPollyFullAccess` policy
6. Create user
7. Save credentials:
   - `Access Key ID` → Add to `.env` as `AWS_ACCESS_KEY_ID`
   - `Secret Access Key` → Add to `.env` as `AWS_SECRET_ACCESS_KEY`

**✓ Checkpoint:** AWS Polly configured

---

### Step 3.3: Set Up Groq for Speech-to-Text

**Go to: https://groq.com/**

1. Sign up / Log in
2. Go to: Console → API Keys
3. Create new API key
4. Copy key → Add to `.env` as `GROQ_API_KEY`

**✓ Checkpoint:** Groq API key obtained

---

### Step 3.4: Set Up Google Gemini for LLM

**Go to: https://ai.google.dev/**

1. Click "Get API key in Google AI Studio"
2. Sign in with Google account
3. Click "Create API Key"
4. Copy key → Add to `.env` as `GOOGLE_AI_API_KEY`

**✓ Checkpoint:** Google Gemini API key obtained

---

### Step 3.5: Create AI Service Modules

**Create `backend/src/services/tts.service.ts` (Text-to-Speech):**
```typescript
import { PollyClient, SynthesizeSpeechCommand } from '@aws-sdk/client-polly';
import { Readable } from 'stream';

const pollyClient = new PollyClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function textToSpeech(text: string): Promise<Buffer> {
  const command = new SynthesizeSpeechCommand({
    Text: text,
    OutputFormat: 'mp3',
    VoiceId: 'Joanna', // Natural US English voice
    Engine: 'neural',
  });

  const response = await pollyClient.send(command);

  if (response.AudioStream instanceof Readable) {
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.AudioStream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  throw new Error('Failed to generate speech');
}
```

**Create `backend/src/services/stt.service.ts` (Speech-to-Text):**
```typescript
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function speechToText(audioBuffer: Buffer): Promise<string> {
  const transcription = await groq.audio.transcriptions.create({
    file: new File([audioBuffer], 'audio.wav', { type: 'audio/wav' }),
    model: 'whisper-large-v3',
    language: 'en',
  });

  return transcription.text;
}
```

**Create `backend/src/services/ai.service.ts` (AI Conversation):**
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export async function generateAIResponse(
  conversationHistory: string,
  callerMessage: string
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are an AI assistant answering a spam/debt collection call.
Your goal is to:
1. Keep the caller talking to gather evidence
2. Ask questions to identify the company and purpose
3. Be polite but ask for detailed information
4. Never give personal information

Conversation so far:
${conversationHistory}

Caller said: "${callerMessage}"

Respond naturally and conversationally (keep it under 30 words):`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}
```

**✓ Checkpoint:** AI service modules created

---

### Step 3.6: Create Call Handling Routes

**Create `backend/src/routes/calls.routes.ts`:**
```typescript
import express from 'express';
import twilio from 'twilio';
import { textToSpeech } from '../services/tts.service';
import { speechToText } from '../services/stt.service';
import { generateAIResponse } from '../services/ai.service';

const router = express.Router();
const VoiceResponse = twilio.twiml.VoiceResponse;

// Webhook for incoming calls
router.post('/incoming', async (req, res) => {
  const twiml = new VoiceResponse();

  twiml.say('Hello, this is an AI assistant. How can I help you?');

  // Gather caller's speech
  twiml.gather({
    input: ['speech'],
    action: '/api/calls/process-speech',
    method: 'POST',
    speechTimeout: 'auto',
  });

  res.type('text/xml');
  res.send(twiml.toString());
});

// Process caller's speech
router.post('/process-speech', async (req, res) => {
  const callerSpeech = req.body.SpeechResult;
  const callSid = req.body.CallSid;

  console.log('Caller said:', callerSpeech);

  // Generate AI response
  const aiResponse = await generateAIResponse('', callerSpeech);

  const twiml = new VoiceResponse();
  twiml.say(aiResponse);

  // Continue gathering speech
  twiml.gather({
    input: ['speech'],
    action: '/api/calls/process-speech',
    method: 'POST',
    speechTimeout: 'auto',
  });

  res.type('text/xml');
  res.send(twiml.toString());
});

// Get call history
router.get('/history', async (req, res) => {
  // TODO: Fetch from Supabase
  res.json({ calls: [] });
});

export default router;
```

**Update `backend/src/index.ts`:**
```typescript
import callRoutes from './routes/calls.routes';

// ... existing code ...

app.use('/api/calls', callRoutes);
```

**✓ Checkpoint:** Call handling routes created

---

### Step 3.7: Configure Twilio Webhook

1. Go to Twilio Console → Phone Numbers → Manage → Active Numbers
2. Click on your phone number
3. Scroll to "Voice Configuration"
4. Set "A CALL COMES IN" to:
   - Webhook
   - URL: `https://your-backend-url.vercel.app/api/calls/incoming` (we'll deploy in Phase 6)
   - HTTP POST
5. Save

**Note:** For local testing, use ngrok:
```bash
# Install ngrok
npm install -g ngrok

# Run ngrok
ngrok http 3000

# Use the ngrok URL in Twilio webhook
# Example: https://abc123.ngrok.io/api/calls/incoming
```

**✓ Checkpoint:** Twilio webhook configured

---

## 📱 PHASE 4: MOBILE APP DEVELOPMENT
**Estimated Time: 2-3 hours**

### Step 4.1: Initialize React Native App with Expo

```bash
cd ..
npx create-expo-app mobile-app --template blank-typescript
cd mobile-app
```

**✓ Checkpoint:** React Native app initialized

---

### Step 4.2: Install Required Dependencies

```bash
# Core dependencies
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npm install @supabase/supabase-js
npm install @tanstack/react-query
npm install zustand
npm install expo-router

# UI components
npm install react-native-paper
npm install react-native-safe-area-context
npm install react-native-screens

# Audio player
npm install expo-av

# Additional utilities
npm install axios
npm install date-fns
npm install react-native-toast-message
```

**✓ Checkpoint:** Dependencies installed

---

### Step 4.3: Configure Supabase Client

**Create `mobile-app/src/lib/supabase.ts`:**
```typescript
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

**Create `mobile-app/.env`:**
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_API_URL=http://localhost:3000
```

**✓ Checkpoint:** Supabase client configured

---

### Step 4.4: Create App Structure

```bash
mkdir -p src/screens
mkdir -p src/components
mkdir -p src/navigation
mkdir -p src/store
mkdir -p src/types
mkdir -p src/utils
mkdir -p src/hooks
```

**✓ Checkpoint:** Folder structure created

---

### Step 4.5: Create Authentication Store

**Create `mobile-app/src/store/authStore.ts`:**
```typescript
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    set({ user: session?.user ?? null, loading: false });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null });
    });
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    set({ user: data.user });
  },

  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;
    set({ user: data.user });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },
}));
```

**✓ Checkpoint:** Auth store created

---

### Step 4.6: Create Login Screen

**Create `mobile-app/src/screens/LoginScreen.tsx`:**
```typescript
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useAuthStore } from '../store/authStore';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const { signIn, signUp } = useAuthStore();

  const handleAuth = async () => {
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        AI Spam Call Protector
      </Text>

      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <Button
        mode="contained"
        onPress={handleAuth}
        loading={loading}
        style={styles.button}
      >
        {isSignUp ? 'Sign Up' : 'Sign In'}
      </Button>

      <Button onPress={() => setIsSignUp(!isSignUp)}>
        {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 40,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
    marginBottom: 8,
  },
});
```

**✓ Checkpoint:** Login screen created

---

### Step 4.7: Create Dashboard Screen

**Create `mobile-app/src/screens/DashboardScreen.tsx`:**
```typescript
import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, Button, FAB } from 'react-native-paper';
import { useAuthStore } from '../store/authStore';

export default function DashboardScreen() {
  const { user, signOut } = useAuthStore();

  const recentCalls = [
    { id: '1', caller: '(555) 123-4567', duration: '3:24', date: '2024-01-07', isSpam: true },
    { id: '2', caller: '(555) 987-6543', duration: '2:15', date: '2024-01-06', isSpam: true },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall">Welcome back!</Text>
        <Text variant="bodyMedium">{user?.email}</Text>
      </View>

      <Card style={styles.statsCard}>
        <Card.Content>
          <Text variant="titleLarge">Call Statistics</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text variant="headlineMedium">12</Text>
              <Text variant="bodySmall">Total Calls</Text>
            </View>
            <View style={styles.stat}>
              <Text variant="headlineMedium">8</Text>
              <Text variant="bodySmall">Spam Blocked</Text>
            </View>
            <View style={styles.stat}>
              <Text variant="headlineMedium">$450</Text>
              <Text variant="bodySmall">Potential Value</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Text variant="titleMedium" style={styles.sectionTitle}>
        Recent Calls
      </Text>

      <FlatList
        data={recentCalls}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.callCard}>
            <Card.Content>
              <Text variant="titleMedium">{item.caller}</Text>
              <Text variant="bodySmall">
                {item.date} • {item.duration}
              </Text>
              {item.isSpam && (
                <Text style={styles.spamBadge}>SPAM DETECTED</Text>
              )}
            </Card.Content>
          </Card>
        )}
      />

      <Button onPress={signOut} style={styles.signOutButton}>
        Sign Out
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  statsCard: {
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  stat: {
    alignItems: 'center',
  },
  sectionTitle: {
    marginBottom: 12,
  },
  callCard: {
    marginBottom: 8,
  },
  spamBadge: {
    color: 'red',
    fontWeight: 'bold',
    marginTop: 4,
  },
  signOutButton: {
    marginTop: 16,
  },
});
```

**✓ Checkpoint:** Dashboard screen created

---

### Step 4.8: Create Navigation

**Create `mobile-app/src/navigation/AppNavigator.tsx`:**
```typescript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuthStore } from '../store/authStore';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { user, loading } = useAuthStore();

  if (loading) {
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
        ) : (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

**✓ Checkpoint:** Navigation configured

---

### Step 4.9: Update App Entry Point

**Update `mobile-app/App.tsx`:**
```typescript
import React, { useEffect } from 'react';
import { PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './src/store/authStore';
import AppNavigator from './src/navigation/AppNavigator';

const queryClient = new QueryClient();

export default function App() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider>
        <AppNavigator />
      </PaperProvider>
    </QueryClientProvider>
  );
}
```

**✓ Checkpoint:** App entry point configured

---

### Step 4.10: Run the Mobile App

```bash
# Start Expo
npm start

# Then press:
# - 'a' for Android emulator
# - 'i' for iOS simulator
# - Scan QR code with Expo Go app for physical device
```

**✓ Checkpoint:** Mobile app running successfully

---

## 🎯 PHASE 5: CORE FEATURES IMPLEMENTATION
**Estimated Time: 4-6 hours**

### Step 5.1: Create Call History Feature

**Create `mobile-app/src/hooks/useCalls.ts`:**
```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useCalls() {
  return useQuery({
    queryKey: ['calls'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calls')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}
```

**Create `mobile-app/src/screens/CallHistoryScreen.tsx`:**
```typescript
import React from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { Text, Card, ActivityIndicator } from 'react-native-paper';
import { useCalls } from '../hooks/useCalls';
import { format } from 'date-fns';

export default function CallHistoryScreen() {
  const { data: calls, isLoading } = useCalls();

  if (isLoading) {
    return <ActivityIndicator style={styles.loading} />;
  }

  return (
    <FlatList
      data={calls}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">{item.caller_number}</Text>
            <Text variant="bodySmall">
              {format(new Date(item.created_at), 'MMM d, yyyy • h:mm a')}
            </Text>
            <Text variant="bodySmall">
              Duration: {Math.floor(item.call_duration / 60)}:{(item.call_duration % 60).toString().padStart(2, '0')}
            </Text>
            {item.is_spam && (
              <Text style={styles.spamLabel}>⚠️ SPAM</Text>
            )}
          </Card.Content>
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 12,
  },
  spamLabel: {
    color: 'red',
    fontWeight: 'bold',
    marginTop: 8,
  },
});
```

**✓ Checkpoint:** Call history feature implemented

---

### Step 5.2: Create Call Detail Screen

**Create `mobile-app/src/screens/CallDetailScreen.tsx`:**
```typescript
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Chip, Button } from 'react-native-paper';
import { useRoute } from '@react-navigation/native';

export default function CallDetailScreen() {
  const route = useRoute();
  const call = route.params?.call;

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall">Call Information</Text>
          <Text variant="bodyLarge" style={styles.spacing}>
            From: {call.caller_number}
          </Text>
          <Text variant="bodyMedium">
            Duration: {Math.floor(call.call_duration / 60)}:{(call.call_duration % 60).toString().padStart(2, '0')}
          </Text>
          {call.is_spam && (
            <Chip icon="alert" style={styles.chip}>Spam Detected</Chip>
          )}
        </Card.Content>
      </Card>

      {call.transcript && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">Transcript</Text>
            <Text variant="bodyMedium" style={styles.spacing}>
              {call.transcript}
            </Text>
          </Card.Content>
        </Card>
      )}

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium">Violations Detected</Text>
          <Chip icon="gavel" style={styles.chip}>TCPA Violation</Chip>
          <Text variant="bodySmall" style={styles.spacing}>
            Called after 9 PM without consent
          </Text>
        </Card.Content>
      </Card>

      <Button mode="contained" style={styles.button}>
        Export Evidence
      </Button>
      <Button mode="outlined" style={styles.button}>
        Report to Authorities
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  spacing: {
    marginTop: 12,
  },
  chip: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  button: {
    marginBottom: 12,
  },
});
```

**✓ Checkpoint:** Call detail screen implemented

---

### Step 5.3: Add Real-time Call Updates

**Create `mobile-app/src/hooks/useRealtimeCalls.ts`:**
```typescript
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useRealtimeCalls() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('calls-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calls',
        },
        (payload) => {
          console.log('Call update:', payload);
          queryClient.invalidateQueries({ queryKey: ['calls'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
```

**Add to Dashboard:**
```typescript
import { useRealtimeCalls } from '../hooks/useRealtimeCalls';

export default function DashboardScreen() {
  useRealtimeCalls(); // Add this line

  // ... rest of component
}
```

**✓ Checkpoint:** Real-time updates implemented

---

### Step 5.4: Implement Violation Detection (Backend)

**Create `backend/src/services/violation.service.ts`:**
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

interface Violation {
  type: string;
  description: string;
  timestamp: number;
  confidence: number;
}

export async function detectViolations(
  transcript: string
): Promise<Violation[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `Analyze this call transcript for TCPA and FDCPA violations.

TCPA violations include:
- Calling before 8 AM or after 9 PM
- Using automated dialing systems without consent
- Calling numbers on Do Not Call registry
- Not identifying themselves

FDCPA violations include:
- Threatening arrest or legal action
- Harassing or abusive language
- Calling at unusual times
- Misrepresenting debt amount

Transcript:
${transcript}

Return a JSON array of violations found. Each violation should have:
- type: "TCPA" or "FDCPA"
- description: Brief description
- confidence: 0-1 score

Example: [{"type": "TCPA", "description": "Called after 9 PM", "confidence": 0.95}]`;

  const result = await model.generateContent(prompt);
  const response = await result.response.text();

  try {
    // Extract JSON from response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('Failed to parse violations:', error);
  }

  return [];
}
```

**✓ Checkpoint:** Violation detection implemented

---

### Step 5.5: Create Settings Screen

**Create `mobile-app/src/screens/SettingsScreen.tsx`:**
```typescript
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Switch, TextInput, Button } from 'react-native-paper';

export default function SettingsScreen() {
  const [autoAnswer, setAutoAnswer] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState('');

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        Settings
      </Text>

      <View style={styles.setting}>
        <Text variant="bodyLarge">Auto-answer spam calls</Text>
        <Switch value={autoAnswer} onValueChange={setAutoAnswer} />
      </View>

      <View style={styles.setting}>
        <Text variant="bodyLarge">Push notifications</Text>
        <Switch value={notifications} onValueChange={setNotifications} />
      </View>

      <Text variant="titleMedium" style={styles.sectionTitle}>
        Your Virtual Number
      </Text>
      <Text variant="bodySmall" style={styles.description}>
        Forward spam calls to this number for AI protection
      </Text>
      <TextInput
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        placeholder="(555) 123-4567"
        style={styles.input}
        editable={false}
      />

      <Button mode="contained" style={styles.button}>
        Save Settings
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 24,
  },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 8,
  },
  description: {
    marginBottom: 12,
    color: '#666',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
  },
});
```

**✓ Checkpoint:** Settings screen created

---

## 🧪 PHASE 6: TESTING & DEPLOYMENT
**Estimated Time: 2-3 hours**

### Step 6.1: Deploy Backend to Vercel

```bash
cd backend

# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? ai-spam-call-backend
# - Directory? ./
# - Override settings? No

# Deploy to production
vercel --prod
```

**Add environment variables in Vercel:**
1. Go to Vercel Dashboard
2. Select your project
3. Settings → Environment Variables
4. Add all variables from `.env`

**✓ Checkpoint:** Backend deployed to Vercel

---

### Step 6.2: Update Twilio Webhook with Production URL

1. Go to Twilio Console → Phone Numbers
2. Click your phone number
3. Update webhook URL to production: `https://your-app.vercel.app/api/calls/incoming`
4. Save

**✓ Checkpoint:** Twilio webhook updated

---

### Step 6.3: Test End-to-End Call Flow

1. Call your Twilio number from your phone
2. AI should answer
3. Speak to the AI
4. Check backend logs in Vercel
5. Verify call appears in Supabase database

**✓ Checkpoint:** End-to-end test successful

---

### Step 6.4: Build Mobile App for Testing

```bash
cd mobile-app

# For Android
eas build --platform android --profile preview

# For iOS (requires Apple Developer account)
eas build --platform ios --profile preview
```

**✓ Checkpoint:** Mobile app built

---

## 🚀 PHASE 7: LAUNCH PREPARATION
**Estimated Time: 2-4 hours**

### Step 7.1: Create Onboarding Flow

**Create `mobile-app/src/screens/OnboardingScreen.tsx`:**
```typescript
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';

export default function OnboardingScreen({ navigation }) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: 'AI-Powered Protection',
      description: 'Our AI automatically answers spam calls and gathers evidence',
    },
    {
      title: 'Detect Violations',
      description: 'We identify TCPA and FDCPA violations in real-time',
    },
    {
      title: 'Take Legal Action',
      description: 'Get compensation for illegal calls - up to $1,500 per violation',
    },
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      navigation.navigate('Login');
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineLarge">{steps[step].title}</Text>
      <Text variant="bodyLarge" style={styles.description}>
        {steps[step].description}
      </Text>
      <Button mode="contained" onPress={handleNext}>
        {step < steps.length - 1 ? 'Next' : 'Get Started'}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  description: {
    marginVertical: 24,
    textAlign: 'center',
  },
});
```

**✓ Checkpoint:** Onboarding flow created

---

### Step 7.2: Add Analytics

```bash
cd mobile-app
npm install posthog-react-native
```

**Initialize PostHog:**
```typescript
import PostHog from 'posthog-react-native';

const posthog = new PostHog(
  'your-posthog-api-key',
  { host: 'https://app.posthog.com' }
);

// Track events
posthog.capture('call_received', { caller: '555-1234' });
```

**✓ Checkpoint:** Analytics added

---

### Step 7.3: Add Error Tracking with Sentry

```bash
npm install @sentry/react-native
npx @sentry/wizard -i reactNative
```

**✓ Checkpoint:** Error tracking added

---

### Step 7.4: Create Privacy Policy & Terms of Service

Create documents covering:
- Call recording consent
- Data storage and usage
- User rights
- Liability limitations
- State-specific disclosures

**✓ Checkpoint:** Legal documents created

---

### Step 7.5: Final Testing Checklist

- [ ] Sign up flow works
- [ ] Login works
- [ ] Calls are received and processed
- [ ] Transcription works
- [ ] AI responses are appropriate
- [ ] Call history displays correctly
- [ ] Real-time updates work
- [ ] Violation detection works
- [ ] Settings save correctly
- [ ] Logout works
- [ ] Error handling works
- [ ] Loading states display
- [ ] Notifications work

**✓ Checkpoint:** All tests passing

---

### Step 7.6: Launch!

1. Submit app to App Store / Play Store
2. Set up monitoring dashboards
3. Prepare customer support
4. Launch marketing campaign
5. Monitor for issues

**✓ Checkpoint:** APP LAUNCHED! 🎉

---

## 📊 POST-LAUNCH MONITORING

### Metrics to Track:
- Active users
- Calls processed
- API costs
- Error rates
- User retention
- Violation detection accuracy

### Regular Maintenance:
- Monitor free tier usage
- Review AI response quality
- Update violation detection rules
- Respond to user feedback
- Fix bugs promptly

---

## 🎯 NEXT STEPS AFTER MVP

1. **Enhanced Features:**
   - Automatic legal document generation
   - Settlement tracking
   - Lawyer marketplace
   - Multi-language support

2. **Monetization:**
   - Launch premium tier ($9.99/month)
   - Success fee from legal cases (30%)
   - Enterprise partnerships

3. **Scale:**
   - Move to paid tiers as usage grows
   - Optimize AI costs
   - Add more states
   - Partner with law firms

---

## 🆘 TROUBLESHOOTING

### Common Issues:

**Backend not receiving calls:**
- Check Twilio webhook URL
- Verify webhook is set to POST
- Check backend logs in Vercel
- Test with ngrok for local debugging

**AI not responding:**
- Verify API keys in environment variables
- Check API rate limits
- Review logs for errors
- Test each service individually

**Mobile app won't connect:**
- Verify Supabase URL and keys
- Check network permissions
- Clear app cache
- Reinstall dependencies

**Database queries failing:**
- Check Row Level Security policies
- Verify user is authenticated
- Review Supabase logs
- Test queries in SQL editor

---

## 📚 ADDITIONAL RESOURCES

- Twilio Docs: https://www.twilio.com/docs
- Supabase Docs: https://supabase.com/docs
- React Native Docs: https://reactnative.dev/docs
- Expo Docs: https://docs.expo.dev/
- Google Gemini Docs: https://ai.google.dev/docs

---

## ✅ SUCCESS CRITERIA

You've successfully built the app when:
- ✅ Users can sign up and log in
- ✅ Twilio forwards calls to your backend
- ✅ AI answers calls and has conversations
- ✅ Calls are transcribed and stored
- ✅ Users can view call history in mobile app
- ✅ Violations are detected and displayed
- ✅ Real-time updates work
- ✅ App is deployed and accessible

**CONGRATULATIONS! You've built a production-ready AI spam call protection app! 🎉**
