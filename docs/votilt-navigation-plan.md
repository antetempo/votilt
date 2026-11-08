# VOTILT — classifiche dirette, scorrimento e navigazione persistente

Fabrizio · 8 novembre 2026. Mandato: eliminare i selettori Immagini/Classifica nella foglia, aprire direttamente la classifica, tocco immagine → scorrimento come il feed, barra inferiore disponibile nelle interfacce e soli controlli originali per like/condivisione/segnalazione. Solo locale, nessun commit/push/deploy.

## Audit r1 — codice reale

Categoria implementa due viste e due pulsanti; Classifiche passa view=ranking ma altri caller aprono immagini. Il dettaglio contenuto replica i controlli del feed con pulsanti testuali. Il navigator Tabs possiede la barra: le route categoria/contenuto/profilo/report sono invece sullo Stack esterno e la perdono.

## Audit r2 — soluzione condivisa e integrità

Barra originale spostata nel contenitore comune, tab native senza seconda barra. Route e deep link conservati. Categoria sempre classifica; dettaglio usa Feed con lista canonica della foglia/metrica e posizione iniziale dell'immagine scelta. Nessun esito o ordinamento calcolato fuori dal server. Azioni media condivise per feed e dettaglio; link, metadati, moderazione privata e ritiro proprietario preservati nei controlli appropriati. Navigazione durante TILT annulla tramite server e non interrompe un invio in corso.

## Gate unico · PASS

1. Implementazione e regressioni componenti: categoria senza toggles, contenuto con scroll iniziale corretto, azioni a simboli e navigazione nelle route annidate.
2. Regressione host completa; nessun SQL/schema modificato.
3. Build e installazione APK; Android: classifica diretta, primo elemento selezionato e swipe, barra su contenuto/report/profilo, share/report/like reali, TILT e formato piccolo pertinenti. Evidenze e audit cross-fase, poi PASS.

Eseguiti typecheck/lint/format, 106 test unit/componenti in 17 suite e 46 integrazioni PASS. APK aggiornato e installato. Otto percorsi Android PASS in `docs/evidence/android-navigation-results.json`: classifica senza selettori, secondo risultato come prima immagine dello scroll, swipe nell'ordine canonico, share nativo dal simbolo, report senza invio e ritorno Feed, impostazioni con barra, cuore → TILT → cambio tab con annullamento server e campione intatto, formato piccolo/font 130%. Font e formato ripristinati; app lasciata su Classifiche.

## Audit cross-fase · PASS

Tutti i caller categoria, compresi deep link senza view, arrivano direttamente alla classifica. `ContentViewer` conserva categoria/ID e metrica; `Feed` è lo stesso componente principale e non esegue un secondo fetch casuale quando riceve la lista ordinata. I contenuti non approvati usano solo il dettaglio autorizzato, senza finire nella classifica; like disabilitato, motivo revisione, metadati, link ufficiali e gestione del proprietario preservati. Barra unica fuori dal navigator Tabs, inclusi TILT e altre schermate Stack; nessun duplicato rilevato. Il cambio tab durante TILT rispetta un guardiano: attende l'annullamento e rifiuta navigazione durante un invio. Arena dimensionata sul contenitore reale, esclusa la barra. Nessuna modifica SQL o dipendenza nuova.
