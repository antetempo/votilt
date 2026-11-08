# VOTILT — creator, catalogo editoriale e classificazione visibile

Data: 8 novembre 2026. Owner: Fabrizio. Stato generale: **IN_PROGRESS**.

## Mandato e precedenza

La richiesta più recente autorizza a procedere automaticamente: piano persistente, memory bank, commit e push dei lavori pertinenti su `antetempo/votilt`, poi implementazione, verifiche e installazione Android. Il precedente checkpoint preventivo sul piano è revocato. Nessun deploy. Le fasi diventano **pronte da verificare** dopo prove effettive; soltanto Fabrizio può dichiararle **approvate**, ma questa distinzione non blocca il lavoro ora autorizzato.

Si conserva l’app Android Expo nativa, il brand Dark Neon, le immagini protagoniste, il TILT e la barra inferiore persistente. PostgreSQL 18 e Node locali, Docker escluso, risorse dedicate in `.local/`. Nessuna modifica alle credenziali o agli altri progetti.

## Decisioni di prodotto

Decisioni correnti confermate nella chat vocale; superano il precedente vincolo di pubblicare soltanto sulle foglie. L’utente ha autorizzato autonomia fino alla build verificata e installata, senza attendere approvazioni preventive.

1. **Un creator preferito per utente e categoria selezionata.** Il cuore su un’immagine sceglie il suo autore nella sua unica categoria, anche intermedia. Altre immagini dello stesso autore in quella categoria non generano ulteriori preferenze o TILT contro sé stesso. L’immagine d’origine resta tracciata. Preferenza attiva trasferibile, non endorsement irrevocabile.
2. **Seguire è distinto dal preferire.** Follow libero di una persona e follow di una categoria, con effetti reali sul feed Seguiti. Unfollow non ritira la preferenza; votare non attiva automaticamente un follow.
3. **Catalogo editoriale ampio e profondo.** Gli utenti scelgono categorie esistenti a qualsiasi livello. Le nuove categorie non vengono create automaticamente. **Proposte utenti riaperte dalla successiva richiesta vocale:** rollout successivo in coda separata, analisi interna asincrona di duplicati/sinonimi/collocazione/appropriatezza e approvazione editoriale umana; AI eventualmente assistiva, mai autoapprovazione. La prima consegna mantiene il workflow non attivo e realizza ricerca e suggerimenti sul catalogo esistente.
4. **Descrizioni e tag liberi.** Testo e tag sono metadati persistenti, non nuove categorie o slot. Massimo 20 tag di 40 caratteri, validati a UI e server; descrizione fino a 400 caratteri. Nomi/sinonimi/percorso/parole chiave producono suggerimenti ordinati con match esatti prima dei vicini lessicali. L’autore sceglie e corregge; nessuna riclassificazione automatica dei pubblicati. Nessun invio a servizi esterni o API a pagamento. Similarità semantica da valutare su casi reali, senza presentare come AI il ranking lessicale attuale.
5. **La classificazione è parte visibile del prodotto.** Categoria e percorso devono essere riconoscibili in feed/dettaglio, ricerca, upload, profilo e classifiche dove pertinente. Questa è una scelta di VOTILT; non un’affermazione verificata sul funzionamento di tutti gli altri social.
6. Prima immagini; video in una successiva estensione dello stesso modello. Nessuna finta capacità video nella consegna attuale.
7. Profili con totale delle preferenze effettivamente ricevute e dettaglio per categoria. Distinguere preferenze attive da persone uniche: lo stesso sostenitore in due categorie vale due preferenze.
8. Riconoscimenti visivi: primo, secondo, terzo e posizione numerata dal quarto al centesimo, con categoria sotto. Esprimono preferenza della comunità, non certificazione professionale, bellezza oggettiva o verità scientifica.
9. Dimensioni regionali, nazionali, europee e mondiali previste nel progetto. Nessuna classifica territoriale attiva senza dati adeguati. Nessun GPS o geolocalizzazione implicita autorizzati.

