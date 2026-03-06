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

// --- Data Normalization (FIX FOR ACCURATE FETCHING) ---
function normalizeIssue(issue) {
    return {
        id: issue.id || issue._id || 'N/A',
        title: issue.title || 'No Title Provided',
        description: issue.description || 'No description available for this issue.',
        status: (issue.status || 'open').toLowerCase(),
        priority: (issue.priority || issue.priority_level || 'Medium').toLowerCase(),
        category: issue.category || 'General',
        label: issue.label || 'Issue',
        author: issue.author || 'Anonymous',
        createdAt: issue.createdAt || new Date()
    };
}

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
    } else { alert("Login failed! Hint: admin / admin123"); }
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
        issuesContainer.innerHTML = `<div class="col-span-full text-center py-20 font-black text-error">API ERROR: Server Unreachable</div>`;
    } finally {
        setLoading(false);
    }
}

// --- Figma Card Logic ---
function displayCards(issues) {
    issuesContainer.innerHTML = '';
    dynamicCount.innerText = issues.length;
    dynamicText.innerText = issues.length === 1 ? 'Issue' : 'Issues';

    issues.forEach(rawIssue => {
        const issue = normalizeIssue(rawIssue);
        const isClosed = issue.status === 'closed';
        const borderClass = isClosed ? 'border-purple-500' : 'border-green-500';
        
        // Priority color mapping
        let priorityColor = 'text-yellow-500';
        if(issue.priority === 'high') priorityColor = 'text-red-500';
        if(issue.priority === 'low') priorityColor = 'text-emerald-500';
        
        const card = document.createElement('div');
        card.className = `card-github bg-white border border-base-300 border-t-4 ${borderClass} shadow-sm cursor-pointer flex flex-col`;
        card.innerHTML = `
            <div class="p-8 flex flex-col h-full" onclick="openIssueDetail('${issue.id}')">
                <div class="flex justify-between items-start mb-4">
                    <span class="text-[10px] font-black uppercase opacity-40 tracking-widest">${issue.category}</span>
                    <span class="text-[10px] font-black uppercase ${priorityColor}">
                        <i class="fa-solid fa-bolt mr-1"></i>${issue.priority}
                    </span>
                </div>

                <h2 class="text-base font-black leading-tight mb-3 line-clamp-2">${issue.title}</h2>
                <p class="text-[11px] text-gray-500 font-medium line-clamp-3 mb-6 flex-grow">${issue.description}</p>
                
                <div class="flex gap-2 mb-2">
                    <span class="px-3 py-1 bg-primary/5 text-primary border border-primary/20 text-[10px] font-black rounded-lg uppercase">${issue.label}</span>
                </div>

                <div class="dashed-line"></div>

                <div class="flex items-center justify-between mt-auto">
                    <div class="flex items-center gap-2">
                        <div class="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-[10px] font-black text-white">
                            ${issue.author.charAt(0).toUpperCase()}
                        </div>
                        <span class="text-[11px] font-black opacity-80 uppercase tracking-tighter">${issue.author}</span>
                    </div>
                    <span class="text-[10px] font-bold opacity-30 italic">${new Date(issue.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
        `;
        issuesContainer.appendChild(card);
    });
}

