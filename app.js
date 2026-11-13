/* =========================================================
   app.js — 所有頁面共用的互動功能
   1. 語言切換（中文／English）   2. 深淺色模式   3. 音樂
   4. 喜歡／砸雞蛋                5. 分享         6. 里程徽章
   需要先載入 data.js 和 i18n.js
   ========================================================= */

/* ---------- 0. 小工具：讀寫設定 ---------- */
function getSetting(key, fallback) {
  try { return localStorage.getItem(key) ?? fallback; } catch (e) { return fallback; }
}
function setSetting(key, value) {
  try { localStorage.setItem(key, value); } catch (e) {}
}

/* =========================================================
   1. 語言切換
   ========================================================= */
let LANG = getSetting("lang", "zh") === "en" ? "en" : "zh";

// t("key") 取得目前語言的文字；{name} 這種寫法會換成 vars 裡的值
function t(key, vars = {}) {
  const text = (I18N[LANG] && I18N[LANG][key]) ?? I18N.zh[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
}

// 國家名稱（目前語言）
function countryName(code) {
  const c = COUNTRIES[code];
  return c ? (LANG === "en" ? c.en : c.name) : code;
}

// 取得一則小知識在目前語言的內容，順便帶上國名和洲別
function F(f) {
  const text = LANG === "en" ? f.en : f;
  return {
    ...f,
    title: text.title, fact: text.fact, bonus: text.bonus || "",
    name: countryName(f.code), continent: contName(COUNTRIES[f.code].continent)
  };
}

// 這則小知識要播哪首曲子：有專屬的就用專屬的，沒有就依分類
function tuneKey(f) { return TUNES[f.id] ? f.id : f.cat; }
function catName(cat) { return (LANG === "en" ? CATEGORIES_EN : CATEGORIES)[cat] || cat; }
function contName(zh) { return LANG === "en" ? (CONTINENTS_EN[zh] || zh) : zh; }

// 把畫面上有 data-i18n 的元素換成目前語言
function applyI18n(root = document) {
  document.documentElement.lang = LANG === "en" ? "en" : "zh-Hant";
  root.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll("[data-i18n-html]").forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
  root.querySelectorAll("[data-i18n-placeholder]").forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  root.querySelectorAll("[data-i18n-aria]").forEach(el => { el.setAttribute("aria-label", t(el.dataset.i18nAria)); });
}

function setLang(lang) {
  LANG = lang;
  setSetting("lang", lang);
  applyI18n();
  updateControls();
  // 讓各頁面重畫自己用 JS 產生的內容
  document.dispatchEvent(new CustomEvent("langchange"));
}

/* =========================================================
   2. 深淺色模式（<head> 裡已經先套用，避免閃一下）
   ========================================================= */
function currentTheme() { return document.documentElement.dataset.theme === "dark" ? "dark" : "light"; }
function toggleTheme() {
  const next = currentTheme() === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  setSetting("theme", next);
  updateControls();
}

/* =========================================================
   3. 音樂：用 Web Audio API 現場合成，不需要音檔
   ========================================================= */
let soundOn = getSetting("sound", "on") !== "off";
let audioCtx = null;
let playing = [];   // 正在播放的音，切換時要先停掉

function noteFreq(name) {
  const m = /^([A-G])([#b]?)(\d)$/.exec(name);
  if (!m) return null;
  const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]];
  const shift = m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0;
  const midi = (Number(m[3]) + 1) * 12 + base + shift;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function stopTune() {
  playing.forEach(osc => { try { osc.stop(); } catch (e) {} });
  playing = [];
  document.querySelectorAll(".play-btn.is-playing").forEach(b => b.classList.remove("is-playing"));
}

// key 是國家代碼，或訪客投稿的分類（festival / daily / trivia）
function playTune(key, button) {
  const tune = TUNES[key];
  if (!tune) return;
  stopTune();
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
  } catch (e) { return; }

  const beat = 60 / tune.bpm;
  let time = audioCtx.currentTime + 0.05;
  for (const token of tune.notes.split(/\s+/)) {
    const [name, beats] = token.split(":");
    const length = Number(beats) * beat;
    const freq = name === "-" ? null : noteFreq(name);
    if (freq) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = tune.wave;
      osc.frequency.value = freq;
      const peak = tune.wave === "square" ? 0.06 : 0.18;   // 方波比較刺耳，音量調小
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(peak, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, time + length * 0.95);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(time);
      osc.stop(time + length);
      playing.push(osc);
    }
    time += length;
  }
  if (button) {
    button.classList.add("is-playing");
    setTimeout(() => button.classList.remove("is-playing"), (time - audioCtx.currentTime) * 1000);
  }
}

function tuneLabel(key) {
  const tune = TUNES[key];
  return tune ? tune[LANG] : "";
}

