<div align="center">

# 📚 LibriSync — Enterprise Library Digitalization System

A high-performance, single-page library management system with a premium dashboard interface, full CRUD catalogs, a circulation management engine, dynamic overdue fine calculations, and database backup/restore utilities.

Built with **Node.js**, **Express**, and a persistent **SQLite** database.

[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

[Features](#-key-features) • [Architecture](#️-architecture-guide) • [Setup](#️-setup-and-execution) • [API Reference](#-api-reference) • [Author](#-author)

</div>

---

## 🚀 Key Features

- **Premium Visual Experience** — Modern CSS design tokens, HSL color palettes, a responsive sidebar layout, micro-animations, and full dark mode support.
- **Asynchronous REST Backend** — Complete endpoints for books, members, transactions, activity logs, notifications, and system settings.
- **Relational Database Persistence** — A relational SQLite schema manages catalog statuses, the patron registry, checkouts, and historical transactions.
- **Dynamic Overdue Fine Calculations** — Real-time background logic monitors active checkouts and calculates daily overdue fines (₹5/day) relative to the current date.
- **CSV Catalog Importer** — Validates, maps, and bulk-inserts catalog books from standard CSV uploads.
- **Local Database Backup/Restore** — Generates downloadable JSON snapshots of the entire database and supports full restoration from an uploaded backup.

---

## 📂 Project Structure

```text
librisync/
├── server.js              # Node.js + Express backend server & SQLite manager
├── package.json           # Backend dependency metadata
├── run_backend.ps1        # Optional Windows one-click setup & run script
├── README.md              # Project documentation and guide
└── public/                # Frontend assets
    ├── index.html         # Unified markup structure, navigation tabs, and modals
    ├── css/
    │   └── style.css      # Core style definitions, tokens, and CSS properties
    └── js/
        └── app.js         # Client controller, asynchronous API fetching & UI updates
```

---

## 🛠️ Architecture Guide

### 1. The Backend — `server.js`

Launches the web server on port `3000`, connects to the SQLite database file, initializes the schema, seeds it with sample data on first run, and exposes the REST API.

**Database Schema**

| Table | Purpose |
|---|---|
| `books` | Unique `id`, `isbn`, `title`, `author`, `category`, `publisher`, `year`, `rack`, `status`, `cover_url` |
| `members` | Unique `id`, `name`, `email`, `type`, `joined` date, `books_issued` count, `status` |
| `transactions` | Links books and members via relational keys — `id`, `issue_date`, `due_date`, `return_date`, calculated `fine`, and status |
| `activities` & `notifications` | Feed system log events and overdue notices to the dashboard |

### 2. The Stylesheet — `public/css/style.css`

Built with CSS Custom Properties (variables) for smooth light-to-dark mode transitions, covering:
- Layout (responsive sidebar, mobile menu controls, sticky top bar)
- Components (KPI metric cards with accent border indicators, custom badges, timeline elements, chart cards)
- Dialogs (smooth overlay transitions, responsive table scrolling)

### 3. The Client Controller — `public/js/app.js`

Manages the full application lifecycle in the browser:
- **Bootstrapping** — Fetches books, members, transactions, activities, notifications, and theme settings concurrently via `Promise.all()` on load.
- **Routing Manager** — Watches the URL `#hash` to switch views (Dashboard, Inventory, Circulation, Members, Reports, Settings) without a page reload.
- **Circulation Logic** — Handles checkouts (calls the issue API, marks the book `Issued`, increments the member's checkout count, logs the activity) and returns (records the return date, calculates fines, releases the book, decrements the checkout count).
- **Data Visualization** — Renders and refreshes analytics charts with `Chart.js`.

---

## ⚙️ Setup and Execution

### Option A — Windows Automated Run (no manual install required)

A PowerShell script, `run_backend.ps1`, is included in the project root and handles everything automatically: it downloads a portable Node.js runtime, installs `express`, `cors`, and `sqlite3` inside the project folder, and boots the backend.

1. Open PowerShell **in the project's root folder**.
2. Run:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\run_backend.ps1
   ```

### Option B — Standard Command Line (requires Node.js installed globally)

```bash
# 1. Clone the repository
git clone https://github.com/RishanthDeveloper/librisync.git
cd librisync

# 2. Install dependencies
npm install

# 3. Start the server
node server.js
```

Then open your browser at:

```text
http://localhost:3000/
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` / `POST` | `/api/books` | List all books / add a book |
| `PUT` / `DELETE` | `/api/books/:id` | Update / delete a book |
| `GET` / `POST` | `/api/members` | List all members / register a member |
| `PUT` / `DELETE` | `/api/members/:id` | Update / remove a member |
| `GET` / `POST` | `/api/transactions` | List transactions / issue a book |
| `POST` | `/api/transactions/return` | Check in (return) a book |
| `GET` | `/api/activities` | Recent activity log |
| `GET` | `/api/notifications` | System notifications panel |
| `GET` / `POST` | `/api/theme` | Get / save appearance settings |
| `POST` | `/api/database/reset` | Reset the database to sample data |
| `GET` | `/api/backup/download` | Download a full JSON backup |
| `POST` | `/api/backup/restore` | Restore the database from a backup file |

---

## 🧰 Tech Stack

- **Backend:** Node.js, Express.js, SQLite
- **Frontend:** HTML5, CSS3 (custom properties / design tokens), vanilla JavaScript, Chart.js
- **Tooling:** CSV import pipeline, JSON backup/restore utilities

---

## 🗺️ Roadmap

- [ ] User authentication & role-based access (Admin / Librarian / Member)
- [ ] Email/SMS overdue reminders
- [ ] Barcode/ISBN scanner integration
- [ ] Docker Compose setup for one-command deployment

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome. Feel free to check the [issues page](../../issues) or open a pull request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a pull request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Rishanth**
Final-year Computer Science and Business Systems (CSBS) student · ServiceNow Certified System Administrator (CSA) & Certified System Developer (CSD)

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/RishanthDeveloper)

If you found this project useful, consider giving it a ⭐ on GitHub!

</div>
