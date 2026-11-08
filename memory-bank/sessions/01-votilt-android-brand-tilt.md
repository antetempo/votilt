---
title: VOTILT Android completo, brand originale e TILT dinamico
type: session
status: consolidated
date: 2026-11-06
session: 1
author: Fabrizio
tags: [android, local-runtime, voting, brand, tilt, moderation, testing, handoff]
touched_files: [app/, src/, server/, scripts/, tests/, assets/, migrations/, schema.sql, README.md, docs/, memory-bank/]
related_commits: []
linked_patterns: ["[[voto-server-autorevole]]", "[[collaudo-android-animazioni]]"]
---

# Esito della giornata

Realizzata VOTILT Android nativa su Windows dal requisito completo dell'utente, con backend multiutente persistente locale, brand e immagini originali, login email/password senza Google. Completati piano a fasi, studio agentico iniziale, audit r1/r2/cross-fase, correzioni richieste durante la prova e collaudi reali. Chiusura richiesta esplicitamente da Fabrizio con consolidamento di tutto il lavoro.

Specifiche: originale conservato integro in docs/SPECIFICA_ORIGINALE.md e [[requisiti-completi]]; richieste della chat prevalenti. Piani docs/votilt-plan.md, docs/votilt-refinement-plan.md e docs/votilt-tilt-plan.md. Nessun commit, push, deploy, pubblicazione store o reset password. Unica working copy C:/APP/AI/VOTILT, main senza commit; git log non disponibile perché il repository è ancora unborn. Nessun lavoro da recuperare da altri worktree.

## Infrastruttura, motore e sicurezza

Docker escluso esplicitamente: usati PostgreSQL 18 già installato e Node/Fastify. Creato cluster VOTILT dedicato in .local, porta 55432; servizio esistente 5432 intatto. DB votilt, votilt_test e votilt_bootstrap_test separati. API loopback 4317, sessioni con token opachi hashed e password scrypt, SecureStore mobile. Ruolo API non owner/RLS, grant espliciti e nessun accesso diretto alle credenziali.

Motore transazionale: una preferenza per utente/foglia, versione slot, confronto TILT con validazione stato/kind, receipt persistente con fingerprint e idempotenza, Elo 1500/K32 e cooldown coppia 24 ore. Supporto attivo distinto da Elo e trend reale. Moderazione, blocco, sospensione e cancellazione invalidano slot/confronti nella stessa transazione. Ricontrollo auth dopo lock; cleanup upload non elimina media su commit incerto; logout revoca il token corrente tramite funzione autorizzata. Prove con sessioni reali, concorrenza/barriere e fault injection, non esiti simulati.

DDL/API e migrazioni idempotenti sincronizzati in schema.sql, sorgenti server e snapshot migrations. Checklist [[deploy-checklist]] aggiornata, inclusa migrate_categories_rankings_and_policy.sql. Seed ripetibile, credenziali/preferenze preservate. Leaven-chain non eseguibile per mancanza degli strumenti richiesti: fallback sequenziale nella chat madre; subagenti soltanto revisori iniziali/finali, nessuna implementazione delegata della catena.

## Funzioni e contenuti consegnati

Feed verticale con paging/cache/prefetch, categorie/breadcrumb/ricerca, profili/privacy, follow/amicizie distinte, Friends Battle e Taste Match con consenso, notifiche in-app, caricamento reale, coda moderatore/report/audit/ripristino/sospensione e cancellazione account. AI Universe/Tools sullo stesso motore; daily UTC e trend da snapshot autentici. Quiz pubblico Real or AI? intenzionalmente disabilitato in assenza di foto REAL con provenienza documentata; motore verificato con fixture isolate. Nessuna AI obbligatoria a runtime.

