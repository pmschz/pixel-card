// ---------- Friend Group Wrapped ----------

// Paste your Spotify Client ID from developer.spotify.com/dashboard (Settings tab). No secret needed — this uses PKCE.
const SPOTIFY_CLIENT_ID = "YOUR_SPOTIFY_CLIENT_ID";
const SPOTIFY_REDIRECT_URI = window.location.origin + window.location.pathname;
const SPOTIFY_SCOPES = "user-top-read";

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

const connectSpotifyBtn = document.getElementById("connectSpotifyBtn");
const shareCodeBox = document.getElementById("shareCodeBox");
const shareCodeOutput = document.getElementById("shareCodeOutput");
const copyCodeBtn = document.getElementById("copyCodeBtn");
const friendCodeInput = document.getElementById("friendCodeInput");
const addCodeBtn = document.getElementById("addCodeBtn");
const spotifyError = document.getElementById("spotifyError");

// friends: { name, real, artists?, tracks?, genres? }
let friends = [];
let slides = [];
let currentIndex = 0;
let recap = null; // { groupName, mvp, sample highlights } used for the download card

// ---------- friend chips ----------
function renderChips() {
  friendChips.innerHTML = "";
  friends.forEach((friend, i) => {
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.textContent = (friend.real ? "🎧 " : "") + friend.name;
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
  if (!name || friends.some((f) => f.name === name)) return;
  friends.push({ name, real: false });
  friendNameInput.value = "";
  renderChips();
  friendNameInput.focus();
}

function addFriendByCode() {
  const raw = friendCodeInput.value.trim();
  if (!raw) return;
  try {
    const data = decodeShareCode(raw);
    if (!data || !data.n) throw new Error("bad code");
    if (friends.some((f) => f.name === data.n)) {
      friendCodeInput.value = "";
      return;
    }
    friends.push({ name: data.n, real: true, artists: data.a || [], tracks: data.t || [], genres: data.g || [] });
    friendCodeInput.value = "";
    hideSpotifyError();
    renderChips();
  } catch (e) {
    showSpotifyError("That code doesn't look right — ask your friend to re-copy it.");
  }
}

addFriendBtn.addEventListener("click", addFriend);
friendNameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") { e.preventDefault(); addFriend(); }
});
addCodeBtn.addEventListener("click", addFriendByCode);
friendCodeInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") { e.preventDefault(); addFriendByCode(); }
});

// ---------- Spotify connect (Authorization Code + PKCE) ----------
function randomString(length) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  crypto.getRandomValues(new Uint8Array(length)).forEach((v) => (result += chars[v % chars.length]));
  return result;
}

function base64UrlEncode(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function sha256(text) {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
}

async function startSpotifyLogin() {
  if (!SPOTIFY_CLIENT_ID || SPOTIFY_CLIENT_ID === "YOUR_SPOTIFY_CLIENT_ID") {
    showSpotifyError("Spotify isn't set up yet — add your Client ID at the top of app.js first.");
    return;
  }
  const verifier = randomString(64);
  const challenge = base64UrlEncode(await sha256(verifier));
  const state = randomString(16);
  sessionStorage.setItem("spotify_verifier", verifier);
  sessionStorage.setItem("spotify_state", state);

  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: SPOTIFY_REDIRECT_URI,
    code_challenge_method: "S256",
    code_challenge: challenge,
    scope: SPOTIFY_SCOPES,
    state,
  });
  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

async function spotifyGet(url, token) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error("spotify api error");
  return res.json();
}

async function handleSpotifyCallback() {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const authError = url.searchParams.get("error");
  if (!code && !authError) return;

  window.history.replaceState({}, document.title, window.location.pathname);

  if (authError) {
    showSpotifyError("Spotify login was cancelled.");
    return;
  }

  const savedState = sessionStorage.getItem("spotify_state");
  const verifier = sessionStorage.getItem("spotify_verifier");
  if (!verifier || state !== savedState) {
    showSpotifyError("Spotify login expired — try connecting again.");
    return;
  }

  try {
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: SPOTIFY_REDIRECT_URI,
        client_id: SPOTIFY_CLIENT_ID,
        code_verifier: verifier,
      }),
    });
    if (!tokenRes.ok) throw new Error("token exchange failed");
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    const [profile, topArtists, topTracks] = await Promise.all([
      spotifyGet("https://api.spotify.com/v1/me", accessToken),
      spotifyGet("https://api.spotify.com/v1/me/top/artists?time_range=medium_term&limit=5", accessToken),
      spotifyGet("https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=5", accessToken),
    ]);

    const artists = topArtists.items.map((a) => a.name);
    const tracks = topTracks.items.map((t) => `${t.name} — ${t.artists[0].name}`);
    const genreCounts = {};
    topArtists.items.forEach((a) => a.genres.forEach((g) => (genreCounts[g] = (genreCounts[g] || 0) + 1)));
    const genres = Object.keys(genreCounts).sort((a, b) => genreCounts[b] - genreCounts[a]).slice(0, 3);

    const shareData = { n: profile.display_name || "Friend", a: artists, t: tracks, g: genres };
    hideSpotifyError();
    showShareCode(encodeShareCode(shareData));
  } catch (err) {
    showSpotifyError("Something went wrong fetching your Spotify data. Try connecting again.");
  }
}

function encodeShareCode(data) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
}

