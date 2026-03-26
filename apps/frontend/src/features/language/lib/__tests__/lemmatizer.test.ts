import { describe, expect, it } from 'vitest'
import { extractArticle, lemmatizeAdjective, lemmatizeNoun, lemmatizeVerb, lemmatizeWord } from '../lemmatizer'

describe('lemmatizer', () => {
  it('lemmatizes common verb forms to infinitive', () => {
    expect(lemmatizeVerb('geht')).toBe('gehen')
    expect(lemmatizeVerb('machte')).toBe('machen')
  })

  it('lemmatizes noun and preserves capitalization', () => {
    expect(lemmatizeNoun('Häuser')).toBe('Häus')
    expect(lemmatizeNoun('baum')).toBe('Baum')
  })

  it('lemmatizes adjective endings', () => {
    expect(lemmatizeAdjective('schönen')).toBe('schön')
    expect(lemmatizeAdjective('klar')).toBe('klar')
  })

  it('dispatches by word type', () => {
    expect(lemmatizeWord('geht', 'verb')).toBe('gehen')
    expect(lemmatizeWord('Häuser', 'noun')).toBe('Häus')
    expect(lemmatizeWord('schönen', 'adjective')).toBe('schön')
  })

  it('extracts german noun articles from context', () => {
    expect(extractArticle('Mann', 'Der Mann liest ein Buch.', 'noun')).toBe('der')
    expect(extractArticle('Katze', 'Die Katze schläft.', 'noun')).toBe('die')
    expect(extractArticle('Haus', 'Das Haus ist neu.', 'noun')).toBe('das')
    expect(extractArticle('gehen', 'Ich gehe nach Hause.', 'verb')).toBeUndefined()
  })
})
