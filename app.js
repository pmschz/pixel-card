// ---------- Friend Group Wrapped ----------

const SUPERLATIVES = [
  "The Group's Hype Person",
  "Master of the Late-Night Text",
  "Chief Meme Officer",
  "Most Likely to Start a Road Trip on a Whim",
  "The One Who Remembers Everyone's Birthday",
  "Certified Overthinker",
  "The Group's Personal DJ",
  "Best Advice Giver",
  "Most Likely to Fall Asleep First",
  "The Planner Who Actually Plans",
  "Group Chat's Funniest Human",
  "Most Likely to Say 'One More Episode'",
  "The Emotional Support Friend",
  "The One With the Best Playlists",
  "Group's Official Photographer",
  "Most Likely to Show Up Fashionably Late",
  "The Friend Who Always Has Snacks",
  "Most Likely to Turn a Small Plan Into an Event",
  "The One Who Keeps Everyone Sane",
  "Group's Resident Trivia Champion",
  "Most Likely to Text 'omg guess what' at 2am",
  "The Friend Who Gives the Best Hugs",
  "Most Likely to Win an Argument With Random Facts",
  "The Group's Ray of Sunshine",
];

const VIBE_STATS = [
  () => `${randInt(500, 9999)} group chat messages sent`,
  () => `${randInt(5, 99)} inside jokes created`,
  () => `${randInt(3, 40)} times someone said "I'm never doing that again"`,
  () => `${randInt(70, 100)}% collective vibe rating`,
  () => `${randInt(20, 90)}% of plans made last minute`,
  () => `${randInt(1, 15)} minor dramas survived`,
  () => `${randInt(10, 60)} memes shared after midnight`,
  () => `${randInt(80, 100)}% chance someone is down for food right now`,
  () => `${randInt(2, 25)} group photos with someone's eyes closed`,
  () => `${randInt(1, 12)} "we should hang out more" texts sent`,
];

const GRADIENTS = [
  ["#1DB954", "#0a5c2b"],
  ["#8b5cf6", "#3b0764"],
  ["#f43f5e", "#7f1d1d"],
  ["#3b82f6", "#0c1e3e"],
  ["#f59e0b", "#7c2d12"],
  ["#ec4899", "#4a044e"],
];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function gradientCss(i) {
  const [a, b] = GRADIENTS[i % GRADIENTS.length];
  return `linear-gradient(160deg, ${a}, ${b})`;
}

// ---------- DOM refs ----------
const setupScreen = document.getElementById("setupScreen");
const wrappedScreen = document.getElementById("wrappedScreen");
const groupNameInput = document.getElementById("groupNameInput");
const friendNameInput = document.getElementById("friendNameInput");
const addFriendBtn = document.getElementById("addFriendBtn");
const friendChips = document.getElementById("friendChips");
const setupError = document.getElementById("setupError");
const generateBtn = document.getElementById("generateBtn");
const progressRow = document.getElementById("progressRow");
const slideStage = document.getElementById("slideStage");
const tapLeft = document.getElementById("tapLeft");
const tapRight = document.getElementById("tapRight");
const exitBtn = document.getElementById("exitBtn");
const recapCanvas = document.getElementById("recapCanvas");

let friends = [];
let slides = [];
let currentIndex = 0;
let recap = null; // { groupName, mvp, sample superlatives } used for the download card

// ---------- friend chips ----------
function renderChips() {
  friendChips.innerHTML = "";
  friends.forEach((name, i) => {
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.textContent = name;
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "×";
    removeBtn.addEventListener("click", () => {
      friends.splice(i, 1);
      renderChips();
    });
    chip.appendChild(removeBtn);
    friendChips.appendChild(chip);
  });
}

function addFriend() {
  const name = friendNameInput.value.trim();
  if (!name || friends.includes(name)) return;
  friends.push(name);
  friendNameInput.value = "";
  renderChips();
  friendNameInput.focus();
}

addFriendBtn.addEventListener("click", addFriend);
friendNameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") { e.preventDefault(); addFriend(); }
});

