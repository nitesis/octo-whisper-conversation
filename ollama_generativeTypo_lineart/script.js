let words = [];
let currentWord = "";
let showQuestion = true;
let timer = 0;
let delay = 1000;
let font;
let basePoints = [];
let drawIndex = 0;
let fontSize = 64;


// Für Textausrichtung
let x, y;

function preload() {
  font = loadFont('https://cdnjs.cloudflare.com/ajax/libs/topcoat/0.8.0/font/SourceCodePro-Light.otf');
  // font = loadFont('HelveticaNeue-Regular.ttf'); // Passe den Pfad ggf. an
  words = loadJSON('words.json');
}

function setup() {
  pixelDensity(displayDensity()); // für Retina & Co.
  createCanvas(windowWidth, windowHeight);
  frameRate(30);
  textAlign(CENTER, CENTER);
  noFill();
  stroke(0);
  strokeWeight(1);
  setupPoints("Why AI?");
}

function draw() {  
  if (showQuestion) {
    background(255);
    stroke(0);
    beginShape();
    for (let i = 0; i < drawIndex && i < basePoints.length; i++) {
      let pt = basePoints[i];
      let offsetX = map(noise(pt.x * 0.01, pt.y * 0.01, frameCount * 0.01), 0, 1, -1, 1);
      let offsetY = map(noise(pt.y * 0.01, pt.x * 0.01, frameCount * 0.01), 0, 1, -1, 1);
      vertex(pt.x + offsetX, pt.y + offsetY);
    }
    endShape();

    if (drawIndex < basePoints.length) {
      drawIndex += 2;
    }

    if (millis() > 2000 && drawIndex >= basePoints.length) {
      showQuestion = false;
      timer = millis();
      drawIndex = 0;
      currentWord = getRandomWord();
      setupPoints(currentWord);
    }
  } else {
    background(0);
    stroke(255);
    beginShape();
    for (let i = 0; i < drawIndex && i < basePoints.length; i++) {
      let pt = basePoints[i];
      vertex(pt.x, pt.y);
    }
    endShape();

    if (drawIndex < basePoints.length) {
      drawIndex += 2;
    } else if (millis() - timer > delay) {
      currentWord = getRandomWord();
      setupPoints(currentWord);
      timer = millis();
      drawIndex = 0;
    }
  }
}

function setupPoints(textStr) {
  let bounds = font.textBounds(textStr, 0, 0, fontSize);
  x = (width - bounds.w) / 2;
  y = (height + bounds.h) / 2;
  basePoints = font.textToPoints(textStr, x, y, fontSize, {
    sampleFactor: 0.2,
    simplifyThreshold: 0
  });
  drawIndex = 0;
}

function getRandomWord() {
  let keys = Object.keys(words);
  return words[keys[int(random(keys.length))]];
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  setupPoints(showQuestion ? "Why AI?" : currentWord);
}
