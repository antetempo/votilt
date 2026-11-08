# Controllo delle categorie

## Stato corrente · 8 novembre 2026

Catalogo editoriale di 1427 nodi selezionabili, anche rami e radici: [gerarchia completa](research/catalogo-editoriale/GERARCHIA_COMPLETA.md). Ricerca testuale con percorso/sinonimi/parole chiave e tolleranza lessicale a un carattere. Descrizione/tag liberi suggeriscono categorie esistenti; l’autore sceglie una sola destinazione. Niente categorie automatiche dai tag o voti propagati agli antenati.

Proposte utenti riaperte da Fabrizio come **rollout successivo**: coda separata, analisi interna asincrona di duplicati/sinonimi/collocazione/appropriatezza e approvazione editoriale umana. AI eventualmente assistiva, mai autoapprovazione. La prima consegna disattiva la pubblicazione tramite i vecchi endpoint (`EDITORIAL_CATALOG_ONLY`) e non mostra il vecchio form come disponibile.

Moderazione e classificazione restano separate: nomi editoriali naturali anche per cronaca, salute, famiglia, mare e danza; fonti, consenso e sicurezza sono regole di pubblicazione. Preferire un creator non certifica verità o competenza.

## Prototipo storico conservato per il rollout successivo

Le sezioni seguenti descrivono la precedente interfaccia, non una funzione attiva in questa build.

La selezione suggerisce le categorie pubblicate, anche con plurali, ordine delle parole e piccoli errori di battitura. La proposta verifica nome, descrizione ed esempi. Un duplicato pubblicato offre “Usa …” e riporta al caricamento conservando la bozza. Le proposte di altri utenti ancora in revisione non rivelano nome o identificativo; compare soltanto un avviso generico.

Il controllo condiviso client/server normalizza maiuscole, accenti, Unicode, caratteri invisibili, alcuni omografi greci/cirillici, sostituzioni numeriche, punteggiatura, lettere spaziate e ripetute. Il lessico italiano/inglese comprende volgarità e insulti, odio contestuale, minacce, sessualizzazione dei minori, spam/link e markup. Parole identitarie isolate non vengono vietate; parole ambigue legittime come SEGA e termini come Cocktail, Assisi e Classifiche sono coperti da regressioni contro falsi positivi.

Il server ricontrolla creazione e approvazione sotto il medesimo lock della scrittura, impedendo che due richieste concorrenti creino la stessa proposta. Il client mostra il motivo e disabilita l'invio; il server resta autorevole. Ogni nuova categoria richiede approvazione umana prima della pubblicazione.

È un filtro deterministico con lessico curato, non una comprensione semantica universale: nuove lingue, contesti e offuscamenti possono richiedere aggiornamenti. La revisione umana resta necessaria. Prove: 74 casi unitari dedicati, integrazione HTTP per duplicati/concorrenza/privacy e percorso Android con testo mascherato; vedere TEST_REPORT.md.
