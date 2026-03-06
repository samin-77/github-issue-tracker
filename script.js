const loginPage = document.getElementById('login-page');
const mainPage = document.getElementById('main-page');
const loginForm = document.getElementById('login-form');
const issuesContainer = document.getElementById('issues-container');
const loader = document.getElementById('loader');

let allIssues = [];

// --- Authentication ---
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;

    if (user === 'admin' && pass === 'admin123') {
        localStorage.setItem('loggedIn', 'true');
        checkAuth();
    } else {
        alert("Invalid credentials! Use admin / admin123");
    }
});

function checkAuth() {
    if (localStorage.getItem('loggedIn') === 'true') {
        loginPage.classList.add('hidden');
        mainPage.classList.remove('hidden');
        loadIssues();
    }
}

function logout() {
    localStorage.removeItem('loggedIn');
    location.reload();
}

// --- Data Fetching ---
async function loadIssues() {
    showLoader(true);
    try {
        const res = await fetch('https://phi-lab-server.vercel.app/api/v1/lab/issues');
        if (!res.ok) throw new Error("Network response was not ok");
        
        const rawData = await res.json();
        console.log("API Raw Data:", rawData); // Debugging: Check console to see structure

        // Normalize data: Some APIs wrap arrays in a "data" property
        allIssues = Array.isArray(rawData) ? rawData : (rawData.data || []);
        
        updateCounts(allIssues);
        displayIssues(allIssues);
    } catch (err) {
        console.error("Failed to fetch issues:", err);
        issuesContainer.innerHTML = `<p class="col-span-full text-center text-red-500">Error loading data. Please try again later.</p>`;
    } finally {
        showLoader(false);
    }
}

// --- UI Functions ---
function displayIssues(issues) {
    issuesContainer.innerHTML = '';
    
    if (!issues || issues.length === 0) {
        issuesContainer.innerHTML = '<p class="col-span-full text-center py-10 text-gray-400">No issues found.</p>';
        return;
    }

    issues.forEach(issue => {
        // Ensure status exists before calling toLowerCase
        const status = (issue.status || 'open').toLowerCase();
        const borderColor = status === 'closed' ? 'border-purple-500' : 'border-green-500';
        
        const card = document.createElement('div');
        card.className = `card bg-white shadow-sm border border-gray-200 border-t-4 ${borderColor} hover:shadow-md transition-shadow cursor-pointer`;
        card.innerHTML = `
            <div class="card-body p-5" onclick="showDetails('${issue.id || issue._id}')">
                <h2 class="card-title text-sm font-bold line-clamp-1">${issue.title || 'No Title'}</h2>
                <p class="text-xs text-gray-500 line-clamp-2 mb-4">${issue.description || 'No description provided.'}</p>
                
                <div class="flex flex-wrap gap-2 mb-4">
                    <div class="badge badge-ghost text-[10px] p-2">${issue.category || 'General'}</div>
                    <div class="badge badge-outline text-[10px] p-2">${issue.label || 'Issue'}</div>
                </div>

                <div class="border-t pt-3 mt-auto">
                    <div class="flex justify-between items-center text-[10px] text-gray-400">
                        <span class="font-medium text-gray-600"><i class="fa-regular fa-user mr-1"></i>${issue.author || 'Anonymous'}</span>
                        <span>${issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : 'Recent'}</span>
                    </div>
                </div>
            </div>
        `;
        issuesContainer.appendChild(card);
    });
}

// --- Filtering & Search ---
function filterIssues(status) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('tab-active'));
    document.getElementById(`tab-${status}`).classList.add('tab-active');

    if (status === 'all') {
        displayIssues(allIssues);
    } else {
        const filtered = allIssues.filter(i => (i.status || '').toLowerCase() === status);
        displayIssues(filtered);
    }
}

document.getElementById('search-btn').addEventListener('click', async () => {
    const query = document.getElementById('search-input').value;
    if (!query) return loadIssues();

    showLoader(true);
    try {
        const res = await fetch(`https://phi-lab-server.vercel.app/api/v1/lab/issues/search?q=${query}`);
        const rawData = await res.json();
        const searchResults = Array.isArray(rawData) ? rawData : (rawData.data || []);
        displayIssues(searchResults);
    } catch (err) {
        console.error("Search failed", err);
    } finally {
        showLoader(false);
    }
});

// --- Modal Logic ---
async function showDetails(id) {
    try {
        const res = await fetch(`https://phi-lab-server.vercel.app/api/v1/lab/issue/${id}`);
        const rawData = await res.json();
        const issue = rawData.data || rawData; // Handle potential wrapping
        
        const content = document.getElementById('modal-content');
        content.innerHTML = `
            <h3 class="font-bold text-xl mb-2">${issue.title || 'Untitled'}</h3>
            <div class="flex gap-2 mb-4">
                <span class="badge ${(issue.status || '').toLowerCase() === 'open' ? 'badge-success' : 'badge-secondary'}">${issue.status || 'Open'}</span>
                <span class="text-gray-400 text-sm">#${issue.id || 'N/A'} opened by ${issue.author || 'Unknown'}</span>
            </div>
            <hr class="my-4"/>
            <p class="text-gray-700 leading-relaxed mb-6">${issue.description || 'No description available.'}</p>
            <div class="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-lg">
                <div><span class="font-bold">Priority:</span> ${issue.priority || 'Normal'}</div>
                <div><span class="font-bold">Category:</span> ${issue.category || 'Uncategorized'}</div>
                <div><span class="font-bold">Label:</span> ${issue.label || 'None'}</div>
                <div><span class="font-bold">Created:</span> ${issue.createdAt ? new Date(issue.createdAt).toLocaleString() : 'N/A'}</div>
            </div>
        `;
        document.getElementById('issue_modal').showModal();
    } catch (err) {
        alert("Could not load issue details.");
    }
}

function showLoader(isLoading) {
    loader.classList.toggle('hidden', !isLoading);
    issuesContainer.classList.toggle('hidden', isLoading);
}

function updateCounts(issues) {
    const open = issues.filter(i => (i.status || '').toLowerCase() === 'open').length;
    const closed = issues.filter(i => (i.status || '').toLowerCase() === 'closed').length;
    document.getElementById('open-count').innerText = open;
    document.getElementById('closed-count').innerText = closed;
}

checkAuth();