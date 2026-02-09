## German Language Learner

Mobile-first web app for learning German vocabulary through flashcards and quizzes. Upload a German PDF, paste text, or import a dictionary file to build your own word database, then practice with interactive quizzes.

### Try it yourself
`https://kushshiv.github.io/language-learner/`

> **No setup required.** Just open the app and start uploading PDFs, pasting text, or importing dictionaries. Your words are saved locally in your browser; optionally enable GitHub Gist sync in Settings (⚙️).

### Key Features

- **PDF & Text Input**: Upload German PDFs or paste raw text to extract vocabulary.
- **Smart Extraction**: Heuristics to detect verbs, nouns, and adjectives, with German-specific lemmatization.
- **Article Detection**: Simple context-based article (`der`/`die`/`das`) detection for nouns.
- **Dictionary Import**: Upload your own JSON/CSV dictionary files via the **📚 Upload Dictionary** tab.
- **Word Management**: Search, filter, and delete words; focus on words marked as “needs review”.
- **Practice Modes**:
  - By **difficulty**: Easy (10 words), Medium (20 words), Hard (30 words).
  - By **word type**: e.g. verbs, nouns, adjectives (or any type label present in your data).
  - **Practice all**: Work through your full collection in chunks of 100 words.
- **Flashcards + Quiz**: Flip cards to reveal translations and examples; answer multiple-choice questions.
- **Mark Doubts & Fix Translations**: Mark words as “needs review”, auto-fetch alternative translations, and update saved translations from the quiz view.
- **Local-First Storage**: Everything works fully offline in your browser.
- **Optional Cloud Sync**: Sync your words to a private GitHub Gist so you can use them on any device.
- **PWA-Ready & Mobile-First**: Built for phones; can be installed as a Progressive Web App.

### Tech Stack

- **Frontend**: Vue 3 + TypeScript, Vite.
- **PDF processing**: `pdfjs-dist` for text extraction.
- **Persistence**: `localStorage` (words, sentences, last PDF text) + IndexedDB (for GitHub token/Gist metadata).
- **Cloud sync**: GitHub Gists API (private Gist).
- **Translation**: LibreTranslate, MyMemory, and Google Translate endpoints (with fallbacks and timeouts).
- **Language logic**: Custom German lemmatizer + simple article extraction heuristics.

## Getting Started (Local Development)

### Prerequisites

- **Node.js** 16+ and **npm**
- (Optional) **GitHub account** if you want to test cloud sync

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the port Vite chooses).

### Build

```bash
npm run build
```

The built files will be in the `dist` directory.

## High-Level App Flow

At a high level, the app revolves around three main screens: **Upload**, **Practice**, and **Settings/Word Manager**.

### Main User Flow

1. **Landing / Upload screen (`UploadView`)**
   - Choose **“Start Practicing”** to use existing saved words.
   - Or choose **“Upload New Content”** to:
     - Upload a German **PDF**.
     - Paste **German text**.
     - Upload a **dictionary (JSON/CSV)** file.
2. **Processing pipeline**
   - For PDFs/text:
     - Text is extracted (PDF → text via `pdfParser`).
     - Words are extracted and lemmatized via `wordExtractor` + `lemmatizer`.
     - Existing words are loaded via `wordStorage` (local + optional cloud).
     - Only **new** words are translated and saved; duplicates are skipped.
     - Sentences and sentence-level translations are extracted via `sentenceExtractor` for richer context.
   - For dictionary files:
     - JSON/CSV is parsed via `dictionaryParser`.
     - Words are merged into your collection (deduplicated).
3. **Practice setup (`DifficultySelection`)**
   - Choose difficulty (**Easy/Medium/Hard**), or
   - Choose by **word type**, or
   - Choose a **chunk** (1…N) to practice *all* words in blocks of 100.
4. **Quiz (`QuizView` + `FlashCard`)**
   - Multiple-choice questions for each word.
   - Flip flashcards to see translations and example sentences.
   - Mark words as “needs review”, delete words, or update their translations on the fly.
5. **Results (`ResultsView`)**
   - See your score and percentage.
   - Restart with the same mode or go back and pick a different difficulty/type.
6. **Settings & Word Management**
   - **Settings (`SettingsView`)**:
     - Enable/disable GitHub Gist sync.
     - Export synced words as a JSON file.
   - **Word Manager (`WordManagerView`)**:
     - Search/filter words (by term, type, “needs review”).
     - Delete single words or wipe the entire collection (local + cloud, with confirmations).

### Text Flow Diagram (ASCII)