// ---------- build slides ----------
function buildSlides() {
  const groupName = groupNameInput.value.trim() || "Our Friend Group";
  const shuffledFriends = shuffle(friends);
  const shuffledTitles = shuffle(SUPERLATIVES);
  const assignments = shuffledFriends.map((name, i) => ({
    name,
    title: shuffledTitles[i % shuffledTitles.length],
  }));
  const mvp = shuffledFriends[randInt(0, shuffledFriends.length - 1)];
  const vibeStats = shuffle(VIBE_STATS).slice(0, 3).map((fn) => fn());

  recap = { groupName, mvp, sample: assignments.slice(0, 3) };

  const built = [];
  built.push({ type: "intro", groupName });
  built.push({ type: "squad", groupName, friends: shuffledFriends });
  assignments.forEach((a) => built.push({ type: "superlative", name: a.name, title: a.title }));
  built.push({ type: "vibe", groupName, stats: vibeStats });
  built.push({ type: "mvp", name: mvp });
  built.push({ type: "outro", groupName });
  return built;
}

// ---------- slide rendering ----------
function renderProgress() {
  progressRow.innerHTML = "";
  slides.forEach((_, i) => {
    const seg = document.createElement("div");
    seg.className = "progress-seg" + (i <= currentIndex ? " filled" : "");
    progressRow.appendChild(seg);
  });
}

function makeBlobs() {
  return `
    <div class="blob" style="width:160px;height:160px;top:-60px;left:-50px;"></div>
    <div class="blob" style="width:120px;height:120px;bottom:-40px;right:-40px;"></div>
  `;
}

