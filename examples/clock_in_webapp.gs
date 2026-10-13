/**
 * ====================================================================
 * 🕒 Staff clock-in / clock-out web app (Google Apps Script, single-file edition)
 * ====================================================================
 * Back end: a Google Sheet (for example "Staff Clock-in Log").
 * Put its ID in CONFIG.SPREADSHEET_ID below. The ID is the part of the Sheet URL between /d/ and /edit:
 * https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
 *
 * [Public deployment steps]
 * 1. Paste this whole file into "Code.gs" in Google Apps Script and press Ctrl + S to save
 * 2. Click "Deploy" ➔ "New deployment" at the top right
 * 3. Click the gear next to "Select type" and choose "Web app"
 * 4. Settings:
 *    - Description: Staff clock-in v1
 *    - Execute as: "Me"
 *    - Who has access: "Anyone" (required for a public deployment!)
 * 5. Click "Deploy"; on the first deployment click "Authorize access" to grant your Google account permission
 * 6. Copy the "Web app URL" and share it with everyone who needs to clock in!
 */

const CONFIG = {
  SPREADSHEET_ID: 'PASTE_YOUR_SPREADSHEET_ID_HERE',
  SHEET_NAME: 'Clock-ins',
  TIMEZONE: 'Asia/Taipei',   // change to your time zone, e.g. 'Europe/London'
};

/**
 * Web entry point: shows the clock-in page when someone opens the public URL
 */
function doGet(e) {
  return HtmlService.createHtmlOutput(getHtmlContent_())
    .setTitle('Staff Clock-in')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1');
}

/**
 * Receives a clock-in request from the page and writes it to the Google Sheet
 * @param {Object} payload - { name: string, type: string, note: string }
 */
