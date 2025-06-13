// server.js

const express = require('express');
const fs = require('fs');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const app = express();

const osc = require('osc');
const WebSocket = require('ws');


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

// WebSocket-Server starten (Verbindet Server und Browser in Echtzeit)
const wss = new WebSocket.Server({ port: 8081 });

let clients = [];

wss.on('connection', ws => {
  console.log("🧩 WebSocket verbunden");
  clients.push(ws);

  ws.on('close', () => {
    clients = clients.filter(client => client !== ws);
  });
});

// OSC-Empfang einrichten
const udpPort = new osc.UDPPort({
    localAddress: "0.0.0.0",
    localPort: 5000
  });
  
  udpPort.on("message", function (oscMsg) {
    console.log("🎮 GyrOSC-Daten empfangen:", oscMsg);
  
    const data = oscMsg.args;
  
    // an alle WebSocket-Clients senden
    for (const client of clients) {
      client.send(JSON.stringify({ gyro: data }));
    }
  });
  
  udpPort.open();
  