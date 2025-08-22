let isAuthenticated = false;
let currentUser = null;

async function checkAuth() {
    try {
        const response = await fetch('/api/check-auth');
        const data = await response.json();
        isAuthenticated = data.authenticated;
        
        if (isAuthenticated) {
            showDashboard();
        } else {
            showLogin();
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        showLogin();
    }
}

function showLogin() {
    document.getElementById('loginSection').classList.remove('hidden');
    document.getElementById('dashboardSection').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('dashboardSection').classList.remove('hidden');
    loadPreviews();
    loadStatus();
    
    // Handle hash navigation
    handleHash();
}

function handleHash() {
    const hash = window.location.hash.substring(1);
    if (hash) {
        // Find the tab button with matching data-tab
        const tabBtn = document.querySelector(`[data-tab="${hash}"]`);
        if (tabBtn) {
            tabBtn.click(); // This will trigger the existing tab switching logic
        }
    }
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            errorDiv.textContent = '';
            showDashboard();
        } else {
            const data = await response.json();
            errorDiv.textContent = data.error || 'Login failed';
        }
    } catch (error) {
        errorDiv.textContent = 'Network error. Please try again.';
    }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await fetch('/api/logout', { method: 'POST' });
        showLogin();
    } catch (error) {
        console.error('Logout failed:', error);
    }
});

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        
        document.getElementById(tabName + 'Tab').classList.remove('hidden');
        
        if (tabName === 'previews') {
            loadPreviews();
        } else if (tabName === 'status') {
            loadStatus();
        } else if (tabName === 'users') {
            loadUsers();
        } else if (tabName === 'uht') {
            initializeUHT();
        }
    });
});

document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('title', document.getElementById('previewTitle').value);
    formData.append('description', document.getElementById('previewDescription').value);
    formData.append('preview', document.getElementById('previewFile').files[0]);
    
    const statusDiv = document.getElementById('uploadStatus');
    statusDiv.innerHTML = '<div class="loading-text"><div class="loading-spinner"></div>Uploading...</div>';
    statusDiv.className = '';
    
    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            statusDiv.textContent = 'Upload successful!';
            statusDiv.className = 'success';
            document.getElementById('uploadForm').reset();
            setTimeout(() => {
                statusDiv.textContent = '';
            }, 3000);
        } else {
            statusDiv.textContent = data.error || 'Upload failed';
            statusDiv.className = 'error';
        }
    } catch (error) {
        statusDiv.textContent = 'Network error. Please try again.';
        statusDiv.className = 'error';
    }
});

