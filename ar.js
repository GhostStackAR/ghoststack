const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

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

// Stack state
let stack = [];
let cumulativeDrift = { x: 0, y: 0 };

// Manifest (future boxes)
let manifest = [
  { w: 16, h: 12, d: 12 },
  { w: 16, h: 12, d: 12 },
  { w: 16, h: 12, d: 12 }
];

let worldPallet = null;

// Resize
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

// Camera start
async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment" }
  });
  video.srcObject = stream;
  streamStarted = true;
  draw();
}

// Pallet detection (screen-space)
function detectPallet() {
  return {
    x: canvas.width * 0.25,
    y: canvas.height * 0.6,
    w: canvas.width * 0.5,
    h: canvas.width * 0.35,
    tilt: 0.55
  };
}

// Estimate lighting
function estimateLightDirection() {
  ctx.drawImage(video, 0, 0, 64, 64);
  const d = ctx.getImageData(0, 0, 64, 64).data;

  let lx = 0, ly = 0;
  for (let i = 0; i < d.length; i += 4) {
    const lum = (d[i] + d[i+1] + d[i+2]) / 3;
    const x = (i / 4) % 64;
    const y = Math.floor(i / 4 / 64);
    lx += (x - 32) * lum;
    ly += (32 - y) * lum;
  }
  return { x: lx, y: ly };
}

// Compute stability correction
function computeStabilityOffset(box, pallet) {
  let offsetX = 0;

  const palletCenter = pallet.w / 2;
  let totalMass = 0;
  let weightedX = 0;

  stack.forEach(b => {
    const mass = b.w * b.d * b.h;
    weightedX += (b.x + b.w / 2) * mass;
    totalMass += mass;
  });

  if (totalMass > 0) {
    const comX = weightedX / totalMass;
    const drift = comX - palletCenter;

    // Compensate lean quietly
    offsetX -= drift * 0.4;
  }

  // Clamp correction
  const maxShift = pallet.w * 0.15;
  offsetX = Math.max(-maxShift, Math.min(maxShift, offsetX));

  return offsetX;
}

// Draw pallet
function drawPallet(p) {
  ctx.strokeStyle = "rgba(255,255,0,0.8)";
  ctx.lineWidth = 3;
  ctx.strokeRect(p.x, p.y, p.w, p.h);
}

// Draw ghost box with stability compensation
function drawGhostBox(pallet, box, light) {
  const scale = pallet.w / palletRef.w;
  const bw = box.w * scale;
  const bh = box.h * scale;
  const bd = box.d * scale * pallet.tilt;

  let baseX = pallet.x + pallet.w * 0.05;
  let baseY = pallet.y + pallet.h - bh - stack.length * bh;

  const stabilityShift = computeStabilityOffset(box, pallet);
  baseX += stabilityShift;

  // Lighting normalize
  const mag = Math.hypot(light.x, light.y) || 1;
  const lx = light.x / mag;
  const ly = light.y / mag;

  const frontL = Math.max(0.4, 0.7 + ly * 0.3);
  const sideL = Math.max(0.35, 0.5 + lx * 0.3);
  const topL = Math.max(0.35, 0.6 - ly * 0.4);

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(baseX + bw / 2, baseY + bh, bw * 0.55, bh * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Front
  ctx.fillStyle = `rgba(0,200,150,${frontL})`;
  ctx.fillRect(baseX, baseY, bw, bh);

  // Top
  ctx.fillStyle = `rgba(180,255,220,${topL})`;
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.lineTo(baseX + bd, baseY - bd);
  ctx.lineTo(baseX + bw + bd, baseY - bd);
  ctx.lineTo(baseX + bw, baseY);
  ctx.closePath();
  ctx.fill();

  // Side
  ctx.fillStyle = `rgba(0,180,130,${sideL})`;
  ctx.beginPath();
  ctx.moveTo(baseX + bw, baseY);
  ctx.lineTo(baseX + bw + bd, baseY - bd);
  ctx.lineTo(baseX + bw + bd, baseY + bh - bd);
  ctx.lineTo(baseX + bw, baseY + bh);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.strokeRect(baseX, baseY, bw, bh);
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

// Click handling
canvas.onclick = () => {
  if (!palletConfirmed) {
    worldPallet = detectPallet();
    palletConfirmed = true;
  } else {
    // User "places" box
    const last = manifest.shift();
    stack.push({
      ...last,
      x: worldPallet.w * 0.05,
      y: stack.length
    });
  }
};

// Auto-start camera
startCamera();
