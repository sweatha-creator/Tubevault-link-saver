// --- DOM Elements ---
const linkForm = document.getElementById('link-form');
const ytUrl = document.getElementById('yt-url');
const ytTitle = document.getElementById('yt-title');
const ytCategory = document.getElementById('yt-category');
const searchBar = document.getElementById('search-bar');
const linksGrid = document.getElementById('links-grid');
const emptyState = document.getElementById('empty-state');
const totalCount = document.getElementById('total-count');
const themeToggle = document.getElementById('theme-toggle');
const filterPills = document.querySelectorAll('.filter-pill');
const splashScreen = document.getElementById('splash-screen');

// Modal Elements
const customModal = document.getElementById('custom-modal');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const modalCancel = document.getElementById('modal-cancel');
const modalConfirm = document.getElementById('modal-confirm');

// --- Global State ---
let savedLinks = JSON.parse(localStorage.getItem('yt_links')) || [];
let activeCategory = 'All'; 
let modalCallback = null;

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setupCategoryFilters();
    renderLinks();
    
    // NEW: Splash Screen control (1.5 விநாடிகளுக்குப் பின் ஸ்மூத்தாக மறையும்)
    setTimeout(() => {
        splashScreen.classList.add('fade-out');
    }, 1500);
});

// --- Theme Management ---
themeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    themeToggle.textContent = isDark ? '🌙' : '☀️';
});

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.remove('dark-mode');
        themeToggle.textContent = '☀️';
    } else {
        document.body.classList.add('dark-mode');
        themeToggle.textContent = '🌙';
    }
}

// --- Category Filter Setup ---
function setupCategoryFilters() {
    filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelector('.filter-pill.active').classList.remove('active');
            pill.classList.add('active');
            
            activeCategory = pill.getAttribute('data-category');
            renderLinks();
        });
    });
}

// --- Add Link ---
linkForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const newLink = {
        id: Date.now().toString(),
        url: ytUrl.value.trim(),
        title: ytTitle.value.trim(),
        category: ytCategory.value,
        pinned: false
    };

    savedLinks.push(newLink);
    saveToLocalStorage();
    renderLinks();
    linkForm.reset();
});

function saveToLocalStorage() {
    localStorage.setItem('yt_links', JSON.stringify(savedLinks));
}

// --- Render View ---
function renderLinks() {
    const searchQuery = searchBar.value.toLowerCase();
    
    const filteredLinks = savedLinks.filter(link => {
        const matchesSearch = link.title.toLowerCase().includes(searchQuery);
        const matchesCategory = (activeCategory === 'All') || (link.category === activeCategory);
        return matchesSearch && matchesCategory;
    });

    totalCount.textContent = savedLinks.length;

    if (filteredLinks.length === 0) {
        linksGrid.innerHTML = '';
        emptyState.classList.remove('hidden');
        if(searchQuery || activeCategory !== 'All') {
            emptyState.textContent = "🔍 Match ஆகும் லிங்க்குகள் எதுவும் இல்லை!";
        } else {
            emptyState.textContent = "👋 No links saved yet. Start adding your favorite YouTube videos!";
        }
        return;
    } else {
        emptyState.classList.add('hidden');
    }

    linksGrid.innerHTML = '';
    
    filteredLinks.forEach(link => {
        const card = document.createElement('div');
        card.className = `link-card ${link.pinned ? 'pinned' : ''}`;
        
        card.innerHTML = `
            <div class="card-header">
                <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="card-title">${escapeHTML(link.title)}</a>
                <div class="card-actions">
                    <button class="action-btn" onclick="togglePin('${link.id}')" title="Pin Link">${link.pinned ? '📌' : '📍'}</button>
                    <button class="action-btn" onclick="promptRename('${link.id}')" title="Rename">✍️</button>
                    <button class="action-btn" onclick="promptDelete('${link.id}')" title="Delete"><svg xmlns="http://www.w3.org/2000/svg"
width="24" height="24"
viewBox="0 0 24 24"
fill="none"
stroke="white"
stroke-width="2"
stroke-linecap="round"
stroke-linejoin="round">
  <path d="M3 6h18"/>
  <path d="M8 6V4h8v2"/>
  <path d="M19 6l-1 14H6L5 6"/>
  <path d="M10 11v6"/>
  <path d="M14 11v6"/>
</svg></button>
                </div>
            </div>
            <div class="card-meta">
                <span class="tag">${link.category}</span>
            </div>
        `;
        linksGrid.appendChild(card);
    });
}

// --- Real-time Search ---
searchBar.addEventListener('input', renderLinks);

// --- Actions ---
window.togglePin = function(id) {
    savedLinks = savedLinks.map(link => 
        link.id === id ? { ...link, pinned: !link.pinned } : link
    );
    saveToLocalStorage();
    renderLinks();
};

window.promptRename = function(id) {
    const link = savedLinks.find(l => l.id === id);
    if (!link) return;

    modalTitle.textContent = "Rename Title";
    modalBody.innerHTML = `<input type="text" id="rename-input" value="${escapeHTML(link.title)}" class="modal-input">`;
    
    setTimeout(() => document.getElementById('rename-input').focus(), 50);

    openModal(() => {
        const newTitle = document.getElementById('rename-input').value.trim();
        if (newTitle) {
            link.title = newTitle;
            saveToLocalStorage();
            renderLinks();
        }
    });
};

window.promptDelete = function(id) {
    modalTitle.textContent = "Confirm Delete";
    modalBody.textContent = "Are you sure you want to permanently delete this link?";
    
    openModal(() => {
        savedLinks = savedLinks.filter(link => link.id !== id);
        saveToLocalStorage();
        renderLinks();
    });
};

// --- Custom Modal Management ---
function openModal(callback) {
    modalCallback = callback;
    customModal.classList.remove('hidden');
}

function closeModal() {
    customModal.classList.add('hidden');
    modalCallback = null;
}

modalCancel.addEventListener('click', closeModal);
modalConfirm.addEventListener('click', () => {
    if (modalCallback) modalCallback();
    closeModal();
});

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}
