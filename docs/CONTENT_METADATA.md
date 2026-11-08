# Identità del contenuto e metadati per categoria

Requisito utente del 2026-11-06, successivo alla specifica originale: ogni immagine votabile deve avere categoria e nome; ogni categoria impone un riferimento fondamentale. Esempi: attrice → nome dell'attrice; sito web → nome del sito e link.

Ogni foglia definisce reference_kind (name/person/website/place/tool), reference_label e requires_url. Il modulo mostra soltanto i campi necessari, riutilizza il nome già scritto e normalizza i link senza chiedere gergo tecnico. Una foto associata a più foglie conserva i riferimenti di ciascuna associazione.

Il DB conserva content_metadata con subject_name e reference_url per la coppia contenuto/foglia. Upload privi del riferimento richiesto sono respinti dal server; il client non può aggirare il requisito. Il riferimento appare su feed, dettaglio, duello e ricerca. Nessuna identità o provenienza viene inferita automaticamente dall'immagine.

Link: HTTP/HTTPS soltanto, senza credenziali incorporate. Nessun fetch server automatico, scraping o apertura implicita. Il link viene aperto soltanto su azione dell'utente. Non è una prova di proprietà o consenso: questi restano nel flusso separato.

I personaggi e luoghi sintetici del seed sono esplicitamente immaginari; i nomi sono dimostrativi. Per le tool card si usano nomi/link ufficiali verificati e grafica originale senza riprodurre loghi. Le nuove categorie proposte vengono approvate con il proprio tipo di riferimento.
