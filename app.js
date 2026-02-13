const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const penBtn = document.getElementById("penBtn");
const eraserBtn = document.getElementById("eraserBtn");
const textBtn = document.getElementById("textBtn");

const lineBtn = document.getElementById("lineBtn");
const dottedBtn = document.getElementById("dottedBtn");
const arrowBtn = document.getElementById("arrowBtn");
const doubleArrowBtn = document.getElementById("doubleArrowBtn");
const rectBtn = document.getElementById("rectBtn");
const circleBtn = document.getElementById("circleBtn");

const sizeEl = document.getElementById("size");
const sizeVal = document.getElementById("sizeVal");

const fontFamilyEl = document.getElementById("fontFamily");
const fontSizeEl = document.getElementById("fontSize");
const fontSizeVal = document.getElementById("fontSizeVal");
const boldBtn = document.getElementById("boldBtn");
const textBgBtn = document.getElementById("textBgBtn");

const colorEl = document.getElementById("color");
const bgColorEl = document.getElementById("bgColor");
const swatches = document.querySelectorAll(".swatch");

const gridBtn = document.getElementById("gridBtn");

const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const clearBtn = document.getElementById("clearBtn");

const savePngBtn = document.getElementById("savePngBtn");
const saveJpgBtn = document.getElementById("saveJpgBtn");

const themeBtn = document.getElementById("themeBtn");

let drawing = false;
let tool = "pen"; // pen | eraser | text | line | dotted | arrow | doubleArrow | rect | circle

let brushSize = Number(sizeEl.value);
let brushColor = colorEl.value;

let bgColor = "#ffffff";
let showGrid = false;

let undoStack = [];
let redoStack = [];

let startX = 0;
let startY = 0;
let snapshot = null;

// smoother pen
let lastX = 0;
let lastY = 0;

// text overlay
let textBox = null;
let textX = 0;
let textY = 0;

let isBold = false;
let textBg = false;

// ---------- Helpers ----------
function resizeCanvas() {
  const temp = document.createElement("canvas");
  temp.width = canvas.width;
  temp.height = canvas.height;
  temp.getContext("2d").drawImage(canvas, 0, 0);

  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.floor(rect.width * devicePixelRatio);
  canvas.height = Math.floor(rect.height * devicePixelRatio);

  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

  fillBackground();
  ctx.drawImage(temp, 0, 0);

  if (showGrid) drawGrid();
}

function fillBackground() {
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  canvas.style.background = bgColor;
}

function pushUndo() {
  undoStack.push(canvas.toDataURL());
  if (undoStack.length > 50) undoStack.shift();
  redoStack = [];
}

function setupBrush() {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = brushSize;
  ctx.miterLimit = 2;
}

function setTool(newTool) {
  tool = newTool;

  const allBtns = [
    penBtn, eraserBtn, textBtn,
    lineBtn, dottedBtn, arrowBtn, doubleArrowBtn,
    rectBtn, circleBtn
  ];

  allBtns.forEach(btn => btn.classList.remove("active"));

  if (tool === "pen") penBtn.classList.add("active");
  if (tool === "eraser") eraserBtn.classList.add("active");
  if (tool === "text") textBtn.classList.add("active");

  if (tool === "line") lineBtn.classList.add("active");
  if (tool === "dotted") dottedBtn.classList.add("active");
  if (tool === "arrow") arrowBtn.classList.add("active");
  if (tool === "doubleArrow") doubleArrowBtn.classList.add("active");

  if (tool === "rect") rectBtn.classList.add("active");
  if (tool === "circle") circleBtn.classList.add("active");
}

function getPosFromEvent(e) {
  const rect = canvas.getBoundingClientRect();

  if (e.touches && e.touches[0]) {
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top
    };
  }

  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

// ---------- Grid ----------
function drawGrid() {
  const rect = canvas.getBoundingClientRect();
  const step = 25;

  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = "rgba(0,0,0,0.08)";
  ctx.lineWidth = 1;

  for (let x = 0; x < rect.width; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, rect.height);
    ctx.stroke();
  }

  for (let y = 0; y < rect.height; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(rect.width, y);
    ctx.stroke();
  }

  ctx.restore();
}

// ---------- Shapes ----------
function drawArrow(x1, y1, x2, y2, doubleHead = false) {
  const headLength = Math.max(10, brushSize * 2);

  const dx = x2 - x1;
  const dy = y2 - y1;
  const angle = Math.atan2(dy, dx);

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  drawArrowHead(x2, y2, angle, headLength);

  if (doubleHead) {
    drawArrowHead(x1, y1, angle + Math.PI, headLength);
  }
}

