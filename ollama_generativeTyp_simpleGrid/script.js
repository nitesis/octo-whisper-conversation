let wordsData;
let wordPoints = [];
let grid = [];
let gridSpacing = 15; //10;
let font;
let fontSize = 80; //128;

let currentWordIndex = -1;
let animationProgress = 0;
let animationSpeed = 0.06; // 0.02 = 2 % pro Frame → dauert ca. 50 Frames ≈ 1,6 Sekunden bei 30 FPS
let switching = false;
let showQuestion = true;

function preload() {
  font = loadFont('https://cdnjs.cloudflare.com/ajax/libs/topcoat/0.8.0/font/SourceCodePro-Light.otf');
//   font = loadFont('fonts/HelveticaNeue-Bold.ttf'); // Passe den Pfad ggf. an
  wordsData = loadJSON('words.json');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  noStroke();
  textAlign(CENTER, CENTER);
  frameRate(30);

  // Grid vorbereiten
  for (let x = 0; x < width; x += gridSpacing) {
    for (let y = 0; y < height; y += gridSpacing) {
      grid.push(createVector(x, y));
    }
  }

  // Punkte für "Why AI?" vorbereiten
  prepareWordPoints("Why AI?");
}

function draw() {
  background(showQuestion ? 255 : 0);

  let pts = wordPoints[currentWordIndex];
  for (let gv of grid) {
    let active = false;
    for (let pt of pts) {
      if (dist(gv.x, gv.y, pt.x, pt.y) < gridSpacing / 1.5) {
        active = true;
        break;
      }
    }

    let alpha = active ? easeInOut(animationProgress) * 255 : 0;
    fill(showQuestion ? 0 : 255, alpha); // schwarz oder weiß
    ellipse(gv.x, gv.y, 5, 5);
  }

  if (!switching) {
    animationProgress += animationSpeed;
    if (animationProgress >= 1) {
      animationProgress = 1;
      switching = true;
      setTimeout(() => {
        animationProgress = 0;
        switching = false;
        if (showQuestion) {
          showQuestion = false;
          const wordsArray = Object.values(wordsData);
          prepareWordPoints(random(wordsArray));
        } else {
          const wordsArray = Object.values(wordsData);
          prepareWordPoints(random(wordsArray));
        }
      }, 1500); // Pause
    }
  }
}

function prepareWordPoints(word) {
  currentWordIndex++;
  let bounds = font.textBounds(word, 0, 0, fontSize);
  let x = (width - bounds.w) / 2;
  let y = (height + bounds.h) / 2;

  let pts = font.textToPoints(word, x, y, fontSize, {
    sampleFactor: 0.4,
    simplifyThreshold: 0
  });

  wordPoints[currentWordIndex] = pts;
}

function easeInOut(t) {
    return 0.5 - 0.5 * cos(PI * t);  // Smoother transition
}

function windowResized() {
resizeCanvas(windowWidth, windowHeight);
setupPoints(showQuestion ? "Why AI?" : currentWord);
}