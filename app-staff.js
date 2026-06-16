// Application State
let menu = [];
let orders = [];
let currentScreen = 'kitchen-monitor-screen';
let adminTab = 'menu';
let logs = [];
let currentUserRole = null;

// Categories & Date Filters State
let categoriesList = [];
let salesStartDate = '';
let salesEndDate = '';

// Initialize App
window.addEventListener('DOMContentLoaded', () => {
  currentUserRole = localStorage.getItem('aetheria_role') || null;
  
  initData();
  renderLogs();
  
  // Apply visual roles
  applyStaffSession();
});

// Watch for changes from other tabs
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
  if (e.key === 'aetheria_categories' || e.key === 'aetheria_categories_trigger') {
    const savedCats = localStorage.getItem('aetheria_categories');
    if (savedCats) {
      categoriesList = JSON.parse(savedCats);
      updateCategoryDropdown();
      if (currentScreen === 'admin-manager-screen' && adminTab === 'categories') {
        renderAdminCategories();
      }
    }
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

  const savedCats = localStorage.getItem('aetheria_categories');
  if (savedCats) {
    categoriesList = JSON.parse(savedCats);
  } else {
    categoriesList = ['Mains', 'Drinks', 'Desserts', 'Sides'];
    localStorage.setItem('aetheria_categories', JSON.stringify(categoriesList));
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
    
    updateCategoryDropdown();
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
  const disputedContainer = document.getElementById('kitchen-disputed-container');
  
  if (!pendingContainer || !preparingContainer || !readyContainer) return;
  
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready_to_deliver' || o.status === 'out_for_delivery' || o.status === 'delivered');
  const disputedOrders = orders.filter(o => o.status === 'issue');
  
  document.getElementById('kitchen-pending-count').textContent = pendingOrders.length;
  document.getElementById('kitchen-preparing-count').textContent = preparingOrders.length;
  document.getElementById('kitchen-ready-count').textContent = readyOrders.length;
  
  if (disputedContainer) {
    document.getElementById('kitchen-disputed-count').textContent = disputedOrders.length;
    if (disputedOrders.length === 0) {
      disputedContainer.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size:13px; border: 1px dashed var(--border-color); border-radius:8px;">No active issues</div>`;
    } else {
      disputedContainer.innerHTML = disputedOrders.map(order => `
        <div class="kitchen-order-card" style="border-color: var(--color-danger); box-shadow: 0 0 10px rgba(244,63,94,0.15);">
          <div class="order-card-header">
            <span class="order-num" style="color:var(--color-danger);">${order.id}</span>
            <span class="order-table-badge" style="background:rgba(244,63,94,0.15); color:var(--color-danger);">Table ${order.table}</span>
          </div>
          <div style="font-size:12px; font-weight:600; color:var(--color-danger); margin-bottom: 6px;">⚠️ Guest reported issue!</div>
          
          <div style="background: rgba(244,63,94,0.08); border: 1px solid rgba(244,63,94,0.15); border-radius: 6px; padding: 8px; font-size: 12px; color: var(--color-danger); margin-bottom: 10px; text-align: left;">
            <strong>Guest note:</strong> "${order.deliveryIssueNotes || 'No notes left'}"
          </div>
          
          <div class="order-items-checklist" style="margin-bottom: 10px;">
            ${order.items.map(item => `
              <div style="font-size:12px; opacity:0.8; text-align: left; margin-bottom: 4px;">
                • ${item.quantity}x ${item.name}
                ${item.note ? `<div style="color:var(--color-primary); font-size:11px; margin-left: 10px; font-style:italic;">✍️ Note: ${item.note}</div>` : ''}
              </div>
            `).join('')}
          </div>
          
          <div class="kitchen-actions">
            <button class="btn-kitchen-action accept" style="border-color: rgba(244,63,94,0.3); color: var(--color-danger); background: rgba(244,63,94,0.05);" onclick="reprepareOrder('${order.id}')">Re-prepare Food</button>
          </div>
        </div>
      `).join('');
    }
  }
  
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
            <div class="checklist-item" style="text-align: left; display: block; margin-bottom: 4px;">
              <span>• ${item.quantity}x <strong>${item.name}</strong></span>
              ${item.note ? `<div style="font-size:11px; color:var(--color-primary); margin-left: 10px; font-style:italic;">✍️ Note: ${item.note}</div>` : ''}
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
            <label class="checklist-item" id="chk-label-${order.id}-${idx}" style="text-align: left; display:block; margin-bottom: 4px;">
              <input type="checkbox" onchange="toggleKitchenCheckbox(this, 'chk-label-${order.id}-${idx}')">
              <span>${item.quantity}x <strong>${item.name}</strong></span>
              ${item.note ? `<div style="font-size:11px; color:var(--color-primary); margin-left: 20px; font-style:italic;">✍️ Note: ${item.note}</div>` : ''}
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
      }
      
      return `
        <div class="kitchen-order-card" style="border-color: ${statusColor};">
          <div class="order-card-header">
            <span class="order-num">${order.id}</span>
            <span class="order-table-badge">Table ${order.table}</span>
          </div>
          <div style="font-size:12px; font-weight: 600; color: ${statusColor};">${statusText}</div>
          <div class="order-items-checklist" style="margin-top: 8px;">
            ${order.items.map(item => `
              <div style="font-size:12px; opacity:0.8; text-align: left;">• ${item.quantity}x ${item.name}</div>
            `).join('')}
          </div>
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
  const btnCategories = document.getElementById('btn-tab-categories');
  const btnSales = document.getElementById('btn-tab-sales');
  
  // Reset all active classes
  [btnMenu, btnCategories, btnSales].forEach(btn => {
    if (btn) btn.classList.remove('active');
  });
  
  const formCard = document.getElementById('admin-form-container');
  if (formCard) {
    if (tab === 'menu') {
      formCard.style.display = 'block';
    } else {
      formCard.style.display = 'none';
    }
  }
  
  if (tab === 'menu') {
    if (btnMenu) btnMenu.classList.add('active');
    renderAdminMenuTable();
    updateCategoryDropdown();
  } else if (tab === 'categories') {
    if (btnCategories) btnCategories.classList.add('active');
    renderAdminCategories();
  } else if (tab === 'sales') {
    if (btnSales) btnSales.classList.add('active');
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
            <th>Prep</th>
            <th>Tags</th>
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
              <td>~${item.prepTime || 10}m</td>
              <td>
                <div style="display:flex; flex-wrap:wrap; gap:4px; max-width:180px;">
                  ${item.tags && item.tags.length > 0 ? item.tags.map(t => `<span style="font-size:9px; background:rgba(255,255,255,0.06); padding:2px 5px; border-radius:4px; text-transform:uppercase;">${t}</span>`).join('') : '<span style="color:var(--text-muted); font-size:11px;">none</span>'}
                </div>
              </td>
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
  document.getElementById('item-preptime').value = item.prepTime || 10;
  
  // Set checkboxes
  const checkboxes = document.querySelectorAll('input[name="dietary-tag"]');
  checkboxes.forEach(cb => {
    cb.checked = item.tags && item.tags.includes(cb.value);
  });
  
  document.getElementById('form-action-title').textContent = "Edit Menu Item";
  document.getElementById('btn-cancel-edit').style.display = 'block';
  
  showToast(`Editing "${item.name}"`, "info");
}

function cancelEditMenuItem() {
  document.getElementById('edit-item-id').value = "";
  document.getElementById('menu-item-form').reset();
  
  // Reset checkboxes
  const checkboxes = document.querySelectorAll('input[name="dietary-tag"]');
  checkboxes.forEach(cb => {
    cb.checked = false;
  });
  
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
  const prepTime = parseInt(document.getElementById('item-preptime').value) || 10;
  
  const checkboxes = document.querySelectorAll('input[name="dietary-tag"]:checked');
  const tags = Array.from(checkboxes).map(cb => cb.value);
  
  if (id) {
    const item = menu.find(i => i.id === id);
    if (item) {
      item.name = name;
      item.price = price;
      item.category = category;
      item.image = image;
      item.description = description;
      item.prepTime = prepTime;
      item.tags = tags;
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
      prepTime,
      tags,
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

  // Apply date range filter
  let filteredOrders = orders;
  if (salesStartDate) {
    const start = new Date(salesStartDate);
    filteredOrders = filteredOrders.filter(o => new Date(o.createdAt) >= start);
  }
  if (salesEndDate) {
    const end = new Date(salesEndDate);
    end.setHours(23, 59, 59, 999);
    filteredOrders = filteredOrders.filter(o => new Date(o.createdAt) <= end);
  }

  const completed = filteredOrders.filter(o => o.status === 'completed');
  const paidOrders = completed.filter(o => o.paymentStatus === 'paid');
  const unpaidOrders = completed.filter(o => o.paymentStatus === 'unpaid');
  const activeQueued = orders.filter(o => o.status !== 'completed');

  const totalPaidRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
  const totalUnpaidLedger = unpaidOrders.reduce((sum, o) => sum + o.total, 0);

  // Average ETA (prepTime-based) from completed orders
  const ordersWithEta = completed.filter(o => o.etaMinutes);
  const avgEta = ordersWithEta.length > 0
    ? Math.round(ordersWithEta.reduce((s, o) => s + o.etaMinutes, 0) / ordersWithEta.length)
    : null;

  // Guest ratings summary
  const ratedOrders = completed.filter(o => o.rating !== null && o.rating !== undefined);
  const avgRating = ratedOrders.length > 0
    ? (ratedOrders.reduce((s, o) => s + o.rating, 0) / ratedOrders.length).toFixed(1)
    : null;

  const issueCount = orders.filter(o => o.status === 'issue').length
    + completed.filter(o => o.deliveryIssueNotes).length;

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:10px;">
      <h3 style="font-size:15px; font-weight:600;">Sales &amp; Analytics Dashboard</h3>
      <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
        <label style="font-size:12px; color:var(--text-muted);">From</label>
        <input type="date" id="sales-start-date" value="${salesStartDate}" onchange="setSalesDateFilter()" class="form-control" style="padding:5px 8px; font-size:12px; width:140px;">
        <label style="font-size:12px; color:var(--text-muted);">To</label>
        <input type="date" id="sales-end-date" value="${salesEndDate}" onchange="setSalesDateFilter()" class="form-control" style="padding:5px 8px; font-size:12px; width:140px;">
        <button onclick="clearSalesFilter()" class="btn-reset" style="font-size:12px; padding:5px 12px;">Clear</button>
      </div>
    </div>

    <div class="stats-grid" style="margin-bottom:20px;">
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
        <span class="stat-label">Transactions</span>
        <span class="stat-value">${completed.length}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Avg. ETA</span>
        <span class="stat-value" style="color:var(--color-info);">${avgEta !== null ? avgEta + 'm' : 'N/A'}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Guest Rating</span>
        <span class="stat-value" style="color:var(--color-primary);">${avgRating !== null ? '⭐ ' + avgRating : 'N/A'}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Issue Reports</span>
        <span class="stat-value" style="color:${issueCount > 0 ? 'var(--color-danger)' : 'var(--color-success)'};">${issueCount}</span>
      </div>
    </div>

    <h3 style="font-size:15px; font-weight:600; margin-bottom:12px;">Closed Transactions Ledger</h3>
    <div class="menu-table-container">
      <table class="menu-table" style="font-size: 13px;">
        <thead>
          <tr>
            <th>Order Ref</th>
            <th>Table</th>
            <th>Date/Time</th>
            <th>ETA</th>
            <th>Rating</th>
            <th>Total</th>
            <th>Settlement</th>
          </tr>
        </thead>
        <tbody>
          ${completed.length === 0 ? `
            <tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:20px;">No transaction records found.</td></tr>
          ` : completed.map(o => `
            <tr>
              <td style="font-family:monospace; font-weight:600;">${o.id}</td>
              <td style="font-weight:600;">Table ${o.table}</td>
              <td>${new Date(o.createdAt).toLocaleDateString([], {month:'short', day:'numeric'})}&nbsp;
                  ${new Date(o.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
              <td>${o.etaMinutes ? o.etaMinutes + 'm' : '—'}</td>
              <td>${o.rating ? '⭐'.repeat(o.rating) : '—'}</td>
              <td style="font-weight:600; color:var(--color-primary);">$${o.total.toFixed(2)}</td>
              <td>
                <span class="nav-badge ${o.paymentStatus === 'paid' ? 'success' : 'info'}" style="font-size:10px; border-radius:4px; padding:3px 6px;">
                  ${o.paymentStatus === 'paid' ? 'Paid (Card)' : 'Room Bill'}
                </span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function setSalesDateFilter() {
  salesStartDate = document.getElementById('sales-start-date').value;
  salesEndDate = document.getElementById('sales-end-date').value;
  renderAdminSales();
}

function clearSalesFilter() {
  salesStartDate = '';
  salesEndDate = '';
  renderAdminSales();
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
  if (container) container.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3200);
}

// ─── Category Management ───────────────────────────────────────────────────
function updateCategoryDropdown() {
  const select = document.getElementById('item-category');
  if (!select) return;
  select.innerHTML = categoriesList.map(cat =>
    `<option value="${cat}">${cat}</option>`
  ).join('');
}

function renderAdminCategories() {
  const container = document.getElementById('admin-main-pane');
  if (!container) return;

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
      <h3 style="font-size:15px; font-weight:600;">Category Management</h3>
      <span style="font-size:12px; color:var(--text-muted);">${categoriesList.length} categories</span>
    </div>

    <div class="admin-form-card" style="margin-bottom:20px; padding:16px;">
      <h4 style="font-size:13px; font-weight:600; margin-bottom:12px; color:var(--text-secondary);">Add New Category</h4>
      <div style="display:flex; gap:10px; align-items:center;">
        <input type="text" id="new-category-input" class="form-control" placeholder="e.g. Soups, Salads, Specials…"
               style="flex:1;" onkeydown="if(event.key==='Enter') addCategory()">
        <button class="btn-form-submit" style="padding:9px 18px; white-space:nowrap;" onclick="addCategory()">
          + Add
        </button>
      </div>
    </div>

    <div class="menu-table-container">
      <table class="menu-table" style="font-size:13px;">
        <thead>
          <tr>
            <th>#</th>
            <th>Category Name</th>
            <th>Items Count</th>
            <th style="text-align:right;">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${categoriesList.length === 0 ? `
            <tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:20px;">No categories yet.</td></tr>
          ` : categoriesList.map((cat, idx) => {
            const count = menu.filter(item => item.category === cat).length;
            return `
              <tr>
                <td style="color:var(--text-muted);">${idx + 1}</td>
                <td style="font-weight:600;" id="cat-label-${idx}">${cat}</td>
                <td>${count} item${count !== 1 ? 's' : ''}</td>
                <td style="text-align:right;">
                  <button class="btn-table-action edit" onclick="renameCategory(${idx})">✏️ Rename</button>
                  <button class="btn-table-action delete" onclick="deleteCategory(${idx})" ${count > 0 ? 'disabled title="Remove all items first"' : ''}>
                    🗑️ Delete
                  </button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function addCategory() {
  const input = document.getElementById('new-category-input');
  if (!input) return;
  const name = input.value.trim();
  if (!name) { showToast('Please enter a category name.', 'danger'); return; }
  if (categoriesList.map(c => c.toLowerCase()).includes(name.toLowerCase())) {
    showToast('Category already exists.', 'danger'); return;
  }
  categoriesList.push(name);
  localStorage.setItem('aetheria_categories', JSON.stringify(categoriesList));
  addLog(`Admin added category "${name}".`);
  showToast(`Category "${name}" added.`, 'success');
  renderAdminCategories();
}

function renameCategory(idx) {
  const oldName = categoriesList[idx];
  const newName = prompt(`Rename "${oldName}" to:`, oldName);
  if (!newName || newName.trim() === '' || newName.trim() === oldName) return;
  const trimmed = newName.trim();
  if (categoriesList.map(c => c.toLowerCase()).includes(trimmed.toLowerCase())) {
    showToast('A category with that name already exists.', 'danger'); return;
  }
  // Update all menu items that use old category
  menu.forEach(item => { if (item.category === oldName) item.category = trimmed; });
  localStorage.setItem('aetheria_menu', JSON.stringify(menu));
  categoriesList[idx] = trimmed;
  localStorage.setItem('aetheria_categories', JSON.stringify(categoriesList));
  addLog(`Admin renamed category "${oldName}" → "${trimmed}".`);
  showToast(`Renamed to "${trimmed}".`, 'success');
  renderAdminCategories();
}

function deleteCategory(idx) {
  const name = categoriesList[idx];
  const count = menu.filter(item => item.category === name).length;
  if (count > 0) { showToast('Remove all items in this category first.', 'danger'); return; }
  if (!confirm(`Delete category "${name}"?`)) return;
  categoriesList.splice(idx, 1);
  localStorage.setItem('aetheria_categories', JSON.stringify(categoriesList));
  addLog(`Admin deleted category "${name}".`);
  showToast(`Category "${name}" deleted.`, 'info');
  renderAdminCategories();
}
