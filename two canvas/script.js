let model, video, pose = "none", poseConfidence = 0, rectangles = [];

// Erstes Canvas für Rechtecke
async function sketch1(p) {
    p.setup = function () {
        p.createCanvas(640, 480).parent("canvas1");
        p.rectMode(p.CENTER);
    };

    p.draw = function () {
        p.clear();
        p.background(255);
        moveRectangles();
        drawRectangles(p);
        spawnNewRectangles(p);
        displayPoseConfidence();
    };
}

new p5(sketch1);

// Zweites Canvas für Webcam + Handpose
async function sketch2(p) {
    p.setup = async function () {
        video = video || p.createCapture(p.VIDEO).size(640, 480).parent("canvas2");
        model = await handpose.load("my_model/model.json");
        video.elt.onloadeddata = detect;
    };
}

new p5(sketch2);

async function detect() {
    if (video.elt.readyState === 4) {
        let hands = await model.estimateHands(video.elt);
        if (hands.length > 0) {
            pose = getPose(hands[0].landmarks);
            poseConfidence = hands[0].handInViewConfidence;
        } else {
            pose = "none"; poseConfidence = 0;
        }
    }
    requestAnimationFrame(detect);
}

// Bewegung der Rechtecke
function moveRectangles() {
    for (let i = rectangles.length - 1; i >= 0; i--) {
        let box = rectangles[i];

        if (pose === "one") {
            continue; // Rechtecke bleiben stehen
        } else if (pose === "two") {
            box.x += box.dirX * box.speed * 1.5; // Stärker nach links/rechts 
            box.y += box.dirY * box.speed * 0.3; // Weniger nach oben/unten
        } else {
            box.x += box.dirX * box.speed;
            box.y += box.dirY * box.speed;
        }

        if (box.x < -50 || box.x > 690 || box.y < -50 || box.y > 530) {
            rectangles.splice(i, 1);
        }
    }
}


// Rechtecke zeichnen
function drawRectangles(p) {
    p.noFill();
    p.stroke(0);
    p.strokeWeight(2);
    for (let box of rectangles) p.rect(box.x, box.y, box.w, box.h);
}

// Neue Rechtecke erzeugen
function spawnNewRectangles(p) {
    if (p.frameCount % 1 === 0) {
        let angle = p.random(p.TWO_PI);
        rectangles.push({
            x: p.width / 2, y: p.height / 2,
            w: p.random(20, 50), h: p.random(20, 50),
            speed: p.random(5, 10), dirX: p.cos(angle), dirY: p.sin(angle)
        });
    }
}

// Pose-Wahrscheinlichkeit anzeigen
function displayPoseConfidence() {
    document.getElementById('pose-confidence').textContent = `Pose: ${pose} (${(poseConfidence * 100).toFixed(1)}%)`;
}

// Pose anhand der Finger bestimmen
function getPose(landmarks) {
    let raisedFingers = [8, 12].filter(i => landmarks[i][1] < landmarks[i - 2][1]).length;
    return raisedFingers === 1 ? "one" : raisedFingers === 2 ? "two" : "none";
}
