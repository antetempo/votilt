# Avanzamento VOTILT

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

App installata e aperta su Classifiche; dimensioni e font ripristinati. **Approvazione finale di Fabrizio non registrata.** Territori, video e workflow completo proposte editoriali sono rollout successivi. L’illustrazione decorativa scartata non è integrata. Repository **pubblico** per scelta dell’utente; autore commit **antetempo@gmail.com**, account **antetempo**. Commit iniziale a0d85bf e successivo e9d78ab già pushati/verificati; la nuova consegna viene registrata nella [ricevuta Git](evidence/github-publication.json) dopo il push. Nessun deploy applicativo/store.

[Piano corrente](votilt-creator-catalog-plan.md) · [Gerarchia completa](research/catalogo-editoriale/GERARCHIA_COMPLETA.md) · [Ledger](VOTILT_APPROVAL_LEDGER.md). Le sezioni sotto sono **storico di revisioni precedenti**, con prove e limiti riferiti alle rispettive build.

Aggiornato: 2026-11-08. Checkout C:\APP\AI\VOTILT, branch main. Stato: **READY FOR LOCAL DEMO**. Commit iniziale `a0d85bf7240beb73f18406b99ed494a167984816` e push completati sul repository privato [antetempo/votilt](https://github.com/antetempo/votilt). Docker escluso; nessun deploy applicativo o rilascio store.

## Repository e documentazione · 8 novembre 2026

Revisione navigazione/scorrimento PASS: [votilt-navigation-plan.md](votilt-navigation-plan.md). Categoria direttamente sulla classifica, rimossi Immagini/Classifica; tocco immagine → stesso Feed con ID iniziale e ordine/ metrica canonici. Barra originale unica nel contenitore comune, disponibile anche nelle route Stack; azioni media condivise a simboli per cuore, share, link e opzioni/report/ritiro. Navigazione da TILT con annullamento autorevole e invio protetto. Regressione: 106 unit/componenti in 17 suite, 46 integrazioni, otto prove Android PASS in [android-navigation-results.json](evidence/android-navigation-results.json). APK compilato/installato; formato/font ripristinati e app aperta su Classifiche. Nessun nuovo commit/push/deploy.

Revisione Classifiche PASS: [votilt-rankings-plan.md](votilt-rankings-plan.md). Vetrina dei primi contenuti reali per foglia, ricerca diretta con breadcrumb, categoria vuota raggiungibile senza vincitore inventato. Estensione `category_rankings` e snapshot/migrazione `migrate_categories_leader_previews.sql`; API `ranking` riutilizzata per la scelta canonica. Regressione host aggiornata PASS: 99 unit/componenti in 12 suite, 46 integrazioni con spareggi/membership/blocchi. Nuovo APK compilato/installato; cinque percorsi Android PASS in [android-rankings-results.json](evidence/android-rankings-results.json), compresi 12 leader confrontati con la classifica canonica e due colonne a 320 dp/font 130%. Totale storico: 31 controlli Android precedenti + 5 di questa revisione, svolti su build diverse.

PASS: commit iniziale `Initial import VOTILT`, autore Git `antetempo <antetempo@gmail.com>`, 477 file; `main` e `origin/main` verificati allo stesso hash dopo il push. Credenziali, `.local/`, APK e directory native esclusi. Regressione host ripetuta prima del commit: typecheck/lint/format, 96 unit/componenti e 46 integrazioni PASS; audit dei 123 asset PASS.

README riprogettato con copertina Dark Neon, cinque screenshot reali e video TILT con manifesto, scopo e funzionalità, guida dal clone alla build/APK, sviluppo, architettura, test, manutenzione e troubleshooting. Validati rendering GitHub Markdown, 36 riferimenti locali, sei ancore, 13 script npm, otto blocchi PowerShell e integrità dei sette media. La regola Git `android/` era troppo ampia: ora ignora solo `/android/`, lasciando includibile `scripts/android/HierarchyDump.java`; acquisizioni grezze escluse esplicitamente e selezione curata in `docs/media/`. Sorgente Java compilato. Prova: [readme-results.json](evidence/readme-results.json).

Questi aggiornamenti documentali e del memory bank sono locali, successivi al push iniziale: nessun secondo commit/push eseguito. Nessun dispositivo Android collegato durante questa revisione; prove UI del 6 novembre conservate, senza dichiarare nuove esecuzioni.

| Step | Stato | Evidenza |
|---|---|---|
| Studio/piano | PASS | Tre revisori iniziali e audit finale; votilt-plan.md, DECISIONS.md |
| Memory bank | PASS | 7/7 core, requisiti integrali e nuovo requisito metadati preservati; firma Fabrizio |
| M0 | PASS | API/PG nativi dedicati, APK arm64/x86_64 installato, Expo doctor 20/20 |
| M1 | PASS | Bootstrap da zero: 41 foglie, 123 approvati, 12 pending/3 rejected/2 hidden, 6 utenti, 192 campioni; rerun non cambia password/dati |
| M2 | PASS | Motore/receipt/Elo/lock/privacy verificati; Android primo voto, annulla, trasferisce e ranking |
| M3 | PASS | Upload reale → approvazione mobile → voto secondo account; social, Friends Battle, notifiche; audit/report/restore/sospensione e cancellazione verificati |
| M4 | PASS | Art/Tools stesso motore, daily UTC e trend autentico; quiz pubblico disabilitato come previsto senza dataset REAL |
| M5 | PASS | 46 integrazioni, 96 unit/componenti, 31 controlli Android (18 iniziali + 6 revisione + 7 TILT); due formati/font 130%, offline, Internet pubblico spento, 103 impressioni senza crash; documentazione |

## Revisione prodotto e brand

PASS: piano votilt-refinement-plan.md. Feed con like compatto, categoria e sola didascalia autore espandibile; navigazione alta senza wordmark. Centro solo simbolo di pubblicazione, vecchio hub archiviato. Classifiche dalle categorie più votate, ricerca categoria e ricerca interna. Proposte con controllo parole/offuscamenti e duplicati concorrenti; bozza conservata quando si sceglie la categoria suggerita. Brandbook HTML/PDF e 23 icone originali; colori e contrasto preservati. Collaudo della revisione e nuova build installata.

## TILT dinamico

Piano votilt-tilt-plan.md: scena a schermo intero con sola scritta TILT, carte in prospettiva 3D, ingresso elastico, fluttuazione, riflesso, orbita e scelta in primo piano. Un tocco sull’immagine risolve; X e indietro annullano. Conferma solo dopo il server, doppio tocco/errore/offline testati, movimento ridotto e schermo piccolo verificati. Video in evidence/android/tilt-motion.mp4.

## Artefatti e avvio

APK autonomo: output/VOTILT-local-demo.apk, firma debug locale. Backend avviato su loopback 4317, DB VOTILT 55432; servizio PC 5432 intatto. APK usa localhost tramite `adb reverse tcp:4317 tcp:4317`; Metro non serve per provarlo. README.md contiene setup e credenziali demo nel solo file privato .local/demo-credentials.json.

Evidenze autorevoli: TEST_REPORT.md, ACCEPTANCE_MATRIX.md e docs/evidence/*.json. Ogni PASS rimanda a prove eseguite. Le immagini originali sono tutte completate: 111 AI dichiarate + 12 tool card, 123 SHA diversi; manifest e contact sheet inclusi.

## Decisioni e controlli finali

Requisito chat: ogni immagine ha categoria, nome e riferimento fondamentale. Persona → nome; sito/tool → nome e link. Modulo dinamico, metadati per associazione, validazione server e ricerca. Vedere CONTENT_METADATA.md.

Corretti gli audit: conferma delete, replay pendenti, membership private, profili privati, cache cambio account, kind compatibili, coda con riferimenti completi; inoltre sospensione dopo lock, upload con commit incerto e logout tramite funzione autorizzata. Le nuove prove includono barriere reali, fault injection, retry upload concorrenti e rate limit login.

## Limiti e prossimi passi

Demo locale, non produzione. Quiz senza REAL verificata resta spento; niente recupero password email/push. FPS, memoria, throughput e TalkBack completo non misurati/testati. Advisory low/moderate documentati, nessuna high/critical nell'audit eseguito. Piccole etichette tab possono abbreviarsi con font grandi. Nessun blocco critico noto dopo le regressioni.

Prossimi passi: prova del prodotto e feedback; dataset quiz curato se richiesto; hardening e distribuzione soltanto con autorizzazione dedicata. KNOWN_ISSUES.md e RELEASE_READINESS.md conservano i limiti.
