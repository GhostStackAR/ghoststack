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
let pallet = null;

// Default manifest (inches)
let manifest = [
  { w: 16, h: 12, d: 12 }
];

// Camera setup
video.style.width = "100vw";
video.style.height = "100vh";
video.style.objectFit = "cover";

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

// Start camera
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
  renderManifest();
  settingsPanel.style.display = "block";
};

function closeSettings() {
  settingsPanel.style.display = "none";
}

function renderManifest() {
  boxList.innerHTML = "";
  manifest.forEach((b, i) => {
    boxList.innerHTML += `
      <div>
        Box ${i + 1} —
        W <input value="${b.w}" onchange="manifest[${i}].w=this.value">
        H <input value="${b.h}" onchange="manifest[${i}].h=this.value">
        D <input value="${b.d}" onchange="manifest[${i}].d=this.value">
      </div>
    `;
  });
}

function addBox() {
  manifest.push({ w: 12, h: 12, d: 12 });
  renderManifest();
}

// Simulated pallet detection (placeholder)
function detectPallet() {
  return {
    x: canvas.width * 0.25,
    y: canvas.height * 0.62,
    w: canvas.width * 0.5,
    h: canvas.height * 0.18,
    tilt: 0.55 // perspective factor
  };
}

// Draw pallet
function drawPallet(p) {
  ctx.strokeStyle = "rgba(255,255,0,0.9)";
  ctx.lineWidth = 4;
  ctx.strokeRect(p.x, p.y, p.w, p.h);
}

// Realistic 3D ghost box
function drawGhostBox(pallet, box) {
  const scale = pallet.w / 48; // GMA pallet width
  const bw = box.w * scale;
  const bh = box.h * scale;
  const bd = box.d * scale * pallet.tilt;

  const x = pallet.x + pallet.w * 0.05;
  const y = pallet.y + pallet.h - bh;

  // Contact shadow
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(
    x + bw / 2,
    y + bh,
    bw * 0.55,
    bh * 0.15,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Front face gradient
  const frontGrad = ctx.createLinearGradient(x, y, x, y + bh);
  frontGrad.addColorStop(0, "rgba(0,255,160,0.55)");
  frontGrad.addColorStop(1, "rgba(0,180,120,0.55)");
  ctx.fillStyle = frontGrad;
  ctx.fillRect(x, y, bw, bh);

  // Top face
  ctx.fillStyle = "rgba(180,255,220,0.35)";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + bd, y - bd);
  ctx.lineTo(x + bw + bd, y - bd);
  ctx.lineTo(x + bw, y);
  ctx.closePath();
  ctx.fill();

  // Side face
  ctx.fillStyle = "rgba(0,200,140,0.35)";
  ctx.beginPath();
  ctx.moveTo(x + bw, y);
  ctx.lineTo(x + bw + bd, y - bd);
  ctx.lineTo(x + bw + bd, y + bh - bd);
  ctx.lineTo(x + bw, y + bh);
  ctx.closePath();
  ctx.fill();

  // Edge highlights
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, bw, bh);

  // Instruction
  ctx.fillStyle = "white";
  ctx.font = "18px Arial";
  ctx.fillText("Place next box here", x, y - 12);
}

// Main loop
function draw() {
  if (!streamStarted) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!palletConfirmed) {
    pallet = detectPallet();
    drawPallet(pallet);
    ctx.fillStyle = "white";
    ctx.fillText("Tap pallet to confirm", pallet.x, pallet.y - 10);
  } else {
    drawGhostBox(pallet, manifest[0]);
  }

  requestAnimationFrame(draw);
}

// Confirm pallet
canvas.onclick = () => {
  if (!palletConfirmed) palletConfirmed = true;
};
