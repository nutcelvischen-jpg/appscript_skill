/**
 * ====================================================================
 * 🕒 員工上下班打卡網頁系統 (Google Apps Script 單一檔案完整版)
 * ====================================================================
 * 後端 Google Sheet 已自動建立並綁定：
 * 試算表名稱：員工上班打卡紀錄表
 * 試算表網址：https://docs.google.com/spreadsheets/d/1R0ebkEe-XHL-KWfoAc6Sm7QknuPqQI54ZO_Q__ixaRU/edit
 *
 * 【公開部署步驟】
 * 1. 將本檔案全部內容貼入 Google Apps Script 的「程式碼.gs」中，按 Ctrl + S 儲存
 * 2. 點擊右上角「部署 (Deploy)」➔「新增部署作業 (New deployment)」
 * 3. 左上角齒輪「選取類型」選擇「網頁應用程式 (Web app)」
 * 4. 設定如下：
 *    - 說明：員工打卡系統 v1
 *    - 執行身分 (Execute as)：「我 (Me)」
 *    - 誰可以存取 (Who has access)：「所有人 (Anyone)」(公開部署必選！)
 * 5. 點擊「部署 (Deploy)」，首次部署請點擊「授予存取權」完成 Google 帳號授權
 * 6. 複製產生的「網頁應用程式網址 (Web app URL)」即可分享給所有人打卡！
 */

const CONFIG = {
  SPREADSHEET_ID: '1R0ebkEe-XHL-KWfoAc6Sm7QknuPqQI54ZO_Q__ixaRU',
  SHEET_NAME: '打卡紀錄',
  TIMEZONE: 'Asia/Taipei',
};

/**
 * 網頁入口：當使用者開啟公開部署網址時顯示打卡網頁
 */
function doGet(e) {
  return HtmlService.createHtmlOutput(getHtmlContent_())
    .setTitle('員工線上打卡系統')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1');
}

/**
 * 接收前端打卡請求並寫入 Google Sheet
 * @param {Object} payload - { name: string, type: string, note: string }
 */
function submitClockIn(payload) {
  if (!payload || !payload.name || String(payload.name).trim() === '') {
    throw new Error('請輸入您的姓名！');
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const sheet = getOrCreateSheet_();
    const now = new Date();
    const formattedTime = Utilities.formatDate(now, CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
    const cleanName = String(payload.name).trim();
    const clockType = payload.type ? String(payload.type).trim() : '上班打卡';
    const note = payload.note ? String(payload.note).trim() : '';

    // 寫入一列：[姓名, 打卡時間, 打卡類型, 備註]
    sheet.appendRow([cleanName, formattedTime, clockType, note]);

    return {
      success: true,
      name: cleanName,
      timestamp: formattedTime,
      type: clockType,
      note: note,
      records: getRecentRecords(10),
    };
  } finally {
    lock.releaseLock();
  }
}

/**
 * 讀取最近 N 筆打卡紀錄供前端即時顯示
 */
function getRecentRecords(limit) {
  const maxRows = limit || 10;
  const sheet = getOrCreateSheet_();
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    return [];
  }

  const startRow = Math.max(2, lastRow - maxRows + 1);
  const numRows = lastRow - startRow + 1;
  const values = sheet.getRange(startRow, 1, numRows, 4).getDisplayValues();

  // 由最新到最舊排序
  return values.reverse().map(function (row) {
    return {
      name: row[0] || '',
      timestamp: row[1] || '',
      type: row[2] || '',
      note: row[3] || '',
    };
  });
}

/**
 * 取得或初始化「打卡紀錄」工作表
 */
function getOrCreateSheet_() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    sheet = ss.getSheets()[0];
    if (sheet) {
      sheet.setName(CONFIG.SHEET_NAME);
    } else {
      sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    }
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['姓名', '打卡時間', '打卡類型', '備註']);
    sheet.getRange('A1:D1').setFontWeight('bold').setBackground('#1E3A8A').setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * 測試與授權專用函式（可在編輯器上方直接點「執行」測試寫入一筆打卡）
 */
function testClockIn() {
  const res = submitClockIn({
    name: '測試人員 (系統連線測試)',
    type: '上班打卡',
    note: 'Apps Script 授權與連線測試成功',
  });
  console.log('✅ 打卡寫入成功！', JSON.stringify(res));
}

/**
 * 前端完整 HTML + CSS + JS 介面（單一檔案內嵌，免另外建立 HTML 檔）
 */
