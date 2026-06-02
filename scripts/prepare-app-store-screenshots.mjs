/**
 * Redimensionează capturi din marketing/app-store/source/ la dimensiuni App Store.
 *
 * Usage:
 *   node scripts/prepare-app-store-screenshots.mjs
 *
 * Pune PNG/JPG în: marketing/app-store/source/
 * Output: marketing/app-store/export/1284x2778/ și 1242x2688/
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const sourceDir = path.join(root, 'marketing', 'app-store', 'source');
const sizes = [
  { name: '1284x2778', width: 1284, height: 2778 },
  { name: '1242x2688', width: 1242, height: 2688 },
];

const ORDER = [
  '01-home',
  '02-istorie-capitole',
  '03-teorie',
  '04-quiz-intrebare',
  '05-quiz-corect',
  '06-teste',
  '07-kheia-chatbot',
  '08-chat-global',
  '09-profil',
  '10-statistici',
  '11-genereaza-capitol',
];

async function loadSharp() {
  try {
    return (await import('sharp')).default;
  } catch {
    console.error(
      'Lipsește sharp. Rulează: npm install sharp --save-dev\n' +
        'Sau redimensionează manual în Figma la 1284×2778.',
    );
    process.exit(1);
  }
}

function listImages(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
    .sort();
}

/** Cover resize: fill target, crop center */
async function resizeCover(sharp, inputPath, outPath, width, height) {
  await sharp(inputPath)
    .resize(width, height, { fit: 'cover', position: 'centre' })
    .png({ compressionLevel: 9 })
    .toFile(outPath);
}

async function main() {
  fs.mkdirSync(sourceDir, { recursive: true });

  const sharp = await loadSharp();
  const files = listImages(sourceDir);

  if (files.length === 0) {
    console.log(`Nu există imagini în:\n  ${sourceDir}\n`);
    console.log('Copiază capturile de pe telefon și redenumește-le (ex. 01-home.png).');
    console.log('\nOrdine recomandată:');
    ORDER.forEach((name) => console.log(`  - ${name}.png`));
    process.exit(0);
  }

  for (const size of sizes) {
    const outDir = path.join(root, 'marketing', 'app-store', 'export', size.name);
    fs.mkdirSync(outDir, { recursive: true });

    let index = 0;
    for (const file of files) {
      index += 1;
      const base = path.parse(file).name;
      const outName = `${String(index).padStart(2, '0')}-${base}.png`;
      const inputPath = path.join(sourceDir, file);
      const outPath = path.join(outDir, outName);
      await resizeCover(sharp, inputPath, outPath, size.width, size.height);
      console.log(`✓ ${size.name}/${outName}`);
    }
  }

  console.log('\nGata. Importă PNG-urile din export/1284x2778/ în Figma (frame 1284×2778).');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
