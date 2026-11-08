# VOTILT — creator, catalogo editoriale e classificazione visibile

Data: 8 novembre 2026. Owner: Fabrizio. Stato generale: **IN_PROGRESS**.

## Mandato e precedenza

La richiesta più recente autorizza a procedere automaticamente: piano persistente, memory bank, commit e push dei lavori pertinenti su `antetempo/votilt`, poi implementazione, verifiche e installazione Android. Il precedente checkpoint preventivo sul piano è revocato. Nessun deploy. Le fasi diventano **pronte da verificare** dopo prove effettive; soltanto Fabrizio può dichiararle **approvate**, ma questa distinzione non blocca il lavoro ora autorizzato.

Si conserva l’app Android Expo nativa, il brand Dark Neon, le immagini protagoniste, il TILT e la barra inferiore persistente. PostgreSQL 18 e Node locali, Docker escluso, risorse dedicate in `.local/`. Nessuna modifica alle credenziali o agli altri progetti.

## Decisioni di prodotto

1. **Un creator preferito per utente e categoria finale.** Il cuore su un’immagine sceglie il suo autore in quella foglia. Altre immagini dello stesso autore non generano ulteriori preferenze o TILT contro sé stesso. L’immagine d’origine resta tracciata. Preferenza attiva trasferibile, non endorsement irrevocabile.
2. **Seguire è distinto dal preferire.** Follow libero di una persona e follow di una categoria, con effetti reali sul feed Seguiti. Unfollow non ritira la preferenza; votare non attiva automaticamente un follow.
3. **Catalogo editoriale ampio e profondo.** Gli utenti scelgono categorie esistenti; non creano né propongono categorie. La manutenzione è editoriale interna. La ricerca raggiunge direttamente le foglie usando percorso e sinonimi.
4. **La classificazione è parte visibile del prodotto.** Categoria e percorso devono essere riconoscibili in feed/dettaglio, ricerca, upload, profilo e classifiche dove pertinente. Questa è una scelta di VOTILT; non un’affermazione verificata sul funzionamento di tutti gli altri social.
5. Prima immagini; video in una successiva estensione dello stesso modello. Nessuna finta capacità video nella consegna attuale.
6. Profili con totale delle preferenze effettivamente ricevute e dettaglio per categoria. Distinguere preferenze attive da persone uniche: lo stesso sostenitore in due foglie vale due preferenze.
7. Riconoscimenti visivi: primo, secondo, terzo e posizione numerata dal quarto al centesimo, con categoria sotto. Esprimono preferenza della comunità, non certificazione professionale, bellezza oggettiva o verità scientifica.
8. Dimensioni regionali, nazionali, europee e mondiali previste nel progetto. Nessuna classifica territoriale attiva senza dati adeguati. Nessun GPS o geolocalizzazione implicita autorizzati.

L’approvazione del concetto creator, comunicata dopo il primo studio esplorativo, prevale sulla precedente indicazione di studiarlo soltanto. L’approvazione del concetto non equivale ad approvazione di ogni dettaglio implementativo.

## Stato di partenza verificato

- `a0d85bf7240beb73f18406b99ed494a167984816`: import iniziale già pubblicato nel repository privato. README visuale e revisioni Classifiche/navigazione sono successive, da includere nel commit autorizzato corrente.
- Motore attuale: slot `(user_id, category_id)` con `champion_content_id`, Elo e storico per immagine. **Non è ancora il motore creator.**
- Catalogo runtime precedente: 41 foglie; 123 immagini demo distinte, 111 AI dichiarate e 12 tool card. La nuova bozza contiene **36 radici, 211 rami incluse le radici, 1.216 foglie, 1.427 nodi, profondità massima 5**, misurati da `research/catalogo-editoriale/genera.mjs`.
- Ultime prove pregresse: 106 unit/componenti, 46 integrazioni HTTP/PG, 8 percorsi Android della navigazione; cinque percorsi Classifiche su build precedente. Non trasferire automaticamente questi PASS al nuovo modello.
- Grafica esistente: brandbook MD/HTML/PDF, 23 icone originali, copertina SVG README, screenshot reali e video TILT. **Nessuna nuova immagine generata per questo piano** alla sua prima stesura.

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
| Catalogo e validazione | `server/schema-core.sql`, `server/api.sql`, `scripts/seed.ts` | Togliere l’equivalenza foglia=depth4; rilevare terminalità e percorso, integrare ID/sinonimi editoriali senza perdere categorie storiche |
| Cuore e TILT | `api.vote`, `api.validate_candidate`, `src/lib/voting.ts`, `Feed.tsx`, `TiltArena.tsx` | Comparare autori, mantenere origine e slot/versione, nessun duello stesso creator |
| Conteggi e classifiche | `content_json`, `dispatch ranking/category_rankings`, `CategoryRanking.tsx`, `Rankings.tsx` | Una voce per creator/foglia, immagine rappresentativa; conteggi etichettati come preferenze al creator |
| Profilo e preferiti | `dispatch profile/champions/taste_match`, route profilo/persona | Totali ricevuti, ripartizione foglie, preferenze per autore anche se immagini d’origine diverse |
| Follow/feed | `public.follows`, `user_category_interests`, `feed_candidates`, `feed_items` | Follow persona e foglia distinti; onboarding non equivale a follow; deduplicare contenuti nel feed |
| Ricerca/upload | `explore.tsx`, `upload.tsx`, `uploadSelection.ts`, `category/[id].tsx` | Ricerca percorso/sinonimi, categoria centrale e visibile, selezione esistente, profondità variabile |
| Proposte utenti | `suggest.tsx`, `suggest_category`, `moderate_suggestion`, `category_check` | Disattivare la creazione utente anche lato server; conservare lo storico, niente cancellazione fisica |
| Contratti e cache | `src/lib/contracts.ts`, `src/types/domain.ts`, `src/lib/api.ts` | Nuovi campi/semantica, invalidazione coerente, nessuna compatibilità finta con vecchi risultati |
| Moderazione/privacy | `invalidate_content`, blocco, sospensione, ritiro, delete | Preferenza valida solo verso autore e contenuti eleggibili, nessun sostituto automatico di autore |

