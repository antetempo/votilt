# Test report · VOTILT

## Revisione creator/catalogo · 8 novembre 2026

**Pronta da verificare su Android locale.** Una categoria per immagine, anche radice/intermedia; cuore al creator nella categoria esatta, nessun rollup. Stesso autore senza nuovo voto/TILT, origine conservata; follow persona e categoria separati. Ricerca con percorsi/sinonimi/vicinanza lessicale, descrizione e tag liberi; profili e classifiche per autore con posizioni correnti reali. Nuovo catalogo: 36 radici, 211 rami, 1216 foglie, 1427 nodi selezionabili, profondità massima 5.

| Prova attuale | Risultato | Evidenza |
|---|---|---|
| Typecheck, lint, format; 120 unit/componenti in 21 suite | PASS | [Regressione](evidence/verify-results.json) |
| 46 integrazioni HTTP/PG generali + 9 creator | PASS | [Generali](evidence/integration-results.json), [creator](evidence/creator-integration-results.json) |
| Migrazione demo con backup e rerun | PASS | [Migrazione](evidence/creator-migration-results.json): 144 contenuti, 6 account e 201 slot conservati al momento della migrazione; 17 associazioni multiple normalizzate, storico conservato |
| Bootstrap fresco + seed ripetuto | PASS | [Bootstrap](evidence/bootstrap-creator-results.json): 1257 foglie incluse le 41 precedenti, 123 approvati, 192 preferenze e 6 account; credenziali invariate al rerun |
| Build autonoma e installazione emulatore | PASS | [Build](../output/build-info.json); APK SHA-256 69c1827ec1b1be1138e3c558731e96d2ed4c846680458ebef1b107dd0f85f45e |
| 11 percorsi Android sull’APK corrente | PASS | [Android creator/catalogo](evidence/android-creator-catalog-results.json): ricerca/percorso, categoria intermedia/follow, stesso creator, TILT annulla/risolve, follow persona, Seguiti, profilo/badge, upload galleria, schermo piccolo/font 130%, proposte rinviate |

La QA aggiunge contenuti e preferenze reali di collaudo tramite API/UI; i conteggi della migrazione sono una fotografia precedente, non la dimensione attuale del runtime. Nessuna password esistente cambiata. Archivio immagini e categorie precedenti preservato; pubblicati non riclassificati nel nuovo catalogo.

Correzioni emerse dal collaudo: dettaglio profilo ora espandibile/filtrabile per mantenere Follow accessibile; guardie e back TILT registrati solo quando la schermata ha focus, evitando il blocco delle tab successive; daily sceglie categorie con contenuti pubblici eleggibili. Schema canonico, migrazioni idempotenti e [checklist](../memory-bank/deep/creator-catalog-migration.md) allineati.

App installata e aperta su Classifiche; dimensioni e font ripristinati. **Approvazione finale di Fabrizio non registrata.** Territori, video e workflow completo proposte editoriali sono rollout successivi. L’illustrazione decorativa scartata non è integrata. Repository **pubblico** per scelta dell’utente; autore commit **antetempo@gmail.com**, account **antetempo**. Commit iniziale a0d85bf e successivo e9d78ab già pushati/verificati; la consegna creator 9ef7508 è pushata su main con hash remoto identico, come da [ricevuta Git](evidence/github-publication.json). Nessun deploy applicativo/store.

[Piano corrente](votilt-creator-catalog-plan.md) · [Gerarchia completa](research/catalogo-editoriale/GERARCHIA_COMPLETA.md) · [Ledger](VOTILT_APPROVAL_LEDGER.md). Le sezioni sotto sono **storico di revisioni precedenti**, con prove e limiti riferiti alle rispettive build.

Data finale: 2026-11-06T19:41:07.271Z. Windows, Node 24.14.0, PostgreSQL 18.3 nativo dedicato, Expo 58.0.23, React Native 0.88.1. AVD Medium_Phone_API_36.1, emulator-5554. Nessun Docker, nessun deploy.

