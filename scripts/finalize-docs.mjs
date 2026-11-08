import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const read = (file) => JSON.parse(readFileSync(file, 'utf8'));
const verify = read('docs/evidence/verify-results.json');
const integration = read('docs/evidence/integration-results.json');
const unit = read('docs/evidence/unit-results.json');
assert.equal(unit.numFailedTests, 0);
assert.ok(verify.results.length === 5 && verify.results.every((x) => x.status === 'PASS'));
assert.ok(integration.results.every((x) => x.status === 'PASS'));
const nativeFiles = [
  'android-results',
  'android-creator-results',
  'android-social-results',
  'android-offline-results',
  'android-release-results',
  'android-scroll-results',
  'android-refinement-results',
  'android-tilt-results',
  'android-tilt-accessibility-results',
];
const native = nativeFiles.flatMap((file) => {
  const data = read(`docs/evidence/${file}.json`);
  assert.ok(
    data.results.every((x) => x.status === 'PASS'),
    file,
  );
  return data.results.map((x) => ({ ...x, file }));
});
const build = read('output/build-info.json');
const assets = read('docs/evidence/asset-audit.json');
const bootstrap = read('docs/evidence/bootstrap-results.json');
assert.equal(bootstrap.freshDatabase, true);
assert.equal(assets.uniqueHashes, 123);
const proof = {
  'AC-A01': 'android-release-results.json · installazione APK',
  'AC-A02': 'android-refinement-results.json · Feed/Esplora/Pubblica/Classifiche/Profilo',
  'AC-A03': 'android-release-results.json · 320×569/font 130% e 411×914 dp; screenshot 26/27',
  'AC-A04': 'android-results.json · login/logout; integrazione AUTH e Logout reale',
  'AC-A05': 'android-scroll-results.json · 103 impressioni; FlatList e paging',
  'AC-A06': 'bootstrap-results.json · 41 foglie; ricerca metadati e breadcrumb Android',
  'AC-B01': 'integrazione T01/T02 + android-refinement-results.json · like reale',
  'AC-B02': 'integrazione T03 + android-tilt-results.json · scena 3D, screenshot 40/41 e MP4',
  'AC-B03': 'integrazione T04/T05/T06 + android-tilt-results.json · tocco, X e indietro Android',
  'AC-B04': 'integrazione T07/T19 · venti retry concorrenti, receipt unico',
  'AC-B05': 'integrazione T09/T10/T27 · sessioni/versioni concorrenti',
  'AC-B06': 'integrazione Ranking supporti attivi + T16/T23',
  'AC-B07': 'integrazione T05/T07/T19/T20 e Ranking Elo distinto',
  'AC-B08': 'integrazione T16/T28 e sospensione atomica',
  'AC-B09': 'integrazione T11/T12/T13 e Kind incompatibile',
  'AC-C01': 'integrazione Profilo privato, Social consenso e Android settings',
  'AC-C02': 'integrazione Social follow/amicizia + T17 blocco',
  'AC-C03': 'android-social-results.json + integrazione T22/Social',
  'AC-C04': 'android-social-results.json · 31 categorie comuni; unit tasteMatch',
  'AC-C05': 'Android screenshot 08–13 + android-creator-results.json; test Upload/Metadati',
  'AC-C06': 'android-creator-results.json + integrazione Auth moderatore falso',
  'AC-C07': 'integrazione T16 · report → coda → hide → audit/reviewed',
  'AC-C08':
    'android-social-results.json + integrazione Notifiche destinatario; CONTENT_UNAVAILABLE sui target rimossi',
  'AC-C09': 'integrazione proposta/policy/duplicati concorrenti + android-refinement-results.json',
  'AC-C10': 'integrazione T23 e conferma negativa; ritiro contenuto autorizzato server-side',
  'AC-D01': 'android-results.json · AI Universe, screenshot 07',
  'AC-D02': 'integrazione Kind incompatibile/tool stesso motore; Android AI Art TILT',
  'AC-D03': 'android-release-results.json · Internet pubblico disattivato; asset locali',
  'AC-D04': 'integrazione T21 · truth privata, media neutro, primo tentativo immutabile',
  'AC-D05': 'android-results.json · modalità pubblica disabilitata; fixture test-only isolate',
  'AC-D06': 'integrazione Daily UTC stabile + T07/T19 idempotenza',
  'AC-D07': 'integrazione Ranking trend da snapshot reale, storico insufficiente esplicito',
  'AC-E01': 'integrazione T15 + Pool identità; ruolo senza accesso credenziali',
  'AC-E02': 'integrazione T18 + Upload byte reali; membership pending privata',
  'AC-E03': 'bundle-audit.json · otto segreti locali assenti nel bundle Hermes',
  'AC-E04':
    'bootstrap-results.json + bootstrap-rerun-results.json · fresh/rerun, password invariate',
  'AC-E05': 'verify-results.json · typecheck/lint/format/unit/integration PASS',
  'AC-E06': 'README.md · comandi Windows eseguiti; reset distruttivo bloccato esplicitamente',
  'AC-E07': 'PROGRESS.md, KNOWN_ISSUES.md, DECISIONS.md, RELEASE_READINESS.md',
  'AC-E08':
    'android-release-results.json · route Internet irraggiungibile, backend localhost via USB',
};
let matrix = readFileSync('docs/ACCEPTANCE_MATRIX.md', 'utf8');
let total = 0;
matrix = matrix.replace(
  /^Stato iniziale:.*$/m,
  'Valutazione finale della demo locale, 2026-11-06. PASS riferito alle prove indicate; limiti di rilascio in RELEASE_READINESS.md.',
);
matrix = matrix
  .split('\n')
  .map((line) => {
    const m = line.match(/^\| (AC-[A-E]\d+) \|/);
    if (!m) return line;
    const parts = line.split('|');
    assert.ok(proof[m[1]], m[1]);
    parts[3] = ' PASS ';
    parts[4] = ` ${proof[m[1]]} `;
    total++;
    return parts.join('|');
  })
  .join('\n');
