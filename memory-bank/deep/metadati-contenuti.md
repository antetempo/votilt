---
title: Metadato fondamentale del contenuto
type: deep
status: active
date: 2026-11-06
author: Fabrizio
tags: [requirements, metadata, upload]
---

# Requisito aggiunto in chat

Ogni immagine votabile deve avere categoria e nome, con riferimento fondamentale imposto dalla categoria. Persona/attrice: nome della persona. Sito web: nome del sito e URL. Tool: nome e link ufficiale. Il modulo mostra i soli campi necessari e normalizza gli URL; la didascalia resta facoltativa. Nessuna inferenza dell'identità dall'immagine.

Implementazione: reference_kind/reference_label/requires_url e allowed_kinds sulle foglie; content_metadata per coppia contenuto/foglia; massimo tre associazioni. Server verifica upload, approvazione e voto. Ricerca e visualizzazione usano il riferimento. Membership pending e relativi metadati restano privati ad autore/moderatore.

Prove: docs/CONTENT_METADATA.md, tests/integration/api.test.ts, docs/evidence/android-creator-results.json. Gli account e le immagini del seed sono fittizi/dichiarati, i nomi persona sono di fantasia; tool reali con URL verificati. Mai trasformare il riferimento obbligatorio in un semplice titolo facoltativo.
