let words = [];
let wordPoints = [];
let currentWordIndex = 0;
let font;
let wordsLoaded = false;
let scrollOffset = 0;
let wordAlphas = []; // Array für die Transparenz jedes Wortes

function preload() {
  font = loadFont('https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf');
  
  loadJSON('words.json', (loadedWords) => {
    words = Object.values(loadedWords);
    console.log("Words geladen:", words);
    wordsLoaded = true;
  }, (err) => {
    console.error("Fehler beim Laden von words.json:", err);
  });
}

function setup() {
  createCanvas(800, 600);
  textFont(font);
  textSize(24);
  noStroke();
  
  if (wordsLoaded) {
    prepareWordPoints();
  }
}

function prepareWordPoints() {
  if (!words || !Array.isArray(words)) {
    console.error("Words ist kein Array oder nicht geladen:", words);
    return;
  }

  for (let i = 0; i < words.length; i++) {
    let word = words[i];
    let points = font.textToPoints(word, 0, 0, 24, {
      sampleFactor: 0.25,
      simplifyThreshold: 0
    });
    wordPoints.push(points);
    wordAlphas[i] = 255; // Start-Transparenz: voll sichtbar
    console.log(`Punkte für Wort ${i + 1}/${words.length} (${word}):`, points.length);
  }
  console.log("wordPoints erstellt, Länge:", wordPoints.length);
}

function draw() {
  if (!wordsLoaded && words && Array.isArray(words)) {
    wordsLoaded = true;
    prepareWordPoints();
  }

  if (frameCount === 1) {
    background(255);
  }
  
  scrollOffset += 1;

  for (let i = 0; i < Math.min(currentWordIndex, wordPoints.length); i++) {
    let points = wordPoints[i];
    let xOffset = width / 2 + random(-100, 100);
    let yOffset = -40 + (i * 80) + scrollOffset;
    let angle = random(-PI / 12, PI / 12);
    
    // Fade-Out: Reduziere den Alpha-Wert basierend auf der Lebensdauer des Wortes
    let wordAge = frameCount - (i * 30); // Alter des Wortes in Frames (erscheint bei frameCount = i * 30)
    if (wordAge > 60) { // Beginne Fade-Out nach 60 Frames (1 Sekunde bei 60 FPS)
      wordAlphas[i] -= 10; // Sehr langsames Ausfaden
      wordAlphas[i] = max(wordAlphas[i], 0); // Nicht unter 0 gehen
    }
    
    if (yOffset > -40 && yOffset < height + 40 && wordAlphas[i] > 0) {
      push();
      translate(xOffset, yOffset);
      rotate(angle);
      
      // Setze die Transparenz für dieses Wort
      fill(0, wordAlphas[i]);
      
      for (let point of points) {
        let x = point.x + random(-5, 5);
        let y = point.y + random(-5, 5);
        ellipse(x, y, 3, 3);
      }
      pop();
    }
  }
  
  if (frameCount % 30 === 0 && currentWordIndex < wordPoints.length) {
    currentWordIndex++;
    console.log("Erhöhe currentWordIndex auf", currentWordIndex);
  }
}

// let words = [];
// let wordPoints = [];
// let currentWordIndex = 0;
// let font;
// let wordsLoaded = false;
// let scrollOffset = 0; // Für den Scroll-Effekt

// function preload() {
//   font = loadFont('https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf');
  
//   loadJSON('words.json', (loadedWords) => {
//     words = Object.values(loadedWords);
//     console.log("Words geladen:", words);
//     wordsLoaded = true;
//   }, (err) => {
//     console.error("Fehler beim Laden von words.json:", err);
//   });
// }

// function setup() {
//   // createCanvas(800, 600);
//   createCanvas(windowWidth, windowHeight);
//   textFont(font);
//   textSize(48);
//   fill(0);
//   noStroke();
  
//   if (wordsLoaded) {
//     prepareWordPoints();
//   }
// }

// function prepareWordPoints() {
//   if (!words || !Array.isArray(words)) {
//     console.error("Words ist kein Array oder nicht geladen:", words);
//     return;
//   }

//   for (let i = 0; i < words.length; i++) {
//     let word = words[i];
//     let points = font.textToPoints(word, 0, 0, 24, {
//       sampleFactor: 0.25,
//       simplifyThreshold: 0
//     });
//     wordPoints.push(points);
//     console.log(`Punkte für Wort ${i + 1}/${words.length} (${word}):`, points.length);
//   }
//   console.log("wordPoints erstellt, Länge:", wordPoints.length);
// }

// function draw() {
//   if (!wordsLoaded && words && Array.isArray(words)) {
//     wordsLoaded = true;
//     prepareWordPoints();
//   }

//   if (frameCount === 1) {
//     background(255);
//   }
  
//   // Scroll-Geschwindigkeit (Pixel pro Frame)
//   scrollOffset += 1; // Wörter scrollen mit 1 Pixel pro Frame nach unten

//   for (let i = 0; i < Math.min(currentWordIndex, wordPoints.length); i++) {
//     let points = wordPoints[i];
//     let xOffset = width / 2 + random(-100, 100);
//     // Wörter starten oberhalb des Canvas und scrollen nach unten
//     let yOffset = -40 + (i * 40) + scrollOffset; // Start bei y = -40, Abstand 40, scrollt nach unten
//     let angle = random(-PI / 12, PI / 12);
    
//     // Nur Wörter zeichnen, die im sichtbaren Bereich sind
//     if (yOffset > -40 && yOffset < height + 40) {
//       push();
//       translate(xOffset, yOffset);
//       rotate(angle);
      
//       for (let point of points) {
//         let x = point.x + random(-2, 2);
//         let y = point.y + random(-2, 2);
//         ellipse(x, y, 2, 2);
//       }
//       pop();
//     }
//   }
  
//   if (frameCount % 30 === 0 && currentWordIndex < wordPoints.length) {
//     currentWordIndex++;
//     console.log("Erhöhe currentWordIndex auf", currentWordIndex);
//   }
// }