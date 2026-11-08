import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
export const stableId = (s: string) => {
  const x = createHash('sha256')
    .update('antetempo:votilt:' + s)
    .digest('hex');
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-4${x.slice(13, 16)}-a${x.slice(17, 20)}-${x.slice(20, 32)}`;
};
export const catalog = readFileSync('docs/SPECIFICA_ORIGINALE.md', 'utf8')
  .split('\n')
  .filter(
    (l) =>
      l.split('|').length === 6 &&
      /^\| (Persone & Vibes|Food & Drink|Gaming & Pop|Travel & Places|Design & Creativity|AI Universe) \|/.test(
        l,
      ),
  )
  .map((l) =>
    l
      .split('|')
      .slice(1, 5)
      .map((s) => s.trim()),
  );
export const palettes = [
  ['#361C56', '#EBC0AF', '#FF4DA6'],
  ['#54201E', '#FFA85B', '#8CD05D'],
  ['#171E5A', '#22D3EE', '#A855F7'],
  ['#213D5A', '#F2A879', '#AA7EDC'],
  ['#283C48', '#D6DAAA', '#FA8D9F'],
  ['#351259', '#A855F7', '#22D3EE'],
];
export const aiAssets = [
  ...JSON.parse(readFileSync('assets/art/catalog.json', 'utf8')),
  ...JSON.parse(readFileSync('assets/art/full-catalog-plan.json', 'utf8')).filter(
    (p: { status: string }) => p.status === 'generated',
  ),
] as {
  leaf: string;
  variant: number;
  file: string;
  prompt?: string;
}[];
export const toolCatalog = JSON.parse(readFileSync('assets/tool-catalog.json', 'utf8')) as {
  leaf: string;
  variant: number;
  name: string;
  url: string;
  description: string;
}[];
function motif(title: string, i: number, group: number) {
  const shift = i * 38;
  const detail = ['#22D3EE', '#FF4DA6', '#F9B95C'][i];
  const stars = Array.from(
    { length: 24 },
    (_, k) =>
      `<circle cx="${(k * 137 + shift) % 800}" cy="${80 + ((k * 83) % 740)}" r="${(k % 3) + 1}" fill="white" opacity=".45"/>`,
  ).join('');
  if (group === 0) {
    return `<ellipse cx="400" cy="1130" rx="300" ry="430" fill="${detail}"/><path d="M170 1130 Q180 720 400 710 Q640 735 650 1130" fill="#29213F"/><rect x="345" y="590" width="110" height="180" rx="45" fill="#CA927C"/><ellipse cx="400" cy="455" rx="165" ry="220" fill="#E8B99C"/><path d="M224 475 Q170 205 400 209 Q630 195 583 475L534 331Q354 432 245 346z" fill="${i === 1 ? '#AB563F' : '#29213F'}"/><path d="M284 457q42 -24 77 2m77 0q42 -23 76 0" fill="none" stroke="#382B3D" stroke-width="12" stroke-linecap="round"/><path d="M363 571q37 ${i === 0 ? '24' : '60'} 78 0" fill="none" stroke="#95495C" stroke-width="13" stroke-linecap="round"/><path d="M400 473l-12 55h25" fill="none" stroke="#C88D78" stroke-width="8"/><circle cx="232" cy="525" r="12" fill="${detail}"/><path d="M270 832 400 960 537 832" fill="none" stroke="${detail}" stroke-width="12"/>`;
  }
  if (/pizza/i.test(title)) {
    return `<ellipse cx="400" cy="1000" rx="320" ry="70" fill="#090711" opacity=".35"/><g transform="rotate(${i * 17 - 15} 400 580)"><circle cx="400" cy="570" r="282" fill="#C5773E"/><circle cx="400" cy="570" r="253" fill="#F0B466"/><circle cx="400" cy="570" r="228" fill="#CC5A43"/><circle cx="400" cy="570" r="207" fill="#F7D88C"/>${Array.from({ length: 8 }, (_, k) => `<circle cx="${400 + Math.cos(k * 2.4) * 160}" cy="${570 + Math.sin(k * 2.4) * 160}" r="${26 + i * 4}" fill="#C9564E"/><ellipse cx="${400 + Math.cos(k * 2.4 + 0.5) * 133}" cy="${570 + Math.sin(k * 2.4 + 0.5) * 133}" rx="18" ry="38" transform="rotate(${k * 45})" fill="#60954D"/>`).join('')}</g>`;
  }
  if (/Burger/i.test(title)) {
    return `<ellipse cx="400" cy="984" rx="295" ry="55" fill="#090711" opacity=".4"/><path d="M150 490 Q160 230 400 235Q650 230 650 490z" fill="#E8A155"/>${Array.from({ length: 16 }, (_, k) => `<ellipse cx="${240 + ((k * 73) % 320)}" cy="${310 + ((k * 29) % 135)}" rx="7" ry="3" fill="#FFE0A3" transform="rotate(${k * 7})"/>`).join('')}<path d="M150 525q55 -60 100 0t100 0t100 0t100 0t100 0v50H150" fill="#8DCB6D"/><rect x="140" y="583" width="520" height="65" rx="32" fill="#B4483E"/><path d="M145 660h510l-75 87-120-23-90 40-130-41z" fill="#FFC347"/><rect x="140" y="750" width="520" height="85" rx="42" fill="#613F38"/><path d="M160 870h480q0 110-240 110T160 870" fill="#D99551"/>`;
  }
  if (/Drink/i.test(title)) {
    return `<ellipse cx="400" cy="1000" rx="230" ry="45" fill="#090711" opacity=".5"/><path d="M262 360h276l-45 532q-90 70-186 0z" fill="${detail}" opacity=".85"/><path d="M270 417h260l-13 150H281z" fill="#F6DC96" opacity=".55"/><path d="M288 340h224M290 375l30 500M510 375l-40 500" stroke="#E5E0FD" stroke-width="7" fill="none" opacity=".6"/><path d="M410 588 477 204h120" stroke="#E7DDF7" fill="none" stroke-width="17"/><circle cx="530" cy="320" r="98" fill="#A0C365"/><circle cx="530" cy="320" r="77" fill="#E0E89B"/><path d="M530 243v154m-77-77h154" stroke="#A0C365" stroke-width="6"/>`;
  }
  if (group === 1) {
    return `<ellipse cx="400" cy="990" rx="300" ry="60" fill="#090711" opacity=".4"/><ellipse cx="400" cy="895" rx="280" ry="50" fill="#EEE1CA"/><rect x="214" y="490" width="372" height="350" rx="36" fill="${i === 0 ? '#BD7D65' : i === 1 ? '#EAACA0' : '#D9C69C'}"/><ellipse cx="400" cy="490" rx="186" ry="58" fill="#F5D7B5"/><path d="M214 500v120q20 50 42 0t42 0t42 0t42 0t42 0t42 0t42 0t42 0v-120" fill="#6A3637"/>${[290, 400, 510].map((x, k) => `<circle cx="${x}" cy="440" r="43" fill="${k === i ? '#974A62' : '#CF6979'}"/><path d="M${x} 400l15-32" stroke="#7CA061" stroke-width="10"/>`).join('')}<path d="M235 740h330" stroke="#FCDEAE" stroke-width="12"/>`;
  }
  if (/Gatti/i.test(title)) {
    return `<ellipse cx="400" cy="840" rx="210" ry="260" fill="#A49CA9"/><path d="M220 515 210 280l157 120h68l162-120-14 255" fill="#A49CA9"/><ellipse cx="400" cy="520" rx="200" ry="175" fill="#BDB3BB"/><path d="M250 450h130v80H250zm170 0h130v80H420" fill="#211D32"/><path d="M380 475h40M260 550l-95-25m95 55-95 20m375-50 95-25m-95 55 95 20" stroke="#211D32" stroke-width="9"/><path d="M370 580h60l-30 36z" fill="#D2869E"/><path d="M270 820 400 740 530 820" stroke="${detail}" fill="none" stroke-width="25"/>`;
  }
  if (/Setup|room|RGB|gaming/i.test(title)) {
    return `${stars}<path d="M105 930h590V400L400 235 105 400z" fill="#17142C"/><path d="M105 400 400 565 695 400M400 565v365" stroke="${detail}" stroke-width="6" fill="none"/><path d="M160 700 420 545 635 660 370 825z" fill="#5A4677"/><path d="M160 700v130m475-170v170m-265-5v140" stroke="#A084B9" stroke-width="15"/><path d="M280 450 475 565v150L280 600z" fill="#A855F7"/><path d="M300 484 454 574v98L300 584z" fill="#22D3EE"/><path d="M500 615v-200l105 60v200z" fill="#282B54"/><circle cx="552" cy="530" r="32" fill="none" stroke="#FF4DA6" stroke-width="10"/><circle cx="552" cy="614" r="24" fill="none" stroke="#22D3EE" stroke-width="10"/>`;
  }
  if (/Mondi retro|meme|assurdi|surreali/i.test(title)) {
    return `${stars}<circle cx="400" cy="530" r="230" fill="${detail}" opacity=".7"/>${Array.from({ length: 9 }, (_, k) => `<rect x="${110 + k * 65}" y="${760 - (k % 4) * 100}" width="70" height="${250 + (k % 4) * 100}" fill="${k % 2 ? '#342768' : '#7665AD'}"/>`).join('')}<path d="M300 250h200v120H300zm-55 80h310v120H245" fill="#F2DBA9"/><path d="M305 300h45v45h-45zm150 0h45v45h-45" fill="#211932"/>`;
  }
  if (/montagne|epiche|Tramonti/i.test(title)) {
    return `${stars}<circle cx="${360 + shift}" cy="460" r="${150 + i * 20}" fill="#F9B08E"/><path d="M-100 970 210 365 430 770 630 420 900 1020" fill="#7965A3"/><path d="m100 588 110-223 150 279-126-94-50 81zM520 663 630 420 744 660 638 571z" fill="#E7D4DE"/><path d="M-100 1100 150 750 400 1020 670 690 900 1050v150" fill="#2E355B"/><path d="M0 1090q400-85 800 0v110H0" fill="#13283C"/>`;
  }
  if (/Spiagge|Acqua|alberi/i.test(title)) {
    return `<circle cx="${530 - shift}" cy="360" r="120" fill="#EBA491"/><path d="M0 550q400-90 800 0v650H0" fill="#3D8498"/><path d="M0 690q450 170 800 40v470H0" fill="#86C1B7"/><path d="M0 910q400-190 800-35v325H0" fill="#E3C8A0"/><path d="M155 1100q80-380 220-690" stroke="#514B51" stroke-width="28" fill="none"/><path d="M370 425q-200-170-310 10 170-80 310-10m0 0q40-240 235-170-180 25-235 170m0 0q240-80 310 100-180-115-310-100m0 0q-50-230-200-190 135 70 200 190" fill="#456D65"/>`;
  }
  if (/Città|Neon|Megastrutture|futuro/i.test(title)) {
    return `${stars}<circle cx="${525 - shift}" cy="350" r="147" fill="${detail}" opacity=".6"/>${Array.from(
      { length: 10 },
      (_, k) => {
        const h = 260 + ((k * 97 + shift) % 390);
        const x = k * 91 - 42;
        return `<path d="M${x} 1100v-${h}l55-40 70 40v${h}z" fill="${k % 2 ? '#31234D' : '#49345F'}"/><path d="M${x + 55} ${1100 - h - 40}v${h + 40}" stroke="${detail}" stroke-width="5"/>${Array.from({ length: 6 }, (_, j) => `<path d="M${x + 15} ${1120 - h + j * 48}h25" stroke="#D99EEE" stroke-width="5"/>`).join('')}`;
      },
    ).join(
      '',
    )}<path d="M400 745 200 1200h400z" fill="#161228"/><path d="M400 825 365 1200" stroke="#22D3EE" stroke-width="5"/>`;
  }
  if (/Auto/i.test(title)) {
    return `<ellipse cx="400" cy="980" rx="330" ry="70" fill="#090711" opacity=".5"/><path d="m93 780 135-40 92-165h230l130 188 60 35-30 130H100z" fill="${detail}"/><path d="m260 740 85-135h178l88 135z" fill="#253349"/><path d="M445 610v130" stroke="#121725" stroke-width="13"/><circle cx="230" cy="908" r="75" fill="#1C1B2A"/><circle cx="600" cy="908" r="75" fill="#1C1B2A"/><circle cx="230" cy="908" r="35" fill="#9FC3D5"/><circle cx="600" cy="908" r="35" fill="#9FC3D5"/><path d="M110 820h90m440-10h65" stroke="#F7EDB0" stroke-width="20"/>`;
  }
  if (/Sneakers|Scarpe/i.test(title)) {
    return `<ellipse cx="400" cy="980" rx="300" ry="50" fill="#090711" opacity=".5"/><path d="M140 790q75-120 70-280l138 90 92-85 80 155 160 100q65 80-20 110H200q-95-10-60-90" fill="${detail}"/><path d="m148 829 520 3 10 60H170z" fill="#E2E5D9"/><path d="m280 620 150 90m-158-45 150 85m-155-45 150 85" stroke="#F1E8DA" stroke-width="15"/><path d="m465 742 150 50" stroke="#392D50" stroke-width="25"/>`;
  }
  if (/case|Architettura/i.test(title)) {
    return `${stars}<path d="M140 1000V540l290-175 225 145v490z" fill="#C5B8B2"/><path d="M140 540 430 365 655 510 365 695z" fill="${detail}"/><path d="M365 695v305h290V510z" fill="#5B6475"/><path d="m190 630 110 65v150l-110-60zM410 710l185-110v215L410 925z" fill="#E9BC87"/><path d="M520 635v225" stroke="#485162" stroke-width="15"/><path d="M80 1000h640" stroke="#3A4E52" stroke-width="25"/>`;
  }
  if (/Tool|Assistenti|Generatori/i.test(title)) {
    const names = ['FORMA', 'LUMEN', 'ORBIT'];
    return `${stars}<rect x="145" y="320" width="510" height="510" rx="100" fill="#201B38" stroke="${detail}" stroke-width="4"/><circle cx="400" cy="515" r="90" fill="none" stroke="${detail}" stroke-width="22"/><path d="m300 540 100-145 100 145-100 80z" fill="${detail}" opacity=".7"/><text x="400" y="740" text-anchor="middle" font-family="Arial,sans-serif" font-weight="bold" font-size="48" letter-spacing="10" fill="#F8F6FF">${names[i]}</text>`;
  }
  return `${stars}<g transform="translate(400 590) rotate(${i * 35 - 25})"><path d="M0-280 240-140 240 140 0 280-240 140-240-140z" fill="none" stroke="${detail}" stroke-width="42"/><ellipse rx="290" ry="100" fill="none" stroke="#E0C7F1" stroke-width="18" transform="rotate(-30)"/><circle r="110" fill="${detail}" opacity=".7"/></g><path d="M0 1000h800v200H0" fill="#161529"/>`;
}
export async function generateArt() {
  mkdirSync('.local/media', { recursive: true });
  mkdirSync('assets/seed-media', { recursive: true });
  const manifest = [];
  for (const parts of catalog) {
    const [macro, , , leaf] = parts;
    const group = [
      'Persone & Vibes',
      'Food & Drink',
      'Gaming & Pop',
      'Travel & Places',
      'Design & Creativity',
      'AI Universe',
    ].indexOf(macro);
    for (let v = 0; v < 3; v++) {
      const id = stableId(`content:${leaf}:${v}`);
      const [bg, light, accent] = palettes[group];
      const tool = toolCatalog.find((t) => t.leaf === leaf && t.variant === v);
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200" viewBox="0 0 800 1200"><defs><linearGradient id="bg" x1="0" y1="0" x2=".7" y2="1"><stop stop-color="${bg}"/><stop offset="1" stop-color="#090711"/></linearGradient><radialGradient id="glow"><stop stop-color="${v === 1 ? accent : light}" stop-opacity=".3"/><stop offset="1" stop-color="${bg}" stop-opacity="0"/></radialGradient></defs><rect width="800" height="1200" fill="url(#bg)"/><circle cx="${280 + v * 120}" cy="420" r="500" fill="url(#glow)"/>${motif(leaf, v, group)}<rect y="1130" width="800" height="70" fill="#090711" opacity=".15"/></svg>`;
      const dest = `assets/seed-media/${id}.jpg`;
      const ai = aiAssets.find((a) => a.leaf === leaf && a.variant === v);
      if (ai && existsSync(`assets/art/${ai.file}`))
        await sharp(`assets/art/${ai.file}`)
          .resize(800, 1200, { fit: 'cover' })
          .jpeg({ quality: 90 })
          .toFile(dest);
      else if (tool) {
        const toolSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#291A47"/><stop offset="1" stop-color="#090711"/></linearGradient></defs><rect width="800" height="1200" fill="url(#g)"/><circle cx="400" cy="400" r="180" fill="none" stroke="${accent}" stroke-width="4"/><path d="M400 215 560 310 560 495 400 590 240 495 240 310z" fill="none" stroke="${light}" stroke-width="18" transform="rotate(${v * 20} 400 400)"/><circle cx="400" cy="400" r="80" fill="${accent}" opacity=".55"/><text x="400" y="720" text-anchor="middle" fill="#F8F6FF" font-family="Arial,sans-serif" font-size="${tool.name.length > 17 ? 40 : 48}" font-weight="bold">${tool.name}</text><text x="400" y="785" text-anchor="middle" fill="#A9A3BE" font-family="Arial,sans-serif" font-size="20">${leaf}</text><text x="400" y="1030" text-anchor="middle" fill="#22D3EE" font-family="Arial,sans-serif" font-size="17" letter-spacing="5">QUAL È IL TUO PREFERITO?</text></svg>`;
        await sharp(Buffer.from(toolSvg)).jpeg({ quality: 90 }).toFile(dest);
      } else if (!existsSync(dest))
        await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toFile(dest);
      const bytes = readFileSync(dest);
      writeFileSync(`.local/media/${id}.jpg`, bytes);
      manifest.push({
        id,
        category: leaf,
        variant: v,
        path: dest,
        provenance: ai ? 'ai_generated' : 'original_illustration',
        author: 'antetempo / VOTILT',
        source: ai ? `assets/art/${ai.file}` : null,
        method: ai
          ? 'Built-in image generation tool; exact model not exposed. Prompts in assets/art/prompts.json and catalog.json.'
          : 'Original deterministic SVG illustration rasterized to JPEG; not generated by an image AI model',
        sha256: createHash('sha256').update(bytes).digest('hex'),
      });
    }
  }
  writeFileSync('assets/seed-media/manifest.json', JSON.stringify(manifest, null, 2));
  console.log(
    `PASS: ${manifest.length} illustrazioni originali / ${catalog.length} foglie, copie locali verificate.`,
  );
}
if (process.argv[1]?.replaceAll('\\', '/').endsWith('/scripts/generate-seed-art.ts'))
  await generateArt();
