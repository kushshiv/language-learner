import { describe, expect, it } from 'vitest'
import { parseCSVDictionary, parseJSONDictionary } from '../dictionaryParser'

describe('dictionaryParser', () => {
  it('parses JSON array dictionary payload', () => {
    const content = JSON.stringify([
      {
        german: 'Haus',
        english: 'house',
        type: 'NOUN',
        example: 'Das Haus ist groß',
        context: 'The house is big',
        article: 'das'
      }
    ])

    const result = parseJSONDictionary(content)
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      german: 'Haus',
      english: 'house',
      type: 'noun',
      article: 'das'
    })
  })

  it('parses CSV dictionary payload with optional columns', () => {
    const content = [
      'german,english,type,example,context,article',
      '"Katze","cat","noun","Die Katze schläft","The cat sleeps","die"'
    ].join('\n')

    const result = parseCSVDictionary(content)
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      german: 'Katze',
      english: 'cat',
      type: 'noun',
      article: 'die'
    })
  })

  it('throws for invalid JSON payload', () => {
    expect(() => parseJSONDictionary('{not-valid-json')).toThrow('Invalid JSON format')
  })

  it('throws when required CSV columns are missing', () => {
    const content = ['german,english,type', 'Haus,house,noun'].join('\n')
    expect(() => parseCSVDictionary(content)).toThrow('Missing required columns')
  })
})
