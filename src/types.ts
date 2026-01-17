export interface Word {
  german: string
  english: string
  type: 'verb' | 'noun' | 'adjective'
  example: string
  context?: string
}

export type Difficulty = 'easy' | 'medium' | 'hard'

