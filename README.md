# LibriSync — Enterprise Library Digitalization System
LibriSync is a high-performance, single-page application (SPA) library management system featuring a premium modern dashboard interface, full CRUD catalogs, a circulation management engine, dynamic overdue fine calculations, and database backup/restoration utilities. It is powered by a **Node.js/Express** backend and a persistent **SQLite** database.
---
## 🚀 Key Features
*   **Premium Visual Experience**: Built with modern CSS design tokens, HSL color palettes, responsive sidebars, micro-animations, and full dark mode compatibility.
*   **Asynchronous REST Backend**: Features full endpoints to manage books, members, transactions, activity logs, notifications, and system settings.
*   **Relational Database Persistence**: Relational schema engineered using **SQLite** to manage catalog statuses, patron registry, checkouts, and historical transactions.
*   **Dynamic Overdue Fine Calculations**: Real-time background scheduling that monitors active checkouts and calculates daily overdue fines (₹5/day) relative to the current date.
*   **CSV Catalog Importer**: Validates, maps, and bulk-inserts catalog books into the system from standard CSV uploads.
*   **Local Database Backup/Restore**: Generates downloadable JSON snapshot files of the entire database state and supports full restoration uploads.
---
## 📂 Project Directory Structure
```text
librisync/
├── server.js              # Node.js + Express backend server & SQLite manager
├── package.json           # Backend dependency metadata
├── README.md              # Project documentation and guide
└── public/                # Frontend assets folder
    ├── index.html         # Unified markup structure, navigation tabs, and modals
    ├── css/
    │   └── style.css      # Core style definitions, tokens, and CSS properties
    └── js/
        └── app.js         # Client controller, asynchronous API fetching, & UI updates
```
---
## 🛠️ Step-by-Step Architecture Guide
### 1. The Backend (`server.js`)
The backend is responsible for launching the web server on port `3000`, connecting to the SQLite database file, initializing the schema tables, seeding them with initial data if empty, and exposing REST API endpoints:
*   **SQLite Database Schema**:
    *   `books`: Stores unique `id`, `isbn`, `title`, `author`, `category`, `publisher`, `year`, `rack`, `status`, and `cover_url`.
    *   `members`: Stores unique `id`, `name`, `email`, `type`, `joined` date, `books_issued` count, and `status`.
    *   `transactions`: Connects books and members using relational keys, tracking `id`, `issue_date`, `due_date`, `return_date`, calculated `fine`, and transaction status.
    *   `activities` & `notifications`: Feeds system log events and overdue notices to the dashboard.
*   **Endpoints Map**:
    *   `GET /api/books` / `POST /api/books` / `PUT /api/books/:id` / `DELETE /api/books/:id`
    *   `GET /api/members` / `POST /api/members` / `PUT /api/members/:id` / `DELETE /api/members/:id`
    *   `GET /api/transactions` / `POST /api/transactions` (Issue Book) / `POST /api/transactions/return` (Check-in Book)
    *   `GET /api/activities` (Recent activity logs)
    *   `GET /api/notifications` (System notifications panel)
    *   `GET /api/theme` / `POST /api/theme` (Appearance settings storage)
    *   `POST /api/database/reset` / `GET /api/backup/download` / `POST /api/backup/restore` (Utilities)
### 2. The Stylesheet (`public/css/style.css`)
Designed using CSS Custom Properties (variables) that allow smooth light-to-dark mode transitions. CSS classes manage:
*   Layout elements (responsive sidebar layout, mobile menu controls, sticky top bars).
*   Visual components (KPI metrics cards with left border indicator lines, custom badge designs, timeline components, charts cards).
*   Dialog portals (smooth transitions when overlays open, responsive table scrollbars).
### 3. The Client Controller (`public/js/app.js`)
Manages the application life cycle inside the browser:
*   **Bootstrapping**: Fetches books, members, transactions, activities, notifications, and theme settings concurrently using `Promise.all()` from the REST endpoints on load.
*   **Routing Manager**: Monitors the URL `#hash` to handle smooth view switching (Dashboard, Inventory, Circulation, Members, Reports, Settings) without reloading the page.
*   **Circulation Logic**: Handles transaction submissions (submits checkout API, updates book status to `Issued`, increments member checkouts, logs activity) and returns (records return date, calculates fines, releases book status, decrements member checkouts).
*   **Data Visulation**: Renders and refreshes high-fidelity HTML5 canvases utilizing `Chart.js` for library data analytics.
---
## ⚙️ Setup and Execution
To run LibriSync on a local machine, follow these steps:
### Windows Automated Run (No installation required)
We provide a PowerShell script `run_backend.ps1` in the parent directory that handles everything automatically:
1.  Open PowerShell in the project directory.
2.  Execute:
    ```powershell
    powershell -ExecutionPolicy Bypass -File C:\Users\risha\.gemini\antigravity\scratch\run_backend.ps1
    ```
    *(This script downloads a portable Node.js runtime, installs express, cors, and sqlite3 packages inside the project folder, and boots the backend server automatically!)*
### Standard Command Line Run (Requires Node.js installed globally)
1.  Navigate into the `librisync` directory:
    ```bash
    cd librisync
    ```
2.  Install packages:
    ```bash
    npm install
    ```
3.  Start the system:
    ```bash
    node server.js
    ```
4.  Open your browser and navigate to:
    ```text
    http://localhost:3000/
    ```
