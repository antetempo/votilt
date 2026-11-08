# Decisioni VOTILT

- **ADR-008 — Metadato fondamentale obbligatorio per categoria.** Richiesta esplicita: categoria e nome per ogni immagine; nome della persona per categorie come attrici, nome/link per siti web e strumenti. Modulo dinamico semplice, validazione server, persistenza per associazione e visualizzazione/ricerca del riferimento. Dettagli in CONTENT_METADATA.md.

2026-11-06 — Richiesta utente: Android, asset e brand originali prodotti dall'agente, login senza Google, test effettuati dall'agente, memory bank completo, studio agentico e sviluppo per step.

- **ADR-001 — Niente Docker.** Vincolo esplicito successivo alla specifica: “non voglio che usi docker”, “c'è tutto nel PC”. PostgreSQL 18 nativo è presente e il suo servizio esistente è running. Usare binari installati per risorse VOTILT isolate. Non toccare dati/credenziali del servizio esistente. Supabase locale con container viene sostituito da API Node/auth/storage locale mantenendo semantica e sicurezza richieste.
- **ADR-002 — Orchestrazione.** Leaven-chain non disponibile per assenza dei suoi strumenti di sessione. Piano persistente e implementazione nella chat madre, come fallback richiesto. Subagenti soltanto revisori dello studio agentico, mai sostituti delle sotto-sessioni chain.
- **ADR-003 — Catalogo.** Mantenere tutte le 41 foglie proposte; target minimo 123 approvati distinti più casi di moderazione. Separare tipo/provenienza e approvazione di ciascuna membership.
- **ADR-004 — Quiz.** Generare asset AI non produce fotografie REAL verificate. Dataset quiz pubblico non attivato in assenza di provenienza dimostrabile; motore testato con fixture isolate.
- **ADR-005 — Sicurezza TILT.** Fingerprint input per receipt, lock condivisi tra mutazioni, blocco invalida campioni incompatibili, cooldown Elo canonico; classifiche solo da DB.
- **ADR-006 — Ranking e social.** Popolari adesso, Elo cumulativo, trend storico reale; campioni privati di default e consenso scambio distinto da amicizia.
- **ADR-007 — Ambito locale.** Nessun commit/push/deploy autorizzato. Nessuna API cloud a pagamento richiesta a runtime. Il generatore immagini disponibile in chat è strumento di authoring, non dipendenza dell'app.
