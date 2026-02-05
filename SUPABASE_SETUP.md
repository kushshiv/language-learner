# Supabase Cloud Storage Setup Guide

This guide will help you set up Supabase cloud storage for the German Language Learner app.

## Why Supabase?

- ✅ Free tier with generous limits
- ✅ No backend server required (works client-side)
- ✅ Cross-device synchronization
- ✅ Simple JSON file storage (not a database)
- ✅ Works with static site deployments (GitHub Pages, Vercel, Netlify)

## Step-by-Step Setup

### 1. Create Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up for a free account
3. Verify your email

### 2. Create a New Project

1. Click "New Project"
2. Fill in:
   - **Name**: `german-learner` (or any name you prefer)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to you
3. Click "Create new project"
4. Wait 2-3 minutes for project to initialize

### 3. Get Your API Keys

1. In your project dashboard, go to **Settings** (gear icon) → **API**
2. You'll see:
   - **Project URL**: Copy this (looks like `https://xxxxx.supabase.co`)
   - **anon public** key: Copy this (long string starting with `eyJ...`)

### 4. Create Storage Bucket

1. Go to **Storage** in the left sidebar
2. Click **New bucket**
3. Configure:
   - **Name**: `german-words` (must be exactly this)
   - **Public bucket**: ✅ **Enable this** (toggle ON)
4. Click **Create bucket**

### 5. Configure Environment Variables

1. In your project root, create a `.env` file (if it doesn't exist)
2. Add these lines:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace:
- `your-project-id` with your actual project ID
- `your-anon-key-here` with your actual anon key

### 6. Test the Setup

1. Run `npm run dev`
2. Upload a PDF or paste some German text
3. Check your Supabase Storage → `german-words` bucket
4. You should see a `words.json` file appear

## Troubleshooting

### "Supabase not configured" warning

- Make sure your `.env` file exists in the project root
- Check that variable names start with `VITE_`
- Restart your dev server after creating `.env`
- For production, add these as environment variables in your hosting platform

### "Failed to save words to cloud storage"

- Check that the bucket name is exactly `german-words`
- Verify the bucket is set to **Public**
- Check browser console for detailed error messages
- The app will fall back to localStorage if cloud storage fails

### Bucket not found error

- Make sure you created the bucket in the Storage section
- Verify the bucket name is `german-words` (case-sensitive)
- Check that the bucket is public

## Production Deployment

When deploying to Vercel/Netlify/GitHub Pages:

1. **Vercel**: Add environment variables in Project Settings → Environment Variables
2. **Netlify**: Add in Site Settings → Build & Deploy → Environment
3. **GitHub Pages**: Use GitHub Secrets and update your deployment workflow

## Security Note

The `anon` key is safe to use in client-side code. It's designed for public access. However, make sure:
- Your bucket is public (which we set up)
- Or configure Row Level Security (RLS) policies if you want more control

## Fallback Behavior

If Supabase is not configured, the app automatically falls back to localStorage. This means:
- ✅ App still works without Supabase
- ❌ Words only saved locally (not synced across devices)
- ❌ Words lost if browser data is cleared

For the best experience, set up Supabase cloud storage!

