---
title: Consegna locale, verifiche e debito residuo
type: deep
status: superseded
superseded_by: creator-catalog-delivery
date: 2026-11-06
author: Fabrizio
tags: [handoff, testing, local-runtime, debt, release]
related_sessions: [1]
---

# Stato alla chiusura del 2026-11-06

Demo Android locale completata. Piani iniziale, revisione prodotto e TILT con gate PASS. Nessun commit/push/deploy/store; branch main senza commit e file ancora untracked. Non assumere processi attivi alla prossima apertura: verificare e seguire README.md. Nessuna richiesta di spegnere servizi eseguita durante il solo consolidamento.

APK output/VOTILT-local-demo.apk, firma debug, arm64-v8a/x86_64; build-info.json contiene hash/dimensioni. API loopback 4317, DB dedicato 55432, emulator-5554 / Medium_Phone_API_36.1 visibile nell'ultimo collaudo, senza Metro. APK localhost via adb reverse. Dati e configurazioni privati in .local; credenziali demo nel file privato .local/demo-credentials.json. Non copiare valori nel vault e non cambiare password per riavviare la demo.

## Prove misurate

- Typecheck, lint, format PASS; 96 test unit/componenti in 11 suite, 46 integrazioni HTTP/PostgreSQL, tutti PASS.
- 31 controlli Android registrati: 18 prima demo, 6 revisione prodotto, 7 TILT. Sono evidenze di fasi diverse, non 31 percorsi ripetuti tutti dopo ogni modifica. I 7 TILT sono stati ripetuti sull'APK finale.
- Installazione standalone, due formati/font 130%, Internet pubblico spento con backend locale, cache offline e 103 impressioni significative senza crash. TILT: movimento osservato nei fotogrammi, scelta/trasferimento reali, X/indietro senza trasferimento; zero differenze nella zona carte con movimento ridotto.
- Bootstrap da DB vuoto e migrazione/seed doppi; rerun conservano dati e hash delle password. Catalogo base: 41 foglie, 123 candidati distinti, 111 immagini AI dichiarate + 12 tool card originali; 6 utenti, 192 campioni al bootstrap, 12 pending/3 rejected/2 hidden. La demo di lavoro contiene fixture aggiuntive: non azzerare.
- Asset con hash diversi, JPEG 800×1200 senza EXIF; 8 valori segreti locali assenti dal bundle; Expo doctor 20/20 nel collaudo iniziale. FPS/memoria/throughput non misurati.

Rapporto autorevole: docs/TEST_REPORT.md; matrice 40/40 della demo con fonti e limiti: docs/ACCEPTANCE_MATRIX.md. Screenshot/video in docs/evidence/android, ultima scena lasciata aperta 44-final-tilt-open.png, video tilt-motion.mp4.

## Limiti e trigger

Quiz pubblico disabilitato finché non esiste dataset REAL con provenienza verificata; non etichettare AI come REAL. Prima di distribuzione esterna: HTTPS/firma, segreti/backup, moderazione/policy, advisory dipendenze, telefono fisico e TalkBack completo, misure prestazioni. Recupero password email e push non configurati. Trend dipende da snapshot giornalieri manuali e storico vero; nessuna automazione installata. Controllo categorie deterministico + revisione umana, non filtro infallibile.

Ledger debt: cinque marker SQL rappresentano **un solo debito**, lock globale della demo, copiato dal sorgente nei quattro snapshot. Fonte server/schema-core.sql:230; copie schema.sql e migrations/migrate_{votilt_initial,content_metadata_required,categories_rankings_and_policy}.sql. Il trigger esiste semanticamente nel commento francese: raffinare per categoria soltanto dopo una misura che dimostri un collo di contesa. Il rilevatore CLI li classifica no-trigger perché non riconosce quella formulazione; non sono cinque bug distinti. Nessun SQL modificato nel consolidamento; riportare il ledger nel prossimo lavoro di capacità/rilascio, senza inventare soglie numeriche.

Altri limiti e interventi in docs/KNOWN_ISSUES.md e docs/RELEASE_READINESS.md. Riferimenti: [[deploy-checklist]], [[voto-server-autorevole]], [[01-votilt-android-brand-tilt]].
