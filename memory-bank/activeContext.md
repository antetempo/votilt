# Active Context

## Current Focus

Giornata chiusa e consolidata da Fabrizio il 2026-11-06. VOTILT Android pronto per la prossima prova locale, senza Docker. Ultima sessione: [[01-votilt-android-brand-tilt]]. Prossimo lavoro: feedback sul prodotto e sul TILT dinamico; nessuna implementazione core rimasta aperta.

## Next Steps

1. Alla ripresa verificare runtime/APK e seguire [README](../README.md); provare il prodotto e raccogliere il feedback di Fabrizio.
2. Se richiesto, curare fotografie REAL con provenienza verificata per il quiz; nessuna AI deve essere etichettata REAL.
3. Prima di distribuzione esterna, affrontare [readiness](../docs/RELEASE_READINESS.md) e [[stato-consegna-e-debito]]: HTTPS/firma, segreti/backup, moderazione, dipendenze, telefono/TalkBack, misure prestazioni e contesa del lock globale.

## Stato verificato

96 unit/componenti (11 suite), 46 integrazioni HTTP/PG e 31 controlli Android registrati PASS (18 iniziali + 6 revisione + 7 TILT). Ultimi sette percorsi TILT ripetuti sull'APK finale, inclusi movimento ridotto e formato piccolo/font 130%. Fonte: [TEST_REPORT](../docs/TEST_REPORT.md). FPS/memoria/throughput non misurati.

Brandbook MD/HTML/PDF, 23 icone originali e palette/contrasto approvati conservati. Feed con like compatto, categoria e sola descrizione autore espandibile. Centro solo simbolo pubblicazione; classifiche per categorie più votate con ricerca interna. Controlli testo/duplicati con revisione umana. TILT con sola scritta, due carte 3D animate e X. Metadati obbligatori per categoria preservati: [[prodotto-brand-e-tilt]], [[metadati-contenuti]].

Piani PASS: [iniziale](../docs/votilt-plan.md), [revisione](../docs/votilt-refinement-plan.md), [TILT](../docs/votilt-tilt-plan.md). Catalogo base: 41 foglie, 123 immagini distinte (111 AI dichiarate + 12 tool card); bootstrap/rerun preservano credenziali e dati.

## Runtime e repository

Checkout C:/APP/AI/VOTILT, main senza commit, file untracked. Nessun commit/push/deploy autorizzato o eseguito. APK output/VOTILT-local-demo.apk autonomo con firma debug, arm64-v8a/x86_64. API loopback 4317; PostgreSQL VOTILT dedicato 55432, servizio esistente 5432 intatto. APK localhost via adb reverse; Metro non serve. Credenziali solo nel file privato .local/demo-credentials.json, mai nel vault. Alla chiusura operativa emulatore visibile con TILT aperto; non assumere runtime attivo al prossimo avvio.

## Blockers

Nessuno per demo locale. Quiz pubblico intenzionalmente disabilitato senza dataset REAL documentato. Leaven-chain non eseguibile: fallback sequenziale richiesto, revisori solo per studio/audit. Debito di capacità e limiti di rilascio registrati nei Next Steps, senza bloccare la prova locale.

## Recent Deploys

Nessuno. Solo build, installazione e test locali; nessuna pubblicazione remota/store.

> 🧑‍💻 Ultimo aggiornamento memory bank: **Fabrizio** · 2026-11-06
