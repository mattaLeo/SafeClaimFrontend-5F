const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const admin = require('firebase-admin');

const TOKENS_FILE = path.join(__dirname, 'tokens.json');

function readTokens() {
  try {
    return JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf8') || '[]');
  } catch (e) {
    return [];
  }
}

function writeTokens(tokens) {
  fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2));
}

// Initialize Firebase Admin if credentials are available
try {
  let serviceAccount = null;
  const saPath = path.join(__dirname, 'serviceAccountKey.json');
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp();
    console.log('Firebase Admin initialized using GOOGLE_APPLICATION_CREDENTIALS');
  } else if (fs.existsSync(saPath)) {
    serviceAccount = require(saPath);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    console.log('Firebase Admin initialized using serviceAccountKey.json');
  } else {
    console.warn('Firebase Admin not initialized. Place serviceAccountKey.json in /backend or set GOOGLE_APPLICATION_CREDENTIALS');
  }
} catch (e) {
  console.error('Error initializing firebase-admin', e);
}

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post('/api/register-token', (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'token required' });
  const tokens = readTokens();
  if (!tokens.includes(token)) {
    tokens.push(token);
    writeTokens(tokens);
  }
  return res.json({ ok: true });
});

// Send a notification to a single token or to all saved tokens
app.post('/api/send', async (req, res) => {
  const { token, title, body, data } = req.body;
  if (!admin.messaging) return res.status(500).json({ error: 'Firebase Admin not initialized' });

  try {
    if (token) {
      const message = { token, notification: { title, body }, data };
      const resp = await admin.messaging().send(message);
      return res.json({ ok: true, resp });
    }
    const tokens = readTokens();
    if (tokens.length === 0) return res.status(400).json({ error: 'no tokens registered' });
    const message = { tokens, notification: { title, body }, data };
    const resp = await admin.messaging().sendMulticast(message);
    return res.json({ ok: true, resp });
  } catch (e) {
    console.error('send error', e);
    return res.status(500).json({ error: e.message });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`SafeClaim backend running on ${port}`));
