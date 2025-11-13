const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '..', 'dist', 'api', 'index.js');
const destDir = path.resolve(__dirname, '..', 'api');
const dest = path.resolve(destDir, 'index.js');

try {
  if (!fs.existsSync(src)) {
    console.error(`Source file not found: ${src}`);
    process.exit(1);
  }

  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  fs.copyFileSync(src, dest);
  console.log(`Copied ${src} -> ${dest}`);
} catch (err) {
  console.error('Failed to copy built API file:', err);
  process.exit(1);
}