function toggleSound() {
  soundOn = !soundOn;
  setSetting("sound", soundOn ? "on" : "off");
  if (!soundOn) stopTune();
  updateControls();
  toast(soundOn ? t("toast.soundOn") : t("toast.soundOff"));
}

/* =========================================================
   右上角的三個按鈕：音樂、深淺色、語言（用 JS 加到每一頁的導覽列）
   ========================================================= */
function insertControls() {
  const inner = document.querySelector(".site-header .inner");
  if (!inner || inner.querySelector(".controls")) return;
  const box = document.createElement("div");
  box.className = "controls";
  box.innerHTML = `
    <button type="button" class="icon-btn" id="btn-sound"></button>
    <button type="button" class="icon-btn" id="btn-theme"></button>
    <button type="button" class="icon-btn lang-btn" id="btn-lang"></button>`;
  inner.appendChild(box);
  box.querySelector("#btn-sound").onclick = toggleSound;
  box.querySelector("#btn-theme").onclick = toggleTheme;
  box.querySelector("#btn-lang").onclick = () => setLang(LANG === "zh" ? "en" : "zh");
  updateControls();
}

function updateControls() {
  const sound = document.getElementById("btn-sound");
  if (!sound) return;
  sound.textContent = soundOn ? "🔊" : "🔇";
  sound.title = sound.ariaLabel = soundOn ? t("ctl.soundOff") : t("ctl.soundOn");
  const theme = document.getElementById("btn-theme");
  theme.textContent = currentTheme() === "dark" ? "☀️" : "🌙";
  theme.title = theme.ariaLabel = currentTheme() === "dark" ? t("ctl.light") : t("ctl.dark");
  const lang = document.getElementById("btn-lang");
  lang.textContent = LANG === "zh" ? "EN" : "中";
  lang.title = lang.ariaLabel = LANG === "zh" ? "Switch to English" : "切換成中文";
}

/* ---------- 提示訊息 ---------- */
function toast(message, extraClass = "") {
  let box = document.getElementById("toasts");
  if (!box) {
    box = document.createElement("div");
    box.id = "toasts";
    box.setAttribute("aria-live", "polite");
    document.body.appendChild(box);
  }
  const el = document.createElement("div");
  el.className = "toast " + extraClass;
  el.textContent = message;
  box.appendChild(el);
  setTimeout(() => el.classList.add("out"), extraClass ? 3600 : 2200);
  setTimeout(() => el.remove(), extraClass ? 4000 : 2600);
}

/* =========================================================
   4. 喜歡／砸雞蛋
   ========================================================= */
let reactionCounts = {};
let reactionsShared = false;
const myReactions = loadMyReactions();
const reactionsReady = fetchReactions().then(r => {
  reactionCounts = r.counts;
  reactionsShared = r.shared;
  refreshReactions();
});

// 卡片下方的按鈕列：播放、喜歡、砸雞蛋、分享
// opts.tune：音樂代碼；opts.share：分享用的 { title, text, hash, page }
function cardActions(id, opts = {}) {
  const count = reactionCounts[id] || { like: 0, egg: 0 };
  const mine = myReactions[id];
  return `
    <div class="actions" data-id="${escapeHTML(id)}">
      ${opts.tune ? `<button type="button" class="act play-btn" data-tune="${opts.tune}" title="${escapeHTML(tuneLabel(opts.tune))}">
        <span class="eq"><i></i><i></i><i></i></span>▶</button>` : ""}
      <button type="button" class="act react-btn ${mine === "like" ? "on" : ""}" data-type="like" aria-label="${t("act.like")}">👍 <b>${count.like}</b></button>
      <button type="button" class="act react-btn egg ${mine === "egg" ? "on" : ""}" data-type="egg" aria-label="${t("act.egg")}">🥚 <b>${count.egg}</b></button>
      ${opts.share ? `<button type="button" class="act share-btn"
          data-title="${escapeHTML(opts.share.title)}" data-text="${escapeHTML(opts.share.text)}"
          data-page="${opts.share.page || "index.html"}" data-hash="${escapeHTML(opts.share.hash || "")}"
          aria-label="${t("act.share")}" title="${t("act.share")}">↗</button>` : ""}
    </div>`;
}

function refreshReactions() {
  document.querySelectorAll(".actions[data-id]").forEach(box => {
    const id = box.dataset.id;
    const count = reactionCounts[id] || { like: 0, egg: 0 };
    box.querySelector('[data-type="like"] b').textContent = count.like;
    box.querySelector('[data-type="egg"] b').textContent = count.egg;
    box.querySelector('[data-type="like"]').classList.toggle("on", myReactions[id] === "like");
    box.querySelector('[data-type="egg"]').classList.toggle("on", myReactions[id] === "egg");
  });
}

