# GitHub Secrets Setup Guide

This guide shows you how to store your Supabase credentials as GitHub Secrets, so they're automatically used when deploying to GitHub Pages.

## Why GitHub Secrets?

- ✅ **Secure**: Secrets are encrypted and never exposed in logs or code
- ✅ **Automatic**: Used automatically during GitHub Actions builds
- ✅ **No local .env needed**: You don't need to commit or manage `.env` files
- ✅ **Works on every push**: Every deployment automatically uses the correct credentials

## Step-by-Step Setup

### 1. Go to Your Repository Settings

1. Open your GitHub repository
2. Click **Settings** (top menu)
3. In the left sidebar, click **Secrets and variables** → **Actions**

### 2. Add Your Supabase URL Secret

1. Click **New repository secret**
2. Fill in:
   - **Name**: `VITE_SUPABASE_URL` (must be exactly this)
   - **Secret**: `https://oyyhxmgsyadpaqdtmtbp.supabase.co`
3. Click **Add secret**

### 3. Add Your Supabase Anon Key Secret

1. Click **New repository secret** again
2. Fill in:
   - **Name**: `VITE_SUPABASE_ANON_KEY` (must be exactly this)
   - **Secret**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95eWh4bWdzeWFkcGFxZHRtdGJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyOTAzMjcsImV4cCI6MjA4NTg2NjMyN30.P2V-rcYDp6es2QpghkeYWNZDEf98hSL7q8WOmcBblYo`
3. Click **Add secret**

### 4. Verify Your Secrets

You should now see two secrets listed:
- ✅ `VITE_SUPABASE_URL`
- ✅ `VITE_SUPABASE_ANON_KEY`

## How It Works

1. **When you push to GitHub**: The GitHub Actions workflow runs automatically
2. **During build**: The secrets are injected as environment variables
3. **Vite picks them up**: Vite automatically uses any `VITE_*` environment variables
4. **Baked into build**: The values are compiled into your JavaScript bundle
5. **Deployed**: Your app is deployed with the correct Supabase credentials

## Testing

1. **Push a change** to your repository:
   ```bash
   git add .
   git commit -m "Update deployment"
   git push
   ```

2. **Check the Actions tab**: 
   - Go to your repo → **Actions** tab
   - You should see the workflow running
   - The build should complete successfully

3. **Test your deployed app**:
   - Go to your GitHub Pages URL
   - Upload a PDF or paste text
   - Check your Supabase dashboard → Storage → `german-words` bucket
   - You should see `words.json` appear!

## Important Notes

- **Secrets are one-way**: Once added, you can't view them again (only update or delete)
- **Case-sensitive**: Secret names must match exactly (`VITE_SUPABASE_URL`, not `vite_supabase_url`)
- **No .env needed**: You don't need a `.env` file in your repo anymore (it's in `.gitignore` anyway)
- **Local development**: For local dev, you can still use a `.env` file if you want, but it's optional since the app falls back to localStorage

## Troubleshooting

### Build fails with "VITE_SUPABASE_URL is not defined"

- Make sure you created the secrets with the exact names: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Check that they're in **Secrets and variables** → **Actions** (not "Variables")
- Make sure there are no extra spaces in the secret names

### App works locally but not on GitHub Pages

- The secrets are only used during the GitHub Actions build
- Make sure you pushed to the `main` branch (or whatever branch triggers your workflow)
- Check the Actions tab to see if the build succeeded

### Want to update your secrets?

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click on the secret you want to update
3. Click **Update** and enter the new value

## Security Note

The `anon` key is **safe to use** in client-side code - it's designed for public access. However, storing it as a GitHub Secret is still a best practice because:
- It keeps your credentials organized
- Makes it easy to rotate/update them
- Prevents accidental exposure in code or logs

