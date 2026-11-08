---
title: Tag liberi, suggerimenti testuali e proposte editoriali successive
type: decision
status: active
date: 2026-11-08
author: Fabrizio
tags: [tag, ricerca, catalogo, editorial, prodotto]
related_sessions: [03-creator-catalogo]
---

Fabrizio richiede descrizione e tag liberi per i contenuti. Sono metadati, non categorie o nuovi slot. Il motore suggerisce categorie esistenti da nomi, sinonimi, parole chiave e vicinanza lessicale; l’autore sceglie una categoria a qualsiasi livello secondo [[categoria-unica-selezionabile]]. Nessuna riclassificazione automatica dei pubblicati. Nessun servizio esterno/embedding presentato come disponibile senza implementazione e autorizzazione pertinenti.

La prima implementazione usa soltanto logica locale deterministica e validazione ai confini, con percorso completo nei risultati. Le motivazioni social e gli hashtag sono segnali di linguaggio, non misure quantitative della domanda; fonti e limiti in [TAG_SOCIAL](../../docs/research/catalogo-editoriale/TAG_SOCIAL.md).

L’utente riapre le nuove proposte di categorie, superando il rifiuto iniziale, come rollout successivo: coda separata, analisi interna asincrona di duplicati/sinonimi/collocazione/appropriatezza, approvazione umana editoriale. AI eventualmente assistiva, mai autoapprovazione. Attualmente il catalogo esistente è selezionabile e il vecchio workflow di pubblicazione è disattivato.

L’illustrazione decorativa generata è esclusa da app, selettore e copertina catalogo, per richiesta esplicita; non cancellata. Selezione testuale, nomi naturali e breadcrumb; grafica originale per badge/icone funzionali. Video e territori privi di dati restano successivi, senza risultati finti.
