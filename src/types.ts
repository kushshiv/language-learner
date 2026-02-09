export interface Word {
  german: string
  english: string
  // Allow any part-of-speech label instead of restricting to a fixed union.
  type: string
  example: string
  context?: string
  article?: 'der' | 'die' | 'das' // For nouns only
  needsReview?: boolean // Flag to mark words that need review/correction
}

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Sentence {
  original: string
  translation: string
  words: Word[]
  index: number
}
