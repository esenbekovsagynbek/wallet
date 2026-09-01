require('dotenv').config();

const fs = require('fs');
const path = require('path');
const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

const ISSUER_ID = process.env.GOOGLE_WALLET_ISSUER_ID;
const KEY_FILE_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const CLASS_SUFFIX = 'demo_loyalty_class';

const ISSUER_NAME = process.env.GOOGLE_WALLET_ISSUER_NAME;
const PROGRAM_NAME = process.env.GOOGLE_WALLET_PROGRAM_NAME || 'Demo Rewards';
const LOGO_URL = process.env.GOOGLE_WALLET_LOGO_URL;
const CORS_ORIGIN = process.env.CORS_ORIGIN;

app.use((req, res, next) => {
  if (CORS_ORIGIN) {
    res.setHeader('Access-Control-Allow-Origin', CORS_ORIGIN);
    res.setHeader('Vary', 'Origin');
  }
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/wallet/pass-jwt', (req, res) => {
  if (!ISSUER_ID) {
    return res.status(500).json({ error: 'GOOGLE_WALLET_ISSUER_ID is not set. See .env.example.' });
  }
  if (!KEY_FILE_PATH || !fs.existsSync(KEY_FILE_PATH)) {
    return res.status(500).json({ error: 'Service account key file not found. Set GOOGLE_APPLICATION_CREDENTIALS in .env.' });
  }
  if (!ISSUER_NAME) {
    return res.status(500).json({ error: 'GOOGLE_WALLET_ISSUER_NAME is not set. See .env.example.' });
  }
  if (!LOGO_URL) {
    return res.status(500).json({ error: 'GOOGLE_WALLET_LOGO_URL is not set. See .env.example.' });
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(fs.readFileSync(KEY_FILE_PATH, 'utf8'));
  } catch (err) {
    return res.status(500).json({ error: `Could not read service account key file: ${err.message}` });
  }

  const memberId = req.query.memberId || '000001';
  const name = req.query.name || 'Demo Member';
  const points = req.query.points || '0';

  const classId = `${ISSUER_ID}.${CLASS_SUFFIX}`;
  const objectId = `${ISSUER_ID}.demo_object_${memberId}`;

  const loyaltyClass = {
    id: classId,
    issuerName: ISSUER_NAME,
    programName: PROGRAM_NAME,
    programLogo: {
      sourceUri: { uri: LOGO_URL },
      contentDescription: {
        defaultValue: { language: 'en', value: 'Program logo' },
      },
    },
    hexBackgroundColor: '#4285f4',
  };

  const loyaltyObject = {
    id: objectId,
    classId,
    state: 'ACTIVE',
    accountId: memberId,
    accountName: name,
    loyaltyPoints: {
      label: 'Points',
      balance: { string: points },
    },
    barcode: {
      type: 'QR_CODE',
      value: objectId,
    },
  };

  const claims = {
    iss: serviceAccount.client_email,
    aud: 'google',
    typ: 'savetowallet',
    iat: Math.floor(Date.now() / 1000),
    origins: [`${req.protocol}://${req.get('host')}`],
    payload: {
      loyaltyClasses: [loyaltyClass],
      loyaltyObjects: [loyaltyObject],
    },
  };

  const token = jwt.sign(claims, serviceAccount.private_key, { algorithm: 'RS256' });
  const saveUrl = `https://pay.google.com/gp/v/save/${token}`;

  res.json({ saveUrl });
});

app.listen(PORT, () => {
  console.log(`Demo server running at http://localhost:${PORT}`);
});
