// ===== CAMERA & CANVAS =====
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let streamStarted = false;

// ===== MANIFEST STORAGE =====
let manifest = JSON.parse(localStorage.getItem("ghoststack_manifest")) || [];

function saveManifest() {
  localStorage.setItem("ghoststack_manifest", JSON.stringify(manifest));
}

function renderManifest() {
  const container = document.getElementById("manualManifest");
  container.innerHTML = "";

  manifest.forEach((box, index) => {
    const div = document.createElement("div");
    div.className = "box-entry";

    div.innerHTML = `
      <strong>Box ${index + 1}</strong>

      <label>Width</label>
      <input type="number" value="${box.width}" onchange="updateBox(${index}, 'width', this.value)">

      <label>Height</label>
      <input type="number" value="${box.height}" onchange="updateBox(${index}, 'height', this.value)">

      <label>Depth</label>
      <input type="number" value="${box.depth}" onchange="updateBox(${index}, 'depth', this.value)">

      <label>Weight (optional)</label>
      <input type="number" value="${box.weight || ''}" onchange="updateBox(${index}, 'weight', this.value)">

      <label>Max Load On Top (optional)</label>
      <input type="number" value="${box.maxLoad || ''}" onchange="updateBox(${index}, 'maxLoad', this.value)">

      <label>
        <input type="checkbox" ${box.uprightRequired ? "checked" : ""}
          onchange="updateBox(${index}, 'uprightRequired', this.checked)">
        Must stay upright
      </label>

      <button onclick="removeBox(${index})">Remove</button>
    `;

    container.appendChild(div);
  });
}

function addBox() {
  manifest.push({
    width: 16,
    height: 12,
    depth: 12,
    uprightRequired: false
  });
  saveManifest();
  renderManifest();
}

function updateBox(index, field, value) {
  if (field === "uprightRequired") {
    manifest[index][field] = value;
  } else {
    manifest[index][field] = value === "" ? undefined : Number(value);
  }
  saveManifest();
}

function removeBox(index) {
  manifest.splice(index, 1);
  saveManifest();
  renderManifest();
}

// ===== SETTINGS UI =====
const settingsPanel = document.getElementById("settingsPanel");
document.getElementById("settingsBtn").onclick = () => {
  settingsPanel.style.display = "block";
  renderManifest();
};

function closeSettings() {
  settingsPanel.style.display = "none";
}

function showAddManifest() {
  alert("Manifest import coming soon (CSV / WMS / API)");
}

// ===== CAMERA =====
async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment" }
  });
  video.srcObject = stream;
  streamStarted = true;
  draw();
}

document.getElementById("startButton").onclick = startCamera;

// ===== DRAW LOOP =====
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

function draw() {
  if (!streamStarted) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Placeholder pallet
  ctx.strokeStyle = "yellow";
  ctx.lineWidth = 3;
  ctx.strokeRect(
    canvas.width * 0.25,
    canvas.height * 0.6,
    canvas.width * 0.5,
    canvas.width * 0.35
  );

  if (manifest.length > 0) {
    ctx.fillStyle = "rgba(0,255,150,0.4)";
    ctx.fillRect(
      canvas.width * 0.3,
      canvas.height * 0.55,
      120,
      80
    );
    ctx.fillStyle = "white";
    ctx.fillText("Next box", canvas.width * 0.3, canvas.height * 0.53);
  }

  requestAnimationFrame(draw);
}
