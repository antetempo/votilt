import sharp from 'sharp';
import { Buffer } from 'node:buffer';
import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const manifest = JSON.parse(readFileSync('assets/seed-media/manifest.json', 'utf8'));
assert.equal(manifest.length, 123);
const hashes = new Set();
const sources = new Set();
for (const x of manifest) {
  const bytes = readFileSync(x.path);
  const hash = createHash('sha256').update(bytes).digest('hex');
  assert.equal(hash, x.sha256);
  hashes.add(hash);
  sources.add(x.source);
  const info = await sharp(bytes).metadata();
  assert.equal(info.width, 800);
  assert.equal(info.height, 1200);
  assert.ok(!info.exif);
}
assert.equal(hashes.size, 123, 'Ogni candidato deve avere un asset distinto');
mkdirSync('docs/evidence/assets', { recursive: true });
for (let page = 0; page < Math.ceil(manifest.length / 18); page++) {
  const items = manifest.slice(page * 18, page * 18 + 18);
  const composite = [];
  for (const [i, x] of items.entries()) {
    composite.push({
      input: await sharp(x.path).resize(160, 240).toBuffer(),
      left: (i % 6) * 166,
      top: Math.floor(i / 6) * 265,
    });
    const label = x.category.replaceAll('&', '&amp;').replaceAll('<', '&lt;');
    composite.push({
      input: Buffer.from(
        `<svg width="160" height="24"><text x="3" y="16" font-size="11" fill="white">${label.slice(0, 24)} · ${x.variant + 1}</text></svg>`,
      ),
      left: (i % 6) * 166,
      top: Math.floor(i / 6) * 265 + 240,
    });
  }
  await sharp({ create: { width: 996, height: 795, channels: 3, background: '#090711' } })
    .composite(composite)
    .jpeg({ quality: 86 })
    .toFile(`docs/evidence/assets/contact-${page + 1}.jpg`);
}
const result = {
  date: new Date().toISOString(),
  items: manifest.length,
  uniqueHashes: hashes.size,
  aiGenerated: manifest.filter((x) => x.provenance === 'ai_generated').length,
  originalIllustrations: manifest.filter((x) => x.provenance === 'original_illustration').length,
  exif: 'absent',
  dimensions: '800x1200',
  status: 'PASS',
};
writeFileSync('docs/evidence/asset-audit.json', JSON.stringify(result, null, 2));
console.log(result);
