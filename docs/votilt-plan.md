# VOTILT — piano esecutivo e verifiche

Data: 2026-11-06. Richiesta: app mobile Android completa, stile TikTok ma brand originale Dark Neon, immagini prodotte dall'agente, login senza Google, collaudo svolto dall'agente. Solo sviluppo/demo locale, niente store o deploy.

## Fonti e precedenza

1. Richieste in chat, inclusa **esclusione esplicita di Docker**.
2. Specifica completa conservata senza modifiche in SPECIFICA_ORIGINALE.md (sezioni 0–22).
3. Decisioni e integrazioni qui sotto. Il testo del documento allegato è riferimento di prodotto; non concede autorizzazioni a push, deploy o reset distruttivi.

## Orchestrazione

La leaven-chain richiesta non è eseguibile: mancano start_session/SendMessage richiesti dalla skill. Non simulare quella catena con subagenti. Alternativa richiesta dall'utente: questa chat mantiene piano, avanzamento e implementazione sequenziale. Tre revisori indipendenti hanno svolto soltanto lo studio agentico (backend/sicurezza, UX/prodotto, QA/fattibilità); nessuno modifica la checkout. Nessun commit/push implicito.

## Architettura corretta dopo il vincolo Docker

- Mobile: Expo SDK stabile verificato su registry, Router, TypeScript strict, React Native, Reanimated/Gesture Handler, expo-image, TanStack Query, Zustand, form validati Zod, safe area e accessibilità.
- Server: Node locale, Fastify, PostgreSQL 18 **nativo già installato**, pg, autenticazione email/password con scrypt e sessioni server persistenti. Nessuna dipendenza da Supabase Docker o cloud.
- DB: nuovo cluster VOTILT dedicato su loopback/porta isolata, senza toccare servizio o credenziali PostgreSQL esistenti. Vincoli/RLS e funzioni transazionali SQL restano obbligatori. App DB role senza bypass RLS; identità transazionale tramite contesto locale non modificabile dal client.
- Media: filesystem privato locale, upload autorizzati, verifica effettiva dei byte, normalizzazione immagini e download con controllo accesso. Il mobile non contiene credenziali DB o privilegi admin.
- Emulatore Android già presente: Medium_Phone_API_36.1. API raggiunta tramite 10.0.2.2; HTTP soltanto per sviluppo.

## Audit r1 — copertura della specifica

- Preservare 41 foglie del catalogo (minimo 40), almeno 123 contenuti approvati distinti (tre per foglia), più 12 pending, 3 rejected, 2 hidden. Sei utenti fittizi, almeno tre interattivi, oltre 150 campioni coerenti e rating prodotti dal motore reale.
- Separare kind (photo/illustration/ai_art/ai_tool) da provenance. Nessuna immagine generata è una foto REAL. AI Universe usa il medesimo motore e non richiede inferenza a runtime.
- Cinque tab: Feed, Esplora, TILT, Classifiche, Profilo. Nel Feed: Per te, Seguiti, Scopri, per non duplicare il nome Esplora.
- Login/signup/session restore/logout reali; onboarding 18+ dichiarativo e interessi; password reset soltanto se effettivo.
- Social completo: profili/privacy, follow, amicizia, confronto consensuale, upload privati, moderazione in app, report/blocco, notifiche, proposte categorie, cancellazione account reale.
- Quiz pronto e testato con fixture test-only; catalogo pubblico disabilitato finché manca provenienza REAL verificata. Nessuna falsa etichetta.

## Audit r2 — integrità, privacy e concorrenza

- Receipt con fingerprint canonico; serializzare anche duplicati simultanei della stessa operazione. Payload diverso con stesso ID → IDEMPOTENCY_KEY_REUSE.
- Protocollo di lock unico per voto/resolve/hide/block/delete. Acquisire categorie/contenuti e slot in ordine stabile; Elo in ordine UUID. Testare race reali, non soltanto sequenze.
- Stato approved e associazione foglia devono essere validi fino al commit. content_categories include approvazione per associazione.
- Blocco reciproco invalida campioni incompatibili e duelli atomicamente, senza sostituti automatici.
- Cooldown Elo canonico utente/foglia/coppia non ordinata; la preferenza può cambiare anche quando rated=false.
- Consenso campioni owner/friends/public e opt-in confronto distinto; revoca e blocco rivalutati anche su inviti già emessi.
- Download autenticato controlla ogni richiesta; niente promessa falsa di revoca immediata su URL firmate già distribuite. Svuotare cache privata al cambio account.
- Quiz neutro: nessun badge, path o ID correlabile che riveli provenienza prima della risposta.
- Popolari = supporti attivi adesso, Duelli = Elo cumulativo, Trend = delta misurato su storico. Dati insufficienti espliciti.

