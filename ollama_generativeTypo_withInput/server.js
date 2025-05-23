// server.js

const express = require('express');
const fs = require('fs');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const app = express();

app.use(express.json());
app.use(express.static('public')); // <<< nur public-Ordner wird statisch ausgeliefert

app.post('/generate', async (req, res) => {
  const prompt = req.body.prompt || "Why AI?";
  console.log("📩 Prompt erhalten:", req.body);

  try {
    const ollamaRes = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3',
        prompt,
        stream: false
      })
    });

    const json = await ollamaRes.json();

    if (json.response) {
      const words = json.response
        .split(/\s+/)
        .map(word => word.replace(/(^[^a-zA-Z0-9äöüÄÖÜß'-]+|[^a-zA-Z0-9äöüÄÖÜß'-]+$)/g, ''))
        .filter(word => word.length > 0);

      fs.writeFileSync('public/words.json', JSON.stringify(words, null, 2));
      console.log("✅ Wörter gespeichert:", words);
      res.json({ words });
    } else {
      res.status(500).json({ error: json.error || "Fehler in Ollama-Antwort" });
    }
  } catch (err) {
    console.error("❌ Serverfehler:", err);
    res.status(500).json({ error: "Serverfehler beim Abrufen der Daten" });
  }
});

const port = 3000;
app.listen(port, () => {
  console.log(`🚀 Server läuft auf http://localhost:${port}`);
});