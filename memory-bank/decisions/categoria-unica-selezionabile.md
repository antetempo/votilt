---
title: Una categoria per contenuto, anche intermedia, senza propagazione dei voti
type: decision
status: active
date: 2026-11-08
author: Fabrizio
tags: [categorie, creator, upload, ranking, no-rollup]
related_sessions: [03-creator-catalogo]
---

Ultimo chiarimento esplicito di Fabrizio: ogni immagine, poi video, si pubblica in UNA categoria scelta, che può essere foglia, ramo intermedio o radice. Categoria unica per contenuto; breadcrumb e antenati non sono assegnazioni aggiuntive. Il voto riconosce il creator nella categoria esatta e non si propaga alle madri. Preferenza unica per utente/categoria, non per intero ramo. Follow e classifiche dirette disponibili anche sui rami; eventuale scoperta dei discendenti distinta dai voti diretti.

Questa decisione sostituisce soltanto il vincolo foglia e la cardinalità fino a tre categorie della progettazione precedente. Mantiene il modello creator di [[creator-per-foglia]], la provenienza dell’immagine e i requisiti transazionali di [[voto-server-autorevole]].

Piano aggiornato: [creator e catalogo](../../docs/votilt-creator-catalog-plan.md). Classificazione visibile in tutte le superfici pertinenti; nessun doppio conteggio di immagini, preferenze o badge per antenato. Test obbligatori su ramo/madre, assenza di propagazione, upload multiplo respinto e migrazione delle vecchie associazioni senza cancellazione fisica dello storico.
