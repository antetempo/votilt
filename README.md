# VOTILT · antetempo

App Android nativa: scorri immagini, metti like e confronta le tue preferenze nella stessa categoria. Brand originale Dark Neon, login email/password, social e moderazione nella stessa app. **Solo demo locale; Docker escluso.**

## Provala sul PC

Il progetto è in `C:\APP\AI\VOTILT`. PostgreSQL VOTILT usa **55432**; il servizio preesistente su 5432 non viene modificato. Le immagini e i dati sono locali.

Preparazione iniziale, da PowerShell nella cartella progetto:

```powershell
npm ci
npm run db:init
npm run db:start
npm run db:migrate
npm run seed
```

Avvio backend:

```powershell
npm run api
```

Con emulatore o telefono Android collegato via USB e debug USB autorizzato, in un altro terminale:

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" reverse tcp:4317 tcp:4317
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" install -r .\output\VOTILT-local-demo.apk
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" shell am start -n com.antetempo.votilt/.MainActivity
```

L'APK autonomo usa `127.0.0.1:4317` tramite collegamento ADB al PC. Non richiede Metro, Internet pubblico, Google login o account cloud. Serve il backend attivo per votare. Riattivare `adb reverse` dopo un riavvio del dispositivo. Non esporre questa API HTTP su Internet.

## Esperienza e brand

Feed pulito: like compatto, categoria e descrizione autore facoltativa in una riga espandibile. Il simbolo centrale apre il caricamento; categoria esistente oppure proposta moderata con controllo testo e suggerimenti contro i duplicati. Classifiche: categorie più votate, ricerca della categoria e ricerca interna. Palette conservata e 23 icone originali. Il TILT diventa una scena con due carte in prospettiva 3D: tocca l’immagine che preferisci, X per annullare, conferma animata dopo il salvataggio. Movimento ridotto rispettato.

Brandbook: [PDF](docs/VOTILT-Brandbook.pdf), [versione visuale](docs/brandbook.html), [regole](docs/BRANDBOOK.md). Controlli categorie e limiti in [CATEGORY_MODERATION.md](docs/CATEGORY_MODERATION.md).

## Account demo

Le credenziali sono generate nel file privato **`.local/demo-credentials.json`**: Nova e Milo sono utenti interattivi già amici e consenzienti; Team VOTILT (`mod_votilt`) è moderatore. Ci sono anche Zora, Elio e Cleo. Aprire il file localmente per copiare email/password; non pubblicarlo. Il seed ripetuto conserva password e preferenze. La registrazione crea nuovi utenti normali, mai moderatori.

## Sviluppo Android

Prerequisiti verificati: Node 24, PostgreSQL 18 nativo, Android Studio/SDK, JDK 21 incluso in Android Studio, AVD `Medium_Phone_API_36.1`. Su Windows è necessario CMake 3.31.6 con Ninja 1.12.1 per i percorsi nativi lunghi; è installato nel PC attuale.

```powershell
npm run doctor
npm run dev -- --localhost --port 8081
# Altro terminale, emulatore avviato:
npm run android
```

Il client di sviluppo usa `10.0.2.2:4317`. La build standalone si produce con `node scripts/package-android.mjs` (arm64-v8a e x86_64, firma debug locale). L'output è `output/VOTILT-local-demo.apk`; hash e dimensione sono in `output/build-info.json`. `android/` è generato e ignorato da Git.

## Verifiche e manutenzione

```powershell
npm run verify:all
npm run test:e2e
node scripts/android-tilt-e2e.mjs
node scripts/android-tilt-accessibility-e2e.mjs
node scripts/android-creator-e2e.mjs
node scripts/android-social-e2e.mjs
node scripts/audit-assets.mjs
node scripts/snapshot.mjs
```

I test API usano esclusivamente `votilt_test`, separato dalla demo. I test Android interagiscono davvero con l'app e possono cambiare i campioni degli account fittizi. Il percorso aggiornato `npm run test:e2e` usa l’APK standalone; i driver storici richiedono la build di sviluppo. I formati e la rete si collaudano con `scripts/android-release-e2e.mjs`. Evidenze e screenshot: `docs/evidence/`, resoconto `docs/TEST_REPORT.md`.

`snapshot.mjs` conserva uno snapshot UTC al giorno senza riscriverlo. Eseguirlo nei giorni d'uso; nessuna automazione è stata installata. Trend mostra “Dati in accumulo” finché manca lo storico di sette giorni. Il seed non inventa retroattivamente quello storico.

Per fermare l'API avviata nel terminale: Ctrl+C. Per fermare solo il cluster dedicato: `npm run db:stop`. `npm run db:reset:local` è intenzionalmente bloccato: nessun reset distruttivo automatico. Le migrazioni sono ripetibili, il seed non azzera dati utente. Copiare `.local/` a backend/DB fermati se serve un backup locale; contiene anche segreti e media privati.

## Requisiti e limiti

Ogni immagine richiede **categoria e nome**, più il riferimento fondamentale della categoria: persona → nome; sito o tool → nome e link. Il server verifica ogni associazione (massimo tre). Vedere `docs/CONTENT_METADATA.md`.

Il catalogo base contiene 41 foglie, 123 candidati distinti, 111 immagini AI dichiarate e 12 copertine originali per tool reali con link ufficiale. Persone e luoghi sintetici sono esempi immaginari. Altri stati demo: pending, rejected, hidden e segnalazioni.

Real or AI? è disabilitato con spiegazione finché mancano fotografie REAL con provenienza verificata. Il motore è testato con fixture isolate. Recupero password email e notifiche push non sono attivi. Stato e limiti: `docs/RELEASE_READINESS.md`, `docs/KNOWN_ISSUES.md`. Nessun commit, push, deploy o pubblicazione store effettuato.
