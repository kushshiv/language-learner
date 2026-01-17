# German Language Learner

A mobile-first web application for learning German vocabulary through flashcards and quizzes. Upload a German PDF, extract important words (verbs, nouns, adjectives), and practice with interactive flashcards and quizzes.

## Features

- 📄 **PDF Upload**: Upload German PDFs to extract vocabulary
- 🔍 **Word Extraction**: Automatically identifies verbs, nouns, and adjectives
- 🎴 **Interactive Flashcards**: Flip cards to see translations, examples, and word types
- 🎯 **Quiz Mode**: Test your knowledge with multiple-choice questions
- 📊 **Difficulty Levels**: Easy (10 words), Medium (20 words), Hard (30 words)
- 💾 **Data Persistence**: Words are saved in browser localStorage
- 📱 **Mobile-First Design**: Optimized for mobile devices

## Tech Stack

- Vue.js 3 with TypeScript
- Vite for build tooling
- PDF.js for PDF parsing
- LibreTranslate API for translations

## Getting Started

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

1. Upload a German PDF file
2. Wait for processing (extraction and translation)
3. Choose your difficulty level
4. Practice with flashcards and quizzes
5. Your words are automatically saved for future sessions

## Notes

- The translation API (LibreTranslate) is a free public service and may have rate limits
- For production use, consider using a paid translation API like Google Translate or DeepL
- Words are stored in browser localStorage, so they persist across sessions on the same device

## License

MIT

