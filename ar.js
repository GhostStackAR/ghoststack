const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const startButton = document.getElementById("startButton");
const startScreen = document.getElementById("startScreen");

let streamStarted = false;

// Resize canvas to screen
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

// USER GESTURE REQUIRED (CRITICAL)
startButton.addEventListener("click", async () => {
  if (streamStarted) return;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "environment"
      },
      audio: false
    });

    video.srcObject = stream;
    streamStarted = true;
    startScreen.style.display = "none";
    requestAnimationFrame(draw);

  } catch (err) {
    alert("Camera access denied or unavailable.");
    console.error(err);
  }
});

// MAIN DRAW LOOP
function draw() {
  if (!streamStarted) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw ghost pallet outline (simulated floor-aligned)
  const palletWidth = canvas.width * 0.6;
  const palletDepth = canvas.height * 0.25;

  const palletX = (canvas.width - palletWidth) / 2;
  const palletY = canvas.height * 0.6;

  ctx.strokeStyle = "yellow";
  ctx.lineWidth = 4;
  ctx.strokeRect(palletX, palletY, palletWidth, palletDepth);

  // Draw ghost box snapped to pallet
  const boxWidth = palletWidth * 0.3;
  const boxHeight = palletDepth * 0.4;

  const boxX = palletX + palletWidth * 0.05;
  const boxY = palletY + palletDepth - boxHeight;

  ctx.fillStyle = "rgba(0, 255, 136, 0.4)";
  ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

  ctx.strokeStyle = "#00ff88";
  ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

  requestAnimationFrame(draw);
}
