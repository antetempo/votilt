import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const rows = ['catalogo-editoriale.txt', 'news-revision.txt'].map((file) => fs.readFileSync(path.join(dir, file), 'utf8')).join('\n')
  .split(/\r?\n/).filter((row) => row.trim() && !row.startsWith('#'));
const nodes = new Map();
const leaves = [];
for (const row of rows) {
  const [branch, names, extra] = row.split('|').map((part) => part.trim());
  if (!branch || !names || extra) throw new Error(`Riga non valida: ${row}`);
  const parts = branch.split('>').map((part) => part.trim());
  for (const name of names.split(';').map((part) => part.trim())) {
    if (!name) throw new Error('Foglia vuota');
    const full = [...parts, name];
    const key = full.join(' > ');
    if (leaves.some((leaf) => leaf.path === key)) throw new Error(`Duplicato: ${key}`);
    for (let i = 0; i < full.length; i++) {
      const current = full.slice(0, i + 1).join(' > ');
      const id = `draft-${crypto.createHash('sha256').update(current).digest('hex').slice(0, 16)}`;
      if (!nodes.has(current)) nodes.set(current, {
        id, name: full[i], path: current, depth: i + 1,
        parentPath: i ? full.slice(0, i).join(' > ') : null,
        terminal: i === full.length - 1, aliases: [],
      });
      else if (nodes.get(current).terminal !== (i === full.length - 1)) {
        throw new Error(`Nodo usato sia come ramo sia come foglia: ${current}`);
      }
    }
    leaves.push(nodes.get(key));
  }
}
const aliases = {
  'Videogiochi e mondi virtuali': ['gaming', 'videogame'],
  FPS: ['first person shooter', 'sparatutto in prima persona'],
  'FPS tattici': ['tactical FPS', 'sparatutto tattici'],
  'FPS arena': ['arena shooter'],
  'Motociclismo': ['moto', 'motorbike'],
  'Café racer': ['cafe racer', 'café-racer'],
  'Baggers custom': ['bagger'],
  'Fitness e allenamento': ['palestra', 'workout', 'gym'],
  'Amicizia e vita sociale': ['amici', 'friends'],
  'Famiglia e affetti': ['family', 'familiari'],
  'Mare e costumi': ['spiaggia', 'beach', 'swimwear'],
  'Danza e movimento': ['ballo', 'dance'],
  'Cucina e bevande': ['food', 'cibo', 'cooking'],
  'AI e creatività digitale': ['intelligenza artificiale', 'generative AI'],
  'Animali e convivenza': ['pets', 'animali domestici'],
  'Manualità e artigianato': ['fai da te', 'DIY', 'craft'],
  'Collezionismo e hobby': ['collecting', 'hobbies'],
  'Libri scrittura e lingue': ['bookstagram', 'booktok', 'bookrecs', 'books'],
  'Moda e stile': ['fashion', 'outfit', 'ootd', 'outfit of the day'],
  'Bellezza e cura personale': ['beauty', 'grwm', 'get ready with me'],
  'Tecnologia e maker': ['tech', 'iot', 'gamedev', 'indiedev', 'unity3d'],
  'Informazione e vita civica': ['news', 'attualità', 'notizie', 'giornalismo'],
  'Economia e finanza': ['economics', 'finance', 'fintech'],
  'Cybersicurezza': ['cybersecurity', 'cyber security'],
  'Privacy e dati personali': ['data privacy', 'privacy'],
  'Intelligenza artificiale e società': ['responsibleai', 'responsible ai'],
  'Fotografia di strada': ['streetphotography', 'streetphoto', 'urbanphotography'],
  'Sviluppo videogiochi': ['gamedev', 'indiedev', 'game development'],
  'Motori di gioco': ['unity', 'unity3d', 'unreal engine', 'godot'],
  'Technical art': ['technicalart', 'unityvfx'],
  'Arte procedurale': ['proceduralart', 'generative art'],
  'Romantasy': ['romantic fantasy'],
  'Cozy mystery': ['cozymysterybooks', 'giallo cozy'],
  'Bikini': ['costume due pezzi', 'two piece swimsuit'],
  'Costumi interi': ['one piece swimsuit'],
  'Calisthenics': ['calistenia', 'street workout'],
  'K-pop dance': ['kpop', 'k-pop', 'cover dance'],
  'Piante da appartamento': ['houseplants', 'indoor plants'],
  'Orto': ['orto domestico', 'vegetable garden'],
  'Café racer': ['caferacer', 'cafe racer', 'café-racer'],
};
for (const node of nodes.values()) node.aliases = aliases[node.name] ?? [];
const all = [...nodes.values()];
const stats = {
  roots: all.filter((node) => node.depth === 1).length,
  branches: all.filter((node) => !node.terminal).length,
  leaves: leaves.length, nodes: all.length, sourceRows: rows.length,
  maxDepth: Math.max(...all.map((node) => node.depth)),
  leavesByDepth: Object.fromEntries([...new Set(leaves.map((node) => node.depth))]
    .sort().map((depth) => [depth, leaves.filter((node) => node.depth === depth).length])),
  nodesWithAliases: all.filter((node) => node.aliases.length).length,
  leavesByRoot: Object.fromEntries(all.filter((node) => node.depth === 1).map((root) =>
    [root.name, leaves.filter((leaf) => leaf.path.startsWith(root.name + ' > ')).length])),
};
const lines = [
  '# VOTILT — gerarchia editoriale completa della bozza v0.2', '',
  '**BOZZA IN LAVORAZIONE · 8 novembre 2026 · non importata nell’app.**', '',
  '**Revisione trasversale v0.2:** riscritti tutti i domini usando interessi, comunità, discipline e ambiti editoriali riconoscibili. Le frasi da didascalia della v0.1 non sono foglie competitive: “angoli d’ombra in giardino” è sostituito dal tema “Piante da ombra”; famiglia e amicizia restano aree proprie senza duplicare ogni attività “in famiglia”. La profondità e il numero di figli variano secondo il dominio. La bozza v0.1 è conservata come storico e non è il catalogo da importare.', '',
  'Questo documento contiene tutti i rami e tutte le foglie attualmente progettati. È una proposta editoriale originale, non una promessa di coprire ogni contenuto possibile. I conteggi descrivono questa bozza; non misurano la domanda degli utenti o la qualità della classificazione.', '',
  `**Conteggi misurati:** ${stats.roots} aree principali, ${stats.branches} rami complessivi (incluse le radici), ${stats.leaves} foglie, ${stats.nodes} nodi; profondità massima ${stats.maxDepth}.`, '',
  '**Legenda:** `[RAMO]` raggruppa argomenti; `[FOGLIA]` è una destinazione finale proposta per i contenuti e la preferenza per il creator. Ogni riga riporta il percorso completo. I sinonimi indicati sono aiuti alla ricerca, non categorie aggiuntive.', '',
  '## Criterio di copertura', '',
  'La copertura include vita quotidiana, amicizia, famiglia, divertimento, espressione personale, mare e costumi, danza, sport, gaming di nicchia, moto custom, arti, cultura, informazione, scienza, lavoro e hobby. Il criterio evita di ridurre i social a contenuti professionali: mette insieme relazione, intrattenimento, identità, creatività, apprendimento e interessi specialistici. Non moltiplica automaticamente ogni tema per tono, provenienza AI, luogo o formato: questi possono essere attributi separati.', '',
  'Rami e foglie richiedono ancora revisione semantica: sovrapposizioni, sinonimi mancanti, granularità e confrontabilità delle immagini. Un badge segnala preferenze della comunità, non competenza certificata o verità scientifica. Famiglia e minori richiedono tutela della privacy; costumi e danza in contesti ordinari non sono automaticamente contenuti sessuali. I contenuti espliciti o non consensuali restano esclusi.', '',
  'Gli ID nei dati riutilizzabili sono identificatori di bozza derivati dal percorso: prima dell’importazione serve un registro stabile e una migrazione verificata. Il database attuale limita la profondità a quattro livelli: questa bozza non è direttamente importabile senza adeguamento. Nessuna nuova immagine è stata generata per questa bozza; la produzione grafica è una fase distinta.', '',
  '## Fonti e limiti', '',
  '- [W3C SKOS](https://www.w3.org/TR/skos-reference/): concetti, etichette alternative e relazioni gerarchiche. La struttura proposta è nostra, non una tassonomia W3C.',
  '- [IAB Content Taxonomy](https://iabtechlab.com/standards/content-taxonomy/): riferimento per ampiezza tematica; pensato per classificazione contestuale pubblicitaria, non per voti ai creator.',
  '- [IPTC Media Topics](https://iptc.org/standards/media-topics/): riferimento editoriale per informazione e cultura; non copiato come catalogo VOTILT.',
  '- [Pew Research, motivazioni Instagram, 12 giugno 2024](https://www.pewresearch.org/2024/06/12/how-instagram-users-view-experience-the-platform/): intrattenimento, relazioni e interessi condivisi sono motivazioni rilevanti nel campione statunitense; non è una ricerca sugli utenti italiani di VOTILT.',
  '- [Ofcom, adulti e media 2026](https://www.ofcom.org.uk/media-use-and-attitudes/media-habits-adults/adults-media-use-and-attitudes): riferimento britannico su usi e motivazioni; nessuna estrapolazione di quote alla nostra app.', '',
  'I nomi sotto sono una proposta editoriale, non categorie validate da uno studio rappresentativo. La revisione dovrà usare scenari e campioni di contenuti, senza chiedere all’utente di approvare ogni singola voce.', '',
  '## Albero completo', '',
];
const socialNotes = fs.readFileSync(path.join(dir, 'TAG_SOCIAL.md'), 'utf8');
lines.splice(lines.length - 2, 0, '## Revisione news e linguaggio social', '',
  `L’area Informazione e vita civica contiene ora **${stats.leavesByRoot['Informazione e vita civica']} foglie**: politica italiana, esteri/geopolitica, economia/finanza, cronaca/giustizia, società/diritti, salute/sanità, ambiente, attualità scientifica, cultura e religioni. Le condizioni di moderazione sono separate dai nomi pubblici.`, '',
  socialNotes.replace(/^# /, '### '), '');
for (const node of all) {
  if (node.depth === 1) lines.push(`### ${node.name}`, '');
  lines.push(`- **[${node.terminal ? 'FOGLIA' : 'RAMO'}]** ${node.path}${node.aliases.length ? ` — Sinonimi: ${node.aliases.join(', ')}` : ''}`);
}
lines.push('', '## Dati riutilizzabili', '',
  '- `catalogo.v0.2.json`: tutti i nodi, parentela, tipo ramo/foglia e sinonimi.',
  '- `catalogo-foglie.csv`: una riga per foglia e percorso completo.',
  '- `conteggi.json`: conteggi calcolati dal generatore.',
  '- `catalogo-editoriale.txt` e `news-revision.txt`: sorgenti editoriali; `genera.mjs` rigenera gli artefatti. `bozza-gruppi.txt` conserva la prima stesura superata.', '');
const md = lines.join('\n');
fs.writeFileSync(path.join(dir, 'GERARCHIA_COMPLETA.md'), md);
fs.writeFileSync(path.join(dir, 'catalogo.v0.2.json'), JSON.stringify({
  version: '0.2-draft', status: 'BOZZA_IN_LAVORAZIONE', generatedAt: '2026-11-08',
  stats, nodes: all,
}, null, 2) + '\n');
fs.writeFileSync(path.join(dir, 'conteggi.json'), JSON.stringify(stats, null, 2) + '\n');
const quote = (value) => `"${String(value).replaceAll('"', '""')}"`;
fs.writeFileSync(path.join(dir, 'catalogo-foglie.csv'),
  ['id,nome,percorso,profondita,sinonimi', ...leaves.map((node) =>
    [node.id, node.name, node.path, node.depth, node.aliases.join(';')].map(quote).join(','))].join('\n') + '\n');
const outputDir = 'C:/Users/antet/Documents/Codex/2026-11-08/realtime-voice-chat/outputs';
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, 'VOTILT-gerarchia-categorie-BOZZA.md'), md);
console.log(JSON.stringify({ ...stats, document: path.join(dir, 'GERARCHIA_COMPLETA.md'), userCopy: path.join(outputDir, 'VOTILT-gerarchia-categorie-BOZZA.md') }));
