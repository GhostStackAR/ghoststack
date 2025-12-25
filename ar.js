// ================== CAMERA ==================
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

// ================== RESIZE ==================
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

// ================== DATA ==================
const data = JSON.parse(localStorage.getItem("ghoststack_data")) || {
  pallet: { w: 48, d: 40 },
  manifest: []
};

// ================== STACK LOGIC ==================
function getBestPlacement(box) {
  const pallet = data.pallet;
  const scale = 3;

  // Allowed orientations
  let orientations = [];

  if (box.upright) {
    // Top must stay up
    orientations = [
      { w: box.w, h: box.h, d: box.d },
      { w: box.d, h: box.h, d: box.w }
    ];
  } else {
    // Any orientation
    orientations = [
      { w: box.w, h: box.h, d: box.d },
      { w: box.w, h: box.d, d: box.h },
      { w: box.h, h: box.w, d: box.d },
      { w: box.h, h: box.d, d: box.w },
      { w: box.d, h: box.w, d: box.h },
      { w: box.d, h: box.h, d: box.w }
    ];
  }

  // Score orientations (simple heuristic for now)
  let best = orientations[0];
  let bestScore = 0;

  for (let o of orientations) {
    const footprint = o.w * o.d;
    const fits =
      o.w <= pallet.w &&
      o.d <= pallet.d;

    if (!fits) continue;

    const score = footprint / o.h; // prefer stability
    if (score > bestScore) {
      bestScore = score;
      best = o;
    }
  }

  // Center on pallet (stacking layers later)
  return {
    ...best,
    x: pallet.w / 2 - best.w / 2,
    y: pallet.d / 2 - best.d / 2,
    scale
  };
}

// ================== DRAW GHOST ==================
function drawGhost(box) {
  const p = getBestPlacement(box);
  const s = p.scale;

  const bw = p.w * s;
  const bh = p.h * s;
  const bd = p.d * s * 0.6;

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

// ================== RENDER LOOP ==================
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Pallet outline (reference only)
  ctx.strokeStyle = "yellow";
  ctx.lineWidth = 3;
  ctx.strokeRect(
    canvas.width * 0.25,
    canvas.height * 0.65,
    canvas.width * 0.5,
    canvas.width * 0.35
  );

  if (data.manifest.length > 0) {
    drawGhost(data.manifest[0]);
  }

  requestAnimationFrame(render);
}
