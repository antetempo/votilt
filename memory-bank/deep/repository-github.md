---
title: Repository GitHub, commit iniziale e documentazione visuale
type: deep
status: active
date: 2026-11-08
author: Fabrizio
tags: [github, repository, documentation, readme, handoff]
related_sessions: [2]
related_commits: [a0d85bf7240beb73f18406b99ed494a167984816]
---

# Repository VOTILT

Repository privato: https://github.com/antetempo/votilt.git. Remote locale `origin`, branch `main`, upstream `origin/main`. Checkout principale C:/APP/AI/VOTILT, unico worktree rilevato.

Commit iniziale `a0d85bf7240beb73f18406b99ed494a167984816`, messaggio `Initial import VOTILT`, creato l'8 novembre 2026. Autore Git `antetempo <antetempo@gmail.com>`, configurato solo nel repository. GitHub autentica come `antetempo`; repository verificato privato e inizialmente vuoto. Il connettore GitHub di Codex aveva altri account: utilizzato Git locale con Git Credential Manager, senza copiare token o segreti.

Fabrizio ha richiesto il push e autorizzato separatamente il commit iniziale. Caricati 477 file: sorgenti, schema/migrazioni, asset, documentazione e memory bank. `git ls-remote origin refs/heads/main` ha restituito lo stesso hash di HEAD; working tree pulita alla fine del push. Nessun deploy applicativo, store, force push o modifica a credenziali.

## Perimetro dei file

Esclusi `.local/`, credenziali, `.env`, node_modules, directory native generate, chiavi e APK. Preflight dei 477 file: 316699984 byte, nessun file oltre 50 MB; confronto con otto segreti locali e scansione di pattern senza finding. Evidenza privata in `.local/github-push-preflight.json`, priva dei valori segreti.

La successiva revisione README ha trovato che la regola generica `android/` escludeva anche screenshot e `scripts/android/HierarchyDump.java`. Correzione locale: `/android/` e `/ios/` limitate alla radice; `/docs/evidence/android/` esclude esplicitamente le acquisizioni grezze. Il sorgente Java diventa includibile. Solo cinque screenshot verificati e il video TILT, copiati senza trasformazioni, sono selezionati in `docs/media/`; manifesto con origine/hash. La copertina SVG è un'impaginazione editoriale originale del brand, distinta dalle schermate reali e dalle immagini AI del catalogo.

## Stato dopo la revisione README

README completo di scopo, funzionamento, immagini, video, brand, guida da clone a APK, accessi demo per riferimento al file privato, sviluppo, architettura, test, manutenzione, troubleshooting, provenienza e limiti. La guida chiarisce che l'APK non arriva dal clone, gli URL dev/standalone differiscono e i test Android richiedono la toolchain specifica.

Regressione host prima del commit iniziale: typecheck/lint/format, 96 unit/componenti e 46 integrazioni PASS l'8 novembre. Revisione README: rendering GitHub Markdown, link, ancore, script, hash/provenienza media, sintassi PowerShell e compilazione Java verificati. Evidenza [readme-results.json](../../docs/evidence/readme-results.json). Android UI non ripetuta: nessun dispositivo collegato; i 31 controlli documentati restano del 6 novembre.

Le modifiche README/media/ignore e il consolidamento memory bank sono **successivi al push iniziale e ancora locali**. Per un nuovo commit/push serve l'autorizzazione dedicata prevista dalle regole di progetto. Non estendere a questi file l'ok già consumato dal primo caricamento.

Ripresa: [README](../../README.md), [[02-github-readme]], [[stato-consegna-e-debito]], [[deploy-checklist]].
