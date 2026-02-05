/**
 * German lemmatization utility
 * Converts inflected words to their base/infinite form
 */

// Common German verb endings and their infinitive forms
const VERB_CONJUGATIONS: Record<string, string> = {
  // Present tense
  'st': '', // 2nd person singular -> remove 'st', add 'en'
  't': '',  // 3rd person singular -> remove 't', add 'en'
  'en': '', // Already infinitive or plural
  'e': '',  // 1st person singular -> remove 'e', add 'en'
  'n': '',  // Sometimes infinitive
  
  // Past tense
  'te': '', // Simple past -> remove 'te', add 'en'
  'ten': '', // Past plural -> remove 'ten', add 'en'
  'test': '', // 2nd person past -> remove 'test', add 'en'
  'tet': '', // 2nd person plural past -> remove 'tet', add 'en'
  
  // Past participle
  't': '', // Past participle (ge-...-t) -> remove 't', add 'en'
  'et': '', // Past participle with e -> remove 'et', add 'en'
}

// Common noun endings that should be removed
const NOUN_ENDINGS = ['e', 'en', 'er', 'ern', 'es', 'n', 's']

// Common adjective endings
const ADJECTIVE_ENDINGS = ['e', 'en', 'er', 'es', 'em', 'n']

/**
 * Lemmatize a German verb to its infinitive form
 */
export function lemmatizeVerb(word: string): string {
  const lowerWord = word.toLowerCase()
  
  // If already ends with 'en', it's likely already infinitive
  if (lowerWord.endsWith('en') && lowerWord.length > 3) {
    return lowerWord // Verbs are lowercase in infinitive form
  }
  
  // Remove common verb endings and add 'en'
  // Sort by length (longest first) to match longer endings first
  const endings = Object.keys(VERB_CONJUGATIONS).sort((a, b) => b.length - a.length)
  for (const ending of endings) {
    if (lowerWord.endsWith(ending) && lowerWord.length > ending.length + 2) {
      const stem = lowerWord.slice(0, -ending.length)
      return stem + 'en'
    }
  }
  
  // Default: add 'en' if it doesn't end with it
  if (!lowerWord.endsWith('en')) {
    return lowerWord + 'en'
  }
  
  return lowerWord
}

/**
 * Lemmatize a German noun to its base form
 */
export function lemmatizeNoun(word: string): string {
  const lowerWord = word.toLowerCase()
  
  // Remove common plural endings
  for (const ending of NOUN_ENDINGS) {
    if (lowerWord.endsWith(ending) && lowerWord.length > ending.length + 2) {
      const stem = lowerWord.slice(0, -ending.length)
      // Check if removing the ending makes sense (stem should be at least 3 chars)
      if (stem.length >= 3) {
        // Capitalize first letter (German nouns are capitalized)
        return stem.charAt(0).toUpperCase() + stem.slice(1)
      }
    }
  }
  
  // Return capitalized word (nouns are capitalized in German)
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
}

/**
 * Lemmatize a German adjective to its base form
 */
export function lemmatizeAdjective(word: string): string {
  const lowerWord = word.toLowerCase()
  
  // Remove common adjective endings
  for (const ending of ADJECTIVE_ENDINGS) {
    if (lowerWord.endsWith(ending) && lowerWord.length > ending.length + 2) {
      const stem = lowerWord.slice(0, -ending.length)
      if (stem.length >= 3) {
        return stem
      }
    }
  }
  
  return lowerWord
}

/**
 * Lemmatize a word based on its type
 */
export function lemmatizeWord(word: string, type: 'verb' | 'noun' | 'adjective'): string {
  switch (type) {
    case 'verb':
      return lemmatizeVerb(word)
    case 'noun':
      return lemmatizeNoun(word)
    case 'adjective':
      return lemmatizeAdjective(word)
    default:
      return word.toLowerCase()
  }
}

/**
 * Extract German article (der/die/das) from context
 * This is a simple heuristic - in production, you'd want a more sophisticated approach
 */
export function extractArticle(word: string, context: string, type: 'verb' | 'noun' | 'adjective'): 'der' | 'die' | 'das' | undefined {
  if (type !== 'noun') {
    return undefined
  }
  
  // Look for article before the word in context
  const lowerContext = context.toLowerCase()
  const lowerWord = word.toLowerCase()
  const wordIndex = lowerContext.indexOf(lowerWord)
  
  if (wordIndex === -1) {
    return undefined
  }
  
  // Look for article in the 10 characters before the word
  const beforeWord = lowerContext.substring(Math.max(0, wordIndex - 15), wordIndex).trim()
  
  // Check for articles
  if (beforeWord.endsWith('der ') || beforeWord.endsWith('der\n') || beforeWord.endsWith('der\t')) {
    return 'der'
  }
  if (beforeWord.endsWith('die ') || beforeWord.endsWith('die\n') || beforeWord.endsWith('die\t')) {
    return 'die'
  }
  if (beforeWord.endsWith('das ') || beforeWord.endsWith('das\n') || beforeWord.endsWith('das\t')) {
    return 'das'
  }
  
  // Check for declined forms (dem, den, des, etc.)
  if (beforeWord.endsWith('dem ') || beforeWord.endsWith('den ') || beforeWord.endsWith('des ')) {
    return 'der' // These are forms of 'der'
  }
  if (beforeWord.endsWith('der ')) {
    return 'die' // Plural form of 'die'
  }
  
  return undefined
}