## Audit cross-fase — verificabilità

Ogni AC è tracciato in ACCEPTANCE_MATRIX.md; T01–T28 in TEST_REPORT.md. Test API con sessioni reali di utenti distinti e controlli negativi sensibili alle policy. Fixture test isolate dalla demo; seed eseguito due volte. Risposta HTTP persa e ripresa app mantengono l'operation ID. Android verifica la rete effettiva verso host e media, oltre ai test host.

## Step e gate

| Step | Implementazione | Backend | Frontend / UI e Android | Gate |
|---|---|---|---|---|
| M0.1 | Repo, memory bank, piano, toolchain, brand/tokens | Doctor tool/porte/DB dedicato | Build e schermata bootstrap | Tool reali funzionanti; nessun Docker |
| M0.2 | API locale, auth, sessioni, errori | Health, login negativo/positivo, refresh/logout | Login Android, restore, backend down | App installata e API raggiungibile |
| M1 | Schema/RLS, catalogo, asset, seed, storage, interessi | Migrazioni e seed idempotenti; pending protetti | 41 foglie, feed sola lettura e immagini da server | Due account vedono gli stessi dati persistenti |
| M2.1 | Slice una foglia/tre candidati, intent/duello/ranking | Invarianti, receipt, lock, T01–T20 applicabili | Primo voto, annulla, conferma, trasferisci | Supporti e storico coerenti; race/idempotenza verdi |
| M2.2 | Estensione feed, campioni, Elo, cooldown, paging | Quadratura ranking e sampler deterministico | Feed verticale, duello leggibile, stati error/offline | T01–T20 e prove Android core |
| M3.1 | Profili/privacy, follow, amicizie, blocco, notifiche | Permessi, blocco transitivo, consenso | Account distinti e relazioni reali | Friends Battle solo dopo gate M2 |
| M3.2 | Upload, proposte categorie, report, moderazione, delete | Byte/MIME, grants, invalidazione, cascade | Upload → approva moderator → voto altro account | Nessuna azione privilegiata da utente normale |
| M4 | AI Art/Tools, quiz, daily, trend, share | Nessun truth leak, tentativo unico, UTC, storico | Hub, badge corretti, quiz onesto, deep link | Stesso motore, niente AI runtime obbligatoria |
| M5 | Accessibilità, rifinitura, documenti, audit finale | Regressione, sicurezza, rerun seed e offline LAN | Due formati, font grande, 100 item, screenshot reali | verify:all + E2E pertinenti; limiti dichiarati |

## Direzione visiva

Brand VOTILT, “Scrolla. Scegli. Vai in TILT.” Wordmark originale, simbolo V inclinata/fulmine/corona. Base #090711, superfici #171326/#211A35, testo #F8F6FF, viola #A855F7; cyan e magenta per il duello. Feed immersivo, scrim leggibile, azioni laterali secondarie, corona come voto (mai cuore). Cinque tab con centro TILT marcato. Touch target 48 dp, safe area, motion 180–320 ms e reduce motion.

Sei direzioni asset: ritratti fittizi editoriali, food illustrativo appetibile, gaming isometrico/RGB, paesaggi cinematografici, design/sculture e AI visionaria. Manifesto con prompt/provenienza e nessun hotlink. Non 123 cambi di titolo sullo stesso disegno.

## Evidenze e ripresa

Ogni tranche aggiorna PROGRESS e TEST_REPORT con comandi, esiti effettivi e prove. Screenshot soltanto catturati dall'app. FPS/memoria NOT_MEASURED senza strumenti. Se un gate fallisce: correggere o marcare BLOCKED/PARTIAL, non dichiarare concluso. Stato finale massimo READY FOR LOCAL DEMO, mai produzione. Commit/push/deploy esclusi finché non autorizzati esplicitamente.
