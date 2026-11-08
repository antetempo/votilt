// Shared local policy for category proposals. A deterministic first pass, followed by human review.
// Never classify identity words alone as abusive; compare whole words to avoid Scunthorpe-style false positives.
const confusables: Record<string, string> = {
  а: 'a',
  е: 'e',
  о: 'o',
  р: 'p',
  с: 'c',
  у: 'y',
  х: 'x',
  і: 'i',
  ј: 'j',
  ѕ: 's',
  α: 'a',
  ο: 'o',
  ι: 'i',
  κ: 'k',
  ν: 'v',
  τ: 't',
};
export function normalizeCategoryText(value: string) {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[аеорсухіјѕαοικντ]/g, (c) => confusables[c])
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/\p{Cf}/gu, '')
    .replace(
      /[013457@$!]/g,
      (c) =>
        ({
          '0': 'o',
          '1': 'i',
          '3': 'e',
          '4': 'a',
          '5': 's',
          '7': 't',
          '@': 'a',
          $: 's',
          '!': 'i',
        })[c] || c,
    )
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}
const badWords =
  `cazzo cazzi cazzata cazzate cazzone cazzoni vaffanculo fanculo fottiti fottete fottuto fottuta fottuti fottute fottere fottesega stronzo stronza stronzi stronze stronzata stronzate merda merde merdoso merdosa coglione coglioni cogliona coglionate minchia minchiate puttana puttane puttaniere troia troie zoccola zoccole bastardo bastarda bastardi bastarde testa-di-cazzo rincoglionito rincoglionita rincoglioniti cretino cretina idiota idioti imbecille imbecilli deficiente deficienti porcodio porcamadonna dio-cane bestemmia fica figa fotte pompino pompini sega seghe sborrata sborra sperma porno pornografia pornografico pornografica pornhub xvideos onlyfans fuck fucker fucking motherfucker shit bullshit asshole arsehole bitch bitches cunt cunts dick dicks cock cocks blowjob blowjobs cum cumshot gangbang rape rapist pedofilo pedofili pedofilia pedopornografia childporn lolicon shotacon zoofilia bestiality necrofilia necrophilia finocchio finocchi frocio froci ricchione ricchioni negro negri negraccio nigger nigga faggot fag dyke tranny retard retarded nazista nazisti neonazista neonazisti heil-hitler sieg-heil`.split(
    /\s+/,
  );
