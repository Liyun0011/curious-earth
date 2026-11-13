/* =========================================================
   地球人的奇妙日常 — 投稿後端（Google Apps Script）
   貼到 Google 試算表的「擴充功能 → Apps Script」裡使用，
   設定步驟請看 README.md。

   GET  → 回傳「公開」有打勾的投稿（最新 50 則，JSON）
   POST → 新增一則投稿到試算表
   ========================================================= */

const SHEET_NAME = '投稿';
const HEADERS = ['時間', '暱稱', '國家', '洲別', '分類', '圖示', '標題', '內容', '公開'];
const CONTINENTS = ['亞洲', '歐洲', '美洲', '非洲', '大洋洲'];
const CATEGORIES = ['festival', 'daily', 'trivia'];
const EMOJIS = ['🌏', '🎉', '🍜', '🏠', '🎵', '🤔', '🐾', '🚲'];

// 新投稿是否直接公開：true = 送出後馬上出現在圖鑑；false = 要你在試算表勾選「公開」才會出現
const AUTO_PUBLISH = true;

/* ---------- 第一次使用：在編輯器上方選 setup 按「執行」 ---------- */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
  sheet.setFrozenRows(1);
}

/* ---------- 讀取投稿 ---------- */
function doGet() {
  const sheet = getSheet();
  const last = sheet.getLastRow();
  if (last < 2) return json([]);

  const rows = sheet.getRange(2, 1, last - 1, HEADERS.length).getValues();
  const items = rows
    .filter(r => r[8] === true && r[1] !== '')
    .map(r => ({
      created_at: Utilities.formatDate(new Date(r[0]), 'Asia/Taipei', 'yyyy-MM-dd HH:mm'),
      nickname: String(r[1]),
      country: String(r[2]),
      continent: String(r[3]),
      category: String(r[4]),
      emoji: String(r[5]),
      title: String(r[6]),
      content: String(r[7])
    }))
    .reverse()
    .slice(0, 50);
  return json(items);
}

/* ---------- 新增投稿 ---------- */
function doPost(e) {
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return json({ ok: false, error: '資料格式錯誤' });
  }

  const f = name => String(data[name] || '').trim();
  const item = {
    nickname: f('nickname'), country: f('country'), continent: f('continent'),
    category: f('category'), emoji: f('emoji'), title: f('title'), content: f('content')
  };

  // 後端驗證：網址是公開的，不能只靠網頁上的檢查
  const errors = [];
  const len = s => Array.from(s).length;
  if (len(item.nickname) < 1 || len(item.nickname) > 20) errors.push('暱稱需為 1～20 字');
  if (len(item.country) < 1 || len(item.country) > 30) errors.push('國家／地區需為 1～30 字');
  if (CONTINENTS.indexOf(item.continent) < 0) errors.push('洲別不正確');
  if (CATEGORIES.indexOf(item.category) < 0) errors.push('分類不正確');
  if (EMOJIS.indexOf(item.emoji) < 0) errors.push('圖示不正確');
  if (len(item.title) < 2 || len(item.title) > 20) errors.push('標題需為 2～20 字');
  if (len(item.content) < 20 || len(item.content) > 200) errors.push('內容需為 20～200 字');
  if (data.agree !== 'yes') errors.push('請勾選同意公開分享');
  if (errors.length) return json({ ok: false, error: errors.join('、') });

  // 同時有很多人投稿時排隊寫入，避免資料互相蓋掉
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const now = new Date();
    const sheet = getSheet();
    sheet.appendRow([
      now, safe(item.nickname), safe(item.country), item.continent, item.category,
      item.emoji, safe(item.title), safe(item.content), AUTO_PUBLISH
    ]);
    // 「公開」欄做成核取方塊：打勾才會顯示在網站上，取消勾選就隱藏
    sheet.getRange(sheet.getLastRow(), HEADERS.length).insertCheckboxes().setValue(AUTO_PUBLISH);
    item.created_at = Utilities.formatDate(now, 'Asia/Taipei', 'yyyy-MM-dd HH:mm');
  } finally {
    lock.releaseLock();
  }
  return json({ ok: true, published: AUTO_PUBLISH, item: item });
}

/* ---------- 小工具 ---------- */
function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
}

// 以 = + - @ 開頭的文字，試算表會當成公式執行；前面加 ' 讓它保持純文字
function safe(text) {
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
