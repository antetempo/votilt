# Identità del contenuto e metadati per categoria

Requisito utente del 2026-11-06, successivo alla specifica originale: ogni immagine votabile deve avere categoria e nome; ogni categoria impone un riferimento fondamentale. Esempi: attrice → nome dell'attrice; sito web → nome del sito e link.

Aggiornamento vincolante dell’8 novembre: **una sola categoria per contenuto**, anche intermedia o radice. Ogni categoria definisce reference_kind (name/person/website/place/tool), reference_label e requires_url. Il modulo mostra i campi necessari e normalizza i link. Antenati e breadcrumb non sono associazioni aggiuntive. Le vecchie associazioni secondarie sono conservate come storico rifiutato, senza cancellazione fisica.

Il DB conserva content_metadata con subject_name e reference_url per contenuto/categoria. Upload privi del riferimento sono respinti. Categoria e percorso sono visibili nelle superfici pertinenti. Nessuna identità/provenienza è inferita dall’immagine: il creator preferito è `author_id`, non la persona nominata o raffigurata.

Descrizione libera fino a 400 caratteri, 20 tag di 40 caratteri. Tag normalizzati, deduplicati e validati in UI/HTTP/SQL Unicode; non creano categorie. Nomi, sinonimi, parole chiave e vicinanza lessicale suggeriscono destinazioni esistenti, scelte dall’autore. Nessuna API AI esterna o riclassificazione automatica. `creatorSupport` conta preferenze all’autore nella categoria; `originSupport` quante sono originate dal contenuto, senza sommarle una seconda volta.

Link: HTTP/HTTPS soltanto, senza credenziali incorporate. Nessun fetch server automatico, scraping o apertura implicita. Il link viene aperto soltanto su azione dell'utente. Non è una prova di proprietà o consenso: questi restano nel flusso separato.

I personaggi e luoghi sintetici sono immaginari, le immagini AI dichiarate. Le tool card usano nomi/link ufficiali verificati e grafica originale. Proposte nuove categorie: rollout successivo, coda separata, analisi interna e approvazione umana editoriale. Attualmente si sceglie il catalogo esistente.
