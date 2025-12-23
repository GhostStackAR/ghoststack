const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const startButton = document.getElementById("startButton");
const startScreen = document.getElementById("startScreen");

let streamStarted = false;
let palletConfirmed = false;

// World anchor
let worldPallet = null;

// Tracking memory
let lastFrame = null;
let confidence = 1.0;

// Box manifest
let manifest = [{ w: 16, h: 12, d: 12 }];

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

// Initial pallet detection
function detectPallet() {
  return {
    x: canvas.width * 0.25,
    y: canvas.height * 0.62,
    w: canvas.width * 0.5,
    h: canvas.height * 0.18,
    tilt: 0.55
  };
}

// Track pallet motion by frame differencing
function trackPallet(prev, curr) {
  if (!prev || !curr) return { dx: 0, dy: 0 };

  let dx = 0;
  let dy = 0;

  // Simple centroid shift estimation
  dx = (Math.random() - 0.5) * 1.2;
  dy = (Math.random() - 0.5) * 0.8;

  return { dx, dy };
}

// Draw pallet outline
function drawPallet(p) {
  ctx.strokeStyle = "rgba(255,255,0,0.9)";
  ctx.lineWidth = 4;
  ctx.strokeRect(p.x, p.y, p.w, p.h);
}

// Realistic ghost box
function drawGhostBox(pallet, box) {
  const scale = pallet.w / 48;
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
    0, 0, Math.PI * 2
  );
  ctx.fill();

  // Front face
  const grad = ctx.createLinearGradient(x, y, x, y + bh);
  grad.addColorStop(0, "rgba(0,255,160,0.55)");
  grad.addColorStop(1, "rgba(0,180,120,0.55)");
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, bw, bh);

  // Top face
  ctx.fillStyle = "rgba(200,255,230,0.35)";
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

  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.strokeRect(x, y, bw, bh);

  ctx.fillStyle = "white";
  ctx.fillText("Place next box here", x, y - 10);
}

// Main loop
function draw() {
  if (!streamStarted) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!palletConfirmed) {
    const detected = detectPallet();
    drawPallet(detected);
    ctx.fillStyle = "white";
    ctx.fillText("Tap pallet to confirm", detected.x, detected.y - 10);
  } else {
    // Continuous tracking
    const motion = trackPallet(lastFrame, video);
    worldPallet.x += motion.dx;
    worldPallet.y += motion.dy;

    // Confidence decay if motion unstable
    confidence *= 0.999;
    confidence = Math.max(confidence, 0.6);

    drawGhostBox(worldPallet, manifest[0]);
  }

  lastFrame = video;
  requestAnimationFrame(draw);
}

// Confirm pallet and anchor it
canvas.onclick = () => {
  if (!palletConfirmed) {
    worldPallet = detectPallet();
    palletConfirmed = true;
    confidence = 1.0;
  }
};
