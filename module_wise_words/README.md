# Module-Wise Words Storage

## Overview

This directory contains JSON files that store words organized by module number. **This is NOT a database** - these are simple JSON storage files that can be downloaded, backed up, or shared whenever needed.

## Purpose

- **Storage**: These files serve as a backup/storage location for words extracted from PDFs or imported from other sources
- **Portability**: JSON format allows easy transfer, backup, and version control
- **Module Organization**: Words are organized by module number (e.g., `module2.json`, `module3.json`)
- **Download Ready**: Files can be downloaded and used with the app's dictionary upload feature

## File Structure

Each JSON file follows this format:

```json
[
  {
    "german": "Haus",
    "english": "house",
    "type": "noun",
    "example": "Das Haus ist groß.",
    "article": "das",
    "module": 2
  },
  ...
]
```

## Field Descriptions

- **german** (required): The German word
- **english** (required): English translation
- **type** (required): Word type (noun, verb, adjective, determiner, etc.)
- **example** (required): Example sentence in German
- **article** (optional): For nouns only - "der", "die", or "das"
- **context** (optional): Additional context or notes
- **module** (optional): Module number (can also be set via UI when uploading)

## Usage

### Uploading to the App

1. Go to the app's upload section
2. Select "Upload Dictionary"
3. Choose the JSON file from this directory
4. (Optional) Enter module number if not already in the file
5. Words will be imported and synced to your Gist (if cloud sync is enabled)

### Backup & Sharing

- These files can be easily backed up to cloud storage (Google Drive, Dropbox, etc.)
- Can be shared with others who use the app
- Can be version controlled with Git
- Can be edited manually if needed

## Important Notes

⚠️ **This is NOT a database** - these are simple JSON files for storage and portability.

✅ **Safe to delete** - If you delete these files, your words are still stored in:
- Local browser storage (localStorage)
- GitHub Gist (if cloud sync is enabled)

✅ **Download anytime** - You can export your words from the app and save them here for backup.

## File Naming Convention

- `module2.json` - Words for module 2
- `module3.json` - Words for module 3
- `module4.json` - Words for module 4
- etc.

## Tips

- Keep regular backups of these files
- Use version control (Git) to track changes
- Can be edited with any text editor
- Can be merged or split as needed

