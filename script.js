const loginPage = document.getElementById('login-page');
const mainPage = document.getElementById('main-page');
const loginForm = document.getElementById('login-form');
const issuesContainer = document.getElementById('issues-container');
const loader = document.getElementById('loader');
const dynamicCount = document.getElementById('dynamic-count');
const dynamicText = document.getElementById('dynamic-text');
const viewTitle = document.getElementById('view-title');
let allIssuesData = [];
function normalizeIssue(issue) {
    let labels = [];
    if (Array.isArray(issue?.labels)) {
        labels = issue.labels;
    } else if (issue?.label) {
        labels = [issue.label];
    }
    return {
        id: String(issue?.id || issue?._id || '0000'),
        title: issue?.title || 'Untitled Issue',
        description: issue?.description || 'No description available.',
        status: String(issue?.status || 'open').toLowerCase(),
        priority: String(issue?.priority || issue?.priority_level || 'Medium').toLowerCase(),
        category: issue?.category || 'General',
        labels: labels,
        author: issue?.author || 'Anonymous',
        createdAt: issue?.createdAt || new Date()
    };
}
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
async function loadAllIssues() {
    setLoading(true);
    try {
        const res = await fetch('https://phi-lab-server.vercel.app/api/v1/lab/issues');
        if (!res.ok) throw new Error('Network response was not ok');
        
        const data = await res.json();
        allIssuesData = Array.isArray(data) ? data : (data.data || []);
        
        updateGlobalStats();
        filterIssues('all');
    } catch (err) {
        console.error("DEBUG INFO:", err);
        issuesContainer.innerHTML = `<div class="col-span-full text-center py-20 font-black text-error">
            API ERROR: ${err.message}<br>
            <span class="text-xs opacity-50">Check browser console for details</span>
        </div>`;
    } finally {
        setLoading(false);
    }
}
function displayCards(issues) {
    issuesContainer.innerHTML = '';
    const list = Array.isArray(issues) ? issues : [];
    if (dynamicCount) dynamicCount.innerText = list.length;
    if (dynamicText) dynamicText.innerText = list.length === 1 ? 'Issue' : 'Issues';

    list.forEach(rawIssue => {
        const issue = normalizeIssue(rawIssue);
        const isClosed = issue.status === 'closed';
        const borderClass = isClosed ? 'border-purple-500' : 'border-green-500';
        
        const labelsHtml = issue.labels.map(label => {
            const l = String(label).toLowerCase();
            let style = "bg-blue-50 text-blue-600 border-blue-100";
            let icon = '<i class="fa-solid fa-tag mr-1"></i>';

            if (l.includes('bug')) {
                style = "bg-red-50 text-red-500 border-red-100";
                icon = '<i class="fa-solid fa-robot mr-1"></i>';
            } else if (l.includes('help')) {
                style = "bg-orange-50 text-orange-500 border-orange-200";
                icon = '<i class="fa-solid fa-life-ring mr-1"></i>';
            }
            return `<span class="px-2 py-0.5 ${style} border text-[10px] font-black rounded-full uppercase flex items-center">${icon}${label}</span>`;
        }).join('');

        const card = document.createElement('div');
        card.className = `card-github bg-white border border-base-300 border-t-4 ${borderClass} shadow-sm cursor-pointer flex flex-col`;
        card.innerHTML = `
            <div class="p-6 flex flex-col h-full" onclick="openIssueDetail('${issue.id}')">
                <div class="flex justify-between items-start mb-4">
                    <div class="w-6 h-6 rounded-full border-2 border-green-100 flex items-center justify-center">
                        <div class="w-2 h-2 bg-green-400 rounded-full"></div>
                    </div>
                    <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase border bg-yellow-50 text-yellow-600 border-yellow-100">
                        ${issue.priority}
                    </span>
                </div>
                <h2 class="text-base font-black leading-tight mb-2 text-black line-clamp-2">${issue.title}</h2>
                <p class="text-[11px] text-gray-400 font-medium line-clamp-2 mb-4">${issue.description}</p>
                <div class="flex flex-wrap gap-2 mb-6">${labelsHtml}</div>
                <div class="mt-auto pt-4 border-t border-gray-50">
                    <p class="text-[11px] font-bold text-gray-400">#${issue.id.slice(-4)} by ${issue.author}</p>
                    <p class="text-[11px] font-bold text-gray-400">${new Date(issue.createdAt).toLocaleDateString()}</p>
                </div>
            </div>`;
        issuesContainer.appendChild(card);
    });
}
function filterIssues(type) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('tab-active'));
    const activeTab = document.getElementById(`tab-${type}`);
    if (activeTab) activeTab.classList.add('tab-active');
    
    if (viewTitle) viewTitle.innerText = type === 'all' ? 'All Issues' : `${type.charAt(0).toUpperCase() + type.slice(1)} Issues`;

    if (type === 'all') {
        displayCards(allIssuesData);
    } else {
        const filtered = allIssuesData.filter(i => String(i.status || '').toLowerCase() === type);
        displayCards(filtered);
    }
}