| Prova eseguita | Comando/procedura | Esito e prova |
|---|---|---|
| Verifica sorgenti | npm run verify:all | Typecheck/lint/format PASS; evidence/verify-results.json |
| Unit/componenti | Jest/Testing Library, 11 suite | 96 PASS / 0 FAIL |
| Integrazione HTTP + PostgreSQL reale | npm run test:integration | 46 PASS / 0 FAIL; evidence/integration-results.json |
| Core Android prima demo (storico) | Archivio android-core-e2e-v1.mjs.txt | 7 PASS; evidence/android-results.json |
| Revisione feed/like/classifiche/upload/categorie | node scripts/android-e2e.mjs | 6 PASS; evidence/android-refinement-results.json |
| TILT dinamico / annullamento / movimento ridotto | android-tilt-e2e.mjs + android-tilt-accessibility-e2e.mjs | 7 PASS; scena nativa in movimento, MP4, 320 dp/font 130%, preferenze ripristinate |
| Upload → mod → secondo votante | Picker nativo + android-creator-e2e.mjs | 2 PASS e screenshot 08–16; nessun endpoint privilegiato sostitutivo della UI |
| Friends Battle/Taste Match/notifiche | node scripts/android-social-e2e.mjs | 3 PASS; evidence/android-social-results.json |
| Cold start con API spenta | node scripts/android-offline-e2e.mjs | Cache/immagini recenti e voto disabilitato PASS; screenshot 22 |
| APK, due schermi e Internet pubblico spento | node scripts/android-release-e2e.mjs | 4 PASS; 320×569 dp font 130%, 411×914 dp; screenshot 24–27 |
| Scroll prolungato | android-scroll-e2e.mjs, poi --continue | 103 impressioni significative nella stessa sessione, nessun crash; evidence/android-scroll-results.json |
| Installazione DB da zero + seed doppio | node scripts/verify-bootstrap.mjs | Fresh PASS e rerun PASS; 41 foglie/123 approvati/192 campioni/6 utenti; password invariate |
| Asset | node scripts/audit-assets.mjs | 123 SHA diversi, 111 AI + 12 originali, 800×1200, EXIF assenti |
| Segreti nel bundle | node scripts/audit-bundle.mjs | 8 valori locali assenti; evidence/bundle-audit.json |
| Compatibilità Expo | npx expo-doctor | 20/20 PASS |
| FPS, memoria, throughput | Nessuna misura strumentale | NOT_MEASURED, nessuna promessa 60 FPS |

31 controlli Android registrati PASS nei nove report JSON (18 iniziali + 6 revisione + 7 TILT). Matrice: 40/40 criteri della demo valutati PASS con le evidenze indicate; il quiz disabilitato è previsto dal contratto in assenza di fonti REAL. Non significa prontezza store.

## Verifica host e documentazione · 8 novembre 2026

Prima del commit iniziale `a0d85bf` e del push su `antetempo/votilt` è stata ripetuta `npm run verify:all`: typecheck/lint/format, 96 test unit/componenti in 11 suite e 46 integrazioni PASS. `audit-assets.mjs` conferma 123 hash distinti e assenza EXIF. I JSON host in `evidence/` hanno data 8 novembre; le prove Android riportate sopra restano del 6 novembre.

La successiva revisione del README ha verificato il rendering attraverso l'API Markdown di GitHub, 36 riferimenti locali, sei ancore, 13 script npm, cinque screenshot originali e sette media con hash coerenti. Sintassi degli otto blocchi PowerShell controllata senza eseguirli; `HierarchyDump.java` compilato con JDK 21 e classpath Android 36. Il lettore era stato escluso da Git dalla regola generica `android/`, ora limitata alla directory nativa di radice. Confini di esclusione di segreti/build e acquisizioni grezze verificati. Evidenza: [readme-results.json](evidence/readme-results.json).

Android UI **NOT_RUN** in questa revisione documentale: ADB non elenca dispositivi collegati. Nessuna nuova build o modifica del comportamento applicativo.

## Invarianti e regressioni

