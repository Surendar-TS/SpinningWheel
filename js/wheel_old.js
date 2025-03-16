// wheel.js

let wheelCanvas = document.getElementById('wheelCanvas');
let ctx = wheelCanvas.getContext('2d');
let arc = Math.PI / 6; // Adjust based on the number of names
let spinAngleStart = 0;
let spinTime = 0;
let spinTimeTotal = 0;
let startAngle = 0;
let names = [];

function drawWheel(namesArray) {
    names = namesArray;
    arc = 2 * Math.PI / names.length;
    ctx.clearRect(0, 0, wheelCanvas.width, wheelCanvas.height);
    for (let i = 0; i < names.length; i++) {
        let angle = startAngle + i * arc;
        ctx.fillStyle = getColor(i, names.length);
        ctx.beginPath();
        ctx.arc(wheelCanvas.width / 2, wheelCanvas.height / 2, wheelCanvas.width / 2, angle, angle + arc, false);
        ctx.arc(wheelCanvas.width / 2, wheelCanvas.height / 2, 0, angle + arc, angle, true);
        ctx.fill();
        ctx.save();
        ctx.fillStyle = "white";
        ctx.translate(wheelCanvas.width / 2 + Math.cos(angle + arc / 2) * wheelCanvas.width / 4, wheelCanvas.height / 2 + Math.sin(angle + arc / 2) * wheelCanvas.height / 4);
        ctx.rotate(angle + arc / 2 + Math.PI / 2);
        ctx.fillText(names[i], -ctx.measureText(names[i]).width / 2, 0);
        ctx.restore();
    }
}

function getColor(item, maxItem) {
    let phase = 0;
    let center = 128;
    let width = 127;
    let frequency = Math.PI * 2 / maxItem;
    let red = Math.sin(frequency * item + 2 + phase) * width + center;
    let green = Math.sin(frequency * item + 0 + phase) * width + center;
    let blue = Math.sin(frequency * item + 4 + phase) * width + center;
    return `rgb(${Math.round(red)},${Math.round(green)},${Math.round(blue)})`;
}

function spinWheel() {
    spinAngleStart = Math.random() * 10 + 10;
    spinTime = 0;
    spinTimeTotal = Math.random() * 3 + 4 * 1000;
    rotateWheel();
}

function rotateWheel() {
    spinTime += 30;
    if (spinTime >= spinTimeTotal) {
        stopRotateWheel();
        return;
    }
    let spinAngle = spinAngleStart - easeOut(spinTime, 0, spinAngleStart, spinTimeTotal);
    startAngle += (spinAngle * Math.PI / 180);
    drawWheel(names);
    setTimeout(rotateWheel, 30);
}

function stopRotateWheel() {
    let degrees = startAngle * 180 / Math.PI + 90;
    let arcd = arc * 180 / Math.PI;
    let index = Math.floor((360 - degrees % 360) / arcd);
    ctx.save();
    ctx.font = 'bold 30px Helvetica, Arial';
    let text = names[index];
    document.getElementById('result').innerText = `Winner: ${text}`;
    ctx.restore();
}

function easeOut(t, b, c, d) {
    let ts = (t /= d) * t;
    let tc = ts * t;
    return b + c * (tc + -3 * ts + 3 * t);
}
