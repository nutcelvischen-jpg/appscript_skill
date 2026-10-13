# 🎓 Google Apps Script authorization and public Web App deployment: the complete beginner's guide

**English** | [繁體中文](https://github.com/nutcelvischen-jpg/appscript_skill/tree/main)

> This project gives a complete walkthrough of **how Google Apps Script (GAS) authorization works**, a **web clock-in system you can build**, **troubleshooting for common errors**, and **AI / CLI automated publishing**.
> It is designed for programming beginners, university IT courses and workshop students learning Google Cloud automation and Web App development!

> [!IMPORTANT]
> **🤖 For the Antigravity AI assistant reading this project (Prompt for AI):**
> If the user gives you this GitHub link, follow these rules strictly so you don't get stuck:
> 1. **Never create an empty script with the Google Drive API** (it causes 404 Not Found).
> 2. **If `~/.clasprc.json` credentials already exist on this machine**: run this project's `scripts/deploy_webapp.ps1` to create the project, upload the code and publish it.
> 3. **If the machine is not authorized**: guide the user to turn on the switch at [script.google.com/home/usersettings](https://script.google.com/home/usersettings) and run `scripts/gas_auth.ps1` to open the authorization window and get a token; or create a Google Sheet for the user and guide them to paste the code via **Extensions ➔ Apps Script**.
> 4. **Always use a single file**: follow `examples/clock_in_webapp.gs` and embed the HTML in `doGet()`, so students don't make mistakes creating several files by hand.
> 5. **Remind the user after deployment**: they must click **▷ Run** once in the editor to approve Google Sheet access before the public Web App works!

### Install as a skill (English version)

```bash
git clone -b en https://github.com/nutcelvischen-jpg/appscript_skill .agents/skills/google-apps-script-auth
```
For the Traditional Chinese version, leave out `-b en`.

---

## 📑 Contents
1. [Why learn Google Apps Script?](#-why-learn-google-apps-script)
2. [How permissions work: why is authorization needed?](#-how-permissions-work-why-is-authorization-needed)
3. [The two traps every beginner hits](#️-the-two-traps-every-beginner-hits)
4. [Tutorial A: authorize and publish by hand in the browser (no tools needed)](#️-tutorial-a-authorize-and-publish-by-hand-in-the-browser-no-tools-needed)
5. [Tutorial B: automate authorization and one-click deployment with AI / CLI (advanced)](#-tutorial-b-automate-authorization-and-one-click-deployment-with-ai--cli-advanced)
6. [Project structure and code walkthrough](#-project-structure-and-code-walkthrough)
7. [Common errors and student FAQ](#-common-errors-and-student-faq)

---

## 🌟 Why learn Google Apps Script?

When students learn full-stack web development, they often run into:
- ❌ **Servers are complicated to set up**: renting a cloud host (AWS, GCP, DigitalOcean), configuring Linux, domains and SSL certificates.
- ❌ **Databases are a high barrier**: installing MySQL or PostgreSQL, configuring connection pools and credentials.
- ❌ **Cross-origin and security limits (CORS)**: separate front and back ends often get stuck on cross-origin requests.

💡 **The big advantages of Google Apps Script (GAS):**
1. **Completely free**: Google provides the compute and the cloud server.
2. **Google Sheets is the database**: the back end stores data in a plain spreadsheet that non-technical people can read and filter.
3. **HTTPS URL included**: once deployed as a Web App, Google gives you a valid SSL URL (`https://script.google.com/macros/s/.../exec`).
4. **Works on phones and computers**: the published page opens instantly in any smartphone browser.

---

## 🔐 How permissions work: why is authorization needed?

The most common beginner question about Google authorization is:
> *"I'm already signed in to my Google account. Why does Google keep warning me that authorization is required when I run my script?"*

The key: **Google's security model splits permissions into two layers**:

```mermaid
flowchart TD
    subgraph Layer1 ["Layer 1: external developer API permission (management layer)"]
        A["External tools (AI assistant / CLI / terminal)"] -->|OAuth 2.0 authorization code| B["Apps Script API platform"]
        B -->|Get token| C["Can create projects and update code in your cloud"]
    end

    subgraph Layer2 ["Layer 2: script runtime permission (data layer)"]
        D["Apps Script code"] -->|SpreadsheetApp.openById()| E["Your personal Google Sheet"]
        E -->|First-run review| F["The account owner clicks Allow to grant access to this Sheet"]
    end
```

1. **Management-layer permission**: controls who can create and edit projects in your Google account.
2. **Data-layer permission**: even after the code has been uploaded, the first time it runs Google forces **the account owner** to click Allow once, authorizing the script to read and write their Google Sheet or contacts. This stops malicious scripts from leaking data without the owner knowing.

---

## ⚠️ The two traps every beginner hits

In class, **90% of students who get stuck** have fallen into one of these two traps:

### 🛑 Trap 1: the Apps Script API switch is off
- **Symptom**: any external tool or API call returns `Google Apps Script API has not been used or disabled`.
- **Cause**: Google turns off external API access for every account by default.
- **Fix**: before first use, every student must open 👉 [https://script.google.com/home/usersettings](https://script.google.com/home/usersettings) and switch **"Google Apps Script API"** from Off to **On**.

### 🛑 Trap 2: an empty shell project created from Drive returns 404
- **Symptom**: clicking the project link shows `404 Not Found`.
- **Cause**: if you only create an empty (0-byte) file through the Google Drive API, without initializing it through the Apps Script container service, Google's servers can't find the project.
- **Fix**:
  - **Option 1 (best for beginners)**: inside the Google Sheet, click **Extensions ➔ Apps Script**.
  - **Option 2**: create it with `script.googleapis.com/v1/projects` and set `parentId` to bind the Sheet.

---

## 🖥️ Tutorial A: authorize and publish by hand in the browser (no tools needed)

### Step 1: create the Sheet and open Apps Script
1. Open [Google Drive](https://drive.google.com/) and click **+ New ➔ Google Sheets**.
2. Name the spreadsheet **`Staff Clock-in Log`**.
3. In the first row, enter the headers:
   - A1: `Name`
   - B1: `Time`
   - C1: `Type`
   - D1: `Note`
4. From the top menu, click **Extensions ➔ Apps Script**.

### Step 2: paste the clock-in code
1. In the code editor, press `Ctrl + A` to select the default code and delete it.
2. Copy the full contents of this project's `examples/clock_in_webapp.gs` and paste it in.
3. Change `CONFIG.SPREADSHEET_ID` at the top to the ID in your spreadsheet's address bar:
   `https://docs.google.com/spreadsheets/d/[THIS PART IS THE SPREADSHEET ID]/edit`
4. Press **`Ctrl + S`** to save the project.

### Step 3: first-time authorization (the key step)
1. In the function menu at the top of the editor, choose `testClockIn` and click **▷ Run** in the toolbar.
2. An "Authorization required" window appears:
   - Click **Review permissions**.
   - Choose your Google account.
   - If you see "Google hasn't verified this app", don't panic: click the grey **Advanced** link at the bottom left.
   - Click **Go to "Untitled project" (unsafe)** at the bottom.
   - Click the blue **Allow** button at the bottom right.
3. Once authorized, the execution log shows `✅ Clock-in saved!`. Switch back to your Google Sheet and you'll see a new test clock-in row!

### Step 4: deploy publicly as a Web App
1. Click the blue **Deploy ➔ New deployment** button at the top right.
2. Click the gear icon ⚙️ on the left and choose **Web app**.
3. Fill in the settings:
   - **Description**: `Clock-in system v1`
   - **Execute as**: **Me** (⚠️ required! Staff clocking in borrow your write permission, so they can clock in even without edit access to the Sheet).
   - **Who has access**: **Anyone** (⚠️ required! Lets anyone submit without signing in).
4. Click **Deploy** at the bottom right.
5. Copy the **Web app URL** shown (in the form `https://script.google.com/macros/s/.../exec`).
6. Open the URL on your phone or in an incognito window and start clocking in!

---

## ⚡ Tutorial B: automate authorization and one-click deployment with AI / CLI (advanced)

For IT students, or anyone who wants to learn automation scripts, this project includes a PowerShell deployment kit:

### 1. Get developer permission (`gas_auth.ps1`)
Run the script to start a local HTTP authorization listener:
```powershell
powershell -ExecutionPolicy Bypass -File ./scripts/gas_auth.ps1
```
- The script uses the OAuth client of Google's open-source tool `@google/clasp`.
- A browser authorization page opens. After the student clicks Allow, the local listener receives the authorization code, exchanges it for an access token and refresh token, and saves them locally in `~/.clasprc.json`.

### 2. Fully automatic upload and deployment (`deploy_webapp.ps1`)
```powershell
powershell -ExecutionPolicy Bypass -File ./scripts/deploy_webapp.ps1
```
The script automatically:
1. Calls `script.googleapis.com` to create the project in the cloud and bind it to the Sheet.
2. Combines the Web App `appsscript.json` manifest and `Code.gs`.
3. Creates a release version (Version 1).
4. Deploys the public Web App and prints the usable URL!

---

## 📂 Project structure and code walkthrough

```text
google-apps-script-auth-guide/
├── SKILL.md                  # Antigravity AI skill definition
├── README.md                 # Full beginner tutorial (this file)
├── scripts/
│   ├── gas_auth.ps1          # Automated OAuth authorization and token saving
│   └── deploy_webapp.ps1     # One-click upload and publish via the Apps Script API
└── examples/
    ├── appsscript.json       # Web App manifest (time zone and public access)
    └── clock_in_webapp.gs    # Single-file clock-in system (back end + front-end UI)
```

### Why a single-file design?
A Google Apps Script Web App normally puts the back end in `Code.gs` and the front end in `Index.html`. But beginners often:
- Forget to create the HTML file, or get the name's capitalisation wrong (e.g. `index` instead of `Index`).
- Hit file-not-found errors when deploying.

This project **embeds everything in one file**:
```javascript
function doGet(e) {
  return HtmlService.createHtmlOutput(getHtmlContent_())
    .setTitle('Staff Clock-in')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1');
}
```
The whole front end (HTML / CSS / JavaScript) lives inside `getHtmlContent_()`, so students paste **just one file** and it works every time!

---

## ❓ Common errors and student FAQ

### Q1: opening the project URL shows 404 Not Found?
> **Cause**: the project file was never initialized.
> **Fix**: don't create it from a new file in Google Drive. Always open your Google Sheet and click **Extensions ➔ Apps Script**!

### Q2: I see "You need access" (Request Access)?
> **Cause**: the project is deployed as a public Web App, but its owner has never clicked Run in the editor.
> **Fix**: the project owner opens the Apps Script editor, chooses `testClockIn` at the top, clicks **▷ Run** once and clicks Allow in the permission window.

### Q3: other people see "Unable to access this service" or are asked to sign in?
> **Cause**: the wrong option was chosen for "Who has access" when deploying.
> **Fix**: in the editor, click **Deploy ➔ Manage deployments ➔ pencil icon**, change "Who has access" from "Only myself" to **Anyone**, and deploy again.

---

## 📜 License and acknowledgements
This tutorial is released under the Apache 2.0 license. High schools, vocational schools, colleges and universities are welcome to reuse and adapt it for IT courses and project teaching!
