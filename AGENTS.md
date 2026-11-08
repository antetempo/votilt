# VOTILT

- Italiano. App Android nativa Expo/React Native, mai sostituirla con un sito.
- Leggere memory-bank/activeContext.md, docs/PROGRESS.md e docs/votilt-creator-catalog-plan.md prima di lavorare; docs/votilt-plan.md conserva il piano iniziale.
- Specifica originale: docs/SPECIFICA_ORIGINALE.md. Le decisioni successive dell'utente prevalgono.
- **Docker vietato dall'utente.** Usare PostgreSQL 18 nativo già installato e backend locale Node. Nessun cloud obbligatorio.
- Nessuna modifica a database/credenziali di altri progetti. Risorse VOTILT dedicate in .local/.
- Nessun commit, push, deploy o cancellazione senza autorizzazione esplicita per l'azione.
- Il server è autorevole per campioni, TILT, Elo, autorizzazioni e privacy. Mai risultati finti.
- Un creator preferito per utente/categoria esatta. Ogni immagine ha una sola categoria, selezionabile anche se ramo o radice; nessuna propagazione di voti/badge agli antenati. Altre foto dello stesso creator non duplicano preferenze. Mutazioni transazionali, idempotenti e testate in concorrenza.
- Categoria/percorso visibili; selezione testuale con nomi, sinonimi e suggerimenti da descrizione/tag liberi. Nessuna riclassificazione automatica dei pubblicati o categorie create dai tag. Follow persona/categoria separati dal voto.
- Proposte nuove categorie in rollout successivo: coda separata, analisi interna e approvazione umana editoriale; AI mai autoapprovazione. Immagini prima, video successivi. Illustrazione decorativa generata esclusa dall’app per decisione utente.
- Conservare schema.sql, migrazioni idempotenti e checklist memory bank insieme.
- Ogni step: implementazione, test backend/frontend, prova Android pertinente, aggiornamento evidenze.
- Stati: NOT_RUN, IN_PROGRESS, PASS, FAIL, BLOCKED, PARTIAL. PASS richiede prova realmente eseguita.
- Stato prodotto distinto: pianificata, in corso, pronta da verificare, approvata. Soltanto l’utente approva definitivamente; non attribuire approvazione automatica ai PASS tecnici.
- Log privi di segreti. Mai password/token nel memory bank o nel bundle mobile.
- Asset originali con manifesto; illustrazioni e AI dichiarate. Quiz REAL senza provenienza: disabilitato.
- Non più di due milestone aperte senza gate. Riprendere dal ledger senza rifare il lavoro concluso.
