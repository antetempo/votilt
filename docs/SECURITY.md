# Sicurezza della demo locale

API e PostgreSQL ascoltano solo sul loopback. Il backend detiene il ruolo DB; il bundle contiene esclusivamente l'indirizzo pubblico locale. `.local/`, token, password, chiavi e directory native sono ignorati da Git. Le credenziali demo non vengono stampate dai test.

Password scrypt con sale casuale e confronto costante; anche email inesistenti eseguono il lavoro di verifica. Token opachi casuali, hash SHA-256 nel DB, scadenza 30 giorni, revoca con logout/sospensione/cancellazione. Token Android in SecureStore. Rate limit su login, registrazione, upload e azioni sensibili. Nessuna autenticazione Google.

Il server impone controllo ruolo, proprietà, visibilità e blocco. Membership pending e relativi metadati sono visibili solo ad autore/moderatore; download media controllato senza URL pubblico permanente. Le cache sul dispositivo vengono cancellate quando cambia account. Una copia già mostrata offline non può essere revocata a distanza nell'istante stesso: al ritorno online il server rivaluta accesso e stato.

Upload JPEG/PNG/WebP fino a 8 MB, limite pixel, decodifica effettiva, ricodifica JPEG senza EXIF e nome generato. Link solo HTTP/HTTPS, senza credenziali incorporate; nessun fetch automatico. Dichiarazioni 18+, diritti e consenso sono attestate dall'utente, non una verifica certa dell'età o identità.

44 prove d'integrazione esercitano policy negative e corse concorrenti. Non sono una certificazione di sicurezza. Prima di un lancio pubblico servono HTTPS, gestione segreti, backup/restore verificato, monitoraggio, misure antiabuso, politiche di conservazione, gestione cancellazioni/backup e moderazione continuativa. Firma APK attuale debug per uso locale.

Audit dipendenze del 2026-11-06: nessuna vulnerabilità high/critical riportata; 22 advisory transitive low/moderate nel grafo `--omit=dev` (include tooling Expo). La correzione automatica proposta richiede downgrade incompatibili: non applicata. Rivalutare il grafo delle dipendenze per ogni release SDK, prima di distribuire fuori dal PC.
