// Initialize Database Array from Local Storage
let libraryDB = JSON.parse(localStorage.getItem('libriSyncDB')) || [];

// Save to Local Storage
function saveToDB() {
    localStorage.setItem('libriSyncDB', JSON.stringify(libraryDB));
    updateKPIs();
}

// --- 1. UI Navigation & Dashboard Logic ---
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

function updateKPIs() {
    const total = libraryDB.length;
    const issued = libraryDB.filter(b => b.status === 'Issued').length;
    const available = total - issued;

    document.getElementById('kpi-total').innerText = total;
    document.getElementById('kpi-issued').innerText = issued;
    document.getElementById('kpi-available').innerText = available;
}

function renderCatalog() {
    const tbody = document.getElementById('catalogBody');
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    
    tbody.innerHTML = ''; 

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

// --- 2. Inventory Management Logic ---
document.getElementById('addBookForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const title = document.getElementById('bookTitle').value;
    const author = document.getElementById('bookAuthor').value;
    const newId = libraryDB.length > 0 ? Math.max(...libraryDB.map(b => b.id)) + 1 : 101; 

    libraryDB.push({ id: newId, title: title, author: author, status: 'Available' });
    saveToDB();
    
    alert(`Asset Added! ID: #${newId}`);
    this.reset(); 
});

function processBulkUpload() {
    const fileInput = document.getElementById('csvUpload');
    const uploadAlert = document.getElementById('uploadAlert');
    const file = fileInput.files[0];

    if (!file) return alert("Please select a CSV file to upload.");

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const rows = text.split('\n');
        let importCount = 0;

        rows.forEach(row => {
            const columns = row.split(',');
            if (columns.length >= 2 && columns[0].trim() !== '') {
                const title = columns[0].trim();
                const author = columns[1].trim();
                const newId = libraryDB.length > 0 ? Math.max(...libraryDB.map(b => b.id)) + 1 : 101;

                libraryDB.push({ id: newId, title: title, author: author, status: 'Available' });
                importCount++;
            }
        });

        if (importCount > 0) {
            saveToDB();
            uploadAlert.innerHTML = `<i class="fa-solid fa-circle-check"></i> <strong>Upload Complete!</strong><br> Imported ${importCount} new assets.`;
            uploadAlert.style.display = "block";
            uploadAlert.style.backgroundColor = "#d1fae5";
            uploadAlert.style.color = "#065f46";
            uploadAlert.style.padding = "15px";
            uploadAlert.style.marginTop = "15px";
            uploadAlert.style.borderRadius = "8px";
            uploadAlert.style.border = "1px solid #34d399";
            
            fileInput.value = '';
            setTimeout(() => uploadAlert.style.display = "none", 5000);
        } else {
            alert("No valid data found. Format must be: Title, Author");
        }
    };
    reader.readAsText(file);
}

// --- 3. Circulation Management (Issue & Return) ---
function processIssue() {
    const assetId = parseInt(document.getElementById('issueId').value);
    const bookIndex = libraryDB.findIndex(b => b.id === assetId);

    if(bookIndex === -1) return alert("Error: Asset ID not found.");
    if(libraryDB[bookIndex].status === 'Issued') return alert("Asset is already issued out.");

    libraryDB[bookIndex].status = 'Issued';
    saveToDB();
    alert(`Success: Asset #${assetId} has been issued.`);
    document.getElementById('issueId').value = '';
}

function processReturn() {
    const returnId = parseInt(document.getElementById('returnId').value);
    const daysLate = parseInt(document.getElementById('daysLate').value) || 0;
    const fineAlert = document.getElementById('fineAlert');
    const bookIndex = libraryDB.findIndex(b => b.id === returnId);

    if(bookIndex === -1) return alert("Error: Asset ID not found.");
    if(libraryDB[bookIndex].status !== 'Issued') return alert("Notice: Asset is already 'Available'.");

    libraryDB[bookIndex].status = 'Available';
    saveToDB();

    if (daysLate > 0) {
        const totalFine = daysLate * 10; // ₹10 per day
        fineAlert.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> <strong>Asset Returned.</strong><br> Late penalty: ₹${totalFine} (${daysLate} days).`;
        fineAlert.style.display = "block";
        fineAlert.style.backgroundColor = "#fee2e2";
        fineAlert.style.color = "#991b1b";
        fineAlert.style.border = "1px solid #f87171";
    } else {
        fineAlert.innerHTML = `<i class="fa-solid fa-circle-check"></i> <strong>Asset Returned!</strong><br> No overdue fines.`;
        fineAlert.style.display = "block";
        fineAlert.style.backgroundColor = "#d1fae5";
        fineAlert.style.color = "#065f46";
        fineAlert.style.border = "1px solid #34d399";
    }
    
    fineAlert.style.padding = "15px";
    fineAlert.style.marginTop = "15px";
    fineAlert.style.borderRadius = "8px";

    document.getElementById('returnId').value = '';
    document.getElementById('daysLate').value = '0';
    setTimeout(() => fineAlert.style.display = "none", 5000);
}

// Initial System Load
updateKPIs();