function getHtmlContent_() {
  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8">
  <title>員工線上打卡系統</title>
  <style>
    :root {
      --primary: #2563eb;
      --primary-hover: #1d4ed8;
      --success: #059669;
      --success-hover: #047857;
      --secondary: #4f46e5;
      --secondary-hover: #4338ca;
      --bg: #f1f5f9;
      --card: #ffffff;
      --text: #0f172a;
      --muted: #64748b;
      --border: #e2e8f0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft JhengHei", sans-serif;
    }
    body {
      background: linear-gradient(135deg, #e0e7ff 0%, #f1f5f9 100%);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 28px 16px;
    }
    .container {
      width: 100%;
      max-width: 520px;
      background: var(--card);
      border-radius: 20px;
      box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
      padding: 28px 24px;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
    }
    .badge {
      display: inline-block;
      background: #dbeafe;
      color: #1e40af;
      font-size: 13px;
      font-weight: 600;
      padding: 4px 12px;
      border-radius: 999px;
      margin-bottom: 8px;
    }
    .header h1 {
      font-size: 24px;
      font-weight: 800;
      color: #1e293b;
    }
    .clock-box {
      background: #0f172a;
      color: #f8fafc;
      border-radius: 16px;
      padding: 20px;
      text-align: center;
      margin-bottom: 22px;
      box-shadow: inset 0 2px 6px rgba(255,255,255,0.06);
    }
    .clock-date {
      font-size: 14px;
      color: #94a3b8;
      margin-bottom: 6px;
      letter-spacing: 0.5px;
    }
    .clock-time {
      font-size: 40px;
      font-weight: 800;
      font-variant-numeric: tabular-nums;
      letter-spacing: 2px;
      color: #38bdf8;
    }
    .form-group {
      margin-bottom: 16px;
    }
    label {
      display: block;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 6px;
      color: #334155;
    }
    input[type="text"] {
      width: 100%;
      padding: 13px 14px;
      font-size: 16px;
      border: 1.5px solid var(--border);
      border-radius: 12px;
      outline: none;
      transition: all 0.2s;
    }
    input[type="text"]:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
    }
    .btn-group {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-top: 20px;
    }
    button {
      border: none;
      border-radius: 12px;
      padding: 15px 16px;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      transition: transform 0.1s, background-color 0.2s, opacity 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: #ffffff;
    }
    button:active {
      transform: scale(0.98);
    }
    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .btn-in {
      background: var(--success);
    }
    .btn-in:hover:not(:disabled) {
      background: var(--success-hover);
    }
    .btn-out {
      background: var(--secondary);
    }
    .btn-out:hover:not(:disabled) {
      background: var(--secondary-hover);
    }
    .status-box {
      margin-top: 18px;
      padding: 14px 16px;
      border-radius: 12px;
      font-size: 14px;
      line-height: 1.5;
      display: none;
    }
    .status-success {
      display: block;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #065f46;
    }
    .status-error {
      display: block;
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
    }
    .history-section {
      margin-top: 26px;
      border-top: 1px solid var(--border);
      padding-top: 18px;
    }
    .history-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .history-header h2 {
      font-size: 15px;
      font-weight: 700;
      color: #334155;
    }
    .sheet-link {
      font-size: 12px;
      color: var(--primary);
      text-decoration: none;
      font-weight: 600;
    }
    .sheet-link:hover {
      text-decoration: underline;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th, td {
      padding: 9px 8px;
      text-align: left;
      border-bottom: 1px solid #f1f5f9;
    }
    th {
      color: var(--muted);
      font-weight: 600;
      background: #f8fafc;
    }
    .tag {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
    }
    .tag-in {
      background: #d1fae5;
      color: #065f46;
    }
    .tag-out {
      background: #e0e7ff;
      color: #3730a3;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="badge">Google Sheets 即時連線</span>
      <h1>🕒 員工線上打卡系統</h1>
    </div>

    <div class="clock-box">
      <div class="clock-date" id="clockDate">載入日期中...</div>
      <div class="clock-time" id="clockTime">00:00:00</div>
    </div>

    <div class="form-group">
      <label for="empName">員工姓名 <span style="color:#ef4444">*</span></label>
      <input type="text" id="empName" placeholder="請輸入您的姓名（例如：王小明）" autocomplete="name">
    </div>

    <div class="form-group">
      <label for="empNote">打卡備註（選填）</label>
      <input type="text" id="empNote" placeholder="例如：正常出勤、居家辦公、外勤拜訪">
    </div>

    <div class="btn-group">
      <button type="button" class="btn-in" id="btnClockIn" onclick="handleClock('上班打卡')">
        ☀️ 上班打卡
      </button>
      <button type="button" class="btn-out" id="btnClockOut" onclick="handleClock('下班打卡')">
        🌙 下班打卡
      </button>
    </div>

    <div id="statusBox" class="status-box"></div>

    <div class="history-section">
      <div class="history-header">
        <h2>📋 最新打卡紀錄（前 10 筆）</h2>
        <a class="sheet-link" href="https://docs.google.com/spreadsheets/d/${CONFIG.SPREADSHEET_ID}/edit" target="_blank">開啟後端 Google Sheet ↗</a>
      </div>
      <table>
        <thead>
          <tr>
            <th>姓名</th>
            <th>打卡時間</th>
            <th>類型</th>
          </tr>
        </thead>
        <tbody id="recordsBody">
          <tr><td colspan="3" style="text-align:center;color:#94a3b8;padding:16px;">讀取紀錄中...</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <script>
    // 1. 即時時鐘更新
    function updateClock() {
      const now = new Date();
      const days = ['日', '一', '二', '三', '四', '五', '六'];
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      const day = days[now.getDay()];
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');

      document.getElementById('clockDate').textContent = y + ' 年 ' + m + ' 月 ' + d + ' 日（星期' + day + '）';
      document.getElementById('clockTime').textContent = hh + ':' + mm + ':' + ss;
    }
    setInterval(updateClock, 1000);
    updateClock();

    // 2. 自動帶入上次儲存的姓名
    window.addEventListener('DOMContentLoaded', function() {
      const savedName = localStorage.getItem('gas_clockin_name');
      if (savedName) {
        document.getElementById('empName').value = savedName;
      }
      loadRecentRecords();
    });

    // 3. 送出打卡
    function handleClock(clockType) {
      const nameInput = document.getElementById('empName');
      const noteInput = document.getElementById('empNote');
      const name = nameInput.value.trim();
      const note = noteInput.value.trim();

      if (!name) {
        showStatus('⚠️ 請先輸入您的「員工姓名」再點擊打卡！', true);
        nameInput.focus();
        return;
      }

      // 記住姓名方便下次打卡
      localStorage.setItem('gas_clockin_name', name);

      setButtonsDisabled(true);
      showStatus('⏳ 正在寫入 Google Sheet 打卡紀錄中，請稍候...', false);

      google.script.run
        .withSuccessHandler(function(res) {
          setButtonsDisabled(false);
          noteInput.value = '';
          showStatus(
            '✅ <strong>' + escapeHtml(res.type) + '成功！</strong><br>' +
            '👤 姓名：' + escapeHtml(res.name) + '<br>' +
            '🕒 時間：' + escapeHtml(res.timestamp),
            false
          );
          renderRecords(res.records || []);
        })
        .withFailureHandler(function(err) {
          setButtonsDisabled(false);
          showStatus('❌ 打卡失敗：' + (err && err.message ? err.message : err), true);
        })
        .submitClockIn({ name: name, type: clockType, note: note });
    }

    // 4. 載入最新打卡紀錄
    function loadRecentRecords() {
      if (typeof google === 'undefined' || !google.script) return;
      google.script.run
        .withSuccessHandler(renderRecords)
        .withFailureHandler(function() {
          document.getElementById('recordsBody').innerHTML =
            '<tr><td colspan="3" style="text-align:center;color:#94a3b8;">尚無紀錄或讀取失敗</td></tr>';
        })
        .getRecentRecords(10);
    }

    function renderRecords(records) {
      const tbody = document.getElementById('recordsBody');
      if (!records || records.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#94a3b8;padding:16px;">目前尚無打卡紀錄</td></tr>';
        return;
      }
      tbody.innerHTML = records.map(function(r) {
        const isOut = r.type && r.type.indexOf('下班') !== -1;
        const tagClass = isOut ? 'tag tag-out' : 'tag tag-in';
        return '<tr>' +
          '<td><strong>' + escapeHtml(r.name) + '</strong>' + (r.note ? '<div style="font-size:11px;color:#64748b;">' + escapeHtml(r.note) + '</div>' : '') + '</td>' +
          '<td style="font-variant-numeric:tabular-nums;">' + escapeHtml(r.timestamp) + '</td>' +
          '<td><span class="' + tagClass + '">' + escapeHtml(r.type || '上班打卡') + '</span></td>' +
        '</tr>';
      }).join('');
    }

    function showStatus(html, isError) {
      const box = document.getElementById('statusBox');
      box.className = 'status-box ' + (isError ? 'status-error' : 'status-success');
      box.innerHTML = html;
    }

    function setButtonsDisabled(disabled) {
      document.getElementById('btnClockIn').disabled = disabled;
      document.getElementById('btnClockOut').disabled = disabled;
    }

    function escapeHtml(str) {
      return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }
  </script>
</body>
</html>`;
}
