# PWA Icon Setup Instructions

## Quick Setup (Recommended)

1. Open `scripts/generate-icons.html` in your web browser
2. Click "Download icon-192.png" button
3. Click "Download icon-512.png" button
4. Move both downloaded PNG files to this `public/` directory
5. Done! Your PWA icons are ready.

## Alternative Methods

### Method 1: Online Converter
1. Go to https://cloudconvert.com/svg-to-png
2. Upload `icon-192.svg` and convert to PNG (192x192)
3. Upload `icon-512.svg` and convert to PNG (512x512)
4. Save both PNG files to this `public/` directory

### Method 2: Using ImageMagick (if installed)
```bash
convert icon-192.svg -resize 192x192 icon-192.png
convert icon-512.svg -resize 512x512 icon-512.png
```

### Method 3: Design Your Own
Create custom icons (192x192 and 512x512 PNG files) with your own design and save them as:
- `icon-192.png`
- `icon-512.png`

## Note
The SVG files are placeholders. For the PWA to work properly on iOS and Android, you need PNG files.

