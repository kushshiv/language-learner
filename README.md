# German Language Learner

A mobile-first web application for learning German vocabulary through flashcards and quizzes. Upload a German PDF, extract important words (verbs, nouns, adjectives), and practice with interactive flashcards and quizzes.

## Try it yourself
https://kushshiv.github.io/language-learner/

> **For Recruiters/Reviewers:** When you first open the app, you'll see a setup screen. You'll need a GitHub account (free) and a Personal Access Token. The app will guide you through creating one - it takes less than 2 minutes! Each user needs their own token for security reasons.

## Features

- 📄 **PDF Upload & Text Paste**: Upload German PDFs or paste text to extract vocabulary
- 🔍 **Smart Word Extraction**: Automatically identifies verbs, nouns, and adjectives
- 📝 **Lemmatization**: Words are stored in their base/infinite form (no duplicates)
- 🎯 **Article Detection**: Automatically detects German articles (der/die/das) for nouns
- ☁️ **GitHub Gists Storage**: Words are saved in GitHub Gists (free, accessible from any device)
- 🔄 **Duplicate Prevention**: Only translates new words, skips existing ones
- 🎴 **Interactive Flashcards**: Flip cards to see translations, examples, and word types
- 🎯 **Quiz Mode**: Test your knowledge with multiple-choice questions
- 📊 **Difficulty Levels**: Easy (10 words), Medium (20 words), Hard (30 words)
- 📱 **Mobile-First Design**: Optimized for mobile devices

## Tech Stack

- Vue.js 3 with TypeScript
- Vite for build tooling
- PDF.js for PDF parsing
- GitHub Gists API for cloud storage
- LibreTranslate API for translations
- German lemmatization for base form extraction

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- A GitHub account (free)

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the port Vite assigns)

### First-Time Setup

**⚠️ Important:** Each user needs their own GitHub Personal Access Token. Do NOT share tokens - this is a security risk!

When you first open the app, you'll see a setup screen with step-by-step instructions. Here's what you'll need to do:

1. **Get a GitHub Token** (if you don't have a GitHub account, [create one free](https://github.com/signup)):
   - Go to [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
   - Click "Generate new token (classic)"
   - Give it a name (e.g., "Language Learner")
   - Check **ONLY** the **"gist"** permission
   - Click "Generate token"
   - Copy the token immediately (starts with `ghp_`)

2. **Enter Token in App**:
   - Paste your token in the setup screen
   - Click "Save Token"
   - You're ready to go!

> **Security Note**: Your token is stored securely in your browser. It's never sent to any server except GitHub. All your words are stored in a private Gist on your GitHub account.

> **For Recruiters/Reviewers**: The app will guide you through this process automatically. You only need a free GitHub account - no payment or special permissions required!

### Build

```bash
npm run build
```

The built files will be in the `dist` directory.

## Deployment

This app can be deployed to any static hosting service:

- **Vercel**: Connect your GitHub repo and deploy
- **Netlify**: Drag and drop the `dist` folder or connect via Git
- **GitHub Pages**: Use GitHub Actions to build and deploy
- **Cloudflare Pages**: Connect repo and deploy

### Quick Deploy to Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the project directory
3. Follow the prompts

### Quick Deploy to Netlify

1. Build the project: `npm run build`
2. Go to [Netlify Drop](https://app.netlify.com/drop)
3. Drag and drop the `dist` folder

## Usage

1. **Choose Your Action**:
   - **Start Practicing**: Load your existing words from GitHub Gist
   - **Upload New Content**: Add new words from a PDF or pasted text

2. **Upload PDF or Paste Text** (if uploading new content): 
   - Upload a German PDF file, OR
   - Paste German text directly into the text area
   
3. **Automatic Processing**: 
   - Words are extracted and lemmatized (converted to base form)
   - App checks GitHub Gist for existing words
   - Only new words are translated (duplicates are skipped)
   - Articles are detected for nouns
   - Everything is saved to your GitHub Gist

4. **Choose your difficulty level**: Easy, Medium, or Hard

5. **Practice**: Use flashcards and quizzes to learn

6. **Access Anywhere**: Your words are saved in your GitHub Gist and accessible from any device

## Notes

- **Translation API**: Uses LibreTranslate (free public service) with MyMemory as fallback. May have rate limits.
- **Storage**: Words are stored in a private GitHub Gist. Free, unlimited storage, and accessible from anywhere.
- **Lemmatization**: Words are automatically converted to their base form (e.g., "geht" → "gehen", "Häuser" → "Haus")
- **Articles**: German articles (der/die/das) are detected from context for nouns
- **Duplicate Prevention**: The app checks your GitHub Gist before translating to avoid duplicate translations
- **GitHub Rate Limits**: 5,000 requests/hour with a token (more than enough for normal use)

## License

MIT

