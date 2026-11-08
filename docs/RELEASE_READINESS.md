# Prontezza al rilascio

Destinazione attuale: **demo locale Android**, nativa Expo/React Native, PostgreSQL 18 e API locali, senza Docker. APK debug autonomo compilato, installato e verificato su emulatore. Prodotto pronto da verificare; approvazione finale di Fabrizio non registrata.

Consegna creator/catalogo dell’8 novembre: una categoria anche intermedia per immagine, preferenza al creator nella categoria esatta, nessun rollup; TILT autorevole, origine della preferenza e rating creator distinti dallo storico immagini. Ricerca su 1427 nuovi nodi, tag/descrizione liberi, follow persona/categoria, profili e classifiche con badge correnti. Auth, moderazione, privacy, amicizie e confronti consensuali restano nel client. Prove attuali: 120 unit/componenti, 55 integrazioni, 11 percorsi Android PASS; migrazione e bootstrap fresco/rerun PASS. [Rapporto](TEST_REPORT.md).

Quiz pubblico disabilitato senza fonti REAL verificate. Territori, video e coda completa per proposte editoriali sono rollout successivi; nessuna lega simulata o categoria pubblicata automaticamente da AI.

Repository [antetempo/votilt](https://github.com/antetempo/votilt) pubblico per scelta esplicita di Fabrizio. Commit/push autorizzati; ricevuta verificata in [github-publication.json](evidence/github-publication.json). Nessun deploy applicativo o pubblicazione store.

Prima della distribuzione esterna: autorizzare separatamente infrastruttura/deploy, configurare HTTPS e firma release, gestione segreti, backup/restore, monitoraggio, processo di moderazione, privacy/retention; eseguire prove su telefoni reali e TalkBack, misurare prestazioni/contesa del lock globale e rivalutare advisory delle dipendenze. Queste attività non sono dichiarate eseguite. [Problemi noti](KNOWN_ISSUES.md) e [metadati](CONTENT_METADATA.md).