function decodeShareCode(code) {
  return JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
}

function showShareCode(code) {
  shareCodeOutput.value = code;
  shareCodeBox.classList.remove("hidden");
}

function showSpotifyError(msg) {
  spotifyError.textContent = msg;
  spotifyError.classList.remove("hidden");
}

function hideSpotifyError() {
  spotifyError.classList.add("hidden");
}

connectSpotifyBtn.addEventListener("click", startSpotifyLogin);
copyCodeBtn.addEventListener("click", async () => {
  await navigator.clipboard.writeText(shareCodeOutput.value);
  copyCodeBtn.textContent = "COPIED!";
  setTimeout(() => (copyCodeBtn.textContent = "COPY CODE"), 1500);
});

// ---------- build slides ----------
function buildSlides() {
  const groupName = groupNameInput.value.trim() || "Our Friend Group";
  const shuffledFriends = shuffle(friends);
  const realFriends = shuffledFriends.filter((f) => f.real);
  const fakeFriends = shuffledFriends.filter((f) => !f.real);
  const shuffledTitles = shuffle(SUPERLATIVES);

  const highlights = [];
  fakeFriends.forEach((f, i) => {
    highlights.push({ kind: "superlative", name: f.name, title: shuffledTitles[i % shuffledTitles.length] });
  });
  realFriends.forEach((f) => {
    highlights.push({ kind: "topArtist", name: f.name, artist: f.artists[0] || "a mystery artist", track: f.tracks[0] || "a mystery track" });
  });

  const mvp = shuffledFriends[randInt(0, shuffledFriends.length - 1)].name;
  const vibeStats = shuffle(VIBE_STATS).slice(0, realFriends.length ? 2 : 3).map((fn) => fn());

  const built = [];
  built.push({ type: "intro", groupName });
  built.push({ type: "squad", groupName, friends: shuffledFriends.map((f) => f.name) });
  highlights.forEach((h) => built.push(h.kind === "superlative"
    ? { type: "superlative", name: h.name, title: h.title }
    : { type: "topArtist", name: h.name, artist: h.artist, track: h.track }));

  const genreSlide = buildTopGenreSlide(realFriends, groupName);
  if (genreSlide) built.push(genreSlide);
  const sharedSlide = buildSharedArtistSlide(realFriends);
  if (sharedSlide) built.push(sharedSlide);

  built.push({ type: "vibe", groupName, stats: vibeStats });
  built.push({ type: "mvp", name: mvp });
  built.push({ type: "outro", groupName });

  recap = { groupName, mvp, sample: highlights.slice(0, 3) };
  return built;
}

function buildTopGenreSlide(realFriends, groupName) {
  if (!realFriends.length) return null;
  const counts = {};
  realFriends.forEach((f) => f.genres.forEach((g) => (counts[g] = (counts[g] || 0) + 1)));
  const top = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
  if (!top) return null;
  return { type: "topGenre", groupName, genre: top };
}

function buildSharedArtistSlide(realFriends) {
  if (realFriends.length < 2) return null;
  const tally = {};
  realFriends.forEach((f) => {
    new Set(f.artists).forEach((a) => {
      if (!tally[a]) tally[a] = [];
      tally[a].push(f.name);
    });
  });
  const shared = Object.entries(tally).find(([, names]) => names.length >= 2);
  if (!shared) return null;
  return { type: "sharedArtist", artist: shared[0], names: shared[1] };
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

function slideHTML(slide) {
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
    case "topArtist":
      return `
        ${makeBlobs()}
        <div class="slide-eyebrow">🎧 TOP ARTIST</div>
        <div class="slide-title" style="font-size:22px;">${escapeHtml(slide.name)}</div>
        <div class="slide-big-number" style="font-size:36px;">${escapeHtml(slide.artist)}</div>
        <div class="slide-sub">top track: ${escapeHtml(slide.track)}</div>
      `;
    case "topGenre":
      return `
        ${makeBlobs()}
        <div class="slide-eyebrow">${escapeHtml(slide.groupName).toUpperCase()}'S SIGNATURE SOUND</div>
        <div class="slide-title" style="font-size:34px; text-transform:capitalize;">${escapeHtml(slide.genre)}</div>
        <div class="slide-sub">the genre that defines this group's taste</div>
      `;
    case "sharedArtist":
      return `
        ${makeBlobs()}
        <div class="slide-eyebrow">🤝 SHARED OBSESSION</div>
        <div class="slide-title" style="font-size:28px;">${escapeHtml(slide.artist)}</div>
        <div class="slide-sub">${slide.names.map(escapeHtml).join(" & ")} both have this in their top artists</div>
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
  slideStage.innerHTML = slideHTML(slide);
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
  recap.sample.forEach((h) => {
    const label = h.kind === "superlative" ? h.title : `Top artist: ${h.artist}`;
    cctx.font = "700 13px -apple-system, Arial, sans-serif";
    cctx.fillStyle = "rgba(255,255,255,0.95)";
    cctx.fillText(h.name, cw / 2, y);
    cctx.fillStyle = "rgba(255,255,255,0.75)";
    cctx.font = "600 11px -apple-system, Arial, sans-serif";
    y += 16;
    y = wrapCanvasText(cctx, label, cw / 2, y, cw - 60, 14) + y - 14;
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

handleSpotifyCallback();
