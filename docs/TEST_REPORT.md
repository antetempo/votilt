# Test report · VOTILT

Data finale: 2026-11-06T19:41:07.271Z. Windows, Node 24.14.0, PostgreSQL 18.3 nativo dedicato, Expo 58.0.23, React Native 0.88.1. AVD Medium_Phone_API_36.1, emulator-5554. Nessun Docker, nessun deploy.

| Prova eseguita | Comando/procedura | Esito e prova |
|---|---|---|
| Verifica sorgenti | npm run verify:all | Typecheck/lint/format PASS; evidence/verify-results.json |
| Unit/componenti | Jest/Testing Library, 11 suite | 96 PASS / 0 FAIL |
| Integrazione HTTP + PostgreSQL reale | npm run test:integration | 46 PASS / 0 FAIL; evidence/integration-results.json |
| Core Android prima demo (storico) | Archivio android-core-e2e-v1.mjs.txt | 7 PASS; evidence/android-results.json |
| Revisione feed/like/classifiche/upload/categorie | node scripts/android-e2e.mjs | 6 PASS; evidence/android-refinement-results.json |
| TILT dinamico / annullamento / movimento ridotto | android-tilt-e2e.mjs + android-tilt-accessibility-e2e.mjs | 7 PASS; scena nativa in movimento, MP4, 320 dp/font 130%, preferenze ripristinate |
| Upload → mod → secondo votante | Picker nativo + android-creator-e2e.mjs | 2 PASS e screenshot 08–16; nessun endpoint privilegiato sostitutivo della UI |
| Friends Battle/Taste Match/notifiche | node scripts/android-social-e2e.mjs | 3 PASS; evidence/android-social-results.json |
| Cold start con API spenta | node scripts/android-offline-e2e.mjs | Cache/immagini recenti e voto disabilitato PASS; screenshot 22 |
| APK, due schermi e Internet pubblico spento | node scripts/android-release-e2e.mjs | 4 PASS; 320×569 dp font 130%, 411×914 dp; screenshot 24–27 |
| Scroll prolungato | android-scroll-e2e.mjs, poi --continue | 103 impressioni significative nella stessa sessione, nessun crash; evidence/android-scroll-results.json |
| Installazione DB da zero + seed doppio | node scripts/verify-bootstrap.mjs | Fresh PASS e rerun PASS; 41 foglie/123 approvati/192 campioni/6 utenti; password invariate |
| Asset | node scripts/audit-assets.mjs | 123 SHA diversi, 111 AI + 12 originali, 800×1200, EXIF assenti |
| Segreti nel bundle | node scripts/audit-bundle.mjs | 8 valori locali assenti; evidence/bundle-audit.json |
| Compatibilità Expo | npx expo-doctor | 20/20 PASS |
| FPS, memoria, throughput | Nessuna misura strumentale | NOT_MEASURED, nessuna promessa 60 FPS |

31 controlli Android registrati PASS nei nove report JSON (18 iniziali + 6 revisione + 7 TILT). Matrice: 40/40 criteri della demo valutati PASS con le evidenze indicate; il quiz disabilitato è previsto dal contratto in assenza di fonti REAL. Non significa prontezza store.

## Invarianti e regressioni

T01–T24/T26–T28 coperti nelle integrazioni (alcuni gruppi condividono una prova); T25 coperto da cache Android/voti bloccati e retry incerto senza falso successo. Le prove concorrenti usano sessioni reali, DB separato e lock/barriere: doppio primo voto, venti resolve duplicati, receipt reuse, stale/superseded, hide/resolve e sospensione mentre un voto o una modifica è già in attesa. Le letture del pool non conservano identità.

Upload: byte falsi respinti, EXIF rimosso, metadati obbligatori, quattro retry simultanei stesso ID, riuso con payload diverso respinto. Fault injection dopo commit restituisce 500 intenzionale, poi retry/download verificano che il JPEG resti disponibile. Un controllo indipendente con advisory lock attende anche il commit ancora aperto. La riga “API error: Error” durante questa prova è attesa, non un fallimento ignorato. Login: il tentativo 31 è limitato; logout revoca soltanto il token corrente. La quota globale viene alzata solo nell'istanza di integrazione per esercitare concorrenza; le quote di login/signup restano attive.

## Problemi rilevati e corretti

Ninja precedente falliva sui percorsi Windows lunghi → CMake 3.31.6/Ninja 1.12.1. Metro osservava directory DB/build → esclusioni valide Windows/POSIX. Upload Android richiedeva File + expo/fetch. Corrette conferma cancellazione, ripresa operazioni pendenti, metadati membership private, filtri profili privati, cambio account/cache, kind compatibili, auth con profilo privato e metadati completi in moderazione.

Nel collaudo finale: creazione esplicita file cache e chiave feed ripristinata; layout compatto per schermo piccolo; controllo utente ripetuto dopo lock; cleanup upload protetto contro commit incerto; logout spostato in funzione autorizzata senza concedere SELECT su sessioni private. Ogni problema sensibile ha una regressione eseguibile. I primi tentativi di scroll registrarono 58/66/95 impressioni utili: è stato esteso il percorso fino a 103 verificate, senza trasformare i soli gesti in contenuti effettivamente visti.

## Artefatto e limiti

APK: output/VOTILT-local-demo.apk, 63677721 byte, SHA256 cc26f2c07d2eb6370efc158379487e912751a24116e77ffe405a75bda47b3f79. Firma debug locale, arm64-v8a e x86_64. Backend locale obbligatorio per mutazioni. Non testato su telefono fisico né con sessione TalkBack completa. Advisory dipendenze low/moderate documentati; nessuna high/critical nell'audit eseguito. Password reset email/push non configurati. Quiz pubblico senza dataset REAL, correttamente disabilitato.
