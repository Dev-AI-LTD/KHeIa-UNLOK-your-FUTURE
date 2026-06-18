/**
 * Generează imagini promo IAP stilizate (logo KHEYA + layout paywall) pentru ASC 2.3.2.
 * Distinct monthly vs yearly — nu folosește iconița app simplă.
 *
 * Usage: node scripts/generate-asc-promo-placeholders.mjs
 * Optional: node scripts/generate-asc-promo-placeholders.mjs path/to/paywall-screenshot.png
 *   → folosește captura paywall ca fundal blur + overlay plan
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const outDir = path.join(projectRoot, 'marketing', 'app-store', 'export', 'promo-images');
const logoPath = path.join(projectRoot, 'assets', 'KHEIA ICON.png');
const paywallArg = process.argv[2];

const features = [
  'Ascultă teoria nelimitat',
  'Quiz-uri cu 10 întrebări',
  'Toate capitolele, fără blocaje',
  'Fără reclame',
  'Progres EN și BAC',
];

const LOGO_SIZE_PORTRAIT = 220;
const LOGO_SIZE_SQUARE = 120;
const LOGO_TOP_PORTRAIT = 88;
const LOGO_TOP_SQUARE = 28;

const plans = [
  {
    out: 'kheya-pro-monthly-promo.png',
    planRo: 'LUNAR',
    planEn: 'Monthly',
    price: '29 RON/lună',
    priceRo: 'Acces complet, facturat lunar',
    badge: null,
    accent: '#60a5fa',
    borderAccent: '#3b82f6',
  },
  {
    out: 'kheya-pro-yearly-promo.png',
    planRo: 'ANUAL',
    planEn: 'Yearly',
    price: '249 RON/an',
    priceRo: 'Cel mai avantajos — economisești 99 RON',
    badge: 'Cel mai avantajos',
    accent: '#c4b5fd',
    borderAccent: '#8b5cf6',
  },
];

const sizes = [
  { suffix: '', width: 1290, height: 2796 },
  { suffix: '-1024', width: 1024, height: 1024 },
];

fs.mkdirSync(outDir, { recursive: true });

if (!fs.existsSync(logoPath)) {
  console.error('Logo not found:', logoPath);
  process.exit(1);
}

function scale(base, width, ref = 1290) {
  return Math.round(base * (width / ref));
}

function buildFeatureSvg(width, height, compact = false) {
  const startY = compact ? scale(268, width) : scale(740, width);
  const lineH = compact ? scale(46, width) : scale(68, width);
  const fontSize = compact ? scale(26, width) : scale(34, width);
  const checkR = compact ? scale(12, width) : scale(14, width);

  return features
    .map((f, i) => {
      const y = startY + i * lineH;
      const cx = scale(compact ? 72 : 56, width);
      return `
        <circle cx="${cx}" cy="${y - scale(10, width)}" r="${checkR}" fill="#8b5cf6"/>
        <text x="${cx}" y="${y - scale(4, width)}" text-anchor="middle" fill="#ffffff" font-size="${scale(compact ? 16 : 20, width)}" font-family="Arial, sans-serif">✓</text>
        <text x="${scale(compact ? 104 : 96, width)}" y="${y}" fill="#e2e8f0" font-size="${fontSize}" font-family="Arial, sans-serif">${f}</text>
      `;
    })
    .join('');
}

function buildPriceCardSvg(plan, width, cardY, cardH, pad, cardW) {
  const badge = plan.badge
    ? `
      <rect x="${width / 2 - scale(150, width)}" y="${cardY - scale(56, width)}" width="${scale(300, width)}" height="${scale(52, width)}" rx="26" fill="${plan.borderAccent}" stroke="#ffffff" stroke-width="2" stroke-opacity="0.25"/>
      <text x="50%" y="${cardY - scale(22, width)}" text-anchor="middle" fill="#ffffff" font-size="${scale(30, width)}" font-weight="700" font-family="Arial, sans-serif">${plan.badge}</text>
    `
    : '';

  const planFont = scale(60, width);
  const priceFont = scale(76, width);
  const subFont = scale(32, width);

  return `
    ${badge}
    <rect x="${pad - scale(5, width)}" y="${cardY - scale(5, width)}" width="${cardW + scale(10, width)}" height="${cardH + scale(10, width)}" rx="32" fill="${plan.borderAccent}"/>
    <rect x="${pad}" y="${cardY}" width="${cardW}" height="${cardH}" rx="28" fill="url(#cardFill)"/>
    <text x="50%" y="${cardY + scale(72, width)}" text-anchor="middle" fill="${plan.borderAccent}" font-size="${planFont}" font-weight="700" font-family="Arial, sans-serif">${plan.planRo}</text>
    <text x="50%" y="${cardY + scale(158, width)}" text-anchor="middle" fill="#0f172a" font-size="${priceFont}" font-weight="700" font-family="Arial, sans-serif">${plan.price}</text>
    <text x="50%" y="${cardY + scale(224, width)}" text-anchor="middle" fill="#475569" font-size="${subFont}" font-family="Arial, sans-serif">${plan.priceRo}</text>
  `;
}

function buildOverlaySvg(plan, width, height) {
  const isSquare = width === height;
  const cardH = isSquare ? scale(300, width) : scale(280, width);
  const pad = scale(isSquare ? 40 : 48, width);
  const cardW = width - pad * 2;
  const ctaH = scale(isSquare ? 84 : 88, width);
  const titleY = isSquare ? scale(200, width) : scale(540, width);
  const subtitleY = isSquare ? scale(242, width) : scale(608, width);
  const titleSize = isSquare ? scale(64, width) : scale(92, width);
  const subtitleSize = isSquare ? scale(28, width) : scale(34, width);

  const footerY = height - scale(isSquare ? 36 : 70, width);
  const ctaY =
    footerY -
    scale(isSquare ? 20 : 28, width) -
    ctaH -
    scale(isSquare ? 24 : 40, width);
  const cardY = ctaY - scale(isSquare ? 28 : 36, width) - cardH;

  return Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stop-color="#0f172a"/>
          <stop offset="45%" stop-color="#1e1b4b"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="22%" r="55%">
          <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="cardFill" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#f1f5f9"/>
          <stop offset="100%" stop-color="#e2e8f0"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>
      <rect width="100%" height="100%" fill="url(#glow)"/>
      <text x="50%" y="${titleY}" text-anchor="middle" fill="#f8fafc" font-size="${titleSize}" font-weight="700" font-family="Arial, sans-serif">KHEYA Pro</text>
      <text x="50%" y="${subtitleY}" text-anchor="middle" fill="#94a3b8" font-size="${subtitleSize}" font-family="Arial, sans-serif">Pregătire completă EN și BAC</text>
      ${buildFeatureSvg(width, height, isSquare)}
      ${buildPriceCardSvg(plan, width, cardY, cardH, pad, cardW)}
      <rect x="${pad}" y="${ctaY}" width="${cardW}" height="${ctaH}" rx="20" fill="#22c55e" stroke="#4ade80" stroke-width="2"/>
      <text x="50%" y="${ctaY + scale(isSquare ? 54 : 54, width)}" text-anchor="middle" fill="#ffffff" font-size="${scale(isSquare ? 34 : 38, width)}" font-weight="700" font-family="Arial, sans-serif">Abonează-te la KHEYA Pro</text>
      <text x="50%" y="${footerY}" text-anchor="middle" fill="#64748b" font-size="${scale(isSquare ? 22 : 26, width)}" font-family="Arial, sans-serif">KHEYA – Unlock Your Future</text>
    </svg>`,
  );
}

async function blurredPaywallBackground(width, height, sourcePath) {
  const blurred = await sharp(sourcePath)
    .resize(width, height, { fit: 'cover', position: 'centre' })
    .blur(16)
    .modulate({ brightness: 0.5, saturation: 0.7 })
    .toBuffer();

  const darken = Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="rgba(2,6,23,0.55)"/>
    </svg>`,
  );

  return sharp(blurred).composite([{ input: darken, blend: 'over' }]).png().toBuffer();
}

async function buildPromo(plan, width, height, paywallSource) {
  const isSquare = width === 1024 && height === 1024;
  const logoSize = scale(isSquare ? LOGO_SIZE_SQUARE : LOGO_SIZE_PORTRAIT, width);
  const logo = await sharp(logoPath)
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const overlay = buildOverlaySvg(plan, width, height);
  const logoTop = scale(isSquare ? LOGO_TOP_SQUARE : LOGO_TOP_PORTRAIT, width);
  const logoLeft = Math.round((width - logoSize) / 2);

  let base;
  if (paywallSource && fs.existsSync(paywallSource)) {
    const blurred = await blurredPaywallBackground(width, height, paywallSource);
    const overlayPng = await sharp(overlay).png().toBuffer();
    base = sharp(blurred).composite([{ input: overlayPng, blend: 'over' }]);
  } else {
    base = sharp(overlay);
  }

  return base
    .composite([{ input: logo, top: logoTop, left: logoLeft }])
    .png({ compressionLevel: 9 });
}

const paywallSource =
  paywallArg && fs.existsSync(paywallArg)
    ? paywallArg
    : null;

for (const plan of plans) {
  for (const { suffix, width, height } of sizes) {
    const baseName = plan.out.replace('.png', '');
    const outPath = path.join(outDir, `${baseName}${suffix}.png`);

    await (await buildPromo(plan, width, height, paywallSource)).toFile(outPath);

    const meta = await sharp(outPath).metadata();
    console.log(`✓ ${outPath} → ${meta.width}x${meta.height}`);
  }
}

console.log('\nUpload to ASC:');
console.log('  kheya-pro-monthly-promo.png → KHEYA_pro_monthly');
console.log('  kheya-pro-yearly-promo.png → KHEYA_pro_yearly');
if (paywallSource) {
  console.log(`\nBackground: paywall blur from ${paywallSource}`);
} else {
  console.log('\nTip: pass paywall screenshot for richer background:');
  console.log('  node scripts/generate-asc-promo-placeholders.mjs path/to/paywall.png');
}
