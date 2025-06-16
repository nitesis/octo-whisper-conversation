// server.js

const express = require('express');
const fs = require('fs');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const app = express();

const osc = require('osc');
const WebSocket = require('ws');


app.use(express.json());
app.use(express.static('public')); // <<< nur public-Ordner wird statisch ausgeliefert

// ========== NEW: Simple ML Audio Parameter Generator ==========
class SimpleAudioML {
  constructor() {
    // Simple word-to-sound archetypes (this is your "ML" starting point)
    this.archetypes = {
      emotional: { baseFreq: 220, waveform: 'sine', attack: 0.1, release: 0.5 },
      technical: { baseFreq: 440, waveform: 'square', attack: 0.05, release: 0.2 },
      nature: { baseFreq: 330, waveform: 'triangle', attack: 0.2, release: 0.8 },
      action: { baseFreq: 110, waveform: 'sawtooth', attack: 0.01, release: 0.1 },
      abstract: { baseFreq: 660, waveform: 'sine', attack: 0.3, release: 1.0 }
    };
    
    this.wordCategories = {
      emotional: ['love', 'hate', 'joy', 'sad', 'happy', 'fear', 'hope', 'dream'],
      technical: ['algorithm', 'data', 'system', 'code', 'process', 'logic', 'function'],
      nature: ['tree', 'water', 'wind', 'earth', 'sky', 'flower', 'bird', 'ocean'],
      action: ['run', 'jump', 'fight', 'move', 'crash', 'explode', 'break', 'hit'],
      abstract: ['consciousness', 'thought', 'idea', 'concept', 'mind', 'soul', 'essence']
    };
  }

  categorizeWord(word) {
    const lowerWord = word.toLowerCase();
    for (const [category, words] of Object.entries(this.wordCategories)) {
      if (words.some(w => lowerWord.includes(w) || w.includes(lowerWord))) {
        return category;
      }
    }
    return 'abstract'; // default
  }

  generateAudioParams(words) {
    return words.map((word, index) => {
      const category = this.categorizeWord(word);
      const archetype = this.archetypes[category];
      
      // Add some randomness and word-length influence
      const wordInfluence = word.length * 10;
      const randomFactor = (Math.random() - 0.5) * 0.2;
      
      return {
        word: word,
        category: category,
        frequency: archetype.baseFreq + wordInfluence + (randomFactor * 100),
        waveform: archetype.waveform,
        attack: archetype.attack,
        release: archetype.release,
        delay: index * 0.5, // timing offset
        duration: Math.max(0.3, word.length * 0.1)
      };
    });
  }
}

const audioML = new SimpleAudioML();
// ========== END NEW SECTION ==========

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
      // fs.writeFileSync('public/words.json', JSON.stringify(words, null, 2));
      // console.log("✅ Wörter gespeichert:", words);
      // res.json({ words });

      // ========== NEW: Generate ML Audio Parameters ==========
      const audioParams = audioML.generateAudioParams(words);
      
      const responseData = {
        words: words,
        audioParams: audioParams // <- This is new!
      };
      
      fs.writeFileSync('public/words.json', JSON.stringify(responseData, null, 2));
      console.log("✅ Wörter und Audio-Parameter gespeichert:", responseData);
      res.json(responseData);
      // ========== END NEW SECTION ==========
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
  