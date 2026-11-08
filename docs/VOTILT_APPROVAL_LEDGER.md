# VOTILT — verifiche tecniche e approvazioni di prodotto

Owner: Fabrizio. Aggiornato: 2026-11-08. Build Android: 69c1827ec1b1be1138e3c558731e96d2ed4c846680458ebef1b107dd0f85f45e.

Fabrizio ha autorizzato la prosecuzione autonoma fino a implementazione, collaudo, installazione, documentazione, memory bank e commit/push su antetempo/votilt. Repository pubblico per scelta esplicita. Nessun deploy autorizzato. **Pronta da verificare** significa prove tecniche riuscite; l’approvazione finale del prodotto resta di Fabrizio.

| Oggetto | Stato prodotto | Prova tecnica | Approvazione umana |
|---|---|---|---|
| Regole: creator per categoria esatta, una categoria anche madre, nessun rollup; follow distinti e tag liberi | approvata come direzione | Implementate e verificate nei flussi sotto | Decisioni esplicite dell’8 novembre; non equivalgono ad approvazione finale dell’interfaccia |
| F0 ricerca e piano | pronta da verificare | Gerarchia completa e fonti con limiti; 36 radici, 211 rami, 1216 foglie, 1427 nodi | Finale non registrata |
| F1 catalogo | pronta da verificare | UUID persistenti, migrazione locale e fresh/rerun PASS | Finale non registrata |
| F2 grafica funzionale | pronta da verificare | Quattro forme native, test e screenshot; illustrazione decorativa scartata ed esclusa | Finale non registrata |
| F3 motore creator | pronta da verificare | Nove integrazioni dedicate PASS; concorrenza, retry e cooldown per autore | Finale non registrata |
| F4 ricerca, categorie e upload | pronta da verificare | Una categoria, percorso, tag Unicode; upload nativo Android PASS | Finale non registrata |
| F5 follow e feed | pronta da verificare | Follow persona/categoria distinto dal voto, Seguiti deduplicato; Android PASS | Finale non registrata |
| F6 profili, classifiche e badge | pronta da verificare | Conteggi reali, origine, dettaglio filtrabile, ex aequo; Android PASS | Finale non registrata |
| F8 consegna Android | pronta da verificare | 120 unit/componenti, 55 integrazioni, 11 percorsi Android; build/installazione PASS | In attesa della prova di Fabrizio |
| F7 territori | pianificata per rollout successivo | NOT_RUN; nessuna lega geografica simulata | Da specificare con dati volontari |
| F9 proposte editoriali | pianificata per rollout successivo | Workflow NOT_RUN; vecchia creazione pubblica disattivata | Coda separata e approvazione umana richieste |
| F10 video | pianificata per rollout successivo | NOT_RUN; consegna attuale solo immagini | Non è parte della build corrente |

Due milestone: MC1 catalogo/motore/interfacce e MC2 collaudo/consegna, entrambe **pronte da verificare**. Nessuna fase è chiusa come approvata solo perché i test passano.

Evidenze: [regressione](evidence/verify-results.json), [creator](evidence/creator-integration-results.json), [migrazione](evidence/creator-migration-results.json), [bootstrap](evidence/bootstrap-creator-results.json), [Android](evidence/android-creator-catalog-results.json), [piano](votilt-creator-catalog-plan.md).

Il precedente “la provo io” indica disponibilità alla prova, non approvazione finale. Ogni approvazione futura deve identificare fase, data, build e riscontro esplicito; modifiche sostanziali riaprono la verifica interessata.
