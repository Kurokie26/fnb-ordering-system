// Application State
let menu = [];
let orders = [];
let currentScreen = 'kitchen-monitor-screen';
let adminTab = 'menu';
let logs = [];
let currentUserRole = null;

// Initialize App
window.addEventListener('DOMContentLoaded', () => {
  currentUserRole = localStorage.getItem('aetheria_role') || null;
  
  initData();
  renderLogs();
  
  // Apply visual roles
  applyStaffSession();
});

// Watch for changes from the Guest Kiosk in other tabs
window.addEventListener('storage', (e) => {
  if (e.key === 'aetheria_orders') {
    orders = JSON.parse(e.newValue || '[]');
    updateNavBadges();
    
    // Refresh active backoffice screen views
    if (currentScreen === 'kitchen-monitor-screen') {
      renderKitchenDashboard();
    } else if (currentScreen === 'delivery-dispatch-screen') {
      renderDeliveryDispatch();
    } else if (currentScreen === 'admin-manager-screen' && adminTab === 'sales') {
      renderAdminSales();
    }
  }
  if (e.key === 'aetheria_menu') {
    menu = JSON.parse(e.newValue || '[]');
    if (currentScreen === 'admin-manager-screen' && adminTab === 'menu') {
      renderAdminMenuTable();
    }
  }
  if (e.key === 'aetheria_logs') {
    logs = JSON.parse(e.newValue || '[]');
    renderLogs();
  }
});

// Data Initialization (Sync with Local Storage)
function initData() {
  const savedMenu = localStorage.getItem('aetheria_menu');
  if (savedMenu) {
    menu = JSON.parse(savedMenu);
  } else {
    menu = [...DEFAULT_MENU];
    localStorage.setItem('aetheria_menu', JSON.stringify(menu));
  }

  const savedOrders = localStorage.getItem('aetheria_orders');
  if (savedOrders) {
    orders = JSON.parse(savedOrders);
  } else {
    orders = [];
    localStorage.setItem('aetheria_orders', JSON.stringify(orders));
  }

  const savedLogs = localStorage.getItem('aetheria_logs');
  if (savedLogs) {
    logs = JSON.parse(savedLogs);
  } else {
    logs = [
      { time: getFormattedTime(), text: "Staff portal initialized." }
    ];
    localStorage.setItem('aetheria_logs', JSON.stringify(logs));
  }
}

// Session Gate Management
function applyStaffSession() {
  const gate = document.getElementById('login-gate-screen');
  const header = document.getElementById('staff-header');
  const container = document.getElementById('staff-container');
  const sessionBadge = document.getElementById('session-badge');
  const logoutBtn = document.getElementById('logout-btn');
  const sidebarRoleTitle = document.getElementById('sidebar-role-title');
  
  if (!gate) return;

  if (currentUserRole !== 'staff') {
    gate.style.display = 'flex';
    if (header) header.style.display = 'none';
    if (container) container.style.display = 'none';
    if (sessionBadge) sessionBadge.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
  } else {
    gate.style.display = 'none';
    if (header) header.style.display = 'flex';
    if (container) container.style.display = 'flex';
    
    if (sessionBadge) {
      sessionBadge.style.display = 'inline-flex';
    }
    if (logoutBtn) logoutBtn.style.display = 'inline-block';
    if (sidebarRoleTitle) sidebarRoleTitle.textContent = "Backoffice Cockpit";
    
    // Default staff screen
    switchScreen('kitchen-monitor-screen');
  }
}

function loginAsStaff(e) {
  if (e) e.preventDefault();
  const usernameVal = document.getElementById('gate-username').value.trim();
  const passwordVal = document.getElementById('gate-password').value;
  
  if (usernameVal.toLowerCase() === 'admin' && passwordVal === 'admin') {
    currentUserRole = 'staff';
    localStorage.setItem('aetheria_role', 'staff');
    
    applyStaffSession();
    addLog("Staff Backoffice credentials verified. Logged in.");
    showToast("Login successful. Welcome back!", "success");
    
    document.getElementById('gate-username').value = '';
    document.getElementById('gate-password').value = '';
  } else {
    showToast("Invalid credentials. Use admin / admin for demo.", "danger");
  }
}

function logout() {
  addLog("Staff logged out.");
  currentUserRole = null;
  localStorage.removeItem('aetheria_role');
  
  applyStaffSession();
  showToast("Logged out of portal.", "info");
}

