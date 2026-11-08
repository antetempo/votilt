---
title: Navigazione Android e piano creator con catalogo editoriale
type: session
status: consolidated
date: 2026-11-08
session: 3
author: Fabrizio
tags: [android, classifiche, creator, catalogo, piano, ricerca]
touched_files: [src/features/, src/components/, app/, server/api.sql, docs/votilt-creator-catalog-plan.md, docs/research/catalogo-editoriale/, memory-bank/]
related_commits: [a0d85bf7240beb73f18406b99ed494a167984816]
linked_patterns: ["[[voto-server-autorevole]]", "[[creator-per-foglia]]"]
---
<!-- Appunti della sessione corrente; consolidamento storico solo su richiesta esplicita. -->

## Feedback vocale di Fabrizio · 8 novembre 2026

### Secondo feedback · navigazione e dettaglio · PASS

Richiesta ricevuta dalla prova dell'utente: classifica diretta senza Immagine/Immagini/Classifica; tocco riga → scorrimento come nel feed; barra inferiore sempre disponibile nelle altre interfacce; soli comandi personalizzati per like/share/report. Implementazione e audit in docs/votilt-navigation-plan.md. MainNavigation nel contenitore comune, tab native senza barra duplicata. Feed condiviso anche da ContentViewer, con lista canonica categoria/metrica e ID iniziale; contenuti non pubblici isolati nel dettaglio autorizzato. MediaActions unico per cuore/share/link/opzioni, ritiro proprietario con conferma. Guardiano per annullare TILT sul server prima del cambio tab e bloccare navigazione durante invio; arena dimensionata sullo spazio disponibile.

Verifiche: typecheck/lint/format PASS, 106 unit/componenti in 17 suite e 46 integrazioni PASS; nuova build APK compilata/installata. Otto percorsi Android PASS in docs/evidence/android-navigation-results.json, screenshot 60–67. Selezionato il secondo risultato, osservato come prima immagine, poi swipe sul terzo; share nativo, report non inviato, ritorno Feed e impostazioni; like dal cuore e annullamento reale via tab, campione invariato; 320 dp/font 130%, poi ripristino. App aperta su Classifiche, runtime locale attivo. Nessun nuovo SQL, dipendenza, commit/push/deploy; nessun nuovo cascade. I tipi Expo locali erano vecchi (tab tilt invece di create): rigenerati con avvio Metro offline e Metro fermato; APK rimane autonomo.

App Android riavviata su richiesta: API Node e AVD avviati, DB dedicato già in esecuzione, adb reverse ripristinato, schermata Esplora osservata. Nessun dato/credenziale ricreato.

Nuova richiesta: niente classifica delle categorie; home Classifiche con immagini prime in alcune categorie e ricerca libera diretta delle sottocategorie finali (foglie), riconoscibili nella gerarchia. Piano `docs/votilt-rankings-plan.md`. Implementata vetrina a due colonne, ricerca fissa con percorso e apertura della classifica foglia. Server estende category_rankings con path e leader nullable, riusa ranking canonico Like; default 12 anteprime, ricerca fino a 100 foglie, anche senza voti. Chiave cache versionata sotto il prefisso già invalidato dal voto.

Migrazione idempotente `migrate_categories_leader_previews.sql`, schema e altri snapshot generati dal runner; checklist DB aggiornata. Nessuna password/credenziale modificata. Regressione host finale: 99 unit/componenti (12 suite), 46 integrazioni PASS, inclusi primo posto, spareggi, parent search, membership pending e blocco. I primi tentativi del test nuovo correggevano fixture matches=wins+losses e selezione per UUID tra categorie di test omonime persistenti; nessun bug runtime mascherato. APK standalone ricompilato e installato. Test Android dedicato: cinque percorsi PASS, 12 leader confrontati con la classifica canonica, apertura foglia, ricerca con breadcrumb, caso vuoto, formato piccolo/font 130%; dimensioni/font ripristinati, app lasciata sulla nuova schermata Classifiche. Evidenza docs/evidence/android-rankings-results.json. Nessun commit/push/deploy autorizzato o eseguito per questa tranche; nessun nuovo cascade memory bank richiesto.

## Nuovo mandato creator/catalogo

Fabrizio autorizza piano persistente, aggiornamento memory bank, commit/push dei lavori pertinenti su antetempo/votilt, poi modifica dell’app fino a build e installazione Android verificate. Il gate preventivo sul piano, inizialmente richiesto, viene esplicitamente revocato: procedere automaticamente. Conservare la distinzione pronta da verificare/approvata; nessun deploy.

Piano docs/votilt-creator-catalog-plan.md con audit r1/r2 e cross-fase, fasi F0–F8, generazione immagini esplicita, migrazione non distruttiva, follow distinti, profili/classifiche/badge, territori senza risultati finti. Decisione [[creator-per-foglia]]: autore preferito per utente/foglia, origine immagine tracciata, stessa persona senza doppio voto o TILT, classificazione visibile. Catalogo solo editoriale, niente proposte utenti; immagini prima, video successivi.

Ricerca primaria W3C SKOS, IAB, IPTC, Pew, Ofcom e fonti documentate nel piano. Bozza completa docs/research/catalogo-editoriale/GERARCHIA_COMPLETA.md, JSON/CSV e conteggi; copia apribile nella cartella outputs della chat vocale. Contati 36 aree, 438 rami, 1530 foglie, 1968 nodi, profondità massima 6. News riscritte in 270 foglie dopo correzione utente: politica, esteri, geopolitica, economia, finanza, cronaca, società e sanità. Ricerca hashtag effettiva, fonti primarie/secondarie e limiti Instagram/X distinti in TAG_SOCIAL.md; nessun volume o trend inventato. Molti rami iniziali hanno sei foglie: limite editoriale dichiarato, non validazione semantica.

A questo checkpoint: nuova tassonomia non ancora importata e motore creator non ancora implementato; nessuna nuova immagine generata. Revisione app precedente già testata: 106 unit/componenti e 46 integrazioni, 8 flussi Android. Commit/push successivi autorizzati ma non ancora eseguiti al momento del consolidamento.