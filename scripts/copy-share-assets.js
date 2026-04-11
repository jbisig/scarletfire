#!/usr/bin/env node
// Copies share card assets from assets/share_images/ → public/share/
// so Vercel can serve them as public URLs for Satori (OG image) and unfurl previews.
// Run as part of the build command in vercel.json.

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'assets', 'share_images');
const destDir = path.join(__dirname, '..', 'public', 'share');

const files = ['bg-1.png', 'bg-2.png', 'bg-3.png', 'bg-4.png', 'bg-5.png', 'bg-6.png', 'logo.png'];

fs.mkdirSync(destDir, { recursive: true });

for (const file of files) {
  const src = path.join(srcDir, file);
  const dest = path.join(destDir, file);
  if (!fs.existsSync(src)) {
    console.error(`[copy-share-assets] missing source file: ${src}`);
    process.exit(1);
  }
  fs.copyFileSync(src, dest);
  console.log(`[copy-share-assets] copied ${file}`);
}
