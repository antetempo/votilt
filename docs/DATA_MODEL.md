# Modello dati

| Area | Tabelle principali | Invariante |
|---|---|---|
| Identità | profiles, profile_settings, user_roles | Privacy e ruolo verificati server-side |
| Autenticazione privata | private.credentials, private.sessions | Scrypt; solo hash token nel DB |
| Catalogo | categories, content_items, content_categories, content_metadata | Foglie pubblicate; riferimento per ogni associazione |
| Voto | vote_slots, vote_events, tilt_duels, operation_receipts | Un campione per utente/foglia; replay identico |
| Rating | duel_ratings, rating_events | Un evento per duello; cooldown canonico |
| Social | follows, friend_requests, friendships, user_blocks, battle_shares | Blocco reciproco e consenso rivalutato |
| Gestione | reports, moderation_actions, category_suggestions, notifications | Ruoli/autorizzazioni e audit |
| Ritorno | daily_challenges, ranking_snapshots, content_impressions | Date UTC, storico autentico |
| Quiz | private.quiz_items, real_ai_answers | Verità privata, primo tentativo immutabile |

`schema.sql` è lo snapshot completo per installazione e aggiornamento. Le sorgenti sono `server/schema-core.sql` e `server/api.sql`; `npm run db:migrate` rigenera schema e migrazioni complete idempotenti. I tipi generati vengono dal DB reale (`npm run db:types`).

Il supporto popolare è `COUNT(vote_slots)` corrente; non si sommano eventi storici. Nascondere contenuti, sospendere utenti o eliminare account invalida slot e duelli coinvolti senza eleggere sostituti. La riattivazione non reinstaura automaticamente i voti invalidati. Le tabelle pubbliche hanno RLS; quelle senza policy di lettura consentita restano deny-by-default.
