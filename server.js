const express = require('express');
const multer = require('multer');
const fetch = require('node-fetch');
const FormData = require('form-data');
const path = require('path');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const PORT = 3000;

const API_KEY = 'sk_mxrxmdgs_3BMbVLE7jZPS9Y1ZsrfPCQz1';
const BASE_URL = 'https://api.sarvam.ai';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Translation ──
app.post('/api/translate', async (req, res) => {
  try {
    const response = await fetch(`${BASE_URL}/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': API_KEY,
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Transliteration ──
app.post('/api/transliterate', async (req, res) => {
  try {
    const response = await fetch(`${BASE_URL}/transliterate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': API_KEY,
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Text to Speech ──
app.post('/api/text-to-speech', async (req, res) => {
  try {
    const response = await fetch(`${BASE_URL}/text-to-speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': API_KEY,
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Speech to Text ──
app.post('/api/speech-to-text', upload.single('file'), async (req, res) => {
  try {
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });
    if (req.body.model) formData.append('model', req.body.model);
    if (req.body.language_code) formData.append('language_code', req.body.language_code);

    const response = await fetch(`${BASE_URL}/speech-to-text`, {
      method: 'POST',
      headers: {
        'api-subscription-key': API_KEY,
        ...formData.getHeaders(),
      },
      body: formData,
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Language Detection ──
app.post('/api/detect-language', async (req, res) => {
  try {
    const response = await fetch(`${BASE_URL}/text-lid`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': API_KEY,
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Chat Completion ──
app.post('/api/chat', async (req, res) => {
  try {
    const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': API_KEY,
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n  🚀 Paras AI Studio running at  http://localhost:${PORT}\n`);
});
