---
title: Voto VOTILT autorevole con retry e lock condiviso
type: pattern
status: active
date: 2026-11-06
author: Fabrizio
tags: [voting, concurrency, receipts, postgres, security]
related_sessions: [1]
related_commits: []
---

# Procedura e invarianti VOTILT

Il client invia vote_intent, resolve_tilt o cancel_tilt; PostgreSQL decide l'esito. Uno slot per utente/foglia, versione monotona, un confronto pending valido, Elo per foglia distinto dal supporto attivo. Risoluzioni concorrenti e retry non devono produrre doppi trasferimenti o aggiornamenti Elo.

Ricevuta con fingerprint e operation ID persistito in SecureStore prima dell'invio. Una risposta incerta conserva l'ID; payload diverso con lo stesso ID viene respinto. Ricontrollare la sessione e l'utente dopo il lock condiviso anche per sospensione, moderazione, upload e modifiche concorrenti.

Moderazione/blocco/delete invalidano slot e confronti incompatibili nella stessa transazione. Nel cleanup upload, non eliminare media potenzialmente referenziati da un commit riuscito ma non confermato: il controllo indipendente acquisisce il lock, aspetta il commit e verifica il riferimento. Se il controllo fallisce, conservare il file.

Ruolo API non owner senza bypass RLS, funzioni/grant espliciti, nessuna lettura delle credenziali. Logout mediante funzione di revoca autorizzata. Il server verifica categoria, kind e metadati; non fidarsi della UI.

Successo grafico soltanto dopo ricevuta. Se la risposta arriva dopo lo smontaggio, invalidare i dati senza navigare sul vecchio schermo. Controllare doppio tocco, replay, risposta persa, race con hide/sospensione e invalidazione cache usando sessioni reali e barriere DB.

Implementazione: server/schema-core.sql, server/api.sql, server/db.ts, src/features/voting.ts. Prove: tests/integration/api.test.ts, tests/unit/voting.test.ts, tests/components/voting-navigation.test.tsx. Riferimenti: [[runtime-locale-senza-docker]], [[stato-consegna-e-debito]], [rapporto](../../docs/TEST_REPORT.md).
