# Active Context

## Current Focus

Fabrizio · 8 novembre 2026: revisione creator/catalogo autorizzata in automatico fino a build e installazione Android. Il precedente gate preventivo sul piano è revocato. Piano autorevole [creator e catalogo](../docs/votilt-creator-catalog-plan.md); [ledger approvazioni](../docs/VOTILT_APPROVAL_LEDGER.md). Prove tecniche PASS rendono pronta da verificare una fase; approvazione finale solo dell’utente.

Gerarchia completa [Markdown](../docs/research/catalogo-editoriale/GERARCHIA_COMPLETA.md), JSON/CSV e conteggi: BOZZA, 36 aree, 1216 foglie, profondità 5; 270 foglie news. Copia utente sotto Documents/Codex/2026-11-08/realtime-voice-chat/outputs/. Ricerca hashtag documentata con limiti d’accesso e nessun volume inventato. Non ancora importata al checkpoint di consolidamento. Decisione [[creator-per-foglia]]: cuore elegge autore per foglia, origine immagine, follow persona/categoria distinti, classificazione chiaramente visibile. Catalogo editoriale senza proposte utenti. Nessuna nuova immagine generata per questo piano; fase grafica esplicita da eseguire.

## Next Steps

1. Eseguire commit e push già autorizzati di README, revisioni Android, piano e memory bank su antetempo/votilt; verificare hash remoto, nessun deploy.
2. Proseguire F1–F8 dal piano: catalogo profondo, grafica/immagini, motore creator, ricerca/upload, follow, profili e classifiche; test host e prova Android prima di dichiarare pronto.
3. Alla ripresa verificare runtime/APK e seguire [README](../README.md); provare il prodotto e raccogliere il feedback di Fabrizio.
4. Se richiesto, curare fotografie REAL con provenienza verificata per il quiz; nessuna AI deve essere etichettata REAL.
5. Prima di distribuzione esterna, affrontare [readiness](../docs/RELEASE_READINESS.md) e [[stato-consegna-e-debito]]: HTTPS/firma, segreti/backup, moderazione, dipendenze, telefono/TalkBack, misure prestazioni e contesa del lock globale.

Disposizioni diario chieste a Fabrizio, ancora pendenti; nessuna chiusura umana registrata.
## Stato verificato

Revisioni precedenti [Classifiche](../docs/votilt-rankings-plan.md) e [navigazione](../docs/votilt-navigation-plan.md): 106 unit/componenti, 46 integrazioni HTTP/PG, typecheck/lint/format PASS; 8 percorsi Android navigazione e 5 Classifiche su build rispettive. Il nuovo modello creator deve essere testato separatamente. Storiche 31 prove Android non rieseguite integralmente. Fonte [TEST_REPORT](../docs/TEST_REPORT.md).

Brandbook MD/HTML/PDF, 23 icone, palette conservati. Runtime precedente: 41 foglie, 123 immagini (111 AI dichiarate + 12 tool card). APK autonomo già installato per revisioni precedenti, non ancora aggiornato per creator/catalogo. Sessione consolidata [[03-creator-catalogo]], immutabile; successive prove in current-session.

## Runtime e repository

Checkout C:/APP/AI/VOTILT, unico worktree, main/upstream origin/main. Commit iniziale a0d85bf7240beb73f18406b99ed494a167984816 già pushato su repository privato https://github.com/antetempo/votilt.git. Nuovo commit/push autorizzato, da registrare soltanto dopo esecuzione. API 4317, PostgreSQL dedicato 55432, adb reverse; verificare processi prima della prova. Credenziali soltanto .local/. Docker vietato. Nessuna modifica ad altri progetti o credenziali.

## Blockers

Nessuno per sviluppo locale. Quiz pubblico senza dataset REAL resta disabilitato. Territori senza dati adeguati restano progetto, senza classifiche geografiche simulate. Prestazioni e hardening in [readiness](../docs/RELEASE_READINESS.md), [[stato-consegna-e-debito]].

## Recent Deploys

Nessun deploy applicativo/store. Commit iniziale e push GitHub completati; pubblicazione successiva in corso di preparazione.

> 🧑‍💻 Ultimo aggiornamento memory bank: **Fabrizio** · 2026-11-08