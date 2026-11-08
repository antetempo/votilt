---
title: Creator, catalogo e consegna Android verificata
type: session
status: consolidated
date: 2026-11-08
session: 4
author: Fabrizio
tags: [creator, catalogo, android, follow, tags, migration, testing, github]
touched_files: [app/, src/, server/, scripts/, tests/, data/editorial-catalog.json, schema.sql, migrations/, docs/, memory-bank/]
related_commits: [e9d78ab0923928e64648986e2ebf801e6eccac13]
linked_patterns: ["[[voto-server-autorevole]]", "[[categoria-unica-selezionabile]]", "[[tag-liberi-proposte-editoriali]]", "[[creator-catalog-migration]]", "[[repository-github-public]]", "[[creator-catalog-delivery]]"]
---
<!-- Appunti della sessione corrente; consolidamento storico solo su richiesta esplicita. -->

## Revisione editoriale successiva al consolidamento

Fabrizio contesta correttamente foglie da didascalia e numero artificiale: riscritti tutti i domini in catalogo-editoriale.txt, versione v0.2 con 1216 foglie, 211 rami, 1427 nodi, profondità 5, 270 foglie news. Numeri di figli variabili, temi naturali. V0.1 conservata come storico, non importata. Documento e copia outputs aggiornati; ricerca tag con fonti primarie/secondarie distinte.

## Correzioni vincolanti di Fabrizio

Una categoria unica per contenuto anche intermedia/radice; preferenza creator nella categoria esatta, nessun rollup ad antenati. Tag e descrizione liberi persistenti, suggerimenti lessicali sul catalogo esistente con scelta autore; nessuna AI semantica simulata né riclassificazione automatica. Proposte di categorie riaperte come rollout successivo, coda separata, analisi interna e approvazione editoriale umana. Prima implementazione tiene il workflow non attivo.

Commit e9d78ab eseguito dopo 106 unit e 46 integrazioni PASS, primo push fallito per credenziali. Autore corretto confermato antetempo@gmail.com, account GitHub antetempo; verifica ripristino accesso in corso. Nuovo motore/UI non ancora collaudati né installati al checkpoint.

## Implementazione e verifiche creator/catalogo

Applicati 1427 nodi editoriali (1216 foglie, 211 rami, 36 radici), tutti selezionabili, registro UUID persistente e SQL seed idempotente. Preferenza autore/categoria esatta, origine immagine, stessa persona senza doppio voto/TILT; rating/eventi/snapshot creator separati. Una categoria attiva per contenuto; descrizione/tag liberi validati e suggerimenti lessicali/typo senza API esterne. Follow persona e categoria esatta, feed deduplicato; profili con conteggi reali e dettagli espandibili/filtrabili; quattro badge nativi di posizione corrente e categoria sotto, non certificazioni.

Migrazione demo PASS dopo backup: 144 contenuti, 6 account, 201 slot e credenziali conservati; 17 associazioni multiple normalizzate con storico archiviato, 116 categorie precedenti preservate. Nessuna riclassificazione automatica dei pubblicati nel nuovo albero. Bootstrap fresco e rerun PASS nel nuovo DB dedicato votilt_creator_bootstrap_test: 1257 foglie incluse le 41 precedenti, 123 asset, 192 preferenze e 6 account; password invariate.

Regressione host: 120 unit/componenti in 21 suite e 46+9 integrazioni PASS. Trovati e corretti durante QA: dettagli profilo spingevano Follow fuori vista (ora espandibili/filtrabili); TILT fuori focus restava montato e bloccava la barra/back (guardia e listener ora legati al focus, test di blur). Runner migrazioni evita riscritture di snapshot identici, prevenendo conflitti Windows con lettori/indexer. Daily seleziona solo categorie con contenuti pubblici effettivi.

Build autonoma aggiornata/installata più volte per verificare le correzioni; collaudo Android finale ancora in corso a questo checkpoint. Illustrazione generata scartata dall’utente, mai integrata o usata come copertina catalogo. Grafica funzionale nativa e legenda SVG esplicitamente esemplificativa. Repository pubblico per scelta esplicita di Fabrizio; commit/push e9d78ab completati con antetempo/Gmail, senza deploy.

## Chiusura tecnica verificata

Undici percorsi Android PASS sull’APK SHA-256 69c1827ec1b1be1138e3c558731e96d2ed4c846680458ebef1b107dd0f85f45e, realmente compilato/installato, formato/font ripristinati e app aperta su Classifiche. Verificati ricerca/percorso/typo, categoria intermedia e follow, stessa persona senza duplicazione/TILT, TILT fra autori con annullamento via tab e risoluzione, follow persona, Seguiti senza duplicati, profilo con posizione corrente, upload nativo da galleria con una categoria e tag, schermo piccolo/font 130%, informazioni sulle proposte successive. Report android-creator-catalog-results.json.

README aggiornato con quattro schermate effettive dell’ultima build, legenda badge originale dichiarata esemplificativa, manifesto/hash e guida completa. Piano/ledger/PROGRESS/TEST_REPORT distinguono pronta da verificare e approvazione umana non registrata; vecchie prove conservate come storico. Asset base auditati 123 hash unici; otto segreti locali assenti dal bundle corrente. Catalogo completo e copia utente rigenerati con stato verificato. Nessuna illustrazione decorativa scartata integrata.

Commit iniziale a0d85bf e successivo e9d78ab già pushati/verificati su repository pubblico per scelta esplicita. Nuova consegna in preparazione per commit/push già autorizzati, autore antetempo@gmail.com; hash finale soltanto nella ricevuta Git dopo verifica remota. Nessun deploy applicativo/store. Sessione consolidata a nome di Fabrizio.

Disposizioni diario precedenti restano pendenti: nessuna chiusura umana dedotta dai test o dai commit. Owner Fabrizio; trigger prossimo riscontro di prodotto. Quiz REAL e hardening restano a trigger espliciti, non attività eseguite in questa tranche.