L’approvazione del concetto creator, comunicata dopo il primo studio esplorativo, prevale sulla precedente indicazione di studiarlo soltanto. L’approvazione del concetto non equivale ad approvazione di ogni dettaglio implementativo.

## Stato di partenza verificato

- `a0d85bf7240beb73f18406b99ed494a167984816`: import iniziale già pubblicato nel repository privato. README visuale e revisioni Classifiche/navigazione sono successive, da includere nel commit autorizzato corrente.
- Motore precedente: slot `(user_id, category_id)` con `champion_content_id`, Elo e storico per immagine. Il nuovo motore creator è implementato e sottoposto alle prove separate sotto.
- Catalogo runtime precedente: 41 foglie; 123 immagini demo distinte, 111 AI dichiarate e 12 tool card. Il catalogo editoriale v0.2 contiene **36 radici, 211 rami incluse le radici, 1.216 foglie, 1.427 nodi, profondità massima 5**, misurati da `research/catalogo-editoriale/genera.mjs`.
- Ultime prove pregresse: 106 unit/componenti, 46 integrazioni HTTP/PG, 8 percorsi Android della navigazione; cinque percorsi Classifiche su build precedente. Non trasferire automaticamente questi PASS al nuovo modello.
- Grafica esistente: brandbook MD/HTML/PDF, 23 icone originali, copertina SVG README, screenshot reali e video TILT. L’illustrazione decorativa generata è stata poi esclusa per decisione esplicita di Fabrizio.

## Ricerca e catalogo consegnabile

Documento completo: [GERARCHIA_COMPLETA.md](research/catalogo-editoriale/GERARCHIA_COMPLETA.md). Dati: [JSON](research/catalogo-editoriale/catalogo.v0.2.json), [CSV foglie](research/catalogo-editoriale/catalogo-foglie.csv), [conteggi](research/catalogo-editoriale/conteggi.json). Copia utente sincronizzata sotto `C:/Users/antet/Documents/Codex/2026-11-08/realtime-voice-chat/outputs/`.

La bozza è originale: niente copia massiva di cataloghi esterni o garanzia di esaustività assoluta. Copre relazioni, quotidianità, famiglia, divertimento, mare/costumi, espressione personale e danza, oltre a hobby specialistici, sport, cultura, tecnologia, scienza e informazione. FPS e moto custom sono percorsi profondi espliciti. Ogni intersezione con tono/luogo/formato non diventa automaticamente una nuova foglia.

Fonti primarie consultate e loro impiego:

