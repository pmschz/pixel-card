// ---------- Pixel Card: a tiny virtual card for a friend ----------

const MESSAGES = [
  "{name}, your kindness makes the world softer.",
  "You always know how to make people smile, {name}!",
  "{name} is proof that good friends really do exist.",
  "Thanks for always being there, {name}!",
  "{name}, you light up every room you walk into.",
  "Being your friend is one of my favorite things, {name}.",
  "{name} gives the best advice and the best laughs.",
  "You make hard days easier, {name}.",
  "{name}, your laugh is contagious in the best way.",
  "The world needs more people like you, {name}.",
  "{name}, you're the kind of friend everyone hopes for.",
  "Just so you know {name}... you matter a lot.",
];

// pixel sprites: 'x' = main color, 'r' = accent color, '.' = transparent
const SPRITES = {
  heart: [
    ".xx.xx.",
    "xxxxxxx",
    "xxxxxxx",
    ".xxxxx.",
    "..xxx..",
    "...x...",
  ],
  star: [
    "...x...",
    "..xxx..",
    "xxxxxxx",
    ".xxxxx.",
    "..x.x..",
    ".x...x.",
  ],
  gift: [
    "..rr...",
    ".rrrrr.",
    "xxxxxxx",
    "xx.r.xx",
    "xxxrxxx",
    "xx.r.xx",
    "xxxxxxx",
  ],
};

function drawSprite(ctx, sprite, x, y, size, mainColor, accentColor) {
  for (let row = 0; row < sprite.length; row++) {
    const line = sprite[row];
    for (let col = 0; col < line.length; col++) {
      const ch = line[col];
      if (ch === ".") continue;
      ctx.fillStyle = ch === "r" ? accentColor : mainColor;
      ctx.fillRect(Math.round(x + col * size), Math.round(y + row * size), size, size);
    }
  }
}

const COLORS = ["#ff5c8a", "#ffd54a", "#3ecf6e", "#4ad0ff", "#c77dff", "#ff9d3d"];
const ACCENT = "#ffd54a";

// ---------- DOM refs ----------
const toInput = document.getElementById("toInput");
const fromInput = document.getElementById("fromInput");
const messageInput = document.getElementById("messageInput");
const shuffleBtn = document.getElementById("shuffleBtn");
const iconPicker = document.getElementById("iconPicker");
const colorPicker = document.getElementById("colorPicker");
const cardCanvas = document.getElementById("cardCanvas");
const downloadBtn = document.getElementById("downloadBtn");
const ctx = cardCanvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

let selectedIcon = "heart";
let selectedColor = COLORS[0];

// ---------- pickers ----------
function buildIconPicker() {
  iconPicker.innerHTML = "";
  Object.keys(SPRITES).forEach((key) => {
    const btn = document.createElement("button");
    btn.className = "icon-btn" + (key === selectedIcon ? " selected" : "");
    const mini = document.createElement("canvas");
    mini.width = 28; mini.height = 24;
    const mctx = mini.getContext("2d");
    mctx.imageSmoothingEnabled = false;
    drawSprite(mctx, SPRITES[key], 0, 0, 4, "#ffe9a8", ACCENT);
    btn.appendChild(mini);
    btn.addEventListener("click", () => {
      selectedIcon = key;
      [...iconPicker.children].forEach((c) => c.classList.remove("selected"));
      btn.classList.add("selected");
      renderCard();
    });
    iconPicker.appendChild(btn);
  });
}

function buildColorPicker() {
  colorPicker.innerHTML = "";
  COLORS.forEach((color, i) => {
    const btn = document.createElement("button");
    btn.className = "swatch" + (i === 0 ? " selected" : "");
    btn.style.background = color;
    btn.addEventListener("click", () => {
      selectedColor = color;
      [...colorPicker.children].forEach((c) => c.classList.remove("selected"));
      btn.classList.add("selected");
      renderCard();
    });
    colorPicker.appendChild(btn);
  });
}

// ---------- message ----------
function randomMessage() {
  const template = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
  const name = toInput.value.trim() || "friend";
  return template.replace("{name}", name);
}

shuffleBtn.addEventListener("click", () => {
  messageInput.value = randomMessage();
  renderCard();
});

// ---------- card rendering ----------
function wrapText(context, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  const lines = [];
  for (const word of words) {
    const test = line + word + " ";
    if (context.measureText(test).width > maxWidth && line !== "") {
      lines.push(line.trim());
      line = word + " ";
    } else {
      line = test;
    }
  }
  lines.push(line.trim());
  lines.forEach((l, i) => context.fillText(l, x, y + i * lineHeight));
  return lines.length;
}

function renderCard() {
  const cw = cardCanvas.width, ch = cardCanvas.height;
  const to = toInput.value.trim() || "Friend";
  const from = fromInput.value.trim();
  const message = messageInput.value.trim() || randomMessage();

  ctx.fillStyle = "#fff2f2";
  ctx.fillRect(0, 0, cw, ch);

  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = i % 2 === 0 ? selectedColor : "#ffe9a8";
    ctx.lineWidth = 2;
    ctx.strokeRect(4 + i * 3, 4 + i * 3, cw - 8 - i * 6, ch - 8 - i * 6);
  }

  drawSprite(ctx, SPRITES.heart, 10, 10, 2, selectedColor, ACCENT);
  drawSprite(ctx, SPRITES.star, cw - 24, 10, 2, selectedColor, ACCENT);
  drawSprite(ctx, SPRITES.heart, 10, ch - 24, 2, selectedColor, ACCENT);
  drawSprite(ctx, SPRITES.star, cw - 24, ch - 24, 2, selectedColor, ACCENT);

  drawSprite(ctx, SPRITES[selectedIcon], cw / 2 - 21, 22, 6, selectedColor, ACCENT);

  ctx.fillStyle = "#2c1a3d";
  ctx.font = "10px 'Press Start 2P', monospace";
  ctx.textAlign = "center";
  ctx.fillText(`FOR ${to.toUpperCase()}`, cw / 2, 76);

  ctx.font = "7px 'Press Start 2P', monospace";
  ctx.fillStyle = "#4a2e6b";
  wrapText(ctx, message, cw / 2, 92, cw - 40, 11);

  if (from) {
    ctx.font = "7px 'Press Start 2P', monospace";
    ctx.fillStyle = "#c23a63";
    ctx.fillText(`- ${from}`, cw / 2, ch - 12);
  }
}

// ---------- events ----------
[toInput, fromInput, messageInput].forEach((el) => {
  el.addEventListener("input", renderCard);
});

downloadBtn.addEventListener("click", () => {
  const to = toInput.value.trim() || "friend";
  const link = document.createElement("a");
  link.download = `pixel-card-${to.toLowerCase().replace(/\s+/g, "-")}.png`;
  link.href = cardCanvas.toDataURL("image/png");
  link.click();
});

// ---------- init ----------
buildIconPicker();
buildColorPicker();
messageInput.value = randomMessage();
renderCard();
