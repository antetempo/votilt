---
title: Android e backend locali senza Docker
type: decision
status: active
date: 2026-11-06
author: Fabrizio
tags: [android, architecture, local-runtime, no-docker]
related_sessions: [1]
related_commits: []
---

# Decisione

App Android nativa Expo/React Native, API Node/Fastify e PostgreSQL 18 nativo in un cluster VOTILT dedicato sul PC Windows. Login email/password, senza Google. Nessun Docker o cloud obbligatorio.

Why: Fabrizio ha escluso esplicitamente Docker e confermato che gli strumenti necessari erano già sul PC. Una porta e un cluster dedicati evitano interferenze con PostgreSQL preesistente e altri progetti. La build standalone permette una prova senza Metro.

API loopback 4317; cluster VOTILT 55432, servizio esistente 5432 intatto. APK localhost tramite adb reverse, sviluppo tramite 10.0.2.2. Configurazioni private e credenziali restano in .local, escluse dal repository; qui si conserva soltanto il riferimento al file. Nessun reset password, commit, push, deploy o store autorizzato.

Leaven-chain non eseguibile per assenza dei suoi strumenti di sottosessione: applicato il fallback sequenziale richiesto nella chat madre; subagenti soltanto revisori dello studio/audit. Piani persistenti in docs e gate con prove reali.

Riferimenti: [[deploy-checklist]], [[voto-server-autorevole]], [[01-votilt-android-brand-tilt]], [avvio](../../README.md).
