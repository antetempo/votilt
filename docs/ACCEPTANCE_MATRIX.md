# Matrice di accettazione

Valutazione finale della demo locale, 2026-11-06. PASS riferito alle prove indicate; limiti di rilascio in RELEASE_READINESS.md.

| Criterio | Requisito | Stato | Evidenza |
|---|---|---|---|
| AC-A01 | VOTILT si installa nell'Android Emulator tramite build locale senza EAS. | PASS | android-release-results.json · installazione APK |
| AC-A02 | App contiene cinque tab funzionanti e navigazione senza rotte vuote/mock. | PASS | android-refinement-results.json · Feed/Esplora/Pubblica/Classifiche/Profilo |
| AC-A03 | Tema Dark Neon coerente, leggibile, con label corrette e nessun overflow su 2 formati emulator. | PASS | android-release-results.json · 320×569/font 130% e 411×914 dp; screenshot 26/27 |
| AC-A04 | Login/registrazione reali, session restore, logout ed error handling. | PASS | android-results.json · login/logout; integrazione AUTH e Logout reale |
| AC-A05 | Feed full-screen scorre verticalmente, media precaricati, swipe non vota. | PASS | android-scroll-results.json · 103 impressioni; FlatList e paging |
| AC-A06 | Almeno 40 leaf navigabili, ricerca e breadcrumb corretti. | PASS | bootstrap-results.json · 41 foglie; ricerca metadati e breadcrumb Android |
| AC-B01 | Primo like assegna unica preferenza su leaf e mostra il cuore selezionato; vecchio hub rimosso su richiesta utente. | PASS | integrazione T01/T02 + android-refinement-results.json · like reale |
| AC-B02 | Secondo voto stesso leaf apre confronto tra incumbent e challenger senza cambiare subito voto. | PASS | integrazione T03 + android-tilt-results.json · scena 3D, screenshot 40/41 e MP4 |
| AC-B03 | Annulla duello senza cambi; incumbent vince senza trasferimento; challenger vince trasferendo voto. | PASS | integrazione T04/T05/T06 + android-tilt-results.json · tocco, X e indietro Android |
| AC-B04 | 20 tap ripetuti / retry idempotenti non creano doppie mutazioni o Elo. | PASS | integrazione T07/T19 · venti retry concorrenti, receipt unico |
| AC-B05 | In 2 sessioni concorrenti non emergono 2 campioni né duelli risolti su versioni vecchie. | PASS | integrazione T09/T10/T27 · sessioni/versioni concorrenti |
| AC-B06 | Classifica Popolari deriva dai supporti attivi e si aggiorna correttamente a ogni transfer/invalidazione. | PASS | integrazione Ranking supporti attivi + T16/T23 |
| AC-B07 | Elo per leaf aggiorna i due contendenti una volta, distinguendo da supporto popolare, con cooldown anti-farming. | PASS | integrazione T05/T07/T19/T20 e Ranking Elo distinto |
| AC-B08 | Eliminazione/moderazione contenuto invalida slot e duelli e non lascia foto rimosse in classifica. | PASS | integrazione T16/T28 e sospensione atomica |
| AC-B09 | L'utente che tenta di votare su leaf non pertinente o pending viene respinto dal server. | PASS | integrazione T11/T12/T13 e Kind incompatibile |
| AC-C01 | Profili reali e impostazioni privacy persistenti. | PASS | integrazione Profilo privato, Social consenso e Android settings |
| AC-C02 | Follow e richieste amicizia sono reali; blocco impedisce accesso coerentemente. | PASS | integrazione Social follow/amicizia + T17 blocco |
| AC-C03 | Friends Battle mostra differenze tra campioni soltanto con consenso di visibilità. | PASS | android-social-results.json + integrazione T22/Social |
| AC-C04 | Taste Match usa formula definita e mostra denominatore, con `dati insufficienti` appropriato. | PASS | android-social-results.json · 31 categorie comuni; unit tasteMatch |
| AC-C05 | Creator può caricare media, selezionare 1–3 leaf, dichiarare diritti, vedere pending e stato finale. | PASS | Android screenshot 08–13 + android-creator-results.json; test Upload/Metadati |
| AC-C06 | Un moderatore può approvare da mobile, un non-moderatore non può tramite API né link diretto. | PASS | android-creator-results.json + integrazione Auth moderatore falso |
| AC-C07 | Segnalazioni, hide e audit moderazione funzionano end-to-end. | PASS | integrazione T16 · report → coda → hide → audit/reviewed |
| AC-C08 | Notifiche in-app read/unread e deep-links non falliscono sui target rimossi. | PASS | android-social-results.json + integrazione Notifiche destinatario; CONTENT_UNAVAILABLE sui target rimossi |
| AC-C09 | Proposte categorie: testo controllato, duplicati suggeriti e bloccati anche in concorrenza, approvazione prima della pubblicazione. | PASS | integrazione proposta/policy/duplicati concorrenti + android-refinement-results.json |
| AC-C10 | L'utente può rimuovere contenuti e account secondo flusso realmente implementato, oppure la voce account deletion è chiaramente incompleta e impedisce dichiarare Social completo done. | PASS | integrazione T23 e conferma negativa; ritiro contenuto autorizzato server-side |
| AC-D01 | Sezione AI Universe distinta e accessibile da Esplora/Feed. | PASS | android-results.json · AI Universe, screenshot 07 |
| AC-D02 | AI Art e AI Tools sono contenuti tipizzati con categorie e TILT funzionanti. | PASS | integrazione Kind incompatibile/tool stesso motore; Android AI Art TILT |
| AC-D03 | Nessuna richiesta a API AI a pagamento necessaria per votare, navigare, fare ranking. | PASS | android-release-results.json · Internet pubblico disattivato; asset locali |
| AC-D04 | Real or AI? non espone risposta prima del voto e non usa classificazione probabilistica inventata. | PASS | integrazione T21 · truth privata, media neutro, primo tentativo immutabile |
| AC-D05 | Se il dataset quiz non possiede provenienza dimostrabile, la modalità è disabilitata con spiegazione chiara, e AC-D04 è testato con fixture sicure. | PASS | android-results.json · modalità pubblica disabilitata; fixture test-only isolate |
| AC-D06 | Daily TILT è stabile tra device/timezone e le classifiche non duplicano i voti. | PASS | integrazione Daily UTC stabile + T07/T19 idempotenza |
| AC-D07 | Trending usa serie storica vera, non random o lifetime count spacciato per trend. | PASS | integrazione Ranking trend da snapshot reale, storico insufficiente esplicito |
| AC-E01 | RLS/grants impediscono accesso privato altrui e modifiche dirette agli slot. | PASS | integrazione T15 + Pool identità; ruolo senza accesso credenziali |
| AC-E02 | Pending media non leggibile da guest/altri utenti tramite link indovinati. | PASS | integrazione T18 + Upload byte reali; membership pending privata |
| AC-E03 | Nessuna admin/service key nel bundle, repository o `EXPO_PUBLIC_*`. | PASS | bundle-audit.json · otto segreti locali assenti nel bundle Hermes |
| AC-E04 | Migrazioni DB e seed/media ricostruiscono l'ambiente da zero. | PASS | bootstrap-results.json + bootstrap-rerun-results.json · fresh/rerun, password invariate |
| AC-E05 | `npm run typecheck`, `lint`, test core, integrazione sono eseguiti, con report effettivo. | PASS | verify-results.json · typecheck/lint/format/unit/integration PASS |
| AC-E06 | Doc Windows permette setup, avvio, stop, reset e login demo. | PASS | README.md · comandi Windows eseguiti; reset distruttivo bloccato esplicitamente |
| AC-E07 | Stato progress/known issues/decisioni aggiornato e finale trasparente. | PASS | PROGRESS.md, KNOWN_ISSUES.md, DECISIONS.md, RELEASE_READINESS.md |
| AC-E08 | Uso del client senza Internet pubblico dopo setup, con backend locale, verificato (non significa con backend spento). | PASS | android-release-results.json · route Internet irraggiungibile, backend localhost via USB |
