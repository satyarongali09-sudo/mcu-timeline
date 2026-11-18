// Builds the site-wide Doom smoke backdrop from the user-supplied reference.
// 1) Removes the watermark sparkle (bottom-right) by cloning neighbouring smoke with a feathered mask.
// 2) Upscales with Lanczos3 to 2560px and applies a light unsharp mask so it stays crisp (not blurry).
const sharp = require('sharp');
const path = require('path');

const SRC = process.argv[2];
const OUT = path.join(__dirname, '..', 'public', 'images', 'doom-smoke-bg.jpg');

(async () => {
  const P = 84; // patch size
  const target = { left: 893, top: 443 };  // area covering the sparkle (~935,485)
  const source = { left: 800, top: 430 };  // nearby smoke texture

  const patch = await sharp(SRC).extract({ left: source.left, top: source.top, width: P, height: P }).png().toBuffer();
  const mask = Buffer.from(
    `<svg width="${P}" height="${P}"><defs><radialGradient id="g"><stop offset="55%" stop-color="#fff" stop-opacity="1"/><stop offset="100%" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><rect width="${P}" height="${P}" fill="url(#g)"/></svg>`
  );
  const feathered = await sharp(patch).ensureAlpha().composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();

  const cleaned = await sharp(SRC).composite([{ input: feathered, left: target.left, top: target.top }]).png().toBuffer();

  await sharp(cleaned)
    .resize({ width: 2560, kernel: sharp.kernel.lanczos3 })
    .sharpen({ sigma: 0.9, m1: 0.6, m2: 2.2 })
    .modulate({ saturation: 1.05 })
    .jpeg({ quality: 88, mozjpeg: true, chromaSubsampling: '4:4:4' })
    .toFile(OUT);

  const meta = await sharp(OUT).metadata();
  console.log('Wrote', OUT, `${meta.width}x${meta.height}`);
})().catch(e => { console.error(e); process.exit(1); });
