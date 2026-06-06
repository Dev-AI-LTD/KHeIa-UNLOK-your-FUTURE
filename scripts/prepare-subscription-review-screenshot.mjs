import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const src = process.argv[2];
if (!src) {
  console.error('Usage: node scripts/prepare-subscription-review-screenshot.mjs <source-image>');
  process.exit(1);
}

const bg = '#1e293b';
const outDir = path.join('marketing', 'app-store', 'export', 'subscription-review');

const sizes = [
  { name: '1284x2778-6.5-inch', width: 1284, height: 2778 },
  { name: '1290x2796-6.7-inch', width: 1290, height: 2796 },
  { name: '1320x2868-6.9-inch', width: 1320, height: 2868 },
];

fs.mkdirSync(outDir, { recursive: true });

for (const { name, width, height } of sizes) {
  const outPath = path.join(outDir, `kheya-pro-paywall-${name}.png`);

  await sharp(src)
    .resize(width, height, { fit: 'cover', position: 'centre', kernel: 'lanczos3' })
    .flatten({ background: bg })
    .toColourspace('srgb')
    .removeAlpha()
    .withMetadata({ density: 72 })
    .png({ compressionLevel: 9, force: true })
    .toFile(outPath);

  const meta = await sharp(outPath).metadata();
  console.log(`✓ ${outPath} → ${meta.width}x${meta.height}`);
}

console.log('\nUpload the file that matches your App Store Connect display slot (usually 6.7" or 6.5").');