// --- Figma Modal Logic ---
async function openIssueDetail(id) {
    try {
        const res = await fetch(`https://phi-lab-server.vercel.app/api/v1/lab/issue/${id}`);
        const resData = await res.json();
        const issue = normalizeIssue(resData.data || resData);
        const isClosed = issue.status === 'closed';

        document.getElementById('modal-content').innerHTML = `
            <div class="flex flex-col md:flex-row min-h-[450px]">
                <div class="flex-[1.5] p-10 bg-white">
                    <div class="mb-8">
                        <span class="text-primary font-black text-[10px] uppercase tracking-[0.3em] mb-2 block">${issue.category}</span>
                        <h3 class="font-black text-4xl leading-tight">${issue.title}</h3>
                    </div>

                    <div class="p-8 bg-gray-50 rounded-[2rem] border border-gray-100 mb-8">
                        <p class="text-sm font-medium leading-relaxed opacity-70 italic">"${issue.description}"</p>
                    </div>

                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center font-black">
                             ${issue.author.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p class="text-sm font-black uppercase">${issue.author}</p>
                            <p class="text-[10px] font-bold opacity-40 uppercase tracking-widest">Issue Reported by User</p>
                        </div>
                    </div>
                </div>

                <div class="flex-1 p-10 bg-[#f8fafc] border-l border-base-300 space-y-6">
                    <div>
                        <p class="text-[10px] font-black opacity-40 uppercase tracking-widest mb-3">Status</p>
                        <div class="flex items-center gap-3 bg-white p-4 rounded-2xl border border-base-300">
                            <span class="w-3 h-3 rounded-full ${isClosed ? 'bg-purple-500 pulse-purple' : 'bg-green-500 pulse-green'}"></span>
                            <span class="font-black text-sm uppercase">${issue.status}</span>
                        </div>
                    </div>

                    <div>
                        <p class="text-[10px] font-black opacity-40 uppercase tracking-widest mb-3">Priority</p>
                        <div class="bg-white p-4 rounded-2xl border border-base-300">
                            <span class="font-black text-sm uppercase ${issue.priority === 'high' ? 'text-red-500' : 'text-yellow-500'}">
                                <i class="fa-solid fa-triangle-exclamation mr-2"></i>${issue.priority}
                            </span>
                        </div>
                    </div>

                    <div>
                        <p class="text-[10px] font-black opacity-40 uppercase tracking-widest mb-3">Category Tag</p>
                        <span class="badge badge-primary font-black uppercase p-3">${issue.label}</span>
                    </div>

                    <div class="pt-4 opacity-30">
                        <p class="text-[10px] font-black uppercase">Ref ID: ${issue.id}</p>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('issue_modal').showModal();
    } catch (err) { console.error(err); }
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
function displayCards(issues) {
    issuesContainer.innerHTML = '';
    dynamicCount.innerText = issues.length;
    dynamicText.innerText = issues.length === 1 ? 'Issue' : 'Issues';

    issues.forEach(rawIssue => {
        const issue = normalizeIssue(rawIssue);
        const isClosed = issue.status === 'closed';
        
        // Dynamic Classes
        const borderClass = isClosed ? 'border-purple-500' : 'border-green-500';
        const pulseClass = isClosed ? 'pulse-purple' : 'pulse-green';
        
        let priorityColor = 'text-yellow-500';
        if(issue.priority === 'high') priorityColor = 'text-red-500';
        if(issue.priority === 'low') priorityColor = 'text-emerald-500';
        
        const card = document.createElement('div');
        card.className = `card-github bg-white border border-base-300 border-t-4 ${borderClass} shadow-sm cursor-pointer flex flex-col`;
        
        card.innerHTML = `
            <div class="status-pulse ${pulseClass}"></div>
            
            <div class="p-8 flex flex-col h-full" onclick="openIssueDetail('${issue.id}')">
                <div class="flex justify-between items-start mb-4">
                    <span class="text-[10px] font-black uppercase opacity-40 tracking-widest ml-4">${issue.category}</span>
                    <span class="text-[10px] font-black uppercase ${priorityColor}">
                        <i class="fa-solid fa-bolt mr-1"></i>${issue.priority}
                    </span>
                </div>

                <h2 class="text-base font-black leading-tight mb-3 line-clamp-2">${issue.title}</h2>
                <p class="text-[11px] text-gray-500 font-medium line-clamp-3 mb-6 flex-grow">${issue.description}</p>
                
                <div class="flex gap-2 mb-2">
                    <span class="px-3 py-1 bg-primary/5 text-primary border border-primary/20 text-[10px] font-black rounded-lg uppercase">${issue.label}</span>
                </div>

                <div class="dashed-line"></div>

                <div class="flex items-center justify-between mt-auto">
                    <div class="flex items-center gap-2">
                        <div class="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-[10px] font-black text-white">
                            ${issue.author.charAt(0).toUpperCase()}
                        </div>
                        <span class="text-[11px] font-black opacity-80 uppercase tracking-tighter">${issue.author}</span>
                    </div>
                    <span class="text-[10px] font-bold opacity-30 italic">${new Date(issue.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
        `;
        issuesContainer.appendChild(card);
    });
}

initDashboard();