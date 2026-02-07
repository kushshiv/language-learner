import type { Word } from '../types'

/**
 * Parse a JSON dictionary file
 */
export function parseJSONDictionary(content: string): Word[] {
  try {
    const data = JSON.parse(content)
    
    // Handle array of words
    if (Array.isArray(data)) {
      return data.map(item => parseWordObject(item))
    }
    
    // Handle object with words array
    if (data.words && Array.isArray(data.words)) {
      return data.words.map((item: any) => parseWordObject(item))
    }
    
    throw new Error('Invalid JSON format. Expected an array of words or an object with a "words" array.')
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON format. Please check your file.')
    }
    throw error
  }
}

/**
 * Parse a CSV dictionary file
 */
export function parseCSVDictionary(content: string): Word[] {
  const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  
  if (lines.length === 0) {
    throw new Error('CSV file is empty')
  }
  
  // Parse header
  const header = lines[0].split(',').map(h => h.trim().toLowerCase())
  const requiredFields = ['german', 'english', 'type', 'example']
  
  // Check if required fields exist
  const missingFields = requiredFields.filter(field => !header.includes(field))
  if (missingFields.length > 0) {
    throw new Error(`Missing required columns: ${missingFields.join(', ')}. Required columns: ${requiredFields.join(', ')}`)
  }
  
  // Get column indices
  const germanIdx = header.indexOf('german')
  const englishIdx = header.indexOf('english')
  const typeIdx = header.indexOf('type')
  const exampleIdx = header.indexOf('example')
  const contextIdx = header.includes('context') ? header.indexOf('context') : -1
  const articleIdx = header.includes('article') ? header.indexOf('article') : -1
  
  // Parse data rows
  const words: Word[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    
    if (values.length < 4) {
      continue // Skip invalid rows
    }
    
    const german = values[germanIdx]?.trim()
    const english = values[englishIdx]?.trim()
    const type = values[typeIdx]?.trim().toLowerCase()
    const example = values[exampleIdx]?.trim()
    
    if (!german || !english || !type || !example) {
      continue // Skip rows with missing required fields
    }
    
    // Validate type
    if (!['verb', 'noun', 'adjective'].includes(type)) {
      console.warn(`Invalid type "${type}" for word "${german}". Skipping.`)
      continue
    }
    
    const word: Word = {
      german,
      english,
      type: type as 'verb' | 'noun' | 'adjective',
      example,
      context: contextIdx >= 0 ? values[contextIdx]?.trim() : undefined,
      article: articleIdx >= 0 && type === 'noun' ? (values[articleIdx]?.trim() as 'der' | 'die' | 'das' | undefined) : undefined
    }
    
    words.push(word)
  }
  
  return words
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      values.push(current)
      current = ''
    } else {
      current += char
    }
  }
  
  values.push(current) // Add last value
  return values
}

/**
 * Parse a word object from JSON, handling various formats
 */
function parseWordObject(item: any): Word {
  // Required fields
  if (!item.german || !item.english || !item.type || !item.example) {
    throw new Error(`Word missing required fields. Required: german, english, type, example. Got: ${JSON.stringify(item)}`)
  }
  
  // Validate type
  if (!['verb', 'noun', 'adjective'].includes(item.type.toLowerCase())) {
    throw new Error(`Invalid word type: "${item.type}". Must be: verb, noun, or adjective`)
  }
  
  const word: Word = {
    german: String(item.german).trim(),
    english: String(item.english).trim(),
    type: item.type.toLowerCase() as 'verb' | 'noun' | 'adjective',
    example: String(item.example).trim(),
    context: item.context ? String(item.context).trim() : undefined,
    article: item.article && item.type.toLowerCase() === 'noun' 
      ? (String(item.article).trim().toLowerCase() as 'der' | 'die' | 'das')
      : undefined
  }
  
  return word
}

/**
 * Parse dictionary file based on file type
 */
export async function parseDictionaryFile(file: File): Promise<Word[]> {
  const fileName = file.name.toLowerCase()
  const content = await file.text()
  
  if (fileName.endsWith('.json')) {
    return parseJSONDictionary(content)
  } else if (fileName.endsWith('.csv')) {
    return parseCSVDictionary(content)
  } else {
    throw new Error('Unsupported file format. Please upload a JSON or CSV file.')
  }
}

