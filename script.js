// Mock Database
let libraryDB = [
    { id: 101, title: "The Great Gatsby", author: "F. Scott Fitzgerald", status: "Available" },
    { id: 102, title: "1984", author: "George Orwell", status: "Issued" },
    { id: 103, title: "To Kill a Mockingbird", author: "Harper Lee", status: "Available" }
];

const FINE_PER_DAY = 2; // $2 per day late

// --- UI Navigation ---
function showTab(tabId) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.sidebar li').forEach(li => li.classList.remove('active'));
    
    // Show selected tab
    document.getElementById(tabId).classList.add('active');
    document.getElementById(`nav-${tabId}`).classList.add('active');
}

// --- Digital Catalog ---
function renderCatalog() {
    const tbody = document.getElementById('catalogBody');
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();
    tbody.innerHTML = '';

    libraryDB.forEach(book => {
        if (book.title.toLowerCase().includes(searchQuery) || book.author.toLowerCase().includes(searchQuery)) {
            let statusClass = book.status === "Available" ? "status-available" : "status-issued";
            tbody.innerHTML += `
                <tr>
                    <td>${book.id}</td>
                    <td>${book.title}</td>
                    <td>${book.author}</td>
                    <td class="${statusClass}">${book.status}</td>
                </tr>
            `;
        }
    });
}

// --- Book Management (Add) ---
document.getElementById('addBookForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const title = document.getElementById('bookTitle').value;
    const author = document.getElementById('bookAuthor').value;
    const newId = libraryDB.length > 0 ? Math.max(...libraryDB.map(b => b.id)) + 1 : 101;

    libraryDB.push({ id: newId, title: title, author: author, status: "Available" });
    
    alert(`Book added successfully! ID is ${newId}`);
    document.getElementById('addBookForm').reset();
    renderCatalog();
});

// --- Issue Tracking ---
function issueBook() {
    const id = parseInt(document.getElementById('issueId').value);
    const book = libraryDB.find(b => b.id === id);

    if (!book) {
        alert("Book ID not found in database.");
    } else if (book.status === "Issued") {
        alert("This book is already issued to someone else.");
    } else {
        book.status = "Issued";
        alert(`Successfully issued: ${book.title}`);
        renderCatalog();
    }
    document.getElementById('issueId').value = '';
}

// --- Return Tracking & Fine Calculation ---
function returnBook() {
    const id = parseInt(document.getElementById('returnId').value);
    const lateDays = parseInt(document.getElementById('daysLate').value) || 0;
    const fineMessage = document.getElementById('fineMessage');
    const book = libraryDB.find(b => b.id === id);

    fineMessage.innerText = "";

    if (!book) {
        alert("Book ID not found.");
    } else if (book.status === "Available") {
        alert("This book is already in the library.");
    } else {
        book.status = "Available";
        let message = `Successfully returned: ${book.title}. `;
        
        if (lateDays > 0) {
            const totalFine = lateDays * FINE_PER_DAY;
            fineMessage.innerText = `Fine applied: $${totalFine} (${lateDays} days late).`;
        } else {
            fineMessage.innerText = "No fines. Returned on time.";
            fineMessage.style.color = "green";
        }
        
        alert(message);
        renderCatalog();
    }
    document.getElementById('returnId').value = '';
    document.getElementById('daysLate').value = 0;
}

// Initialize application
window.onload = renderCatalog;
