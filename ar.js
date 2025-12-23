const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const startButton = document.getElementById("startButton");
const startScreen = document.getElementById("startScreen");

const settingsBtn = document.getElementById("settingsBtn");
const settingsPanel = document.getElementById("settingsPanel");
const boxList = document.getElementById("boxList");

let streamStarted = false;
let palletConfirmed = false;
let detectedPallet = null;

// Default box manifest (inches)
let manifest = [
  { w: 16, h: 12, d: 12 },
  { w: 20, h: 14, d: 10 }
];

video.style.width = "100vw";
video.style.height = "100vh";
video.style.objectFit = "cover";

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

// Camera start
startButton.onclick = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment" }
  });
  video.srcObject = stream;
  streamStarted = true;
  startScreen.style.display = "none";
  draw();
};

// Settings UI
settingsBtn.onclick = () => {
  renderManifest();
  settingsPanel.style.display = "block";
};

function closeSettings() {
  settingsPanel.style.display = "none";
}

function renderManifest() {
  boxList.innerHTML = "";
  manifest.forEach((box, i) => {
    boxList.innerHTML += `
      <div>
        Box ${i + 1} —
        W <input value="${box.w}" onchange="manifest[${i}].w=this.value">
        H <input value="${box.h}" onchange="manifest[${i}].h=this.value">
        D <input value="${box.d}" onchange="manifest[${i}].d=this.value">
      </div>
    `;
  });
}

function addBox() {
  manifest.push({ w: 12, h: 12, d: 12 });
  renderManifest();
}

// Simulated pallet (edge detection placeholder)
function simulatePallet() {
  return {
    x: canvas.width * 0.25,
    y: canvas.height * 0.6,
    w: canvas.width * 0.5,
    h: canvas.height * 0.2
  };
}

// Draw 3D box
function draw3DBox(x, y, w, h, d) {
  const depth = d * 0.6;

  // Front
  ctx.fillStyle = "rgba(0,255,136,0.45)";
  ctx.fillRect(x, y, w, h);

  // Top
  ctx.fillStyle = "rgba(0,255,136,0.3)";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + depth, y - depth);
  ctx.lineTo(x + w + depth, y - depth);
  ctx.lineTo(x + w, y);
  ctx.closePath();
  ctx.fill();

  // Side
  ctx.fillStyle = "rgba(0,255,136,0.25)";
  ctx.beginPath();
  ctx.moveTo(x + w, y);
  ctx.lineTo(x + w + depth, y - depth);
  ctx.lineTo(x + w + depth, y + h - depth);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#00ff88";
  ctx.strokeRect(x, y, w, h);
}

// Main loop
function draw() {
  if (!streamStarted) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!palletConfirmed) {
    detectedPallet = simulatePallet();
    ctx.strokeStyle = "yellow";
    ctx.lineWidth = 4;
    ctx.strokeRect(detectedPallet.x, detectedPallet.y, detectedPallet.w, detectedPallet.h);

    ctx.fillStyle = "white";
    ctx.fillText("Tap pallet to confirm", detectedPallet.x, detectedPallet.y - 10);
  } else {
    const p = detectedPallet;
    const box = manifest[0];

    const scale = p.w / 48; // GMA pallet width reference
    const bw = box.w * scale;
    const bh = box.h * scale;
    const bd = box.d * scale;

    const bx = p.x + 10;
    const by = p.y + p.h - bh;

    draw3DBox(bx, by, bw, bh, bd);
    ctx.fillStyle = "white";
    ctx.fillText("Place next box here", bx, by - 10);
  }

  requestAnimationFrame(draw);
}

canvas.onclick = () => {
  if (!palletConfirmed) palletConfirmed = true;
};
