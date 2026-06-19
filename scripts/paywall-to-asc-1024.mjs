/**
 * Convertește capturi paywall din app în imagini ASC 1024×1024.
 * Usage:
 *   node scripts/paywall-to-asc-1024.mjs <monthly> <yearly>
 *   node scripts/paywall-to-asc-1024.mjs --review <monthly> <yearly>
 *
 * --review → output *-review-1024.png (capturi reale din app pentru Review Information)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const reviewMode = args[0] === '--review';
const fixMode = args.includes('--fix');
const fileArgs = args.filter((a) => !a.startsWith('--'));
const [monthlySrc, yearlySrc] = reviewMode ? fileArgs : fileArgs;

if (!monthlySrc || !yearlySrc) {
  console.error('Usage: node scripts/paywall-to-asc-1024.mjs [--review] [--fix] <monthly> <yearly>');
  process.exit(1);
}

const outDir = path.join('marketing', 'app-store', 'export', 'promo-images');
const tmpDir = path.join(outDir, '.tmp-review');
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(tmpDir, { recursive: true });

async function fixPaywallScreenshot(input, output) {
  const fixScript = path.join(__dirname, 'fix-paywall-review-screenshot.mjs');
  const { spawnSync } = await import('child_process');
  const r = spawnSync(process.execPath, [fixScript, input, output], { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

async function toSquare1024(input, output) {
  const size = 1024;
  const padding = 16;
  const inner = size - padding * 2;

  const resized = await sharp(input).resize(inner, inner, { fit: 'inside' }).png().toBuffer();
  const meta = await sharp(resized).metadata();
  const left = Math.round((size - meta.width) / 2);
  const top = Math.round((size - meta.height) / 2);

  const bg = Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#1e1b4b"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
    </svg>`,
  );

  await sharp(bg)
    .composite([{ input: resized, left, top }])
    .flatten({ background: '#0f172a' })
    .toColourspace('srgb')
    .removeAlpha()
    .withMetadata({ density: 72 })
    .png({ compressionLevel: 9, force: true })
    .toFile(output);

  const m = await sharp(output).metadata();
  if (m.width !== size || m.height !== size) {
    throw new Error(`${output}: expected ${size}x${size}, got ${m.width}x${m.height}`);
  }
  if (m.hasAlpha) {
    throw new Error(`${output}: alpha channel still present`);
  }
  console.log(`✓ ${output} → ${m.width}x${m.height}, ${m.density ?? '?'} dpi, RGB`);
}

const suffix = reviewMode ? 'review' : 'promo';
const jobs = [
  { src: monthlySrc, out: `kheya-pro-monthly-${suffix}-1024.png` },
  { src: yearlySrc, out: `kheya-pro-yearly-${suffix}-1024.png` },
];

for (const { src, out } of jobs) {
  if (!fs.existsSync(src)) {
    console.error('Missing:', src);
    process.exit(1);
  }
  let input = src;
  if (fixMode) {
    const fixed = path.join(tmpDir, path.basename(out, '.png') + '-fixed.png');
    await fixPaywallScreenshot(src, fixed);
    input = fixed;
  }
  await toSquare1024(input, path.join(outDir, out));
}

if (fs.existsSync(tmpDir)) {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

const label = reviewMode ? 'Review Information → Screenshot' : 'Promotional Image';
console.log(`\nUpload to ASC (${label}, 1024×1024):`);
console.log(`  kheya-pro-monthly-${suffix}-1024.png → KHEYA_pro_monthly`);
console.log(`  kheya-pro-yearly-${suffix}-1024.png → KHEYA_pro_yearly`);
