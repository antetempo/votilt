---
title: System Patterns
type: core
status: active
date: 2026-11-06
---

# Architettura e invarianti

Route Expo sottili; feature/service tipizzati; server Node autentica e valida; PostgreSQL decide esiti, autorizzazioni e ranking. Storage privato controllato a ogni download. Credenziali DB solo host in file ignorati.

PK slot (utente,categoria esatta), autore preferito tramite contenuto eleggibile e origine separata, versione monotona; operazioni idempotenti con fingerprint, un pending valido per slot, Elo creator/categoria con cooldown coppia autori, supporti conteggiati da slot. Una categoria attiva per immagine anche ramo/radice, nessun rollup. Vedere [[categoria-unica-selezionabile]]. Moderazione/blocco/delete invalidano atomicamente campioni e duelli incompatibili. Transazioni e lock stabili condivisi, non sequenze client.

Test prima del PASS: positivo, negativo, concorrenza, autenticazione reale, verifica Android del percorso. Query cache invalidata al mutare del server e svuotata al cambio account. Ogni azione non banale lascia un check eseguibile.

<!-- memorybank:index:patterns -->
| Pattern | Tags | File |
|---|---|---|
| Collaudo Android VOTILT con animazioni native attive | android, testing, animation, accessibility, windows | [[collaudo-android-animazioni]] |
| Voto VOTILT autorevole con retry e lock condiviso | voting, concurrency, receipts, postgres, security | [[voto-server-autorevole]] |
<!-- /memorybank:index -->

<!-- memorybank:index:decisions -->
| Decisione | Tags | File | Stato |
|---|---|---|---|
| Immagini protagoniste e brand VOTILT coerente | brand, ux, icons, feed, tilt | [[brand-immagini-protagoniste]] | active |
| Una categoria per contenuto, anche intermedia, senza propagazione dei voti | categorie, creator, upload, ranking, no-rollup | [[categoria-unica-selezionabile]] | active |
| Creator preferito per foglia e classificazione visibile | creator, catalogo, categorie, prodotto, follow | [[creator-per-foglia]] | active |
| Android e backend locali senza Docker | android, architecture, local-runtime, no-docker | [[runtime-locale-senza-docker]] | active |
| Tag liberi, suggerimenti testuali e proposte editoriali successive | tag, ricerca, catalogo, editorial, prodotto | [[tag-liberi-proposte-editoriali]] | active |
<!-- /memorybank:index -->
