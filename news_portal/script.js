/**
 * News Portal Application Script
 * Features:
 * - JSON-Server integration
 * - CRUD operations (Create, Read, Update, Delete)
 * - Authentication simulation
 * - Comment system
 * - Pagination & Search
 * - Robust error handling & loading states
 */

// ===== 1. Configuration =====
const API_BASE_URL = 'http://localhost:3000';
const ITEMS_PER_PAGE = 6;

// ===== 2. State Management =====
let state = {
    currentUser: null,
    users: [],
    news: [],
    currentPage: 1,
    currentNewsId: null,
    searchQuery: ''
};

// ===== 3. DOM Elements =====
const elements = {
    // Pages
    loginPage: document.getElementById('login-page'),
    newsListPage: document.getElementById('news-list-page'),
    createNewsPage: document.getElementById('create-news-page'),
    newsDetailPage: document.getElementById('news-detail-page'),
    editNewsPage: document.getElementById('edit-news-page'),

    // Header Components
    mainHeader: document.getElementById('main-header'),
    loggedUser: document.getElementById('logged-user-name'),
    loggedEmail: document.getElementById('logged-user-email'),
    logoutBtn: document.getElementById('logout-btn'),
    navHome: document.getElementById('nav-home'),
    navCreate: document.getElementById('nav-create'),

    // Login Form
    loginForm: document.getElementById('login-form'),
    userSelect: document.getElementById('user-select'),

    // News List & Search
    newsList: document.getElementById('news-list'),
    searchInput: document.getElementById('search-input'),
    searchBtn: document.getElementById('search-btn'),
    pagination: document.getElementById('pagination'),

    // Create News Form
    createNewsForm: document.getElementById('create-news-form'),
    newsTitle: document.getElementById('news-title'),
    newsBody: document.getElementById('news-body'),
    cancelCreate: document.getElementById('cancel-create'),
    bodyCharCount: document.getElementById('body-char-count'),
    titleError: document.getElementById('title-error'),
    bodyError: document.getElementById('body-error'),

    // News Detail View
    newsDetail: document.getElementById('news-detail'),
    commentsList: document.getElementById('comments-list'),
    commentCount: document.getElementById('comment-count'),
    commentForm: document.getElementById('comment-form'),
    commentText: document.getElementById('comment-text'),
    commentError: document.getElementById('comment-error'),
    backToList: document.getElementById('back-to-list'),

    // Edit News Form
    editNewsForm: document.getElementById('edit-news-form'),
    editNewsId: document.getElementById('edit-news-id'),
    editNewsTitle: document.getElementById('edit-news-title'),
    editNewsBody: document.getElementById('edit-news-body'),
    cancelEdit: document.getElementById('cancel-edit'),
    editBodyCharCount: document.getElementById('edit-body-char-count'),
    editTitleError: document.getElementById('edit-title-error'),
    editBodyError: document.getElementById('edit-body-error'),

    // Utilities
    loadingOverlay: document.getElementById('loading-overlay'),
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toast-message')
};

// ===== 4. Utility Functions =====
const utils = {
    showLoading: () => elements.loadingOverlay.classList.remove('hidden'),
    hideLoading: () => elements.loadingOverlay.classList.add('hidden'),

    showToast: (message, type = 'success') => {
        elements.toast.className = `toast ${type}`;
        elements.toastMessage.textContent = message;
        elements.toast.classList.remove('hidden');

        // Hide after 3 seconds
        setTimeout(() => {
            elements.toast.classList.add('hidden');
        }, 3000);
    },

    showPage: (pageId) => {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => page.classList.add('hidden'));
        // Show target page
        document.getElementById(pageId).classList.remove('hidden');

        // Toggle Header visibility
        if (pageId === 'login-page') {
            elements.mainHeader.classList.add('hidden');
        } else {
            elements.mainHeader.classList.remove('hidden');
        }

        // Update Navigation Active State
        if (elements.navHome) elements.navHome.classList.toggle('active', pageId === 'news-list-page');
        if (elements.navCreate) elements.navCreate.classList.toggle('active', pageId === 'create-news-page');

        // Scroll to top
        window.scrollTo(0, 0);
    },

    formatDate: (dateString) => {
        if (!dateString) return '';
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        try {
            return new Date(dateString).toLocaleDateString('en-US', options);
        } catch (e) {
            return dateString;
        }
    },

    getUserName: (userId) => {
        // Using String() comparison to match '1' with 1
        const user = state.users.find(u => String(u.id) === String(userId));
        return user ? user.name : 'Unknown Author';
    },

    truncate: (text, limit = 150) => {
        if (!text) return '';
        return text.length > limit ? text.substring(0, limit) + '...' : text;
    }
};

