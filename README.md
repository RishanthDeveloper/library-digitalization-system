# 📚 LibriSync | Enterprise Library Digitalization System

A modern, browser-based Enterprise Resource Planning (ERP) interface designed to digitalize library asset management, track circulation, and handle bulk inventory ingestion. 

## ✨ Key Features

* **Dynamic Dashboard:** Real-time KPI tracking for Total Volumes, Active Issues, and Available Assets.
* **Persistent Local Database:** Utilizes HTML5 `localStorage` to maintain inventory and circulation state across browser sessions without needing a backend server.
* **Bulk Asset Ingestion:** Features a built-in CSV parser using the `FileReader` API, allowing administrators to upload hundreds of records instantly.
* **Automated Circulation Logic:** Smart issue/return validation that prevents double-issuing and automatically calculates financial penalties for overdue assets.
* **Enterprise UI/UX:** Responsive, grid-based layout featuring a professional color palette, modern typography, and FontAwesome integration.

## 🛠️ Technology Stack

* **Front-End:** Semantic HTML5, Vanilla CSS3 (CSS Grid/Flexbox)
* **Logic & State:** Vanilla JavaScript (ES6+), Browser Local Storage API
* **Icons:** FontAwesome 6

## 🚀 How to Run Locally

Because this system runs entirely in the browser using local storage, no server installation is required.

1. Clone the repository:
   ```bash
   git clone [https://github.com/RishanthDeveloper/librisync.git](https://github.com/RishanthDeveloper/librisync.git)
