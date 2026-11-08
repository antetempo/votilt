---
title: Repository pubblico VOTILT e pubblicazioni autorizzate
type: deep
status: active
date: 2026-11-08
author: Fabrizio
tags: [github, repository, push, public, authentication]
related_sessions: [03-creator-catalogo]
related_commits: [e9d78ab0923928e64648986e2ebf801e6eccac13]
---

Target verificato: https://github.com/antetempo/votilt.git, owner/login `antetempo`, autore locale `antetempo <antetempo@gmail.com>`, branch corrente main con upstream origin/main, unico worktree. L’indirizzo corretto Gmail è stato riconfermato esplicitamente dopo un refuso nel messaggio.

GitHub ha restituito `private=false`; Fabrizio ha scelto esplicitamente **«Lascialo pubblico e pusha»** l’8 novembre 2026. Questo supera la descrizione iniziale “privato” di [[repository-github]]. Non cambiare visibilità senza nuova istruzione. Pubblico non significa licenza open source concessa.

Commit e push `e9d78ab0923928e64648986e2ebf801e6eccac13` completati: revisioni precedenti Classifiche/navigazione, README, primo piano/catalogo e memory bank. Hash locale/remoto uguali verificati. Le successive modifiche creator/tag richiedono la loro prova e pubblicazione finale, ancora coperte dal mandato corrente; non estendere questa autorizzazione a sessioni future.

Il Git convenzionale non recuperava la credenziale con `credential.interactive=Never` globale. Recupero mirato da Git Credential Manager con override per comando e solo account antetempo, verifica API `/user` e permessi del repository; push tramite header HTTPS nel solo ambiente del processo figlio, senza token in argomenti, log, file o vault. Nessuna configurazione globale o password cambiata. Non usare l’account Leaven per questo target.

Nessun deploy applicativo/store o force push. Deploy-tracker non inizializzato: push sorgenti senza target di deploy. `.local/`, backup, credenziali, APK e acquisizioni grezze esclusi; media curati con manifesti. La pubblicazione finale è registrata nel piano/evidenze e nel contesto hot dopo la verifica remota.