async function loadPreviews() {
    const listDiv = document.getElementById('previewsList');
    listDiv.innerHTML = '<div class="loading-text"><div class="loading-spinner"></div>Loading previews...</div>';
    
    try {
        const response = await fetch('/api/previews');
        const previews = await response.json();
        
        if (previews.length === 0) {
            listDiv.innerHTML = '<div style="text-align: center; color: var(--gray-500); padding: 3rem;"><p style="font-size: 1.1rem;">📁 No previews uploaded yet.</p><p style="margin-top: 0.5rem; font-size: 0.95rem;">Upload your first preview using the Upload tab!</p></div>';
            return;
        }
        
        listDiv.innerHTML = previews.map(preview => `
            <div class="preview-item">
                <div class="preview-info">
                    <div class="preview-title">${escapeHtml(preview.title)}</div>
                    <div class="preview-meta">
                        ${escapeHtml(preview.description || 'No description')} | 
                        ${formatFileSize(preview.size)} | 
                        ${new Date(preview.uploaded_at).toLocaleString()}
                    </div>
                </div>
                <div class="preview-actions">
                    <button class="view-btn" onclick="viewPreview('${preview.filename}', '${preview.mimetype}')">View</button>
                    <button class="delete-btn" onclick="deletePreview(${preview.id})">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load previews:', error);
    }
}

async function deletePreview(id) {
    if (!confirm('Are you sure you want to delete this preview?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/previews/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadPreviews();
        } else {
            alert('Failed to delete preview');
        }
    } catch (error) {
        console.error('Delete failed:', error);
    }
}

function viewPreview(filename, mimetype) {
    const url = `/uploads/${filename}`;
    
    if (mimetype && mimetype.startsWith('image/')) {
        const modal = document.createElement('div');
        modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:1000;';
        modal.onclick = () => modal.remove();
        
        const img = document.createElement('img');
        img.src = url;
        img.style.cssText = 'max-width:90%;max-height:90%;';
        
        modal.appendChild(img);
        document.body.appendChild(modal);
    } else {
        window.open(url, '_blank');
    }
}

async function loadStatus() {
    const statusCards = document.querySelectorAll('.status-card');
    statusCards.forEach(card => {
        const content = card.querySelector('div:not(h3)');
        if (content) {
            content.innerHTML = '<div class="loading-text"><div class="loading-spinner"></div>Loading...</div>';
        }
    });
    
    try {
        const response = await fetch('/api/status');
        const status = await response.json();
        
        document.getElementById('cpuInfo').innerHTML = `
            <div class="status-metric">
                <span>Usage:</span>
                <span>${status.cpu.usage}%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${status.cpu.usage}%"></div>
            </div>
            <div class="status-metric">
                <span>Cores:</span>
                <span>${status.cpu.cores}</span>
            </div>
        `;
        
        document.getElementById('memoryInfo').innerHTML = `
            <div class="status-metric">
                <span>Used:</span>
                <span>${status.memory.used} GB / ${status.memory.total} GB</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${status.memory.percentage}%"></div>
            </div>
            <div class="status-metric">
                <span>Free:</span>
                <span>${status.memory.free} GB</span>
            </div>
        `;
        
        document.getElementById('diskInfo').innerHTML = status.disk.map(d => `
            <div class="status-metric">
                <span>${d.fs}:</span>
                <span>${d.used} GB / ${d.size} GB (${d.use}%)</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${d.use}%"></div>
            </div>
        `).join('');
        
        if (status.network) {
            document.getElementById('networkInfo').innerHTML = `
                <div class="status-metric">
                    <span>Received:</span>
                    <span>${status.network.rx} MB</span>
                </div>
                <div class="status-metric">
                    <span>Transmitted:</span>
                    <span>${status.network.tx} MB</span>
                </div>
            `;
        }
        
        document.getElementById('systemInfo').innerHTML = `
            <div class="status-metric">
                <span>Platform:</span>
                <span>${status.os.platform}</span>
            </div>
            <div class="status-metric">
                <span>Distribution:</span>
                <span>${status.os.distro}</span>
            </div>
            <div class="status-metric">
                <span>Uptime:</span>
                <span>${formatUptime(status.os.uptime)}</span>
            </div>
        `;
    } catch (error) {
        console.error('Failed to load status:', error);
    }
}

document.getElementById('refreshStatus').addEventListener('click', loadStatus);

// Add play game button event listener after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // App button event listeners
    const playBtn = document.getElementById('playGameBtn');
    if (playBtn) {
        playBtn.addEventListener('click', () => {
            location.href = '/game/index.html';
        });
    }
    
    const hiitBtn = document.getElementById('hiitBtn');
    if (hiitBtn) {
        hiitBtn.addEventListener('click', () => {
            location.href = '/hiit-timer.html';
        });
    }
    
    const checklistBtn = document.getElementById('checklistBtn');
    if (checklistBtn) {
        checklistBtn.addEventListener('click', () => {
            location.href = '/checklist.html';
        });
    }
    
    const scannerBtn = document.getElementById('scannerBtn');
    if (scannerBtn) {
        scannerBtn.addEventListener('click', () => {
            location.href = '/photo-to-pdf.html';
        });
    }
    
    const voiceNotesBtn = document.getElementById('voiceNotesBtn');
    if (voiceNotesBtn) {
        voiceNotesBtn.addEventListener('click', () => {
            location.href = '/voice-notes.html';
        });
    }
    
    const chessBtn = document.getElementById('chessBtn');
    if (chessBtn) {
        chessBtn.addEventListener('click', () => {
            location.href = '/chess.html';
        });
    }
    
    const simpleHomingBtn = document.getElementById('simpleHomingBtn');
    if (simpleHomingBtn) {
        simpleHomingBtn.addEventListener('click', () => {
            location.href = '/simple-homing.html';
        });
    }
    
    const spaceInvadersBtn = document.getElementById('spaceInvadersBtn');
    if (spaceInvadersBtn) {
        spaceInvadersBtn.addEventListener('click', () => {
            location.href = '/space-invaders.html';
        });
    }
    
    const palmReaderBtn = document.getElementById('palmReaderBtn');
    if (palmReaderBtn) {
        palmReaderBtn.addEventListener('click', () => {
            location.href = '/palm-reader.html';
        });
    }
    
    const turingTwisterBtn = document.getElementById('turingTwisterBtn');
    if (turingTwisterBtn) {
        turingTwisterBtn.addEventListener('click', () => {
            location.href = '/turing-twister.html';
        });
    }

    const playerTimeBtn = document.getElementById('playerTimeBtn');
    if (playerTimeBtn) {
        playerTimeBtn.addEventListener('click', () => {
            location.href = '/player-time/index.html';
        });
    }
    
    // User Management Event Listeners
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const statusDiv = document.getElementById('changePasswordStatus');
            
            if (newPassword !== confirmPassword) {
                statusDiv.textContent = 'New passwords do not match';
                statusDiv.className = 'error';
                return;
            }
            
            try {
                const response = await fetch('/api/change-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ currentPassword, newPassword })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    statusDiv.textContent = data.message;
                    statusDiv.className = 'success';
                    changePasswordForm.reset();
                    setTimeout(() => {
                        statusDiv.textContent = '';
                    }, 3000);
                } else {
                    statusDiv.textContent = data.error || 'Password change failed';
                    statusDiv.className = 'error';
                }
            } catch (error) {
                statusDiv.textContent = 'Network error. Please try again.';
                statusDiv.className = 'error';
            }
        });
    }
    
    const addUserForm = document.getElementById('addUserForm');
    if (addUserForm) {
        addUserForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('newUsername').value;
            const password = document.getElementById('newUserPassword').value;
            const role = document.getElementById('newUserRole').value;
            const statusDiv = document.getElementById('addUserStatus');
            
            try {
                const response = await fetch('/api/users', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password, role })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    statusDiv.textContent = data.message;
                    statusDiv.className = 'success';
                    addUserForm.reset();
                    loadUsers(); // Refresh users list
                    setTimeout(() => {
                        statusDiv.textContent = '';
                    }, 3000);
                } else {
                    statusDiv.textContent = data.error || 'User creation failed';
                    statusDiv.className = 'error';
                }
            } catch (error) {
                statusDiv.textContent = 'Network error. Please try again.';
                statusDiv.className = 'error';
            }
        });
    }
    
    const refreshUsersBtn = document.getElementById('refreshUsers');
    if (refreshUsersBtn) {
        refreshUsersBtn.addEventListener('click', loadUsers);
    }
    
    // UHT Event Listeners
    const uhtClassifyBtn = document.getElementById('uhtClassifyBtn');
    if (uhtClassifyBtn) {
        uhtClassifyBtn.addEventListener('click', window.classifyUHTEntity);
    }
    
    const uhtEntityInput = document.getElementById('uhtEntityInput');
    if (uhtEntityInput) {
        uhtEntityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                window.classifyUHTEntity();
            }
        });
    }
    
    // UHT Example buttons
    const exampleBtns = document.querySelectorAll('.example-btn[data-entity]');
    exampleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const entity = btn.getAttribute('data-entity');
            window.setUHTExample(entity);
        });
    });
});

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    
    return parts.join(' ') || '< 1m';
}

// User Management Functions

async function loadUsers() {
    const listDiv = document.getElementById('usersList');
    listDiv.innerHTML = '<div class="loading-text"><div class="loading-spinner"></div>Loading users...</div>';
    
    try {
        const response = await fetch('/api/users');
        const users = await response.json();
        
        if (users.length === 0) {
            listDiv.innerHTML = '<div style="text-align: center; color: var(--gray-500); padding: 2rem;"><p>No users found.</p></div>';
            return;
        }
        
        listDiv.innerHTML = users.map(user => {
            const isCurrentUser = currentUser && currentUser.id === user.id;
            const isAdmin = currentUser && currentUser.role === 'admin';
            
            return `
            <div class="user-item ${user.role === 'admin' ? 'admin-user' : ''}">
                <div class="user-info">
                    <div class="user-username">
                        ${escapeHtml(user.username)}
                        <span class="user-role-badge ${user.role}">${user.role.toUpperCase()}</span>
                        ${isCurrentUser ? '<span class="current-user-badge">YOU</span>' : ''}
                    </div>
                    <div class="user-meta">
                        ID: ${user.id} | Created: ${new Date(user.created_at).toLocaleString()}
                        ${user.permissions && user.permissions.length > 0 ? `| Permissions: ${user.permissions.join(', ')}` : ''}
                    </div>
                </div>
                <div class="user-actions">
                    ${isAdmin && !isCurrentUser ? `
                        <select class="role-select" onchange="updateUserRole(${user.id}, this.value)">
                            <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
                            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                        </select>
                        <button class="permissions-btn" onclick="managePermissions(${user.id}, '${escapeHtml(user.username)}', ${JSON.stringify(user.permissions || []).replace(/"/g, '&quot;')})">Permissions</button>
                    ` : ''}
                    ${isAdmin && !isCurrentUser ? `<button class="delete-btn" onclick="deleteUser(${user.id}, '${escapeHtml(user.username)}')">Delete</button>` : ''}
                </div>
            </div>
        `}).join('');
        
        // Update UI based on user role
        updateUIForRole();
    } catch (error) {
        console.error('Failed to load users:', error);
        listDiv.innerHTML = '<div class="error">Failed to load users</div>';
    }
}

async function updateUserRole(userId, newRole) {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
        loadUsers(); // Reload to reset dropdown
        return;
    }
    
    try {
        const response = await fetch(`/api/users/${userId}/role`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ role: newRole })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert(data.message);
            loadUsers();
        } else {
            alert(data.error || 'Failed to update user role');
            loadUsers(); // Reload to reset dropdown
        }
    } catch (error) {
        console.error('Role update failed:', error);
        alert('Network error. Please try again.');
        loadUsers();
    }
}

function managePermissions(userId, username, currentPermissions) {
    const availablePermissions = [
        'view_previews',
        'upload_previews',
        'delete_previews',
        'view_status',
        'view_users',
        'manage_llm'
    ];
    
    const permissionsList = availablePermissions.map(perm => {
        const hasPermission = currentPermissions.includes(perm);
        return `
            <div style="margin: 5px 0;">
                <label>
                    <input type="checkbox" value="${perm}" ${hasPermission ? 'checked' : ''}>
                    ${perm.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </label>
            </div>
        `;
    }).join('');
    
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:1000;';
    modal.innerHTML = `
        <div style="background:var(--gray-900);padding:2rem;border-radius:8px;max-width:500px;width:90%;">
            <h3 style="margin-top:0;">Manage Permissions for ${escapeHtml(username)}</h3>
            <div id="permissionsCheckboxes">
                ${permissionsList}
            </div>
            <div style="margin-top:1.5rem;display:flex;gap:1rem;">
                <button onclick="savePermissions(${userId}, this.parentElement.parentElement)">Save</button>
                <button onclick="this.parentElement.parentElement.parentElement.remove()">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function savePermissions(userId, modalContent) {
    const checkboxes = modalContent.querySelectorAll('input[type="checkbox"]');
    const permissions = [];
    checkboxes.forEach(cb => {
        if (cb.checked) {
            permissions.push(cb.value);
        }
    });
    
    try {
        // First get current user role
        const usersResponse = await fetch('/api/users');
        const users = await usersResponse.json();
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            alert('User not found');
            return;
        }
        
        const response = await fetch(`/api/users/${userId}/role`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                role: user.role, // Keep current role
                permissions: permissions
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Permissions updated successfully');
            modalContent.parentElement.remove();
            loadUsers();
        } else {
            alert(data.error || 'Failed to update permissions');
        }
    } catch (error) {
        console.error('Permission update failed:', error);
        alert('Network error. Please try again.');
    }
}

function updateUIForRole() {
    const isAdmin = currentUser && currentUser.role === 'admin';
    
    // Show/hide add user form based on admin status
    const addUserForm = document.getElementById('addUserForm');
    if (addUserForm) {
        const formContainer = addUserForm.parentElement;
        if (!isAdmin) {
            formContainer.style.display = 'none';
        } else {
            formContainer.style.display = 'block';
        }
    }
    
    // Update welcome message or user info
    const userInfoDiv = document.getElementById('currentUserInfo');
    if (userInfoDiv && currentUser) {
        userInfoDiv.innerHTML = `
            Logged in as: <strong>${currentUser.username}</strong> 
            <span class="user-role-badge ${currentUser.role}">${currentUser.role.toUpperCase()}</span>
        `;
    }
}

async function deleteUser(id, username) {
    if (!confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/users/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            loadUsers(); // Refresh users list
        } else {
            alert(data.error || 'Failed to delete user');
        }
    } catch (error) {
        console.error('Delete failed:', error);
        alert('Network error. Please try again.');
    }
}

// UHT (Universal Hex Taxonomy) Advanced Functions - Global scope for onClick handlers
const uhtLayers = [
    { 
        name: 'Physical', 
        range: '1-8',
        traits: {
            1: { name: "Physical Object", desc: "A discrete, bounded physical entity." },
            2: { name: "Synthetic", desc: "Created or manufactured by humans." },
            3: { name: "Biological/Biomimetic", desc: "Has biological origin or structure inspired by biology." },
            4: { name: "Powered", desc: "Immobile or permanently affixed." },
            5: { name: "Structural", desc: "Serves a load-bearing or structural function." },
            6: { name: "Observable", desc: "Detectable by human senses or instruments." },
            7: { name: "Physical Medium", desc: "Composed of physical matter." },
            8: { name: "Active", desc: "Lacks autonomous behavior; responds only to external forces." }
        }
    },
    { 
        name: 'Functional', 
        range: '9-16',
        traits: {
            9: { name: "Intentionally Designed", desc: "Designed or intended for a specific function." },
            10: { name: "Outputs Effect", desc: "Actively produces signals, energy, or effects." },
            11: { name: "Processes Signals/Logic", desc: "Performs information processing or control." },
            12: { name: "State-Transforming", desc: "Undergoes internal change or self-modification." },
            13: { name: "Human-Interactive", desc: "Interfaces with humans purposefully." },
            14: { name: "System-integrated", desc: "Inherently integrated within a system or network." },
            15: { name: "Functionally Autonomous", desc: "Operates without external control; self-governing." },
            16: { name: "System-Essential", desc: "Essential to a system's operation or integrity." }
        }
    },
    { 
        name: 'Abstract', 
        range: '17-24',
        traits: {
            17: { name: "Symbolic", desc: "Represents ideas, concepts, or other entities." },
            18: { name: "Signalling", desc: "Transmits information or meaning." },
            19: { name: "Rule-governed", desc: "Governed by abstract rules or logic." },
            20: { name: "Compositional", desc: "Structured in layers or modules." },
            21: { name: "Normative", desc: "Directs or constrains behavior or actions." },
            22: { name: "Meta", desc: "Refers to itself or to conceptual structures." },
            23: { name: "Temporal", desc: "Has intrinsic temporal ordering or dynamics." },
            24: { name: "Digital/Virtual", desc: "Abstracted based on context or perspective." }
        }
    },
    { 
        name: 'Social', 
        range: '25-32',
        traits: {
            25: { name: "Social Construct", desc: "Exists by virtue of social or cultural meaning." },
            26: { name: "Institutionally Defined", desc: "Classification depends on institutional definitions." },
            27: { name: "Identity-Linked", desc: "Tied to a social identity or functional role." },
            28: { name: "Regulated", desc: "Subject to rules, norms, or regulation." },
            29: { name: "Economically Significant", desc: "Functions as a unit of economic value or exchange." },
            30: { name: "Communicatively Significant", desc: "Meaningful within communicative or symbolic systems." },
            31: { name: "Contextually Dependent", desc: "Meaning depends on context or situational factors." },
            32: { name: "Collectively Meaningful", desc: "Significance emerges from collective understanding." }
        }
    }
];

// Global functions for onClick handlers
window.updateUserRole = updateUserRole;
window.managePermissions = managePermissions;
window.savePermissions = savePermissions;
window.deleteUser = deleteUser;

window.initializeUHT = function() {
    console.log('UHT Hub initialized');
    showUHTHub();
    
    // Add event listeners for hub navigation with a small delay to ensure DOM is ready
    setTimeout(() => {
        const openLLMClassifier = document.getElementById('openLLMClassifier');
        const openChallengeGame = document.getElementById('openChallengeGame');
        const backToHub = document.getElementById('backToHub');
        
        console.log('Looking for buttons:', {
            openLLMClassifier: !!openLLMClassifier,
            openChallengeGame: !!openChallengeGame,
            backToHub: !!backToHub
        });
        
        if (openLLMClassifier) {
            openLLMClassifier.addEventListener('click', () => {
                console.log('LLM Classifier button clicked');
                showLLMClassifier();
            });
        }
        
        if (openChallengeGame) {
            openChallengeGame.addEventListener('click', () => {
                console.log('Challenge Game button clicked');
                openUHTChallenge();
            });
        }
        
        if (backToHub) {
            backToHub.addEventListener('click', () => {
                console.log('Back to Hub button clicked');
                showUHTHub();
            });
        }
    }, 100);
}

function showUHTHub() {
    console.log('showUHTHub called');
    const hubGrid = document.querySelector('.uht-hub-grid');
    const classifierSection = document.getElementById('llmClassifierSection');
    
    console.log('Hub elements:', {
        hubGrid: !!hubGrid,
        classifierSection: !!classifierSection
    });
    
    if (hubGrid) hubGrid.style.display = 'grid';
    if (classifierSection) classifierSection.classList.add('hidden');
}

function showLLMClassifier() {
    console.log('showLLMClassifier called');
    const hubGrid = document.querySelector('.uht-hub-grid');
    const classifierSection = document.getElementById('llmClassifierSection');
    
    console.log('Classifier elements:', {
        hubGrid: !!hubGrid,
        classifierSection: !!classifierSection
    });
    
    if (hubGrid) hubGrid.style.display = 'none';
    if (classifierSection) classifierSection.classList.remove('hidden');
}

function openUHTChallenge() {
    // Open the UHT challenge in a new tab
    window.open('/UHT/uht-challenge.html', '_blank');
}

window.setUHTExample = function(entity) {
    const input = document.getElementById('uhtEntityInput');
    if (input) {
        input.value = entity;
    }
}

window.classifyUHTEntity = async function() {
    const entityInput = document.getElementById('uhtEntityInput');
    const entity = entityInput.value.trim();
    const statusDiv = document.getElementById('uhtStatus');
    const resultsSection = document.getElementById('uhtResultsSection');
    
    if (!entity) {
        statusDiv.textContent = 'Please enter an entity to classify';
        statusDiv.className = 'uht-status error';
        return;
    }
    
    // Show results section and initialize layer displays
    resultsSection.style.display = 'block';
    initializeLayerResults();
    
    statusDiv.textContent = '🦙 Starting Llama 3.2 multi-layer analysis...';
    statusDiv.className = 'uht-status loading';
    
    document.getElementById('uhtClassifyBtn').disabled = true;
    
    let allResults = {};
    let finalBinary = '';
    
    try {
        // Process each layer sequentially for real-time updates
        for (let i = 0; i < uhtLayers.length; i++) {
            const layer = uhtLayers[i];
            updateLayerStatus(i, 'processing');
            
            statusDiv.textContent = `🦙 Analyzing ${layer.name} Layer...`;
            
            const result = await analyzeSingleLayer(entity, layer, i);
            allResults[layer.name] = result;
            displayLayerResult(i, layer, result);
            
            // Build binary string
            const layerBinary = generateLayerBinary(result.traits, layer.range);
            finalBinary += layerBinary;
        }
        
        // Display final results
        displayFinalResults(entity, finalBinary);
        statusDiv.textContent = `✅ Complete analysis of "${entity}" finished!`;
        statusDiv.className = 'uht-status success';
        
    } catch (error) {
        statusDiv.textContent = `❌ Analysis failed: ${error.message}`;
        statusDiv.className = 'uht-status error';
        console.error('UHT Classification error:', error);
    } finally {
        document.getElementById('uhtClassifyBtn').disabled = false;
    }
}

function initializeLayerResults() {
    const layerResults = document.getElementById('uhtLayerResults');
    layerResults.innerHTML = '';
    
    uhtLayers.forEach((layer, index) => {
        const layerDiv = document.createElement('div');
        layerDiv.className = 'uht-layer-result';
        layerDiv.id = `uht-layer-${index}`;
        layerDiv.innerHTML = `
            <div class="uht-layer-header">
                <span>${layer.name} Layer (${layer.range})</span>
                <span class="uht-hex-pair" id="uht-hex-pair-${index}">--</span>
            </div>
            <div class="uht-layer-traits" id="uht-traits-${index}">Waiting...</div>
            <div class="uht-layer-raw-response" id="uht-raw-${index}" style="display: none;"></div>
        `;
        layerResults.appendChild(layerDiv);
    });
}

function updateLayerStatus(layerIndex, status) {
    const layerDiv = document.getElementById(`uht-layer-${layerIndex}`);
    if (status === 'processing') {
        layerDiv.className = 'uht-layer-result processing';
        document.getElementById(`uht-traits-${layerIndex}`).textContent = 'Analyzing...';
    }
}

function displayLayerResult(layerIndex, layer, result) {
    const layerDiv = document.getElementById(`uht-layer-${layerIndex}`);
    layerDiv.className = 'uht-layer-result completed';
    
    // Generate hex pair for this layer (8 bits)
    const layerBinary = generateLayerBinary(result.traits, layer.range);
    const hexPair = parseInt(layerBinary, 2).toString(16).toUpperCase().padStart(2, '0');
    
    document.getElementById(`uht-hex-pair-${layerIndex}`).textContent = `0x${hexPair}`;
    
    // Display selected traits
    const traitsText = result.traits.length > 0 
        ? result.traits.map(t => `${t}: ${layer.traits[t].name}`).join(', ')
        : 'None selected';
    document.getElementById(`uht-traits-${layerIndex}`).textContent = traitsText;
    
    // Show raw response
    const rawDiv = document.getElementById(`uht-raw-${layerIndex}`);
    rawDiv.textContent = result.response;
    rawDiv.style.display = 'block';
}

function generateLayerBinary(traits, range) {
    const [start, end] = range.split('-').map(n => parseInt(n));
    let binary = '';
    for (let i = start; i <= end; i++) {
        binary += traits.includes(i) ? '1' : '0';
    }
    return binary;
}

async function analyzeSingleLayer(entity, layer, layerIndex) {
    const traitList = Object.entries(layer.traits)
        .map(([num, trait]) => `${num}. ${trait.name}: ${trait.desc}`)
        .join('\n');

    const prompt = `Analyze "${entity}" for ${layer.name} Layer traits (${layer.range}) only.

${layer.name.toUpperCase()} LAYER TRAITS:
${traitList}

Question: Which of these ${layer.name.toLowerCase()} traits apply to "${entity}"?

Rules:
- Only consider traits ${layer.range}
- Choose 0-3 most relevant traits
- Be selective and accurate

Format:
TRAITS: [numbers only, e.g. "1,3,6" or "none"]
REASONING: Brief explanation for each selected trait

Analyze "${entity}":`;

    try {
        // Call the LLM proxy endpoint on this server
        const response = await fetch('/api/llm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama3.2:1b',
                prompt: prompt,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`${layer.name} layer analysis failed`);
        }

        const data = await response.json();
        const llmResponse = data.response;
        
        // Parse traits from this layer
        let traits = [];
        let reasoning = '';
        
        // Look for TRAITS: line
        const traitsMatch = llmResponse.match(/TRAITS:\s*([0-9,\s]+|none)/i);
        if (traitsMatch && traitsMatch[1].toLowerCase() !== 'none') {
            const traitNumbers = traitsMatch[1].match(/\d+/g);
            if (traitNumbers) {
                traits = traitNumbers.map(n => parseInt(n))
                    .filter(n => n >= parseInt(layer.range.split('-')[0]) && n <= parseInt(layer.range.split('-')[1]));
            }
        }
        
        // Extract reasoning
        const reasoningMatch = llmResponse.match(/REASONING:\s*(.*)/is);
        if (reasoningMatch) {
            reasoning = reasoningMatch[1].trim();
        }
        
        return {
            traits: traits,
            reasoning: reasoning,
            response: llmResponse
        };
        
    } catch (error) {
        console.error(`LLM analysis failed for ${layer.name} layer:`, error);
        throw error;
    }
}


function displayFinalResults(entity, binaryResult) {
    const finalResults = document.getElementById('uhtFinalResults');
    const binaryCode = document.getElementById('uhtBinaryCode');
    const hexCode = document.getElementById('uhtHexCode');
    const hexBreakdown = document.getElementById('uhtHexPairBreakdown');
    
    // Display binary and hex
    binaryCode.textContent = `Binary: ${binaryResult}`;
    const hexResult = parseInt(binaryResult, 2).toString(16).toUpperCase().padStart(8, '0');
    hexCode.textContent = `Hex: 0x${hexResult}`;
    
    // Create hex-pair breakdown
    const hexPairs = hexResult.match(/.{2}/g) || [];
    const layers = ['Physical', 'Functional', 'Abstract', 'Social'];
    const breakdown = hexPairs.map((pair, i) => `${layers[i]}: 0x${pair}`).join(' | ');
    hexBreakdown.textContent = breakdown;
    
    finalResults.style.display = 'block';
}

// Mobile enhancements
function addMobileEnhancements() {
    // Detect if device is mobile
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        // Add mobile class to body
        document.body.classList.add('mobile-device');
        
        // Improve touch scrolling
        document.body.style.webkitOverflowScrolling = 'touch';
        
        // Add loading states to buttons
        const buttons = document.querySelectorAll('button[type="submit"]');
        buttons.forEach(button => {
            const form = button.closest('form');
            if (form) {
                form.addEventListener('submit', () => {
                    button.classList.add('loading-button');
                    button.disabled = true;
                    
                    // Remove loading state after 10 seconds as fallback
                    setTimeout(() => {
                        button.classList.remove('loading-button');
                        button.disabled = false;
                    }, 10000);
                });
            }
        });
    }
}

