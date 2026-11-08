---
title: Checklist DB e avvio locale
type: deep
status: active
date: 2026-11-06
tags: [database, migrations, local-runtime]
---

# Risorse locali VOTILT

Nessun deploy remoto autorizzato. Docker vietato. Usare cluster dedicato su loopback con binari PostgreSQL 18 già installati, mai il servizio esistente su 5432. Migrazioni da eseguire solo sul database identificato VOTILT.

Per ogni modifica DDL/seed/backfill: aggiornare schema.sql, migrazione idempotente migrate_<tabella>_<cosa>.sql e questa checklist nella stessa tranche. Testare fresh install e rerun. Reset distruttivi richiedono autorizzazione esplicita; preferire test fixture isolate e transazioni.

Migrazioni locali: `migrate_votilt_initial.sql` e `migrate_content_metadata_required.sql`, snapshot completi idempotenti dello schema e API, generati da `server/schema-core.sql` + `server/api.sql` mediante `npm run db:migrate`. La stessa generazione aggiorna `schema.sql`. Eseguire solo sul cluster dedicato 55432; il runner limita i database a votilt, votilt_test e votilt_bootstrap_test. Nessun reset. Ruolo API senza bypass RLS, senza accesso credenziali e con sole funzioni pubbliche autorizzate.

`migrate_categories_seed_catalog.sql`: archivia le categorie spurie del primo seed senza cancellare dati; il seed corretto pubblica 41 foglie. `npm run seed` è ripetibile, conserva credenziali e preferenze esistenti, aggiorna gli asset di catalogo e i metadati obbligatori. Dopo ogni modifica SQL rigenerare gli snapshot, ripetere migrazione e integrazione.

Completato: metadati obbligatori per foglia, membership private, kind compatibili, ripristino/sospensione, helper auth per profili privati, media quiz neutri e receipt upload con hash immagine. Le funzioni sono incluse nei due snapshot completi. Rigenerazione/applicazione eseguite; 44 integrazioni PASS. `verify-bootstrap.mjs` ha costruito da zero `votilt_bootstrap_test` (terzo e ultimo target consentito) ed eseguito due volte migrazione + seed, senza cambiare credenziali. Prova in docs/evidence/bootstrap-results.json.

Seed finale: 41 foglie pubblicate, 123 asset distinti (111 AI dichiarati + 12 tool card), 6 utenti, 192 campioni al bootstrap, 12 pending / 3 rejected / 2 hidden e report fittizi. La demo di lavoro può avere contenuti/campioni aggiuntivi creati dai test Android. Non azzerarli. Snapshot UTC manuale: scripts/snapshot.mjs; nessuna automazione installata.

Revisione prodotto, Fabrizio · 2026-11-06: aggiunta `migrate_categories_rankings_and_policy.sql`, snapshot idempotente completo insieme a `schema.sql`. Introduce categorie più votate, ricerca limitata alla categoria e posizione globale della classifica prima del filtro; helper privilegiato `api.category_policy_context()` non esposto come azione HTTP, PUBLIC revocato e grant esplicito al ruolo API. Proposte: descrizione 20–250 caratteri, esempi facoltativi; controlli testo/duplicati e scrittura sotto lo stesso advisory lock. Approvazione ricontrollata. Seed rimuove soltanto la didascalia riempitiva nota dai 123 elementi base, preservando dati degli utenti. Migrazione applicata al DB demo; 46 integrazioni PASS. Il servizio PostgreSQL preesistente resta intatto.