function drawArrowHead(x, y, angle, headLength) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(
    x - headLength * Math.cos(angle - Math.PI / 6),
    y - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    x - headLength * Math.cos(angle + Math.PI / 6),
    y - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.lineTo(x, y);
  ctx.stroke();
}

// ---------- Drawing ----------
function startDraw(e) {
  const pos = getPosFromEvent(e);
  startX = pos.x;
  startY = pos.y;

  lastX = pos.x;
  lastY = pos.y;

  if (tool === "text") {
    openTextBox(startX, startY);
    return;
  }

  drawing = true;
  pushUndo();
  snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);

  if (tool === "pen" || tool === "eraser") {
    ctx.beginPath();
    ctx.moveTo(startX, startY);
  }
}

function draw(e) {
  if (!drawing) return;

  const pos = getPosFromEvent(e);
  setupBrush();

  if (
    tool === "line" || tool === "dotted" ||
    tool === "arrow" || tool === "doubleArrow" ||
    tool === "rect" || tool === "circle"
  ) {
    ctx.putImageData(snapshot, 0, 0);
  }

  // eraser
  if (tool === "eraser") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.strokeStyle = "rgba(0,0,0,1)";
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    return;
  }

  // pen (smooth)
  if (tool === "pen") {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = brushColor;

    const midX = (lastX + pos.x) / 2;
    const midY = (lastY + pos.y) / 2;

    ctx.quadraticCurveTo(lastX, lastY, midX, midY);
    ctx.stroke();

    lastX = pos.x;
    lastY = pos.y;
    return;
  }

  // shapes
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = brushColor;

  if (tool === "dotted") ctx.setLineDash([10, 10]);
  else ctx.setLineDash([]);

  if (tool === "line" || tool === "dotted") {
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (tool === "arrow") {
    ctx.setLineDash([]);
    drawArrow(startX, startY, pos.x, pos.y, false);
  }

  if (tool === "doubleArrow") {
    ctx.setLineDash([]);
    drawArrow(startX, startY, pos.x, pos.y, true);
  }

  if (tool === "rect") {
    ctx.setLineDash([]);
    const w = pos.x - startX;
    const h = pos.y - startY;
    ctx.strokeRect(startX, startY, w, h);
  }

  if (tool === "circle") {
    ctx.setLineDash([]);
    const r = Math.sqrt(Math.pow(pos.x - startX, 2) + Math.pow(pos.y - startY, 2));
    ctx.beginPath();
    ctx.arc(startX, startY, r, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function stopDraw() {
  drawing = false;
  ctx.closePath();
  ctx.setLineDash([]);
}

// ---------- TEXT PRO ----------
function openTextBox(x, y) {
  if (textBox) {
    textBox.remove();
    textBox = null;
  }

  pushUndo();

  const wrap = document.querySelector(".canvasWrap");
  const wrapRect = wrap.getBoundingClientRect();

  textX = x;
  textY = y;

  textBox = document.createElement("textarea");
  textBox.className = "textAreaOverlay";
  textBox.placeholder = "Type text...\nEnter = new line\nCtrl + Enter = place\nEsc = cancel";

  // position
  textBox.style.left = `${x + wrapRect.left + 12}px`;
  textBox.style.top = `${y + wrapRect.top + 12}px`;

  // live preview
  textBox.style.fontSize = `${fontSizeEl.value}px`;
  textBox.style.fontFamily = fontFamilyEl.value;
  textBox.style.fontWeight = isBold ? "800" : "600";

  document.body.appendChild(textBox);
  textBox.focus();

  textBox.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      cancelText();
    }

    if (e.ctrlKey && e.key === "Enter") {
      e.preventDefault();
      placeText();
    }
  });

  textBox.addEventListener("blur", () => {
    placeText();
  });
}

function placeText() {
  if (!textBox) return;

  const text = textBox.value.trim();
  textBox.remove();
  textBox = null;

  if (!text) return;

  const fontSize = Number(fontSizeEl.value);
  const fontFamily = fontFamilyEl.value;
  const weight = isBold ? "800" : "600";

  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.textBaseline = "top";
  ctx.font = `${weight} ${fontSize}px ${fontFamily}`;

  const lines = text.split("\n");
  const lineHeight = fontSize * 1.25;

  // background box
  if (textBg) {
    const paddingX = 16;
    const paddingY = 12;

    let maxWidth = 0;
    lines.forEach((line) => {
      maxWidth = Math.max(maxWidth, ctx.measureText(line).width);
    });

    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(
      textX - 8,
      textY - 8,
      maxWidth + paddingX,
      lines.length * lineHeight + paddingY
    );
  }

  ctx.fillStyle = brushColor;

  lines.forEach((line, i) => {
    ctx.fillText(line, textX, textY + i * lineHeight);
  });

  ctx.restore();

  if (showGrid) drawGrid();
}