| Fonte | Impiego | Limite |
|---|---|---|
| [W3C SKOS](https://www.w3.org/TR/skos-reference/) | Concetti, etichette preferite/alternative, relazioni più ampie e correlate | Modello di vocabolario; non sceglie le categorie VOTILT |
| [IAB Content Taxonomy](https://iabtechlab.com/standards/content-taxonomy/) | Controllo dell’ampiezza tematica | Pubblicità contestuale; non adatto da copiare come campionato creator |
| [IPTC Media Topics](https://iptc.org/standards/media-topics/) | Informazione, scienza, cultura e gestione editoriale | Orientamento giornalistico; non copre da solo vita sociale e autoespressione |
| [Pew, motivazioni Instagram 2024](https://www.pewresearch.org/2024/06/12/how-instagram-users-view-experience-the-platform/) | Evidenza per includere divertimento, relazioni e interessi condivisi | Campione statunitense; nessuna quota estrapolata a VOTILT o all’Italia |
| [Ofcom, adulti e media 2026](https://www.ofcom.org.uk/media-use-and-attitudes/media-habits-adults/adults-media-use-and-attitudes) | Uso sociale, creatività, contatti e intrattenimento | Regno Unito; comportamenti video non equivalgono a validazione della nostra app immagini |
| [Ryan e Deci, 2000](https://selfdeterminationtheory.org/SDT/documents/2000_RyanDeci_SDT.pdf) | Autonomia, competenza e relazione come lente di progetto | Teoria, non esperimento sul nostro prodotto |
| [Meta, feed e ranking](https://about.fb.com/news/2023/06/how-ai-ranks-content-on-facebook-and-instagram/) | Distinguere follow esplicito e scoperta | Descrizione di piattaforma, non prova di efficacia su VOTILT |
| [UN M49](https://unstats.un.org/unsd/methodology/m49/) | Gruppi geografici espliciti, Europa distinta da UE | Classificazione statistica, non verifica della residenza |
| [C2PA Explainer 2.2](https://spec.c2pa.org/specifications/specifications/2.2/explainer/Explainer.html) | Traccia di provenienza dei media | Versione consultata, non dichiarata più recente; provenienza non equivale a verità |

### Regole editoriali

- Concetto canonico unico e ID stabile di pubblicazione; sinonimi e rinvii non creano slot aggiuntivi. Gli ID `draft-*` attuali sono di bozza, non identità di produzione.
- Un genitore canonico per la navigazione, collegamenti correlati per sovrapposizioni. Rinominare non azzera i voti; scissioni/fusioni richiedono migrazione esplicita senza duplicarli.
- Distinguere soggetto, tono e formato. “Divertente”, “AI”, “foto” e luogo sono spesso attributi; non moltiplicare il catalogo con un prodotto cartesiano.
- Descrizione e criteri di appartenenza per foglia; audit di collisioni, granularità, duplicati e casi di confine. Verifica per scenari campionati, senza chiedere a Fabrizio la revisione di 1.216 righe una per una.
- Nell’era immagini, una foto di un musicista o ballerino non prova qualità musicale o tecnica coreografica. Le etichette descrivono contenuti, non attestano qualifiche.
- Costumi, spiaggia e danza ordinari ammessi nel loro contesto; glamour soltanto adulti consenzienti. Nessuna sessualizzazione di minori, materiale esplicito, sfruttamento o contenuto non consensuale. Famiglia/minori: privacy e diritti da verificare, nessuna gara sull’attrattività dei bambini.

## Audit r1 — flussi reali da modificare

| Flusso | Codice reale | Modifica necessaria |
|---|---|---|
| Catalogo e validazione | `server/schema-core.sql`, `server/api.sql`, `scripts/seed.ts` | Profondità variabile, tutti i nodi selezionabili; UUID/sinonimi, categoria unica e conservazione delle categorie storiche |
| Cuore e TILT | `api.vote`, `api.validate_candidate`, `src/features/voting.ts`, `Feed.tsx`, `TiltArena.tsx` | Comparare autori, mantenere origine e slot/versione, nessun duello stesso creator |
| Conteggi e classifiche | `content_json`, `dispatch ranking/category_rankings`, `CategoryRanking.tsx`, `Rankings.tsx` | Una voce per creator/categoria esatta, immagine rappresentativa; conteggi etichettati come preferenze al creator |
| Profilo e preferiti | `dispatch profile/champions/taste_match`, route profilo/persona | Totali ricevuti, ripartizione foglie, preferenze per autore anche se immagini d’origine diverse |
| Follow/feed | `public.follows`, `user_category_interests`, `feed_candidates`, `feed_items` | Follow persona e categoria distinti; onboarding non equivale a follow; deduplicare contenuti nel feed |
| Ricerca/upload | `explore.tsx`, `upload.tsx`, `uploadSelection.ts`, `category/[id].tsx` | Ricerca percorso/sinonimi, categoria centrale e visibile, selezione esistente, profondità variabile |
| Proposte utenti | `suggest.tsx`, `suggest_category`, `moderate_suggestion`, `category_check` | Disattivare la creazione utente anche lato server; conservare lo storico, niente cancellazione fisica |
| Contratti e cache | `src/lib/contracts.ts`, `src/types/domain.ts`, `src/lib/api.ts` | Nuovi campi/semantica, invalidazione coerente, nessuna compatibilità finta con vecchi risultati |
| Moderazione/privacy | `invalidate_content`, blocco, sospensione, ritiro, delete | Preferenza valida solo verso autore e contenuti eleggibili, nessun sostituto automatico di autore |

## Audit r2 — integrità e migrazione

- Migrare ogni slot immagine esistente verso il suo `author_id`, conservando `champion_content_id` come origine e cronologia. Non confondere autore con persona rappresentata o `subject_name`.
- Nessun reset di credenziali, nessuna rigenerazione distruttiva dei dati. Schema canonico, migrazione idempotente e checklist nello stesso commit. Prova su database test e rerun prima del runtime locale.
- Ricevute idempotenti e lock transazionale condiviso preservati; conflitto di payload con stesso operation ID respinto. Voto/resolve/cancel contro moderazione, blocco, sospensione e cancellazione testati in concorrenza.
- Origine non disponibile: cercare soltanto altro contenuto eleggibile dello stesso autore nella stessa categoria; se non esiste, invalidare lo slot, mai cambiare creator automaticamente. Il cambio dell’immagine rappresentativa non deve generare nuovo voto.
- Vecchio Elo per immagine conservato come storico; nuovo Elo creator distinto, non somma di rating. Confronto/cooldown per coppia di autori, non aggirabile cambiando foto. Vecchi duelli pendenti non devono risolversi come se fossero già confronti creator.
- Testare due immagini dello stesso creator, autori diversi, due utenti, doppio tap, retry con risposta persa, richieste simultanee, cancel, contenuto rimosso, categoria archiviata, cache cambio account e privacy.
- Profili: preferenze attive per foglia sommabili; fan unici separati; conteggi per immagine d’origine non sommati come nuovi voti. Escludere dati invisibili dal dettaglio pubblico secondo le policy.
- Catalogo: cicli/genitori mancanti/depth incoerente/ID duplicati respinti; il criterio di foglia non dipende da un numero massimo fisso. Ricerca coerente su mobile e API.

## Classifiche, riconoscimenti e territori

Popolari mostra preferenze attive al creator nella foglia; Duelli mostra il suo Elo realmente prodotto; Trend richiede storico creator compatibile, altrimenti “Dati in accumulo”. Niente riutilizzo ingannevole dello storico immagini.

Una sola voce per autore/categoria esatta impedisce di occupare cento posizioni con cento foto. A parità di merito, ex aequo esplicito; un ID stabile può ordinare la visualizzazione ma non attribuire superiorità. Le posizioni fino a 100 non equivalgono a un premio prestigioso in una categoria senza partecipazione: mostrare anche consistenza della classifica, distinguere posizione corrente e riconoscimento. Soglie di eleggibilità/antiabuso da misurare nel pilot, non presentare numeri inventati come validati.

Territori: distinguere residenza dichiarata del creator, origine dei votanti e luogo della foto. Proposta iniziale: classifica generale della comunità senza marchio “mondiale” ingannevole. Campionati geografici solo dopo dati volontari, definizione di eleggibilità e consenso; niente deduzioni da IP/GPS. Europa e UE hanno ambiti diversi. Nessuna somma di badge annidati per gonfiare i totali.

## Fasi, deliverable e prove

Due milestone operative: MC1 (catalogo/motore/interfacce, pronta da verificare) e MC2 (collaudo/consegna, pronta da verificare). Le righe F0–F10 sono fasi interne e backlog, non dieci milestone aperte. Stati prodotto: **pianificata → in corso → pronta da verificare → approvata**. Stati di prova: NOT_RUN / IN_PROGRESS / PASS / FAIL / BLOCKED / PARTIAL. PASS richiede esecuzione; approvata richiede parola esplicita di Fabrizio e revisione identificabile.

| Fase | Deliverable effettivo | Evidenza / limite | Stato corrente |
|---|---|---|---|
| F0 Ricerca e piano | MD completo, fonti/tag social con limiti, JSON/CSV, piano e memory bank | Conteggi generati, primo commit/push e9d78ab verificato; documenti aggiornati con decisioni successive | pronta da verificare |
| F1 Catalogo editoriale | 1427 nodi, tutti selezionabili; UUID persistenti e sinonimi | Validatore; migrazione locale idempotente e bootstrap fresco/rerun PASS; categorie pubblicate precedenti conservate | pronta da verificare |
| F2 Grafica funzionale | 23 icone preservate, quattro forme native di badge, categoria sotto | Unit/componenti; illustrazione generata scartata, non usata in app/selettore/copertina | pronta da verificare |
| F3 Motore creator | Slot per categoria esatta, origine, TILT fra autori, rating separato | Nove integrazioni dedicate PASS, incluse race/idempotenza/cooldown e nessun rollup | pronta da verificare |
| F4 Catalogo visibile e upload | Ricerca testuale, percorso, descrizione/tag liberi, una categoria scelta | Keyword/sinonimi/vicinanza lessicale locale; niente AI esterna o riclassificazione automatica | pronta da verificare |
| F5 Follow e feed | Segui persona e categoria esatta, feed Seguiti deduplicato | Follow/unfollow non cambiano preferenza; nessun discendente implicito; HTTP PASS | pronta da verificare |
| F6 Profili e reputazione | Totali veri, dettagli espandibili/filtrabili, origine per contenuto, ranking creator e badge correnti | Preferenze distinte dai follower; ex aequo; Trend dati in accumulo senza storico sufficiente | pronta da verificare |
| F7 Territori | Regole sugli assi/dati/ambiti definite; nessuna lega simulata | Pilot geografico NOT_RUN, richiede dati e specifica dedicata | pianificata per rollout successivo |
| F8 Consegna Android | APK autonomo, installazione e percorsi reali emulatore | 120 unit/componenti, 46+9 integrazioni, 11 percorsi Android PASS; nessun deploy | pronta da verificare |
| F9 Proposte categorie | Coda separata, analisi interna asincrona e approvazione editoriale umana | Workflow completo NOT_RUN; vecchio endpoint di pubblicazione disattivato | pianificata per rollout successivo |
| F10 Video | Estensione dello stesso modello creator/categoria unica | NOT_RUN; prima consegna solo immagini | pianificata per rollout successivo |

Le fasi F1–F8 sono autorizzate senza nuovo gate preventivo. Le approvazioni umane successive si registrano nel [ledger](VOTILT_APPROVAL_LEDGER.md). Se una prova fallisce si corregge e riesegue; nessun PASS per sola lettura del codice. Il completamento tecnico di una fase non conferisce approvazione a quella successiva o al prodotto finale.

### Grafica e generazione immagini — decisione finale

Il brand e le 23 icone originali restano. I badge funzionali sono disegnati nativamente: primo oro circolare, secondo argento con angoli arrotondati, terzo bronzo a rombo, quarto–centesimo pillola ciano con numero. Categoria sotto e dicitura “posizione attuale”; niente certificazioni o premi prestigiosi inventati. Senza preferenze positive, almeno due creator sostenuti e posizione 1–100 il badge non compare: è una regola minima di presentazione, non una soglia statistica validata.

È stata realmente generata un’illustrazione decorativa, poi esplicitamente scartata da Fabrizio. Non è usata nell’app, nella scelta categorie o come copertina catalogo; nessuna cancellazione richiesta/eseguita. Non produrre copertine ornamentali per riempire il catalogo. La selezione resta testo, ricerca, nomi naturali e percorso. Le immagini degli utenti rimangono protagoniste. Screenshot curati solo da app effettiva; eventuali nuove immagini future richiedono origine/diritti/manifesto, senza finti utenti o vincitori.

## Audit cross-fase e consegna

Un cuore deve produrre lo stesso autore preferito in Feed, dettaglio, Classifiche, profilo, campioni, confronto amici e TILT. Segui categoria deve funzionare dal percorso e alimentare Seguiti; rimozione/blocco non deve lasciare conteggi o duelli incoerenti. Upload su categoria profonda o intermedia deve riapparire con lo stesso percorso dopo approvazione e voto. Conservare barra inferiore, accessibilità, riduzione movimento, offline/retry e navigazione sicura durante TILT.

Prima di ogni commit di codice: typecheck, lint, format, unit/componenti, integrazioni pertinenti e regressione. Prima della consegna: APK autonomo compilato e installato, Android su formati/font pertinenti, nessun deploy o rilascio store. Pubblicare solo sorgenti/media curati; `.local/`, segreti, APK e acquisizioni grezze esclusi.

## Registro operativo

- Chiarimenti successivi incorporati: categoria unica anche madre; voto diretto senza rollup; tag/descrizioni liberi e suggerimenti lessicali nella prima implementazione; proposte nuove categorie in fase successiva con revisione umana. Queste regole prevalgono sulle formulazioni storiche “solo foglie/nessuna proposta” ancora riportate nei vecchi piani e sessioni immutabili.
- Revisione trasversale catalogo v0.2: 1.216 foglie, 211 rami, 1.427 nodi, profondità 5. Non importare la v0.1 da 1.530 foglie: conteneva scene/didascalie e suddivisioni artificiali. Registro UUID espliciti in `data/editorial-catalog.json`, candidato di rilascio in verifica.
- Commit documenti/revisioni precedenti `e9d78ab0923928e64648986e2ebf801e6eccac13` eseguito; il primo push è fallito per recupero credenziali. Push e9d78ab completato e hash remoto uguale verificato. Repository pubblico per scelta esplicita dell’utente, dopo verifica della visibilità GitHub. Autore confermato da Fabrizio: antetempo@gmail.com.

- Prima stesura v0.1: 1296 foglie; revisione news 1530; successiva riscrittura trasversale v0.2 a 1216 foglie naturali. Queste sono misure di versioni successive, non dichiarazioni di esaustività.
- Aggiornare questa sezione con prove e commit effettivi, senza riscrivere retroattivamente le evidenze pregresse.

- Applicazione demo PASS: backup dedicato, 1427 categorie nuove, 116 categorie precedenti conservate; 17 associazioni multiple normalizzate senza cancellare lo storico. Conservati tutti i 144 contenuti, 6 account e 201 slot, credenziali invariate. Nessun contenuto pubblicato riassegnato automaticamente al nuovo albero. Prova: [migrazione](evidence/creator-migration-results.json).
- Fresh install e rerun PASS su database dedicato nuovo: 1257 foglie incluse le 41 precedenti, 123 asset base, 192 preferenze e 6 account; password invariate al rerun. [Bootstrap creator](evidence/bootstrap-creator-results.json).
- Ricerca fallback: esatti/percorso/sinonimi prima, parole chiave e un errore di battitura dopo; nessun embedding o servizio AI esterno. Descrizioni/tag persistenti e scelta autore, mai classificazione automatica.

- Consegna tecnica verificata: 120 unit/componenti in 21 suite, 46+9 integrazioni, typecheck/lint/format PASS. Undici percorsi Android PASS sull’APK 69c1827ec1b1be1138e3c558731e96d2ed4c846680458ebef1b107dd0f85f45e, realmente installato; percorso categorie, voto stesso/diverso autore, TILT/cambio tab, follow, profilo/badge, upload galleria e schermo piccolo/font 130%. Corretto il blocco provocato da guardie TILT montate fuori focus; regressione sul blur e prova nativa. [Report Android](evidence/android-creator-catalog-results.json). App lasciata su Classifiche, formati/font ripristinati. Prodotto pronto da verificare, approvazione finale non registrata.

- Commit e push della consegna creator **9ef7508b95b0c8ea57ab80de3cedb8b63288f5ee** completati su main di antetempo/votilt, repository pubblico confermato, autore antetempo <antetempo@gmail.com>. Hash remoto identico verificato, [ricevuta](evidence/github-publication.json). Nessun deploy applicativo/store.