async function react(id, type, button) {
  const before = myReactions[id];
  // 同一張卡片只能選一種：再按一次取消，按另一個就切換
  const after = before === type ? undefined : type;
  const dLike = (after === "like" ? 1 : 0) - (before === "like" ? 1 : 0);
  const dEgg = (after === "egg" ? 1 : 0) - (before === "egg" ? 1 : 0);

  if (after) myReactions[id] = after; else delete myReactions[id];
  saveMyReactions(myReactions);
  const count = reactionCounts[id] = reactionCounts[id] || { like: 0, egg: 0 };
  count.like = Math.max(0, count.like + dLike);
  count.egg = Math.max(0, count.egg + dEgg);
  refreshReactions();

  if (after === "egg") throwEgg(button);
  if (after === "like") popHeart(button);

  if (reactionsShared) {
    try {
      reactionCounts[id] = await sendReaction(id, dLike, dEgg);
      refreshReactions();
    } catch (e) {
      toast(t("toast.reactFail"));
    }
  }
}

// 雞蛋從按鈕飛到卡片上，然後「啪」變成荷包蛋
function throwEgg(button) {
  const card = button.closest(".card, .entry") || button.parentElement;
  const from = button.getBoundingClientRect();
  const to = card.getBoundingClientRect();
  const egg = document.createElement("div");
  egg.className = "flying-egg";
  egg.textContent = "🥚";
  egg.style.left = from.left + from.width / 2 + "px";
  egg.style.top = from.top + "px";
  document.body.appendChild(egg);
  const dx = to.left + to.width * (0.3 + Math.random() * 0.4) - (from.left + from.width / 2);
  const dy = to.top + to.height * (0.25 + Math.random() * 0.2) - from.top;
  egg.animate([
    { transform: "translate(-50%, 0) rotate(0deg) scale(1)" },
    { transform: `translate(calc(-50% + ${dx / 2}px), ${dy / 2 - 80}px) rotate(360deg) scale(1.4)`, offset: 0.5 },
    { transform: `translate(calc(-50% + ${dx}px), ${dy}px) rotate(720deg) scale(1)` }
  ], { duration: 550, easing: "ease-in" }).onfinish = () => {
    egg.remove();
    const splat = document.createElement("div");
    splat.className = "splat";
    splat.textContent = "🍳";
    // 位置換算成「相對於卡片左上角」
    splat.style.left = (from.left + from.width / 2 + dx - to.left) + "px";
    splat.style.top = (from.top + dy - to.top) + "px";
    card.appendChild(splat);
    card.classList.remove("shake");
    void card.offsetWidth;
    card.classList.add("shake");
    setTimeout(() => splat.remove(), 1500);
  };
}

function popHeart(button) {
  const heart = document.createElement("span");
  heart.className = "pop-heart";
  heart.textContent = "💖";
  button.appendChild(heart);
  setTimeout(() => heart.remove(), 800);
}

/* =========================================================
   5. 分享：手機用系統分享選單，電腦改成複製連結
   ========================================================= */
async function shareLink({ title, text, page = "index.html", hash = "" }) {
  const url = new URL(page + (hash ? "#" + hash : ""), location.href).href;
  if (navigator.share) {
    try { await navigator.share({ title, text, url }); return; }
    catch (e) { if (e.name === "AbortError") return; }
  }
  try {
    await navigator.clipboard.writeText(`${text}\n${url}`);
    toast(t("toast.copied"));
  } catch (e) {
    toast(url);
  }
}

/* =========================================================
   6. 里程徽章：探索 5、10、15、25、50、75、100、150 國，全部探索完再一個
   ========================================================= */
const BADGE_STEPS = [
  { n: 5, icon: "🥉" }, { n: 10, icon: "🥈" }, { n: 15, icon: "🥇" }, { n: 25, icon: "🎒" },
  { n: 50, icon: "🧭" }, { n: 75, icon: "🗺️" }, { n: 100, icon: "✈️" }, { n: 150, icon: "🚀" }
];
function badgeList() {
  const list = BADGE_STEPS.filter(b => b.n < CODES.length).map(b => ({ ...b, key: "badge." + b.n }));
  list.push({ n: CODES.length, key: "badge.all", icon: "🌏" });
  return list;
}
function badgeName(b) {
  const name = I18N[LANG][b.key] ?? t("badge.generic", { n: b.n });
  return name;
}

// 探索數變多時呼叫：剛好跨過門檻就跳出恭喜
function checkBadges(count) {
  let seen = Number(getSetting("badgesSeen", "0"));
  for (const b of badgeList()) {
    if (count >= b.n && b.n > seen) {
      toast(`${b.icon} ${t("badge.unlock")}${badgeName(b)}`, "badge-toast");
      confetti();
      seen = b.n;
    }
  }
  setSetting("badgesSeen", String(seen));
}

