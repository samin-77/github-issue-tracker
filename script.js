const loginPage = document.getElementById('login-page');
const mainPage = document.getElementById('main-page');
const loginForm = document.getElementById('login-form');
const issuesContainer = document.getElementById('issues-container');
const loader = document.getElementById('loader');
const dynamicCount = document.getElementById('dynamic-count');
const viewTitle = document.getElementById('view-title');
const themeToggle = document.getElementById('theme-toggle');

let allIssuesData = [];

// --- Dark Mode Persistence ---
const currentTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', currentTheme);
themeToggle.checked = currentTheme === 'dark';

themeToggle.addEventListener('change', (e) => {
    const theme = e.target.checked ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
});

// --- Auth Handling ---
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (document.getElementById('username').value === 'admin' && 
        document.getElementById('password').value === 'admin123') {
        localStorage.setItem('user_auth', 'active');
        initDashboard();
    } else { alert("Invalid login. Hint: admin / admin123"); }
});

function initDashboard() {
    if (localStorage.getItem('user_auth') === 'active') {
        loginPage.classList.add('hidden');
        mainPage.classList.remove('hidden');
        loadAllIssues();
    }
}

function logout() {
    localStorage.removeItem('user_auth');
    location.reload();
}

// --- Fetching ---
async function loadAllIssues() {
    setLoading(true);
    try {
        const res = await fetch('https://phi-lab-server.vercel.app/api/v1/lab/issues');
        const data = await res.json();
        // Normalize for API structure
        allIssuesData = Array.isArray(data) ? data : (data.data || []);
        
        updateGlobalStats();
        filterIssues('all'); // Set default view
    } catch (err) {
        issuesContainer.innerHTML = `<div class="col-span-full alert alert-error">Failed to load data from server.</div>`;
    } finally {
        setLoading(false);
    }
}

// --- UI Logic ---
function displayCards(issues) {
    issuesContainer.innerHTML = '';
    dynamicCount.innerText = issues.length; // Dynamic update for selected tab

    issues.forEach(issue => {
        const status = (issue.status || 'open').toLowerCase();
        const borderClass = status === 'closed' ? 'border-purple-500' : 'border-green-500';
        
        const card = document.createElement('div');
        card.className = `card bg-base-100 shadow-sm border border-base-300 border-t-4 ${borderClass} hover:shadow-xl transition-all duration-300 cursor-pointer group`;
        card.innerHTML = `
            <div class="card-body p-6" onclick="openIssueDetail('${issue.id}')">
                <div class="flex justify-between items-start">
                    <h2 class="card-title text-sm font-extrabold group-hover:text-primary transition-colors">${issue.title}</h2>
                </div>
                <p class="text-[11px] opacity-60 line-clamp-2 my-3">${issue.description}</p>
                
                <div class="flex flex-wrap gap-2 mb-4">
                    <span class="badge badge-xs badge-ghost py-2">${issue.category}</span>
                    <span class="badge badge-xs badge-outline py-2 opacity-50">${issue.label}</span>
                </div>

                <div class="border-t border-base-200 pt-3 mt-auto flex justify-between items-center text-[10px] font-bold opacity-50 uppercase tracking-tighter">
                    <span><i class="fa-solid fa-user-ninja mr-1"></i>${issue.author}</span>
                    <span>${new Date(issue.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
        `;
        issuesContainer.appendChild(card);
    });
}

function filterIssues(type) {
    // UI Tab Update
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('tab-active'));
    document.getElementById(`tab-${type}`).classList.add('tab-active');

    // Title Update
    viewTitle.innerText = type === 'all' ? 'All Issues' : `${type.charAt(0).toUpperCase() + type.slice(1)} Issues`;

    // Data Filter
    if (type === 'all') {
        displayCards(allIssuesData);
    } else {
        const filtered = allIssuesData.filter(i => (i.status || '').toLowerCase() === type);
        displayCards(filtered);
    }
}

document.getElementById('search-btn').addEventListener('click', async () => {
    const q = document.getElementById('search-input').value;
    if (!q) return loadAllIssues();

    setLoading(true);
    try {
        const res = await fetch(`https://phi-lab-server.vercel.app/api/v1/lab/issues/search?q=${q}`);
        const data = await res.json();
        const results = Array.isArray(data) ? data : (data.data || []);
        displayCards(results);
        viewTitle.innerText = `Search Results: ${q}`;
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
});

async function openIssueDetail(id) {
    const res = await fetch(`https://phi-lab-server.vercel.app/api/v1/lab/issue/${id}`);
    const resData = await res.json();
    const issue = resData.data || resData;

    const modalBody = document.getElementById('modal-content');
    modalBody.innerHTML = `
        <div class="badge badge-primary badge-sm mb-2">${issue.category}</div>
        <h3 class="font-black text-2xl mb-4 leading-tight">${issue.title}</h3>
        <div class="flex items-center gap-3 mb-6 p-3 bg-base-200 rounded-lg">
            <span class="badge ${issue.status === 'open' ? 'badge-success' : 'badge-secondary'} font-bold">${issue.status}</span>
            <span class="text-xs opacity-50 font-bold">#${issue.id} • Opened by ${issue.author}</span>
        </div>
        <p class="text-sm opacity-80 leading-relaxed mb-8 border-l-4 border-base-300 pl-4 italic">${issue.description}</p>
        
        <div class="grid grid-cols-2 gap-4 text-[10px] font-bold uppercase opacity-60">
            <div class="p-3 bg-base-200 rounded-lg"><p>Priority</p><p class="text-base text-base-content">${issue.priority}</p></div>
            <div class="p-3 bg-base-200 rounded-lg"><p>Labels</p><p class="text-base text-base-content">${issue.label}</p></div>
        </div>
    `;
    document.getElementById('issue_modal').showModal();
}

function setLoading(state) {
    loader.classList.toggle('hidden', !state);
    issuesContainer.classList.toggle('hidden', state);
}

function updateGlobalStats() {
    const o = allIssuesData.filter(i => (i.status || '').toLowerCase() === 'open').length;
    const c = allIssuesData.filter(i => (i.status || '').toLowerCase() === 'closed').length;
    document.getElementById('open-count').innerText = o;
    document.getElementById('closed-count').innerText = c;
}

initDashboard();