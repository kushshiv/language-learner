export interface Word {
  german: string
  english: string
  type: 'verb' | 'noun' | 'adjective'
  example: string
  context?: string
}

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Sentence {
  original: string
  translation: string
  words: Word[]
  index: number
}