function slideHTML(slide, colorIndex) {
  switch (slide.type) {
    case "intro":
      return `
        ${makeBlobs()}
        <div class="slide-eyebrow">WRAPPED 2026</div>
        <div class="slide-title">${escapeHtml(slide.groupName)}</div>
        <div class="slide-sub">tap to see your friend group's year ➔</div>
      `;
    case "squad":
      return `
        ${makeBlobs()}
        <div class="slide-eyebrow">THIS YEAR YOUR SQUAD HAD</div>
        <div class="slide-big-number">${slide.friends.length}</div>
        <div class="slide-title" style="font-size:22px;">LEGENDS</div>
        <div class="slide-chip-list">${slide.friends.map((n) => `<span>${escapeHtml(n)}</span>`).join("")}</div>
      `;
    case "superlative":
      return `
        ${makeBlobs()}
        <div class="slide-eyebrow">🏆 SUPERLATIVE AWARD</div>
        <div class="slide-title" style="font-size:24px;">${escapeHtml(slide.title)}</div>
        <div class="slide-big-number" style="font-size:44px;">${escapeHtml(slide.name)}</div>
      `;
    case "vibe":
      return `
        ${makeBlobs()}
        <div class="slide-eyebrow">${escapeHtml(slide.groupName).toUpperCase()}'S YEAR IN NUMBERS</div>
        <div class="slide-stat-list">${slide.stats.map((s) => `<div>${escapeHtml(s)}</div>`).join("")}</div>
      `;
    case "mvp":
      return `
        ${makeBlobs()}
        <div class="slide-eyebrow">🏆 FRIEND OF THE YEAR</div>
        <div class="slide-title" style="font-size:40px;">${escapeHtml(slide.name)}</div>
        <div class="slide-sub">the glue holding this whole group together</div>
      `;
    case "outro":
      return `
        ${makeBlobs()}
        <div class="slide-eyebrow">THAT'S A WRAP</div>
        <div class="slide-title">${escapeHtml(slide.groupName)}</div>
        <div class="slide-sub">here's to another year of chaos and good times</div>
        <button id="downloadRecapBtn" class="slide-download-btn">DOWNLOAD RECAP</button>
        <button id="restartBtn" class="slide-restart-btn">START OVER</button>
      `;
    default:
      return "";
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function renderSlide() {
  const slide = slides[currentIndex];
  slideStage.style.background = gradientCss(currentIndex);
  slideStage.innerHTML = slideHTML(slide, currentIndex);
  renderProgress();

  const downloadBtn = document.getElementById("downloadRecapBtn");
  if (downloadBtn) downloadBtn.addEventListener("click", (e) => { e.stopPropagation(); downloadRecap(); });
  const restartBtn = document.getElementById("restartBtn");
  if (restartBtn) restartBtn.addEventListener("click", (e) => { e.stopPropagation(); exitToSetup(); });
}

function nextSlide() {
  if (currentIndex < slides.length - 1) {
    currentIndex++;
    renderSlide();
  }
}

function prevSlide() {
  if (currentIndex > 0) {
    currentIndex--;
    renderSlide();
  }
}

tapLeft.addEventListener("click", prevSlide);
tapRight.addEventListener("click", nextSlide);
window.addEventListener("keydown", (e) => {
  if (wrappedScreen.classList.contains("hidden")) return;
  if (e.key === "ArrowRight") nextSlide();
  if (e.key === "ArrowLeft") prevSlide();
  if (e.key === "Escape") exitToSetup();
});

// ---------- screen transitions ----------
function validateSetup() {
  if (friends.length < 2) {
    setupError.classList.remove("hidden");
    return false;
  }
  setupError.classList.add("hidden");
  return true;
}

generateBtn.addEventListener("click", () => {
  if (!validateSetup()) return;
  slides = buildSlides();
  currentIndex = 0;
  setupScreen.classList.add("hidden");
  wrappedScreen.classList.remove("hidden");
  renderSlide();
});

function exitToSetup() {
  wrappedScreen.classList.add("hidden");
  setupScreen.classList.remove("hidden");
}

exitBtn.addEventListener("click", exitToSetup);

// ---------- recap download ----------
function downloadRecap() {
  const cctx = recapCanvas.getContext("2d");
  const cw = recapCanvas.width, ch = recapCanvas.height;
  const [c1, c2] = GRADIENTS[(slides.length - 1) % GRADIENTS.length];
  const grad = cctx.createLinearGradient(0, 0, cw, ch);
  grad.addColorStop(0, c1);
  grad.addColorStop(1, c2);
  cctx.fillStyle = grad;
  cctx.fillRect(0, 0, cw, ch);

  cctx.textAlign = "center";
  cctx.fillStyle = "rgba(255,255,255,0.85)";
  cctx.font = "800 13px -apple-system, Arial, sans-serif";
  cctx.fillText("WRAPPED 2026", cw / 2, 60);

  cctx.fillStyle = "#fff";
  cctx.font = "900 28px -apple-system, Arial, sans-serif";
  wrapCanvasText(cctx, recap.groupName, cw / 2, 100, cw - 60, 32);

  cctx.font = "800 14px -apple-system, Arial, sans-serif";
  cctx.fillStyle = "rgba(255,255,255,0.85)";
  cctx.fillText("FRIEND OF THE YEAR", cw / 2, 220);
  cctx.font = "900 26px -apple-system, Arial, sans-serif";
  cctx.fillStyle = "#fff";
  cctx.fillText(recap.mvp, cw / 2, 254);

  let y = 320;
  cctx.font = "700 13px -apple-system, Arial, sans-serif";
  recap.sample.forEach((a) => {
    cctx.fillStyle = "rgba(255,255,255,0.95)";
    cctx.fillText(a.name, cw / 2, y);
    cctx.fillStyle = "rgba(255,255,255,0.75)";
    cctx.font = "600 11px -apple-system, Arial, sans-serif";
    y += 16;
    y = wrapCanvasText(cctx, a.title, cw / 2, y, cw - 60, 14) + y - 14;
    cctx.font = "700 13px -apple-system, Arial, sans-serif";
    y += 24;
  });

  cctx.fillStyle = "rgba(255,255,255,0.6)";
  cctx.font = "600 10px -apple-system, Arial, sans-serif";
  cctx.fillText("made with Friend Group Wrapped", cw / 2, ch - 20);

  const link = document.createElement("a");
  link.download = `${recap.groupName.toLowerCase().replace(/\s+/g, "-")}-wrapped.png`;
  link.href = recapCanvas.toDataURL("image/png");
  link.click();
}

function wrapCanvasText(context, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let curY = y;
  for (const word of words) {
    const test = line + word + " ";
    if (context.measureText(test).width > maxWidth && line !== "") {
      context.fillText(line.trim(), x, curY);
      line = word + " ";
      curY += lineHeight;
    } else {
      line = test;
    }
  }
  context.fillText(line.trim(), x, curY);
  return curY;
}
