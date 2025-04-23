let handPose;
let video;
let hands = [];
let osc; // Oscillator for sound
let soundEnabled = false;
let notes = [
            261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25, // Octave 1 (C4 - C5)
            523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 987.77, 1046.50, // Octave 2 (C5 - C6)
            1046.50, 1174.66, 1318.51, 1396.91, 1567.98, 1760.00, 1975.53, 2093.00 // Octave 3 (C6 - C7)
];

let prevIndexX = null; // Neue globale Variable für die vorherige Position des Zeigefingers
let showText = false; // Zustand, ob der Text angezeigt werden soll
let startX = null; // Startposition der Bewegung
// let totalDistance = 0; // Gesamte zurückgelegte Distanz
// const minDistance = 50; // Mindestdistanz für die Textanzeige (in Pixeln)
// let movingRight = false; // Zeigt an, ob Bewegung nach rechts aktiv ist

function preload() {
    // Load the handpose model
    handPose = ml5.handPose({ flipHorizontal: true });
}

function setup() {
    createCanvas(640, 480);

    // Create a video capture from the webcam and hide it
    video = createCapture(VIDEO);
    video.size(640, 480);
    video.hide();

    // Start the detection of hands from  the webcam
    handPose.detectStart(video, gotHands);

    // Sound setup
    osc = new p5.Oscillator('sine');
    osc.amp(0); // Mute initially
    
    document.getElementById("soundButton").addEventListener("click", toggleSound);
}

function toggleSound() {
    if (!soundEnabled) {
        soundEnabled = true;
        osc.start();
        document.getElementById("soundButton").innerText = "Disable Sound";
    } else {
        soundEnabled = false;
        osc.stop();
        document.getElementById("soundButton").innerText = "Enable Sound";
    }
}

// Callback function when hands are detected
function gotHands(results) {
    // Save the results in the hands array
    hands = results;
}

function draw() {
    push();
    translate(width, 0);
    scale(-1, 1);
    image(video, 0, 0, width, height);
    pop();

    let currentIndexX = null;

    for (let i = 0; i < hands.length; i++) {
        let hand = hands[i];
        for (let j = 0; j < hand.keypoints.length; j++) {
            let keypoint = hand.keypoints[j];
            if (keypoint.name === "index_finger_tip") {
                fill(255);
                circle(keypoint.x, keypoint.y, 20);
                currentIndexX = keypoint.x;

                // Bewegungslogik
                if (prevIndexX === null) {
                    // Erste Erkennung des Fingers
                    startX = keypoint.x;
                } else {
                    let deltaX = keypoint.x - prevIndexX;
                    if (deltaX > 0 && startX !== null) {
                        showText = true; // Text bleibt dauerhaft, sobald Bewegung nach rechts beginnt
                    }
                }
                prevIndexX = keypoint.x;
                playSound(keypoint.x, keypoint.y);
            } else {
                fill(234, 125, 255, 200);
                noStroke();
                circle(keypoint.x, keypoint.y, 10);
            }
        }
    }

    // Text und Hintergrund zeichnen
    if (currentIndexX !== null && startX !== null) {
        textSize(32);
        textAlign(LEFT, CENTER); // Links ausgerichtet für natürliche Enthüllung
        let textStr = "From left to right";
        let textW = textWidth(textStr);
        let textH = 32; // textSize()
        let padding = 10;
        let textX = startX; // Text startet bei der ersten Fingerposition
        let textY = height / 2;

        // Berechne die Breite des sichtbaren Bereichs links vom Finger
        let revealWidth = constrain(currentIndexX - startX, 0, textW + padding * 2);

        // Schwarzer Hintergrund
        fill(0);
        rectMode(CORNER);
        rect(textX - padding, textY - textH / 2 - padding, revealWidth, textH + padding * 2);

        // Weißer Text
        fill(255);
        let visibleChars = Math.floor(map(revealWidth, 0, textW + padding * 2, 0, textStr.length));
        let visibleText = textStr.substring(0, visibleChars);
        text(visibleText, textX, textY);
    }
}

function playSound(x, y) {
    let mappedFreq = map(x, 0, width, 0, notes.length - 1);
    let noteIndex = floor(mappedFreq);
    let frequency = notes[noteIndex];

    let mappedVolume = map(y, 0, height, 1, 0);

    osc.freq(frequency);
    osc.amp(mappedVolume, 0.1);
}