function cancelText() {
  if (!textBox) return;
  textBox.remove();
  textBox = null;
}

// ---------- Controls ----------
sizeEl.addEventListener("input", () => {
  brushSize = Number(sizeEl.value);
  sizeVal.textContent = brushSize;
});

fontSizeEl.addEventListener("input", () => {
  fontSizeVal.textContent = fontSizeEl.value;
});

boldBtn.addEventListener("click", () => {
  isBold = !isBold;
  boldBtn.classList.toggle("active", isBold);
});

textBgBtn.addEventListener("click", () => {
  textBg = !textBg;
  textBgBtn.classList.toggle("active", textBg);
});

colorEl.addEventListener("input", () => {
  brushColor = colorEl.value;
  setTool("pen");
});

swatches.forEach((btn) => {
  btn.addEventListener("click", () => {
    brushColor = btn.dataset.color;
    colorEl.value = brushColor;
    setTool("pen");
  });
});

bgColorEl.addEventListener("input", () => {
  bgColor = bgColorEl.value;
  fillBackground();
  if (showGrid) drawGrid();
});

gridBtn.addEventListener("click", () => {
  showGrid = !showGrid;
  gridBtn.classList.toggle("active", showGrid);

  const img = new Image();
  img.onload = () => {
    fillBackground();
    ctx.drawImage(img, 0, 0);
    if (showGrid) drawGrid();
  };
  img.src = canvas.toDataURL();
});

// Tools
penBtn.addEventListener("click", () => setTool("pen"));
eraserBtn.addEventListener("click", () => setTool("eraser"));
textBtn.addEventListener("click", () => setTool("text"));

lineBtn.addEventListener("click", () => setTool("line"));
dottedBtn.addEventListener("click", () => setTool("dotted"));
arrowBtn.addEventListener("click", () => setTool("arrow"));
doubleArrowBtn.addEventListener("click", () => setTool("doubleArrow"));

rectBtn.addEventListener("click", () => setTool("rect"));
circleBtn.addEventListener("click", () => setTool("circle"));

// Undo/Redo
undoBtn.addEventListener("click", () => {
  if (!undoStack.length) return;

  redoStack.push(canvas.toDataURL());
  const last = undoStack.pop();

  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    fillBackground();
    ctx.drawImage(img, 0, 0);
    if (showGrid) drawGrid();
  };
  img.src = last;
});

redoBtn.addEventListener("click", () => {
  if (!redoStack.length) return;

  undoStack.push(canvas.toDataURL());
  const next = redoStack.pop();

  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    fillBackground();
    ctx.drawImage(img, 0, 0);
    if (showGrid) drawGrid();
  };
  img.src = next;
});

// Clear
clearBtn.addEventListener("click", () => {
  pushUndo();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  fillBackground();
  if (showGrid) drawGrid();
});

// Save
function downloadImage(type) {
  const link = document.createElement("a");
  link.download = type === "jpg" ? "canvas.jpg" : "canvas.png";
  link.href = canvas.toDataURL(type === "jpg" ? "image/jpeg" : "image/png", 0.95);
  link.click();
}

savePngBtn.addEventListener("click", () => downloadImage("png"));
saveJpgBtn.addEventListener("click", () => downloadImage("jpg"));

// Theme
themeBtn.addEventListener("click", () => {
  document.body.classList.toggle("light");
  themeBtn.textContent = document.body.classList.contains("light") ? "☀️" : "🌙";
});

// Shortcuts
window.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key.toLowerCase() === "z") {
    e.preventDefault();
    undoBtn.click();
  }
  if (e.ctrlKey && e.key.toLowerCase() === "y") {
    e.preventDefault();
    redoBtn.click();
  }
});

// Mobile smoothness
canvas.style.touchAction = "none";

// Events
canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mousemove", draw);
window.addEventListener("mouseup", stopDraw);

canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  startDraw(e);
}, { passive: false });

canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  draw(e);
}, { passive: false });

canvas.addEventListener("touchend", stopDraw, { passive: false });

// Init
window.addEventListener("resize", resizeCanvas);
fillBackground();
resizeCanvas();
setTool("pen");
sizeVal.textContent = brushSize;
fontSizeVal.textContent = fontSizeEl.value;
