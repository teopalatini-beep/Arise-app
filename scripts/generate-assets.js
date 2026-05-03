/**
 * ARISE — Asset generator (Jimp v1 API)
 * Run: node scripts/generate-assets.js
 */
const { Jimp } = require('jimp');
const path = require('path');
const fs = require('fs');

const OUT = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const BG     = 0x05050AFF;
const ORANGE = 0xE8460AFF;

function drawCircle(img, cx, cy, r, color) {
  const w = img.width, h = img.height;
  for (let y = Math.max(0, cy - r - 1); y <= Math.min(h - 1, cy + r + 1); y++) {
    for (let x = Math.max(0, cx - r - 1); x <= Math.min(w - 1, cx + r + 1); x++) {
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (dist <= r) img.setPixelColor(color, x, y);
    }
  }
}

function drawRect(img, x, y, w, h, color) {
  for (let py = y; py < y + h; py++)
    for (let px = x; px < x + w; px++)
      img.setPixelColor(color, px, py);
}

async function makeIcon(size, outFile) {
  const img = new Jimp({ width: size, height: size, color: BG });
  const cx = size >> 1;

  // Outer glow ring (orange)
  const ringR = Math.round(size * 0.42);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dist = Math.sqrt((x - cx) ** 2 + (y - cx) ** 2);
      if (dist > ringR - Math.round(size * 0.028) && dist <= ringR)
        img.setPixelColor(ORANGE, x, y);
    }
  }

  // Inner dark circle
  const innerR = ringR - Math.round(size * 0.055);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dist = Math.sqrt((x - cx) ** 2 + (y - cx) ** 2);
      if (dist <= innerR) {
        const t = dist / innerR;
        const r = Math.round(5 + t * 18);
        const g = Math.round(5 + t * 5);
        const b = Math.round(10 + t * 22);
        img.setPixelColor((r << 24 | g << 16 | b << 8 | 0xff) >>> 0, x, y);
      }
    }
  }

  // "A" letter — vertical bar + horizontal crossbar
  const bw = Math.round(size * 0.07);
  const bh = Math.round(size * 0.36);
  const by = Math.round(cx - bh / 2);
  const bx = Math.round(cx - bw / 2);
  drawRect(img, bx, by, bw, bh, ORANGE);                               // vertical
  drawRect(img, Math.round(cx - size * 0.13), Math.round(cx - bw / 2),
           Math.round(size * 0.26), bw, ORANGE);                        // horizontal

  await img.write(path.join(OUT, outFile));
  console.log(`✅  ${outFile} (${size}×${size})`);
}

async function makeSplash() {
  const W = 1284, H = 2778;
  const img = new Jimp({ width: W, height: H, color: BG });
  const cx = W >> 1, cy = H >> 1;

  // Radial glow in center
  const glowR = Math.round(W * 0.38);
  for (let y = cy - glowR; y <= cy + glowR; y++) {
    if (y < 0 || y >= H) continue;
    for (let x = cx - glowR; x <= cx + glowR; x++) {
      if (x < 0 || x >= W) continue;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (dist <= glowR) {
        const t = 1 - dist / glowR;
        const r = Math.min(255, 5 + Math.round(t * 45));
        const g = Math.min(255, 5 + Math.round(t * 12));
        const b = Math.min(255, 10 + Math.round(t * 18));
        img.setPixelColor((r << 24 | g << 16 | b << 8 | 0xff) >>> 0, x, y);
      }
    }
  }

  // Center ring
  const ringR = Math.round(W * 0.20);
  const ringW = Math.round(W * 0.012);
  for (let y = cy - ringR - 2; y <= cy + ringR + 2; y++) {
    if (y < 0 || y >= H) continue;
    for (let x = cx - ringR - 2; x <= cx + ringR + 2; x++) {
      if (x < 0 || x >= W) continue;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (dist > ringR - ringW && dist <= ringR)
        img.setPixelColor(ORANGE, x, y);
    }
  }

  // "A" mark inside the ring
  const bw = Math.round(W * 0.022);
  const bh = Math.round(W * 0.13);
  const by = Math.round(cy - bh / 2);
  drawRect(img, Math.round(cx - bw / 2), by, bw, bh, ORANGE);
  drawRect(img, Math.round(cx - W * 0.048), Math.round(cy - bw / 2),
           Math.round(W * 0.096), bw, ORANGE);

  await img.write(path.join(OUT, 'splash.png'));
  console.log(`✅  splash.png (${W}×${H})`);
}

async function makeNotifIcon() {
  const size = 96;
  const img = new Jimp({ width: size, height: size, color: 0x00000000 });
  drawCircle(img, size >> 1, size >> 1, size / 2 - 6, 0xFFFFFFFF);
  await img.write(path.join(OUT, 'notification-icon.png'));
  console.log('✅  notification-icon.png (96×96)');
}

async function makeFavicon() {
  const img = new Jimp({ width: 32, height: 32, color: BG });
  drawCircle(img, 16, 16, 12, ORANGE);
  await img.write(path.join(OUT, 'favicon.png'));
  console.log('✅  favicon.png (32×32)');
}

(async () => {
  console.log('\n🎨  Generating ARISE placeholder assets...\n');
  await makeIcon(1024, 'icon.png');
  await makeIcon(1024, 'adaptive-icon.png');
  await makeSplash();
  await makeNotifIcon();
  await makeFavicon();
  console.log('\n✅  All assets generated in /assets/');
  console.log('⚠️   PLACEHOLDERS — replace with final designer assets before App Store submission.\n');
})();
