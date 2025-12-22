// ==========================
// PALLET DEFINITIONS
// ==========================
const palletTypes = {
  GMA:  { width:1.22, depth:1.02, ratio:1.196 },
  Euro: { width:1.20, depth:0.80, ratio:1.5 }
};

let currentPallet = null;
let palletLocked = false;
let palletWidth, palletDepth;

// ==========================
// UI ELEMENTS
// ==========================
const video = document.getElementById("camera");
const instruction = document.getElementById("instruction");
const palletConfirm = document.getElementById("palletConfirm");
const palletText = document.getElementById("palletText");
const confirmYes = document.getElementById("confirmYes");
const confirmNo = document.getElementById("confirmNo");

// ==========================
// OPENCV
// ==========================
let cap, src, gray, edges;

function initCV() {
  cap = new cv.VideoCapture(video);
  src = new cv.Mat(video.videoHeight, video.videoWidth, cv.CV_8UC4);
  gray = new cv.Mat();
  edges = new cv.Mat();
}

// ==========================
// THREE.JS
// ==========================
let scene, camera3D, renderer, ghostBox;

function initThree() {
  scene = new THREE.Scene();
  camera3D = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 100);
  camera3D.position.set(0,5,8);
  camera3D.lookAt(0,0,0);

  renderer = new THREE.WebGLRenderer({ alpha:true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  ghostBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.5,0.3,0.5),
    new THREE.MeshBasicMaterial({ color:0x00ff00, transparent:true, opacity:0.5 })
  );
  scene.add(ghostBox);
}

// ==========================
// PALLET DETECTION
// ==========================
let suggestedPallet = null;

function estimatePalletType(corners) {
  const w = Math.hypot(corners[1].x - corners[0].x, corners[1].y - corners[0].y);
  const h = Math.hypot(corners[3].x - corners[0].x, corners[3].y - corners[0].y);
  const ratio = Math.max(w,h) / Math.min(w,h);

  let best = null, diff = Infinity;
  for (let type in palletTypes) {
    const d = Math.abs(palletTypes[type].ratio - ratio);
    if (d < diff) { diff = d; best = type; }
  }
  return best;
}

// ==========================
// PALLET CONFIRMATION
// ==========================
confirmYes.onclick = () => {
  currentPallet = suggestedPallet;
  palletWidth = palletTypes[currentPallet].width;
  palletDepth = palletTypes[currentPallet].depth;
  palletLocked = true;

  palletConfirm.style.display = "none";
  instruction.innerText = `${currentPallet} pallet locked`;

  generatePlan();
};

confirmNo.onclick = () => {
  suggestedPallet = null;
  palletConfirm.style.display = "none";
  instruction.innerText = "Reposition pallet in frame";
};

// ==========================
// PALLET PLANNER
// ==========================
let palletPlan = [];
let currentStep = 0;

const incomingBoxes = Array.from({ length:20 }, (_,i)=>({
  id:i,
  width:0.4,
  depth:0.3,
  height:0.3,
  weight:10
}));

function generatePlan() {
  palletPlan = [];
  currentStep = 0;

  let x=0, z=0, y=0;
  for (let box of incomingBoxes) {
    if (x + box.width > palletWidth) {
      x = 0;
      z += box.depth;
    }
    if (z + box.depth > palletDepth) {
      z = 0;
      y += box.height;
    }
    palletPlan.push({
      planned:{ x,y,z },
      actual:null
    });
    x += box.width;
  }
}

// ==========================
// ADAPTATION & STABILITY
// ==========================
function adaptFuture(step, error) {
  for (let i = step+1; i < palletPlan.length; i++) {
    palletPlan[i].planned.x += error.dx * 0.5;
    palletPlan[i].planned.z += error.dz * 0.5;
  }
}

function computeLean() {
  let offset=0, height=0;
  for (let s of palletPlan) {
    if (!s.actual) continue;
    offset += Math.abs(s.actual.x - s.planned.x);
    height = Math.max(height, s.actual.y);
  }
  return Math.atan(offset / Math.max(height,0.1));
}

// ==========================
// MAIN LOOP
// ==========================
function loop() {
  cap.read(src);
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
  cv.Canny(gray, edges, 50, 150);

  if (!palletLocked) {
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    for (let i=0;i<contours.size();i++) {
      let cnt = contours.get(i);
      let approx = new cv.Mat();
      cv.approxPolyDP(cnt, approx, 0.02 * cv.arcLength(cnt,true), true);
      if (approx.rows === 4) {
        const corners=[];
        for (let j=0;j<4;j++) {
          corners.push({ x:approx.intPtr(j,0)[0], y:approx.intPtr(j,0)[1] });
        }
        suggestedPallet = estimatePalletType(corners);
        palletText.innerText = `Detected ${suggestedPallet} pallet. Is this correct?`;
        palletConfirm.style.display="block";
        approx.delete();
        break;
      }
      approx.delete();
    }
    contours.delete(); hierarchy.delete();
  }

  if (palletLocked && palletPlan[currentStep]) {
    const slot = palletPlan[currentStep].planned;
    ghostBox.position.set(slot.x, slot.y+0.15, slot.z);
  }

  renderer.render(scene, camera3D);
  requestAnimationFrame(loop);
}

// ==========================
// START
// ==========================
navigator.mediaDevices.getUserMedia({ video:true }).then(stream=>{
  video.srcObject = stream;
  video.onloadedmetadata = ()=>{
    initCV();
    initThree();
    loop();
  };
});
