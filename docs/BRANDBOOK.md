# VOTILT · Brandbook 1.0

Autore: antetempo. Direzione aggiornata con Fabrizio il 2026-11-06. Versione visuale: [brandbook.html](brandbook.html). Font, simboli e palette sono inclusi nel progetto.

## Idea

Un'immagine ti ferma. Un like esprime il tuo gusto. VOTILT dà spazio alle immagini e alle persone che le pubblicano. Il linguaggio è diretto: Mi piace, Categoria, Pubblica, Cerca. Niente metafore del trono nei comandi primari, frasi riempitive o spiegazioni tecniche nel feed.

## Identità e simboli

Marchio VOTILT bianco/viola, geometria inclinata e taglio a V. Il wordmark vive su welcome, documenti e spazi di identità; **non compare sopra le immagini nel feed**. Il segno di pubblicazione è una cornice inclinata con una tessera che si solleva: al centro della barra appare solo il simbolo, senza testo.

23 pittogrammi originali disegnati per il progetto, con master SVG in assets/icons/ui e sorgente src/brand/icons.ts. Spessore 2 su griglia 32, angoli tagliati, diagonale ascendente, proporzioni coerenti. Feed = cornici sovrapposte; ricerca = lente sfaccettata; classifica = barre asimmetriche; like = cuore angolare; profilo = ritratto sfaccettato. Nessun path copiato da librerie stock. I controlli del sistema Android restano del sistema operativo.

## Colori · conservati

| Uso | Colore |
|---|---|
| Fondo | #090711 |
| Superfici | #171326, #211A35 |
| Bordi | #34294C |
| Testo | #F8F6FF |
| Secondario | #A9A3BE |
| Accento | #A855F7 |
| Evidenza | #22D3EE |
| Like / nuova scelta | #FF4DA6 |
| Conferma | #4ADE80 |
| Errore | #FF647C |

Neon come accento controllato, non come bagliore dietro ogni comando. Sulle immagini: scrim leggero in alto e in basso, ombra breve sul testo; nessun pannello opaco grande se non necessario per errori/accessibilità. Colore accompagnato da stato accessibile e testo: mai unico indicatore.

## Tipografia

Space Grotesk per titoli/identità, Inter per testo e comandi, entrambi inclusi nell'app. Titoli schermo 22–24, titolo immagine 15–16, categorie/metadati 11–13, corpo 13–14. Le call to action usano dimensioni normali, target di tocco almeno 48 dp. I caratteri possono aumentare senza sovrapporre navigazione e immagine.

## Regole di interfaccia

- Feed: immagine a piena pagina. In alto solo Per te / Seguiti / Scopri. A lato icone piccole. In basso nome/riferimento, autore/provenienza, descrizione facoltativa in una riga espandibile e categoria. Il voto è un cuore, non un pulsante “scegli campione”. Nessun popup per il primo like.
- TILT: scena a schermo intero, sola scritta TILT, due carte fotografiche in prospettiva e X originale per annullare. Niente istruzioni, nomi o pulsanti testuali nella scena ordinaria. Toccare una carta sceglie quell'immagine; nomi e significato restano nelle etichette accessibili. Ingresso elastico, fluttuazione lenta, riflesso e orbita neon; la carta scelta avanza e l'altra si allontana. Conferma grafica soltanto dopo la ricevuta del server. Colori ciano/rosa distinguono le carte, senza implicare una vittoria anticipata. Movimento ridotto di sistema o nelle impostazioni elimina la coreografia mantenendo tutti i controlli.
- Classifiche (revisione di Fabrizio, 2026-11-08): prima le immagini realmente al primo posto nelle singole categorie, con copertine, nome della foglia e percorso nell’albero. Nessuna graduatoria numerata delle categorie. Ricerca fissa in alto per raggiungere direttamente una foglia, anche tramite parole degli antenati; risultati con breadcrumb. Tocco sulla carta o sul risultato → classifica della foglia. All'interno ricerca immagini/nome/riferimento, posizione globale mantenuta nei risultati; Like, Duelli e Trend restano distinti.
- Pubblicazione: seleziona immagine, categoria e riferimento fondamentale. Se la categoria manca, proponila senza perdere la bozza dell'immagine. Proposta controllata e rivista prima della pubblicazione.
- Descrizioni: solo testo inserito dall'autore, mai copy dimostrativo generico. Default una riga, “Altro” espande, “Meno” richiude. Nome e categoria restano leggibili.
- Navigazione: cinque posizioni, centro solo simbolo di pubblicazione. Il vecchio hub TILT è rimosso; i duelli rimangono nel flusso del like.
- Revisione navigazione, Fabrizio · 2026-11-08: barra inferiore unica e persistente anche su categoria, immagini, report, impostazioni e TILT. La categoria apre direttamente la classifica: nessun selettore Immagini/Classifica. Toccando una riga si entra nello stesso scorrimento del feed, dall'immagine scelta e nell'ordine della metrica corrente. Cuore, share e altre opzioni riusano i simboli originali; nessun pulsante testuale Mi piace/Condividi/Segnala contenuto nel dettaglio. Link ufficiale sul simbolo link; ritiro proprietario nelle opzioni con conferma. Uscire da TILT tramite barra annulla sul server, senza interrompere un invio.

## Contenuti e tono

Nome/riferimento richiesto dalla categoria: persona → nome; sito/tool → nome e link. Mai indovinare identità o provenienza. Immagini AI dichiarate; nessun esempio sintetico definito REAL. Testi offensivi e duplicati delle categorie vengono bloccati/suggeriti dal server, non solo dal client. La moderazione automatica è un primo controllo e non sostituisce la revisione delle proposte.

## Applicazione e verifica

Tokens: src/theme/tokens.ts. Icone: src/components/Icon.tsx. Layout: Feed, Rankings, Category, Upload. Ogni nuova schermata applica queste regole; niente introduzione di nuove icone stock o colori casuali. Documentare i cambi di direzione qui e verificare schermate Android reali, non mockup scambiati per app.
