# Controllo delle categorie

La selezione suggerisce le categorie pubblicate, anche con plurali, ordine delle parole e piccoli errori di battitura. La proposta verifica nome, descrizione ed esempi. Un duplicato pubblicato offre “Usa …” e riporta al caricamento conservando la bozza. Le proposte di altri utenti ancora in revisione non rivelano nome o identificativo; compare soltanto un avviso generico.

Il controllo condiviso client/server normalizza maiuscole, accenti, Unicode, caratteri invisibili, alcuni omografi greci/cirillici, sostituzioni numeriche, punteggiatura, lettere spaziate e ripetute. Il lessico italiano/inglese comprende volgarità e insulti, odio contestuale, minacce, sessualizzazione dei minori, spam/link e markup. Parole identitarie isolate non vengono vietate; parole ambigue legittime come SEGA e termini come Cocktail, Assisi e Classifiche sono coperti da regressioni contro falsi positivi.

Il server ricontrolla creazione e approvazione sotto il medesimo lock della scrittura, impedendo che due richieste concorrenti creino la stessa proposta. Il client mostra il motivo e disabilita l'invio; il server resta autorevole. Ogni nuova categoria richiede approvazione umana prima della pubblicazione.

È un filtro deterministico con lessico curato, non una comprensione semantica universale: nuove lingue, contesti e offuscamenti possono richiedere aggiornamenti. La revisione umana resta necessaria. Prove: 74 casi unitari dedicati, integrazione HTTP per duplicati/concorrenza/privacy e percorso Android con testo mascherato; vedere TEST_REPORT.md.
