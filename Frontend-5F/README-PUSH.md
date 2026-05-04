Setup notifiche push (frontend)

1. Assicurati di avere il `firebaseConfig` e la `VAPID_KEY`.
2. Apri `src/app/notifications.ts` e sostituisci i placeholder (`<API_KEY>`, `<PROJECT_ID>`, `<SENDER_ID>`, `<APP_ID>`, `<VAPID_KEY_PLACEHOLDER>`) con i valori corretti.
3. Costruisci e avvia il frontend:

```bash
cd Frontend-5F
npm install
npm start
```

4. Avvia il backend come descritto in `../backend/README.md`.

Note:
- Il file `public/firebase-messaging-sw.js` viene servito alla radice e gestisce le notifiche in background.
- L'inizializzazione automatica avviene in `src/main.ts`.
