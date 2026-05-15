// Mock Enterprise Database
let libraryDB = [
    { id: 101, title: "The Great Gatsby", author: "F. Scott Fitzgerald", status: "Available" },
    { id: 102, title: "Clean Code", author: "Robert C. Martin", status: "Issued" },
    { id: 103, title: "Design Patterns", author: "Gang of Four", status: "Available" },
    { id: 104, title: "System Design Interview", author: "Alex Xu", status: "Issued" }
];

const FINE_PER_DAY = 2; // $2 penalty per day

// --- Core Navigation ---
function switchTab(tabId) {
    document.querySelectorAll('.tab-view').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-menu li').forEach(li => li.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    document.getElementById(`nav-${tabId}`).classList.add('active');
    
    // Update Page Title dynamically
    const titles = {
        'dashboard': 'System Dashboard',
        'catalog': 'Digital Catalog',
        'manage': 'Asset Registration',
        'issue': 'Issue & Return Portal'
    };
    document.getElementById('page-title').innerText = titles[tabId];

    if(tabId === 'dashboard') updateDashboardMetrics();
    if(tabId === 'catalog') renderCatalog();
}

// --- Dashboard Intelligence ---
function updateDashboardMetrics() {
    const total = libraryDB.length;
    const issued = libraryDB.filter(b => b.status === "Issued").length;
    const available = total - issued;

    document.getElementById('kpi-total').innerText = total;
    document.getElementById('kpi-issued').innerText = issued;
    document.getElementById('kpi-available').innerText = available;
}

// --- Dynamic Catalog Rendering ---
function renderCatalog() {
    const tbody = document.getElementById('catalogBody');
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();
    tbody.innerHTML = '';

    libraryDB.forEach(book => {
        if (book.title.toLowerCase().includes(searchQuery) || 
            book.author.toLowerCase().includes(searchQuery) || 
            book.id.toString().includes(searchQuery)) {
            
            const badgeClass = book.status === "Available" ? "badge-available" : "badge-issued";
            
            tbody.innerHTML += `
                <tr>
                    <td><strong>#${book.id}</strong></td>
                    <td>${book.title}</td>
                    <td>${book.author}</td>
                    <td><span class="status-badge ${badgeClass}">${book.status}</span></td>
                </tr>
            `;
        }
    });
}

// --- Asset Registration (Add Book) ---
document.getElementById('addBookForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const title = document.getElementById('bookTitle').value;
    const author = document.getElementById('bookAuthor').value;
    const newId = libraryDB.length > 0 ? Math.max(...libraryDB.map(b => b.id)) + 1 : 101;

    libraryDB.push({ id: newId, title: title, author: author, status: "Available" });
    
    alert(`Asset Registered Successfully. ID: ${newId}`);
    document.getElementById('addBookForm').reset();
    updateDashboardMetrics();
});

// --- Issue Logic ---
function processIssue() {
    const id = parseInt(document.getElementById('issueId').value);
    const book = libraryDB.find(b => b.id === id);

    if (!book) {
        alert("Error: Asset ID not found.");
    } else if (book.status === "Issued") {
        alert("Error: Asset is currently issued to another user.");
    } else {
        book.status = "Issued";
        alert(`Success: ${book.title} has been issued.`);
        updateDashboardMetrics();
    }
    document.getElementById('issueId').value = '';
}

// --- Return & Penalty Logic ---
function processReturn() {
    const id = parseInt(document.getElementById('returnId').value);
    const lateDays = parseInt(document.getElementById('daysLate').value) || 0;
    const alertBox = document.getElementById('fineAlert');
    const book = libraryDB.find(b => b.id === id);

    alertBox.classList.remove('hidden', 'alert-success', 'alert-danger');

    if (!book) {
        alertBox.innerHTML = "<i class='fa-solid fa-circle-exclamation'></i> Asset ID not found.";
        alertBox.classList.add('alert-danger');
    } else if (book.status === "Available") {
        alertBox.innerHTML = "<i class='fa-solid fa-circle-exclamation'></i> Asset is already in the library.";
        alertBox.classList.add('alert-danger');
    } else {
        book.status = "Available";
        
        if (lateDays > 0) {
            const totalFine = lateDays * FINE_PER_DAY;
            alertBox.innerHTML = `<i class='fa-solid fa-triangle-exclamation'></i> Returned. <strong>Penalty Applied: $${totalFine}</strong> (${lateDays} days late).`;
            alertBox.classList.add('alert-danger');
        } else {
            alertBox.innerHTML = "<i class='fa-solid fa-circle-check'></i> Returned successfully on time. No penalties.";
            alertBox.classList.add('alert-success');
        }
        updateDashboardMetrics();
    }
    document.getElementById('returnId').value = '';
    document.getElementById('daysLate').value = 0;
}

// Initialize System on Load
window.onload = () => {
    updateDashboardMetrics();
    renderCatalog();
};
