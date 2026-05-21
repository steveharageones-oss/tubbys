// Ad generator for Tubby's Tumblerz
// Usage: node generate-ad.js "tumbler-photo.png" "Product Name" [price]
// Output: ig-posts/ad-product-name.png

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const inputPhoto = process.argv[2];
const productName = process.argv[3];
const price = process.argv[4] || '38';

if (!inputPhoto || !productName) {
  console.log('Usage: node generate-ad.js <photo-path> "Product Name" [price]');
  process.exit(1);
}

const outputDir = path.join(__dirname, 'ig-posts');
fs.mkdirSync(outputDir, { recursive: true });
const safeName = productName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
const outputPath = path.join(outputDir, `ad-${safeName}.png`);

// Brand colors
const BLUE = '#005A9C';
const CYAN = '#00B4D8';
const LIGHT = '#90E0EF';
const DARK = '#023E8A';

// Canvas size = Instagram square 1080x1080
const SIZE = 1080;
const PADDING = 60;

async function createAd() {
  // Load and resize the product photo to fill the canvas
  const productImage = await sharp(inputPhoto)
    .resize(SIZE, SIZE, { fit: 'cover', position: 'center' })
    .png()
    .toBuffer();

  // Create branded overlay
  const overlay = await sharp({
    create: {
      width: SIZE,
      height: SIZE,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([
      {
        // Left accent bar
        input: await sharp({
          create: {
            width: 8,
            height: SIZE,
            channels: 4,
            background: { r: 0, g: 180, b: 216, alpha: 0.9 }
          }
        }).png().toBuffer(),
        left: 0,
        top: 0
      },
      {
        // Bottom gradient bar for text
        input: await sharp({
          create: {
            width: SIZE,
            height: 240,
            channels: 4,
            background: { r: 0, g: 90, b: 156, alpha: 0.85 }
          }
        }).png().toBuffer(),
        left: 0,
        top: SIZE - 240
      }
    ])
    .png()
    .toBuffer();

  // Composite product + overlay
  const result = await sharp(productImage)
    .composite([{ input: overlay, top: 0, left: 0 }])
    .png()
    .toBuffer();

  // Add text using SVG overlay
  const textOverlay = `<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#00B4D8" stop-opacity="0.9"/>
        <stop offset="100%" stop-color="#005A9C" stop-opacity="0.9"/>
      </linearGradient>
    </defs>

    <!-- Bottom bar glow -->
    <rect x="0" y="840" width="${SIZE}" height="240" fill="url(#glow)" rx="0"/>

    <!-- Tubby's Tumblerz logo text -->
    <text x="${SIZE/2}" y="${SIZE - 160}" text-anchor="middle" 
          font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#90E0EF" opacity="0.9">
      TUBBY'S TUMBLERZ
    </text>

    <!-- Product name -->
    <text x="${SIZE/2}" y="${SIZE - 110}" text-anchor="middle" 
          font-family="Arial, sans-serif" font-size="52" font-weight="bold" fill="white">
      ${escapeXml(productName)}
    </text>

    <!-- Price -->
    <text x="${SIZE/2}" y="${SIZE - 55}" text-anchor="middle" 
          font-family="Arial, sans-serif" font-size="30" font-weight="bold" fill="#90E0EF">
      $${price} · Handcrafted in USA
    </text>

    <!-- CTA -->
    <text x="${SIZE/2}" y="${SIZE - 20}" text-anchor="middle" 
          font-family="Arial, sans-serif" font-size="22" fill="white" opacity="0.8">
      tubbystumblerz.com
    </text>
  </svg>`;

  await sharp(result)
    .composite([{ input: Buffer.from(textOverlay), top: 0, left: 0 }])
    .png()
    .toFile(outputPath);

  console.log(outputPath);
}

function escapeXml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

createAd().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});