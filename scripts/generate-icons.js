// Simple script to generate PWA icons
// This creates basic placeholder icons
// For production, replace these with proper designed icons

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Create a simple SVG icon
function createSVGIcon(size, text) {
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.2}"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.3}" 
        font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${text}</text>
</svg>`
}

// For now, we'll create SVG files
// Note: For production PWA, you should convert these to PNG
// You can use online tools like https://cloudconvert.com/svg-to-png
// or install sharp: npm install sharp

const publicDir = path.join(__dirname, '..', 'public')

// Create SVG icons (these will work but PNG is preferred for PWA)
fs.writeFileSync(
  path.join(publicDir, 'icon-192.svg'),
  createSVGIcon(192, 'DE')
)

fs.writeFileSync(
  path.join(publicDir, 'icon-512.svg'),
  createSVGIcon(512, 'DE')
)

console.log('SVG icons created in public/ directory!')
console.log('')
console.log('To generate PNG icons (required for PWA):')
console.log('  1. Open scripts/generate-icons.html in your browser')
console.log('  2. Click the download buttons to save icon-192.png and icon-512.png')
console.log('  3. Move the downloaded PNG files to the public/ directory')
console.log('')
console.log('Alternatively, convert SVG to PNG using:')
console.log('  - Online: https://cloudconvert.com/svg-to-png')
console.log('  - Or install sharp: npm install sharp (then update this script)')

