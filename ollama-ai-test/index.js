const fetch = require('node-fetch'); // Funktioniert mit node-fetch@2

async function getOllamaAnswer(prompt) {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'mistral',
      prompt: prompt,
      stream: false
    })
  });

  const result = await response.json();
  console.log("Vollständige API-Antwort:", result);
  return result.response;
}

async function main() {
  const answer = await getOllamaAnswer("Why AI?");
  console.log("Antwort:", answer);
}

main();

