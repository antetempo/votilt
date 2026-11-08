---
title: Migrazione creator e categoria unica, catalogo editoriale
type: deep
status: active
date: 2026-11-08
author: Fabrizio
tags: [database, migration, creator, catalogo, checklist]
related_sessions: [03-creator-catalogo]
---

Piano [creator/catalogo](../../docs/votilt-creator-catalog-plan.md); decisione [[categoria-unica-selezionabile]]. Questa checklist aggiorna [[deploy-checklist]] per il nuovo modello. Nessun deploy remoto autorizzato.

## Ordine operativo

1. Target esclusivamente cluster VOTILT loopback 55432. File privati in `.local/`; nessuna modifica al servizio 5432 o ad altre applicazioni. Backup VOTILT prima dell’applicazione alla demo; non includerlo in Git o nel vault.
2. Registro UUID persistenti `data/editorial-catalog.json`: 1427 nodi (36 radici, 1216 foglie); ogni nodo è selezionabile. `node scripts/editorial-catalog.mjs` valida ID, percorsi e gerarchia e rigenera `migrations/migrate_categories_editorial_catalog.sql`. Nessun voto o contenuto viene inventato nel catalogo nuovo.
3. `npm run db:migrate`: sorgenti `server/schema-core.sql`, `server/api.sql`, `server/creator-api.sql` e seed editoriale generano insieme `schema.sql` e gli snapshot completi, compreso **`migrate_creators_single_category.sql`**. Non eseguire soltanto frammenti SQL fuori ordine.
4. Migrazione idempotente `creator-single-category-v1`: conserva Elo/storico immagini; namespace ricevute nuovo `:creator-v1`; vecchi TILT pendenti marcati stale. Slot e versione preservati, origine tracciata. Nuovi Elo/eventi/snapshot per autore separati.
5. Se un vecchio contenuto ha più associazioni attive, conserva l’approvata con più slot (spareggio UUID), archivia una copia delle altre in `private.legacy_membership_archive`, marca le associazioni secondarie rejected e invalida i soli slot incompatibili con evento. Nessuna cancellazione fisica dello storico. Indice univoco parziale garantisce una sola associazione approved/pending per contenuto. Misurare prima eventuali conflitti nella demo e riportarne il numero effettivo.
6. Nuovi upload: una categoria esatta anche intermedia/radice, descrizione 400 caratteri e 20 tag di 40 caratteri. Validazione Unicode nel server e in PostgreSQL 18 (`COLLATE "unicode"`); nessun servizio AI esterno. Nessuna riclassificazione automatica dei contenuti pubblicati.
7. Preferenza valida solo con autore/votante attivi, associazione e contenuto approvati, metadati/tipo compatibili, accessibilità e assenza di blocchi. Helper condiviso `api.preference_active`. Ritiro di una foto può mantenere lo stesso autore tramite un’altra sua foto eleggibile nella stessa categoria; nessun autore sostituito automaticamente.
8. Follow categoria esatto, senza discendenti impliciti, separato da follow persona e preferenza. Feed Seguiti invalidato al cambio follow, deduplicato per contenuto. Privacy dei campioni invariata. Proposte categorie: rollout successivo con coda separata e approvazione umana; endpoint di pubblicazione attualmente disattivato.
9. Eseguire `npm run verify:all`, bootstrap fresco/rerun dedicato e test Android. Installare APK soltanto dopo build realmente riuscita. Registrare hash APK ed evidenze, non confondere build e installazione.

## Database di verifica

Consentiti dal runner: `votilt`, `votilt_test`, `votilt_bootstrap_test`, `votilt_creator_bootstrap_test`, tutti nello stesso cluster dedicato. L’ultimo è destinato alla nuova prova fresh-install senza azzerare i database precedenti. Credenziali esistenti mai cambiate; account nuovi soltanto nei test/bootstrap dedicati.

`scripts/snapshot.mjs` ora registra supporti aggregati per creator/categoria nella tabella distinta `creator_ranking_snapshots`; lo storico immagini resta leggibile per audit. Trend creator senza dati di sette giorni mostra dati in accumulo, senza tradurre artificialmente lo storico immagini. Nessuna automazione installata.

Rollback: prima di nuovi dati creator ripristinare il backup dedicato e il precedente codice insieme. Dopo nuove scritture, conservare i nuovi dati e preparare una migrazione inversa verificata; non ripristinare automaticamente un vecchio dump perdendo le nuove preferenze. Nessun rollback distruttivo autorizzato.
