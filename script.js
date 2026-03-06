const loginPage = document.getElementById('login-page');
const mainPage = document.getElementById('main-page');
const loginForm = document.getElementById('login-form');
const issuesContainer = document.getElementById('issues-container');
const loader = document.getElementById('loader');
const dynamicCount = document.getElementById('dynamic-count');
const dynamicText = document.getElementById('dynamic-text');
const viewTitle = document.getElementById('view-title');
const themeToggle = document.getElementById('theme-toggle');

let allIssuesData = [];

// --- Theme Logic ---
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
themeToggle.checked = savedTheme === 'dark';

themeToggle.addEventListener('change', (e) => {
    const theme = e.target.checked ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
});

// --- Auth ---
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (document.getElementById('username').value === 'admin' && 
        document.getElementById('password').value === 'admin123') {
        localStorage.setItem('user_auth', 'active');
        initDashboard();
    } else { alert("Login failed!"); }
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
        allIssuesData = Array.isArray(data) ? data : (data.data || []);
        updateGlobalStats();
        filterIssues('all');
    } catch (err) {
        issuesContainer.innerHTML = `<div class="col-span-full text-center text-error font-bold">API Connection Error</div>`;
    } finally {
        setLoading(false);
    }
}

// --- Card Display (Updated to match Figma Card Style) ---
function displayCards(issues) {
    issuesContainer.innerHTML = '';
    dynamicCount.innerText = issues.length;
    // Grammar check for the "Issues" text
    dynamicText.innerText = issues.length === 1 ? 'Issue' : 'Issues';

    issues.forEach(issue => {
        const status = (issue.status || 'open').toLowerCase();
        const borderClass = status === 'closed' ? 'border-purple-500' : 'border-green-500';
        
        const card = document.createElement('div');
        card.className = `card-github bg-base-100 shadow-sm border border-base-300 border-t-4 ${borderClass} rounded-2xl overflow-hidden cursor-pointer`;
        card.innerHTML = `
            <div class="p-6 flex flex-col h-full" onclick="openIssueDetail('${issue.id}')">
                <div class="mb-3">
                    <h2 class="text-sm font-black leading-tight hover:text-primary line-clamp-2">${issue.title}</h2>
                </div>
                <p class="text-[11px] text-gray-500 font-medium line-clamp-3 mb-4 flex-grow">${issue.description}</p>
                
                <div class="flex flex-wrap gap-2 mb-5">
                    <span class="px-2 py-1 bg-base-200 text-[10px] font-bold rounded-md border border-base-300 uppercase">${issue.category}</span>
                    <span class="px-2 py-1 border border-primary/30 text-primary text-[10px] font-bold rounded-md uppercase">${issue.label}</span>
                </div>

                <div class="flex items-center justify-between pt-4 border-t border-dashed border-base-300 mt-auto">
                    <div class="flex items-center gap-2">
                        <div class="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                            ${issue.author.charAt(0)}
                        </div>
                        <span class="text-[10px] font-black opacity-70 uppercase tracking-tight">${issue.author}</span>
                    </div>
                    <span class="text-[9px] font-bold opacity-40 italic">${new Date(issue.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
        `;
        issuesContainer.appendChild(card);
    });
}

function filterIssues(type) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('tab-active'));
    document.getElementById(`tab-${type}`).classList.add('tab-active');
    viewTitle.innerText = type === 'all' ? 'All Issues' : `${type.charAt(0).toUpperCase() + type.slice(1)} Issues`;

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
        displayCards(Array.isArray(data) ? data : (data.data || []));
        viewTitle.innerText = `Search: ${q}`;
    } catch (err) { console.error(err); } finally { setLoading(false); }
});

async function openIssueDetail(id) {
    const res = await fetch(`https://phi-lab-server.vercel.app/api/v1/lab/issue/${id}`);
    const resData = await res.json();
    const issue = resData.data || resData;

    document.getElementById('modal-content').innerHTML = `
        <div class="mb-6">
            <span class="text-primary font-black text-xs uppercase tracking-widest">${issue.category}</span>
            <h3 class="font-black text-3xl mt-1 leading-tight">${issue.title}</h3>
        </div>
        <div class="flex items-center gap-3 mb-6 p-4 bg-base-200 rounded-2xl border border-base-300">
            <span class="badge ${issue.status === 'open' ? 'badge-success' : 'badge-secondary'} font-bold p-3">
                ${issue.status.toUpperCase()}
            </span>
            <span class="text-xs font-bold opacity-60 uppercase">Issue #${issue.id} • ${issue.author}</span>
        </div>
        <div class="bg-base-100 p-6 rounded-2xl border border-base-300 mb-6">
            <p class="text-sm opacity-80 leading-relaxed">${issue.description}</p>
        </div>
        <div class="grid grid-cols-2 gap-4">
            <div class="p-4 bg-base-200 rounded-xl border border-base-300">
                <p class="text-[10px] font-black opacity-40 uppercase">Priority</p>
                <p class="text-sm font-bold text-primary">${issue.priority}</p>
            </div>
            <div class="p-4 bg-base-200 rounded-xl border border-base-300">
                <p class="text-[10px] font-black opacity-40 uppercase">Label</p>
                <p class="text-sm font-bold">${issue.label}</p>
            </div>
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