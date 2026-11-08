---
title: Commit iniziale GitHub e README visuale completo
type: session
status: consolidated
date: 2026-11-08
session: 2
author: Fabrizio
tags: [github, repository, readme, documentation, testing, handoff]
touched_files: [README.md, .gitignore, docs/media/, scripts/android/HierarchyDump.java, docs/evidence/readme-results.json, docs/PROGRESS.md, docs/RELEASE_READINESS.md, docs/TEST_REPORT.md, memory-bank/]
related_commits: [a0d85bf7240beb73f18406b99ed494a167984816]
linked_patterns: ["[[voto-server-autorevole]]", "[[collaudo-android-animazioni]]"]
---

<!-- Appunti della sessione corrente; consolidamento storico solo su richiesta esplicita. -->

# Commit iniziale, push e revisione README

Fabrizio ha richiesto il caricamento dell'intero progetto sul repository privato https://github.com/antetempo/votilt.git, indicando l'utenza antetempo@gmail.com. Commit iniziale autorizzato separatamente; nessun deploy applicativo richiesto. Al termine ha richiesto un README molto più curato con immagini, grafica, scopo e guida completa, seguito dal consolidamento del memory bank.

## GitHub completato · 8 novembre 2026

- Identità verificata tramite API GitHub: login antetempo, repository privato e inizialmente vuoto, permessi di push. Il connettore Codex disponeva di altri account; usato Git locale con Git Credential Manager senza esporre token.
- Impostati origin https://github.com/antetempo/votilt.git e autore Git locale antetempo <antetempo@gmail.com>; nessuna modifica globale.
- Preflight: 477 file, 316699984 byte, nessun file oltre 50 MB, nessun finding nella scansione dei pattern o nel confronto con otto valori segreti locali. Esclusi credenziali, .local, dipendenze, directory native, chiavi e APK.
- Regressione prima del commit: npm run verify:all PASS (typecheck/lint/format, 96 unit/componenti in 11 suite, 46 integrazioni HTTP/PostgreSQL). Audit 123 asset PASS. Report host aggiornati all'8 novembre.
- Commit iniziale a0d85bf7240beb73f18406b99ed494a167984816, messaggio Initial import VOTILT, 477 file. Push su main completato; upstream origin/main. HEAD locale uguale a refs/heads/main remoto, working tree pulita al termine. Nessun force push, reset credenziali o deploy.

## README e perimetro Git

README riprogettato con copertina SVG originale Dark Neon, cinque screenshot reali e video TILT del collaudo del 6 novembre, manifesto con origine e hash e copie senza trasformazioni. Sezioni: scopo e funzionamento del campione/TILT, funzioni social e privacy, brand, prerequisiti Windows, clone/setup PG/seed, API, build APK e installazione ADB, account demo per riferimento al file privato, sviluppo Metro, architettura Mermaid, mappa repository, test, manutenzione, troubleshooting, provenienza e limiti.

Corretto il presupposto che l'APK arrivi dal clone: output APK ignorato, build richiesta e build-info storico distinto. Chiariti URL emulator dev/standalone e inoltro porte via ADB, nessun cloud obbligatorio e Internet necessario solo al setup/build.

Root cause delle immagini assenti su GitHub: android/ in .gitignore ignorava ogni directory con quel nome, compresi docs/evidence/android e scripts/android/HierarchyDump.java. La regola ora è /android/ (e /ios/); le acquisizioni grezze sono escluse esplicitamente, la selezione è in docs/media. Il sorgente del lettore Java, già esistente, è ora includibile; compilazione verificata senza cambiarne il comportamento.

Verifiche eseguite: renderer Markdown GitHub HTTP 200 con tutte e sei le immagini, tabelle e details; 36 riferimenti locali e sei ancore; 13 script npm; cinque screenshot 1080x2400 e sette media con SHA coerenti; esclusioni Git; sintassi degli otto blocchi PowerShell senza eseguirli; javac con JDK 21 e classpath Android 36; git diff --check PASS. Evidenza: docs/evidence/readme-results.json. Copertina e screenshot ispezionati visivamente.

Nessun dispositivo ADB collegato: Android UI NOT_RUN nella revisione documentale. I 31 controlli UI conservati restano del 6 novembre. Non ricompilato l'APK; nessun codice runtime o SQL modificato.

## Consolidamento e ripresa

Aggiornati README, media/manifesto, .gitignore, documenti di avanzamento/readiness/test e core memory bank. Creato [[repository-github]] per lo stato di repository, esclusioni, autenticazione per riferimento e revisione documentale. Sessione precedente mantenuta immutata; nessuna nuova decisione architetturale o regola trasversale da promuovere in AGENTS.md.

Gli aggiornamenti README e memory bank sono locali e successivi al push a0d85bf. Nessun secondo commit/push: serve il nuovo ok dedicato. Alla ripresa mostrare il diff e chiedere autorizzazione per questi file se va pubblicata la revisione. Restano feedback sul prodotto, dataset REAL solo se richiesto, hardening prima della distribuzione e debito del lock globale con trigger di misurazione della contesa. Non resettare dati o credenziali della demo.

Riferimenti: [[01-votilt-android-brand-tilt]], [[repository-github]], [[stato-consegna-e-debito]], [[deploy-checklist]].