```text
[User opens app]
        |
        v
   [UploadView]
        |
        +-----------------------------+
        |                             |
        v                             v
[Start Practicing]           [Upload New Content]
        |                             |
        v                             v
[Load words from storage]      [Choose input mode]
        |                      /        |        \
        v                     v         v         v
[DifficultySelection]   [PDF upload] [Text] [Dictionary JSON/CSV]
        |                     |         |         |
        v                     v         v         v
   (pick mode)          [pdfParser]  [text] [dictionaryParser]
        |                     |         |         |
        v                     v         |         v
  +-----+--------------+   [text]       |   [parsed words]
  |     |              |      \         |        |
  |  by difficulty     |       \        |        |
  |  by word type      |        \       |        |
  |  practice all      |         v      v        v
  +-----+--------------+    [wordExtractor + lemmatizer
        |                    + article detection]
        v                             |
   [QuizView +                        v
    FlashCard]                [appendWords via wordStorage
        |                      (local + optional Gist)]
        v                             |
   [ResultsView]                      v
                                      +
                                      |
                                      v
                              [DifficultySelection]

From any time in UploadView:

  [UploadView] --(⚙️ Settings)--> [SettingsView]
        |                                |
        |                                +--> enable/disable cloud sync
        |                                +--> export words JSON
        |
        +--(Manage Words)--> [WordManagerView]
                                     |
                                     +--> search/filter/delete words
```

## Usage Details

### From Upload to Quiz

1. **Choose your action on `UploadView`:**
   - **Start Practicing**: Loads all saved words from local storage (and cloud, if sync is enabled).
   - **Upload New Content**: Opens the input tabs for PDF/Text/Dictionary.
2. **Upload German PDF or paste text (PDF/Text modes):**
   - PDFs are checked for page count and sanity (to avoid huge uploads).
   - Text is validated for length.
   - You’ll see a one-time **responsible-use warning** before heavy processing.
3. **Automatic processing:**
   - Words are lemmatized and classified as verb/noun/adjective (or other labels if imported).
   - Existing words (local + cloud) are detected; only new words are translated.
   - All words are saved to localStorage and, if configured, also to your private GitHub Gist.
   - Sentences are extracted and translated to provide context (used today mainly for examples).
4. **Choose how to practice (`DifficultySelection`):**
   - **By difficulty**: Fixed word counts (10/20/30).
   - **By type**: Practice only verbs, nouns, adjectives, etc., based on your data.
   - **Practice all**: Select a chunk number to work through up to 100 words at a time.
5. **Quiz & review (`QuizView`):**
   - Multiple-choice questions are generated from your word list.
   - Flip the flashcard if you don’t know the answer.
   - After revealing the answer:
     - **Mark as doubt** → flag the word as `needsReview` and optionally fetch a fresh translation.
     - **Update translation** → save a better translation back to storage/cloud.
     - **Delete word** → remove it from both local and (optionally) cloud storage.

### Optional: Enable Cloud Sync (GitHub Gist)

Cloud sync is configured entirely in `SettingsView`:

1. Open **Settings (⚙️)** from the top-right of `UploadView`.
2. Click **“Enable Cloud Sync”**.
3. Follow the inline steps to create a **GitHub Personal Access Token**:
   - Go to your **GitHub Settings → Developer settings → Personal access tokens**.
   - Click **“Generate new token (classic)”**.
   - Give it a name (e.g., “Language Learner”).
   - Check **only** the **`gist`** permission.
   - Generate and copy the token.
4. Paste the token into the app and click **Enable Sync**.
5. Your existing local words are synced to a private Gist; subsequent changes stay in sync.

> **Note:** Cloud sync is optional. The app works fully with local storage only.

From Settings you can also:

- **Export Gist data** as a downloadable JSON file.
- **Disable Cloud Sync**, which simply clears the token; your words remain in local storage.

## Generating Dictionary JSON/CSV with AI

You can use AI tools (Cursor, ChatGPT, Claude, etc.) to generate **dictionary files** for upload. These files are used by the **📚 Upload Dictionary** tab.

### Dictionary/Quiz JSON Format

**Use this for:** Uploading vocabulary words to practice with flashcards and quizzes.

**AI Prompt (example):**

```text
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
- "type": A part-of-speech label such as "verb", "noun", or "adjective"
- "example": A German sentence using the word
- "context": (optional) English translation of the example sentence
- "article": (optional, for nouns only) Must be "der", "die", or "das"

Output ONLY valid JSON, with no surrounding explanation.
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

1. Ask your AI tool using the prompt above (adapted to your topic).
2. Paste or upload your German text.
3. Copy the generated JSON.
4. Save it as a `.json` file.
5. Upload it in the app using the **“📚 Upload Dictionary”** tab.

> For CSV format and more details, see `DICTIONARY_FORMAT.md`.

### Tips for AI-Generated Dictionaries

- **Be specific**: Mention the topic/subject (e.g., “nutrition”, “travel”, “finance”).
- **Validate JSON**: Use a linter such as `jsonlint.com` if needed.
- **Review translations**: AI is usually good, but double-check tricky words.
- **Use clear module names**: For example, “Module 1: Nutrition Basics” for easy grouping.

## Notes

- **Translation APIs**: Use free public services (LibreTranslate, MyMemory, Google) with basic retry/fallback logic; heavy usage may hit rate limits.
- **Storage**:
  - **Default**: Words are stored in your browser’s `localStorage`.
  - **Optional**: Enable cloud sync to mirror words to a private GitHub Gist.
- **Lemmatization**: Words are normalized to base forms (e.g., “geht” → “gehen”, “Häuser” → “Haus”) for de-duplication.
- **Articles**: Articles are heuristically detected from surrounding context for nouns.
- **Duplicate Prevention**: Before translating/saving, existing words are checked (local + cloud if enabled).

## License

MIT
