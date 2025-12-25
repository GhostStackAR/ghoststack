// ===== CAMERA =====
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let streamStarted = false;

// ===== NAVIGATION =====
const settingsPanel = document.getElementById("settingsPanel");
const manifestPanel = document.getElementById("manifestPanel");

document.getElementById("settingsBtn").onclick = () => {
  settingsPanel.style.display = "block";
};

function showSettings() {
  manifestPanel.style.display = "none";
  settingsPanel.style.display = "block";
}

function showManualManifest() {
  settingsPanel.style.display = "none";
  manifestPanel.style.display = "block";
  renderManifest();
}

function showAR() {
  settingsPanel.style.display = "none";
  manifestPanel.style.display = "none";
}

// ===== MANIFEST + UNITS =====
let data = JSON.parse(localStorage.getItem("ghoststack_data")) || {
  units: { dimension: "in", weight: "lb" },
  manifest: []
};

function save() {
  localStorage.setItem("ghoststack_data", JSON.stringify(data));
}

function updateUnits() {
  data.units.dimension = document.getElementById("dimensionUnit").value;
  data.units.weight = document.getElementById("weightUnit").value;
  save();
}

function renderManifest() {
  document.getElementById("dimensionUnit").value = data.units.dimension;
  document.getElementById("weightUnit").value = data.units.weight;

  const container = document.getElementById("manualManifest");
  container.innerHTML = "";

  data.manifest.forEach((box, i) => {
    const div = document.createElement("div");
    div.className = "box-entry";

    div.innerHTML = `
      <strong>Box ${i + 1}</strong>

      <label>Width (${data.units.dimension})</label>
      <input type="number" value="${box.w}" onchange="updateBox(${i}, 'w', this.value)">

      <label>Height (${data.units.dimension})</label>
      <input type="number" value="${box.h}" onchange="updateBox(${i}, 'h', this.value)">

      <label>Depth (${data.units.dimension})</label>
      <input type="number" value="${box.d}" onchange="updateBox(${i}, 'd', this.value)">

      <label>Weight (${data.units.weight}, optional)</label>
      <input type="number" value="${box.weight || ''}" onchange="updateBox(${i}, 'weight', this.value)">

      <label>Max Load On Top (${data.units.weight}, optional)</label>
      <input type="number" value="${box.maxLoad || ''}" onchange="updateBox(${i}, 'maxLoad', this.value)">

      <label>
        <input type="checkbox" ${box.upright ? "checked" : ""}
          onchange="updateBox(${i}, 'upright', this.checked)">
        Must remain upright
      </label>

      <button onclick="removeBox(${i})">Remove</button>
    `;
    container.appendChild(div);
  });
}

function addBox() {
  data.manifest.push({ w: 16, h: 12, d: 12, upright: false });
  save();
  renderManifest();
}

function updateBox(i, field, value) {
  data.manifest[i][field] =
    field === "upright" ? value : value === "" ? undefined : Number(value);
  save();
}

function removeBox(i) {
  data.manifest.splice(i, 1);
  save();
  renderManifest();
}

// ===== CAMERA START =====
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

  ctx.strokeStyle = "yellow";
  ctx.lineWidth = 3;
  ctx.strokeRect(
    canvas.width * 0.25,
    canvas.height * 0.6,
    canvas.width * 0.5,
    canvas.width * 0.35
  );

  if (data.manifest.length > 0) {
    ctx.fillStyle = "rgba(0,255,150,0.4)";
    ctx.fillRect(
      canvas.width * 0.32,
      canvas.height * 0.55,
      120,
      80
    );
    ctx.fillStyle = "white";
    ctx.fillText("Next box", canvas.width * 0.32, canvas.height * 0.53);
  }

  requestAnimationFrame(draw);
}
