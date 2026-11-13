/* =========================================================
   地球人的奇妙日常 — 投稿後端（Google Apps Script）
   貼到 Google 試算表的「擴充功能 → Apps Script」裡使用，
   設定步驟請看 README.md。

   GET                     → 回傳「公開」有打勾的投稿（最新 50 則，JSON）
   GET  ?action=reactions  → 回傳每張卡片的「喜歡」「雞蛋」數
   POST                    → 新增一則投稿，回傳這則的「編輯碼」
   POST {action:"edit"}    → 用編輯碼修改自己的投稿
   POST {action:"hide"}    → 用編輯碼刪除（隱藏）自己的投稿
   POST {action:"react"}   → 更新某張卡片的「喜歡」「雞蛋」數
   ========================================================= */

const SHEET_NAME = '投稿';
const REACTION_SHEET = '反應';
const REACTION_HEADERS = ['卡片 ID', '喜歡', '雞蛋'];
const HEADERS = ['時間', '暱稱', '國家', '洲別', '分類', '圖示', '標題', '內容', '公開', '編輯碼'];
const PUBLIC_COL = 9;    // 「公開」在第 9 欄（I）
const TOKEN_COL = 10;    // 「編輯碼」在第 10 欄（J），存的是加密過的值，不是編輯碼本身
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

  const rs = ss.getSheetByName(REACTION_SHEET) || ss.insertSheet(REACTION_SHEET);
  rs.getRange(1, 1, 1, REACTION_HEADERS.length).setValues([REACTION_HEADERS]).setFontWeight('bold');
  rs.setFrozenRows(1);
}

/* ---------- 讀取 ---------- */
function doGet(e) {
  if (e && e.parameter && e.parameter.action === 'reactions') return json(readReactions());

  const sheet = getSheet();
  const last = sheet.getLastRow();
  if (last < 2) return json([]);

  const rows = sheet.getRange(2, 1, last - 1, PUBLIC_COL).getValues();
  const items = rows
    .filter(r => r[PUBLIC_COL - 1] === true && r[1] !== '')
    .map(rowToItem)
    .reverse()
    .slice(0, 50);
  return json(items);
}

function rowToItem(r) {
  return {
    id: 'S' + new Date(r[0]).getTime(),   // 用投稿時間當作固定 ID，刪掉其他列也不會跑掉
    created_at: Utilities.formatDate(new Date(r[0]), 'Asia/Taipei', 'yyyy-MM-dd HH:mm'),
    nickname: String(r[1]),
    country: String(r[2]),
    continent: String(r[3]),
    category: String(r[4]),
    emoji: String(r[5]),
    title: String(r[6]),
    content: String(r[7])
  };
}

/* ---------- 寫入：新增、編輯、刪除、按讚 ---------- */
function doPost(e) {
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return json({ ok: false, error: '資料格式錯誤' });
  }

  if (data.action === 'react') return json(react(data));
  if (data.action === 'edit') return json(editPost(data));
  if (data.action === 'hide') return json(hidePost(data));
  return json(addPost(data));
}

// 檢查投稿內容；後端一定要檢查，因為網址是公開的，不能只靠網頁上的檢查
function validate(data) {
  const f = name => String(data[name] || '').trim();
  const item = {
    nickname: f('nickname'), country: f('country'), continent: f('continent'),
    category: f('category'), emoji: f('emoji'), title: f('title'), content: f('content')
  };
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
  return { item, errors };
}

function addPost(data) {
  const { item, errors } = validate(data);
  if (errors.length) return { ok: false, error: errors.join('、') };

  // 編輯碼：隨機產生，只交給投稿的人；試算表只存加密後的值
  const token = Utilities.getUuid();
  // 同時有很多人投稿時排隊寫入，避免資料互相蓋掉
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const now = new Date();
    const sheet = getSheet();
    if (sheet.getRange(1, TOKEN_COL).getValue() === '') sheet.getRange(1, TOKEN_COL).setValue('編輯碼').setFontWeight('bold');
    sheet.appendRow([
      now, safe(item.nickname), safe(item.country), item.continent, item.category,
      item.emoji, safe(item.title), safe(item.content), AUTO_PUBLISH, hash(token)
    ]);
    // 「公開」欄做成核取方塊：打勾才會顯示在網站上，取消勾選就隱藏
    sheet.getRange(sheet.getLastRow(), PUBLIC_COL).insertCheckboxes().setValue(AUTO_PUBLISH);
    item.id = 'S' + now.getTime();
    item.created_at = Utilities.formatDate(now, 'Asia/Taipei', 'yyyy-MM-dd HH:mm');
  } finally {
    lock.releaseLock();
  }
  return { ok: true, published: AUTO_PUBLISH, item: item, token: token };
}

