# 地球人的奇妙日常｜Curious Earth Club

> 你的日常，是別人眼中的不可思議。

網頁製作期末專題。用互動世界地圖介紹各國意想不到的日常文化。

製作：B11309024 陳昱瑄、B11309036 劉芳瑜

## 網站頁面

| 頁面 | 檔案 | 內容 |
|---|---|---|
| 探索地圖 | `index.html` | 互動世界地圖，點國家看小知識 |
| 文化圖鑑 | `culture.html` | 所有國家與訪客投稿的卡片，可篩選 |
| 猜猜在哪國 | `quiz.html` | 10 題小測驗 |
| 分享你的日常 | `share.html` | 投稿表單，存到 Google 試算表 |
| 關於我們 | `about.html` | 製作動機、使用技術、資料來源 |

共用檔案：`style.css`（樣式）、`data.js`（國家資料與投稿功能）、`apps-script/Code.gs`（投稿後端）

---

## 一、設定 Google 試算表（投稿功能）

沒設定也能用，只是投稿會存在各自的瀏覽器裡（示範模式）。

1. 到 Google 雲端硬碟新增一份 **Google 試算表**，取名例如「地球人的奇妙日常 投稿」。
2. 上方選單 **擴充功能 → Apps Script**。
3. 把編輯器裡原本的內容全部刪掉，貼上 `apps-script/Code.gs` 的內容，按 💾 儲存。
4. 上方函式選單選 **`setup`**，按 **▶ 執行**。
   - 第一次會要求授權：選你的帳號 → 「進階」→「前往（不安全）」→「允許」。這是因為程式是你自己寫的，還沒經過 Google 審核，屬於正常情況。
   - 執行完回到試算表，會多一個「投稿」工作表，第一列是欄位名稱。
5. 右上角 **部署 → 新增部署作業**：
   - 類型（齒輪圖示）選 **網頁應用程式**
   - 執行身分：**我**
   - 誰可以存取：**所有人**
   - 按「部署」，複製出現的 **網頁應用程式網址**（`https://script.google.com/macros/s/.../exec`）。
6. 打開 `data.js`，把網址貼進這一行：
   ```js
   const SHEET_URL = "貼在這裡";
   ```
7. 打開 `share.html`，右上角顯示「已連線 Google 試算表」就成功了。

### 管理投稿

- 每則投稿是試算表的一列，可以直接修改內容。
- 取消勾選「公開」欄，那則投稿就會從網站上隱藏。
- 想改成「審核後才公開」：把 `Code.gs` 裡的 `AUTO_PUBLISH` 改成 `false`，再重新部署。

### 修改 Code.gs 之後

要到 **部署 → 管理部署作業 → ✏️ 編輯 → 版本選「新版本」→ 部署**，網址不會變，改動才會生效。

---

## 二、用 GitHub Pages 架站

1. 在 GitHub 建一個新的 repository（例如 `curious-earth`），設成 **Public**。
2. 按 **uploading an existing file**，把這個資料夾裡的所有檔案拖進去（`apps-script` 資料夾也一起），按 **Commit changes**。
3. 到 repository 的 **Settings → Pages**：
   - Source 選 **Deploy from a branch**
   - Branch 選 **main**、資料夾選 **/(root)**，按 Save。
4. 等 1～2 分鐘，頁面上方會出現網址：`https://你的帳號.github.io/curious-earth/`

之後要更新網站，在 GitHub 上修改或重新上傳檔案，Pages 會自動更新。

---

## 使用技術

HTML5 語意標籤 · CSS Grid／Flexbox · RWD 響應式設計 · SVG 互動地圖 · JavaScript · 表單驗證 · Google Apps Script · Google 試算表 · localStorage · GitHub Pages

地圖資料：[jsvectormap](https://github.com/themustafaomar/jsvectormap)（MIT 授權）
