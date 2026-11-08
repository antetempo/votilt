# Asset originali VOTILT

Autore del progetto e delle illustrazioni: antetempo / VOTILT. Nessun contenuto copiato da foto di sconosciuti o hotlink. I personaggi sono fittizi e adulti. Il generatore AI è uno strumento di authoring usato in chat, non una dipendenza dell'app.

- Brand: simbolo V/fulmine originale in assets/icons/mark.svg, versioni raster da scripts/brand.mjs.
- 123 immagini approvate, tre per ciascuna delle 41 foglie. Il manifesto completo (provenienza, metodo, SHA256 e percorso) è assets/seed-media/manifest.json.
- 111 artwork AI originali: 15 nel mapping catalog.json e 96 generazioni dedicate nel ledger full-catalog-plan.json, tutte completate. Prompt in questi file e prompts.json; sorgenti PNG in assets/art/. Strumento integrato; nome preciso del modello non esposto e non inventato. Tutti etichettati ai_generated.
- 12 copertine originali tipografiche/vettoriali per Tools Arena, etichettate original_illustration. Nomi e URL reali verificati in assets/tool-catalog.json; nessuna copia di logo e nessun claim inventato su prezzi o prestazioni.
- Gli esempi pending/rejected/hidden utilizzano copie locali dedicate delle illustrazioni per testare moderazione e privacy, non nuovi asset approvati.
- Nessuna fonte REAL bilanciata/verificata per il quiz: catalogo pubblico disabilitato. Fixture quiz soltanto nel database isolato di collaudo.

Riproduzione: npm run seed:media, poi npm run seed. Gli originali AI sono conservati nel repository; il setup non richiede rigenerarli né chiamare servizi AI.

Audit eseguito: node scripts/audit-assets.mjs. 123/123 SHA256 diversi, dimensioni 800×1200, EXIF assenti. Prove: docs/evidence/asset-audit.json e contact sheet in docs/evidence/assets. Il catalogo base è distinto dai caricamenti reali aggiunti durante il collaudo Android.
