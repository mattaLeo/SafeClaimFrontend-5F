Backend per notifiche Firebase (esempio)

Passi rapidi:

1. Posizionare la chiave del service account JSON scaricata da Firebase Console in `backend/serviceAccountKey.json` oppure impostare la variabile d'ambiente `GOOGLE_APPLICATION_CREDENTIALS` al percorso del file.
2. Installare dipendenze:

```bash
cd backend
npm install
node index.js
```

3. Endpoint utili:
- `POST /api/register-token` { token }
- `POST /api/send` { token?, title, body, data? }

Il server salva i token in `backend/tokens.json`.
