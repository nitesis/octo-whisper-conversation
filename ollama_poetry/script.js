let words = [];
let currentWord = "";
let showQuestion = true;
let timer = 0;
let delay = 1000; // 1 Sekunde zwischen Wörtern

function preload() {
  // Lade das JSON (vom Node-Backend gespeichert)
  words = loadJSON('words.json');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont('Helvetica Neue');
  textAlign(CENTER, CENTER);
  textSize(32);
  frameRate(30);
}

function draw() {
  if (showQuestion) {
    background(255);
    fill(0);
    text("Why AI?", width / 2, height / 2);

    // Zeige die Frage nur für 2 Sekunden
    if (millis() > 2000) {
      showQuestion = false;
      timer = millis();
      currentWord = getRandomWord();
    }
  } else {
    background(0);
    fill(255);
    text(currentWord, width / 2, height / 2);

    // Zeige jedes Wort für 1 Sekunde
    if (millis() - timer > delay) {
      currentWord = getRandomWord();
      timer = millis();
    }
  }
}

function getRandomWord() {
  let arr = Object.values(words); // JSON zu Array
  return arr[Math.floor(Math.random() * arr.length)];
}