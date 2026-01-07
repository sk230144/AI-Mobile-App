# 🗄️ DATABASE SETUP GUIDE

Follow these steps to set up your Supabase database tables and security.

---

## Step 1: Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard/project/xhywujwsdiqqigmgdoaj/sql
2. You'll see the SQL Editor interface

---

## Step 2: Run Database Schema Script

1. Click **"New Query"** (or the `+` button)
2. Open the file: `backend/database-schema.sql` in VS Code
3. **Copy ALL the content** from that file
4. **Paste it** into the Supabase SQL Editor
5. Click **"Run"** (or press Ctrl+Enter)

### ✅ Expected Result:
You should see a success message:
```
Database schema created successfully!
Tables created: calls, violations, legal_cases, case_calls, user_settings
```

### 📋 What This Creates:
- ✅ **calls** table - stores all phone call records
- ✅ **violations** table - stores detected legal violations
- ✅ **legal_cases** table - stores legal cases users create
- ✅ **case_calls** table - links calls to cases
- ✅ **user_settings** table - stores user preferences
- ✅ Indexes for fast queries
- ✅ Auto-update timestamps

---

## Step 3: Run Row Level Security Script

1. Click **"New Query"** again (create a fresh query)
2. Open the file: `backend/database-rls.sql` in VS Code
3. **Copy ALL the content** from that file
4. **Paste it** into the Supabase SQL Editor
5. Click **"Run"** (or press Ctrl+Enter)

### ✅ Expected Result:
```
Row Level Security policies created successfully!
All tables are now secured.
Users can only access their own data.
```

### 🔒 What This Does:
- Enables Row Level Security (RLS) on all tables
- Ensures users can only see/edit their own data
- Prevents unauthorized access
- Protects user privacy

---

## Step 4: Verify Tables Were Created

1. In Supabase Dashboard, go to: **Table Editor** (left sidebar)
2. You should see 5 tables:
   - ✅ calls
   - ✅ violations
   - ✅ legal_cases
   - ✅ case_calls
   - ✅ user_settings

3. Click on any table to see its structure

---

## Step 5: Configure Storage Bucket

1. In Supabase Dashboard, go to: **Storage** (left sidebar)
2. Click **"Create a new bucket"**
3. Fill in:
   - **Name**: `call-recordings`
   - **Public bucket**: ❌ NO (keep it private)
4. Click **"Create bucket"**

---

## Step 6: Set Storage Policies

After creating the bucket, we need to add policies:

1. Click on the **`call-recordings`** bucket
2. Click **"Policies"** tab
3. Click **"New Policy"**
4. Choose **"Custom policy"**

### Policy 1: Allow users to upload their recordings

```sql
CREATE POLICY "Users can upload their own recordings"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'call-recordings' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### Policy 2: Allow users to view their recordings

```sql
CREATE POLICY "Users can view their own recordings"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'call-recordings' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### Policy 3: Allow users to delete their recordings

```sql
CREATE POLICY "Users can delete their own recordings"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'call-recordings' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## ✅ VERIFICATION CHECKLIST

Check off each item as you complete it:

- [ ] Opened Supabase SQL Editor
- [ ] Ran `database-schema.sql` successfully
- [ ] Saw "Database schema created successfully!" message
- [ ] Verified 5 tables exist in Table Editor
- [ ] Ran `database-rls.sql` successfully
- [ ] Saw "Row Level Security policies created successfully!" message
- [ ] Created `call-recordings` storage bucket
- [ ] Set bucket to private
- [ ] Added 3 storage policies

---

## 🎉 SUCCESS!

Your database is now fully set up and secured!

**What you have:**
✅ 5 database tables with proper relationships
✅ Indexes for fast queries
✅ Row Level Security protecting user data
✅ Storage bucket for call recordings
✅ Storage policies for secure file access

**Next Steps:**
- Stage 3: Backend API Development
- Stage 4: AI Services Integration

---

## 🆘 Troubleshooting

**Error: "relation already exists"**
- Some tables already exist. This is OK if you ran the script before.
- Tables won't be recreated if they exist.

**Error: "policy already exists"**
- Policies already exist. This is OK.
- You can safely ignore this.

**Error: "permission denied"**
- Make sure you're logged into the correct Supabase project
- Try refreshing the page and running again

**Can't see tables in Table Editor**
- Refresh the page
- Make sure the script ran without errors
- Check the SQL Editor for error messages
