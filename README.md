# German Language Learner

A mobile-first web application for learning German vocabulary through flashcards and quizzes. Upload a German PDF, extract important words (verbs, nouns, adjectives), and practice with interactive flashcards and quizzes.

## Try if yourself
https://kushshiv.github.io/language-learner/

## Features

- 📄 **PDF Upload & Text Paste**: Upload German PDFs or paste text to extract vocabulary
- 🔍 **Smart Word Extraction**: Automatically identifies verbs, nouns, and adjectives
- 📝 **Lemmatization**: Words are stored in their base/infinite form (no duplicates)
- 🎯 **Article Detection**: Automatically detects German articles (der/die/das) for nouns
- ☁️ **Cloud Storage**: Words are saved in Supabase cloud storage (accessible from any device)
- 🔄 **Duplicate Prevention**: Only translates new words, skips existing ones
- 🎴 **Interactive Flashcards**: Flip cards to see translations, examples, and word types
- 🎯 **Quiz Mode**: Test your knowledge with multiple-choice questions
- 📊 **Difficulty Levels**: Easy (10 words), Medium (20 words), Hard (30 words)
- 📱 **Mobile-First Design**: Optimized for mobile devices

## Tech Stack

- Vue.js 3 with TypeScript
- Vite for build tooling
- PDF.js for PDF parsing
- Supabase for cloud storage
- LibreTranslate API for translations
- German lemmatization for base form extraction

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- A Supabase account (free tier is sufficient)

### Supabase Setup

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **Settings > API** and copy:
   - Your Project URL
   - Your `anon` (public) key
4. Go to **Storage** and create a new bucket:
   - Name: `german-words`
   - Make it **Public** (or configure Row Level Security policies)
5. Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

> **Note**: If Supabase is not configured, the app will fall back to localStorage. However, cloud storage is recommended for cross-device synchronization.

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

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

1. **Upload PDF or Paste Text**: 
   - Upload a German PDF file, OR
   - Paste German text directly into the text area
2. **Automatic Processing**: 
   - Words are extracted and lemmatized (converted to base form)
   - Only new words are translated (duplicates are skipped)
   - Articles are detected for nouns
   - Everything is saved to cloud storage
3. **Choose your difficulty level**: Easy, Medium, or Hard
4. **Practice**: Use flashcards and quizzes to learn
5. **Access Anywhere**: Your words are saved in the cloud and accessible from any device

## Notes

- **Translation API**: Uses LibreTranslate (free public service) with MyMemory as fallback. May have rate limits.
- **Cloud Storage**: Words are stored in Supabase Storage. If not configured, falls back to localStorage.
- **Lemmatization**: Words are automatically converted to their base form (e.g., "geht" → "gehen", "Häuser" → "Haus")
- **Articles**: German articles (der/die/das) are detected from context for nouns
- **Duplicate Prevention**: The app checks cloud storage before translating to avoid duplicate translations

## License

MIT

