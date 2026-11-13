/* =========================================================
   data.js — 三個頁面共用的資料與小工具
   要新增國家：在 COUNTRIES 裡照格式加一筆（代碼用兩碼國家代碼）
   ========================================================= */

const CATEGORIES = { festival: "節慶", daily: "生活日常", trivia: "冷知識" };

const COUNTRIES = {
  TW: { name: "台灣", continent: "亞洲", cat: "daily", emoji: "🎵",
        title: "垃圾車會唱歌",
        fact: "台灣的垃圾車會一邊開一邊播音樂，最常聽到的是貝多芬的《給愛麗絲》和《少女的祈禱》。音樂一響，大家就知道要提著垃圾下樓了。",
        bonus: "很多外國旅客第一次聽到，還以為是冰淇淋車來了！" },
  JP: { name: "日本", continent: "亞洲", cat: "festival", emoji: "🍗",
        title: "聖誕節要吃肯德基",
        fact: "1970 年代一場成功的行銷活動，讓「聖誕節吃炸雞桶」變成許多日本家庭的習慣。熱門時段甚至要提前好幾週預訂。",
        bonus: "日本的聖誕節比較像情侶節，跨年才是家人團聚的日子。" },
  KR: { name: "韓國", continent: "亞洲", cat: "daily", emoji: "🎂",
        title: "一出生就一歲",
        fact: "韓國過去常用「韓國年齡」：出生就算一歲，每過一次新年再加一歲，所以年底出生的寶寶，隔幾天就兩歲了。",
        bonus: "2023 年 6 月起，韓國的法律和行政文件統一改用「滿歲」計算。" },
  NP: { name: "尼泊爾", continent: "亞洲", cat: "trivia", emoji: "🚩",
        title: "國旗不是長方形",
        fact: "尼泊爾是全世界唯一國旗不是長方形的國家，國旗由兩個疊在一起的三角形組成。",
        bonus: "憲法裡還寫了國旗的詳細畫法，照著步驟就能畫出精準的比例。" },
  IN: { name: "印度", continent: "亞洲", cat: "festival", emoji: "🎨",
        title: "灑紅節：全身五顏六色",
        fact: "每年春天的灑紅節（Holi），印度各地的人會在街上互相丟彩色粉末、潑彩色水，慶祝春天來臨與善勝過惡。",
        bonus: "參加時建議穿舊衣服，顏色可能好幾天都洗不掉！" },
  TH: { name: "泰國", continent: "亞洲", cat: "festival", emoji: "💦",
        title: "全國大型潑水戰",
        fact: "泰國新年潑水節（Songkran）在每年 4 月 13 日到 15 日。原本是向長輩灑水祈福，現在整條街都變成水槍大戰。",
        bonus: "4 月正好是泰國最熱的時候，被潑水其實很消暑。" },
  IS: { name: "冰島", continent: "歐洲", cat: "trivia", emoji: "🦟",
        title: "一隻蚊子都沒有",
        fact: "冰島是少數沒有蚊子定居的地方，夏天在戶外不用擔心被叮。",
        bonus: "冰島人還有「聖誕書潮」：聖誕夜互送書，然後窩在家裡看書、喝熱可可。" },
  FI: { name: "芬蘭", continent: "歐洲", cat: "festival", emoji: "🏃",
        title: "背老婆大賽",
        fact: "芬蘭小鎮宋卡耶爾維每年舉辦「背老婆世界錦標賽」，選手要背著隊友跑過沙地、跨過障礙、涉過水池。",
        bonus: "芬蘭的三溫暖多到驚人，據估計有約三百萬座，平均不到兩個人就有一座。" },
  NL: { name: "荷蘭", continent: "歐洲", cat: "daily", emoji: "🚲",
        title: "腳踏車比人還多",
        fact: "荷蘭的腳踏車數量比人口還多，上班、上學、買菜都騎車，路上有專屬的腳踏車道和紅綠燈。",
        bonus: "阿姆斯特丹運河裡，每年都會撈出很多掉進水裡的腳踏車。" },
  ES: { name: "西班牙", continent: "歐洲", cat: "festival", emoji: "🍅",
        title: "番茄大戰",
        fact: "每年八月最後一個星期三，西班牙小鎮布尼奧爾會舉辦番茄節，上萬人在街上互丟番茄，整條街都變成紅色。",
        bonus: "現在參加需要買票，名額有限。" },
  BG: { name: "保加利亞", continent: "歐洲", cat: "daily", emoji: "🙆",
        title: "點頭是「不」、搖頭是「是」",
        fact: "在保加利亞，傳統上點頭代表「不要」，搖頭反而代表「好」，跟大部分國家剛好相反。",
        bonus: "因為常接觸外國人，有些當地人會切換，所以最好再用嘴巴確認一次。" },
  GB: { name: "英國", continent: "歐洲", cat: "trivia", emoji: "🦄",
        title: "國家動物是獨角獸",
        fact: "英國的蘇格蘭，國家動物是傳說中的獨角獸，在王室紋章上也能看到牠。",
        bonus: "獨角獸象徵純潔和力量，傳說中只有國王能馴服牠。" },
  MX: { name: "墨西哥", continent: "美洲", cat: "festival", emoji: "💀",
        title: "亡靈節：歡迎祖先回家",
        fact: "每年 11 月 1 日至 2 日的亡靈節，墨西哥的家庭會用萬壽菊、蠟燭、糖骷髏布置祭壇，迎接過世的親人回家團聚。",
        bonus: "這個節日被聯合國教科文組織列為人類非物質文化遺產。" },
  BR: { name: "巴西", continent: "美洲", cat: "festival", emoji: "💃",
        title: "全世界最大的派對",
        fact: "巴西的里約嘉年華在大齋期前舉行，各個森巴學校會花上一整年準備花車、服裝和舞蹈，在森巴大道上比賽。",
        bonus: "巴西是全世界最大的葡萄牙語國家，人口比葡萄牙本國多二十倍左右。" },
  CA: { name: "加拿大", continent: "美洲", cat: "trivia", emoji: "🎅",
        title: "聖誕老人有郵遞區號",
        fact: "加拿大郵政幫聖誕老人設了專屬郵遞區號 H0H 0H0。小朋友寄信過去，志工會幫忙回信。",
        bonus: "仔細看，H0H 0H0 就是聖誕老人的笑聲「HO HO HO」。" },
  ET: { name: "衣索比亞", continent: "非洲", cat: "trivia", emoji: "📅",
        title: "一年有 13 個月",
        fact: "衣索比亞使用自己的曆法：12 個月每月 30 天，再加上只有 5 或 6 天的第 13 個月。",
        bonus: "他們的年份比我們常用的西元曆晚了 7 到 8 年。" },
  AU: { name: "澳洲", continent: "大洋洲", cat: "daily", emoji: "🏖️",
        title: "穿短褲過聖誕節",
        fact: "澳洲在南半球，聖誕節正好是夏天。很多人會去海邊、在戶外烤肉，聖誕老人也可能穿著短褲衝浪。",
        bonus: "南半球的季節和北半球相反，所以七月反而是冬天。" },
  NZ: { name: "紐西蘭", continent: "大洋洲", cat: "trivia", emoji: "🐑",
        title: "羊比人多好幾倍",
        fact: "紐西蘭的羊大約是人口的五倍，開車經過鄉間，常常看到滿山遍野的白點。",
        bonus: "紐西蘭人自稱「Kiwi」，名字來自當地一種不會飛的鳥。" }
};

