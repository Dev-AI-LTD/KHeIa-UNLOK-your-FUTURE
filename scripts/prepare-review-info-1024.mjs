import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const src = process.argv[2];
if (!src) {
  console.error('Usage: node scripts/prepare-review-info-1024.mjs <source-image>');
  process.exit(1);
}

const outDir = path.join('marketing', 'app-store', 'export', 'review-info');
const bg = '#1e293b';
const size = 1024;

fs.mkdirSync(outDir, { recursive: true });

const meta = await sharp(src).metadata();
const scale = Math.min(size / meta.width, size / meta.height);
const w = Math.round(meta.width * scale);
const h = Math.round(meta.height * scale);
const left = Math.round((size - w) / 2);
const top = Math.round((size - h) / 2);

const resized = await sharp(src)
  .resize(w, h, { fit: 'inside', kernel: 'lanczos3' })
  .flatten({ background: bg })
  .toBuffer();

const canvas = await sharp({
  create: {
    width: size,
    height: size,
    channels: 3,
    background: bg,
  },
})
  .composite([{ input: resized, left, top }])
  .flatten({ background: bg })
  .toColourspace('srgb')
  .removeAlpha()
  .withMetadata({ density: 72 })
  .png({ compressionLevel: 9, force: true })
  .toBuffer();

const pngPath = path.join(outDir, 'kheya-pro-paywall-review-1024x1024.png');
const jpgPath = path.join(outDir, 'kheya-pro-paywall-review-1024x1024.jpg');

await sharp(canvas).png({ force: true }).toFile(pngPath);
await sharp(pngPath).jpeg({ quality: 92, chromaSubsampling: '4:4:4' }).withMetadata({ density: 72 }).toFile(jpgPath);

const outMeta = await sharp(pngPath).metadata();
console.log('PNG:', pngPath);
console.log('JPG:', jpgPath);
console.log('Dimensions:', `${outMeta.width}x${outMeta.height}`);
console.log('Density:', outMeta.density);
console.log('Channels:', outMeta.channels);
