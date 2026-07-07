const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, 'librisync.db');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database Connection
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("Database connection error:", err.message);
  } else {
    console.log("Connected to SQLite database at:", DB_PATH);
    initializeDatabase();
  }
});

// Create tables & Seed Database
function initializeDatabase() {
  db.serialize(() => {
    // 1. Books Table
    db.run(`CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY,
      isbn TEXT NOT NULL,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      category TEXT NOT NULL,
      publisher TEXT,
      year INTEGER,
      rack TEXT,
      status TEXT DEFAULT 'Available',
      cover_url TEXT
    )`);

    // 2. Members Table
    db.run(`CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      type TEXT NOT NULL,
      joined TEXT NOT NULL,
      books_issued INTEGER DEFAULT 0,
      status TEXT DEFAULT 'Active'
    )`);

    // 3. Transactions Table
    db.run(`CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      book_id TEXT NOT NULL,
      book_title TEXT NOT NULL,
      member_id TEXT NOT NULL,
      member_name TEXT NOT NULL,
      issue_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      return_date TEXT,
      fine REAL DEFAULT 0,
      status TEXT DEFAULT 'Issued'
    )`);

    // 4. Activity Logs Table
    db.run(`CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      time TEXT NOT NULL
    )`);

    // 5. Notifications Table
    db.run(`CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      msg TEXT NOT NULL,
      time TEXT NOT NULL,
      read INTEGER DEFAULT 0
    )`);

    // 6. Theme Config Table
    db.run(`CREATE TABLE IF NOT EXISTS theme (
      id INTEGER PRIMARY KEY DEFAULT 1,
      darkMode INTEGER DEFAULT 0,
      accentColor TEXT DEFAULT '#2563EB'
    )`);

    // Seed data if database is empty
    db.get("SELECT COUNT(*) as count FROM books", (err, row) => {
      if (row.count === 0) {
        console.log("Seeding database with mock data...");
        seedMockDatabase();
      }
    });
  });
}

function seedMockDatabase() {
  const books = [
    ["BK-001", "9780743273565", "The Great Gatsby", "F. Scott Fitzgerald", "Fiction", "Scribner", 1925, "A-1", "Available", "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=200&auto=format&fit=crop"],
    ["BK-002", "9780553380163", "A Brief History of Time", "Stephen Hawking", "Science", "Bantam Books", 1988, "B-3", "Available", "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=200&auto=format&fit=crop"],
    ["BK-003", "9780062316097", "Sapiens", "Yuval Noah Harari", "History", "Harper", 2011, "C-2", "Issued", "https://images.unsplash.com/photo-1447069387593-a5de0862481e?q=80&w=200&auto=format&fit=crop"],
    ["BK-004", "9781451648539", "Steve Jobs", "Walter Isaacson", "Biography", "Simon & Schuster", 2011, "D-1", "Available", "https://images.unsplash.com/photo-1531297484001-80022131f5a1?q=80&w=200&auto=format&fit=crop"],
    ["BK-005", "9780132350884", "Clean Code", "Robert C. Martin", "Technology", "Prentice Hall", 2008, "E-4", "Overdue", "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=200&auto=format&fit=crop"],
    ["BK-006", "9780140449235", "Beyond Good and Evil", "Friedrich Nietzsche", "Philosophy", "Penguin Classics", 1886, "F-1", "Available", "https://images.unsplash.com/photo-1607968565043-36af90dde238?q=80&w=200&auto=format&fit=crop"],
    ["BK-007", "9780446310789", "To Kill a Mockingbird", "Harper Lee", "Fiction", "J. B. Lippincott & Co.", 1960, "A-2", "Available", ""],
    ["BK-008", "9780345331359", "Cosmos", "Carl Sagan", "Science", "Random House", 1980, "B-1", "Available", ""],
    ["BK-009", "9780393317558", "Guns, Germs, and Steel", "Jared Diamond", "History", "W. W. Norton & Co.", 1997, "C-1", "Available", ""],
    ["BK-010", "9781476708690", "The Innovators", "Walter Isaacson", "Technology", "Simon & Schuster", 2014, "E-1", "Available", ""]
  ];

  const members = [
    ["MB-001", "Alice Smith", "alice.smith@university.edu", "Student", "2026-01-15", 1, "Active"],
    ["MB-002", "Bob Jones", "bob.jones@university.edu", "Faculty", "2025-09-01", 1, "Active"],
    ["MB-003", "Charlie Brown", "charlie.b@gmail.com", "Guest", "2026-03-10", 0, "Active"],
    ["MB-004", "Diana Prince", "diana.prince@justice.org", "Student", "2026-02-18", 0, "Active"],
    ["MB-005", "Evan Wright", "evan.wright@outlook.com", "Guest", "2025-11-20", 0, "Suspended"]
  ];

  const transactions = [
    ["TXN-101", "BK-003", "Sapiens", "MB-001", "Alice Smith", "2026-06-25", "2026-07-09", null, 0, "Issued"],
    ["TXN-102", "BK-005", "Clean Code", "MB-002", "Bob Jones", "2026-06-10", "2026-06-24", null, 45, "Overdue"],
    ["TXN-103", "BK-001", "The Great Gatsby", "MB-003", "Charlie Brown", "2026-06-01", "2026-06-15", "2026-06-12", 0, "Returned"],
    ["TXN-104", "BK-004", "Steve Jobs", "MB-004", "Diana Prince", "2026-05-15", "2026-05-29", "2026-06-05", 35, "Returned"]
  ];

  const activities = [
    ["System Initialized", "2026-07-03T11:00:00Z"],
    ["Book BK-005 'Clean Code' marked OVERDUE", "2026-07-03T09:00:00Z"],
    ["Member MB-001 issued book BK-003 'Sapiens'", "2026-06-25T14:30:00Z"]
  ];

  const notifications = [
    ["NT-1", "Book 'Clean Code' is 9 days overdue for Member Bob Jones.", "2026-07-03T09:00:00Z", 0]
  ];

  books.forEach(b => {
    db.run(`INSERT INTO books VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, b);
  });
  members.forEach(m => {
    db.run(`INSERT INTO members VALUES (?, ?, ?, ?, ?, ?, ?)`, m);
  });
  transactions.forEach(t => {
    db.run(`INSERT INTO transactions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, t);
  });
  activities.forEach(a => {
    db.run(`INSERT INTO activities (title, time) VALUES (?, ?)`, a);
  });
  notifications.forEach(n => {
    db.run(`INSERT INTO notifications VALUES (?, ?, ?, ?)`, n);
  });
  db.run(`INSERT OR IGNORE INTO theme (id, darkMode, accentColor) VALUES (1, 0, '#2563EB')`);
}

