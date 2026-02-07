# German Language Learner

A mobile-first web application for learning German vocabulary through flashcards and quizzes. Upload a German PDF, extract important words (verbs, nouns, adjectives), and practice with interactive flashcards and quizzes.

## Try it yourself
https://kushshiv.github.io/language-learner/

> **No setup required!** Just open the app and start uploading PDFs or pasting text. Your words are saved locally in your browser. Optionally enable cloud sync in Settings (⚙️) to access your words from any device.

## Features

- 📄 **PDF Upload & Text Paste**: Upload German PDFs or paste text to extract vocabulary
- 🔍 **Smart Word Extraction**: Automatically identifies verbs, nouns, and adjectives
- 📝 **Lemmatization**: Words are stored in their base/infinite form (no duplicates)
- 🎯 **Article Detection**: Automatically detects German articles (der/die/das) for nouns
- 💾 **Local Storage**: Words saved in your browser - no setup required!
- ☁️ **Optional Cloud Sync**: Enable GitHub Gists sync in Settings to access words from any device
- 🔄 **Duplicate Prevention**: Only translates new words, skips existing ones
- 🎴 **Interactive Flashcards**: Flip cards to see translations, examples, and word types
- 🎯 **Quiz Mode**: Test your knowledge with multiple-choice questions
- 📊 **Difficulty Levels**: Easy (10 words), Medium (20 words), Hard (30 words)
- 📱 **Mobile-First Design**: Optimized for mobile devices

## Tech Stack

- Vue.js 3 with TypeScript
- Vite for build tooling
- PDF.js for PDF parsing
- Browser localStorage (default) + GitHub Gists API (optional cloud sync)
- LibreTranslate API for translations
- German lemmatization for base form extraction

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- (Optional) GitHub account for cloud sync feature

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the port Vite assigns)

### First-Time Usage

**No setup required!** Just open the app and start using it:

1. **Upload a PDF or paste text** - The app will extract German words automatically
2. **Start practicing** - Use flashcards and quizzes to learn
3. **Your words are saved locally** - No account or setup needed!

### Optional: Enable Cloud Sync

If you want to access your words from multiple devices, you can enable cloud sync:

