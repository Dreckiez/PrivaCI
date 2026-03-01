# 🛡️ PrivaCI

> **An automated, full-stack DevSecOps platform for detecting hardcoded secrets, API keys, and PII across GitHub repositories.**

PrivaCI acts as an asynchronous, non-blocking CI/CD security gate. It integrates directly with GitHub via OAuth, cloning repositories into isolated environments, and orchestrating `gitleaks` child processes to scan codebases against baseline and custom-defined vulnerability heuristics.

![PrivaCI Dashboard](/images/Login.png)

## 🚀 Key Features

* **Instant GitHub Integration:** One-click OAuth authentication that securely maps user identities and synchronizes repository metadata.
* **Asynchronous Execution Engine:** Spawns isolated Node.js child processes to clone repositories and run localized DevSecOps scans without blocking the main event loop.
* **Custom Threat Intelligence (Regex Rules):** Users can define custom regular expressions to detect proprietary secrets. PrivaCI dynamically compiles these into strict TOML configurations and injects them into the scanning engine at runtime.
* **Stateful Vulnerability Management:** A dynamic "Audit Trail" allowing developers to flag false positives (`[ Ignore_Warning ]`). PostgreSQL transactions automatically recalculate branch security postures and update the UI instantly.

## 🛠️ Technology Stack

**Frontend:**
* Angular
* Tailwind CSS

**Backend:**
* Node.js & Express.js
* PostgreSQL

**Security & Scanning:**
* **Gitleaks (v8.18):** Core SAST engine.

## ⚙️ Core Architecture Flow

1. **Authentication:** User logs in via GitHub OAuth. An encrypted `access_token` is stored in PostgreSQL.
2. **Scan Initialization:** The backend provisions a temporary workspace (`os.tmpdir()`) and performs a shallow git clone using the decrypted token.
3. **Rule Compilation:** User-defined custom Regex rules are fetched from the DB, formatted into native TOML strings, and written to the isolated workspace.
4. **Execution:** The Node backend spawns a `gitleaks` process, passing the code and custom TOML config.
5. **Teardown & Sync:** The JSON output is parsed, filtered for existing ignored warnings, and saved to the database via strict SQL transactions. The temporary workspace is forcefully purged.

## 💻 Local Development Setup

### Prerequisites
* [Node.js](https://nodejs.org/) (v22+)
* [PostgreSQL](https://www.postgresql.org/) (Running locally)
* [Gitleaks](https://github.com/gitleaks/gitleaks) (Must be installed and available in your system PATH)

### 1. Database Configuration
Create a new PostgreSQL database and run the provided `SCRIPT.sql` file to generate the schema.

### 2. Setting up GitHub OAuth (Required)
Because this application uses secure OAuth, you must create your own GitHub OAuth App to run it locally or deploy it.

1. Go to your GitHub account: **Settings > Developer Settings > OAuth Apps**.
2. Click **New OAuth App**.
3. Fill in the details:
   * **Homepage URL:** `http://localhost:4200` (or your production frontend URL)
   * **Authorization callback URL:** `http://localhost:3000/api/auth/github/callback` (or your production backend URL)
4. Click **Register application**.
5. Copy the **Client ID** and generate a new **Client Secret** to paste into your `.env` file.

### 3. Environment Variables
Create a `.env` file in your `backend` directory:
```env
PORT=3000
FRONTEND_URL=http://localhost:4200
DATABASE_URL=postgresql://postgres:<your_password>@localhost:5432/<name_of_the_database>

SESSION_SECRET=64_byte_hex_string
ENCRYPTION_KEY=32_byte_hex_string

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

### 4. Start the Backend Server
Open a terminal and navigate to the backend folder:

```Bash
cd backend
npm install
npm run dev
```
(Ensure you see 🟢 DB ready and the server running confirmation in the console.)

### 5. Start the Frontend Application
Open a new terminal window and navigate to the frontend folder:

```Bash
cd frontend
npm install
npm start
```
Navigate to http://localhost:4200 in your browser to access the PrivaCI terminal.