function setLoading(state) {
    if (loader) loader.classList.toggle('hidden', !state);
    if (issuesContainer) issuesContainer.classList.toggle('hidden', state);
}

function updateGlobalStats() {
    const o = allIssuesData.filter(i => String(i.status || '').toLowerCase() === 'open').length;
    const c = allIssuesData.filter(i => String(i.status || '').toLowerCase() === 'closed').length;
    if (document.getElementById('open-count')) document.getElementById('open-count').innerText = o;
    if (document.getElementById('closed-count')) document.getElementById('closed-count').innerText = c;
}
async function openIssueDetail(id) {
    try {
        const res = await fetch(`https://phi-lab-server.vercel.app/api/v1/lab/issue/${id}`);
        const resData = await res.json();
        const issue = normalizeIssue(resData.data || resData);
        const isClosed = issue.status === 'closed';

        const modalLabelsHtml = issue.labels.map(label => {
            return `<span class="badge badge-primary font-black uppercase p-3 h-auto text-[10px]">${label}</span>`;
        }).join('');

        document.getElementById('modal-content').innerHTML = `
            <div class="flex flex-col md:flex-row min-h-[450px]">
                <div class="flex-[1.5] p-10 bg-white">
                    <div class="mb-8">
                        <span class="text-primary font-black text-[10px] uppercase tracking-[0.3em] mb-2 block">${issue.category}</span>
                        <h3 class="font-black text-4xl leading-tight text-black">${issue.title}</h3>
                    </div>

                    <div class="p-8 bg-gray-50 rounded-[2rem] border border-gray-100 mb-8">
                        <p class="text-sm font-medium leading-relaxed opacity-70 italic text-black">"${issue.description}"</p>
                    </div>

                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center font-black">
                             ${issue.author.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p class="text-sm font-black uppercase text-black">${issue.author}</p>
                            <p class="text-[10px] font-bold opacity-40 uppercase tracking-widest text-black">Issue Reported by User</p>
                        </div>
                    </div>
                </div>

                <div class="flex-1 p-10 bg-[#f8fafc] border-l border-base-300 space-y-6">
                    <div>
                        <p class="text-[10px] font-black opacity-40 uppercase tracking-widest mb-3 text-black">Status</p>
                        <div class="flex items-center gap-3 bg-white p-4 rounded-2xl border border-base-300">
                            <span class="w-3 h-3 rounded-full ${isClosed ? 'bg-purple-500 pulse-purple' : 'bg-green-500 pulse-green'}"></span>
                            <span class="font-black text-sm uppercase text-black">${issue.status}</span>
                        </div>
                    </div>

                    <div>
                        <p class="text-[10px] font-black opacity-40 uppercase tracking-widest mb-3 text-black">Priority</p>
                        <div class="bg-white p-4 rounded-2xl border border-base-300">
                            <span class="font-black text-sm uppercase ${issue.priority === 'high' ? 'text-red-500' : 'text-yellow-500'}">
                                <i class="fa-solid fa-triangle-exclamation mr-2"></i>${issue.priority}
                            </span>
                        </div>
                    </div>

                    <div>
                        <p class="text-[10px] font-black opacity-40 uppercase tracking-widest mb-3 text-black">Category Tags</p>
                        <div class="flex flex-wrap gap-2">
                            ${modalLabelsHtml || '<span class="text-[10px] opacity-30">No labels</span>'}
                        </div>
                    </div>

                    <div class="pt-4 opacity-30">
                        <p class="text-[10px] font-black uppercase text-black">Ref ID: ${issue.id}</p>
                    </div>
                </div>
            </div>
        `;
        const modal = document.getElementById('issue_modal');
        if (modal) {
            modal.showModal();
        }
    } catch (err) { 
        console.error("Modal Error:", err); 
    }
}
initDashboard();