// ===== 5. API Service =====
const api = {
    fetchUsers: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/users`);
            if (!response.ok) throw new Error('Failed to fetch users');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    fetchNews: async () => {
        try {
            // Sort by ID descending to show newest first
            const response = await fetch(`${API_BASE_URL}/news?_sort=id&_order=desc`);
            if (!response.ok) throw new Error('Failed to fetch news');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    fetchNewsById: async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/news/${id}`);
            if (!response.ok) throw new Error('News not found');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return null;
        }
    },

    createNews: async (newsData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/news`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newsData)
            });
            if (!response.ok) throw new Error('Failed to create news');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    updateNews: async (id, newsData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/news/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newsData)
            });
            if (!response.ok) throw new Error('Failed to update news');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    deleteNews: async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/news/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete news');
            return true;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
};

// ===== 6. Render Functions =====

function renderUserDropdown() {
    elements.userSelect.innerHTML = '<option value="">-- Choose a user --</option>';
    state.users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = user.name;
        elements.userSelect.appendChild(option);
    });
}

function renderNewsList() {
    // 1. Filter
    let filteredNews = state.news;
    if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        filteredNews = filteredNews.filter(item =>
            item.title.toLowerCase().includes(query)
        );
    }

    // 2. Paginate
    const totalPages = Math.ceil(filteredNews.length / ITEMS_PER_PAGE);
    const startIndex = (state.currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedNews = filteredNews.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    // 3. Render HTML
    if (paginatedNews.length === 0) {
        elements.newsList.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                <h3>No articles found</h3>
                <p>Try a different search term or create a new article.</p>
            </div>
        `;
    } else {
        elements.newsList.innerHTML = paginatedNews.map(news => {
            const authorName = utils.getUserName(news.author_id);
            // Strict String comparison for safety
            const isAuthor = state.currentUser && String(state.currentUser.id) === String(news.author_id);
            const commentCount = news.comments ? news.comments.length : 0;

            return `
                <div class="news-card">
                    <div class="news-card-body">
                        <h3 class="news-title">${news.title}</h3>
                        <div class="news-meta">
                            <span class="author">👤 ${authorName}</span>
                            <span>💬 ${commentCount}</span>
                        </div>
                        <p class="news-preview">${utils.truncate(news.body)}</p>
                    </div>
                    <div class="news-card-footer">
                        <button class="btn btn-sm btn-outline btn-view" data-id="${news.id}">Read More</button>
                        ${isAuthor ? `
                            <div class="owner-actions">
                                <button class="btn btn-sm btn-icon btn-edit" data-id="${news.id}" title="Edit" style="border:none; background:none; cursor:pointer;">✏️</button>
                                <button class="btn btn-sm btn-icon btn-delete" data-id="${news.id}" title="Delete" style="border:none; background:none; cursor:pointer; color:var(--danger);">🗑️</button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    elements.pagination.innerHTML = '';

    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.className = `btn btn-sm ${state.currentPage === i ? 'btn-primary' : 'btn-outline'}`;
        btn.style.margin = '0 5px';

        btn.addEventListener('click', () => {
            state.currentPage = i;
            renderNewsList();
            window.scrollTo(0, 0);
        });

        elements.pagination.appendChild(btn);
    }
}

function renderNewsDetail(news) {
    const authorName = utils.getUserName(news.author_id);
    const isAuthor = state.currentUser && String(state.currentUser.id) === String(news.author_id);

    // Main Content
    elements.newsDetail.innerHTML = `
        <div class="detail-header">
            <h1>${news.title}</h1>
            <div class="detail-meta-row">
                <span>By <strong>${authorName}</strong></span>
                <span>${new Date().toLocaleDateString()}</span>
            </div>
            ${isAuthor ? `
                <div class="detail-actions-bar">
                    <button class="btn btn-secondary btn-edit" data-id="${news.id}">Edit Article</button>
                    <button class="btn btn-danger btn-delete" data-id="${news.id}">Delete Article</button>
                </div>
            ` : ''}
        </div>
        <div class="detail-content">
            <p>${news.body}</p>
        </div>
    `;

    // Comments
    renderComments(news.comments || []);

    // Re-attach listeners for the specific buttons in the detail view
    if (isAuthor) {
        const detailEditBtn = elements.newsDetail.querySelector('.btn-edit');
        if (detailEditBtn) detailEditBtn.addEventListener('click', () => handleEditClick(news.id));

        const detailDeleteBtn = elements.newsDetail.querySelector('.btn-delete');
        if (detailDeleteBtn) detailDeleteBtn.addEventListener('click', () => handleDeleteClick(news.id));
    }
}

function renderComments(comments) {
    elements.commentCount.textContent = comments.length;

    if (comments.length === 0) {
        elements.commentsList.innerHTML = `
            <div class="empty-state" style="text-align: center; color: #888; padding: 1rem;">
                <p>No comments yet. Be the first to start the discussion!</p>
            </div>
        `;
        return;
    }

    elements.commentsList.innerHTML = comments.map(comment => `
        <div class="comment-item">
            <div class="comment-header">
                <strong>${utils.getUserName(comment.user_id)}</strong>
                <span>${utils.formatDate(comment.timestamp)}</span>
            </div>
            <p>${comment.text}</p>
        </div>
    `).join('');
}

// ===== 7. Logic & Event Handlers =====

// --- Initialization ---
async function init() {
    utils.showLoading();
    try {
        // 1. Fetch Users
        state.users = await api.fetchUsers();

        // 2. Check Local Storage
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            state.currentUser = JSON.parse(savedUser);
            setupLoggedInState();
        } else {
            renderUserDropdown();
            utils.showPage('login-page');
        }
    } catch (error) {
        utils.showToast('Error connecting to server. Is JSON-Server running?', 'error');
    }
    utils.hideLoading();
}

