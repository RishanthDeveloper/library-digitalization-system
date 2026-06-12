// Initialize Database Array from Local Storage
let libraryDB = JSON.parse(localStorage.getItem('libriSyncDB')) || [];

// Save to Local Storage
function saveToDB() {
    localStorage.setItem('libriSyncDB', JSON.stringify(libraryDB));
    updateKPIs();
}

// 1. Tab Switching Logic
function switchTab(tabId) {
    document.querySelectorAll('.tab-view').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-menu li').forEach(nav => nav.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    document.getElementById('nav-' + tabId).classList.add('active');

    const titles = {
        'dashboard': 'System Dashboard',
        'catalog': 'Digital Catalog',
        'manage': 'Asset Registration',
        'issue': 'Circulation Management'
    };
    document.getElementById('page-title').innerText = titles[tabId];

    if(tabId === 'catalog' || tabId === 'dashboard') {
        renderCatalog();
        updateKPIs();
    }
}

// 2. Add New Book to Inventory
document.getElementById('addBookForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const title = document.getElementById('bookTitle').value;
    const author = document.getElementById('bookAuthor').value;
    // Generate a simple ID
    const newId = libraryDB.length > 0 ? Math.max(...libraryDB.map(b => b.id)) + 1 : 101; 

    const newAsset = {
        id: newId,
        title: title,
        author: author,
        status: 'Available'
    };

    libraryDB.push(newAsset);
    saveToDB();
    
    alert(`Asset Added! ID: ${newId}`);
    this.reset(); 
});

// 3. Render the Catalog Table
function renderCatalog() {
    const tbody = document.getElementById('catalogBody');
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    
    tbody.innerHTML = ''; // Clear current table

    const filteredBooks = libraryDB.filter(book => 
        book.title.toLowerCase().includes(searchTerm) || 
        book.author.toLowerCase().includes(searchTerm) ||
        book.id.toString().includes(searchTerm)
    );

    filteredBooks.forEach(book => {
        const statusColor = book.status === 'Available' ? 'color: var(--success); font-weight: bold;' : 'color: var(--warning); font-weight: bold;';
        
        const row = `<tr>
            <td>#${book.id}</td>
            <td>${book.title}</td>
            <td>${book.author}</td>
            <td style="${statusColor}">${book.status}</td>
        </tr>`;
        tbody.innerHTML += row;
    });
}

// 4. Issue a Book
function processIssue() {
    const assetId = parseInt(document.getElementById('issueId').value);
    const bookIndex = libraryDB.findIndex(b => b.id === assetId);

    if(bookIndex === -1) {
        return alert("Error: Asset ID not found.");
    }
    
    if(libraryDB[bookIndex].status === 'Issued') {
        return alert("Asset is already issued out.");
    }

    libraryDB[bookIndex].status = 'Issued';
    saveToDB();
    alert(`Success: Asset #${assetId} has been issued.`);
    document.getElementById('issueId').value = '';
}

// 5. Update Dashboard KPIs
function updateKPIs() {
    const total = libraryDB.length;
    const issued = libraryDB.filter(b => b.status === 'Issued').length;
    const available = total - issued;

    document.getElementById('kpi-total').innerText = total;
    document.getElementById('kpi-issued').innerText = issued;
    document.getElementById('kpi-available').innerText = available;
}

// Initial Load
updateKPIs();
