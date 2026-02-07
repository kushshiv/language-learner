# Dictionary File Format Guide

This guide explains how to create dictionary files (JSON or CSV) that can be uploaded to the German Language Learner app.

## JSON Format

### Option 1: Array of Words (Recommended)

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
  },
  {
    "german": "schön",
    "english": "beautiful",
    "type": "adjective",
    "example": "Das ist ein schönes Bild",
    "context": "That is a beautiful picture"
  }
]
```

### Option 2: Object with Words Array

```json
{
  "words": [
    {
      "german": "Haus",
      "english": "house",
      "type": "noun",
      "example": "Das Haus ist groß",
      "article": "das"
    }
  ]
}
```

### Required Fields:
- `german` (string): The German word
- `english` (string): The English translation
- `type` (string): Must be one of: `"verb"`, `"noun"`, or `"adjective"`
- `example` (string): Example sentence using the word

### Optional Fields:
- `context` (string): Additional context or explanation
- `article` (string): For nouns only - must be `"der"`, `"die"`, or `"das"`

## CSV Format

### Required Columns:
- `german`: The German word
- `english`: The English translation
- `type`: Must be `verb`, `noun`, or `adjective`
- `example`: Example sentence using the word

### Optional Columns:
- `context`: Additional context or explanation
- `article`: For nouns only - `der`, `die`, or `das`

### Example CSV:

```csv
german,english,type,example,context,article
Haus,house,noun,Das Haus ist groß,The house is big,das
gehen,to go,verb,Ich gehe zur Schule,I go to school,
schön,beautiful,adjective,Das ist ein schönes Bild,That is a beautiful picture,
```

### CSV Notes:
- First row must be the header with column names
- Columns can be in any order
- Optional columns can be omitted
- Values with commas should be wrapped in quotes: `"value, with comma"`

## How to Use

1. **Create your dictionary file** using one of the formats above
2. **Upload it** in the app using the "📚 Upload Dictionary" tab
3. **Words will be imported** and saved to your storage (localStorage + cloud if enabled)
4. **Duplicate words** will be automatically skipped

## Tips for Creating Dictionary Files

- Use an AI tool (like Cursor) to extract words from a PDF
- Format the output as JSON or CSV matching the structure above
- Make sure all required fields are present
- For nouns, include the article (der/die/das) if you know it
- The `example` field should show the word in context

