# VOTILT · revisione prodotto e brand

Richieste chat del 2026-11-06, successive alla prima demo. Prevalgono sulla specifica originale.

1. Brandbook visuale e set completo di icone originali, palette e contrasto conservati. Nessun simbolo stock nel prodotto. Testi più piccoli, immagine protagonista.
2. Feed: niente wordmark; Per te/Seguiti/Scopri in alto; like compatto e categoria sotto; niente descrizioni riempitive, solo didascalia autore in una riga espandibile.
3. Classifiche: categorie più votate e ricerca; dentro ogni categoria immagini/classifica con ricerca locale alla categoria.
4. Centro navigazione: solo simbolo originale di pubblicazione, nessuna scritta. Rimosso il vecchio hub TILT. Il confronto resta parte del voto nella categoria, con testo ridotto.
5. Upload: selezione categoria o proposta se mancante; nome e metadati fondamentali restano obbligatori. Proposte moderate, controllo esteso delle parole, normalizzazione Unicode/offuscamenti, ricerca duplicati e suggerimenti. Verifica server sotto lock contro creazioni concorrenti.
6. Test unit/policy, regressione API, collaudo Android dei nuovi percorsi, nuova build e app riaperta nell'emulatore visibile. Nessun Docker/commit/deploy.

Stato: PASS. Audit r1/r2 sul flusso completo e controllo cross-fase conclusi: 91 test unit/componenti, 46 integrazioni, 6 percorsi Android della revisione e 4 controlli APK/formati/rete PASS. Prove in TEST_REPORT.md e evidence/android-refinement-results.json. APK aggiornato installato nell'emulatore visibile.

Brandbook: BRANDBOOK.md, brandbook.html e VOTILT-Brandbook.pdf; 23 icone originali condividono geometria e palette. La descrizione autore è facoltativa, una riga espandibile, senza testo riempitivo.

Controllo visivo dopo reinstallazione: corretta la cache delle icone Android. Gli ID delle risorse possono cambiare tra APK; le piccole icone statiche usano `cachePolicy="none"`, evitando associazioni grafiche della build precedente. Ricompilazione e verifica su emulatore eseguite.

Nessuna promessa di filtro semantico infallibile: controlli automatici locali più revisione umana delle proposte. Casi coperti e limiti in CATEGORY_MODERATION.md.
