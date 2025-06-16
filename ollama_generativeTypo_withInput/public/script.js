// script.js
let font;
let fontSize = 80;
let grid = [];
let wordPoints = [];
let currentWord = 0;
let styleIndex = 0;

let animationProgress = [];
let pointTimers = [];
let animationSpeed = 0.05;

let loadedWords = [];
let words = ["Why AI?"]; // Startfrage

// ========== MODIFIED: Enhanced oscillator system ==========
let osc;
let playing = false;
let audioStarted = false;

// NEW: P5AudioSystem for ML-generated sounds
let audioSystem;
let currentAudioParams = [];
// ========== END MODIFIED SECTION ==========

const socket = new WebSocket('ws://yourIP:8081');

// Log, um zu prüfen, dass etwas ankommt
socket.onopen = () => console.log("✅ WebSocket verbunden");
socket.onmessage = (event) => {
  console.log("📡 GyrOSC Daten empfangen:", event.data);
};

socket.onmessage = function(event) {
  const data = JSON.parse(event.data);

  // Nur weitermachen, wenn data.gyro existiert und aus 3 Zahlen besteht
  if (
    !data.gyro ||
    !Array.isArray(data.gyro) ||
    data.gyro.length < 3 ||
    !data.gyro.every(n => typeof n === 'number')
  ) {
    console.warn("Ignorierte Nachricht – keine gültigen Gyro-Daten:", data);
    return;
  }

  const [x, y, z] = data.gyro;

// ========== MODIFIED: Enhanced gyro control ==========
  // Apply gyro data to both old oscillator AND new audio system
  let freq = p5.prototype.map(x, -3, 3, 200, 800);
  freq = p5.prototype.constrain(freq, 100, 1000);
  let volume = p5.prototype.map(Math.abs(z), 0, 5, 0, 0.5);
  volume = p5.prototype.constrain(volume, 0, 0.5);

  // Old oscillator (keeping for backup)
  if (isFinite(freq) && isFinite(volume)) {
    if (!playing) {
      osc.amp(volume, 0.1);
      osc.freq(freq, 0.1);
      playing = true;
    } else {
      osc.amp(volume, 0.1);
      osc.freq(freq, 0.1);
    }
  }

  // NEW: Apply gyro to audio system
  if (audioSystem) {
    audioSystem.applyGyroModulation(x, y, z);
  }
  // ========== END MODIFIED SECTION ==========
};

const styles = [
  { name: "Clean", gridSpacing: 10, pointSize: 4, tolerance: 6, sampleFactor: 0.35 },
  { name: "Dense", gridSpacing: 8, pointSize: 3, tolerance: 5, sampleFactor: 0.5 },
  { name: "Chunky", gridSpacing: 15, pointSize: 7, tolerance: 8, sampleFactor: 0.2 }
];

// ========== NEW: P5AudioSystem Class ==========
class P5AudioSystem {
  constructor() {
    this.oscillators = [];
    this.envelopes = [];
    this.effects = {
      reverb: null,
      delay: null,
      filter: null
    };
    this.isPlaying = false;
    this.gyroModulation = { x: 0, y: 0, z: 0 };
  }

  init() {
    // Initialize effects
    this.effects.reverb = new p5.Reverb();
    this.effects.delay = new p5.Delay();
    this.effects.filter = new p5.LowPass();
    
    console.log("🎵 P5AudioSystem initialized");
  }

  playAudioSequence(audioParams, wordIndex = null) {
    this.stopAll();
  
    // If wordIndex is specified, play only that word's sound
    if (wordIndex !== null && audioParams[wordIndex]) {
      this.currentParams = [audioParams[wordIndex]];
      console.log("🎶 Playing single word audio:", audioParams[wordIndex]);
      this.playSound(audioParams[wordIndex]);
    } else {
      // Original behavior - play all sounds
      this.currentParams = audioParams;
      console.log("🎶 Playing audio sequence:", audioParams);
    
      audioParams.forEach((param, index) => {
        setTimeout(() => {
          this.playSound(param);
        }, param.delay * 1000);
      });
    }

    this.isPlaying = true;
  }

  // playSound(param) {
  //   // Create oscillator
  //   let osc = new p5.Oscillator(param.waveform);
  //   let env = new p5.Envelope();
    
  //   // Configure envelope
  //   env.setADSR(param.attack, 0.1, 0.3, param.release);
  //   env.setRange(0.3, 0);
    
  //   // Set frequency with some gyro modulation
  //   let modulatedFreq = param.frequency + (this.gyroModulation.x * 50);
  //   osc.freq(modulatedFreq);
    
