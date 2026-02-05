import Tesseract from 'tesseract.js'

/**
 * Extract text from an uploaded image (handwritten notes, screenshots, etc.)
 * Uses Tesseract.js entirely in the browser.
 *
 * NOTE: You need to install the dependency in your project:
 *   npm install tesseract.js
 */
export async function extractTextFromImage(file: File): Promise<string> {
  const { data } = await Tesseract.recognize(file, 'deu+eng', {
    // Treat the image as a block of text; works better for notes pages
    tessedit_pageseg_mode: 6,
    logger: () => {
      // Silence detailed logs in production; adjust if you want a progress bar
    }
  })

  const text = (data.text || '').trim()
  return text
}


