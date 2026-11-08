---
title: Tech Context
type: core
status: active
date: 2026-11-06
---

# Stack e ambiente

Windows, checkout principale C:\APP\AI\VOTILT, branch main appena inizializzato senza commit. Node 24.14.0 e npm 11.9.0 verificati. PostgreSQL 18 in C:\Program Files\PostgreSQL\18; servizio esistente su 5432 non va toccato. Cluster VOTILT in .local/ su porta dedicata 55432.

Installati e verificati Expo 58.0.23, React 19.3.0, React Native 0.88.1, TS 6.0.3. Router, TanStack Query, Zod, RN/Expo UI, Reanimated per prospettiva e movimento del TILT; nessuna nuova dipendenza 3D. API Node/Fastify, pg, password scrypt, token opachi revocabili memorizzati hash server e SecureStore Android. Recupero password email non configurato e dichiarato.

Android SDK e AVD Medium_Phone_API_36.1 presenti, adb emulator-5554. JDK 21 Android Studio, CMake 3.31.6/Ninja 1.12.1. Build standalone arm64-v8a/x86_64 in output/VOTILT-local-demo.apk (firma debug locale). APK usa localhost:4317 tramite adb reverse; sviluppo usa 10.0.2.2:4317. PostgreSQL VOTILT dedicato 55432. Test separati votilt_test e votilt_bootstrap_test; servizio PC 5432 intatto. Docker escluso.

## Approfondimenti
<!-- memorybank:index:deep -->
| Doc | Tags | File |
|---|---|---|
| Checklist DB e avvio locale | database, migrations, local-runtime | [[deploy-checklist]] |
| Metadato fondamentale del contenuto | requirements, metadata, upload | [[metadati-contenuti]] |
| Requisiti finali di prodotto, brand e TILT | requirements, brand, feed, categories, tilt, moderation | [[prodotto-brand-e-tilt]] |
| Requisiti completi originali VOTILT | requirements, master-spec, android | [[requisiti-completi]] |
| Consegna locale, verifiche e debito residuo | handoff, testing, local-runtime, debt, release | [[stato-consegna-e-debito]] |
<!-- /memorybank:index -->
