import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import { iconPaths, iconSvg } from '../src/brand/icons.ts';
mkdirSync('assets/icons/ui', { recursive: true });
for (const name of Object.keys(iconPaths)) {
  const svg = iconSvg(name);
  writeFileSync(`assets/icons/ui/${name}.svg`, svg);
  await sharp(Buffer.from(svg)).resize(128, 128).png().toFile(`assets/icons/ui/${name}.png`);
}
await sharp(Buffer.from(iconSvg('back')))
  .resize(24, 24)
  .png()
  .toFile('assets/icons/ui/back-native.png');
console.log(
  `PASS ${Object.keys(iconPaths).length} icone VOTILT originali, master SVG e PNG Android.`,
);
