// Simple Checklist - Working Version
let items = [];
const storageKey = 'simple_checklist_items';

// Load items from localStorage
function loadItems() {
    try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
            items = JSON.parse(stored);
        }
    } catch (error) {
        console.error('Error loading items:', error);
        items = [];
    }
    console.log('Loaded items:', items);
}

// Save items to localStorage
function saveItems() {
    try {
        localStorage.setItem(storageKey, JSON.stringify(items));
        console.log('Items saved');
    } catch (error) {
        console.error('Error saving items:', error);
    }
}

// Add new item
function addItem() {
    const input = document.getElementById('newItemInput');
    const text = input.value.trim();
    
    console.log('Adding item with text:', text);
    
    if (!text) {
        console.log('Empty text, not adding');
        return;
    }
    
    const newItem = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        text: text,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    items.unshift(newItem);
    input.value = '';
    saveItems();
    updateDisplay();
    showToast('Item added successfully! ✅');
    
    // Focus back on input
    input.focus();
    
    console.log('Item added, total items:', items.length);
}

// Toggle item completion
function toggleItem(id) {
    console.log('toggleItem called with id:', id);
    const item = items.find(item => item.id === id);
    
    if (!item) {
        console.error('Item not found with id:', id);
        return;
    }
    
    console.log('Found item:', item.text, 'Current status:', item.completed);
    
    item.completed = !item.completed;
    item.completedAt = item.completed ? new Date().toISOString() : null;
    
    console.log('New status:', item.completed);
    
    saveItems();
    updateDisplay();
    showToast(item.completed ? 'Task completed! 🎉' : 'Task marked as pending');
}

// Delete item
function deleteItem(id) {
    console.log('deleteItem called with id:', id);
    const item = items.find(item => item.id === id);
    
    if (!item) {
        console.error('Item not found with id:', id);
        return;
    }
    
    console.log('Found item to delete:', item.text);
    
    if (confirm(`Delete "${item.text}"?`)) {
        const originalLength = items.length;
        items = items.filter(item => item.id !== id);
        console.log('Items reduced from', originalLength, 'to', items.length);
        
        saveItems();
        updateDisplay();
        showToast('Item deleted');
    } else {
        console.log('Delete cancelled by user');
    }
}

// Update the display
function updateDisplay() {
    console.log('Updating display with', items.length, 'items');
    updateStats();
    renderItems();
    updateActionButtons();
}

// Update statistics
function updateStats() {
    const total = items.length;
    const completed = items.filter(item => item.completed).length;
    const remaining = total - completed;
    
    const totalEl = document.getElementById('totalItems');
    const completedEl = document.getElementById('completedItems');
    const remainingEl = document.getElementById('remainingItems');
    
    if (totalEl) totalEl.textContent = total;
    if (completedEl) completedEl.textContent = completed;
    if (remainingEl) remainingEl.textContent = remaining;
}

// Render items list
function renderItems() {
    const itemsList = document.getElementById('itemsList');
    const emptyState = document.getElementById('emptyState');
    
    if (!itemsList) return;
    
    if (items.length === 0) {
        itemsList.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
    } else {
        if (emptyState) emptyState.classList.add('hidden');
        itemsList.innerHTML = items.map(item => renderItem(item)).join('');
        
        // Add event listeners to newly created elements
        setupItemEventListeners();
    }
}

// Render single item
function renderItem(item) {
    return `
        <div class="item-container ${item.completed ? 'completed' : ''}" data-id="${item.id}">
            <div class="checkbox ${item.completed ? 'checked' : ''}" data-toggle-id="${item.id}">
                ${item.completed ? '<span class="checkmark">✓</span>' : ''}
            </div>
            <div class="item-text ${item.completed ? 'completed' : ''}">${escapeHtml(item.text)}</div>
            <button class="delete-button" data-delete-id="${item.id}" title="Delete item">×</button>
        </div>
    `;
}

