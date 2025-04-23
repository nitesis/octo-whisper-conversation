# hand-pose-octo-invention
An experimental approach to drive me, myself and the teachable machine completely crazy 

## ollama_poetry
The idea is to run a local API on your machine. The LLM used hier is llama3.
For download checkout https://ollama.com (yes, the one with the so cute lama logo).

Some advantegs of llama next to being locally on your machine
- ollama pull llama3 → Load the brand new LLaMA-3 (also works)
- You can build your own models (model files)
- Supports system, user, assistant messages in chat style


What you should see when the project is up and running
1. Question ‘Why AI?’ appears centred
2. After 2 seconds: black background
3. Words from the answer are displayed randomly one by one (every 1 second)

The project works as follows
1. A prompt given (hard coded and in my example "Why AI?") will be send to the local API.
2. The answer of the local LLM will be added word by word into an array.
3. The elements of the arry will be shown on screen one after another in random order.


### Pre-conditions
llama is installed on your local machine --> https://ollama.com

Next go to your porject folder an install node-fetch:
npm install node-fetch

Workflow
### 1. Terminalfenster A – Modell starten
ollama run mistral

### 2. Terminalfenster B – Antwort holen
cd path/to/ollama_poetry
node index.js (If neded pull model before with ollama pull llama3)

### 3. Terminalfenster C – Webserver starten
cd path/to/ollama_poetry
http-server

### 4. Browser → http://localhost:8080 öffnen
opene localhost in browser and the magic should beginn