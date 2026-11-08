# Limiti e debito dichiarato

La destinazione è una demo locale Android, non lo store. Nessun problema critico noto nel motore di voto dopo le regressioni documentate; gli esiti effettivi sono in TEST_REPORT.md.

| Priorità | Limite | File / intervento |
|---|---|---|
| Prima di abilitare quiz | Mancano fotografie REAL con provenienza verificata; il pubblico vede spiegazione e modalità disabilitata | app/ai-universe.tsx, private.quiz_items; curare un dataset documentato |
| Prima dello store | API HTTP su loopback, firma APK debug, credenziali demo locali | app.config.ts, scripts/package-android.mjs; infrastruttura HTTPS e firma di distribuzione |
| Prima della distribuzione | Advisory transitive Expo/tooling low/moderate, nessuna high/critical nell'audit eseguito | package-lock.json; rivalutare aggiornamenti compatibili, non downgrade automatici |
| All'aumentare del traffico | Lock transazionale globale e ranking aggregato | server/schema-core.sql, server/api.sql; misurare contesa prima di granularizzare |
| Dati reali | Dichiarazione 18+, diritti e consenso non equivalgono a verifica d'identità | app/upload.tsx, server/http.ts; processo di moderazione e policy prima del pubblico |
| Operatività locale | Snapshot giornaliero manuale; trend richiede sette giorni di storico vero | scripts/snapshot.mjs; configurare eventuale esecuzione periodica solo su richiesta |
| Fuori dal requisito locale | Recupero password via email e push non configurati; notifiche in-app disponibili | server/auth.ts, app/notifications.tsx |
| Verifica da ampliare | Non misurati FPS, memoria e throughput; non svolta una sessione manuale completa con TalkBack o su telefono fisico | docs/TEST_REPORT.md |
| Retry social | Voto e upload hanno receipt persistenti; alcune azioni social restituiscono stato non più valido se già completate, invece di la stessa risposta | server/api.sql; non producono doppi voti, ma estendere receipt se si aggiunge retry automatico social |

Gli originali AI sono inclusi: il setup non richiede account o chiamate AI. La cache offline può mostrare l'ultima copia autorizzata per 24 ore; il server rivaluta l'accesso online. Logout/cambio account pulisce dati e immagini. Non viene promesso il ritiro istantaneo di copie già scaricate su dispositivi offline.
