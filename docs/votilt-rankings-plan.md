# VOTILT — immagini in testa e ricerca delle foglie

Richiesta di Fabrizio, 8 novembre 2026: Classifiche deve mostrare immagini al primo posto in alcune categorie, senza classifica numerata delle categorie. Ricerca libera diretta delle sottocategorie finali, riconoscibili nel percorso radice → foglia. Modifica locale, nessun commit/push/deploy autorizzato.

## Audit r1 — flusso reale

`app/(tabs)/rankings.tsx` usa `category_rankings`, ordina e numera le categorie; il tocco apre `/category/[id]?view=ranking`. La pagina foglia usa `CategoryRanking` e l'azione SQL `ranking` con supporti, matches e UUID come spareggio. Riutilizzare quel risultato canonico per la copertina, senza implementare un secondo motore. Il voto invalida già `category-rankings`.

## Audit r2 — contratto e privacy

Estendere `category_rankings` con percorso pubblicato e `leader` nullable. Primo posto solo con supporto positivo, derivato dall'azione `ranking` per la medesima identità: moderazione, membership, blocchi e privacy restano server-side. Home massimo 12 categorie attive; ricerca fino a 100 foglie corrispondenti anche al percorso, incluse quelle senza voti. Una categoria senza supporti non inventa un vincitore. Contratto Zod, migrazione idempotente, schema e checklist insieme.

## Gate completato · PASS

1. Backend/contratto: percorso e leader canonico; test di primo posto, spareggi, foglia vuota, ricerca per antenato e assenza di leak.
2. UI: immagini in griglia e ricerca fissa in alto; risultati foglia con breadcrumb, senza numeri delle categorie. Tocco → classifica esistente.
3. Verifiche: regressione host PASS (99 unit/componenti in 12 suite, 46 integrazioni; typecheck/lint/format), build/installazione APK PASS. Cinque percorsi Android PASS, inclusi ricerca foglia e 320 dp/font 130%. Evidenze in `docs/evidence/verify-results.json`, `integration-results.json`, `android-rankings-results.json`. Screenshot home curato in `docs/media/rankings.png`.

## Audit cross-fase · PASS

Confrontate 12 anteprime con la classifica canonica; tocco → classifica foglia. Ricerca diretta con breadcrumb e caso senza risultati provati su APK; foglie senza voti nei test componenti/backend. Spareggi, membership pending e blocchi nelle integrazioni. Due colonne sul formato piccolo/font 130%, impostazioni originali ripristinate. Chiave cache estesa per evitare vecchi payload senza path/leader, mantenendo il prefisso già invalidato dal voto. Nessun nuovo motore di voto, dipendenza o codice nativo. Modifiche documentali precedenti conservate; nessun commit/push.