function systemReset() {
  if (confirm("Are you sure you want to reset the simulator? This clears all active orders, custom menu additions, and sales metrics.")) {
    localStorage.removeItem('aetheria_menu');
    localStorage.removeItem('aetheria_orders');
    localStorage.removeItem('aetheria_logs');
    localStorage.removeItem('aetheria_role');
    localStorage.removeItem('aetheria_table');
    initData();
    
    currentUserRole = null;
    currentScreen = 'kitchen-monitor-screen';
    
    applyStaffSession();
    renderLogs();
    showToast("Simulator reset successfully!", "info");
  }
}

// Router
function switchScreen(screenId) {
  document.querySelectorAll('.screen-container').forEach(screen => {
    screen.classList.remove('active');
  });
  
  const target = document.getElementById(screenId);
  if (target) {
    target.classList.add('active');
    currentScreen = screenId;
  }
  
  document.querySelectorAll('.nav-item').forEach(item => {
    if (item.getAttribute('data-screen') === screenId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  if (screenId === 'kitchen-monitor-screen') {
    renderKitchenDashboard();
  } else if (screenId === 'delivery-dispatch-screen') {
    renderDeliveryDispatch();
  } else if (screenId === 'admin-manager-screen') {
    switchAdminTab(adminTab);
  }
  
  updateNavBadges();
}

function updateNavBadges() {
  const kitchenCount = orders.filter(o => o.status === 'pending' || o.status === 'preparing').length;
  const kBadge = document.getElementById('kitchen-badge');
  if (kBadge) {
    kBadge.textContent = kitchenCount;
    kBadge.style.display = kitchenCount > 0 ? 'inline-block' : 'none';
  }

  const deliveryCount = orders.filter(o => o.status === 'ready_to_deliver' || o.status === 'out_for_delivery').length;
  const dBadge = document.getElementById('delivery-badge');
  if (dBadge) {
    dBadge.textContent = deliveryCount;
    dBadge.style.display = deliveryCount > 0 ? 'inline-block' : 'none';
  }
}

// Kitchen Dashboard Prep
function renderKitchenDashboard() {
  const pendingContainer = document.getElementById('kitchen-pending-container');
  const preparingContainer = document.getElementById('kitchen-preparing-container');
  const readyContainer = document.getElementById('kitchen-ready-container');
  
  if (!pendingContainer || !preparingContainer || !readyContainer) return;
  
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready_to_deliver' || o.status === 'out_for_delivery' || o.status === 'delivered' || o.status === 'issue');
  
  document.getElementById('kitchen-pending-count').textContent = pendingOrders.length;
  document.getElementById('kitchen-preparing-count').textContent = preparingOrders.length;
  document.getElementById('kitchen-ready-count').textContent = readyOrders.length;
  
  if (pendingOrders.length === 0) {
    pendingContainer.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size:13px; border: 1px dashed var(--border-color); border-radius:8px;">No pending orders</div>`;
  } else {
    pendingContainer.innerHTML = pendingOrders.map(order => `
      <div class="kitchen-order-card">
        <div class="order-card-header">
          <span class="order-num">${order.id}</span>
          <span class="order-table-badge">Table ${order.table}</span>
        </div>
        <div class="order-time">Received ${getElapsedTime(order.createdAt)}</div>
        <div class="order-items-checklist">
          ${order.items.map(item => `
            <div class="checklist-item">
              <span>• ${item.quantity}x <strong>${item.name}</strong></span>
            </div>
          `).join('')}
        </div>
        <div class="kitchen-actions">
          <button class="btn-kitchen-action accept" onclick="acceptOrder('${order.id}')">Accept Order</button>
        </div>
      </div>
    `).join('');
  }
  
  if (preparingOrders.length === 0) {
    preparingContainer.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size:13px; border: 1px dashed var(--border-color); border-radius:8px;">No orders cooking</div>`;
  } else {
    preparingContainer.innerHTML = preparingOrders.map(order => `
      <div class="kitchen-order-card" style="border-color: rgba(14, 165, 233, 0.3);">
        <div class="order-card-header">
          <span class="order-num" style="color: var(--color-info);">${order.id}</span>
          <span class="order-table-badge">Table ${order.table}</span>
        </div>
        <div class="order-time">Prep started ${getElapsedTime(order.createdAt)}</div>
        <div class="order-items-checklist">
          ${order.items.map((item, idx) => `
            <label class="checklist-item" id="chk-label-${order.id}-${idx}">
              <input type="checkbox" onchange="toggleKitchenCheckbox(this, 'chk-label-${order.id}-${idx}')">
              <span>${item.quantity}x <strong>${item.name}</strong></span>
            </label>
          `).join('')}
        </div>
        <div class="kitchen-actions">
          <button class="btn-kitchen-action ready" onclick="readyForDelivery('${order.id}')">Ready for Dispatch</button>
        </div>
      </div>
    `).join('');
  }
  
  if (readyOrders.length === 0) {
    readyContainer.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size:13px; border: 1px dashed var(--border-color); border-radius:8px;">No orders dispatched</div>`;
  } else {
    readyContainer.innerHTML = readyOrders.map(order => {
      let statusText = '';
      let statusColor = 'var(--text-muted)';
      
      if (order.status === 'ready_to_deliver') {
        statusText = '📦 Ready & Packaged';
        statusColor = 'var(--color-primary)';
      } else if (order.status === 'out_for_delivery') {
        statusText = '🛵 Out for Delivery';
        statusColor = 'var(--color-info)';
      } else if (order.status === 'delivered') {
        statusText = '🛎️ Arrived - Awaiting Guest Confirm';
        statusColor = 'var(--color-purple)';
      } else if (order.status === 'issue') {
        statusText = '⚠️ Issue Reported!';
        statusColor = 'var(--color-danger)';
      }
      
      return `
        <div class="kitchen-order-card" style="border-color: ${statusColor};">
          <div class="order-card-header">
            <span class="order-num">${order.id}</span>
            <span class="order-table-badge">Table ${order.table}</span>
          </div>
          <div style="font-size:12px; font-weight: 600; color: ${statusColor};">${statusText}</div>
          ${order.status === 'issue' ? `
            <div style="background: rgba(244,63,94,0.1); border: 1px solid rgba(244,63,94,0.2); border-radius: 6px; padding: 8px; font-size: 12px; color: var(--color-danger);">
              <strong>Guest note:</strong> "${order.deliveryIssueNotes || 'No notes left'}"
            </div>
            <div class="kitchen-actions">
              <button class="btn-kitchen-action accept" style="border-color: rgba(245,158,11,0.3); color: var(--color-primary);" onclick="reprepareOrder('${order.id}')">Re-prepare Food</button>
            </div>
          ` : `
            <div class="order-items-checklist">
              ${order.items.map(item => `
                <div style="font-size:12px; opacity:0.8;">• ${item.quantity}x ${item.name}</div>
              `).join('')}
            </div>
          `}
        </div>
      `;
    }).join('');
  }
}

function getElapsedTime(isoString) {
  const diffMs = new Date() - new Date(isoString);
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  return `${diffMins}m ago`;
}

function toggleKitchenCheckbox(cb, labelId) {
  const label = document.getElementById(labelId);
  if (cb.checked) {
    label.classList.add('checked');
  } else {
    label.classList.remove('checked');
  }
}

function acceptOrder(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (order) {
    order.status = 'preparing';
    localStorage.setItem('aetheria_orders', JSON.stringify(orders));
    addLog(`Kitchen accepted Order ${orderId} and started food preparation.`);
    showToast(`Order ${orderId} preparation started.`, "info");
    renderKitchenDashboard();
    updateNavBadges();
  }
}

function readyForDelivery(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (order) {
    order.status = 'ready_to_deliver';
    localStorage.setItem('aetheria_orders', JSON.stringify(orders));
    addLog(`Order ${orderId} prepared and marked ready for delivery.`);
    showToast(`Order ${orderId} is ready for dispatch!`, "success");
    renderKitchenDashboard();
    updateNavBadges();
  }
}

function reprepareOrder(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (order) {
    order.status = 'preparing';
    order.deliveryIssueNotes = "";
    localStorage.setItem('aetheria_orders', JSON.stringify(orders));
    addLog(`Kitchen accepted corrective action for Order ${orderId} - repreparing.`);
    showToast(`Re-preparing Order ${orderId}`, "info");
    renderKitchenDashboard();
    updateNavBadges();
  }
}

// Delivery Dispatch App
function renderDeliveryDispatch() {
  const grid = document.getElementById('delivery-dispatch-grid');
  if (!grid) return;
  
  const deliveryOrders = orders.filter(o => o.status === 'ready_to_deliver' || o.status === 'out_for_delivery');
  
  if (deliveryOrders.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; padding: 48px 20px; text-align: center; border: 1px dashed var(--border-color); border-radius: var(--border-radius); background: var(--bg-card);">
        <span style="font-size: 44px; display:block; margin-bottom:12px;">🛵</span>
        <h3 style="font-size:16px; margin-bottom:4px;">No Pending Dispatches</h3>
        <p style="color:var(--text-secondary); font-size:13px;">Wait for the kitchen to mark orders as "Ready for Dispatch".</p>
      </div>
    `;
    return;
  }
  
  grid.innerHTML = deliveryOrders.map(order => {
    const isReady = order.status === 'ready_to_deliver';
    
    return `
      <div class="delivery-card" style="${!isReady ? 'border-color: var(--color-info);' : ''}">
        <div class="delivery-card-header">
          <div>
            <span style="font-size:18px; font-weight:700;">${order.id}</span>
            <div style="font-size:11px; color: var(--text-muted); margin-top: 2px;">Prepared ${getElapsedTime(order.createdAt)}</div>
          </div>
          <span class="order-table-badge" style="background: rgba(245, 158, 11, 0.1); border-color: rgba(245, 158, 11, 0.3); color: var(--color-primary); font-size: 13px;">
            Table ${order.table}
          </span>
        </div>
        
        <div class="delivery-items-summary">
          <strong>Items to deliver:</strong>
          <div style="margin-top: 6px; font-family: monospace;">
            ${order.items.map(item => `• ${item.quantity}x ${item.name}`).join('<br>')}
          </div>
        </div>

        ${isReady ? `
          <div class="delivery-checklist-box">
            <div class="delivery-checklist-title">📋 Staff Handoff Checklist</div>
            
            <label class="checklist-point">
              <input type="checkbox" class="dispatch-chk-${order.id}" onchange="checkDispatchForm('${order.id}')">
              <span><strong>Temp Check:</strong> Hot items are insulated, drinks cold.</span>
            </label>
            
            <label class="checklist-point">
              <input type="checkbox" class="dispatch-chk-${order.id}" onchange="checkDispatchForm('${order.id}')">
              <span><strong>Item Count:</strong> Exact quantities match order slip.</span>
            </label>
            
            <label class="checklist-point">
              <input type="checkbox" class="dispatch-chk-${order.id}" onchange="checkDispatchForm('${order.id}')">
              <span><strong>Extras Checklist:</strong> Cutlery, napkins, condiment cups added.</span>
            </label>
            
            <label class="checklist-point">
              <input type="checkbox" class="dispatch-chk-${order.id}" onchange="checkDispatchForm('${order.id}')">
              <span><strong>Payment Status Check:</strong> Settle payment preference at table.</span>
            </label>
          </div>
          
          <button class="btn-dispatch start" id="btn-dispatch-${order.id}" disabled onclick="startOrderDelivery('${order.id}')">
            ⚡ Start Delivery
          </button>
        ` : `
          <div style="text-align: center; padding: 12px; background: rgba(14,165,233,0.05); border: 1px solid rgba(14,165,233,0.15); border-radius: 8px;">
            <span style="font-size: 20px; display:block; margin-bottom: 4px;">🚴</span>
            <span style="font-size: 13.5px; font-weight: 600; color: var(--color-info);">Order is in-transit to Table ${order.table}</span>
          </div>
          
          <button class="btn-dispatch arrive" onclick="completeOrderDelivery('${order.id}')">
            🛎️ Tap upon Arrival / Handoff
          </button>
        `}
      </div>
    `;
  }).join('');
}

function checkDispatchForm(orderId) {
  const checkboxes = document.querySelectorAll(`.dispatch-chk-${orderId}`);
  const btn = document.getElementById(`btn-dispatch-${orderId}`);
  if (!btn) return;
  
  const allChecked = Array.from(checkboxes).every(cb => cb.checked);
  btn.disabled = !allChecked;
}

function startOrderDelivery(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (order) {
    order.status = 'out_for_delivery';
    order.checklistChecked = true;
    localStorage.setItem('aetheria_orders', JSON.stringify(orders));
    addLog(`Staff completed handoff checklist and departed to deliver Order ${orderId} to Table ${order.table}.`);
    showToast(`Order ${orderId} dispatched to table.`, "info");
    renderDeliveryDispatch();
    updateNavBadges();
  }
}

function completeOrderDelivery(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (order) {
    order.status = 'delivered';
    localStorage.setItem('aetheria_orders', JSON.stringify(orders));
    addLog(`Delivery staff arrived at Table ${order.table} and handed over Order ${orderId}.`);
    showToast(`Order ${orderId} delivered. Awaiting confirmation.`, "success");
    renderDeliveryDispatch();
    updateNavBadges();
  }
}

// Admin Panel Tabs Switcher
function switchAdminTab(tab) {
  adminTab = tab;
  
  const btnMenu = document.getElementById('btn-tab-menu');
  const btnSales = document.getElementById('btn-tab-sales');
  
  if (tab === 'menu') {
    btnMenu.classList.add('active');
    btnSales.classList.remove('active');
    renderAdminMenuTable();
  } else {
    btnSales.classList.add('active');
    btnMenu.classList.remove('active');
    renderAdminSales();
  }
}

function renderAdminMenuTable() {
  const container = document.getElementById('admin-main-pane');
  if (!container) return;
  
  container.innerHTML = `
    <div style="margin-bottom: 16px; display:flex; justify-content:space-between; align-items:center;">
      <h3 style="font-size:15px; font-weight:600;">Menu Catalog Ledger</h3>
      <span style="font-size:12px; color: var(--text-muted);">${menu.length} Items Listed</span>
    </div>
    
    <div class="menu-table-container">
      <table class="menu-table">
        <thead>
          <tr>
            <th>Icon</th>
            <th>Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Availability</th>
            <th style="text-align: right;">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${menu.map(item => `
            <tr>
              <td style="font-size:20px;">${item.image}</td>
              <td style="font-weight:600;">${item.name}</td>
              <td>${item.category}</td>
              <td style="font-weight:600; color:var(--color-primary);">$${item.price.toFixed(2)}</td>
              <td>
                <label class="toggle-switch">
                  <input type="checkbox" ${item.available !== false ? 'checked' : ''} onchange="toggleItemAvailability('${item.id}', this.checked)">
                  <span class="slider"></span>
                </label>
              </td>
              <td style="text-align: right;">
                <button class="btn-table-action edit" onclick="editMenuItem('${item.id}')">✏️ Edit</button>
                <button class="btn-table-action delete" onclick="deleteMenuItem('${item.id}')">🗑️ Delete</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function toggleItemAvailability(itemId, available) {
  const item = menu.find(i => i.id === itemId);
  if (item) {
    item.available = available;
    localStorage.setItem('aetheria_menu', JSON.stringify(menu));
    addLog(`Admin updated availability of "${item.name}" to ${available ? 'In Stock' : 'Out of Stock'}.`);
    showToast(`"${item.name}" availability updated.`, "info");
  }
}

function editMenuItem(itemId) {
  const item = menu.find(i => i.id === itemId);
  if (!item) return;
  
  document.getElementById('edit-item-id').value = item.id;
  document.getElementById('item-name').value = item.name;
  document.getElementById('item-price').value = item.price;
  document.getElementById('item-category').value = item.category;
  document.getElementById('item-image').value = item.image;
  document.getElementById('item-desc').value = item.description;
  
  document.getElementById('form-action-title').textContent = "Edit Menu Item";
  document.getElementById('btn-cancel-edit').style.display = 'block';
  
  showToast(`Editing "${item.name}"`, "info");
}

function cancelEditMenuItem() {
  document.getElementById('edit-item-id').value = "";
  document.getElementById('menu-item-form').reset();
  
  document.getElementById('form-action-title').textContent = "Add Menu Item";
  document.getElementById('btn-cancel-edit').style.display = 'none';
}

function saveMenuItem(e) {
  e.preventDefault();
  
  const id = document.getElementById('edit-item-id').value;
  const name = document.getElementById('item-name').value.trim();
  const price = parseFloat(document.getElementById('item-price').value);
  const category = document.getElementById('item-category').value;
  const image = document.getElementById('item-image').value.trim();
  const description = document.getElementById('item-desc').value.trim();
  
  if (id) {
    const item = menu.find(i => i.id === id);
    if (item) {
      item.name = name;
      item.price = price;
      item.category = category;
      item.image = image;
      item.description = description;
      addLog(`Admin updated item "${name}".`);
      showToast("Menu item updated!", "success");
    }
  } else {
    const newId = 'm-' + Math.floor(Math.random() * 10000);
    menu.push({
      id: newId,
      name,
      price,
      category,
      image,
      description,
      available: true
    });
    addLog(`Admin added new menu item "${name}" ($${price.toFixed(2)}).`);
    showToast("New item added to menu!", "success");
  }
  
  localStorage.setItem('aetheria_menu', JSON.stringify(menu));
  cancelEditMenuItem();
  renderAdminMenuTable();
}

function deleteMenuItem(itemId) {
  const item = menu.find(i => i.id === itemId);
  if (!item) return;
  
  if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
    menu = menu.filter(i => i.id !== itemId);
    localStorage.setItem('aetheria_menu', JSON.stringify(menu));
    addLog(`Admin deleted menu item "${item.name}".`);
    showToast("Item deleted from catalog.", "info");
    
    if (document.getElementById('edit-item-id').value === itemId) {
      cancelEditMenuItem();
    }
    
    renderAdminMenuTable();
  }
}

function renderAdminSales() {
  const container = document.getElementById('admin-main-pane');
  if (!container) return;
  
  const paidOrders = orders.filter(o => o.status === 'completed' && o.paymentStatus === 'paid');
  const unpaidOrders = orders.filter(o => o.status === 'completed' && o.paymentStatus === 'unpaid');
  const activeQueued = orders.filter(o => o.status !== 'completed');
  
  const totalPaidRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
  const totalUnpaidLedger = unpaidOrders.reduce((sum, o) => sum + o.total, 0);
  
  container.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-label">Paid Revenue</span>
        <span class="stat-value revenue">$${totalPaidRevenue.toFixed(2)}</span>
      </div>
      
      <div class="stat-card">
        <span class="stat-label">Checkout Ledger</span>
        <span class="stat-value pending">$${totalUnpaidLedger.toFixed(2)}</span>
      </div>
      
      <div class="stat-card">
        <span class="stat-label">Active Orders</span>
        <span class="stat-value" style="color:var(--color-info);">${activeQueued.length}</span>
      </div>
      
      <div class="stat-card">
        <span class="stat-label">Total Transactions</span>
        <span class="stat-value">${orders.length}</span>
      </div>
    </div>

    <h3 style="font-size:15px; font-weight:600; margin-bottom:12px;">Closed Transactions Ledger</h3>
    <div class="menu-table-container">
      <table class="menu-table" style="font-size: 13px;">
        <thead>
          <tr>
            <th>Order Ref</th>
            <th>Table</th>
            <th>Time Closed</th>
            <th>Total Billing</th>
            <th>Checkout Settlement</th>
          </tr>
        </thead>
        <tbody>
          ${orders.filter(o => o.status === 'completed').length === 0 ? `
            <tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:20px;">No transaction records found.</td></tr>
          ` : orders.filter(o => o.status === 'completed').map(o => `
            <tr>
              <td style="font-family:monospace; font-weight:600;">${o.id}</td>
              <td style="font-weight:600;">Table ${o.table}</td>
              <td>${new Date(o.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
              <td style="font-weight:600; color:var(--color-primary);">$${o.total.toFixed(2)}</td>
              <td>
                <span class="nav-badge ${o.paymentStatus === 'paid' ? 'success' : 'info'}" style="font-size:10px; border-radius:4px; padding:3px 6px;">
                  ${o.paymentStatus === 'paid' ? 'Paid (Card)' : 'Room/Table Bill'}
                </span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// Utilities & System
function getFormattedTime() {
  const d = new Date();
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function addLog(text) {
  const time = getFormattedTime();
  logs.unshift({ time, text });
  if (logs.length > 50) logs.pop();
  localStorage.setItem('aetheria_logs', JSON.stringify(logs));
  renderLogs();
}

function renderLogs() {
  const container = document.getElementById('activity-logs-container');
  if (!container) return;
  container.innerHTML = logs.map(log => `
    <div class="log-entry">
      <span class="log-time">[${log.time}]</span> ${log.text}
    </div>
  `).join('');
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'danger') icon = '🚨';
  
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3200);
}