  //   // Apply effects
  //   osc.disconnect();
  //   osc.connect(this.effects.filter);
  //   this.effects.filter.connect(this.effects.delay);
  //   this.effects.delay.connect(this.effects.reverb);
    
  //   // Start sound
  //   osc.start();
  //   env.play(osc);
    
  //   // Store references
  //   this.oscillators.push(osc);
  //   this.envelopes.push(env);
    
  //   // Clean up after duration
  //   setTimeout(() => {
  //     osc.stop();
  //     this.oscillators = this.oscillators.filter(o => o !== osc);
  //     this.envelopes = this.envelopes.filter(e => e !== env);
  //   }, param.duration * 1000);

  //   console.log(`🔊 Playing: ${param.word} (${param.category}) at ${param.frequency}Hz`);
  // }

playSound(param) {
  // Create multiple oscillators for richer sound
  const numOscillators = 3;
  const frequencies = [
    param.frequency,
    param.frequency * 1.5, // Fifth
    param.frequency * 2    // Octave
  ];
  const volumes = [0.4, 0.2, 0.1];

  frequencies.forEach((freq, i) => {
    let osc = new p5.Oscillator(param.waveform);
    let env = new p5.Envelope();
    
    // Configure envelope with sustain
    env.setADSR(param.attack, 0.1, param.sustainLevel || 0.3, param.release);
    env.setRange(volumes[i], 0);
    
    // Set frequency with gyro modulation
    let modulatedFreq = freq + (this.gyroModulation.x * 50);
    osc.freq(modulatedFreq);
    
    // Apply effects
    osc.disconnect();
    osc.connect(this.effects.filter);
    this.effects.filter.connect(this.effects.delay);
    this.effects.delay.connect(this.effects.reverb);
    
    // Start sound
    osc.start();
    env.play(osc);
    
    // Store references
    this.oscillators.push(osc);
    this.envelopes.push(env);
    
    // Clean up after duration
    setTimeout(() => {
      osc.stop();
      this.oscillators = this.oscillators.filter(o => o !== osc);
      this.envelopes = this.envelopes.filter(e => e !== env);
    }, param.duration * 1000);
  });

  console.log(`🔊 Playing layered sound: ${param.word} (${param.category})`);
}

  applyGyroModulation(x, y, z) {
    this.gyroModulation = { x, y, z };
    
    // Apply real-time modulation to active oscillators
    this.oscillators.forEach((osc, index) => {
      if (this.currentParams && this.currentParams[index]) {
        let baseFreq = this.currentParams[index].frequency;
        let modulatedFreq = baseFreq + (x * 30) + (y * 20);
        osc.freq(modulatedFreq, 0.1);
      }
    });

    // Modulate effects
    if (this.effects.filter) {
      let filterFreq = p5.prototype.map(Math.abs(z), 0, 3, 200, 2000);
      this.effects.filter.freq(filterFreq);
    }
  }

  stopAll() {
    this.oscillators.forEach(osc => osc.stop());
    this.oscillators = [];
    this.envelopes = [];
    this.isPlaying = false;
  }
}
// ========== END NEW SECTION ==========

function preload() {
  font = loadFont('https://cdnjs.cloudflare.com/ajax/libs/topcoat/0.8.0/font/SourceCodePro-Light.otf');
    
// ========== MODIFIED: Load enhanced word data ==========
  loadedWords = loadJSON('words.json', (data) => {
    if (data.words && data.audioParams) {
      // New format with audio parameters
      words = ["Why AI?"].concat(data.words);
      currentAudioParams = data.audioParams;
      console.log("✅ Loaded words with audio params:", currentAudioParams);
    } else if (Array.isArray(data)) {
      // Old format compatibility
      words = ["Why AI?"].concat(data);
    } else {
      console.warn("Unknown words.json format:", data);
    }
  });
  // ========== END MODIFIED SECTION ==========

}

function setup() {
  createCanvas(800, 300);
  noStroke();
  prepareTextPoints();
  setupGrid();
  initAnimation();

  // Old oscillator (keeping for backup)
  osc = new p5.Oscillator('sine');
  osc.start();
  osc.amp(0); // Startet lautlos

  // ========== NEW: Initialize audio system ==========
  audioSystem = new P5AudioSystem();
  audioSystem.init();
  // ========== END NEW SECTION ==========
}

