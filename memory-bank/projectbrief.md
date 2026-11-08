# VOTILT

Requisito successivo: ogni immagine ha categoria, nome e riferimento fondamentale obbligatorio specifico della foglia (es. attrice → nome, sito → nome e link). Modulo semplice/dinamico e validazione server. Riferimento: docs/CONTENT_METADATA.md.

Social-game mobile Android in italiano: scoperta visuale verticale, una preferenza attiva per utente e categoria foglia, duello TILT quando si sfida il proprio campione. Brand originale Dark Neon e tagline “Scrolla. Scegli. Vai in TILT.”

Il mandato completo dell'utente è conservato in [deep/requisiti-completi.md](deep/requisiti-completi.md) e nella copia originale docs/SPECIFICA_ORIGINALE.md. Il piano esecutivo con audit è docs/votilt-plan.md. Nessuna riduzione implicita dello scope Social completo.

Obiettivi: app Android installabile e provata su emulatore Windows, backend multiutente persistente locale, motore transazionale verificato, feed/41 foglie/123+ approvati originali, social/UGC/moderazione, AI Universe, test riproducibili ed evidenze. Nessuna pubblicazione store o promessa production-ready.

Vincolo successivo prioritario: Docker vietato. PostgreSQL 18 nativo già installato e Node API; nessun Supabase cloud o container. Non modificare DB/credenziali di altri progetti. Login email/password senza Google. Asset generati dall'agente con provenienza dichiarata; nessuna foto sintetica dichiarata REAL.

Autorizzato: sviluppo/test locale, inizializzazione e aggiornamento requisiti nel memory bank, studio agentico e piano per step. Fabrizio ha autorizzato l'8 novembre 2026 il commit iniziale e il push su `antetempo/votilt`, entrambi completati (`a0d85bf`, main). Le azioni successive di commit/push richiedono un nuovo ok; nessun deploy applicativo o pubblicazione store autorizzato. Leaven-chain non disponibile; lavoro sequenziale in chat madre con ledger persistente. Riferimento repository: [[repository-github]].

Requisiti prioritari di revisione (Fabrizio, 2026-11-06): conservare palette e contrasto; brandbook e tutte le icone originali; feed senza wordmark, CTA o didascalia generica, solo like/categoria e testo autore facoltativo in una riga espandibile. Centro solo simbolo per pubblicare, rimuovere il vecchio hub TILT. Classifiche dalle categorie più votate, ricerca categoria e ricerca dentro ogni categoria. Creazione categoria con controllo esteso parole/offuscamenti e duplicati, suggerendo quella esistente. Implementazione e prove nel piano docs/votilt-refinement-plan.md.

Requisito TILT successivo (Fabrizio, 2026-11-06): rimuovere spiegazioni ed etichette del confronto, lasciare la scritta TILT, introdurre grafica dinamica, effetti e animazione con profondità 3D. Toccare un’immagine sceglie; annullamento e controlli accessibili restano disponibili. Riferimento: docs/votilt-tilt-plan.md.
