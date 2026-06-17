/**
 * Generează imagini promo IAP distincte (fără iconița app) pentru ASC 2.3.2.
 * Înlocuiește cu capturi reale din paywall când le ai din TestFlight.
 *
 * Usage: node scripts/generate-asc-promo-placeholders.mjs
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const outDir = path.join('marketing', 'app-store', 'export', 'promo-images');
const bg = '#0f172a';
const accent = '#4ade80';

const plans = [
  {
    out: 'kheya-pro-monthly-promo.png',
    title: 'KHEYA Pro',
    plan: 'Lunar / Monthly',
    price: 'Abonament lunar',
    features: ['Capitole EN si BAC', 'Teste nelimitate', 'Audio teorie'],
  },
  {
    out: 'kheya-pro-yearly-promo.png',
    title: 'KHEYA Pro',
    plan: 'Anual / Yearly',
    price: 'Abonament anual',
    features: ['Tot continutul Pro', 'Economisesti vs lunar', 'EN si Bacalaureat'],
  },
];

const sizes = [
  { suffix: '', width: 1290, height: 2796 },
  { suffix: '-1024', width: 1024, height: 1024 },
];

fs.mkdirSync(outDir, { recursive: true });

for (const plan of plans) {
  for (const { suffix, width, height } of sizes) {
    const featureLines = plan.features
      .map((f, i) => {
        const y = 520 + i * 56;
        return `<text x="80" y="${y}" fill="#e2e8f0" font-size="36" font-family="Arial, sans-serif">+ ${f}</text>`;
      })
      .join('');

    const svg = Buffer.from(
      `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${bg}"/>
        <rect x="48" y="48" width="${width - 96}" height="${height - 96}" rx="32" fill="#1e293b" stroke="#334155" stroke-width="2"/>
        <text x="50%" y="180" text-anchor="middle" fill="#f8fafc" font-size="${Math.round(width * 0.07)}" font-family="Arial, sans-serif" font-weight="700">${plan.title}</text>
        <text x="50%" y="280" text-anchor="middle" fill="${accent}" font-size="${Math.round(width * 0.055)}" font-family="Arial, sans-serif" font-weight="700">${plan.plan}</text>
        <text x="50%" y="360" text-anchor="middle" fill="#94a3b8" font-size="${Math.round(width * 0.035)}" font-family="Arial, sans-serif">${plan.price}</text>
        <rect x="80" y="420" width="${width - 160}" height="4" fill="#334155"/>
        ${featureLines}
        <text x="50%" y="${height - 120}" text-anchor="middle" fill="#64748b" font-size="28" font-family="Arial, sans-serif">KHEYA – Unlock Your Future</text>
      </svg>`,
    );

    const baseName = plan.out.replace('.png', '');
    const outPath = path.join(outDir, `${baseName}${suffix}.png`);

    await sharp(svg).png({ compressionLevel: 9 }).toFile(outPath);
    const meta = await sharp(outPath).metadata();
    console.log(`✓ ${outPath} → ${meta.width}x${meta.height}`);
  }
}

console.log('\nUpload kheya-pro-monthly-promo*.png to KHEYA_pro_monthly and yearly to KHEYA_pro_yearly in ASC.');
console.log('Replace with real paywall screenshots when available from TestFlight.');