function prepareTextPoints() {
  wordPoints = [];
  for (let word of words) {
    let bounds = font.textBounds(word, 0, 0, fontSize);
    let x = (width - bounds.w) / 2;
    let y = (height + bounds.h) / 2;
    let pts = font.textToPoints(word, x, y, fontSize, {
      sampleFactor: styles[styleIndex].sampleFactor,
      simplifyThreshold: 0
    });
    wordPoints.push(pts);
  }
}

function setupGrid() {
  grid = [];
  let spacing = styles[styleIndex].gridSpacing;
  let gridWidth = Math.floor(width / spacing) * spacing;
  let gridHeight = Math.floor(height / spacing) * spacing;
  let offsetX = (width - gridWidth) / 2;
  let offsetY = (height - gridHeight) / 2;

  for (let x = offsetX; x < width - offsetX; x += spacing) {
    for (let y = offsetY; y < height - offsetY; y += spacing) {
      grid.push(createVector(x, y));
    }
  }
}

function initAnimation() {
  let totalPoints = grid.length;
  animationProgress = new Array(totalPoints).fill(0);
  pointTimers = grid.map(() => random(0, 1.5)); // versetzter Start
}

function draw() {
  background(0);
  fill(80);
  
  for (let gv of grid) ellipse(gv.x, gv.y, 2, 2); // Grundraster

  let pts = wordPoints[currentWord];
  let tolerance = styles[styleIndex].tolerance;
  let size = styles[styleIndex].pointSize;

  for (let i = 0; i < grid.length; i++) {
    let gv = grid[i];
    let active = false;
    for (let pt of pts) {
      if (dist(gv.x, gv.y, pt.x, pt.y) < tolerance) {
        active = true;
        break;
      }
    }

    // Animation: flackernd einblenden
    if (active) {
      if (pointTimers[i] <= 0 && animationProgress[i] < 1) {
        animationProgress[i] += animationSpeed;
      } else {
        pointTimers[i] -= 0.016;
      }

      let flicker = random() < 0.1 ? 50 : 255;
      let alpha = easeInOut(animationProgress[i]) * flicker;
      fill(255, alpha);
      ellipse(gv.x, gv.y, size, size);
    }
  }

  // Nach X Sekunden neues Wort (optional)
  // oder per Taste `N` (siehe keyPressed)
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function keyPressed() {
  if (key === '1' || key === '2' || key === '3') {
    styleIndex = parseInt(key) - 1;
    prepareTextPoints();
    setupGrid();
    initAnimation();
  } else if (key === 'n') {
  currentWord = (currentWord + 1) % wordPoints.length;
  initAnimation();

  // NEW: Auto-play sound for new word
  if (audioSystem && currentAudioParams.length > 0 && audioStarted) {
    // Adjust index: currentWord 0 is "Why AI?" which has no audio params
    // So audio params start at currentWord - 1
    let audioIndex = currentWord - 1;
    if (audioIndex >= 0 && audioIndex < currentAudioParams.length) {
      setTimeout(() => {
        audioSystem.playAudioSequence(currentAudioParams, audioIndex);
      }, 200);
    }
  }
}

   // ========== NEW: Audio control keys ==========
  else if (key === 'p' || key === ' ') {
    // Play ML-generated audio for current word only
    if (audioSystem && currentAudioParams.length > 0) {
      let audioIndex = currentWord - 1;
      if (audioIndex >= 0 && audioIndex < currentAudioParams.length) {
        audioSystem.playAudioSequence(currentAudioParams, audioIndex);
      }
    }
  } else if (key === 's') {
    // Stop all audio
    if (audioSystem) {
      audioSystem.stopAll();
    }
  }
  // ========== END NEW SECTION ==========

}

function reloadWords() {
  // ========== MODIFIED: Enhanced reload function ==========
  loadJSON('words.json', (data) => {
    if (data.words && data.audioParams) {
      words = ["Why AI?"].concat(data.words);
      currentAudioParams = data.audioParams;
      console.log("🔄 Reloaded with audio params");
    } else if (Array.isArray(data)) {
      words = ["Why AI?"].concat(data);
    }
    prepareTextPoints();
    initAnimation();
  });
  // ========== END MODIFIED SECTION ==========
}

function mousePressed() {
  if (!audioStarted) {
    userStartAudio().then(() => {
      audioStarted = true;
      console.log("🔊 Audio aktiviert");

       // ========== NEW: Auto-play audio on first interaction ==========
      if (audioSystem && currentAudioParams.length > 0) {
        setTimeout(() => {
          audioSystem.playAudioSequence(currentAudioParams, currentWord);
        }, 500);
      }
      // ========== END NEW SECTION ==========
    });
  }
}