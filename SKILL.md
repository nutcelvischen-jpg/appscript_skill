---
name: google-apps-script-auth
description: 專門解決 Antigravity 連動 Google Apps Script (GAS) 時容易卡死、404 報錯、授權失敗與無法部署 Web App 的完整新手指南與 AI 運作守則。
---

# Google Apps Script 授權與 Web App 部署指南（Antigravity 防卡死專用）

> [!CAUTION]
> **AI 助手（Antigravity Agent）必讀守則：**
> 1. **絕對不要使用 Google Drive API (`drive/v3/files`) 建立 `application/vnd.google-apps.script` 檔案！** 這樣建立只會產生 0 byte 空殼，使用者點開 **100% 會報 404 Not Found**，導致對話卡死。
> 2. **建立專案的唯一正確管道：**
>    - **推薦路徑**：指導使用者開啟 Google Sheet，點選上方「擴充功能 ➔ Apps Script」（直接綁定試算表，保證永不 404）。
>    - **API 路徑**：使用已取得 `script.projects` 授權之 Token，呼叫 `script.googleapis.com/v1/projects` 並傳入 `parentId`（試算表 ID）。
> 3. **永遠採用單一檔案（Single-file）寫法**：將 HTML 內嵌在 `doGet()` 的 `HtmlService.createHtmlOutput(...)` 中，避免學生手動新增 `Index.html` 時發生檔名大小寫錯誤。

---

## 一、為什麼大家用 Antigravity 連動 GAS 都會卡住？（5 大卡死病因）

| 卡死現象 | 根本原因 | 破解方式 |
| :--- | :--- | :--- |
| **1. 點開專案跳 404** | AI 用 Drive API 建立了空檔案，未經 Apps Script 引擎初始化 | **禁止用 Drive 建立**。一律由 Google Sheet「擴充功能 ➔ Apps Script」開啟。 |
| **2. API 呼叫卡死在 403** | Google 預設將帳號的外部 API 關閉 (`API disabled`) | 請使用者點開 [script.google.com/home/usersettings](https://script.google.com/home/usersettings) 將「Google Apps Script API」切換為 **開啟 (ON)**。 |
| **3. Web App 部署後顯示「需要存取權」** | 腳本發布了，但帳號擁有者未在編輯器內執行過任何一次函式 | 在編輯器內點擊 **「▷ 執行」** 任一函式，完成 Google 帳號授權即可。 |
| **4. 網頁開啟報錯 `Script function not found: doGet`** | 程式碼被拆分成多個檔案，或函式名稱打錯 | 一律使用前後端合一的單一檔案，內建標準 `doGet(e)` 入口。 |
| **5. 他人無法使用網頁** | 部署時「誰可以存取」選成「僅限自己」，或執行身分設錯 | 部署設定必須為：**執行身分：我 (Me)**、**誰可以存取：所有人 (Anyone)**。 |

---

## 二、Google Apps Script 權限雙層架構

Google 的資安機制將權限嚴格區分為兩層：

```mermaid
flowchart TD
    subgraph Layer1 ["第一層：專案管理權限 (Developer API)"]
        A["Antigravity / clasp CLI"] -->|OAuth 2.0 (script.projects)| B["Apps Script API"]
        B -->|取得 Token| C["可以在雲端建立專案、上傳程式碼"]
    end

    subgraph Layer2 ["第二層：資料存取權限 (Script Runtime)"]
        D["雲端執行的 Code.gs"] -->|SpreadsheetApp.openById()| E["Google 試算表"]
        E -->|首次執行審查| F["擁有者本人點擊『允許』存取試算表"]
    end
```

- **第一層**：決定外部工具能否幫你寫程式碼。
- **第二層**：決定你的腳本能否讀寫試算表。**即使第一層自動化完成，第二層依然必須由擁有者本人在瀏覽器點一次「▷ 執行」授權。**

---

## 三、標準作業流程（SOP）：零卡死引導法

### 第一步：後端試算表初始化（AI 可全自動）
1. 建立目標 Google Sheet（例如：`員工上班打卡紀錄表`）。
2. 初始化標題欄位：`姓名`、`打卡時間`、`打卡類型`、`備註`。
3. 取得該試算表的 `SPREADSHEET_ID`。

### 第二步：建立 Apps Script 專案（避免 404）
- **新手引導模式**：
  提供試算表連結，引導學生點選 **「擴充功能」➔「Apps Script」**。
- **自動化模式**：
  呼叫 `POST https://script.googleapis.com/v1/projects`，帶入 `parentId: SPREADSHEET_ID`。

### 第三步：提供防呆單一檔案程式碼
將完整前後端包裝於單一 `.gs` 檔案中（範例見 [`examples/clock_in_webapp.gs`](./examples/clock_in_webapp.gs)）：
- 內嵌 HTML 介面與即時時鐘
- 內嵌 `submitClockIn()` 寫入邏輯
- 內建 `testClockIn()` 專用測試函式

### 第四步：完成一鍵授權測試
引導學生在編輯器上方選擇 `testClockIn` ➔ 點擊 **「▷ 執行 (Run)」**：
1. 審查權限 ➔ 選擇帳號
2. 進階 ➔ 前往專案 (不安全) ➔ 允許

### 第五步：標準公開 Web App 部署
1. 點擊右上角 **「部署 (Deploy)」➔「新增部署作業」**
2. 齒輪 ⚙️ 選擇 **「網頁應用程式 (Web app)」**
3. **執行身分**：`我 (Me)`
4. **誰可以存取**：`所有人 (Anyone)`
5. 點擊「部署」，取得 `/exec` 公開網址！