// Update action buttons
function updateActionButtons() {
    const completedCount = items.filter(item => item.completed).length;
    const clearBtn = document.getElementById('clearCompletedBtn');
    const exportBtn = document.getElementById('exportBtn');
    
    if (clearBtn) clearBtn.disabled = completedCount === 0;
    if (exportBtn) exportBtn.disabled = items.length === 0;
}

// Clear completed items
function clearCompleted() {
    const completedCount = items.filter(item => item.completed).length;
    if (completedCount === 0) {
        showToast('No completed items to clear');
        return;
    }
    
    if (confirm(`Delete ${completedCount} completed item${completedCount > 1 ? 's' : ''}?`)) {
        items = items.filter(item => !item.completed);
        saveItems();
        updateDisplay();
        showToast(`${completedCount} completed items cleared`);
    }
}

// Export list
function exportList() {
    if (items.length === 0) {
        showToast('No items to export');
        return;
    }
    
    const timestamp = new Date().toLocaleDateString();
    let content = `Simple Checklist Export - ${timestamp}\\n\\n`;
    
    const completedItems = items.filter(item => item.completed);
    const pendingItems = items.filter(item => !item.completed);
    
    if (pendingItems.length > 0) {
        content += 'PENDING ITEMS:\\n';
        pendingItems.forEach((item, index) => {
            content += `${index + 1}. [ ] ${item.text}\\n`;
        });
        content += '\\n';
    }
    
    if (completedItems.length > 0) {
        content += 'COMPLETED ITEMS:\\n';
        completedItems.forEach((item, index) => {
            content += `${index + 1}. [✓] ${item.text}\\n`;
        });
    }
    
    content += `\\n\\nStats:\\n- Total Items: ${items.length}\\n- Completed: ${completedItems.length}\\n- Remaining: ${pendingItems.length}`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `checklist-${timestamp.replace(/\\//g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('List exported successfully! 📤');
}

// Show toast notification
function showToast(message) {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        z-index: 1000;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing checklist...');
    
    // Load existing items
    loadItems();
    updateDisplay();
    
    // Setup event listeners
    const input = document.getElementById('newItemInput');
    const addButton = document.getElementById('addButton');
    const clearBtn = document.getElementById('clearCompletedBtn');
    const exportBtn = document.getElementById('exportBtn');
    
    // Add item on Enter key
    if (input) {
        input.addEventListener('keydown', function(e) {
            console.log('Key pressed:', e.key, 'KeyCode:', e.keyCode);
            if (e.key === 'Enter' || e.keyCode === 13) {
                e.preventDefault();
                console.log('Enter detected, calling addItem');
                addItem();
            }
        });
        
        // Also try keypress as backup
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' || e.keyCode === 13) {
                e.preventDefault();
                addItem();
            }
        });
        
        console.log('Input event listeners added');
    } else {
        console.error('Input element not found!');
    }
    
    // Add item on button click
    if (addButton) {
        addButton.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Add button clicked');
            addItem();
        });
        console.log('Button event listener added');
    } else {
        console.error('Add button not found!');
    }
    
    // Clear completed button
    if (clearBtn) {
        clearBtn.addEventListener('click', clearCompleted);
    }
    
    // Export button
    if (exportBtn) {
        exportBtn.addEventListener('click', exportList);
    }
    
    // Focus on input
    if (input) {
        input.focus();
    }
    
    console.log('Checklist initialized successfully!');
});

// Setup event listeners for item interactions
function setupItemEventListeners() {
    console.log('Setting up item event listeners...');
    
    // Toggle checkboxes
    document.querySelectorAll('[data-toggle-id]').forEach(checkbox => {
        checkbox.addEventListener('click', function(e) {
            e.preventDefault();
            const id = this.getAttribute('data-toggle-id');
            console.log('Toggling item:', id);
            toggleItem(id);
        });
    });
    
    // Delete buttons
    document.querySelectorAll('[data-delete-id]').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const id = this.getAttribute('data-delete-id');
            console.log('Deleting item:', id);
            deleteItem(id);
        });
    });
    
    console.log('Item event listeners set up for', document.querySelectorAll('[data-toggle-id]').length, 'items');
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

console.log('Simple Checklist loaded - Enter key and button click should work!');