/**
 * Corectează capturi paywall pentru ASC Review Information:
 * - înlocuiește prețuri USD sandbox cu 29 RON/lună și 249 RON/an
 * - înlocuiește „Google Play” cu „App Store” în footer
 *
 * Usage: node scripts/fix-paywall-review-screenshot.mjs <input> <output>
 */
import fs from 'fs';
import sharp from 'sharp';

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error('Usage: node scripts/fix-paywall-review-screenshot.mjs <input> <output>');
  process.exit(1);
}

if (!fs.existsSync(input)) {
  console.error('Missing:', input);
  process.exit(1);
}

function buildFixSvg(width, height) {
  const patch = '#2a3148';
  const priceFont = Math.round(width * 0.058);
  const footerFont = Math.round(width * 0.034);
  const annualX = width * 0.06;
  const annualW = width * 0.38;
  const monthlyX = width * 0.56;
  const monthlyW = width * 0.38;
  const priceY = height * 0.668;
  const priceH = height * 0.072;
  const annualTextX = width * 0.26;
  const monthlyTextX = width * 0.75;
  const priceTextY = height * 0.706;
  const footerY = height * 0.776;
  const footerH = height * 0.048;

  return Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${annualX}" y="${priceY}" width="${annualW}" height="${priceH}" fill="${patch}"/>
      <rect x="${monthlyX}" y="${priceY}" width="${monthlyW}" height="${priceH}" fill="${patch}"/>
      <text x="${annualTextX}" y="${priceTextY}" text-anchor="middle" fill="#f8fafc" font-size="${priceFont}" font-weight="700" font-family="Arial, sans-serif">249 RON/an</text>
      <text x="${monthlyTextX}" y="${priceTextY}" text-anchor="middle" fill="#f8fafc" font-size="${priceFont}" font-weight="700" font-family="Arial, sans-serif">29 RON/lună</text>
      <rect x="${width * 0.08}" y="${footerY}" width="${width * 0.84}" height="${footerH}" fill="#1a1f35"/>
      <text x="50%" y="${footerY + footerH * 0.72}" text-anchor="middle" fill="#94a3b8" font-size="${footerFont}" font-family="Arial, sans-serif">Abonamentul se reînnoiește automat. Poți anula oricând din App Store.</text>
    </svg>`,
  );
}

const meta = await sharp(input).metadata();
const { width, height } = meta;
const overlay = buildFixSvg(width, height);

await sharp(input)
  .composite([{ input: overlay, blend: 'over' }])
  .png()
  .toFile(output);

console.log(`✓ ${output} (${width}x${height}) — prețuri RON + App Store`);