// 找到某則投稿在第幾列，並確認編輯碼正確
function findOwnRow(sheet, id, token) {
  const last = sheet.getLastRow();
  if (last < 2 || !token) return { error: '找不到這則投稿，或沒有編輯權限' };
  const rows = sheet.getRange(2, 1, last - 1, TOKEN_COL).getValues();
  for (let i = 0; i < rows.length; i++) {
    if ('S' + new Date(rows[i][0]).getTime() !== String(id)) continue;
    if (!rows[i][TOKEN_COL - 1] || rows[i][TOKEN_COL - 1] !== hash(token)) return { error: '沒有編輯權限' };
    return { row: i + 2, values: rows[i] };
  }
  return { error: '找不到這則投稿，或沒有編輯權限' };
}

function editPost(data) {
  const { item, errors } = validate({ ...data, agree: 'yes' });
  if (errors.length) return { ok: false, error: errors.join('、') };
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet();
    const found = findOwnRow(sheet, data.id, String(data.token || ''));
    if (found.error) return { ok: false, error: found.error };
    // 只改第 2～8 欄（暱稱～內容），時間、公開、編輯碼不動
    sheet.getRange(found.row, 2, 1, 7).setValues([[
      safe(item.nickname), safe(item.country), item.continent, item.category,
      item.emoji, safe(item.title), safe(item.content)
    ]]);
    const result = rowToItem([found.values[0], item.nickname, item.country, item.continent,
                              item.category, item.emoji, item.title, item.content]);
    return { ok: true, item: result };
  } finally {
    lock.releaseLock();
  }
}

// 刪除 = 取消勾選「公開」：網站上看不到，但資料還留在試算表，需要時可以找回來
function hidePost(data) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet();
    const found = findOwnRow(sheet, data.id, String(data.token || ''));
    if (found.error) return { ok: false, error: found.error };
    sheet.getRange(found.row, PUBLIC_COL).setValue(false);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

// 把編輯碼加密（SHA-256），試算表裡只存這個
function hash(text) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(text), Utilities.Charset.UTF_8)
    .map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');
}

/* ---------- 喜歡／砸雞蛋 ---------- */
function getReactionSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let rs = ss.getSheetByName(REACTION_SHEET);
  if (!rs) {
    rs = ss.insertSheet(REACTION_SHEET);
    rs.getRange(1, 1, 1, REACTION_HEADERS.length).setValues([REACTION_HEADERS]).setFontWeight('bold');
  }
  return rs;
}

// 回傳 { "TW": { like: 3, egg: 1 }, "S1763...": { ... } }
function readReactions() {
  const rs = getReactionSheet();
  const last = rs.getLastRow();
  const map = {};
  if (last < 2) return map;
  rs.getRange(2, 1, last - 1, 3).getValues().forEach(r => {
    if (r[0] !== '') map[String(r[0])] = { like: Number(r[1]) || 0, egg: Number(r[2]) || 0 };
  });
  return map;
}

// data = { action: "react", id: "TW", like: 1 | 0 | -1, egg: 1 | 0 | -1 }
// 換按鈕時（喜歡 → 雞蛋）會一次送 like:-1、egg:1
function react(data) {
  const id = String(data.id || '');
  if (!/^([A-Z]{2}\d?|S\d{10,14})$/.test(id)) return { ok: false, error: '卡片 ID 不正確' };
  const step = v => Math.max(-1, Math.min(1, Math.round(Number(v) || 0)));
  const dLike = step(data.like), dEgg = step(data.egg);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const rs = getReactionSheet();
    const last = rs.getLastRow();
    const ids = last >= 2 ? rs.getRange(2, 1, last - 1, 1).getValues().map(r => String(r[0])) : [];
    const index = ids.indexOf(id);
    if (index < 0) {
      const counts = { like: Math.max(0, dLike), egg: Math.max(0, dEgg) };
      rs.appendRow([id, counts.like, counts.egg]);
      return { ok: true, id: id, counts: counts };
    }
    const range = rs.getRange(index + 2, 2, 1, 2);
    const cur = range.getValues()[0];
    const counts = {
      like: Math.max(0, (Number(cur[0]) || 0) + dLike),
      egg: Math.max(0, (Number(cur[1]) || 0) + dEgg)
    };
    range.setValues([[counts.like, counts.egg]]);
    return { ok: true, id: id, counts: counts };
  } finally {
    lock.releaseLock();
  }
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
