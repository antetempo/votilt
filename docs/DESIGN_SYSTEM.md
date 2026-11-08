# Design system · Dark Neon

VOTILT: “Scrolla. Scegli. Vai in TILT.” Simbolo originale V/fulmine e wordmark bianco/viola. Autore/handle: antetempo.

| Token | Valore |
|---|---|
| Fondo | #090711 |
| Superficie | #171326 / #211A35 |
| Testo | #F8F6FF |
| Accento | #A855F7 |
| Duello | Cyan / magenta, con etichette testuali |
| Display | Space Grotesk, font incluso |
| Corpo | Inter, font incluso |

Feed a pagina intera con scrim, gerarchia nome/categoria/autore/provenienza, azioni laterali e pulsante campione. TILT mette a confronto due candidati con etichette campione/sfidante: il colore da solo non comunica lo stato. Cinque tab, TILT centrale inclinato. Bottoni principali almeno 48 dp, label di accessibilità, busy/disabled espliciti, safe area, testi scalabili.

Il caricamento chiede prima la categoria, poi il solo riferimento necessario, evitando campi tecnici. L'URL viene normalizzato. Errori e retry mantengono il lavoro in corso; nessun successo simulato. Motion rispettato dalle transizioni dei media e dalle preferenze utente; ulteriori limiti e prove in TEST_REPORT.

Originali e prompt in assets/art; 123 JPEG di distribuzione con SHA256 nel manifest. Contact sheet di controllo in docs/evidence/assets. Nessun hotlink o risorsa grafica remota obbligatoria.
