export interface Word {
  german: string
  english: string
  type: 'verb' | 'noun' | 'adjective'
  example: string
  context?: string
  article?: 'der' | 'die' | 'das' // For nouns only
}

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Sentence {
  original: string
  translation: string
  words: Word[]
  index: number
}

export interface ReadingLine {
  lineNumber: number
  original: string
  translation: string  // AI-generated, not API
  words?: Word[]  // Optional: words found in this line
}

export interface ReadingContent {
  moduleName: string  // e.g., "Module 1: Nutrition Basics"
  title: string
  source: string  // PDF filename or source
  totalLines: number
  lines: ReadingLine[]
  createdAt: string
  updatedAt: string
  version: string  // "beta"
  currentLineIndex: number  // Progress tracking
}