// ==================== API Endpoints ====================

// 1. Books API
app.get('/api/books', (req, res) => {
  db.all("SELECT * FROM books", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/books', (req, res) => {
  const { id, isbn, title, author, category, publisher, year, rack, status, cover_url } = req.body;
  const sql = `INSERT INTO books VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  db.run(sql, [id, isbn, title, author, category, publisher, year, rack, status || 'Available', cover_url], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Book added", id });
  });
});

app.put('/api/books/:id', (req, res) => {
  const { isbn, title, author, category, publisher, year, rack, status, cover_url } = req.body;
  const sql = `UPDATE books SET isbn=?, title=?, author=?, category=?, publisher=?, year=?, rack=?, status=?, cover_url=? WHERE id=?`;
  db.run(sql, [isbn, title, author, category, publisher, year, rack, status, cover_url, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Book updated" });
  });
});

app.delete('/api/books/:id', (req, res) => {
  db.run("DELETE FROM books WHERE id = ?", [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Book deleted" });
  });
});

// 2. Members API
app.get('/api/members', (req, res) => {
  db.all("SELECT * FROM members", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/members', (req, res) => {
  const { id, name, email, type, joined, books_issued, status } = req.body;
  const sql = `INSERT INTO members VALUES (?, ?, ?, ?, ?, ?, ?)`;
  db.run(sql, [id, name, email, type, joined, books_issued || 0, status || 'Active'], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Member registered", id });
  });
});

app.put('/api/members/:id', (req, res) => {
  const { name, email, type, status } = req.body;
  const sql = `UPDATE members SET name=?, email=?, type=?, status=? WHERE id=?`;
  db.run(sql, [name, email, type, status, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Member updated" });
  });
});

app.delete('/api/members/:id', (req, res) => {
  db.run("DELETE FROM members WHERE id = ?", [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Member removed" });
  });
});

// 3. Transactions & Circulation Desk
app.get('/api/transactions', (req, res) => {
  db.all("SELECT * FROM transactions", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/transactions', (req, res) => {
  const { id, book_id, book_title, member_id, member_name, issue_date, due_date } = req.body;
  
  db.serialize(() => {
    // Insert checkout txn
    db.run(`INSERT INTO transactions VALUES (?, ?, ?, ?, ?, ?, ?, NULL, 0, 'Issued')`, 
      [id, book_id, book_title, member_id, member_name, issue_date, due_date]);
    
    // Update book status
    db.run(`UPDATE books SET status = 'Issued' WHERE id = ?`, [book_id]);

    // Update member checkout count
    db.run(`UPDATE members SET books_issued = books_issued + 1 WHERE id = ?`, [member_id]);
    
    // Add activity log
    db.run(`INSERT INTO activities (title, time) VALUES (?, ?)`, 
      [`Checked out '${book_title}' to Member '${member_name}'`, new Date().toISOString()]);
  });
  
  res.json({ message: "Book checked out successfully", id });
});

app.post('/api/transactions/return', (req, res) => {
  const { txn_id, return_date, fine } = req.body;
  
  db.get("SELECT * FROM transactions WHERE id = ?", [txn_id], (err, txn) => {
    if (err || !txn) return res.status(404).json({ error: "Transaction not found" });

    db.serialize(() => {
      // Update txn return
      db.run(`UPDATE transactions SET return_date = ?, fine = ?, status = 'Returned' WHERE id = ?`, [return_date, fine, txn_id]);
      
      // Release book
      db.run(`UPDATE books SET status = 'Available' WHERE id = ?`, [txn.book_id]);

      // Decrement member borrow count
      db.run(`UPDATE members SET books_issued = MAX(0, books_issued - 1) WHERE id = ?`, [txn.member_id]);

      // Add activity log
      db.run(`INSERT INTO activities (title, time) VALUES (?, ?)`, 
        [`Book check-in returned: '${txn.book_title}'`, new Date().toISOString()]);
    });

    res.json({ message: "Book returned successfully" });
  });
});

// 4. Activity Logs API
app.get('/api/activities', (req, res) => {
  db.all("SELECT * FROM activities ORDER BY id DESC LIMIT 50", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/activities', (req, res) => {
  const { title } = req.body;
  db.run("INSERT INTO activities (title, time) VALUES (?, ?)", [title, new Date().toISOString()], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Activity logged" });
  });
});

// 5. Notifications API
app.get('/api/notifications', (req, res) => {
  db.all("SELECT * FROM notifications ORDER BY time DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const formatted = rows.map(r => ({ ...r, read: !!r.read }));
    res.json(formatted);
  });
});

app.post('/api/notifications/clear', (req, res) => {
  db.run("DELETE FROM notifications", [], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Notifications cleared" });
  });
});

// 6. Theme Config API
app.get('/api/theme', (req, res) => {
  db.get("SELECT * FROM theme WHERE id = 1", [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.json({ darkMode: false, accentColor: "#2563EB" });
    res.json({ darkMode: !!row.darkMode, accentColor: row.accentColor });
  });
});

app.post('/api/theme', (req, res) => {
  const { darkMode, accentColor } = req.body;
  const sql = `UPDATE theme SET darkMode = ?, accentColor = ? WHERE id = 1`;
  db.run(sql, [darkMode ? 1 : 0, accentColor], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Theme updated" });
  });
});

// 7. Database Utilities
app.post('/api/database/reset', (req, res) => {
  db.serialize(() => {
    db.run("DROP TABLE IF EXISTS books");
    db.run("DROP TABLE IF EXISTS members");
    db.run("DROP TABLE IF EXISTS transactions");
    db.run("DROP TABLE IF EXISTS activities");
    db.run("DROP TABLE IF EXISTS notifications");
    db.run("DROP TABLE IF EXISTS theme");
    initializeDatabase();
    setTimeout(() => {
      res.json({ message: "Database reset successful" });
    }, 400);
  });
});

app.get('/api/backup/download', (req, res) => {
  const backup = {};
  db.all("SELECT * FROM books", [], (e1, books) => {
    backup.books = books;
    db.all("SELECT * FROM members", [], (e2, members) => {
      backup.members = members;
      db.all("SELECT * FROM transactions", [], (e3, transactions) => {
        backup.transactions = transactions;
        db.all("SELECT * FROM activities", [], (e4, activities) => {
          backup.activities = activities;
          db.all("SELECT * FROM notifications", [], (e5, notifications) => {
            backup.notifications = notifications;
            db.get("SELECT * FROM theme WHERE id = 1", [], (e6, theme) => {
              backup.theme = theme ? { darkMode: !!theme.darkMode, accentColor: theme.accentColor } : { darkMode: false, accentColor: "#2563EB" };
              res.json(backup);
            });
          });
        });
      });
    });
  });
});

app.post('/api/backup/restore', (req, res) => {
  const { books, members, transactions, activities, notifications, theme } = req.body;

  db.serialize(() => {
    db.run("DELETE FROM books");
    db.run("DELETE FROM members");
    db.run("DELETE FROM transactions");
    db.run("DELETE FROM activities");
    db.run("DELETE FROM notifications");
    db.run("DELETE FROM theme");

    if (books) books.forEach(b => db.run(`INSERT INTO books VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [b.id, b.isbn, b.title, b.author, b.category, b.publisher, b.year, b.rack, b.status, b.cover_url]));
    if (members) members.forEach(m => db.run(`INSERT INTO members VALUES (?, ?, ?, ?, ?, ?, ?)`, [m.id, m.name, m.email, m.type, m.joined, m.books_issued, m.status]));
    if (transactions) transactions.forEach(t => db.run(`INSERT INTO transactions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [t.id, t.book_id, t.book_title, t.member_id, t.member_name, t.issue_date, t.due_date, t.return_date, t.fine, t.status]));
    if (activities) activities.forEach(a => db.run(`INSERT INTO activities (title, time) VALUES (?, ?)`, [a.title, a.time]));
    if (notifications) notifications.forEach(n => db.run(`INSERT INTO notifications VALUES (?, ?, ?, ?)`, [n.id, n.msg, n.time, n.read ? 1 : 0]));
    if (theme) db.run(`INSERT INTO theme (id, darkMode, accentColor) VALUES (1, ?, ?)`, [theme.darkMode ? 1 : 0, theme.accentColor]);

    setTimeout(() => {
      res.json({ message: "Database restored successfully" });
    }, 400);
  });
});

app.listen(PORT, () => {
  console.log(`LibriSync backend server running on http://localhost:${PORT}`);
});
