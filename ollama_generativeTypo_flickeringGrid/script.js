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

const styles = [
  { name: "Clean", gridSpacing: 10, pointSize: 4, tolerance: 6, sampleFactor: 0.35 },
  { name: "Dense", gridSpacing: 8, pointSize: 3, tolerance: 5, sampleFactor: 0.5 },
  { name: "Chunky", gridSpacing: 15, pointSize: 7, tolerance: 8, sampleFactor: 0.2 }
];

function preload() {
  font = loadFont('https://cdnjs.cloudflare.com/ajax/libs/topcoat/0.8.0/font/SourceCodePro-Light.otf');
  loadedWords = loadJSON('words.json', () => {
    words = ["Why AI?"].concat(Object.values(loadedWords));
  });
}

function setup() {
  createCanvas(800, 300);
  noStroke();
  prepareTextPoints();
  setupGrid();
  initAnimation();
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


// function setupGrid() {
//   grid = [];
//   let spacing = styles[styleIndex].gridSpacing;
//   for (let x = 0; x < width; x += spacing) {
//     for (let y = 0; y < height; y += spacing) {
//       grid.push(createVector(x, y));
//     }
//   }
// }

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
  } else if (key === 'N') {
    currentWord = (currentWord + 1) % wordPoints.length;
    initAnimation();
  }
}
