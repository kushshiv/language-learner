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

export interface StreakData {
  dailyGoal: number // Number of unique words to practice per day (default: 30)
  streakHistory: Record<string, number> // Date string (YYYY-MM-DD) -> count of unique words practiced
  lastUpdated: string // ISO date string
}

export interface StreakDay {
  date: string // YYYY-MM-DD
  count: number // Number of unique words practiced
  completed: boolean // Whether daily goal was met
}