async function setupLoggedInState() {
    if (elements.loggedUser) elements.loggedUser.textContent = state.currentUser.name;
    if (elements.loggedEmail) elements.loggedEmail.textContent = state.currentUser.email;

    try {
        state.news = await api.fetchNews();
        renderNewsList();
        utils.showPage('news-list-page');
    } catch (error) {
        utils.showToast('Failed to load news', 'error');
    }
}

// --- Login / Logout ---
elements.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userId = elements.userSelect.value;

    if (!userId) {
        utils.showToast('Please select a user', 'error');
        return;
    }

    // Find user (safely handling string vs number types)
    state.currentUser = state.users.find(u => String(u.id) === String(userId));

    if (state.currentUser) {
        localStorage.setItem('currentUser', JSON.stringify(state.currentUser));
        utils.showToast(`Welcome back, ${state.currentUser.name}!`);
        await setupLoggedInState();
    }
});

elements.logoutBtn.addEventListener('click', () => {
    state.currentUser = null;
    localStorage.removeItem('currentUser');
    renderUserDropdown();
    utils.showPage('login-page');
    utils.showToast('Logged out successfully');
});

// --- News List Delegation (View, Edit, Delete) ---
// Using delegation on the container prevents issues when HTML is re-rendered
elements.newsList.addEventListener('click', (e) => {
    // 1. View Button
    const viewBtn = e.target.closest('.btn-view');
    if (viewBtn) {
        const id = viewBtn.dataset.id;
        handleViewNews(id);
        return;
    }

    // 2. Edit Button
    const editBtn = e.target.closest('.btn-edit');
    if (editBtn) {
        const id = editBtn.dataset.id;
        handleEditClick(id);
        return;
    }

    // 3. Delete Button
    const deleteBtn = e.target.closest('.btn-delete');
    if (deleteBtn) {
        const id = deleteBtn.dataset.id;
        handleDeleteClick(id);
        return;
    }
});

// --- Handlers ---

async function handleViewNews(id) {
    utils.showLoading();
    const news = await api.fetchNewsById(id);
    utils.hideLoading();

    if (news) {
        state.currentNewsId = id; // Store current ID
        renderNewsDetail(news);
        utils.showPage('news-detail-page');
    } else {
        utils.showToast('Article not found', 'error');
    }
}

// --- Create News ---
elements.createNewsForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = elements.newsTitle.value.trim();
    const body = elements.newsBody.value.trim();

    // Validation
    let isValid = true;
    if (!title) {
        elements.titleError.textContent = 'Title is required';
        isValid = false;
    } else {
        elements.titleError.textContent = '';
    }

    if (body.length < 20) {
        elements.bodyError.textContent = 'Content must be at least 20 characters';
        isValid = false;
    } else {
        elements.bodyError.textContent = '';
    }

    if (!isValid) return;

    utils.showLoading();
    try {
        await api.createNews({
            title,
            body,
            author_id: state.currentUser.id,
            comments: []
        });

        // Reset form
        elements.createNewsForm.reset();
        elements.bodyCharCount.textContent = '0 / 20 characters min';

        utils.showToast('Article published successfully!');

        // Refresh list
        state.news = await api.fetchNews();
        renderNewsList();
        utils.showPage('news-list-page');
    } catch (error) {
        utils.showToast('Failed to publish article', 'error');
    }
    utils.hideLoading();
});

