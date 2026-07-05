require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const admin = require('firebase-admin');
const personas = require('./personas');

const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();
app.use(cors());
app.use(express.json());

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Rate limiter: ek IP se 1 minute mein max 10 chat requests
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Bahut zyada requests bhej diye. 1 minute ruk ke try karo.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware: Firebase token verify karna
const verifyToken = async (req, res, next) => {
  // Admin bypass: agar sahi admin key mile, to login skip karo
  const adminKey = req.headers['x-admin-key'];
  if (adminKey && adminKey === process.env.ADMIN_SECRET_KEY) {
    req.user = { admin: true };
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Login zaroori hai. Token missing hai.' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return res.status(401).json({ error: 'Invalid ya expired token. Dobara login karo.' });
  }
};

// Route 1: available personas list bhejna (frontend ke liye)
app.get('/api/personas', (req, res) => {
  const list = Object.keys(personas).map((key) => ({
    id: key,
    name: personas[key].name,
    avatar: personas[key].avatar,
    tagline: personas[key].tagline,
    description: personas[key].description,
    tags: personas[key].tags,
  }));
  res.json(list);
});

// Route 2: Chat endpoint (login + rate limit required)
app.post('/api/chat', verifyToken, chatLimiter, async (req, res) => {
  try {
    const { persona, messages } = req.body;

    if (!persona || !personas[persona]) {
      return res.status(400).json({ error: 'Invalid persona' });
    }
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages must be an array' });
    }

    const fullMessages = [
      { role: 'system', content: personas[persona].systemPrompt },
      ...messages,
    ];

    const response = await axios.post(
      OPENROUTER_URL,
      {
        model: 'openai/gpt-oss-20b:free',
        messages: fullMessages,
        max_tokens: 400,
        temperature: 0.8,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'Persona Chat App',
        },
      }
    );

    const reply = response.data.choices[0].message.content;
    res.json({ reply });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'Something went wrong, check server logs' });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`✅ Server running on http://localhost:${process.env.PORT}`);
});