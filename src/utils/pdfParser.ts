import * as pdfjsLib from 'pdfjs-dist'
import { apiUpload } from './apiClient'

// Set worker path
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

export interface PDFInfo {
  text: string
  pageCount: number
}

export async function getPDFInfo(file: File): Promise<PDFInfo> {
  try {
    const formData = new FormData()
    formData.append('file', file)
    const backend = await apiUpload<PDFInfo>('/api/v1/pdf/text', formData)
    if (backend?.text) {
      return backend
    }
  } catch {
    // Fall back to in-browser parsing
  }

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const pageCount = pdf.numPages
  let fullText = ''

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ')
    fullText += pageText + ' '
  }

  return {
    text: fullText.trim(),
    pageCount
  }
}

export async function extractTextFromPDF(file: File): Promise<string> {
  const info = await getPDFInfo(file)
  return info.text
}