## Audit r2 — integrità e migrazione

- Migrare ogni slot immagine esistente verso il suo `author_id`, conservando `champion_content_id` come origine e cronologia. Non confondere autore con persona rappresentata o `subject_name`.
- Nessun reset di credenziali, nessuna rigenerazione distruttiva dei dati. Schema canonico, migrazione idempotente e checklist nello stesso commit. Prova su database test e rerun prima del runtime locale.
- Ricevute idempotenti e lock transazionale condiviso preservati; conflitto di payload con stesso operation ID respinto. Voto/resolve/cancel contro moderazione, blocco, sospensione e cancellazione testati in concorrenza.
- Origine non disponibile: cercare soltanto altro contenuto eleggibile dello stesso autore nella stessa foglia; se non esiste, invalidare lo slot, mai cambiare creator automaticamente. Il cambio dell’immagine rappresentativa non deve generare nuovo voto.
- Vecchio Elo per immagine conservato come storico; nuovo Elo creator distinto, non somma di rating. Confronto/cooldown per coppia di autori, non aggirabile cambiando foto. Vecchi duelli pendenti non devono risolversi come se fossero già confronti creator.
- Testare due immagini dello stesso creator, autori diversi, due utenti, doppio tap, retry con risposta persa, richieste simultanee, cancel, contenuto rimosso, categoria archiviata, cache cambio account e privacy.
- Profili: preferenze attive per foglia sommabili; fan unici separati; conteggi per immagine d’origine non sommati come nuovi voti. Escludere dati invisibili dal dettaglio pubblico secondo le policy.
- Catalogo: cicli/genitori mancanti/depth incoerente/ID duplicati respinti; il criterio di foglia non dipende da un numero massimo fisso. Ricerca coerente su mobile e API.

## Classifiche, riconoscimenti e territori

Popolari mostra preferenze attive al creator nella foglia; Duelli mostra il suo Elo realmente prodotto; Trend richiede storico creator compatibile, altrimenti “Dati in accumulo”. Niente riutilizzo ingannevole dello storico immagini.

Una sola voce per autore/foglia impedisce di occupare cento posizioni con cento foto. A parità di merito, ex aequo esplicito; un ID stabile può ordinare la visualizzazione ma non attribuire superiorità. Le posizioni fino a 100 non equivalgono a un premio prestigioso in una categoria senza partecipazione: mostrare anche consistenza della classifica, distinguere posizione corrente e riconoscimento. Soglie di eleggibilità/antiabuso da misurare nel pilot, non presentare numeri inventati come validati.

Territori: distinguere residenza dichiarata del creator, origine dei votanti e luogo della foto. Proposta iniziale: classifica generale della comunità senza marchio “mondiale” ingannevole. Campionati geografici solo dopo dati volontari, definizione di eleggibilità e consenso; niente deduzioni da IP/GPS. Europa e UE hanno ambiti diversi. Nessuna somma di badge annidati per gonfiare i totali.

## Fasi, deliverable e prove

Non più di due milestone aperte; una fase in corso alla volta salvo verifica indipendente. Stati prodotto: **pianificata → in corso → pronta da verificare → approvata**. Stati di prova: NOT_RUN / IN_PROGRESS / PASS / FAIL / BLOCKED / PARTIAL. PASS richiede esecuzione; approvata richiede parola esplicita di Fabrizio e revisione identificabile.

