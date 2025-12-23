const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const startButton = document.getElementById("startButton");
const startScreen = document.getElementById("startScreen");

let streamStarted = false;
let palletConfirmed = false;

// Device orientation
let pitch = 0;

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

// Request motion permission (iOS requires this)
async function requestMotionPermission() {
  if (
    typeof DeviceOrientationEvent !== "undefined" &&
    typeof DeviceOrientationEvent.requestPermission === "function"
  ) {
    try {
      const response = await DeviceOrientationEvent.requestPermission();
      if (response !== "granted") {
        alert("Motion permission denied.");
      }
    } catch (e) {
      console.error(e);
    }
  }
}

// Listen for tilt
window.addEventListener("deviceorientation", (event) => {
  // beta = front/back tilt
  if (event.beta !== null) {
    pitch = event.beta;
  }
});

// Start camera
startButton.addEventListener("click", async () => {
  if (streamStarted) return;

  await requestMotionPermission();

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

  // Normalize pitch (-90 to 90 → 0 to 1)
  const tiltFactor = Math.min(Math.max((pitch + 90) / 180, 0.15), 0.85);

  const floorY = canvas.height * 0.78;

  const palletWidth = canvas.width * 0.55;
  const baseDepth = canvas.height * 0.25;

  // Perspective-adjusted depth
  const palletDepth = baseDepth * tiltFactor;

  const palletX = (canvas.width - palletWidth) / 2;
  const palletY = floorY - palletDepth;

  // Draw pallet trapezoid (perspective)
  ctx.strokeStyle = "yellow";
  ctx.lineWidth = 4;

  const nearShrink = 0.9;
  const farShrink = 0.6;

  const nearWidth = palletWidth * nearShrink;
  const farWidth = palletWidth * farShrink;

  const nearX = (canvas.width - nearWidth) / 2;
  const farX = (canvas.width - farWidth) / 2;

  ctx.beginPath();
  ctx.moveTo(nearX, palletY + palletDepth);
  ctx.lineTo(nearX + nearWidth, palletY + palletDepth);
  ctx.lineTo(farX + farWidth, palletY);
  ctx.lineTo(farX, palletY);
  ctx.closePath();
  ctx.stroke();

  ctx.fillStyle = "white";
  ctx.font = "18px Arial";

  if (!palletConfirmed) {
    ctx.fillText(
      "Align pallet inside frame, then TAP to confirm",
      nearX,
      palletY - 15
    );
  } else {
    // Ghost box (locked to pallet plane)
    const boxWidth = nearWidth * 0.3;
    const boxHeight = palletDepth * 0.6;

    const boxX = nearX + nearWidth * 0.05;
    const boxY = palletY + palletDepth - boxHeight;

    ctx.fillStyle = "rgba(0, 255, 136, 0.45)";
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

    ctx.strokeStyle = "#00ff88";
    ctx.lineWidth = 3;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

    ctx.fillStyle = "white";
    ctx.fillText("Place next box here", boxX, boxY - 10);
  }

  requestAnimationFrame(draw);
}