Catalogo base: 41 foglie, 123 candidati distinti con manifest, 111 immagini AI generate e dichiarate + 12 tool card originali con link ufficiali. JPEG 800×1200, EXIF assenti, hash distinti. Bootstrap: sei utenti demo, 192 campioni, 12 pending/3 rejected/2 hidden; fixture Android aggiuntive conservate. Non trasformare persone/luoghi sintetici in esempi REAL.

Requisito esplicito metadati: ogni immagine richiede categoria, nome e riferimento fondamentale specifico; persona → nome, sito/tool → nome e URL. Obbligo server per ogni associazione, massimo tre foglie, modulo dinamico e ricerca sui metadati. Dettagli [[metadati-contenuti]] e docs/CONTENT_METADATA.md.

## Correzioni UX richieste e completate

Fabrizio ha approvato colori/contrasto e richiesto immagini protagoniste. Rimossi wordmark VOTILT dal feed, CTA “Scegli come campione”, scritte troppo grandi e didascalia generica “Un’illustrazione originale…”. Tab Per te/Seguiti/Scopri più in alto; cuore compatto, nome/autore/provenienza e categoria. Didascalia soltanto dell'autore, facoltativa: una riga con Altro/Meno.

Vecchio hub centrale TILT rimosso e archiviato; cinque posizioni Feed/Esplora/Pubblica/Classifiche/Profilo, centro con solo simbolo senza etichetta. Pubblicazione con scelta categoria o proposta se assente, preservando la bozza quando si accetta una categoria suggerita. Classifiche dalle categorie più votate, ricerca categoria e ricerca interna, posizione globale mantenuta nel filtro.

Controlli categorie condivisi client/server: normalizzazione Unicode/omografi/leet/invisibili/spazi/ripetizioni, lessico IT/EN e contesti inappropriati, regressioni benigni/ambigui, duplicati fuzzy/alias/plurali. Proposte private altrui non esposte; controllo e creazione/approvazione serializzati per evitare duplicati concorrenti. Filtro deterministico più revisione umana, senza promessa di comprensione infallibile. Specifiche in docs/CATEGORY_MODERATION.md.

Brandbook operativo e visuale: docs/BRANDBOOK.md, docs/brandbook.html, docs/VOTILT-Brandbook.pdf. Palette preservata e 23 pittogrammi originali su griglia condivisa; nessun uso di icone stock in app/src. Corretto cachePolicy delle icone dopo reinstallazione per evitare associazioni a ID Android della vecchia build.

## TILT dinamico finale

Tolte spiegazioni, nomi visibili e pulsanti testuali dal confronto ordinario. Rimangono TILT, due immagini toccabili e X. Carte con prospettiva 3D nativa, ingresso elastico, fluttuazione lenta, riflessi/orbita neon e scelta che avanza dopo ricevuta server. Nomi e istruzioni essenziali nelle etichette accessibili. X e indietro annullano; doppio tocco bloccato, errore/offline consentono recupero, movimento ridotto app/sistema rispettato. Nessun nuovo motore o dipendenza 3D.

Corretto voto asincrono dopo smontaggio/ricreazione Android: la risposta aggiorna i dati senza navigare sul vecchio router. Driver con swipe proporzionati alla dimensione reale e lettore SDK senza attesa idle per osservare animazioni continue. Il vecchio dump può fallire e non deve essere sostituito con XML stantio. Fixture di ricerca metadati resa unica per evitare saturazione della prima pagina da esecuzioni precedenti. Nessuna modifica al motore per quest'ultimo problema.

## Prove e artefatti finali

Typecheck/lint/format PASS. 96 unit/componenti in 11 suite, 46 integrazioni HTTP/PG PASS. 31 controlli Android registrati su nove report: 18 iniziali + 6 revisione + 7 TILT; non sono tutti ripetuti a ogni modifica, i sette TILT sono stati ripetuti sull'APK finale. Matrice demo 40/40 con prove indicate. Bootstrap fresh e doppio rerun preservano dati/password, Expo doctor 20/20 nel collaudo iniziale, otto valori segreti locali assenti dal bundle.

