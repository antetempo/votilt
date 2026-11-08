# Contratto API locale

## Modello corrente · creator e categoria unica

Il cuore elegge **l’autore** nella categoria esatta assegnata al contenuto. Un solo slot per utente/categoria; altre immagini dello stesso autore non aggiungono preferenze né TILT. `champion_content_id` conserva la rappresentazione attuale, `origin_content_id` l’origine. TILT fra autori diversi, ricevute nel namespace `:creator-v1`, Elo/eventi/snapshot creator separati dallo storico immagini.

Tutti i nodi pubblicati sono selezionabili, anche radici e rami. Ogni contenuto ha una sola associazione approved/pending; gli antenati sono contesto, senza propagazione di voti. `categories` include `path`, `aliases`, `terminal` e `isFollowing` per l’identità corrente. Cache mobile legata alla sessione.

`ranking` ha una voce per autore, immagine rappresentativa, support/rating/matches/trend/position e participants con preferenze positive. Ex aequo con `rank`; UUID solo per ordine stabile. Trend senza sette giorni di storico creator → `insufficientHistory=true`. `content`/`feed` aggiungono categoryPath, tags, creatorSupport e originSupport; quest’ultimo non è un secondo voto.

`profile`: preferenceCount e categoryPreferences con percorso/preferenze/posizione corrente, da slot attivi e categorie accessibili. `category_follow({categoryId,following})` segue la categoria esatta, senza discendenti impliciti; `follow_toggle({userId,following})` resta separato. Entrambi alimentano Seguiti senza duplicati e non modificano il voto.

## Vetrina Classifiche

`category_rankings({query?})`: `{id,title,description,path,voteCount,contentCount,leader}` a qualsiasi livello. `leader` è il primo creator canonico con immagine rappresentativa, posizione 1 e supporti positivi, oppure null. Home massimo 12; ricerca fino a 100 categorie anche vuote. Prima parole nel percorso/sinonimi; senza match, ranking lessicale condiviso con tolleranza a un carattere e `suggested=true`. Nessuna AI semantica o volume social simulato. Nessun vincitore calcolato dal client.

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

Mutazioni: vote_intent, resolve_tilt, cancel_tilt; settings, profile_update, interests; follow_toggle e category_follow con stato desiderato, friend_request/answer, block; report, moderate, suspend_user, dismiss_report; mark/delete_notification; create/revoke_battle, quiz_answer, delete_content, delete_account. suggest_category/moderate_suggestion restituiscono `EDITORIAL_CATALOG_ONLY`: workflow futuro non attivo. Schemi eseguibili in server/http.ts.

Voto: `{categoryId,contentId,clientOperationId}`. Risoluzione: `{duelId,winnerSide:INCUMBENT|CHALLENGER,clientOperationId}`. Stesso ID/payload → stessa ricevuta; payload diverso → IDEMPOTENCY_KEY_REUSE. Nessun client può scegliere un vincitore fuori dai due partecipanti o modificare un contatore.

Upload: title, caption (400 caratteri), tags (20 stringhe di 40 caratteri), kind, provenance, **categoryIds di lunghezza esattamente 1**, rights=true, adultConsent=true, metadata per quell’UUID con `{name,url?}`. Tag Unicode normalizzati, minuscoli e deduplicati, con lettere/numeri/spazi/trattini/underscore. URL obbligatorio per website/tool; metadati ricontrollati in approvazione/voto. I suggerimenti non riclassificano i contenuti. Errori senza SQL/segreti; retry incerti conservano l’operation ID.
