import { createCanvas } from 'canvas'
import fs from 'fs'
import path from 'path'

const ICON_SIZES = [16, 48, 128]
const ICON_COLOR = '#3B82F6' // Blue-500 from Tailwind

function generateIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  // Background
  ctx.fillStyle = ICON_COLOR
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
  ctx.fill()

  // "D" letter
  ctx.fillStyle = '#FFFFFF'
  ctx.font = `bold ${size * 0.6}px system-ui, -apple-system, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('D', size / 2, size / 2)

  return canvas
}

// Create icons directory if it doesn't exist
const iconsDir = path.join(process.cwd(), 'public', 'icons')
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
}

// Generate icons for each size
ICON_SIZES.forEach(size => {
  const canvas = generateIcon(size)
  const buffer = canvas.toBuffer('image/png')
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), buffer)
  console.log(`Generated icon${size}.png`)
})