| Fase | Deliverable | Criterio di uscita tecnica | Stato iniziale |
|---|---|---|---|
| F0 Ricerca e piano | Gerarchia completa MD/JSON/CSV, fonti/limiti, questo piano, memory bank e commit/push autorizzati | Artefatti coerenti, conteggi eseguiti, riferimenti validi, remoto verificato | in corso |
| F1 Catalogo editoriale | Registro ID, alias, foglie profonde, descrizioni e integrazione idempotente | FPS/custom/mare/amici/famiglia trovabili; nessun ciclo/duplicato, dati storici preservati | pianificata |
| F2 Grafica e **generazione immagini** | Copertine originali per aree, sistema visivo categoria/percorso, quattro forme badge e manifesto | Asset realmente generati/ispezionati, AI dichiarata, hash/provenienza, leggibilità Android e font grande | pianificata |
| F3 Motore creator | Slot autore/foglia, origine, TILT tra autori, rating separato, migrazione | Invarianti e race HTTP/PG PASS, rerun sicuro, rollback documentato | pianificata |
| F4 Catalogo visibile e upload | Ricerca per percorso/sinonimi, tassonomia visibile, selezione solo esistenti, proposte disattivate | Backend e UI coerenti; ricerca profonda/nessun risultato/upload su Android | pianificata |
| F5 Follow e feed | Segui persona e foglia, feed Seguiti reale senza duplicati | Follow/unfollow distinti dal voto, privacy/blocchi e deduplicazione provati | pianificata |
| F6 Profili e reputazione | Totali reali, categorie, creator ranking, badge contestualizzati | Nessun doppio conteggio o premio finto, tie/zero/storico insufficiente provati | pianificata |
| F7 Territori | Specifica assi/dati/ambiti; UI attiva soltanto se supportata dai dati | Nessuna lega geografica inventata; eventuale pilot con dati dichiarati e test | pianificata |
| F8 Consegna Android | Regressione, build autonoma, installazione e prova emulatore, evidenze aggiornate | Build installata realmente, flussi integrati eseguiti, limiti espliciti | pianificata |

Le fasi F1–F8 sono autorizzate senza nuovo gate preventivo. Le approvazioni umane successive si registrano nel [ledger](VOTILT_APPROVAL_LEDGER.md). Se una prova fallisce si corregge e riesegue; nessun PASS per sola lettura del codice. Il completamento tecnico di una fase non conferisce approvazione a quella successiva o al prodotto finale.

### Brief grafico e immagini

Conservare palette, icone e composizione del brand. Copertine editoriali per le aree, non 1.216 immagini riempitive o finti vincitori. Scene con quotidianità, amici adulti, famiglia rispettosa della privacy, mare in contesto ordinario, danza, hobby e cultura; persone generate dichiarate AI e mai spacciate per utenti reali. Evitare testi illeggibili nelle immagini: categoria/percorso sono testo nativo accessibile. Badge oro/argento/bronzo e quarto–centesimo numerato, categoria sotto, senza imitare certificazioni ufficiali.

Per ogni asset: prompt, strumento/modello se disponibile, data, origine, diritti/consenso applicabili, hash, uso previsto e verifica visiva. Le copertine non assegnano voti. Mockup progettuali etichettati come tali, screenshot solo da app effettiva. F2 non è completata finché generazione e ispezione non sono realmente avvenute.

## Audit cross-fase e consegna

Un cuore deve produrre lo stesso autore preferito in Feed, dettaglio, Classifiche, profilo, campioni, confronto amici e TILT. Segui categoria deve funzionare dal percorso e alimentare Seguiti; rimozione/blocco non deve lasciare conteggi o duelli incoerenti. Upload su foglia profonda deve riapparire con lo stesso percorso dopo approvazione e voto. Conservare barra inferiore, accessibilità, riduzione movimento, offline/retry e navigazione sicura durante TILT.

Prima di ogni commit di codice: typecheck, lint, format, unit/componenti, integrazioni pertinenti e regressione. Prima della consegna: APK autonomo compilato e installato, Android su formati/font pertinenti, nessun deploy o rilascio store. Pubblicare solo sorgenti/media curati; `.local/`, segreti, APK e acquisizioni grezze esclusi.

## Registro operativo

- Prima stesura: file gerarchia completo generato e copia utente scritta; 1.216 foglie contate. Piano in corso. Modello creator/catalogo non ancora applicato al runtime a questo checkpoint.
- Aggiornare questa sezione con prove e commit effettivi, senza riscrivere retroattivamente le evidenze pregresse.
