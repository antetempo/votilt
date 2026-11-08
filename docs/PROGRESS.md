# Avanzamento VOTILT

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
