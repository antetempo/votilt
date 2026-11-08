# Prontezza al rilascio

Destinazione consentita: **demo locale Android sul PC**, senza Docker e senza pubblicazione. Verifiche e artefatti in TEST_REPORT.md e ACCEPTANCE_MATRIX.md. APK firmato debug, backend autorevole locale, nessun generatore AI a runtime.

Funzioni consegnate: auth email/password; interessi e feed verticale; catalogo e ricerca; campione per foglia, TILT, Elo e classifiche; profili/privacy/follow/amicizie; confronto consensuale; caricamento con metadati obbligatori; moderazione/restore/sospensione/segnalazioni/audit; notifiche in-app; proposte categorie; ritiro contenuti e cancellazione account. AI Art/Tools, Daily UTC e trend con storico reale. Quiz pubblico intenzionalmente disabilitato in assenza di fonti REAL.

Prima dello store: scegliere infrastruttura e autorizzare il deploy separatamente; HTTPS, segreti e rotazione controllata, firma release, backup/restore, telemetria e monitoraggio, test su telefoni reali, prestazioni misurate, accessibilità con lettore schermo, politiche privacy/retention e processo di moderazione continuativo. Rivalutare advisory delle dipendenze. Nessuna di queste attività è implicitamente autorizzata dal lavoro locale.

Nessun commit/push/deploy effettuato. La checkout resta disponibile per revisione. Prossimi passi concreti: provare la demo con gli account fittizi; scegliere eventuali correzioni di prodotto; solo dopo pianificare distribuzione e dati REAL del quiz. Riferimenti: KNOWN_ISSUES.md e CONTENT_METADATA.md.
