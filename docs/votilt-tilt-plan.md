# TILT · scena dinamica

Richiesta Fabrizio, 2026-11-06: togliere le spiegazioni del confronto, lasciare la scritta TILT, introdurre effetti grafici, movimento e profondità 3D coerenti con il brand.

1. PASS — Scena a schermo intero: due immagini toccabili, carte in prospettiva, ingresso elastico, fluttuazione e scie neon, animazione della scelta confermata dal server. Solo TILT come testo ordinario; chiusura con icona originale. Rispetto movimento ridotto, errori e controlli accessibili. Verifica visiva su APK Android eseguita.
2. PASS — Test scelta/annullamento/errori/doppio tocco, regressione, build e collaudo Android reale. Aggiornare driver e brandbook; lasciare l'app pronta nell'emulatore. Nessun Docker o cambiamento alle regole del voto.

Audit r1: tracciati feed → vote_intent → route duello → resolve/cancel idempotenti → invalidazione cache. La scena cambia soltanto la presentazione e il gesto (toccare l'immagine sceglie). Il server resta autorevole. Non mostrare conferma prima della risposta positiva; l'errore conserva il confronto e permette retry. La X e il tasto indietro annullano senza cambiare preferenza.

Audit r2: il doppio tocco è serializzato anche prima del nuovo render; la scena viene conservata durante invalidazione e conferma, senza lampeggiare sullo stato scaduto. Le animazioni infinite vengono fermate allo smontaggio; impostazione app e preferenza del sistema riducono il movimento. Nessuna nuova dipendenza o modifica DB.

Collaudo: il dump Android standard richiede inattività e fallisce su movimento continuo. Aggiunto lettore SDK read-only con timeout idle zero, così i test osservano la vera scena animata. Il driver rifiuta un dump fallito invece di leggere XML vecchio. Gli artefatti Java compilati restano in .local e non entrano nell'APK.

Regressioni corrette: una risposta voto dopo smontaggio non naviga più sul vecchio router durante ricreazione Android (test dedicato). Il driver calcola gli swipe dalle dimensioni reali anziché usare coordinate di uno schermo grande. La fixture di ricerca metadati usa un nome unico: le vecchie fixture con nome uguale avevano saturato la prima pagina di ricerca dopo numerose esecuzioni; nessuna logica server modificata.

Audit cross-fase concluso: typecheck/lint/format PASS, 96 test unit/componenti (11 suite), 46 integrazioni HTTP/PG, 5 percorsi Android TILT e 2 controlli formato/movimento ridotto PASS. Confermato trasferimento reale e annullamento; movimento visibile nei fotogrammi, zero differenze nella zona carte con movimento ridotto. APK finale ricompilato e installato. Evidenze: android-tilt-results.json, android-tilt-accessibility-results.json, screenshot 40–43 e tilt-motion.mp4. Brandbook MD/HTML/PDF aggiornato. FPS non misurati.
