# Active Context

## Current Focus

Fabrizio · 8 novembre 2026: **revisione creator/catalogo pronta da verificare**. Implementazione, prove reali, build e installazione Android completate. Approvazione finale di Fabrizio non registrata. Piano autorevole [creator/catalogo](../docs/votilt-creator-catalog-plan.md), [ledger](../docs/VOTILT_APPROVAL_LEDGER.md). Sessione consolidata [[04-creator-catalogo-android]].

Regole correnti [[categoria-unica-selezionabile]] e [[tag-liberi-proposte-editoriali]]: una categoria per immagine, anche ramo/radice; preferenza al creator nella categoria esatta, nessun rollup. Stessa persona senza voto/TILT aggiuntivo, origine tracciata; follow persona/categoria distinti. Tag/descrizione liberi, suggerimenti lessicali, autore sceglie; nessuna riclassificazione automatica. Proposte editoriali con revisione umana, video e territori sono rollout successivi. Illustrazione decorativa scartata esclusa.

Gerarchia [completa](../docs/research/catalogo-editoriale/GERARCHIA_COMPLETA.md): **36 radici, 211 rami, 1216 foglie, 1427 nodi**, profondità 5, 270 foglie news. Applicata al DB, tutti i nodi selezionabili. Catalogo precedente conservato. Fonti/tag social con limiti dichiarati. Copia utente in Documents/Codex/2026-11-08/realtime-voice-chat/outputs/.

## Next Steps

1. Fabrizio: provare la build installata e dare il riscontro di prodotto; trigger prossimo uso dell’app. Prove tecniche PASS non equivalgono ad approvazione umana.
2. Fabrizio: dare disposizione sui tre punti del diario precedentemente segnalati, ancora pendenti; trigger prossimo riscontro. Nessuna chiusura dedotta automaticamente.
3. Su richiesta di estendere il prodotto: pianificare separatamente proposte editoriali, video e territori con dati volontari; quiz solo dopo dataset REAL con provenienza verificata.
4. Prima di distribuzione esterna: affrontare [readiness](../docs/RELEASE_READINESS.md), [[creator-catalog-delivery]] e debito lock globale; misure di contesa/performance, telefono/TalkBack, HTTPS/firma, backup/moderazione e dipendenze.

## Stato verificato

120 unit/componenti in 21 suite, 46 integrazioni generali + 9 creator, typecheck/lint/format PASS. Migrazione demo con backup/rerun e bootstrap fresco/rerun PASS, credenziali esistenti invariate. **11 percorsi Android PASS sulla build corrente**; installata, aperta su Classifiche, dimensioni/font ripristinati. APK SHA-256 69c1827ec1b1be1138e3c558731e96d2ed4c846680458ebef1b107dd0f85f45e. Otto segreti locali assenti dal bundle. [TEST_REPORT](../docs/TEST_REPORT.md), [[creator-catalog-migration]]. Prove precedenti 31+5+8 restano storiche su altre build.

## Runtime e repository

Checkout C:/APP/AI/VOTILT, unico worktree, main/upstream origin/main. Repository **pubblico** https://github.com/antetempo/votilt.git per scelta esplicita, autore antetempo <antetempo@gmail.com>. Iniziale a0d85bf, successivo e9d78ab e consegna creator 9ef7508b95b0c8ea57ab80de3cedb8b63288f5ee **pushati/verificati**, hash remoto identico. Ricevuta nel repository; dettagli [[repository-github-public]]. API 4317, PostgreSQL dedicato 55432, AVD Medium_Phone_API_36.1/emulator-5554, adb reverse; verificare processi alla ripresa. APK autonomo senza Metro. Credenziali soltanto .local/. Docker vietato, servizio 5432 e altri progetti intatti.

## Blockers

Nessuno per la demo locale. Quiz senza dataset REAL disabilitato. Nessun campionato geografico simulato; hardening e misure prima di distribuzione esterna, non dichiarati eseguiti.

## Recent Deploys

Nessun deploy applicativo/store. Consegna creator 9ef7508 pubblicata su main; account antetempo, autore antetempo@gmail.com, repository pubblico. Hash remoto verificato nella ricevuta.

> 🧑‍💻 Ultimo aggiornamento memory bank: **Fabrizio** · 2026-11-08
