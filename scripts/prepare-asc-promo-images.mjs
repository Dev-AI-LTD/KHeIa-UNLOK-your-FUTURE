/**
 * Generează imagini promo IAP distincte pentru monthly vs yearly (ASC 2.3.2).
 * Usage: node scripts/prepare-asc-promo-images.mjs <monthly-source.png> <yearly-source.png>
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const [monthlySrc, yearlySrc] = process.argv.slice(2);
if (!monthlySrc || !yearlySrc) {
  console.error('Usage: node scripts/prepare-asc-promo-images.mjs <monthly.png> <yearly.png>');
  process.exit(1);
}

const outDir = path.join('marketing', 'app-store', 'export', 'promo-images');
const width = 1290;
const height = 2796;
const bg = '#1e293b';

const labels = [
  { src: monthlySrc, out: 'kheya-pro-monthly-promo.png', title: 'KHEYA Pro Monthly', subtitle: 'Lunar · EN & BAC' },
  { src: yearlySrc, out: 'kheya-pro-yearly-promo.png', title: 'KHEYA Pro Yearly', subtitle: 'Anual · EN & BAC' },
];

fs.mkdirSync(outDir, { recursive: true });

for (const { src, out, title, subtitle } of labels) {
  const labelSvg = Buffer.from(
    `<svg width="${width}" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="rgba(15,23,42,0.85)"/>
      <text x="50%" y="42%" text-anchor="middle" fill="#f8fafc" font-size="52" font-family="Arial, sans-serif" font-weight="700">${title}</text>
      <text x="50%" y="68%" text-anchor="middle" fill="#4ade80" font-size="36" font-family="Arial, sans-serif">${subtitle}</text>
    </svg>`,
  );

  const outPath = path.join(outDir, out);
  await sharp(src)
    .resize(width, height, { fit: 'cover', position: 'centre' })
    .flatten({ background: bg })
    .composite([{ input: labelSvg, gravity: 'south' }])
    .toColourspace('srgb')
    .removeAlpha()
    .png({ compressionLevel: 9 })
    .toFile(outPath);

  const meta = await sharp(outPath).metadata();
  console.log(`✓ ${outPath} → ${meta.width}x${meta.height}`);

  const squarePath = path.join(outDir, out.replace('.png', '-1024.png'));
  await sharp(outPath)
    .resize(1024, 1024, { fit: 'cover', position: 'centre' })
    .png({ compressionLevel: 9 })
    .toFile(squarePath);
  console.log(`✓ ${squarePath} → 1024x1024`);
}

console.log('\nUpload monthly and yearly files to separate subscriptions in App Store Connect.');
