import type { ReadingLine, ReadingContent } from '../types'

/**
 * Extract text line-by-line from PDF (preserving all lines, no skipping)
 */
export async function extractLinesFromPDF(file: File): Promise<ReadingContent> {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
  
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const pageCount = pdf.numPages
  
  const allLines: ReadingLine[] = []
  let lineNumber = 1
  
  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    
    // Extract text items with their positions
    const textItems = textContent.items as Array<{ str: string; y: number }>
    
    // Group items by Y position (same line)
    const linesByY = new Map<number, string[]>()
    
    textItems.forEach((item: any) => {
      const y = Math.round(item.y || 0)
      if (!linesByY.has(y)) {
        linesByY.set(y, [])
      }
      linesByY.get(y)!.push(item.str)
    })
    
    // Sort by Y position (top to bottom) and create lines
    const sortedYs = Array.from(linesByY.keys()).sort((a, b) => b - a)
    
    sortedYs.forEach(y => {
      const lineText = linesByY.get(y)!.join(' ').trim()
      if (lineText.length > 0) {
        allLines.push({
          lineNumber: lineNumber++,
          original: lineText,
          translation: '',  // Will be filled by AI
          words: []
        })
      }
    })
  }
  
  return {
    moduleName: file.name.replace('.pdf', ''),
    title: file.name.replace('.pdf', ''),
    source: file.name,
    totalLines: allLines.length,
    lines: allLines,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 'beta',
    currentLineIndex: 0
  }
}

/**
 * Export reading content as JSON file
 */
export function exportReadingContent(content: ReadingContent): void {
  const json = JSON.stringify(content, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${content.title}-reading.json`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Parse reading content from JSON file
 */
export async function parseReadingContent(file: File): Promise<ReadingContent> {
  const text = await file.text()
  const content = JSON.parse(text) as ReadingContent
  
  // Validate structure
  if (!content.lines || !Array.isArray(content.lines)) {
    throw new Error('Invalid reading content format: missing lines array')
  }
  
  if (content.lines.some(line => !line.original || line.translation === undefined)) {
    throw new Error('Invalid reading content format: missing original or translation')
  }
  
  // Ensure required fields exist
  if (!content.moduleName) {
    content.moduleName = content.title || file.name.replace('.json', '')
  }
  if (!content.currentLineIndex) {
    content.currentLineIndex = 0
  }
  if (!content.updatedAt) {
    content.updatedAt = content.createdAt || new Date().toISOString()
  }
  
  return content
}

