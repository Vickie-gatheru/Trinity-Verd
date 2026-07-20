import express from 'express';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, h_api_key');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

const taifaApiKey = process.env.TAIFA_API_KEY;
const taifaSender = process.env.TAIFA_SMS_SENDER || 'TRINITY';

if (!taifaApiKey) {
  console.error('Missing TAIFA_API_KEY in environment. Add it to .env.local and restart this server.');
  process.exit(1);
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', provider: 'Taifa Mobile SMS proxy' });
});

app.post('/api/sms/send', async (req, res) => {
  const { phone, message, ...rest } = req.body;
  const mobile = phone || req.body.mobile;

  if (!mobile || !message) {
    return res.status(400).json({ error: 'The request body must include mobile or phone, and message.' });
  }

  const payload = {
    mobile,
    sender_name: taifaSender,
    message,
    response_type: 'json',
    service_id: 0,
    ...rest
  };

  try {
    const response = await fetch('https://api.taifamobile.co.ke/api/sms/sendsms.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'h_api_key': taifaApiKey
      },
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    let result;

    try {
      result = JSON.parse(text);
    } catch {
      result = text;
    }

    return res.status(response.status).json({ status: response.status, result });
  } catch (error) {
    console.error('Taifa Mobile proxy error:', error);
    return res.status(500).json({ error: 'Taifa Mobile request failed', details: String(error) });
  }
});

const port = Number(process.env.SMS_SERVER_PORT || 3001);
app.listen(port, () => {
  console.log(`SMS proxy server listening on http://localhost:${port}`);
});