Android: standalone senza Metro, due formati/font 130%, Internet pubblico disabilitato con backend locale, cache offline, upload → moderatore → secondo votante, social, 103 impressioni significative senza crash. TILT: scelta/trasferimento veri, X/indietro preservano la preferenza; movimento verificato su fotogrammi e zero differenze nella zona carte con movimento ridotto. Foto/video in docs/evidence/android, 44-final-tilt-open.png e tilt-motion.mp4. Preferenze/font/dimensioni ripristinati dopo i test.

APK output/VOTILT-local-demo.apk: 63677721 byte, SHA256 cc26f2c07d2eb6370efc158379487e912751a24116e77ffe405a75bda47b3f79, arm64-v8a/x86_64, firma debug locale. API su localhost:4317 tramite adb reverse; sviluppo 10.0.2.2:4317. AVD Medium_Phone_API_36.1 visibile, emulator-5554. L'ultima azione operativa ha lasciato il nuovo TILT aperto per Fabrizio; non assumere processi ancora attivi alla prossima giornata. Credenziali esclusivamente nel file privato .local/demo-credentials.json, nessun valore nel vault.

Rapporti autorevoli: docs/TEST_REPORT.md, docs/PROGRESS.md, docs/ACCEPTANCE_MATRIX.md e JSON in docs/evidence. Seguire README per avvio. Limiti e ledger in [[stato-consegna-e-debito]].

## Limiti e ripresa

Demo locale, non produzione. Quiz REAL senza dataset, reset email/push non configurati, snapshot giornaliero manuale e trend con storico reale; nessuna automazione. HTTPS/firma, backup/segreti, moderazione/policy, dipendenze e prove su telefono/TalkBack prima di distribuzione. FPS/memoria/throughput NOT_MEASURED.

Un solo debito di capacità: lock globale da raffinare per categoria dopo misura di contesa. CLI segnala cinque no-trigger per le copie SQL e il commento francese, ma il trigger semantico è già presente; nessun cambio codice nel consolidamento. Nessuna ambiguità strutturale aperta, nessun blocco per demo. Prossimo passo: prova prodotto/feedback di Fabrizio; sviluppi esterni solo su richiesta/autorizzazione dedicata.

## Appunti operativi originali conservati AS-IS

<!-- Appunti della sessione corrente; consolidamento storico solo su richiesta esplicita. -->

Autore: Fabrizio · 2026-11-06.

Realizzati Android VOTILT, brand e asset originali, API locale e PostgreSQL dedicato senza Docker. Requisiti originali acquisiti integralmente; requisito aggiunto in chat sui metadati obbligatori implementato. Studio agentico e audit r1/r2/cross-fase conclusi. APK autonomo, test ed evidenze in docs/TEST_REPORT.md; stato in docs/PROGRESS.md.

Ultimi risultati: 46 integrazioni, 96 unit/componenti, 31 controlli Android (18 iniziali + 6 revisione + 7 TILT), bootstrap e rerun PASS. Screenshot reali, 123 asset unici, quiz pubblico disabilitato correttamente. Corretti anche sospensione durante attesa lock, commit upload incerto e logout con minimi privilegi.

Revisione richiesta da Fabrizio completata: brandbook, 23 icone originali, palette invariata, feed alleggerito e didascalia autore espandibile, like, centro pubblicazione senza etichetta, classifiche per categoria e ricerca interna, controllo testo/duplicati e selezione suggerita senza perdere la bozza. Piano docs/votilt-refinement-plan.md PASS.

Nessun commit/push/deploy. Nessuna credenziale qui. Prossime attività eventuali in activeContext e KNOWN_ISSUES.

Richiesta successiva Fabrizio: TILT più dinamico, solo il titolo e le immagini, prospettiva 3D e animazione della scelta. Implementazione in TiltArena, server autorevole invariato; prove UI/errore/doppio tocco e collaudo nativo con video, dettagli nel piano dedicato.