Revisione navigazione/scorrimento dell'8 novembre: `verify:all` PASS, 106 unit/componenti in 17 suite e 46 integrazioni. Nuovo APK compilato/installato; `android-navigation-e2e.mjs`: otto percorsi PASS. Verificati classifica diretta senza selettori, posizione iniziale dal secondo risultato e swipe sul terzo, simboli senza pulsanti testuali, share sheet nativo, report raggiungibile senza invio, barra unica su classifica/contenuto/report/impostazioni/TILT, annullamento TILT cambiando tab con campione intatto, piccolo formato/font 130%. Stato originale schermo ripristinato. [Evidenza](evidence/android-navigation-results.json), screenshot 60–67 nelle acquisizioni locali. Le 31 prove iniziali, cinque Classifiche e otto di questa tranche sono eseguite su build/fasi diverse; non tutte ripetute sull'ultimo APK.

Revisione Classifiche dell'8 novembre: `verify:all` PASS con 99 unit/componenti in 12 suite e 46 integrazioni, estese a anteprime canoniche/spareggi, ricerca nei percorsi/foglie vuote, membership pending e blocchi. APK ricompilato/installato; cinque percorsi di `android-rankings-e2e.mjs` PASS: 12 anteprime confrontate con le classifiche canoniche, apertura classifica, ricerca foglia/breadcrumb, nessun risultato, due colonne a 320 dp/font 130%. Dimensioni/font ripristinati, app lasciata su Classifiche. [Evidenza](evidence/android-rankings-results.json). Le 31 prove Android precedenti restano storiche, non tutte ripetute su questa build.

T01–T24/T26–T28 coperti nelle integrazioni (alcuni gruppi condividono una prova); T25 coperto da cache Android/voti bloccati e retry incerto senza falso successo. Le prove concorrenti usano sessioni reali, DB separato e lock/barriere: doppio primo voto, venti resolve duplicati, receipt reuse, stale/superseded, hide/resolve e sospensione mentre un voto o una modifica è già in attesa. Le letture del pool non conservano identità.

Upload: byte falsi respinti, EXIF rimosso, metadati obbligatori, quattro retry simultanei stesso ID, riuso con payload diverso respinto. Fault injection dopo commit restituisce 500 intenzionale, poi retry/download verificano che il JPEG resti disponibile. Un controllo indipendente con advisory lock attende anche il commit ancora aperto. La riga “API error: Error” durante questa prova è attesa, non un fallimento ignorato. Login: il tentativo 31 è limitato; logout revoca soltanto il token corrente. La quota globale viene alzata solo nell'istanza di integrazione per esercitare concorrenza; le quote di login/signup restano attive.

## Problemi rilevati e corretti

Ninja precedente falliva sui percorsi Windows lunghi → CMake 3.31.6/Ninja 1.12.1. Metro osservava directory DB/build → esclusioni valide Windows/POSIX. Upload Android richiedeva File + expo/fetch. Corrette conferma cancellazione, ripresa operazioni pendenti, metadati membership private, filtri profili privati, cambio account/cache, kind compatibili, auth con profilo privato e metadati completi in moderazione.

Nel collaudo finale: creazione esplicita file cache e chiave feed ripristinata; layout compatto per schermo piccolo; controllo utente ripetuto dopo lock; cleanup upload protetto contro commit incerto; logout spostato in funzione autorizzata senza concedere SELECT su sessioni private. Ogni problema sensibile ha una regressione eseguibile. I primi tentativi di scroll registrarono 58/66/95 impressioni utili: è stato esteso il percorso fino a 103 verificate, senza trasformare i soli gesti in contenuti effettivamente visti.

## Artefatto e limiti

APK: output/VOTILT-local-demo.apk, 63677721 byte, SHA256 cc26f2c07d2eb6370efc158379487e912751a24116e77ffe405a75bda47b3f79. Firma debug locale, arm64-v8a e x86_64. Backend locale obbligatorio per mutazioni. Non testato su telefono fisico né con sessione TalkBack completa. Advisory dipendenze low/moderate documentati; nessuna high/critical nell'audit eseguito. Password reset email/push non configurati. Quiz pubblico senza dataset REAL, correttamente disabilitato.
