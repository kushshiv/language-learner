# Deployment Guide

This guide will help you deploy the German Language Learner app to free hosting platforms.

## 🆓 100% Free Options (No Credit Card Required)

### Option 1: GitHub Pages (Most Free-Friendly) ⭐

**Completely free, no credit card, unlimited for public repos**

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Enable GitHub Pages**:
   - Go to your repository on GitHub
   - Click "Settings" → "Pages"
   - Source: "GitHub Actions"
   - The workflow (already configured) will automatically deploy on every push

**Pros**: Completely free, unlimited bandwidth, reliable, free custom domain  
**Cons**: Requires GitHub account (also free)

### Option 2: Netlify Drop (Easiest - No Account Needed) 🎯

**No signup required, just drag and drop!**

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Deploy**:
   - Go to [app.netlify.com/drop](https://app.netlify.com/drop)
   - Drag and drop the `dist` folder
   - Your app will be live instantly with a random URL!

**Pros**: No account needed, instant deployment, super easy  
**Cons**: Random URL (can add custom domain later if you sign up)

### Option 3: Cloudflare Pages (Fast & Free) ⚡

**Free tier with no credit card required**

1. **Connect Repository**:
   - Go to [dash.cloudflare.com](https://dash.cloudflare.com)
   - Sign up (free, no credit card)
   - Navigate to Pages
   - Click "Create a project"
   - Connect your Git repository

2. **Configure Build Settings**:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Click "Save and Deploy"

**Pros**: Very fast CDN, generous free limits, no credit card  
**Cons**: Requires Cloudflare account (free)

---

## Other Free Options

### Option 4: Vercel (Easy but Requires Account)

1. **Install Vercel CLI** (optional, you can also use the web interface):
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```
   Follow the prompts. Vercel will automatically detect the build settings.

3. **Or use the Web Interface**:
   - Go to [vercel.com](https://vercel.com)
   - Sign up/login with GitHub
   - Click "New Project"
   - Import your repository
   - Vercel will auto-detect settings
   - Click "Deploy"

1. **Install Vercel CLI** (optional):
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```
   Follow the prompts. Vercel will automatically detect the build settings.

3. **Or use the Web Interface**:
   - Go to [vercel.com](https://vercel.com)
   - Sign up/login with GitHub (free account)
   - Click "New Project"
   - Import your repository
   - Vercel will auto-detect settings
   - Click "Deploy"

**Pros**: Very easy, automatic deployments  
**Cons**: Requires account (free but may ask for credit card for some features)

## Important Notes

- **Translation API**: The app uses free translation APIs (LibreTranslate, MyMemory). These may have rate limits. For production, consider:
  - Google Translate API (paid)
  - DeepL API (paid, but very accurate)
  - Self-hosted LibreTranslate instance

- **PDF.js Worker**: The PDF.js worker is loaded from CDN. If you encounter issues, you may need to copy the worker file to your public directory.

- **Mobile Testing**: Always test on a real mobile device after deployment to ensure everything works correctly.

## Environment Variables (Optional)

If you want to use a specific translation API, you can add environment variables:

- `VITE_TRANSLATION_API_KEY`: API key for translation service
- `VITE_TRANSLATION_API_URL`: Custom translation API URL

Then update `src/utils/wordExtractor.ts` to use these variables.

## Troubleshooting

- **Build fails**: Make sure all dependencies are installed (`npm install`)
- **PDF not loading**: Check browser console for CORS or worker errors
- **Translations not working**: The free APIs may be rate-limited. Try again later or use a paid API  