const collapse = (s: string) => s.replace(/(.)\1+/g, '$1');
const forbidden = new Set(
  badWords
    .filter((w) => !['sega', 'seghe'].includes(w))
    .flatMap((w) => {
      const n = normalizeCategoryText(w);
      return [n, collapse(n)];
    }),
);
const phraseRules: [RegExp, string][] = [
  [/(?:porco|porca|bestemmia)\s+(?:dio|madonna)|dio\s+(?:cane|porco)/, 'LANGUAGE'],
  [
    /(?:uccidi|ammazza|stupra|kill|rape)\s+(?:tutti|tutte|le|i|gli|all|them)|(?:morte|death)\s+(?:ai|agli|alle|a|to)/,
    'THREAT',
  ],
  [
    /(?:bambin\w*|minoren\w*|minor\w*|child\w*|teen\w*|underage|ragazzin\w*)\s+(?:nudi|nude|sexy|erot\w*|porn\w*|hot)|(?:sexy|erot\w*|porn\w*|nudi|nude)\s+(?:bambin\w*|minoren\w*|child\w*|teen\w*|underage)/,
    'SEXUAL',
  ],
  [
    /(?:peggiori|inferiori|schifos\w*|brutt\w*|sporchi|stupid\w*|worst|inferior|disgusting)\s+(?:donne|uomini|gay|lesbiche|trans|neri|bianchi|ebrei|musulmani|disabili|women|men|jews|muslims|blacks)|(?:donne|uomini|gay|lesbiche|trans|neri|ebrei|musulmani|disabili|women|jews|muslims)\s+(?:inferiori|schifos\w*|brutt\w*|sporchi|inferior|disgusting)/,
    'HATE',
  ],
  [
    /(?:supremazia|supremacy)\s+(?:bianca|razziale|white)|(?:classifica|migliori|peggiori)\s+(?:razze|etnie|religioni)|(?:white|racial)\s+supremacy/,
    'HATE',
  ],
  [
    /(?:compra|acquista|buy)\s+(?:droga|cocaina|eroina|fentanyl)|(?:truffa|scam)\s+(?:bitcoin|crypto)|(?:soldi|guadagni)\s+facili/,
    'SPAM',
  ],
];
export type CategoryIssue = { field: string; code: string; message: string };
export type CategoryCandidate = { id: string; title: string; status?: string; proposerId?: string };
export type CategoryMatch = {
  id: string;
  title: string;
  duplicate: boolean;
  score: number;
  status: string;
};
export type CategoryCheck = {
  allowed: boolean;
  issues: CategoryIssue[];
  matches: CategoryMatch[];
  duplicate: boolean;
  pendingDuplicate: boolean;
};
export function checkCategoryWords(fields: Record<string, string | string[]>): CategoryIssue[] {
  const issues: CategoryIssue[] = [];
  for (const [field, value] of Object.entries(fields))
    for (const text of Array.isArray(value) ? value : [value]) {
      const n = normalizeCategoryText(text);
      const words = n.split(' ');
      const compactRuns = n.replace(/(?:\b[\p{L}\p{N}]\s+){2,}[\p{L}\p{N}]\b/gu, (s) =>
        s.replace(/\s/g, ''),
      );
      const variants = [n, compactRuns];
      let code = '';
      if (
        variants.some(
          (v) =>
            v.split(' ').some((w) => forbidden.has(w) || forbidden.has(collapse(w))) ||
            forbidden.has(v) ||
            forbidden.has(collapse(v)),
        )
      )
        code = 'LANGUAGE';
      for (const [pattern, reason] of phraseRules) if (pattern.test(n)) code = reason;
      if (
        /\b(?:bambin\w*|minoren\w*|minor\w*|child\w*|teen\w*|underage|ragazzin\w*)\b/.test(n) &&
        /\b(?:sexy|erotic\w*|porn\w*|nudi|nude|naked|hot)\b/.test(n)
      )
        code = 'SEXUAL';
      if (/(?:https?:\/\/|www\.|<\/?[a-z][^>]*>|[\p{L}]\*{2,}[\p{L}]|(.)\1{7,})/iu.test(text))
        code = 'FORMAT';
      if (field === 'title' && (!n || n.length < 3 || words.length > 10)) code = 'FORMAT';
      if (code && !issues.some((x) => x.field === field && x.code === code))
        issues.push({
          field,
          code,
          message:
            code === 'FORMAT'
              ? 'Usa testo leggibile, senza link, pubblicità o parole mascherate.'
              : code === 'HATE'
                ? 'La categoria non può offendere o classificare gruppi per caratteristiche personali.'
                : code === 'SEXUAL'
                  ? 'La categoria contiene riferimenti sessuali non ammessi.'
                  : code === 'THREAT'
                    ? 'Minacce e incitamenti alla violenza non sono ammessi.'
                    : 'Riformula il testo senza insulti, volgarità o contenuti inappropriati.',
        });
    }
  return issues;
}
const ignored = new Set(
  'il lo la le gli i un una uno di del dello della delle dei degli per con e ed the a an of for with categoria categorie foto immagini fotografie migliori migliore best'.split(
    ' ',
  ),
);
const aliases: Record<string, string> = {
  attrici: 'attrice',
  actress: 'attrice',
  actresses: 'attrice',
  attori: 'attore',
  actors: 'attore',
  actor: 'attore',
  femminili: 'femminile',
  female: 'femminile',
  maschili: 'maschile',
  male: 'maschile',
  gatti: 'gatto',
  cats: 'gatto',
  cat: 'gatto',
  cani: 'cane',
  dogs: 'cane',
  dog: 'cane',
  pizze: 'pizza',
  burgers: 'burger',
  siti: 'sito',
  sites: 'sito',
  site: 'sito',
  website: 'sitoweb',
  websites: 'sitoweb',
  internet: 'web',
  tools: 'tool',
  strumenti: 'tool',
  criminali: 'criminale',
  dolci: 'dolce',
  sguardi: 'sguardo',
  sorrisi: 'sorriso',
  contagiosi: 'contagioso',
  personaggi: 'personaggio',
  immaginari: 'immaginario',
  citta: 'citta',
  città: 'citta',
  futuristiche: 'futuristico',
  futuristici: 'futuristico',
};
export function categoryKey(title: string) {
  let tokens = normalizeCategoryText(title)
    .split(' ')
    .filter((x) => !ignored.has(x))
    .map((x) => aliases[x] || x);
  if (tokens.includes('sito') && tokens.includes('web'))
    tokens = tokens.filter((x) => x !== 'sito' && x !== 'web').concat('sitoweb');
  if (tokens.includes('attore') && tokens.includes('femminile'))
    tokens = tokens.filter((x) => x !== 'attore' && x !== 'femminile').concat('attrice');
  if (tokens.includes('attrice')) tokens = tokens.filter((x) => x !== 'femminile');
  return [...new Set(tokens)].sort().join(' ');
}
function distance(a: string, b: string) {
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++)
      row[j] = Math.min(
        row[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    previous = row;
  }
  return previous[b.length];
}
export function findCategoryMatches(
  title: string,
  candidates: CategoryCandidate[],
): CategoryMatch[] {
  const key = categoryKey(title);
  if (key.length < 2) return [];
  return candidates
    .map((c) => {
      const other = categoryKey(c.title);
      const similarity = 1 - distance(key, other) / Math.max(key.length, other.length, 1);
      const exact = key === other || key.replace(/ /g, '') === other.replace(/ /g, '');
      const duplicate =
        exact ||
        (Math.min(key.length, other.length) >= 7 &&
          similarity >= 0.9 &&
          Math.abs(key.split(' ').length - other.split(' ').length) <= 1);
      const contained = other.includes(key) || key.includes(other);
      return {
        id: c.id,
        title: c.title,
        status: c.status || 'published',
        duplicate,
        score: exact ? 1 : Math.max(similarity, contained ? 0.7 : 0),
      };
    })
    .filter((c) => c.duplicate || c.score >= 0.45)
    .sort(
      (a, b) =>
        Number(b.duplicate) - Number(a.duplicate) ||
        b.score - a.score ||
        a.title.localeCompare(b.title),
    )
    .slice(0, 5);
}
export function checkCategory(
  input: { title: string; description?: string; examples?: string[] },
  candidates: CategoryCandidate[],
  viewerId?: string,
): CategoryCheck {
  const issues = checkCategoryWords({
    title: input.title,
    description: input.description || '',
    examples: input.examples || [],
  });
  const matches = findCategoryMatches(input.title, candidates);
  const duplicates = matches.filter((x) => x.duplicate);
  const visible = matches.filter(
    (m) =>
      m.status === 'published' || candidates.find((c) => c.id === m.id)?.proposerId === viewerId,
  );
  const pendingDuplicate = duplicates.some((x) => x.status === 'pending');
  return {
    allowed: issues.length === 0 && duplicates.length === 0 && categoryKey(input.title).length >= 3,
    issues,
    matches: visible,
    duplicate: duplicates.length > 0,
    pendingDuplicate,
  };
}