1. Click the **⚙️ Settings** button (top-right corner)
2. Click **"Enable Cloud Sync"**
3. Follow the instructions to create a GitHub Personal Access Token:
   - Go to [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
   - Click "Generate new token (classic)"
   - Give it a name (e.g., "Language Learner")
   - Check **ONLY** the **"gist"** permission
   - Click "Generate token" and copy it
4. Paste the token in the app and click "Enable Sync"
5. Your existing local words will be synced to the cloud automatically

> **Note**: Cloud sync is completely optional. The app works perfectly fine with just local storage!

### Build

```bash
npm run build
```

The built files will be in the `dist` directory.

## Deployment

### Deploy to GitHub Pages

The app is configured to automatically deploy to GitHub Pages using GitHub Actions.

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
   - Click **Settings** → **Pages**
   - Under "Source", select **"GitHub Actions"**
   - The workflow (`.github/workflows/deploy.yml`) will automatically deploy on every push to `main`

Your app will be available at `https://<your-username>.github.io/<repo-name>/`

## Usage

1. **Choose Your Action**:
   - **Start Practicing**: Load your existing words (from local storage or cloud if enabled)
   - **Upload New Content**: Add new words from a PDF or pasted text

2. **Upload PDF or Paste Text** (if uploading new content): 
   - Upload a German PDF file, OR
   - Paste German text directly into the text area
   
3. **Automatic Processing**: 
   - Words are extracted and lemmatized (converted to base form)
   - App checks for existing words (local storage + cloud if enabled)
   - Only new words are translated (duplicates are skipped)
   - Articles are detected for nouns
   - Everything is saved locally (and to cloud if sync is enabled)

4. **Choose your difficulty level**: Easy, Medium, or Hard

5. **Practice**: Use flashcards and quizzes to learn

6. **Access Anywhere** (if cloud sync enabled): Your words sync across all your devices automatically

## Generating JSON Files with AI

You can use AI tools (like Cursor, ChatGPT, or Claude) to generate JSON files for both **Dictionary/Quiz mode** and **Reading mode**. Here are the exact prompts and formats:

### 📚 Dictionary/Quiz JSON Format

**Use this for:** Uploading vocabulary words to practice with flashcards and quizzes.

**AI Prompt:**
```
I have a German PDF/text about [TOPIC]. Extract all important German words (verbs, nouns, adjectives) and create a JSON file in this exact format:

[
  {
    "german": "Haus",
    "english": "house",
    "type": "noun",
    "example": "Das Haus ist groß",
    "context": "The house is big",
    "article": "das"
  },
  {
    "german": "gehen",
    "english": "to go",
    "type": "verb",
    "example": "Ich gehe zur Schule",
    "context": "I go to school"
  },
  {
    "german": "schön",
    "english": "beautiful",
    "type": "adjective",
    "example": "Das ist ein schönes Bild",
    "context": "That is a beautiful picture"
  }
]

Requirements:
- "german": The German word in its base/infinitive form (e.g., "gehen" not "geht", "Haus" not "Häuser")
- "english": English translation
- "type": Must be exactly "verb", "noun", or "adjective"
- "example": A German sentence using the word
- "context": (optional) English translation of the example sentence
- "article": (optional, for nouns only) Must be "der", "die", or "das"

Extract ALL important words from the text and output ONLY valid JSON, no explanations.
```

**Expected JSON Format:**
```json
[
  {
    "german": "Haus",
    "english": "house",
    "type": "noun",
    "example": "Das Haus ist groß",
    "context": "The house is big",
    "article": "das"
  },
  {
    "german": "gehen",
    "english": "to go",
    "type": "verb",
    "example": "Ich gehe zur Schule",
    "context": "I go to school"
  }
]
```

**How to use:**
1. Copy the AI prompt above and paste it to Cursor/ChatGPT
2. Provide your German PDF/text
3. Copy the generated JSON
4. Save it as a `.json` file
5. Upload it in the app using the "📚 Upload Dictionary" tab

---

### 📖 Reading Mode JSON Format

**Use this for:** Line-by-line reading with translations (perfect for understanding complex texts).

**AI Prompt:**
```
I have a German PDF/text about [TOPIC]. Convert it to a JSON file for line-by-line reading. Extract the text line-by-line (preserving ALL lines, no skipping) and provide translations for each line.

Output in this EXACT format:

{
  "moduleName": "Module 1: Nutrition Basics",
  "title": "Nutrition Guide",
  "source": "nutrition-guide.pdf",
  "totalLines": 50,
  "lines": [
    {
      "lineNumber": 1,
      "original": "Ernährung ist wichtig für die Gesundheit.",
      "translation": "Nutrition is important for health."
    },
    {
      "lineNumber": 2,
      "original": "Eine ausgewogene Ernährung enthält verschiedene Nährstoffe.",
      "translation": "A balanced diet contains various nutrients."
    }
  ],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "version": "beta",
  "currentLineIndex": 0
}

Requirements:
- "moduleName": A descriptive name (e.g., "Module 1: Nutrition Basics")
- "title": Short title of the document
- "source": Original filename or source
- "totalLines": Total number of lines
- "lines": Array of line objects, each with:
  - "lineNumber": Sequential number starting from 1
  - "original": The German text (preserve ALL lines, don't skip any)
  - "translation": Accurate English translation
- "createdAt": Current date in ISO format
- "updatedAt": Current date in ISO format
- "version": "beta"
- "currentLineIndex": 0

IMPORTANT: 
- Extract line-by-line preserving the original structure
- Don't skip any lines
- Provide accurate, natural translations
- Output ONLY valid JSON, no explanations
```

**Expected JSON Format:**
```json
{
  "moduleName": "Module 1: Nutrition Basics",
  "title": "Nutrition Guide",
  "source": "nutrition-guide.pdf",
  "totalLines": 2,
  "lines": [
    {
      "lineNumber": 1,
      "original": "Ernährung ist wichtig für die Gesundheit.",
      "translation": "Nutrition is important for health."
    },
    {
      "lineNumber": 2,
      "original": "Eine ausgewogene Ernährung enthält verschiedene Nährstoffe.",
      "translation": "A balanced diet contains various nutrients."
    }
  ],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "version": "beta",
  "currentLineIndex": 0
}
```

**How to use:**
1. Copy the AI prompt above and paste it to Cursor/ChatGPT
2. Provide your German PDF/text
3. Copy the generated JSON
4. Save it as a `.json` file
5. Upload it in the app using the "📖 Reading Mode" tab
6. Enter the module name when prompted (or it will use the one from JSON)

---

### Tips for AI Generation

- **Be specific**: Mention the topic/subject in your prompt
- **Check the format**: Make sure the AI outputs valid JSON (you can validate at jsonlint.com)
- **Review translations**: AI translations are usually good, but review for accuracy
- **Module names**: Use descriptive names like "Module 1: Nutrition Basics" for easy identification
- **Line preservation**: For reading mode, emphasize "preserve ALL lines, don't skip any"

## Notes

- **Translation API**: Uses LibreTranslate (free public service) with MyMemory as fallback. May have rate limits.
- **Storage**: 
  - **Default**: Words are stored in your browser's localStorage (no setup needed)
  - **Optional**: Enable cloud sync to store words in a private GitHub Gist (accessible from any device)
- **Lemmatization**: Words are automatically converted to their base form (e.g., "geht" → "gehen", "Häuser" → "Haus")
- **Articles**: German articles (der/die/das) are detected from context for nouns
- **Duplicate Prevention**: The app checks existing words (local + cloud if enabled) before translating to avoid duplicates
- **Cloud Sync**: If enabled, uses GitHub Gists API (5,000 requests/hour - more than enough for normal use)

## License

MIT

