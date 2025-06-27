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

const socket = new WebSocket('yourIP:8081');

// Debug Code
socket.onopen = () => {
    console.log("✅ WebSocket verbunden zu Server");
    setInterval(() => {
        console.log("💓 WebSocket Status:", socket.readyState);
    }, 5000);
};

socket.onerror = (error) => {
    console.log("❌ WebSocket Fehler:", error);
};

socket.onclose = () => {
    console.log("🔴 WebSocket Verbindung geschlossen");
};
// Debug Code Ende

// Log, um zu prüfen, dass etwas ankommt
socket.onopen = () => console.log("✅ WebSocket verbunden");
socket.onmessage = (event) => {
  console.log("📡 GyrOSC Daten empfangen:", event.data);
};

// 1. UPDATE: Softer gyro control in socket.onmessage
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

   // MODIFIED: Much gentler frequency and volume ranges
  let freq = p5.prototype.map(x, -3, 3, 150, 400); // Lower, warmer frequencies
  freq = p5.prototype.constrain(freq, 120, 450);
  let volume = p5.prototype.map(Math.abs(z), 0, 5, 0, 0.2); // Much quieter max volume
  volume = p5.prototype.constrain(volume, 0, 0.25);


  // Smoother transitions for old oscillator
  if (isFinite(freq) && isFinite(volume)) {
    if (!playing) {
      osc.amp(volume, 0.3); // Slower fade-in
      osc.freq(freq, 0.3);
      playing = true;
    } else {
      osc.amp(volume, 0.3); // Slower transitions
      osc.freq(freq, 0.3);
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


// 2. REPLACE: P5AudioSystem with relaxing modifications
class P5AudioSystem {
  constructor() {
    this.oscillators = [];
    this.envelopes = [];
    this.ambientOsc = null; // NEW: Continuous ambient layer
    this.ambientGain = null;
    this.bassOsc = null;
    this.bassEnv = null;
    this.bassTimer = 0;
    this.bassInterval = 4000; // MODIFIED: Slower bass (every 4 seconds)
    this.effects = {
      reverb: null,
      delay: null,
      filter: null
    };
    this.isPlaying = false;
    this.gyroModulation = { x: 0, y: 0, z: 0 };
    this.isContinuous = false;
    this.continuousParam = null;
  }

  init() {
    // Initialize effects with relaxing settings
    this.effects.reverb = new p5.Reverb();
    this.effects.reverb.set(3, 2); // Long, spacious reverb
    
    this.effects.delay = new p5.Delay();
    this.effects.delay.process(this.effects.reverb, 0.3, 0.4, 2300); // Gentle delay
    
    this.effects.filter = new p5.LowPass();
    this.effects.filter.freq(800); // Warmer, filtered sound

    // NEW: Ambient layer for continuous calm sound
    this.ambientOsc = new p5.Oscillator('sine');
    this.ambientGain = new p5.Gain();
    this.ambientOsc.connect(this.ambientGain);
    this.ambientGain.connect(this.effects.reverb);
    this.ambientOsc.freq(55); // Very low, barely audible drone
    this.ambientOsc.start();
    this.ambientGain.amp(0.05); // Very quiet

    // MODIFIED: Gentler bass with longer envelope
    this.bassOsc = new p5.Oscillator('sine');
    this.bassEnv = new p5.Envelope();
    this.bassEnv.setADSR(0.8, 0.6, 0.4, 2.0); // Very slow, gentle bass
    this.bassEnv.setRange(0.3, 0); // Quieter bass
    this.bassOsc.start();
    this.bassOsc.amp(0);
    
    console.log("🎵 Relaxing P5AudioSystem initialized");
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



playSound(param) {
  // Hybride Variante aus Einzeltönen und Klangteppich
  // Primärer Tropfenklang
  let mainOsc = new p5.Oscillator('sine');
  let mainEnv = new p5.Envelope();

  const attack = 0.05;
  const decay = 0.3;
  const sustain = 0.1;
  const release = 2.5;

  mainEnv.setADSR(attack, decay, sustain, release);
  mainEnv.setRange(0.2, 0); // Hauptton etwas präsenter

  // 🎼 Frequenzmapping (z. B. auf beruhigende Tonleiter)
  const baseFreq = this.mapToRelaxingFreq
    ? this.mapToRelaxingFreq(param.frequency)
    : param.frequency;

  const modulatedFreq = baseFreq + (this.gyroModulation.x * 10);
  mainOsc.freq(modulatedFreq);

  // 🔗 Effektroute
  mainOsc.disconnect();
  mainOsc.connect(this.effects.filter);
  this.effects.filter.connect(this.effects.reverb);
  this.effects.reverb.connect(this.effects.delay);

  mainOsc.start();
  mainEnv.play(mainOsc);

  this.oscillators.push(mainOsc);
  this.envelopes.push(mainEnv);

  // 🌫️ Zweiter, leiser Layer für Tiefe (z. B. eine Oktave tiefer)
  let layerOsc = new p5.Oscillator('sine');
  let layerEnv = new p5.Envelope();
  layerEnv.setADSR(0.5, 0.6, 0.2, 3.0); // Weicher Anstieg, sehr langes Release
  layerEnv.setRange(0.08, 0); // Dezent im Hintergrund

  const harmonicFreq = baseFreq * 0.5; // Oktave tiefer
  layerOsc.freq(harmonicFreq);

  // Gleiche Effektroute
  layerOsc.disconnect();
  layerOsc.connect(this.effects.filter);

  layerOsc.start();
  layerEnv.play(layerOsc);

  this.oscillators.push(layerOsc);
  this.envelopes.push(layerEnv);

  // 🕓 Cleanup nach Klangende (Release + Pufferzeit)
  const cleanupTime = (param.duration || 1) + 3;

  setTimeout(() => {
    mainOsc.stop();
    layerOsc.stop();
    this.oscillators = this.oscillators.filter(o => o !== mainOsc && o !== layerOsc);
    this.envelopes = this.envelopes.filter(e => e !== mainEnv && e !== layerEnv);
  }, cleanupTime * 1000);

  console.log(`🎧 Hybrid sound: ${param.word} → ${baseFreq.toFixed(1)} Hz`);
}

// Hilfsfunktion 
mapToRelaxingFreq(f) {
  const baseScale = [130.81, 146.83, 164.81, 174.61, 196.00, 220.00, 246.94]; // C-Dur
  const scale = [];

  // Generiere 4 Oktaven von C3 (~130 Hz) bis C7 (~2093 Hz)
  for (let i = 0; i < 4; i++) {
    scale.push(...baseScale.map(note => note * Math.pow(2, i)));
  }

  const closest = scale.reduce((prev, curr) =>
    Math.abs(curr - f) < Math.abs(prev - f) ? curr : prev
  );

  console.log(`Mapping ${f} Hz to closest ${closest} Hz`);
  return closest;
}


  applyGyroModulation(x, y, z) {
    this.gyroModulation = { x, y, z };
    
    // MODIFIED: Much gentler real-time modulation
    this.oscillators.forEach((osc, index) => {
      if (this.currentParams && this.currentParams[index]) {
        let baseFreq = this.currentParams[index].frequency;
        let modulatedFreq = baseFreq + (x * 8) + (y * 5); // Much less modulation
        osc.freq(modulatedFreq, 0.2); // Slower transitions
      }
    });

    // Gentle filter modulation
    if (this.effects.filter) {
      let filterFreq = p5.prototype.map(Math.abs(z), 0, 3, 400, 1200); // Warmer range
      this.effects.filter.freq(filterFreq, 0.3); // Smooth transitions
    }

    // NEW: Modulate ambient layer very subtly
    if (this.ambientOsc) {
      let ambientFreq = 55 + (Math.sin(millis() * 0.001) * 5) + (z * 2);
      this.ambientOsc.freq(ambientFreq, 0.5);
    }
  }

  updateBass() {
    if (!this.bassOsc) return;
    
    // MODIFIED: Even slower, gentler bass
    if (millis() - this.bassTimer > this.bassInterval) {
      let bassFreq = map(currentWord, 0, words.length - 1, 35, 65); // Lower range
      bassFreq += this.gyroModulation.z * 2; // Minimal modulation
      bassFreq = constrain(bassFreq, 30, 70);
      
      this.bassOsc.freq(bassFreq);
      this.bassEnv.play(this.bassOsc);
      
      this.bassTimer = millis();
      console.log(`🎵 Gentle bass at ${bassFreq}Hz`);
    }
  }

  // NEW: Add nature-inspired sounds
  addNatureSounds() {
    // Gentle wind-like oscillation
    let windOsc = new p5.Oscillator('sine');
    let windGain = new p5.Gain();
    windOsc.connect(windGain);
    windGain.connect(this.effects.reverb);
    windOsc.freq(80);
    windOsc.start();
    
    // Slowly varying amplitude for wind effect
    setInterval(() => {
      let windAmp = map(noise(millis() * 0.0005), 0, 1, 0.02, 0.08);
      windGain.amp(windAmp, 1.0);
    }, 100);
  }

  stopAll() {
    this.oscillators.forEach(osc => osc.stop());
    this.oscillators = [];
    this.envelopes = [];

    // ADD THESE LINES for bass cleanup
    if (this.bassOsc) {
      // this.bassOsc.amp(0, 0.1);
      this.bassOsc.amp(0, 0.5); // Gentle fade out
    }
    // END NEW LINES

    this.isPlaying = false;
  }

  // Method for playing sound of word continously
  startContinuousPlay(audioParam) {
  this.stopAll();
  this.continuousParam = audioParam;
  this.isContinuous = true;
  this.playContinuousSound();
  }

  playContinuousSound() {
    if (!this.isContinuous || !this.continuousParam) return;
  
    this.playSound(this.continuousParam);
  
    // Schedule next play based on duration
    setTimeout(() => {
     if (this.isContinuous) {
        this.playContinuousSound();
      }
    }, this.continuousParam.duration * 1000);
  }

  stopContinuous() {
    this.isContinuous = false;
    this.continuousParam = null;
    this.stopAll();
  }

  // Bass control method
  updateBass() {
    if (!this.bassOsc) return;
    
    // Only trigger bass at intervals
    if (millis() - this.bassTimer > this.bassInterval) {
      // Calculate bass frequency based on current word/animation state
      let bassFreq = map(currentWord, 0, words.length - 1, 40, 80); // Narrower, more audible range
      
      // Add some gyro modulation
      bassFreq += this.gyroModulation.z * 5; // Less modulation for stability
      bassFreq = constrain(bassFreq, 35, 100);
      
      this.bassOsc.freq(bassFreq);
      
      // Play the envelope - this creates the bass "hit"
      this.bassEnv.play(this.bassOsc);
      
      this.bassTimer = millis();
      console.log(`🎵 Bass hit at ${bassFreq}Hz for ~2 seconds`);
    }
  }
  

}
// ========== END: P5AudioSystem Class ==========

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



// 3. MODIFY: setup() function to initialize relaxing audio
function setup() {
  createCanvas(800, 300);
  noStroke();
  prepareTextPoints();
  setupGrid();
  initAnimation();

  // MODIFIED: Use triangle wave for warmer old oscillator
  osc = new p5.Oscillator('triangle');
  osc.start();
  osc.amp(0);

  audioSystem = new P5AudioSystem();
  audioSystem.init();
  
  // NEW: Add nature sounds after user interaction
  setTimeout(() => {
    if (audioStarted && audioSystem) {
      audioSystem.addNatureSounds();
    }
  }, 2000);
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



// 4. MODIFY: draw() function for gentler bass timing
function draw() {
  background(0);
  fill(80);
  
  for (let gv of grid) ellipse(gv.x, gv.y, 2, 2);

  let pts = wordPoints[currentWord];
  let tolerance = styles[styleIndex].tolerance;
  let size = styles[styleIndex].pointSize;

  let activePointCount = 0;

  for (let i = 0; i < grid.length; i++) {
    let gv = grid[i];
    let active = false;
    for (let pt of pts) {
      if (dist(gv.x, gv.y, pt.x, pt.y) < tolerance) {
        active = true;
        break;
      }
    }

    if (active) {
      activePointCount++;

      if (pointTimers[i] <= 0 && animationProgress[i] < 1) {
        animationProgress[i] += animationSpeed;
      } else {
        pointTimers[i] -= 0.016;
      }

      // MODIFIED: Gentler flicker effect
      let flicker = random() < 0.05 ? 100 : 200; // Less contrast, less frequent
      let alpha = easeInOut(animationProgress[i]) * flicker;
      fill(255, alpha);
      ellipse(gv.x, gv.y, size, size);
    }
  }
  
  // MODIFIED: Slower bass response to activity
  if (audioSystem && audioStarted) {
    let activityRatio = activePointCount / grid.length;
    audioSystem.bassInterval = map(activityRatio, 0, 0.1, 6000, 3000); // Slower overall
    audioSystem.updateBass();
  }
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

  // Stop previous continuous sound and start new one
  if (audioSystem && currentAudioParams.length > 0 && audioStarted) {
    let audioIndex = currentWord - 1;
    if (audioIndex >= 0 && audioIndex < currentAudioParams.length) {
      setTimeout(() => {
        audioSystem.startContinuousPlay(currentAudioParams[audioIndex]);
      }, 200);
    } else {
      audioSystem.stopContinuous();
    }
  }
}

   // ========== NEW: Audio control keys ==========
  else if (key === 'p' || key === ' ') {
    // Toggle continuous play for current word
    if (audioSystem && currentAudioParams.length > 0) {
      let audioIndex = currentWord - 1;
      if (audioIndex >= 0 && audioIndex < currentAudioParams.length) {
        if (audioSystem.isContinuous) {
          audioSystem.stopContinuous();
        } else {
          audioSystem.startContinuousPlay(currentAudioParams[audioIndex]);
        }
      }
    }
  } else if (key === 's') {
    // Stop all audio including continuous
    if (audioSystem) {
      audioSystem.stopContinuous();
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