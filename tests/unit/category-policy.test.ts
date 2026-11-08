import {
  checkCategoryWords,
  checkCategory,
  categoryKey,
  findCategoryMatches,
} from '../../src/utils/categoryPolicy';
describe('testo categorie, normalizzazione e falsi positivi', () => {
  test.each([
    'cazzo',
    'C4ZZ0',
    'c.a.z.z.o',
    'c a z z o',
    'ca\u200bzzo',
    'cаzzo',
    'caaaazzooo',
    'vaffanculo',
    'merda',
    'fottiti',
    'puttana',
    'troia',
    'coglioni',
    'stronzata',
    'fuck',
    'f.u.c.k',
    'f u c k',
    'sh1t',
    'bitch',
    'cunt',
    'motherfucker',
    'porco dio',
    'porca madonna',
    'pornografia',
    'childporn',
    'pedofilia',
    'zoofilia',
    'neonazisti',
    'heil hitler',
    'nigger',
    'faggot',
    'gay schifosi',
    'peggiori musulmani',
    'donne inferiori',
    'uccidi tutti',
    'morte agli ebrei',
    'bambini sexy',
    'minorenni nudi',
    'teen hot',
    'classifica razze',
    'compra cocaina',
    'www.spam.it',
    '<script>alert</script>',
    'f**k',
  ])('blocca %s', (title) => {
    expect(checkCategoryWords({ title })).not.toHaveLength(0);
  });
  test.each([
    'Cocktail classici',
    'Classifiche artistiche',
    'Assisi panorami',
    'Donazioni creative',
    'Sega videogiochi',
    'Gatti criminali',
    'Attori gay',
    'Attrici femminili',
    'Ritratti di donne',
    'Artisti musulmani',
    'Fotografia in bianco e nero',
    'Foreste e muschi',
    'Città del futuro',
    'Paesaggi mozzafiato',
    'Cappelli eleganti',
    'Pizza Margherita',
  ])('non blocca %s per sottostringhe o identità', (title) => {
    expect(checkCategoryWords({ title })).toHaveLength(0);
  });
  test('controlla descrizione ed esempi oltre al titolo', () => {
    expect(
      checkCategoryWords({
        title: 'Paesaggi al mare',
        description: 'Una descrizione con cazzo mascherato',
        examples: ['normale', 'f.u.c.k'],
      }),
    ).toHaveLength(2);
  });
});
describe('categorie equivalenti e suggerimenti', () => {
  const candidates = [
    { id: 'actor', title: 'Attrici femminili' },
    { id: 'web', title: 'Siti web' },
    { id: 'pizza', title: 'Pizza Margherita' },
    { id: 'look', title: 'Sguardi dolci' },
  ];
  test.each(['ATTRICI FEMMINILI', 'attrici', 'attrice femminile', 'actresses', 'attori femminili'])(
    'categoria persona equivalente %s',
    (title) => expect(checkCategory({ title }, candidates).duplicate).toBe(true),
  );
  test.each(['siti internet', 'website', 'siti web', 'SITI WEB'])(
    'categoria sito equivalente %s',
    (title) => expect(categoryKey(title)).toBe(categoryKey('Siti web')),
  );
  test('refusi e parole invertite suggeriscono il duplicato corretto', () => {
    expect(findCategoryMatches('Piza Margherita', candidates)[0]).toMatchObject({
      id: 'pizza',
      duplicate: true,
    });
    expect(findCategoryMatches('dolci sguardi', candidates)[0]).toMatchObject({
      id: 'look',
      duplicate: true,
    });
  });
  test('categoria distinta non è bloccata da una parola comune', () => {
    expect(checkCategory({ title: 'Pizza al tartufo' }, candidates).duplicate).toBe(false);
  });
  test('proposta privata altrui blocca duplicato senza esporre identità o testo', () => {
    const result = checkCategory(
      { title: 'Paesaggi alieni' },
      [{ id: 'private-id', title: 'Paesaggi alieni', status: 'pending', proposerId: 'other' }],
      'viewer',
    );
    expect(result.allowed).toBe(false);
    expect(result.pendingDuplicate).toBe(true);
    expect(result.matches).toEqual([]);
  });
  test('la propria proposta pending è indicata come in revisione', () => {
    expect(
      checkCategory(
        { title: 'Paesaggi alieni' },
        [{ id: 'own', title: 'Paesaggi alieni', status: 'pending', proposerId: 'viewer' }],
        'viewer',
      ).matches[0].status,
    ).toBe('pending');
  });
});