const CODES = Object.keys(COUNTRIES);

/* 已探索的國家：存在瀏覽器裡，三個頁面共用（存不了也不影響使用） */
function loadExplored() {
  try { return new Set(JSON.parse(localStorage.getItem("explored") || "[]")); }
  catch (e) { return new Set(); }
}
function saveExplored(set) {
  try { localStorage.setItem("explored", JSON.stringify([...set])); } catch (e) {}
}

/* =========================================================
   訪客投稿
   有設定 SHEET_URL → 存到 Google 試算表（所有人都看得到）
   沒設定、或連不上 → 改存在這個瀏覽器（示範模式）
   ========================================================= */

// ★ 部署 Apps Script 後，把「網頁應用程式網址」貼在這裡（設定步驟見 README.md）
const SHEET_URL = "https://script.google.com/macros/s/AKfycbwnM_9VV7-bCE6oUUsEIed9YO983MDjCgo2p5lLPe1nw4LsWg1WqnEftOBMp8SkEN34rA/exec";

const EMOJIS = ["🌏", "🎉", "🍜", "🏠", "🎵", "🤔", "🐾", "🚲"];

// 投稿內容是使用者輸入的，顯示前一定要跳脫，避免 XSS
function escapeHTML(text) {
  return String(text).replace(/[&<>"']/g, ch =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}

function loadLocalSubmissions() {
  try { return JSON.parse(localStorage.getItem("submissions") || "[]"); }
  catch (e) { return []; }
}

// 回傳 { mode: "sheet" | "local", reason?: "unset" | "error", items: [...] }
async function fetchSubmissions() {
  if (!SHEET_URL) return { mode: "local", reason: "unset", items: loadLocalSubmissions() };
  try {
    const res = await fetch(SHEET_URL);
    if (!res.ok) throw new Error();
    const items = await res.json();
    if (!Array.isArray(items)) throw new Error();
    return { mode: "sheet", items };
  } catch (e) {
    return { mode: "local", reason: "error", items: loadLocalSubmissions() };
  }
}

// formData 來自 <form>；mode 由 fetchSubmissions() 決定
// 回傳 { item, published }：published 為 false 代表要等審核才會公開
async function addSubmission(formData, mode) {
  const item = Object.fromEntries(formData);

  if (mode === "sheet") {
    // 用純文字格式送出 JSON，Google Apps Script 才不會擋下跨網域請求
    const res = await fetch(SHEET_URL, { method: "POST", body: JSON.stringify(item) });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "投稿失敗");
    return { item: data.item, published: data.published };
  }

  delete item.agree;
  item.created_at = new Date().toISOString().slice(0, 16).replace("T", " ");
  const list = loadLocalSubmissions();
  list.unshift(item);
  try { localStorage.setItem("submissions", JSON.stringify(list)); }
  catch (e) { throw new Error("這個瀏覽器無法儲存投稿"); }
  return { item, published: true };
}

// 投稿卡片（圖鑑頁和分享頁共用）
function submissionCard(s) {
  const cat = CATEGORIES[s.category] ? s.category : "daily";
  return `
    <article class="card entry pop community">
      <div class="entry-top">
        <span class="big-emoji">${escapeHTML(s.emoji)}</span>
        <span class="by">訪客投稿</span>
      </div>
      <h2>${escapeHTML(s.country)}</h2>
      <div class="meta"><span>${escapeHTML(s.continent)}</span><span class="tag ${cat}">${CATEGORIES[cat]}</span></div>
      <h3>${escapeHTML(s.title)}</h3>
      <p>${escapeHTML(s.content)}</p>
      <span class="author">— ${escapeHTML(s.nickname)}</span>
    </article>`;
}

/* 手機版導覽列可以左右滑動：把目前頁面的選項捲到看得到的位置 */
document.addEventListener("DOMContentLoaded", () => {
  const nav = document.querySelector(".site-nav");
  const active = nav && nav.querySelector(".active");
  if (active && nav.scrollWidth > nav.clientWidth) {
    nav.scrollLeft = active.offsetLeft - (nav.clientWidth - active.offsetWidth) / 2;
  }
});
