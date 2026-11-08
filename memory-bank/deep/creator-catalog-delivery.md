---
title: Consegna creator e catalogo, prove attuali e backlog
type: deep
status: active
date: 2026-11-08
author: Fabrizio
tags: [handoff, creator, catalogo, testing, debt, release]
related_sessions: [04-creator-catalogo-android]
---

Aggiorna [[stato-consegna-e-debito]] per la revisione creator/catalogo. [Piano](../../docs/votilt-creator-catalog-plan.md), [test](../../docs/TEST_REPORT.md) e [ledger](../../docs/VOTILT_APPROVAL_LEDGER.md) sono autorevoli. Prodotto pronto da verificare, approvazione finale non registrata.

120 unit/componenti in 21 suite, 46+9 integrazioni, typecheck/lint/format e 11 percorsi Android PASS sull’APK 69c1827ec1b1be1138e3c558731e96d2ed4c846680458ebef1b107dd0f85f45e. Migrazione demo e bootstrap fresco/rerun PASS, password invariate; [[creator-catalog-migration]] contiene ordine/checklist. Quattro screenshot correnti e legenda badge dichiarata esemplificativa nel README, manifesto con hash. Illustrazione decorativa scartata non usata. Prove precedenti restano storiche, senza sommarle alle 11 attuali.

Preferenza autore/categoria esatta, origine immagine e rappresentante eleggibile separati. Una categoria attiva per immagine anche intermedia/radice; nessun rollup. Stesso autore non duplica voto o TILT; autori diversi usano confronto transazionale. Follow persona e categoria esatta distinti dalla preferenza, feed deduplicato. Profili con dettagli espandibili/filtrabili; badge posizione corrente solo se supporto positivo, almeno due creator sostenuti e rango 1–100; soglia minima di presentazione, non validazione statistica. Ricerca/tag locali deterministici, nessuna API AI esterna.

Runtime locale API4317/PG55432/AVD emulator-5554 con adb reverse, APK autonomo. Verificare processi prima di riavviare. Dati di QA aggiuntivi preservati; non azzerare demo. Credenziali e backup soltanto .local/. Repository pubblico per scelta esplicita; commit/push in [[repository-github-public]] e [ricevuta](../../docs/evidence/github-publication.json). Nessun deploy.

Backlog/trigger: su nuova richiesta prodotto → video, territori con dati volontari e specifica, coda proposte editoriali asincrona con approvazione umana; fonti REAL verificate → abilitazione quiz. Prima della distribuzione esterna → HTTPS, firma release, backup/restore, moderazione/privacy, advisory dipendenze, telefono reale/TalkBack e misure FPS/memoria/throughput. Non dichiarare queste prove eseguite.

Debito lock globale: un solo limite della demo replicato in schema/snapshot. Raffinare soltanto dopo misura che dimostri collo di contesa; nessuna soglia inventata. Il rilevatore può segnare no-trigger per il commento francese, ma il trigger è qui esplicito. Nessuna automazione snapshot installata: Trend richiede dati creator reali di periodo sufficiente.

Diario: tre disposizioni pregresse ancora pendenti, owner Fabrizio e trigger prossimo riscontro. Non chiudere automaticamente sulla base dei test/commit.