function renderBadges(container, count) {
  if (!container) return;
  container.innerHTML = badgeList().map(b => {
    const got = count >= b.n;
    return `<div class="badge ${got ? "got" : ""}" title="${got ? "" : t("badge.need", { n: b.n - count })}">
      <span class="badge-icon">${got ? b.icon : "🔒"}</span>
      <span class="badge-text"><b>${badgeName(b)}</b><small>${got ? t("badge.done") : t("badge.goal", { n: b.n })}</small></span>
    </div>`;
  }).join("");
}

function confetti() {
  const colors = ["#d6684a", "#2e8a74", "#d99a2b", "#7aa6c2"];
  for (let i = 0; i < 40; i++) {
    const p = document.createElement("i");
    p.className = "confetti";
    p.style.left = Math.random() * 100 + "vw";
    p.style.background = colors[i % colors.length];
    p.style.animationDelay = Math.random() * 0.4 + "s";
    p.style.animationDuration = 1.6 + Math.random() + "s";
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 3200);
  }
}

/* =========================================================
   卡片（圖鑑頁和分享頁共用）
   ========================================================= */
function shareInfo(fx) {
  return { title: `${fx.name}｜${fx.title}`, text: `${fx.emoji} ${fx.name}｜${fx.title} — ${t("brand")}`, hash: fx.id };
}

// 一則小知識的卡片；seen：這個國家是否已探索
function factCard(f, seen) {
  const fx = F(f);
  return `
    <article class="card entry pop" data-tune="${tuneKey(f)}">
      <div class="entry-top">
        <span class="big-emoji">${fx.emoji}</span>
        ${seen ? `<span class="seen">✓ ${t("culture.seen")}</span>` : ""}
      </div>
      <h2>${fx.name}</h2>
      <div class="meta"><span>${fx.continent}</span><span class="tag ${fx.cat}">${catName(fx.cat)}</span></div>
      <h3>${fx.title}</h3>
      <p>${fx.fact}</p>
      <a class="more" href="index.html#${fx.id}">${t("culture.onMap")}</a>
      ${cardActions(fx.id, { tune: tuneKey(f), share: shareInfo(fx) })}
    </article>`;
}

function submissionId(s) {
  return s.id || "S" + (Date.parse(String(s.created_at).replace(" ", "T")) || 0);
}

function submissionCard(s, withActions = true) {
  const cat = CATEGORIES[s.category] ? s.category : "daily";
  const id = submissionId(s);
  return `
    <article class="card entry pop community" data-tune="${cat}">
      <div class="entry-top">
        <span class="big-emoji">${escapeHTML(s.emoji)}</span>
        <span class="by">${t("card.visitor")}</span>
      </div>
      <h2>${escapeHTML(s.country)}</h2>
      <div class="meta"><span>${escapeHTML(contName(s.continent))}</span><span class="tag ${cat}">${catName(cat)}</span></div>
      <h3>${escapeHTML(s.title)}</h3>
      <p>${escapeHTML(s.content)}</p>
      <span class="author">— ${escapeHTML(s.nickname)}</span>
      ${withActions ? cardActions(id, {
        tune: cat,
        share: { title: s.title, text: `${s.country}｜${s.title}`, page: "culture.html", hash: "community" }
      }) : ""}
    </article>`;
}

/* =========================================================
   全站事件：按鈕都用「事件委派」，新產生的卡片也能直接用
   ========================================================= */
document.addEventListener("click", e => {
  const playBtn = e.target.closest(".play-btn");
  if (playBtn) { playTune(playBtn.dataset.tune, playBtn); return; }

  const reactBtn = e.target.closest(".react-btn");
  if (reactBtn) { react(reactBtn.closest(".actions").dataset.id, reactBtn.dataset.type, reactBtn); return; }

  const shareBtn = e.target.closest(".share-btn");
  if (shareBtn) { shareLink({ ...shareBtn.dataset }); return; }

  // 點卡片其他地方（不是連結或按鈕）也會播放音樂
  const card = e.target.closest("[data-tune]");
  if (card && soundOn && !e.target.closest("a, button, input, select, textarea, label")) {
    playTune(card.dataset.tune, card.querySelector(".play-btn"));
  }
});

/* ---------- 頁面載入時 ---------- */
insertControls();
applyI18n();

// 手機版導覽列可以左右滑動：把目前頁面的選項捲到看得到的位置
(function centerActiveNav() {
  const nav = document.querySelector(".site-nav");
  const active = nav && nav.querySelector(".active");
  if (active && nav.scrollWidth > nav.clientWidth) {
    nav.scrollLeft = active.offsetLeft - (nav.clientWidth - active.offsetWidth) / 2;
  }
})();
