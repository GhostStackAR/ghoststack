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

let palletRef = { ...PALLETS.GMA };
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
  palletRef = type === "CUSTOM"
    ? { w: +palletWInput.value, d: +palletDInput.value }
    : { ...PALLETS[type] };

  palletConfirmed = false;
  worldPallet = null;
  closeSettings();
}

// Detect pallet (screen-space)
function detectPallet() {
  return {
    x: canvas.width * 0.25,
    y: canvas.height * 0.62,
    w: canvas.width * 0.5,
    h: canvas.height * (palletRef.d / palletRef.w) * 0.5,
    tilt: 0.55
  };
}

// Estimate light direction from camera image
function estimateLightDirection() {
  ctx.drawImage(video, 0, 0, 64, 64);
  const data = ctx.getImageData(0, 0, 64, 64).data;

  let left = 0, right = 0, top = 0, bottom = 0;

  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const i = (y * 64 + x) * 4;
      const lum = (data[i] + data[i+1] + data[i+2]) / 3;

      if (x < 32) left += lum;
      else right += lum;
      if (y < 32) top += lum;
      else bottom += lum;
    }
  }

  return {
    x: right - left,
    y: top - bottom
  };
}

// Draw pallet
function drawPallet(p) {
  ctx.strokeStyle = "rgba(255,255,0,0.9)";
  ctx.lineWidth = 4;
  ctx.strokeRect(p.x, p.y, p.w, p.h);
}

// Draw realistic ghost box with dynamic lighting
function drawGhostBox(pallet, box, light) {
  const scale = pallet.w / palletRef.w;
  const bw = box.w * scale;
  const bh = box.h * scale;
  const bd = box.d * scale * pallet.tilt;

  const x = pallet.x + pallet.w * 0.05;
  const y = pallet.y + pallet.h - bh;

  // Normalize light
  const mag = Math.hypot(light.x, light.y) || 1;
  const lx = light.x / mag;
  const ly = light.y / mag;

  const frontLight = Math.max(0.4, 0.7 + ly * 0.3);
  const topLight = Math.max(0.35, 0.6 - ly * 0.4);
  const sideLight = Math.max(0.3, 0.5 + lx * 0.3);

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(x + bw / 2, y + bh, bw * 0.55, bh * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Front face
  ctx.fillStyle = `rgba(0,200,150,${frontLight})`;
  ctx.fillRect(x, y, bw, bh);

  // Top face
  ctx.fillStyle = `rgba(180,255,220,${topLight})`;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + bd, y - bd);
  ctx.lineTo(x + bw + bd, y - bd);
  ctx.lineTo(x + bw, y);
  ctx.closePath();
  ctx.fill();

  // Side face
  ctx.fillStyle = `rgba(0,180,130,${sideLight})`;
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
  const light = estimateLightDirection();

  if (!palletConfirmed) {
    const p = detectPallet();
    drawPallet(p);
    ctx.fillStyle = "white";
    ctx.fillText("Tap pallet to confirm", p.x, p.y - 10);
  } else {
    drawGhostBox(worldPallet, manifest[0], light);
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
