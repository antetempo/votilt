---
title: Collaudo Android VOTILT con animazioni native attive
type: pattern
status: active
date: 2026-11-06
author: Fabrizio
tags: [android, testing, animation, accessibility, windows]
related_sessions: [1]
related_commits: []
---

# Procedura

Collaudare l'APK standalone realmente installato e il backend locale via adb reverse. Gli esiti HTTP/DB verificano il salvataggio; screenshot/video verificano il prodotto. Non sostituire il gesto mobile con un endpoint privilegiato quando si dichiara un percorso UI PASS.

Il dump CLI standard attende una UI inattiva: sul TILT in fluttuazione continua può fallire. Non leggere l'XML precedente come se fosse nuovo e non disabilitare le animazioni per far passare il test. Usare il lettore SDK dedicato scripts/android-live-hierarchy.mjs e scripts/android/HierarchyDump.java, con timeout idle zero; binari di test in .local/android-tools, esterni all'APK.

Il driver scripts/android-driver.mjs calcola gli swipe dalle dimensioni reali. I cambi di font/dimensioni possono ricreare l'attività Android: attendere il riavvio prima di inviare nuovi gesti. Il client non deve navigare da callback di schermate smontate.

Confrontare fotogrammi della zona carte, escludendo status bar e orologio: movimento attivo produce differenze; con preferenza riduci movimento le carte sono statiche. Verificare anche controlli accessibili, X/indietro e formato 320×569 dp/font 130%. Ripristinare dimensioni, font e preferenze alla fine dei test.

Le icone statiche expo-image usano cachePolicy none: gli ID delle risorse Android possono cambiare tra APK e una cache per ID può mostrare un'icona della build precedente. Verificare visivamente dopo reinstallazione.

Comandi/evidenze: scripts/android-tilt-e2e.mjs, scripts/android-tilt-accessibility-e2e.mjs, docs/evidence/android-tilt*.json e docs/evidence/android/tilt-motion.mp4. Queste prove non misurano FPS, memoria o TalkBack completo. Riferimenti: [[01-votilt-android-brand-tilt]], [[prodotto-brand-e-tilt]].
