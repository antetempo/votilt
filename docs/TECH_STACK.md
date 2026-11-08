# Stack verificato

Windows; Node 24.14.0, npm 11.9.0; PostgreSQL 18.3 nativo. Expo 58.0.23, React 19.3.0, React Native 0.88.1, TypeScript 6.0.3, Expo Router 58.0.30. Versioni effettive bloccate da package-lock.json.

TanStack Query per remote state; Zod per confini; Expo Image/Picker/Manipulator/FileSystem/SecureStore/Haptics; font inclusi localmente. Fastify 5, pg, scrypt Node e sharp. Jest/Testing Library per logica e componenti; integrazione HTTP reale su PostgreSQL separato; Android via ADB con UI Automator e screenshot reali.

JDK 21 Android Studio, Android SDK 37 e AVD API 36.1; CMake 3.31.6/Ninja 1.12.1 installati per superare il limite path del vecchio Ninja su Windows. Build Gradle locale, nessun EAS obbligatorio. L'APK demo è firmato con chiave debug ed è distinto da una release store.

Motivazioni e scostamenti dalla specifica originale: DECISIONS.md. L'assenza di Docker è un vincolo esplicito dell'utente; autenticazione/storage/RPC sono implementati su strumenti nativi già presenti.
