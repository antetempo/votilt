# VOTILT

- Italiano. App Android nativa Expo/React Native, mai sostituirla con un sito.
- Leggere memory-bank/activeContext.md, docs/PROGRESS.md e docs/votilt-plan.md prima di lavorare.
- Specifica originale: docs/SPECIFICA_ORIGINALE.md. Le decisioni successive dell'utente prevalgono.
- **Docker vietato dall'utente.** Usare PostgreSQL 18 nativo già installato e backend locale Node. Nessun cloud obbligatorio.
- Nessuna modifica a database/credenziali di altri progetti. Risorse VOTILT dedicate in .local/.
- Nessun commit, push, deploy o cancellazione senza autorizzazione esplicita per l'azione.
- Il server è autorevole per campioni, TILT, Elo, autorizzazioni e privacy. Mai risultati finti.
- Un campione per utente/foglia; mutazioni transazionali, idempotenti e testate anche in concorrenza.
- Conservare schema.sql, migrazioni idempotenti e checklist memory bank insieme.
- Ogni step: implementazione, test backend/frontend, prova Android pertinente, aggiornamento evidenze.
- Stati: NOT_RUN, IN_PROGRESS, PASS, FAIL, BLOCKED, PARTIAL. PASS richiede prova realmente eseguita.
- Log privi di segreti. Mai password/token nel memory bank o nel bundle mobile.
- Asset originali con manifesto; illustrazioni e AI dichiarate. Quiz REAL senza provenienza: disabilitato.
- Non più di due milestone aperte senza gate. Riprendere dal ledger senza rifare il lavoro concluso.
