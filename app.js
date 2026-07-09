// ==========================================================================
// LibriSync — Single Page Application Logic (Backend Integrated)
// ==========================================================================

const App = {
  // State variables
  state: {
    books: [],
    members: [],
    transactions: [],
    activities: [],
    notifications: [],
    theme: {
      darkMode: false,
      accentColor: "#2563EB"
    }
  },

  // Pagination for books
  booksPagination: {
    currentPage: 1,
    pageSize: 10,
    totalPages: 1
  },

  // Sorting
  booksSort: {
    column: 'id',
    direction: 'asc'
  },

  // Chart instances
  charts: {},

  // Current active modal confirm action callback
  onConfirmCallback: null,

  // Initialize App
  async init() {
    console.log("LibriSync Initializing...");
    
    // Fetch state from server database
    await this.loadState();

    this.initThemes();
    this.initClock();
    this.initRouting();
    this.initSearch();
    this.initFormHandlers();
    this.initCsvImport();
    this.updateUI();
    
    // Hide App Loader with a delay for visual satisfaction
    setTimeout(() => {
      document.getElementById("app-loader").classList.add("hide");
      this.showToast("Connected to SQLite backend", "success");
    }, 600);
  },

  // Load state from backend APIs
  async loadState() {
    try {
      const [books, members, transactions, activities, notifications, theme] = await Promise.all([
        fetch('/api/books').then(r => r.json()),
        fetch('/api/members').then(r => r.json()),
        fetch('/api/transactions').then(r => r.json()),
        fetch('/api/activities').then(r => r.json()),
        fetch('/api/notifications').then(r => r.json()),
        fetch('/api/theme').then(r => r.json())
      ]);

      this.state.books = books;
      this.state.members = members;
      this.state.transactions = transactions;
      this.state.activities = activities;
      this.state.notifications = notifications;
      this.state.theme = theme;
    } catch (err) {
      console.error("Failed to load state from database server:", err);
      this.showToast("Database server offline. Features disabled.", "error");
    }
  },

  // Routing navigation
  initRouting() {
    const navItems = document.querySelectorAll(".nav-item");
    const views = document.querySelectorAll(".view");
    
    const navigateTo = (route) => {
      // Manage active classes on navigation
      navItems.forEach(item => {
        if (item.getAttribute("data-route") === route) {
          item.classList.add("active");
        } else {
          item.classList.remove("active");
        }
      });

      // Show the targeted view section
      views.forEach(view => {
        if (view.id === `view-${route}`) {
          view.classList.add("active");
        } else {
          view.classList.remove("active");
        }
      });

      // Update Topbar Title & Subtitle based on route
      const titleEl = document.getElementById("pageTitle");
      const subEl = document.getElementById("pageSubtitle");
      
      switch(route) {
        case "dashboard":
          titleEl.textContent = "Dashboard";
          subEl.textContent = "Overview of your library operations";
          this.renderCharts();
          break;
        case "inventory":
          titleEl.textContent = "Book Catalog";
          subEl.textContent = "Manage library books, location racks, and statuses";
          this.renderBooksTable();
          this.initCategoryFilters();
          break;
        case "circulation":
          titleEl.textContent = "Circulation Desk";
          subEl.textContent = "Handle checkouts, check-ins, and active library transactions";
          this.initCirculationSelectors();
          this.renderTransactionsTable();
          break;
        case "members":
          titleEl.textContent = "Members Registry";
          subEl.textContent = "Manage library patrons, faculty, and student logs";
          this.renderMembersTable();
          break;
        case "reports":
          titleEl.textContent = "Library Analytics & Reports";
          subEl.textContent = "Detailed reports, top borrowed categories, and data exports";
          this.renderAnalyticsCharts();
          break;
        case "settings":
          titleEl.textContent = "System Settings";
          subEl.textContent = "Configure look and feel, database backups, and reset utilities";
          this.renderSettingsView();
          break;
      }
      
      document.body.classList.remove("sidebar-open");
    };

    // Nav list item clicks
    navItems.forEach(item => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        const route = item.getAttribute("data-route");
        window.location.hash = route;
        navigateTo(route);
      });
    });

    const hash = window.location.hash.substring(1) || "dashboard";
    navigateTo(hash);
    window.location.hash = hash;
    
    window.addEventListener("hashchange", () => {
      const currentRoute = window.location.hash.substring(1) || "dashboard";
      navigateTo(currentRoute);
    });

    // Mobile menu toggle
    document.getElementById("mobileMenuBtn").addEventListener("click", () => {
      document.body.classList.add("sidebar-open");
    });
    
    document.getElementById("sidebarScrim").addEventListener("click", () => {
      document.body.classList.remove("sidebar-open");
    });
    
    // Sidebar collapse toggle
    const collapseBtn = document.getElementById("sidebarCollapseBtn");
    collapseBtn.addEventListener("click", () => {
      document.body.classList.toggle("sidebar-collapsed");
      const icon = collapseBtn.querySelector("i");
      if (document.body.classList.contains("sidebar-collapsed")) {
        icon.className = "fa-solid fa-angles-right";
      } else {
        icon.className = "fa-solid fa-angles-left";
      }
      setTimeout(() => {
        this.renderCharts();
      }, 300);
    });
  },

  // Themes and Accent settings
  initThemes() {
    const html = document.documentElement;
    const theme = this.state.theme;
    
    // Apply theme configurations
    if (theme.darkMode) {
      html.setAttribute("data-theme", "dark");
    } else {
      html.setAttribute("data-theme", "light");
    }
    
    html.style.setProperty("--primary", theme.accentColor);
    html.style.setProperty("--primary-dark", this.lightenDarkenColor(theme.accentColor, -25));
    
    // Theme toggle handler (in sidebar)
    const toggleBtn = document.getElementById("themeToggle");
    
    // Set initial text and icon
    if (theme.darkMode) {
      toggleBtn.querySelector("i").className = "fa-solid fa-sun";
      toggleBtn.querySelector(".nav-label").textContent = "Light mode";
    } else {
      toggleBtn.querySelector("i").className = "fa-solid fa-moon";
      toggleBtn.querySelector(".nav-label").textContent = "Dark mode";
    }

    toggleBtn.onclick = async () => {
      theme.darkMode = !theme.darkMode;
      if (theme.darkMode) {
        html.setAttribute("data-theme", "dark");
        toggleBtn.querySelector("i").className = "fa-solid fa-sun";
        toggleBtn.querySelector(".nav-label").textContent = "Light mode";
      } else {
        html.setAttribute("data-theme", "light");
        toggleBtn.querySelector("i").className = "fa-solid fa-moon";
        toggleBtn.querySelector(".nav-label").textContent = "Dark mode";
      }
      
      await this.saveThemeToServer();
      this.renderSettingsView();
    };

    // Swatches listeners
    const swatches = document.querySelectorAll(".swatch");
    swatches.forEach(swatch => {
      swatch.addEventListener("click", async () => {
        const color = swatch.getAttribute("data-color");
        theme.accentColor = color;
        html.style.setProperty("--primary", color);
        html.style.setProperty("--primary-dark", this.lightenDarkenColor(color, -25));
        
        swatches.forEach(s => s.classList.remove("active"));
        swatch.classList.add("active");
        
        await this.saveThemeToServer();
        this.showToast(`Accent theme updated`, "info");
      });
    });
  },

  async saveThemeToServer() {
    try {
      await fetch('/api/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.state.theme)
      });
    } catch (err) {
      console.error("Failed to save theme setting to backend:", err);
    }
  },

  // Helper function to shade accent colors
  lightenDarkenColor(col, amt) {
    let usePound = false;
    if (col[0] == "#") {
      col = col.slice(1);
      usePound = true;
    }
    let num = parseInt(col, 16);
    let r = (num >> 16) + amt;
    if (r > 255) r = 255;
    else if (r < 0) r = 0;
    let b = ((num >> 8) & 0x00FF) + amt;
    if (b > 255) b = 255;
    else if (b < 0) b = 0;
    let g = (num & 0x0000FF) + amt;
    if (g > 255) g = 255;
    else if (g < 0) g = 0;
    return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
  },

  // Sidebar Clock
  initClock() {
    const clockEl = document.getElementById("sidebarClock");
    const timeEl = clockEl.querySelector(".clock-time");
    const dateEl = clockEl.querySelector(".clock-date");
    
    const updateTime = () => {
      const now = new Date();
      let hrs = now.getHours();
      const mins = String(now.getMinutes()).padStart(2, '0');
      const ampm = hrs >= 12 ? 'PM' : 'AM';
      hrs = hrs % 12;
      hrs = hrs ? hrs : 12;
      timeEl.textContent = `${String(hrs).padStart(2, '0')}:${mins} ${ampm}`;
      
      const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
      dateEl.textContent = now.toLocaleDateString('en-US', options).toUpperCase();
    };

    updateTime();
    setInterval(updateTime, 1000);
  },

  // Global search input
  initSearch() {
    const globalSearch = document.getElementById("globalSearch");
    
    window.addEventListener("keydown", (e) => {
      if (e.key === "/" && document.activeElement !== globalSearch && !App.isAnyInputFocused()) {
        e.preventDefault();
        globalSearch.focus();
      }
    });

    globalSearch.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase().trim();
      if (!q) return;

      const route = window.location.hash.substring(1);
      if (route === "inventory") {
        document.getElementById("bookSearchInput").value = q;
        this.renderBooksTable();
      } else if (route === "members") {
        document.getElementById("memberSearchInput").value = q;
        this.renderMembersTable();
      }
    });
  },

  isAnyInputFocused() {
    const active = document.activeElement;
    return active && (active.tagName === "INPUT" || active.tagName === "SELECT" || active.tagName === "TEXTAREA");
  },

  // Setup form submissions and button action handlers
  initFormHandlers() {
    document.getElementById("bookSearchInput").addEventListener("input", () => {
      this.booksPagination.currentPage = 1;
      this.renderBooksTable();
    });
    
    document.getElementById("filterCategory").addEventListener("change", () => {
      this.booksPagination.currentPage = 1;
      this.renderBooksTable();
    });

    document.getElementById("filterStatus").addEventListener("change", () => {
      this.booksPagination.currentPage = 1;
      this.renderBooksTable();
    });

    document.getElementById("resetFiltersBtn").addEventListener("click", () => {
      document.getElementById("bookSearchInput").value = "";
      document.getElementById("filterCategory").value = "";
      document.getElementById("filterStatus").value = "";
      this.booksPagination.currentPage = 1;
      this.renderBooksTable();
      this.showToast("Filters reset", "info");
    });

    document.getElementById("memberSearchInput").addEventListener("input", () => {
      this.renderMembersTable();
    });
    document.getElementById("filterMemberType").addEventListener("change", () => {
      this.renderMembersTable();
    });

    document.getElementById("bookForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleBookFormSubmit();
    });

    document.getElementById("memberForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleMemberFormSubmit();
    });

    document.getElementById("issueForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleIssueBookSubmit();
    });

    const returnSelect = document.getElementById("returnTxnSelect");
    returnSelect.addEventListener("change", () => {
      const txnId = returnSelect.value;
      const previewArea = document.getElementById("returnPreview");
      
      if (!txnId) {
        previewArea.hidden = true;
        return;
      }

      const txn = this.state.transactions.find(t => t.id === txnId);
      if (!txn) {
        previewArea.hidden = true;
        return;
      }

      const todayStr = new Date().toISOString().split('T')[0];
      const today = new Date(todayStr);
      const dueDate = new Date(txn.due_date);
      
      document.getElementById("rpDue").textContent = txn.due_date;
      
      if (today > dueDate) {
        const diffTime = Math.abs(today - dueDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const fineAmount = diffDays * 5;
        
        document.getElementById("rpDays").textContent = diffDays;
        document.getElementById("rpFine").textContent = `₹${fineAmount}`;
      } else {
        document.getElementById("rpDays").textContent = "0";
        document.getElementById("rpFine").textContent = "₹0";
      }

      previewArea.hidden = false;
    });

    document.getElementById("returnForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleReturnBookSubmit();
    });

    document.querySelectorAll(".qa-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const action = btn.getAttribute("data-action");
        this.handleQuickAction(action);
      });
    });

    document.getElementById("addBookBtn").addEventListener("click", () => this.openBookModal());
    document.getElementById("emptyAddBookBtn").addEventListener("click", () => this.openBookModal());
    document.getElementById("importCsvBtn").addEventListener("click", () => this.openImportModal());
    
    document.getElementById("exportCsvBtn").addEventListener("click", () => this.exportCsv("books"));

    document.getElementById("addMemberBtn").addEventListener("click", () => this.openMemberModal());

    document.getElementById("exportBooksReport").addEventListener("click", () => this.exportCsv("books"));
    document.getElementById("exportMembersReport").addEventListener("click", () => this.exportCsv("members"));
    document.getElementById("exportTxnReport").addEventListener("click", () => this.exportCsv("transactions"));

    document.getElementById("backupBtn").addEventListener("click", () => this.backupDatabase());
    document.getElementById("restoreInput").addEventListener("change", (e) => this.restoreDatabase(e));
    
    document.getElementById("resetDbBtn").addEventListener("click", () => {
      this.openConfirmModal("Reset Library Database?", "This will delete all current records and reload initial sample books and members. Continue?", async () => {
        await fetch('/api/database/reset', { method: 'POST' });
        await this.loadState();
        this.updateUI();
        this.showToast("Database reseeded successfully", "success");
      });
    });

    document.getElementById("confirmActionBtn").addEventListener("click", () => {
      if (this.onConfirmCallback) {
        this.onConfirmCallback();
      }
      this.closeModal();
    });

    document.getElementById("clearNotifs").addEventListener("click", async () => {
      await fetch('/api/notifications/clear', { method: 'POST' });
      this.state.notifications = [];
      this.updateNotificationsUI();
      this.showToast("Notifications cleared", "info");
    });
  },

  handleQuickAction(action) {
    switch (action) {
      case "add-book":
        this.openBookModal();
        break;
      case "issue-book":
        window.location.hash = "circulation";
        break;
      case "return-book":
        window.location.hash = "circulation";
        setTimeout(() => {
          document.getElementById("returnForm").scrollIntoView({ behavior: 'smooth' });
        }, 100);
        break;
      case "import-csv":
        this.openImportModal();
        break;
      case "export-csv":
        this.exportCsv("books");
        break;
    }
  },

  // Modals operations
  openModal(modalId) {
    document.getElementById("modalOverlay").classList.add("open");
    document.querySelectorAll(".modal").forEach(m => m.classList.remove("show"));
    document.getElementById(modalId).classList.add("show");
  },

  closeModal() {
    document.getElementById("modalOverlay").classList.remove("open");
    document.querySelectorAll(".modal").forEach(m => m.classList.remove("show"));
    this.onConfirmCallback = null;
  },

  openBookModal(book = null) {
    const titleEl = document.getElementById("bookModalTitle");
    const form = document.getElementById("bookForm");
    form.reset();
    document.getElementById("bookCoverPreview").innerHTML = '<i class="fa-solid fa-image"></i>';

    if (book) {
      titleEl.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Edit Book';
      document.getElementById("bookFormId").value = book.id;
      document.getElementById("bookTitle").value = book.title;
      document.getElementById("bookAuthor").value = book.author;
      document.getElementById("bookIsbn").value = book.isbn;
      document.getElementById("bookCategory").value = book.category;
      document.getElementById("bookPublisher").value = book.publisher || "";
      document.getElementById("bookYear").value = book.year || "";
      document.getElementById("bookRack").value = book.rack || "";
      document.getElementById("bookCoverUrl").value = book.cover_url || "";
      
      if (book.cover_url) {
        this.previewCover(book.cover_url);
      }
    } else {
      titleEl.innerHTML = '<i class="fa-solid fa-book"></i> Add Book';
      document.getElementById("bookFormId").value = "";
    }
    this.openModal("modalBook");
  },

  openMemberModal(member = null) {
    const titleEl = document.getElementById("memberModalTitle");
    const form = document.getElementById("memberForm");
    form.reset();

    if (member) {
      titleEl.innerHTML = '<i class="fa-solid fa-user-pen"></i> Edit Member';
      document.getElementById("memberFormId").value = member.id;
      document.getElementById("memberName").value = member.name;
      document.getElementById("memberEmail").value = member.email;
      document.getElementById("memberType").value = member.type;
      document.getElementById("memberStatus").value = member.status;
    } else {
      titleEl.innerHTML = '<i class="fa-solid fa-user-plus"></i> Add Member';
      document.getElementById("memberFormId").value = "";
    }
    this.openModal("modalMember");
  },

  openImportModal() {
    document.getElementById("csvDropZone").hidden = false;
    document.getElementById("csvProgressArea").hidden = true;
    document.getElementById("csvSummaryArea").hidden = true;
    document.getElementById("csvImportConfirmBtn").disabled = true;
    
    document.getElementById("csvFileInput").value = "";
    this.openModal("modalImport");
  },

  openConfirmModal(title, msg, onConfirm) {
    document.getElementById("confirmTitle").textContent = title;
    document.getElementById("confirmMessage").textContent = msg;
    this.onConfirmCallback = onConfirm;
    this.openModal("modalConfirm");
  },

  previewCover(url) {
    const preview = document.getElementById("bookCoverPreview");
    if (url && url.startsWith("http")) {
      preview.innerHTML = `<img src="${url}" alt="Book Cover" onerror="this.innerHTML='<i class=\'fa-solid fa-image-slash\'></i>'">`;
    } else {
      preview.innerHTML = '<i class="fa-solid fa-image"></i>';
    }
  },

  // Save Book Action
  async handleBookFormSubmit() {
    const id = document.getElementById("bookFormId").value;
    const title = document.getElementById("bookTitle").value;
    const author = document.getElementById("bookAuthor").value;
    const isbn = document.getElementById("bookIsbn").value;
    const category = document.getElementById("bookCategory").value;
    const publisher = document.getElementById("bookPublisher").value;
    const year = parseInt(document.getElementById("bookYear").value) || null;
    const rack = document.getElementById("bookRack").value;
    const coverUrl = document.getElementById("bookCoverUrl").value;

    const bookData = { isbn, title, author, category, publisher, year, rack, cover_url: coverUrl };

    try {
      if (id) {
        // Edit API call
        bookData.status = this.state.books.find(b => b.id === id).status;
        await fetch(`/api/books/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookData)
        });
        
        // Log locally
        await fetch('/api/activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: `Updated book info: '${title}'` })
        });
        
        this.showToast(`Book updated successfully`, "success");
      } else {
        // Create API call
        const nextId = "BK-" + String(this.state.books.length + 1).padStart(3, '0');
        bookData.id = nextId;
        bookData.status = "Available";
        
        await fetch('/api/books', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookData)
        });
        
        await fetch('/api/activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: `Cataloged new book: '${title}'` })
        });
        
        this.showToast(`Book cataloged successfully`, "success");
      }

      await this.loadState();
      this.closeModal();
      this.updateUI();
    } catch (err) {
      console.error(err);
      this.showToast("Server error. Action failed.", "error");
    }
  },

  // Save Member Action
  async handleMemberFormSubmit() {
    const id = document.getElementById("memberFormId").value;
    const name = document.getElementById("memberName").value;
    const email = document.getElementById("memberEmail").value;
    const type = document.getElementById("memberType").value;
    const status = document.getElementById("memberStatus").value;

    const memberData = { name, email, type, status };

    try {
      if (id) {
        await fetch(`/api/members/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(memberData)
        });
        
        await fetch('/api/activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: `Updated member info: '${name}'` })
        });
        
        this.showToast(`Member updated`, "success");
      } else {
        const nextId = "MB-" + String(this.state.members.length + 1).padStart(3, '0');
        const today = new Date().toISOString().split('T')[0];
        memberData.id = nextId;
        memberData.joined = today;
        memberData.books_issued = 0;
        memberData.status = status || "Active";
        
        await fetch('/api/members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(memberData)
        });
        
        await fetch('/api/activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: `Registered new member: '${name}'` })
        });
        
        this.showToast(`Member registered successfully`, "success");
      }

      await this.loadState();
      this.closeModal();
      this.updateUI();
    } catch (err) {
      console.error(err);
      this.showToast("Server error. Action failed.", "error");
    }
  },

  // Delete Book Action
  deleteBook(bookId) {
    const book = this.state.books.find(b => b.id === bookId);
    if (!book) return;

    if (book.status === "Issued" || book.status === "Overdue") {
      this.showToast("Cannot delete a book that is currently checked out!", "error");
      return;
    }

    this.openConfirmModal("Delete Book Catalog?", `Are you sure you want to delete '${book.title}'?`, async () => {
      try {
        await fetch(`/api/books/${bookId}`, { method: 'DELETE' });
        await fetch('/api/activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: `Deleted book catalog: '${book.title}'` })
        });
        await this.loadState();
        this.updateUI();
        this.showToast("Book deleted", "warning");
      } catch (err) {
        this.showToast("Server error. Delete failed.", "error");
      }
    });
  },

  // Delete Member Action
  deleteMember(memberId) {
    const member = this.state.members.find(m => m.id === memberId);
    if (!member) return;

    if (member.books_issued > 0) {
      this.showToast("Cannot delete a member with active book checkouts!", "error");
      return;
    }

    this.openConfirmModal("Remove Member Registry?", `Are you sure you want to remove '${member.name}' from LibriSync?`, async () => {
      try {
        await fetch(`/api/members/${memberId}`, { method: 'DELETE' });
        await fetch('/api/activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: `Removed member: '${member.name}'` })
        });
        await this.loadState();
        this.updateUI();
        this.showToast("Member removed", "warning");
      } catch (err) {
        this.showToast("Server error. Action failed.", "error");
      }
    });
  },

  // Issue Book Action
  async handleIssueBookSubmit() {
    const bookId = document.getElementById("issueBookSelect").value;
    const memberId = document.getElementById("issueMemberSelect").value;
    const issueDateStr = document.getElementById("issueDate").value;
    const dueDateStr = document.getElementById("dueDate").value;

    const book = this.state.books.find(b => b.id === bookId);
    const member = this.state.members.find(m => m.id === memberId);

    if (!book || !member) {
      this.showToast("Book or member invalid", "error");
      return;
    }

    if (member.status === "Suspended") {
      this.showToast("This member is suspended and cannot borrow books!", "error");
      return;
    }

    if (book.status !== "Available") {
      this.showToast("This book is currently checked out!", "error");
      return;
    }

    const nextTxnId = "TXN-" + String(this.state.transactions.length + 101).padStart(3, '0');
    const txnData = {
      id: nextTxnId,
      book_id: book.id,
      book_title: book.title,
      member_id: member.id,
      member_name: member.name,
      issue_date: issueDateStr,
      due_date: dueDateStr
    };

    try {
      await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(txnData)
      });
      
      await this.loadState();
      document.getElementById("issueForm").reset();
      this.updateUI();
      this.showToast("Book checked out successfully", "success");
    } catch (err) {
      this.showToast("Server checkout failed.", "error");
    }
  },

  // Return Book Action
  async handleReturnBookSubmit() {
    const txnId = document.getElementById("returnTxnSelect").value;
    const txn = this.state.transactions.find(t => t.id === txnId);

    if (!txn) {
      this.showToast("Invalid checkout transaction selected", "error");
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const today = new Date(todayStr);
    const dueDate = new Date(txn.due_date);
    let finalFine = 0;
    
    if (today > dueDate) {
      const diffTime = Math.abs(today - dueDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      finalFine = diffDays * 5;
    }

    try {
      await fetch('/api/transactions/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txn_id: txnId, return_date: todayStr, fine: finalFine })
      });

      await this.loadState();
      document.getElementById("returnForm").reset();
      document.getElementById("returnPreview").hidden = true;
      this.updateUI();
      this.showToast(`Book returned. Fine collected: ₹${finalFine}`, "success");
    } catch (err) {
      this.showToast("Server return action failed", "error");
    }
  },

  // CSV Import Drag and Drop
  initCsvImport() {
    const dropZone = document.getElementById("csvDropZone");
    const fileInput = document.getElementById("csvFileInput");
    const confirmBtn = document.getElementById("csvImportConfirmBtn");
    let parsedRecords = [];

    dropZone.addEventListener("click", () => fileInput.click());

    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.classList.add("dragover");
    });

    dropZone.addEventListener("dragleave", () => {
      dropZone.classList.remove("dragover");
    });

    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropZone.classList.remove("dragover");
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFile(files[0]);
      }
    });

    fileInput.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
      }
    });

    const handleFile = (file) => {
      if (!file.name.endsWith(".csv")) {
        this.showToast("Only CSV files are supported!", "error");
        return;
      }

      dropZone.hidden = true;
      const progressArea = document.getElementById("csvProgressArea");
      const progressFill = document.getElementById("csvProgressFill");
      const statusText = document.getElementById("csvProgressStatus");
      const progressPct = document.getElementById("csvProgressPct");
      
      progressArea.hidden = false;
      progressFill.style.width = "0%";
      statusText.textContent = "Reading file...";
      progressPct.textContent = "0%";

      let pct = 0;
      const interval = setInterval(() => {
        pct += 25;
        progressFill.style.width = `${pct}%`;
        progressPct.textContent = `${pct}%`;
        
        if (pct === 50) {
          statusText.textContent = "Parsing CSV metadata...";
        } else if (pct === 100) {
          clearInterval(interval);
          
          const reader = new FileReader();
          reader.onload = (event) => {
            const text = event.target.result;
            processCsvText(text);
          };
          reader.readAsText(file);
        }
      }, 150);
    };

    const processCsvText = (csvText) => {
      const lines = csvText.split(/\r\n|\n/);
      if (lines.length < 2) {
        this.showToast("CSV file is empty!", "error");
        this.openImportModal();
        return;
      }

      const headers = lines[0].toLowerCase().split(",").map(h => h.trim().replace(/^["']|["']$/g, ''));
      const isbnIdx = headers.indexOf("isbn");
      const titleIdx = headers.indexOf("title");
      const authorIdx = headers.indexOf("author");
      const categoryIdx = headers.indexOf("category");
      const publisherIdx = headers.indexOf("publisher");
      const yearIdx = headers.indexOf("year");
      const rackIdx = headers.indexOf("rack");

      if (isbnIdx === -1 || titleIdx === -1 || authorIdx === -1 || categoryIdx === -1) {
        this.showToast("Missing required columns! Required: ISBN, Title, Author, Category", "error");
        this.openImportModal();
        return;
      }

      parsedRecords = [];
      let invalidCount = 0;
      const previewRows = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^["']|["']$/g, ''));
        
        if (values.length < headers.length) {
          invalidCount++;
          continue;
        }

        const isbn = values[isbnIdx];
        const title = values[titleIdx];
        const author = values[authorIdx];
        const category = values[categoryIdx];
        const publisher = publisherIdx !== -1 ? values[publisherIdx] : "";
        const year = yearIdx !== -1 ? parseInt(values[yearIdx]) || null : null;
        const rack = rackIdx !== -1 ? values[rackIdx] : "";

        if (!isbn || !title || !author || !category) {
          invalidCount++;
          previewRows.push({ title: title || "Unknown", author: author || "Unknown", isbn: isbn || "—", status: "Invalid" });
          continue;
        }

        parsedRecords.push({ isbn, title, author, category, publisher, year, rack });
        if (previewRows.length < 5) {
          previewRows.push({ title, author, isbn, status: "Valid" });
        }
      }

      document.getElementById("csvProgressArea").hidden = true;
      document.getElementById("csvSummaryArea").hidden = false;

      document.getElementById("csvCountValid").textContent = `${parsedRecords.length} valid rows`;
      document.getElementById("csvCountInvalid").textContent = `${invalidCount} invalid rows`;

      const previewBody = document.getElementById("csvPreviewBody");
      previewBody.innerHTML = "";
      
      previewRows.forEach(row => {
        const tr = document.createElement("tr");
        const statusBadge = row.status === "Valid" ? "badge-available" : "badge-overdue";
        tr.innerHTML = `
          <td><strong>${row.title}</strong></td>
          <td>${row.author}</td>
          <td class="mono">${row.isbn}</td>
          <td><span class="badge ${statusBadge}">${row.status}</span></td>
        `;
        previewBody.appendChild(tr);
      });

      if (parsedRecords.length > 0) {
        confirmBtn.disabled = false;
      }
    };

    confirmBtn.onclick = async () => {
      try {
        let nextNum = this.state.books.length + 1;
        for (const rec of parsedRecords) {
          const payload = {
            id: "BK-" + String(nextNum++).padStart(3, '0'),
            isbn: rec.isbn,
            title: rec.title,
            author: rec.author,
            category: rec.category,
            publisher: rec.publisher,
            year: rec.year,
            rack: rec.rack,
            status: "Available",
            cover_url: ""
          };
          await fetch('/api/books', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        }

        await fetch('/api/activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: `Imported ${parsedRecords.length} books via CSV catalog` })
        });

        await this.loadState();
        this.closeModal();
        this.updateUI();
        this.showToast(`Imported ${parsedRecords.length} books successfully`, "success");
      } catch (err) {
        this.showToast("Error importing records", "error");
      }
    };
  },

  // Backup state to a local JSON file download
  async backupDatabase() {
    try {
      const dbDump = await fetch('/api/backup/download').then(r => r.json());
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dbDump));
      const dlAnchorElem = document.createElement('a');
      dlAnchorElem.setAttribute("href", dataStr);
      dlAnchorElem.setAttribute("download", `librisync_backup_${new Date().toISOString().split('T')[0]}.json`);
      dlAnchorElem.click();
      this.showToast("Database backup downloaded", "success");
    } catch (err) {
      this.showToast("Backup download failed", "error");
    }
  },

  // Restore state from JSON file upload
  restoreDatabase(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedState = JSON.parse(event.target.result);
        if (importedState.books && importedState.members && importedState.transactions) {
          await fetch('/api/backup/restore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(importedState)
          });
          
          await this.loadState();
          this.updateUI();
          this.showToast("Database restored successfully!", "success");
        } else {
          this.showToast("Invalid backup snapshot file format!", "error");
        }
      } catch (err) {
        this.showToast("Failed to parse JSON backup snapshot", "error");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  },

  // UI Updates Dispatcher
  updateUI() {
    this.updateKpis();
    this.renderRecentActivity();
    this.updateNotificationsUI();
    
    const route = window.location.hash.substring(1) || "dashboard";
    switch(route) {
      case "dashboard":
        this.renderCharts();
        break;
      case "inventory":
        this.renderBooksTable();
        break;
      case "circulation":
        this.initCirculationSelectors();
        this.renderTransactionsTable();
        break;
      case "members":
        this.renderMembersTable();
        break;
      case "reports":
        this.renderAnalyticsCharts();
        break;
      case "settings":
        this.renderSettingsView();
        break;
    }
  },

  // Calculates stats & updates Dashboard metrics UI
  updateKpis() {
    const kpiGrid = document.getElementById("kpiGrid");
    if (!kpiGrid) return;

    const totalBooks = this.state.books.length;
    const activeMembers = this.state.members.filter(m => m.status === "Active").length;
    const activeCheckouts = this.state.transactions.filter(t => t.status === "Issued" || t.status === "Overdue").length;
    const overdueCount = this.state.transactions.filter(t => t.status === "Overdue").length;
    const totalFines = this.state.transactions.reduce((sum, t) => sum + (t.fine || 0), 0);

    const statCards = [
      { label: "Total Books", val: totalBooks, icon: "fa-solid fa-book", color: "#2563EB", bg: "var(--primary-light)", trend: "+4%", trendDir: "up" },
      { label: "Active Members", val: activeMembers, icon: "fa-solid fa-address-card", color: "#14B8A6", bg: "var(--secondary-light)", trend: "+12%", trendDir: "up" },
      { label: "Checked Out", val: activeCheckouts, icon: "fa-solid fa-arrow-right-from-bracket", color: "#7C3AED", bg: "#F3E8FF", trend: "Normal", trendDir: "up" },
      { label: "Overdue Books", val: overdueCount, icon: "fa-solid fa-clock-rotate-left", color: "#EF4444", bg: "var(--danger-light)", trend: overdueCount > 0 ? "Fines active" : "0 Fines", trendDir: overdueCount > 0 ? "down" : "up" },
      { label: "Fines Collected", val: `₹${totalFines}`, icon: "fa-solid fa-indian-rupee-sign", color: "#F59E0B", bg: "var(--accent-light)", trend: "Cumulative", trendDir: "up" },
      { label: "Registered Racks", val: "12 Areas", icon: "fa-solid fa-layer-group", color: "#64748B", bg: "#F1F5F9", trend: "Organized", trendDir: "up" }
    ];

    kpiGrid.innerHTML = "";
    statCards.forEach(c => {
      const card = document.createElement("div");
      card.className = "kpi-card";
      card.style.setProperty("--kpi-color", c.color);
      card.style.setProperty("--kpi-bg", c.bg);
      
      const trendClass = c.trendDir === "up" ? "up" : "down";
      
      card.innerHTML = `
        <div class="kpi-top">
          <div class="kpi-icon"><i class="${c.icon}"></i></div>
          <span class="kpi-trend ${trendClass}">${c.trend}</span>
        </div>
        <div class="kpi-value count-pop">${c.val}</div>
        <div class="kpi-label">${c.label}</div>
      `;
      kpiGrid.appendChild(card);
    });
  },

  // Updates recent activity feed panel UI
  renderRecentActivity() {
    const timeline = document.getElementById("activityTimeline");
    const countEl = document.getElementById("activityCount");
    if (!timeline) return;

    if (this.state.activities.length === 0) {
      timeline.innerHTML = '<div class="timeline-empty">No recent logs recorded</div>';
      if (countEl) countEl.textContent = "0 events";
      return;
    }

    if (countEl) countEl.textContent = `${this.state.activities.length} events`;

    timeline.innerHTML = "";
    this.state.activities.forEach(a => {
      const li = document.createElement("li");
      const relativeTime = this.timeAgo(new Date(a.time));
      li.innerHTML = `
        <span class="t-dot"></span>
        <div class="t-body">
          <span class="t-title">${a.title}</span>
          <p class="t-time">${relativeTime}</p>
        </div>
      `;
      timeline.appendChild(li);
    });
  },

  timeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return interval + "y ago";
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return interval + "mo ago";
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return interval + "d ago";
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return interval + "h ago";
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return interval + "m ago";
    return "Just now";
  },

  // Topbar Notifications rendering UI
  updateNotificationsUI() {
    const dot = document.getElementById("notifDot");
    const list = document.getElementById("notifList");
    const panel = document.getElementById("notifPanel");
    
    const notifBtn = document.getElementById("notifBtn");
    notifBtn.onclick = (e) => {
      e.stopPropagation();
      panel.classList.toggle("open");
    };

    document.addEventListener("click", () => panel.classList.remove("open"));
    panel.onclick = (e) => e.stopPropagation();

    const unreadCount = this.state.notifications.filter(n => !n.read).length;
    if (unreadCount > 0) {
      dot.classList.add("show");
    } else {
      dot.classList.remove("show");
    }

    if (this.state.notifications.length === 0) {
      list.innerHTML = '<div class="notif-empty">No unread notifications</div>';
      return;
    }

    list.innerHTML = "";
    this.state.notifications.forEach(n => {
      const item = document.createElement("div");
      item.className = `notif-item ${n.read ? 'read' : ''}`;
      item.innerHTML = `
        <i class="fa-solid fa-circle-exclamation"></i>
        <div>
          <span class="n-msg">${n.msg}</span>
          <p class="n-time">${this.timeAgo(new Date(n.time))}</p>
        </div>
      `;
      list.appendChild(item);
    });
  },

  initCirculationSelectors() {
    const bookSelect = document.getElementById("issueBookSelect");
    const memberSelect = document.getElementById("issueMemberSelect");
    const returnSelect = document.getElementById("returnTxnSelect");

    bookSelect.innerHTML = '<option value="">Choose book...</option>';
    this.state.books.filter(b => b.status === "Available").forEach(b => {
      bookSelect.innerHTML += `<option value="${b.id}">${b.id} — ${b.title} (${b.author})</option>`;
    });

    memberSelect.innerHTML = '<option value="">Choose member...</option>';
    this.state.members.filter(m => m.status === "Active").forEach(m => {
      memberSelect.innerHTML += `<option value="${m.id}">${m.id} — ${m.name}</option>`;
    });

    returnSelect.innerHTML = '<option value="">Select checked-out record...</option>';
    this.state.transactions.filter(t => t.status === "Issued" || t.status === "Overdue").forEach(t => {
      returnSelect.innerHTML += `<option value="${t.id}">${t.id} — ${t.book_title} (Patron: ${t.member_name})</option>`;
    });

    const today = new Date().toISOString().split('T')[0];
    const defaultDue = new Date();
    defaultDue.setDate(defaultDue.getDate() + 14);
    const dueStr = defaultDue.toISOString().split('T')[0];

    document.getElementById("issueDate").value = today;
    document.getElementById("dueDate").value = dueStr;
  },

  initCategoryFilters() {
    const categoryFilter = document.getElementById("filterCategory");
    const currentVal = categoryFilter.value;
    
    const categories = [...new Set(this.state.books.map(b => b.category))];
    
    categoryFilter.innerHTML = '<option value="">All categories</option>';
    categories.forEach(c => {
      categoryFilter.innerHTML += `<option value="${c}">${c}</option>`;
    });

    categoryFilter.value = currentVal;
  },

  renderBooksTable() {
    const tbody = document.getElementById("booksTableBody");
    const emptyState = document.getElementById("booksEmptyState");
    const resultCount = document.getElementById("booksResultCount");

    tbody.innerHTML = "";

    const searchVal = document.getElementById("bookSearchInput").value.toLowerCase().trim();
    const catVal = document.getElementById("filterCategory").value;
    const statVal = document.getElementById("filterStatus").value;

    let filtered = this.state.books.filter(b => {
      const matchesSearch = b.title.toLowerCase().includes(searchVal) || 
                            b.author.toLowerCase().includes(searchVal) || 
                            b.isbn.includes(searchVal) || 
                            b.rack.toLowerCase().includes(searchVal);
      const matchesCategory = !catVal || b.category === catVal;
      const matchesStatus = !statVal || b.status === statVal;
      return matchesSearch && matchesCategory && matchesStatus;
    });

    filtered.sort((a, b) => {
      let fieldA = a[this.booksSort.column];
      let fieldB = b[this.booksSort.column];

      if (typeof fieldA === 'string') {
        fieldA = fieldA.toLowerCase();
        fieldB = fieldB.toLowerCase();
      }

      if (fieldA < fieldB) return this.booksSort.direction === 'asc' ? -1 : 1;
      if (fieldA > fieldB) return this.booksSort.direction === 'asc' ? 1 : -1;
      return 0;
    });

    resultCount.textContent = `${filtered.length} books found`;

    if (filtered.length === 0) {
      emptyState.hidden = false;
      document.getElementById("booksPagination").innerHTML = "";
      return;
    }
    emptyState.hidden = true;

    const page = this.booksPagination.currentPage;
    const size = this.booksPagination.pageSize;
    this.booksPagination.totalPages = Math.ceil(filtered.length / size);
    
    const paginated = filtered.slice((page - 1) * size, page * size);

    paginated.forEach(b => {
      const tr = document.createElement("tr");
      
      let statusBadge = "badge-available";
      if (b.status === "Issued") statusBadge = "badge-issued";
      else if (b.status === "Overdue") statusBadge = "badge-overdue";
      else if (b.status === "Lost") statusBadge = "badge-lost";

      const coverImg = b.cover_url ? 
        `<img class="cell-cover" src="${b.cover_url}" alt="Cover">` : 
        `<div class="cell-cover" style="display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--text-3);"><i class="fa-solid fa-book"></i></div>`;

      tr.innerHTML = `
        <td class="mono"><strong>${b.id}</strong></td>
        <td>${coverImg}</td>
        <td class="mono">${b.isbn}</td>
        <td><strong>${b.title}</strong></td>
        <td>${b.author}</td>
        <td>${b.category}</td>
        <td>${b.publisher || "—"}</td>
        <td>${b.year || "—"}</td>
        <td class="mono">${b.rack || "—"}</td>
        <td><span class="badge ${statusBadge}">${b.status}</span></td>
        <td>
          <div class="row-actions">
            <button onclick="App.openBookModal(${JSON.stringify(b).replace(/"/g, '&quot;')})" title="Edit Book"><i class="fa-solid fa-pen"></i></button>
            <button class="danger" onclick="App.deleteBook('${b.id}')" title="Delete Book"><i class="fa-solid fa-trash-can"></i></button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    this.renderPaginationUI();
    this.initTableHeadersSorting();
  },

  initTableHeadersSorting() {
    const headers = document.querySelectorAll("#booksTable th[data-sort]");
    headers.forEach(h => {
      const newHeader = h.cloneNode(true);
      h.parentNode.replaceChild(newHeader, h);
      
      const col = newHeader.getAttribute("data-sort");
      const icon = newHeader.querySelector("i");
      if (col === this.booksSort.column) {
        icon.className = this.booksSort.direction === 'asc' ? 'fa-solid fa-sort-up' : 'fa-solid fa-sort-down';
        icon.style.opacity = "1";
      } else {
        icon.className = 'fa-solid fa-sort';
        icon.style.opacity = ".4";
      }

      newHeader.addEventListener("click", () => {
        if (this.booksSort.column === col) {
          this.booksSort.direction = this.booksSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
          this.booksSort.column = col;
          this.booksSort.direction = 'asc';
        }
        this.renderBooksTable();
      });
    });
  },

  renderPaginationUI() {
    const container = document.getElementById("booksPagination");
    container.innerHTML = "";

    const current = this.booksPagination.currentPage;
    const total = this.booksPagination.totalPages;

    if (total <= 1) return;

    const prevBtn = document.createElement("button");
    prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
    prevBtn.disabled = current === 1;
    prevBtn.onclick = () => {
      this.booksPagination.currentPage--;
      this.renderBooksTable();
    };
    container.appendChild(prevBtn);

    for (let i = 1; i <= total; i++) {
      const btn = document.createElement("button");
      btn.textContent = i;
      if (i === current) btn.className = "active";
      btn.onclick = () => {
        this.booksPagination.currentPage = i;
        this.renderBooksTable();
      };
      container.appendChild(btn);
    }

    const nextBtn = document.createElement("button");
    nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
    nextBtn.disabled = current === total;
    nextBtn.onclick = () => {
      this.booksPagination.currentPage++;
      this.renderBooksTable();
    };
    container.appendChild(nextBtn);
  },

  renderTransactionsTable() {
    const tbody = document.getElementById("txnTableBody");
    const countEl = document.getElementById("txnCount");
    if (!tbody) return;

    countEl.textContent = `${this.state.transactions.length} transactions`;
    tbody.innerHTML = "";

    const sorted = [...this.state.transactions].reverse();

    sorted.forEach(t => {
      const tr = document.createElement("tr");
      
      let statusBadge = "badge-available";
      if (t.status === "Issued") statusBadge = "badge-issued";
      else if (t.status === "Overdue") statusBadge = "badge-overdue";
      else if (t.status === "Returned") statusBadge = "badge-returned";

      tr.innerHTML = `
        <td class="mono"><strong>${t.id}</strong></td>
        <td><strong>${t.book_title}</strong><p class="hint">${t.book_id}</p></td>
        <td>${t.member_name}<p class="hint">${t.member_id}</p></td>
        <td>${t.issue_date}</td>
        <td>${t.due_date}</td>
        <td>${t.return_date || "—"}</td>
        <td class="mono"><strong>₹${t.fine || 0}</strong></td>
        <td><span class="badge ${statusBadge}">${t.status}</span></td>
      `;
      tbody.appendChild(tr);
    });
  },

  renderMembersTable() {
    const tbody = document.getElementById("membersTableBody");
    const emptyState = document.getElementById("membersEmptyState");
    const resultCount = document.getElementById("membersResultCount");
    if (!tbody) return;

    tbody.innerHTML = "";

    const searchVal = document.getElementById("memberSearchInput").value.toLowerCase().trim();
    const typeVal = document.getElementById("filterMemberType").value;

    const filtered = this.state.members.filter(m => {
      const matchesSearch = m.name.toLowerCase().includes(searchVal) || 
                            m.email.toLowerCase().includes(searchVal) || 
                            m.id.toLowerCase().includes(searchVal);
      const matchesType = !typeVal || m.type === typeVal;
      return matchesSearch && matchesType;
    });

    resultCount.textContent = `${filtered.length} members total`;

    if (filtered.length === 0) {
      emptyState.hidden = false;
      return;
    }
    emptyState.hidden = true;

    filtered.forEach(m => {
      const tr = document.createElement("tr");
      const statusBadge = m.status === "Active" ? "badge-active" : "badge-suspended";

      tr.innerHTML = `
        <td class="mono"><strong>${m.id}</strong></td>
        <td><strong>${m.name}</strong></td>
        <td>${m.email}</td>
        <td>${m.type}</td>
        <td>${m.joined}</td>
        <td><span class="mono">${m.books_issued} books</span></td>
        <td><span class="badge ${statusBadge}">${m.status}</span></td>
        <td>
          <div class="row-actions">
            <button onclick="App.openMemberModal(${JSON.stringify(m).replace(/"/g, '&quot;')})" title="Edit Member"><i class="fa-solid fa-user-pen"></i></button>
            <button class="danger" onclick="App.deleteMember('${m.id}')" title="Delete Member"><i class="fa-solid fa-trash-can"></i></button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  },

  renderSettingsView() {
    document.getElementById("darkModeSwitch").checked = this.state.theme.darkMode;
    
    const swatches = document.querySelectorAll(".swatch");
    swatches.forEach(swatch => {
      if (swatch.getAttribute("data-color").toLowerCase() === this.state.theme.accentColor.toLowerCase()) {
        swatch.classList.add("active");
      } else {
        swatch.classList.remove("active");
      }
    });
  },

  renderCharts() {
    const route = window.location.hash.substring(1) || "dashboard";
    if (route !== "dashboard") return;

    if (this.charts.inventoryDist) this.charts.inventoryDist.destroy();
    if (this.charts.monthlyIssues) this.charts.monthlyIssues.destroy();
    if (this.charts.topCategories) this.charts.topCategories.destroy();

    const categories = {};
    this.state.books.forEach(b => {
      categories[b.category] = (categories[b.category] || 0) + 1;
    });

    const ctxInv = document.getElementById("chartInventoryDist").getContext("2d");
    this.charts.inventoryDist = new Chart(ctxInv, {
      type: 'doughnut',
      data: {
        labels: Object.keys(categories),
        datasets: [{
          data: Object.values(categories),
          backgroundColor: ["#2563EB", "#14B8A6", "#7C3AED", "#F59E0B", "#EF4444", "#64748B"]
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 10 } } }
      }
    });

    const ctxMonthly = document.getElementById("chartMonthlyIssues").getContext("2d");
    this.charts.monthlyIssues = new Chart(ctxMonthly, {
      type: 'line',
      data: {
        labels: ["Feb", "Mar", "Apr", "May", "Jun", "Jul"],
        datasets: [{
          label: 'Issues',
          data: [15, 24, 31, 28, 42, 38],
          borderColor: "var(--primary)",
          tension: 0.3,
          fill: true,
          backgroundColor: 'rgba(37,99,235,.06)'
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });

    const ctxTop = document.getElementById("chartTopCategories").getContext("2d");
    this.charts.topCategories = new Chart(ctxTop, {
      type: 'bar',
      data: {
        labels: ["Fiction", "Science", "Technology", "History", "Biography"],
        datasets: [{
          data: [42, 35, 29, 21, 14],
          backgroundColor: "var(--primary)"
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        indexAxis: 'y',
        scales: { x: { beginAtZero: true } }
      }
    });
  },

  renderAnalyticsCharts() {
    const route = window.location.hash.substring(1);
    if (route !== "reports") return;

    if (this.charts.mostBorrowed) this.charts.mostBorrowed.destroy();
    if (this.charts.monthlyTrend) this.charts.monthlyTrend.destroy();
    if (this.charts.categoryDist) this.charts.categoryDist.destroy();
    if (this.charts.fineCollection) this.charts.fineCollection.destroy();

    const ctxMost = document.getElementById("chartMostBorrowed").getContext("2d");
    this.charts.mostBorrowed = new Chart(ctxMost, {
      type: 'bar',
      data: {
        labels: ["Sapiens", "Steve Jobs", "Clean Code", "The Great Gatsby", "Cosmos"],
        datasets: [{
          label: 'Checkouts',
          data: [12, 9, 8, 7, 5],
          backgroundColor: "#14B8A6"
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });

    const ctxTrend = document.getElementById("chartMonthlyTrend").getContext("2d");
    this.charts.monthlyTrend = new Chart(ctxTrend, {
      type: 'line',
      data: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [{
          label: 'Student Issues',
          data: [65, 78, 85, 74, 98, 112],
          borderColor: "#2563EB",
          fill: false
        }, {
          label: 'Faculty Issues',
          data: [20, 24, 30, 28, 35, 42],
          borderColor: "#7C3AED",
          fill: false
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom' } }
      }
    });

    const categories = {};
    this.state.books.forEach(b => {
      categories[b.category] = (categories[b.category] || 0) + 1;
    });

    const ctxCat = document.getElementById("chartCategoryDist").getContext("2d");
    this.charts.categoryDist = new Chart(ctxCat, {
      type: 'polarArea',
      data: {
        labels: Object.keys(categories),
        datasets: [{
          data: Object.values(categories),
          backgroundColor: ["rgba(37,99,235,.75)", "rgba(20,184,166,.75)", "rgba(124,58,237,.75)", "rgba(245,158,11,.75)", "rgba(239,68,68,.75)", "rgba(100,116,139,.75)"]
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom' } }
      }
    });

    const ctxFines = document.getElementById("chartFineCollection").getContext("2d");
    this.charts.fineCollection = new Chart(ctxFines, {
      type: 'bar',
      data: {
        labels: ["Mar", "Apr", "May", "Jun", "Jul"],
        datasets: [{
          label: 'Fines Collected (₹)',
          data: [120, 150, 80, 210, 350],
          backgroundColor: "#F59E0B"
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  },

  exportCsv(type) {
    let csvContent = "data:text/csv;charset=utf-8,";
    let filename = "";

    if (type === "books") {
      csvContent += "Book ID,ISBN,Title,Author,Category,Publisher,Year,Rack,Status\n";
      this.state.books.forEach(b => {
        csvContent += `"${b.id}","${b.isbn}","${b.title}","${b.author}","${b.category}","${b.publisher || ""}","${b.year || ""}","${b.rack || ""}","${b.status}"\n`;
      });
      filename = "libri_sync_books_catalog.csv";
    } else if (type === "members") {
      csvContent += "Member ID,Name,Email,Type,Joined Date,Books Issued,Status\n";
      this.state.members.forEach(m => {
        csvContent += `"${m.id}","${m.name}","${m.email}","${m.type}","${m.joined}","${m.books_issued}","${m.status}"\n`;
      });
      filename = "libri_sync_members_registry.csv";
    } else if (type === "transactions") {
      csvContent += "Transaction ID,Book ID,Book Title,Member ID,Member Name,Issue Date,Due Date,Return Date,Fine (Rs),Status\n";
      this.state.transactions.forEach(t => {
        csvContent += `"${t.id}","${t.book_id}","${t.book_title}","${t.member_id}","${t.member_name}","${t.issue_date}","${t.due_date}","${t.return_date || ""}","${t.fine}","${t.status}"\n`;
      });
      filename = "libri_sync_circulation_history.csv";
    }

    const encodedUri = encodeURI(csvContent);
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", encodedUri);
    dlAnchorElem.setAttribute("download", filename);
    dlAnchorElem.click();
    this.showToast(`CSV export downloaded: ${filename}`, "success");
  },

  showToast(msg, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    
    let icon = "fa-solid fa-circle-info";
    if (type === "success") icon = "fa-solid fa-circle-check";
    else if (type === "error") icon = "fa-solid fa-triangle-exclamation";
    else if (type === "warning") icon = "fa-solid fa-circle-exclamation";

    toast.innerHTML = `
      <i class="${icon}"></i>
      <span class="toast-msg">${msg}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("hide");
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 4000);
  }
};

window.addEventListener("DOMContentLoaded", () => App.init());