function submitClockIn(payload) {
  if (!payload || !payload.name || String(payload.name).trim() === '') {
    throw new Error('Please enter your name!');
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const sheet = getOrCreateSheet_();
    const now = new Date();
    const formattedTime = Utilities.formatDate(now, CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
    const cleanName = String(payload.name).trim();
    const clockType = payload.type ? String(payload.type).trim() : 'Clock in';
    const note = payload.note ? String(payload.note).trim() : '';

    // Append one row: [Name, Time, Type, Note]
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
 * Reads the latest N clock-ins for the page to display
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

  // newest first
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
 * Gets or initializes the clock-in sheet
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
    sheet.appendRow(['Name', 'Time', 'Type', 'Note']);
    sheet.getRange('A1:D1').setFontWeight('bold').setBackground('#1E3A8A').setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * Test / authorization helper (choose it in the editor and click Run to write one test clock-in)
 */
function testClockIn() {
  const res = submitClockIn({
    name: 'Test User (connection test)',
    type: 'Clock in',
    note: 'Apps Script authorization and connection test OK',
  });
  console.log('✅ Clock-in saved!', JSON.stringify(res));
}

/**
 * Full front end: HTML + CSS + JS embedded in this single file (no separate HTML file needed)
 */
function getHtmlContent_() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Staff Clock-in</title>
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
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
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
      <span class="badge">Live Google Sheets connection</span>
      <h1>🕒 Staff Clock-in</h1>
    </div>

    <div class="clock-box">
      <div class="clock-date" id="clockDate">Loading date...</div>
      <div class="clock-time" id="clockTime">00:00:00</div>
    </div>

    <div class="form-group">
      <label for="empName">Your name <span style="color:#ef4444">*</span></label>
      <input type="text" id="empName" placeholder="Enter your name (e.g. Alex Wang)" autocomplete="name">
    </div>

    <div class="form-group">
      <label for="empNote">Note (optional)</label>
      <input type="text" id="empNote" placeholder="e.g. In office, working from home, client visit">
    </div>

    <div class="btn-group">
      <button type="button" class="btn-in" id="btnClockIn" onclick="handleClock('Clock in')">
        ☀️ Clock in
      </button>
      <button type="button" class="btn-out" id="btnClockOut" onclick="handleClock('Clock out')">
        🌙 Clock out
      </button>
    </div>

    <div id="statusBox" class="status-box"></div>

    <div class="history-section">
      <div class="history-header">
        <h2>📋 Latest clock-ins (last 10)</h2>
        <a class="sheet-link" href="https://docs.google.com/spreadsheets/d/${CONFIG.SPREADSHEET_ID}/edit" target="_blank">Open the Google Sheet ↗</a>
      </div>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Time</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody id="recordsBody">
          <tr><td colspan="3" style="text-align:center;color:#94a3b8;padding:16px;">Loading records...</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <script>
    // 1. Live clock
    function updateClock() {
      const now = new Date();
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      const day = days[now.getDay()];
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');

      document.getElementById('clockDate').textContent = day + ', ' + y + '-' + m + '-' + d;
      document.getElementById('clockTime').textContent = hh + ':' + mm + ':' + ss;
    }
    setInterval(updateClock, 1000);
    updateClock();

    // 2. Pre-fill the name saved last time
    window.addEventListener('DOMContentLoaded', function() {
      const savedName = localStorage.getItem('gas_clockin_name');
      if (savedName) {
        document.getElementById('empName').value = savedName;
      }
      loadRecentRecords();
    });

    // 3. Submit a clock-in
    function handleClock(clockType) {
      const nameInput = document.getElementById('empName');
      const noteInput = document.getElementById('empNote');
      const name = nameInput.value.trim();
      const note = noteInput.value.trim();

      if (!name) {
        showStatus('⚠️ Please enter your name before clocking in!', true);
        nameInput.focus();
        return;
      }

      // remember the name for next time
      localStorage.setItem('gas_clockin_name', name);

      setButtonsDisabled(true);
      showStatus('⏳ Saving to the Google Sheet, please wait...', false);

      google.script.run
        .withSuccessHandler(function(res) {
          setButtonsDisabled(false);
          noteInput.value = '';
          showStatus(
            '✅ <strong>' + escapeHtml(res.type) + ' saved!</strong><br>' +
            '👤 Name: ' + escapeHtml(res.name) + '<br>' +
            '🕒 Time: ' + escapeHtml(res.timestamp),
            false
          );
          renderRecords(res.records || []);
        })
        .withFailureHandler(function(err) {
          setButtonsDisabled(false);
          showStatus('❌ Clock-in failed: ' + (err && err.message ? err.message : err), true);
        })
        .submitClockIn({ name: name, type: clockType, note: note });
    }

    // 4. Load the latest clock-ins
    function loadRecentRecords() {
      if (typeof google === 'undefined' || !google.script) return;
      google.script.run
        .withSuccessHandler(renderRecords)
        .withFailureHandler(function() {
          document.getElementById('recordsBody').innerHTML =
            '<tr><td colspan="3" style="text-align:center;color:#94a3b8;">No records yet, or loading failed</td></tr>';
        })
        .getRecentRecords(10);
    }

    function renderRecords(records) {
      const tbody = document.getElementById('recordsBody');
      if (!records || records.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#94a3b8;padding:16px;">No clock-ins yet</td></tr>';
        return;
      }
      tbody.innerHTML = records.map(function(r) {
        const isOut = r.type && r.type.toLowerCase().indexOf('out') !== -1;
        const tagClass = isOut ? 'tag tag-out' : 'tag tag-in';
        return '<tr>' +
          '<td><strong>' + escapeHtml(r.name) + '</strong>' + (r.note ? '<div style="font-size:11px;color:#64748b;">' + escapeHtml(r.note) + '</div>' : '') + '</td>' +
          '<td style="font-variant-numeric:tabular-nums;">' + escapeHtml(r.timestamp) + '</td>' +
          '<td><span class="' + tagClass + '">' + escapeHtml(r.type || 'Clock in') + '</span></td>' +
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