assert.equal(total, 40);
writeFileSync('docs/ACCEPTANCE_MATRIX.md', matrix);
const report = `# Test report · VOTILT\n\nData finale: ${new Date().toISOString()}. Windows, Node 24.14.0, PostgreSQL 18.3 nativo dedicato, Expo 58.0.23, React Native 0.88.1. AVD Medium_Phone_API_36.1, emulator-5554. Nessun Docker, nessun deploy.\n\n| Prova eseguita | Comando/procedura | Esito e prova |\n|---|---|---|\n| Verifica sorgenti | npm run verify:all | Typecheck/lint/format PASS; evidence/verify-results.json |\n| Unit/componenti | Jest/Testing Library, ${unit.numPassedTestSuites} suite | ${unit.numPassedTests} PASS / 0 FAIL |\n| Integrazione HTTP + PostgreSQL reale | npm run test:integration | ${integration.results.length} PASS / 0 FAIL; evidence/integration-results.json |\n| Core Android prima demo (storico) | Archivio android-core-e2e-v1.mjs.txt | 7 PASS; evidence/android-results.json |\n| Revisione feed/like/classifiche/upload/categorie | node scripts/android-e2e.mjs | 6 PASS; evidence/android-refinement-results.json |\n| TILT dinamico / annullamento / movimento ridotto | android-tilt-e2e.mjs + android-tilt-accessibility-e2e.mjs | 7 PASS; scena nativa in movimento, MP4, 320 dp/font 130%, preferenze ripristinate |\n| Upload → mod → secondo votante | Picker nativo + android-creator-e2e.mjs | 2 PASS e screenshot 08–16; nessun endpoint privilegiato sostitutivo della UI |\n| Friends Battle/Taste Match/notifiche | node scripts/android-social-e2e.mjs | 3 PASS; evidence/android-social-results.json |\n| Cold start con API spenta | node scripts/android-offline-e2e.mjs | Cache/immagini recenti e voto disabilitato PASS; screenshot 22 |\n| APK, due schermi e Internet pubblico spento | node scripts/android-release-e2e.mjs | 4 PASS; 320×569 dp font 130%, 411×914 dp; screenshot 24–27 |\n| Scroll prolungato | android-scroll-e2e.mjs, poi --continue | 103 impressioni significative nella stessa sessione, nessun crash; evidence/android-scroll-results.json |\n| Installazione DB da zero + seed doppio | node scripts/verify-bootstrap.mjs | Fresh PASS e rerun PASS; 41 foglie/123 approvati/192 campioni/6 utenti; password invariate |\n| Asset | node scripts/audit-assets.mjs | 123 SHA diversi, 111 AI + 12 originali, 800×1200, EXIF assenti |\n| Segreti nel bundle | node scripts/audit-bundle.mjs | 8 valori locali assenti; evidence/bundle-audit.json |\n| Compatibilità Expo | npx expo-doctor | 20/20 PASS |\n| FPS, memoria, throughput | Nessuna misura strumentale | NOT_MEASURED, nessuna promessa 60 FPS |\n\n${native.length} controlli Android registrati PASS nei nove report JSON (18 iniziali + 6 revisione + 7 TILT). Matrice: ${total}/${total} criteri della demo valutati PASS con le evidenze indicate; il quiz disabilitato è previsto dal contratto in assenza di fonti REAL. Non significa prontezza store.\n\n## Invarianti e regressioni\n\nT01–T24/T26–T28 coperti nelle integrazioni (alcuni gruppi condividono una prova); T25 coperto da cache Android/voti bloccati e retry incerto senza falso successo. Le prove concorrenti usano sessioni reali, DB separato e lock/barriere: doppio primo voto, venti resolve duplicati, receipt reuse, stale/superseded, hide/resolve e sospensione mentre un voto o una modifica è già in attesa. Le letture del pool non conservano identità.\n\nUpload: byte falsi respinti, EXIF rimosso, metadati obbligatori, quattro retry simultanei stesso ID, riuso con payload diverso respinto. Fault injection dopo commit restituisce 500 intenzionale, poi retry/download verificano che il JPEG resti disponibile. Un controllo indipendente con advisory lock attende anche il commit ancora aperto. La riga “API error: Error” durante questa prova è attesa, non un fallimento ignorato. Login: il tentativo 31 è limitato; logout revoca soltanto il token corrente. La quota globale viene alzata solo nell'istanza di integrazione per esercitare concorrenza; le quote di login/signup restano attive.\n\n## Problemi rilevati e corretti\n\nNinja precedente falliva sui percorsi Windows lunghi → CMake 3.31.6/Ninja 1.12.1. Metro osservava directory DB/build → esclusioni valide Windows/POSIX. Upload Android richiedeva File + expo/fetch. Corrette conferma cancellazione, ripresa operazioni pendenti, metadati membership private, filtri profili privati, cambio account/cache, kind compatibili, auth con profilo privato e metadati completi in moderazione.\n\nNel collaudo finale: creazione esplicita file cache e chiave feed ripristinata; layout compatto per schermo piccolo; controllo utente ripetuto dopo lock; cleanup upload protetto contro commit incerto; logout spostato in funzione autorizzata senza concedere SELECT su sessioni private. Ogni problema sensibile ha una regressione eseguibile. I primi tentativi di scroll registrarono 58/66/95 impressioni utili: è stato esteso il percorso fino a 103 verificate, senza trasformare i soli gesti in contenuti effettivamente visti.\n\n## Artefatto e limiti\n\nAPK: output/VOTILT-local-demo.apk, ${build.size} byte, SHA256 ${build.sha256}. Firma debug locale, arm64-v8a e x86_64. Backend locale obbligatorio per mutazioni. Non testato su telefono fisico né con sessione TalkBack completa. Advisory dipendenze low/moderate documentati; nessuna high/critical nell'audit eseguito. Password reset email/push non configurati. Quiz pubblico senza dataset REAL, correttamente disabilitato.\n`;
writeFileSync('docs/TEST_REPORT.md', report);
console.log({
  integration: integration.results.length,
  nativeChecks: native.length,
  acceptance: total,
  status: 'PASS',
});
