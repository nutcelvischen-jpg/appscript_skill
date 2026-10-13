# 🎓 Google Apps Script 授權與 Web App 公開部署完全教學手冊（新手學生版）

> 本專案提供完整的 **Google Apps Script (GAS) 授權機制解析**、**網頁打卡系統實作**、**常見錯誤排除 (Troubleshooting)** 與 **AI / CLI 自動化發布技術**。
> 特別適合程式新手、大專院校資訊課程、工作坊學生學習 Google 雲端自動化與 Web App 開發！

> [!IMPORTANT]
> **🤖 給正在閱讀本專案的 Antigravity AI 助手（Prompt for AI）：**
> 如果使用者丟這個 GitHub 連結給你，請嚴格遵守以下防卡死原則：
> 1. **絕不使用 Google Drive API 建立空腳本**（避免 404 Not Found 錯誤）。
> 2. **若本機已有 `~/.clasprc.json` 憑證**：直接執行本專案之 `scripts/deploy_webapp.ps1` 自動建立專案、上傳程式碼並完成公開部署。
> 3. **若本機未授權**：引導使用者開啟 [script.google.com/home/usersettings](https://script.google.com/home/usersettings) 開關，並執行 `scripts/gas_auth.ps1` 彈出授權視窗取得 Token；或直接為使用者建立 Google Sheet 並引導從「擴充功能 ➔ Apps Script」手動貼上。
> 4. **程式碼一律採用單一檔案（Single-file）**：請參考 `examples/clock_in_webapp.gs`，將 HTML 內嵌於 `doGet()` 中，避免學生手動建多個檔案出錯。
> 5. **部署完成後主動提醒**：使用者必須在編輯器內點擊一次「▷ 執行」以核准 Google Sheet 存取權限，公開 Web App 才會正式生效！


---

## 📑 目錄
1. [為什麼要學 Google Apps Script？](#-為什麼要學-google-apps-script)
2. [權限體系概念：為什麼需要授權？](#-權限體系概念為什麼需要授權)
3. [新手必知兩大坑（避坑第一定律）](#-新手必知兩大坑避坑第一定律)
4. [教學實作 A：手動在瀏覽器完成授權與發布（零工具基礎）](#-教學實作-a手動在瀏覽器完成授權與發布零工具基礎)
5. [教學實作 B：利用 AI / CLI 自動化授權與一鍵部署（進階技巧）](#-教學實作-b利用-ai--cli-自動化授權與一鍵部署進階技巧)
6. [實戰專案架構：上班打卡系統程式碼解析](#-實戰專案架構上班打卡系統程式碼解析)
7. [常見錯誤與學生常見問題 (FAQ)](#-常見錯誤與學生常見問題-faq)

---

## 🌟 為什麼要學 Google Apps Script？

很多學生在學習網頁全端開發時，常遇到：
- ❌ **伺服器架設太複雜**：需要租用雲端主機（AWS、GCP、DigitalOcean）、設定 Linux、Domain、SSL 憑證。
- ❌ **資料庫門檻高**：需要安裝 MySQL、PostgreSQL，設定連線池與帳密防護。
- ❌ **跨網域與資安限制 (CORS)**：前後端分離串接經常卡在跨來源請求問題。

💡 **Google Apps Script (GAS) 的巨大優勢：**
1. **完全免費**：由 Google 免費提供運算資源與雲端伺服器。
2. **Google Sheet 即資料庫**：後端直接以直觀的試算表儲存資料，非資訊背景人員也能直接查看與篩選。
3. **自帶 HTTPS 網址**：公開部署為 Web App 後，Google 直接提供合法的 SSL 安全連線網址（`https://script.google.com/macros/s/.../exec`）。
4. **手機與電腦皆可用**：發布的網頁在任何智慧型手機瀏覽器皆能秒開。

---

## 🔐 權限體系概念：為什麼需要授權？

在學習 Google 授權時，初學者最常產生的疑惑是：
> *「我明明已經登入了我的 Google 帳號，為什麼執行程式時 Google 還一直跳出警告說需要授權？」*

請理解：**Google 的資安防護將權限拆分為兩種層次**：

```mermaid
flowchart TD
    subgraph Layer1 ["第一層：外部開發者 API 權限 (管理層)"]
        A["外部工具 (AI 助手 / CLI / 終端機)"] -->|OAuth 2.0 授權碼| B["Apps Script API 平台"]
        B -->|取得 Token| C["能在你的雲端新增專案、更新程式碼"]
    end

    subgraph Layer2 ["第二層：腳本內部 Runtime 權限 (資料層)"]
        D["Apps Script 腳本程式碼"] -->|SpreadsheetApp.openById()| E["你的個人 Google 試算表"]
        E -->|首次執行審查| F["帳號本人點擊『允許』存取此試算表"]
    end
```

1. **管理層權限**：控制誰可以在你的 Google 帳號中「建立、編輯專案」。
2. **資料層權限**：即使程式碼已經被上傳到專案中，在第一次執行時，Google 依然會強制**帳號擁有者本人**點擊一次「允許」，授權該腳本讀寫使用者的 Google Sheet 或聯絡人資料，防止惡意腳本在不知情的情況下外流資料。

---

## ⚠️ 新手必知兩大坑（避坑第一定律）

在教學現場中，有 **90% 的學生卡關** 都是因為踩到這兩個坑：

### 🛑 坑點 1：Apps Script API 開關未開啟
- **現象**：使用任何外部工具或 API 時，回傳 `Google Apps Script API has not been used or disabled`。
- **原因**：Google 預設關閉所有帳號的外部 API 呼叫開關。
- **解法**：每位學生第一次使用前，必須點開 👉 [https://script.google.com/home/usersettings](https://script.google.com/home/usersettings)，把 **「Google Apps Script API」** 由關閉切換為 **「開啟 (ON)」**。

### 🛑 坑點 2：外部 Drive 建立空殼專案導致 404
- **現象**：點擊專案連結直接跳出 `404 Not Found`。
- **原因**：若只透過 Google Drive API 建立空檔案（0 byte），沒有透過 Apps Script 容器服務進行初始化，Google 伺服器會找不到專案實體。
- **解法**：
  - **方法一（最推薦新手）**：在 Google Sheet 內部點擊 **「擴充功能」➔「Apps Script」** 開啟。
  - **方法二**：透過 `script.googleapis.com/v1/projects` 建立，並指定 `parentId` 綁定試算表。

---

## 🖥️ 教學實作 A：手動在瀏覽器完成授權與發布（零工具基礎）

### 步驟 1：建立試算表並開啟 Apps Script
1. 打開 [Google Drive](https://drive.google.com/)，點選「＋ 新增」➔「Google 試算表」。
2. 將試算表命名為 **`員工上班打卡紀錄表`**。
3. 在第一列分別輸入標題：
   - A1: `姓名`
   - B1: `打卡時間`
   - C1: `打卡類型`
   - D1: `備註`
4. 點擊頂端選單：**「擴充功能 (Extensions)」➔「Apps Script」**。

### 步驟 2：貼上打卡系統程式碼
1. 在開啟的程式碼編輯區，按 `Ctrl + A` 全選並刪除預設的空白程式碼。
2. 複製本專案 `examples/clock_in_webapp.gs` 的完整內容貼入。
3. 將頂端的 `CONFIG.SPREADSHEET_ID` 改為你剛剛試算表網址列中的 ID：
   `https://docs.google.com/spreadsheets/d/【這段就是試算表ID】/edit`
4. 按下 **`Ctrl + S`** 儲存專案。

### 步驟 3：執行首次授權（關鍵步驟圖解）
1. 編輯器上方函式選擇 `testClockIn`，點擊工具列的 **「▷ 執行 (Run)」**。
2. 畫面會跳出「需要授權」視窗：
   - 點擊 **「審查權限」**。
   - 選擇你的 Google 帳號。
   - 出現「Google 尚未驗證這個應用程式」時，請不要慌張，點擊左下方灰色的 **「進階 (Advanced)」**。
   - 點擊最下方的 **「前往『未命名專案』(不安全)」**。
   - 點擊右下角的藍色按鈕 **「允許 (Allow)」**。
3. 授權完成後，下方執行紀錄會顯示 `✅ 打卡寫入成功！`，切回你的 Google Sheet 會看到已經成功新增一筆測試打卡！

### 步驟 4：公開部署為 Web App
1. 點選右上角藍色按鈕 **「部署 (Deploy)」➔「新增部署作業 (New deployment)」**。
2. 點選左側齒輪 ⚙️ 選擇 **「網頁應用程式 (Web app)」**。
3. 填寫設定值：
   - **說明**：`打卡系統 v1`
   - **執行身分 (Execute as)**：選擇 **「我 (Me)」**（⚠️ 必選！這樣一般員工打卡時會借用你的寫入權限，員工就算沒有試算表編輯權限也能成功打卡）。
   - **誰可以存取 (Who has access)**：選擇 **「所有人 (Anyone)」**（⚠️ 必選！允許所有人免登入直接填寫）。
4. 點選右下角 **「部署」**。
5. 複製畫面上產生的 **「網頁應用程式網址」**（格式為 `https://script.google.com/macros/s/.../exec`）。
6. 將此網址傳到手機或用無痕視窗打開，即可開始即時打卡！

---

## ⚡ 教學實作 B：利用 AI / CLI 自動化授權與一鍵部署（進階技巧）

針對資訊科系或想學習自動化腳本的同學，本專案提供 PowerShell 自動化部署套件：

### 1. 取得開發者權限（`gas_auth.ps1`）
執行腳本啟動本地 HTTP 授權監聽：
```powershell
powershell -ExecutionPolicy Bypass -File ./scripts/gas_auth.ps1
```
- 腳本會調用 Google 官方開源工具 `@google/clasp` 的 OAuth Client。
- 瀏覽器自動彈出授權頁面，學生點擊「允許」後，本地監聽器會取得 Authorization Code 並自動換取 Access Token 與 Refresh Token，安全存於本地 `~/.clasprc.json`。

### 2. 全自動上傳與部署（`deploy_webapp.ps1`）
```powershell
powershell -ExecutionPolicy Bypass -File ./scripts/deploy_webapp.ps1
```
腳本會自動完成：
1. 呼叫 `script.googleapis.com` 在雲端建立專案並綁定試算表。
2. 組合 Web App 專屬 `appsscript.json` Manifest 與 `Code.gs`。
3. 建立發布版本（Version 1）。
4. 部署公開 Web App 並直接印出可用網址！

---

## 📂 實戰專案架構與程式碼解析

```text
google-apps-script-auth-guide/
├── SKILL.md                  # Antigravity AI 技能規範設定檔
├── README.md                 # 完整學生新手教學文件 (本檔)
├── scripts/
│   ├── gas_auth.ps1          # 自動化 OAuth 授權與 Token 存檔腳本
│   └── deploy_webapp.ps1     # 呼叫 Apps Script API 一鍵上傳發布腳本
└── examples/
    ├── appsscript.json       # Web App 清單設定檔 (定義時區與公開存取)
    └── clock_in_webapp.gs    # 單一檔案打卡系統 (內含後端處理與前端 UI)
```

### 為什麼推薦單一檔案設計？
一般 Google Apps Script Web App 會將後端寫在 `Code.gs`，前端寫在 `Index.html`。但對於初學者來說：
- 常常漏建 HTML 檔案，或檔名大小寫打錯（例如 `index` 打成 `Index`）。
- 部署時找不到檔案導致錯誤。

本專案採用 **單一檔案內嵌設計**：
```javascript
function doGet(e) {
  return HtmlService.createHtmlOutput(getHtmlContent_())
    .setTitle('員工線上打卡系統')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1');
}
```
把前端 HTML / CSS / JavaScript 完整封裝在 `getHtmlContent_()` 中，學生只需要貼上 **一隻檔案** 就能百分之百正常運作！

---

## ❓ 常見錯誤與學生常見問題 (FAQ)

### Q1：點開專案網址出現 404 Not Found？
> **原因**：該專案檔案尚未完成初始化。
> **解法**：請不要從 Google 雲端硬碟的「新專案」隨意建立，請一律打開你的 Google Sheet，點擊上方 **「擴充功能」➔「Apps Script」** 開啟！

### Q2：出現「需要存取權 (Request Access)」？
> **原因**：雖然專案已經部署成公開 Web App，但專案擁有者從未在編輯器裡面點過一次「執行」。
> **解法**：請專案擁有者打開 Apps Script 編輯器，上方選擇 `testClockIn`，點一次 **「▷ 執行」** 並在跳出的權限視窗點「允許」即可。

### Q3：別人點開打卡網址顯示「無法存取此服務」或要求登入？
> **原因**：部署時「誰可以存取 (Who has access)」選錯了。
> **解法**：請回編輯器點「部署」➔「管理部署作業」➔ 鉛筆圖示編輯 ➔ 將「誰可以存取」由「僅限自己」改成 **「所有人 (Anyone)」** ➔ 重新部署。

---

## 📜 開源許可與致謝
本專案教學手冊依據 Apache 2.0 協議開源釋出，歡迎全台灣高中職與大專院校資訊科技、專題研究教學自由引用與改作！