// --- Edit News ---
async function handleEditClick(id) {
    utils.showLoading();
    const news = await api.fetchNewsById(id);
    utils.hideLoading();

    if (!news) return;

    // Security check
    if (String(news.author_id) !== String(state.currentUser.id)) {
        utils.showToast('You are not authorized to edit this article', 'error');
        return;
    }

    // Populate Form
    elements.editNewsId.value = news.id;
    elements.editNewsTitle.value = news.title;
    elements.editNewsBody.value = news.body;
    elements.editBodyCharCount.textContent = `${news.body.length} / 20 characters min`;

    utils.showPage('edit-news-page');
}

elements.editNewsForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = elements.editNewsId.value;
    const title = elements.editNewsTitle.value.trim();
    const body = elements.editNewsBody.value.trim();

    // Validation
    if (body.length < 20) {
        elements.editBodyError.textContent = 'Content must be at least 20 characters';
        return;
    }

    utils.showLoading();
    try {
        await api.updateNews(id, { title, body });

        utils.showToast('Article updated successfully!');

        // Refresh data
        state.news = await api.fetchNews();
        renderNewsList();

        // Redirect based on where we came from (crudely)
        // If we were editing from detail view, reload detail view. 
        // If not, go to list.
        if (state.currentNewsId === id) {
            handleViewNews(id);
        } else {
            utils.showPage('news-list-page');
        }
    } catch (error) {
        utils.showToast('Failed to update article', 'error');
    }
    utils.hideLoading();
});

// --- Delete News ---
async function handleDeleteClick(id) {
    if (!confirm('Are you sure you want to delete this article? This action cannot be undone.')) {
        return;
    }

    utils.showLoading();
    try {
        await api.deleteNews(id);
        utils.showToast('Article deleted successfully');

        // Refresh data
        state.news = await api.fetchNews();
        state.currentNewsId = null;
        renderNewsList();
        utils.showPage('news-list-page');
    } catch (error) {
        utils.showToast('Failed to delete article', 'error');
    }
    utils.hideLoading();
}

// --- Comments ---
elements.commentForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const text = elements.commentText.value.trim();
    if (!text) {
        elements.commentError.textContent = 'Comment cannot be empty';
        return;
    }

    utils.showLoading();
    try {
        // 1. Get current article data to ensure we have latest comments
        const news = await api.fetchNewsById(state.currentNewsId);

        // 2. Add new comment
        const newComment = {
            id: Date.now(),
            user_id: state.currentUser.id,
            text: text,
            timestamp: new Date().toISOString()
        };

        const updatedComments = [...(news.comments || []), newComment];

        // 3. Update server
        await api.updateNews(state.currentNewsId, { comments: updatedComments });

        // 4. Update UI
        elements.commentText.value = '';
        renderComments(updatedComments);
        utils.showToast('Comment posted!');
    } catch (error) {
        utils.showToast('Failed to post comment', 'error');
    }
    utils.hideLoading();
});

// --- UI Interaction Listeners ---

// Character Counters
elements.newsBody.addEventListener('input', (e) => {
    elements.bodyCharCount.textContent = `${e.target.value.length} / 20 characters min`;
});
elements.editNewsBody.addEventListener('input', (e) => {
    elements.editBodyCharCount.textContent = `${e.target.value.length} / 20 characters min`;
});

// Search
elements.searchBtn.addEventListener('click', () => {
    state.searchQuery = elements.searchInput.value;
    state.currentPage = 1;
    renderNewsList();
});
elements.searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        state.searchQuery = elements.searchInput.value;
        state.currentPage = 1;
        renderNewsList();
    }
});

// Navigation Buttons
elements.backToList.addEventListener('click', () => utils.showPage('news-list-page'));
elements.cancelCreate.addEventListener('click', () => utils.showPage('news-list-page'));
elements.cancelEdit.addEventListener('click', () => utils.showPage('news-list-page'));

elements.navHome.addEventListener('click', () => {
    state.searchQuery = '';
    elements.searchInput.value = '';
    state.currentPage = 1;
    renderNewsList();
    utils.showPage('news-list-page');
});

elements.navCreate.addEventListener('click', () => {
    elements.createNewsForm.reset();
    elements.bodyCharCount.textContent = '0 / 20 characters min';
    elements.titleError.textContent = '';
    elements.bodyError.textContent = '';
    utils.showPage('create-news-page');
});

// ===== 8. Start Application =====
document.addEventListener('DOMContentLoaded', init);