// Add haptic feedback for supported devices
function addHapticFeedback() {
    if ('vibrate' in navigator) {
        document.querySelectorAll('button, .tab-btn').forEach(element => {
            element.addEventListener('click', () => {
                navigator.vibrate(10); // Short vibration
            });
        });
    }
}

// Improve error messages for mobile
function showMobileToast(message, type = 'info') {
    // Only show on mobile
    if (window.innerWidth > 768) return;
    
    const existingToast = document.querySelector('.mobile-toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = `mobile-toast ${type}`;
    toast.textContent = message;
    
    // Add toast styles
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'error' ? 'var(--danger)' : type === 'success' ? 'var(--secondary)' : 'var(--primary)'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: var(--border-radius);
        box-shadow: var(--shadow-lg);
        z-index: 10000;
        font-weight: 600;
        max-width: 90vw;
        text-align: center;
        animation: slideInDown 0.3s ease-out;
    `;
    
    document.body.appendChild(toast);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOutUp 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add CSS animations for toasts
const toastStyles = document.createElement('style');
toastStyles.textContent = `
    @keyframes slideInDown {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
    
    @keyframes slideOutUp {
        from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        to {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
    }
`;
document.head.appendChild(toastStyles);

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    addMobileEnhancements();
    addHapticFeedback();
});