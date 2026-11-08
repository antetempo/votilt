---
title: Requisiti finali di prodotto, brand e TILT
type: deep
status: active
date: 2026-11-06
author: Fabrizio
tags: [requirements, brand, feed, categories, tilt, moderation]
related_sessions: [1]
---

# Direzione approvata in chat

Le istruzioni dirette di Fabrizio prevalgono sulla specifica originale, conservata integra in [[requisiti-completi]]. Non ripristinare i vecchi comandi o la vecchia navigazione prendendoli dal documento iniziale.

- Palette e contrasto approvati: fondo #090711, superfici #171326/#211A35, testo #F8F6FF, secondario #A9A3BE, viola #A855F7, ciano #22D3EE, rosa #FF4DA6. Space Grotesk + Inter inclusi.
- Tutte le icone del prodotto originali: 23 master src/brand/icons.ts, SVG/PNG in assets/icons/ui, componente Icon condiviso. I controlli del sistema operativo restano nativi.
- Feed verticale immersivo: Per te/Seguiti/Scopri più in alto, niente wordmark VOTILT, CTA grande o testo riempitivo. Like compatto, nome/riferimento, autore/provenienza, categoria. Descrizione dell'autore facoltativa: una riga, Altro/Meno per espandere/richiudere.
- Cinque posizioni: Feed, Esplora, simbolo Pubblica senza etichetta visiva, Classifiche, Profilo. Il vecchio hub TILT è archiviato in docs/archive/tilt-hub.tsx.txt.
- Pubblicazione: immagine, categoria esistente oppure proposta se mancante; nome e metadato fondamentale obbligatori per ciascuna associazione, massimo tre foglie. Persona → nome; sito/tool → nome e link. Dettagli in [[metadati-contenuti]].
- Classifiche: prima categorie più votate su supporti reali, ricerca categoria; dentro la categoria ricerca immagini/classifica. Il filtro conserva la posizione globale. Like, Duelli ed eventuale Trend derivano da metriche distinte, senza storico inventato.
- TILT dopo like diverso nella stessa categoria: unica scritta TILT, due carte toccabili con prospettiva 3D, ingresso elastico, fluttuazione, riflessi e orbita neon. Il tocco sceglie, X/indietro annullano. Conferma e avanzamento della scelta dopo risposta positiva del server; doppio tocco, errore/offline, smontaggio e movimento ridotto gestiti. Nessuna nuova dipendenza 3D: trasformazioni native Reanimated sulle immagini.

## Categorie semplici da creare, controllate dal server

Nome, descrizione 20–250 caratteri, esempi facoltativi, tipo di riferimento e parent coerente. Se già esiste, suggerire “Usa …” e tornare al caricamento conservando la bozza. Proposte soggette a revisione prima della pubblicazione.

Policy condivisa client/server: Unicode NFKC/NFKD, accenti/case, invisibili, alcuni omografi, leet, punteggiatura, lettere spaziate/ripetute; lessico italiano/inglese per insulti/volgarità, odio contestuale, minacce, sessualizzazione minori e spam/link/markup. Casi benigni/ambigui protetti. Duplicati con alias/plurali/ordine parole/fuzzy match e soglie documentate nel codice. Non esporre nomi/ID delle proposte private di altri utenti.

Controllo e creazione/approvazione sotto lo stesso lock: niente duplicati concorrenti. È un primo filtro deterministico, non una comprensione semantica infallibile; la revisione umana resta necessaria. Dettagli e limiti in docs/CATEGORY_MODERATION.md.

## Riferimenti operativi

[Brandbook](../../docs/BRANDBOOK.md), [PDF](../../docs/VOTILT-Brandbook.pdf), [versione visuale](../../docs/brandbook.html), [piano revisione](../../docs/votilt-refinement-plan.md), [piano TILT](../../docs/votilt-tilt-plan.md), [[brand-immagini-protagoniste]], [[collaudo-android-animazioni]].
