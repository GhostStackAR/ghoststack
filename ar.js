const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const startButton = document.getElementById("startButton");
const startScreen = document.getElementById("startScreen");
const settingsBtn = document.getElementById("settingsBtn");
const settingsPanel = document.getElementById("settingsPanel");

const palletSelect = document.getElementById("palletSelect");
const palletWInput = document.getElementById("palletW");
const palletDInput = document.getElementById("palletD");

let streamStarted = false;
let palletConfirmed = false;

// Pallet standards (inches)
const PALLETS = {
  GMA: { w: 48, d: 40 },
  EURO: { w: 47.2, d: 31.5 },
  JIS: { w: 43.3, d: 43.3 },
  AU: { w: 45.9, d: 45.9 }
};

// Active pallet reference
let palletRef = { ...PALLETS.GMA };

// World-locked pallet
let worldPallet = null;

// Box manifest
let manifest = [{ w: 16, h: 12, d: 12 }];

// Resize
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

// Camera
startButton.onclick = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment" }
  });
  video.srcObject = stream;
  streamStarted = true;
  startScreen.style.display = "none";
  draw();
};

// Settings
settingsBtn.onclick = () => {
  palletWInput.value = palletRef.w;
  palletDInput.value = palletRef.d;
  settingsPanel.style.display = "block";
};

function closeSettings() {
  settingsPanel.style.display = "none";
}

function applyPalletSettings() {
  const type = palletSelect.value;

  if (type === "CUSTOM") {
    palletRef.w = parseFloat(palletWInput.value);
    palletRef.d = parseFloat(palletDInput.value);
  } else {
    palletRef = { ...PALLETS[type] };
  }

  palletConfirmed = false;
  worldPallet = null;
  closeSettings();
}

// Initial pallet detection (screen-space)
function detectPallet() {
  return {
    x: canvas.width * 0.25,
    y: canvas.height * 0.62,
    w: canvas.width * 0.5,
    h: canvas.height * (palletRef.d / palletRef.w) * 0.5,
    tilt: 0.55
  };
}

// Draw pallet
function drawPallet(p) {
  ctx.strokeStyle = "rgba(255,255,0,0.9)";
  ctx.lineWidth = 4;
  ctx.strokeRect(p.x, p.y, p.w, p.h);
}

// Draw ghost box (scaled by pallet standard)
function drawGhostBox(pallet, box) {
  const scale = pallet.w / palletRef.w;

  const bw = box.w * scale;
  const bh = box.h * scale;
  const bd = box.d * scale * pallet.tilt;

  const x = pallet.x + pallet.w * 0.05;
  const y = pallet.y + pallet.h - bh;

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(x + bw / 2, y + bh, bw * 0.55, bh * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Front face
  const grad = ctx.createLinearGradient(x, y, x, y + bh);
  grad.addColorStop(0, "rgba(0,255,160,0.55)");
  grad.addColorStop(1, "rgba(0,180,120,0.55)");
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, bw, bh);

  // Top
  ctx.fillStyle = "rgba(200,255,230,0.35)";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + bd, y - bd);
  ctx.lineTo(x + bw + bd, y - bd);
  ctx.lineTo(x + bw, y);
  ctx.closePath();
  ctx.fill();

  // Side
  ctx.fillStyle = "rgba(0,200,140,0.35)";
  ctx.beginPath();
  ctx.moveTo(x + bw, y);
  ctx.lineTo(x + bw + bd, y - bd);
  ctx.lineTo(x + bw + bd, y + bh - bd);
  ctx.lineTo(x + bw, y + bh);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.strokeRect(x, y, bw, bh);
}

// Main loop
function draw() {
  if (!streamStarted) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!palletConfirmed) {
    const p = detectPallet();
    drawPallet(p);
    ctx.fillStyle = "white";
    ctx.fillText("Tap pallet to confirm", p.x, p.y - 10);
  } else {
    drawGhostBox(worldPallet, manifest[0]);
  }

  requestAnimationFrame(draw);
}

// Confirm pallet
canvas.onclick = () => {
  if (!palletConfirmed) {
    worldPallet = detectPallet();
    palletConfirmed = true;
  }
};
