# Contratto API locale

Base sviluppo `http://10.0.2.2:4317` su emulatore, host `http://127.0.0.1:4317`. APK autonomo: localhost tramite `adb reverse`. JSON; token tramite `Authorization: Bearer …`.

| Metodo/rotta | Scopo |
|---|---|
| GET /health | API e database raggiungibili |
| POST /auth/signup | email, password, handle, displayName, adult=true |
| POST /auth/login | email/password → token + profilo |
| POST /auth/logout | Revoca token corrente |
| POST /rpc/:action | Input validato, azione autorevole SQL |
| POST /uploads | Multipart metadata JSON + immagine; pending_review |
| GET /media/:id | Media autorizzato per identità corrente |
| GET /quiz-media/:id | Solo quiz abilitati con riferimento neutro |

Letture principali: categories, search, feed (seed/offset/limit), content, ranking (popular/elo/trend), daily, quiz, me, champions, duel, history, profile, social, taste_match, notifications, my_uploads, moderation, my_suggestions, battle.

Mutazioni: vote_intent, resolve_tilt, cancel_tilt; settings, profile_update, interests; follow_toggle con stato desiderato, friend_request/answer, block; report, moderate, suspend_user, dismiss_report; mark/delete_notification; suggest_category, moderate_suggestion; create/revoke_battle, quiz_answer, delete_content, delete_account. Vedere server/http.ts per gli schemi eseguibili.

Voto: `{categoryId,contentId,clientOperationId}`. Risoluzione: `{duelId,winnerSide:INCUMBENT|CHALLENGER,clientOperationId}`. Stesso ID/payload → stessa ricevuta; payload diverso → IDEMPOTENCY_KEY_REUSE. Nessun client può scegliere un vincitore fuori dai due partecipanti o modificare un contatore.

Upload: title, caption, kind, provenance, categoryIds (1–3), rights=true, adultConsent=true, metadata indicizzato per UUID foglia con `{name,url?}`. URL obbligatorio per website/tool. I metadati sono ricontrollati in approvazione e voto. Risposte errore espongono codici, mai SQL o segreti. Errori di rete/5xx durante il voto sono esiti incerti: il retry conserva l'operation ID.
