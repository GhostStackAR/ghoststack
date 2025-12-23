const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const startButton = document.getElementById("startButton");
const startScreen = document.getElementById("startScreen");

let streamStarted = false;
let palletConfirmed = false;

// Fullscreen video
video.style.position = "fixed";
video.style.top = "0";
video.style.left = "0";
video.style.width = "100vw";
video.style.height = "100vh";
video.style.objectFit = "cover";
video.style.zIndex = "1";

canvas.style.position = "fixed";
canvas.style.top = "0";
canvas.style.left = "0";
canvas.style.zIndex = "2";

// Resize canvas
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

// Start camera
startButton.addEventListener("click", async () => {
  if (streamStarted) return;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false
    });

    video.srcObject = stream;
    streamStarted = true;
    startScreen.style.display = "none";
    requestAnimationFrame(draw);

  } catch (err) {
    alert("Camera access failed.");
    console.error(err);
  }
});

// Tap to confirm pallet
canvas.addEventListener("click", () => {
  if (!palletConfirmed) {
    palletConfirmed = true;
  }
});

// MAIN LOOP
function draw() {
  if (!streamStarted) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const floorY = canvas.height * 0.75;

  const palletWidth = canvas.width * 0.55;
  const palletDepth = canvas.height * 0.18;

  const palletX = (canvas.width - palletWidth) / 2;
  const palletY = floorY - palletDepth;

  // --- PALLET GUIDANCE ---
  ctx.strokeStyle = "yellow";
  ctx.lineWidth = 4;
  ctx.strokeRect(palletX, palletY, palletWidth, palletDepth);

  ctx.fillStyle = "white";
  ctx.font = "18px Arial";

  if (!palletConfirmed) {
    // STEP 1: CONFIRM PALLET
    ctx.fillText(
      "Align pallet inside frame, then TAP to confirm",
      palletX,
      palletY - 15
    );
  } else {
    // STEP 2: STACKING MODE

    // Ghost box placement
    const boxWidth = palletWidth * 0.3;
    const boxHeight = palletDepth * 0.6;

    const boxX = palletX + palletWidth * 0.05;
    const boxY = palletY + palletDepth - boxHeight;

    ctx.fillStyle = "rgba(0, 255, 136, 0.4)";
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

    ctx.strokeStyle = "#00ff88";
    ctx.lineWidth = 3;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

    ctx.fillStyle = "white";
    ctx.fillText("Place next box here", boxX, boxY - 10);
  }

  requestAnimationFrame(draw);
}
