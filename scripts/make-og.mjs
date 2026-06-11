// One-off generator for the social preview image (public/og.png) and the
// apple touch icon (public/apple-touch-icon.png). Run: node scripts/make-og.mjs
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "public");
mkdirSync(outDir, { recursive: true });

const ogSvg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#60a5fa"/>
      <stop offset="1" stop-color="#22d3ee"/>
    </linearGradient>
    <linearGradient id="logo" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#3b82f6"/>
      <stop offset="1" stop-color="#22d3ee"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0" r="1">
      <stop offset="0" stop-color="#2563eb" stop-opacity="0.45"/>
      <stop offset="0.55" stop-color="#2563eb" stop-opacity="0.10"/>
      <stop offset="1" stop-color="#2563eb" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="46" height="46" patternUnits="userSpaceOnUse">
      <path d="M 46 0 L 0 0 0 46" fill="none" stroke="rgba(148,163,184,0.09)" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="#0a0f2e"/>
  <rect width="1200" height="630" fill="url(#grid)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <g transform="translate(96,84)">
    <rect width="78" height="78" rx="20" fill="url(#logo)"/>
    <path d="M 22 37 L 39 21 L 56 37" stroke="#ffffff" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M 22 58 L 39 42 L 56 58" stroke="#ffffff" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <text x="198" y="140" font-family="Arial, sans-serif" font-size="46" font-weight="bold" fill="#ffffff">PrepNova</text>
  <text x="92" y="318" font-family="Arial, sans-serif" font-size="116" font-weight="bold" fill="#ffffff">Your Score.</text>
  <text x="92" y="442" font-family="Arial, sans-serif" font-size="116" font-weight="bold" fill="url(#accent)">Elevated.</text>
  <text x="94" y="520" font-family="Arial, sans-serif" font-size="33" fill="#94a3b8">AI-powered ACT &amp; SAT prep — unlimited practice for $29/month</text>
  <text x="94" y="572" font-family="Arial, sans-serif" font-size="27" fill="#5b6b85">prepnovaai.com</text>
</svg>`;

const iconSvg = `<svg width="180" height="180" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#3b82f6"/>
      <stop offset="1" stop-color="#22d3ee"/>
    </linearGradient>
  </defs>
  <rect width="180" height="180" rx="40" fill="url(#g)"/>
  <path d="M 50 86 L 90 48 L 130 86" stroke="#ffffff" stroke-width="16" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M 50 134 L 90 96 L 130 134" stroke="#ffffff" stroke-width="16" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

await sharp(Buffer.from(ogSvg)).png().toFile(path.join(outDir, "og.png"));
await sharp(Buffer.from(iconSvg)).png().toFile(path.join(outDir, "apple-touch-icon.png"));
console.log("Wrote public/og.png and public/apple-touch-icon.png");
