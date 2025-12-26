// ================= CAMERA =================
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment" }
  });
  video.srcObject = stream;
  render();
}

document.getElementById("startButton").onclick = startCamera;

// ================= RESIZE =================
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

// ================= DATA =================
const state = JSON.parse(localStorage.getItem("ghoststack_data")) || {
  pallet: { w: 48, d: 40 },
  manifest: []
};

// ================= ORIENTATION =================
function getOrientations(box) {
  if (box.upright) {
    return [
      { w: box.w, h: box.h, d: box.d },
      { w: box.d, h: box.h, d: box.w }
    ];
  }
  return [
    { w: box.w, h: box.h, d: box.d },
    { w: box.w, h: box.d, d: box.h },
    { w: box.h, h: box.w, d: box.d },
    { w: box.h, h: box.d, d: box.w },
    { w: box.d, h: box.w, d: box.h },
    { w: box.d, h: box.h, d: box.w }
  ];
}

// ================= PALLET SIM =================
function planPallet(manifest, pallet) {
  let layers = [];
  let currentLayer = { z: 0, boxes: [], cursorX: 0, cursorY: 0, rowDepth: 0 };

  for (let box of manifest) {
    let placed = false;
    let bestFit = null;
    let bestScore = -Infinity;

    for (let o of getOrientations(box)) {
      if (o.w > pallet.w || o.d > pallet.d) continue;

      const footprint = o.w * o.d;
      const score = footprint / o.h;

      if (score > bestScore) {
        bestScore = score;
        bestFit = o;
      }
    }

    if (!bestFit) continue;

    if (currentLayer.cursorX + bestFit.w > pallet.w) {
      currentLayer.cursorX = 0;
      currentLayer.cursorY += currentLayer.rowDepth;
      currentLayer.rowDepth = 0;
    }

    if (currentLayer.cursorY + bestFit.d > pallet.d) {
      layers.push(currentLayer);
      currentLayer = {
        z: currentLayer.z + bestFit.h,
        boxes: [],
        cursorX: 0,
        cursorY: 0,
        rowDepth: 0
      };
    }

    currentLayer.boxes.push({
      ...bestFit,
      x: currentLayer.cursorX,
      y: currentLayer.cursorY,
      z: currentLayer.z
    });

    currentLayer.cursorX += bestFit.w;
    currentLayer.rowDepth = Math.max(currentLayer.rowDepth, bestFit.d);
  }

  layers.push(currentLayer);
  return layers;
}

// ================= PLAN ONCE =================
const palletPlan = planPallet(state.manifest, state.pallet);

// ================= DRAW =================
function drawGhostBox(box) {
  const scale = 3;
  const bw = box.w * scale;
  const bh = box.h * scale;
  const bd = box.d * scale * 0.6;

  const cx = canvas.width / 2;
  const cy = canvas.height * 0.65;

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath();
  ctx.ellipse(cx + bw / 2, cy + bh, bw * 0.5, bh * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Front
  ctx.fillStyle = "rgba(0,255,160,0.45)";
  ctx.fillRect(cx, cy, bw, bh);

  // Top
  ctx.fillStyle = "rgba(200,255,230,0.55)";
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + bd, cy - bd);
  ctx.lineTo(cx + bw + bd, cy - bd);
  ctx.lineTo(cx + bw, cy);
  ctx.closePath();
  ctx.fill();

  // Side
  ctx.fillStyle = "rgba(0,220,140,0.45)";
  ctx.beginPath();
  ctx.moveTo(cx + bw, cy);
  ctx.lineTo(cx + bw + bd, cy - bd);
  ctx.lineTo(cx + bw + bd, cy + bh - bd);
  ctx.lineTo(cx + bw, cy + bh);
  ctx.closePath();
  ctx.fill();
}

// ================= RENDER =================
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Pallet outline
  ctx.strokeStyle = "yellow";
  ctx.lineWidth = 3;
  ctx.strokeRect(
    canvas.width * 0.25,
    canvas.height * 0.65,
    canvas.width * 0.5,
    canvas.width * 0.35
  );

  if (palletPlan.length && palletPlan[0].boxes.length) {
    drawGhostBox(palletPlan[0].boxes[0]);
  }

  requestAnimationFrame(render);
}
