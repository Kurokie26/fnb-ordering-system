// Application State
let menu = [];
let orders = [];
let cart = {}; // { itemId: quantity }
let currentScreen = 'guest-kiosk-screen';
let currentCategory = 'All';
let currentTableNum = '5';
let adminTab = 'menu';
let logs = [];
let currentUserRole = null; // null | 'guest' | 'staff'

// Initialize App
window.addEventListener('DOMContentLoaded', () => {
  // Load session from local storage if available
  currentUserRole = localStorage.getItem('aetheria_role') || null;
  currentTableNum = localStorage.getItem('aetheria_table') || '5';
  
  initData();
  renderCategories();
  renderKioskMenu();
  updateCartUI();
  updateNavBadges();
  renderLogs();
  
  // Update table number inputs
  document.getElementById('table-num-input').value = currentTableNum;
  document.getElementById('cart-table-no').textContent = currentTableNum;
  const gateInput = document.getElementById('gate-table-input');
  if (gateInput) gateInput.value = currentTableNum;

  // Apply visual roles
  applyUserSession();
});

// Session Gate Management
function applyUserSession() {
  const gate = document.getElementById('login-gate-screen');
  const sessionBadge = document.getElementById('session-badge');
  const sessionText = document.getElementById('session-role-text');
  const logoutBtn = document.getElementById('logout-btn');
  const sidebarRoleTitle = document.getElementById('sidebar-role-title');
  
  if (!gate) return;

  if (currentUserRole === null) {
    gate.style.display = 'flex';
    if (sessionBadge) sessionBadge.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
  } else {
    gate.style.display = 'none';
    
    if (sessionBadge) {
      sessionBadge.style.display = 'inline-flex';
      sessionText.textContent = currentUserRole === 'guest' ? `Guest (Table ${currentTableNum})` : 'Staff Operations';
      sessionText.style.color = currentUserRole === 'guest' ? 'var(--color-primary)' : 'var(--color-info)';
    }
    if (logoutBtn) logoutBtn.style.display = 'inline-block';
    
    // Toggle nav items based on role
    if (currentUserRole === 'guest') {
      document.querySelectorAll('.guest-nav').forEach(el => el.style.display = 'flex');
      document.querySelectorAll('.staff-nav').forEach(el => el.style.display = 'none');
      if (sidebarRoleTitle) sidebarRoleTitle.textContent = "Dining Terminal";
      switchScreen('guest-kiosk-screen');
    } else {
      document.querySelectorAll('.staff-nav').forEach(el => el.style.display = 'flex');
      document.querySelectorAll('.guest-nav').forEach(el => el.style.display = 'none');
      if (sidebarRoleTitle) sidebarRoleTitle.textContent = "Staff Operations";
      switchScreen('kitchen-monitor-screen');
    }
  }
}

function loginAsGuest() {
  const tableVal = document.getElementById('gate-table-input').value.trim();
  if (!tableVal) {
    showToast("Please enter a Table / Room number.", "danger");
    return;
  }
  
  currentTableNum = tableVal.replace(/[^a-zA-Z0-9]/g, '');
  currentUserRole = 'guest';
  
  localStorage.setItem('aetheria_role', 'guest');
  localStorage.setItem('aetheria_table', currentTableNum);
  
  document.getElementById('table-num-input').value = currentTableNum;
  document.getElementById('cart-table-no').textContent = currentTableNum;
  
  applyUserSession();
  addLog(`Guest logged in at Table ${currentTableNum}.`);
  showToast(`Welcome! Dining terminal open for Table ${currentTableNum}.`, "success");
}

function loginAsStaff(e) {
  if (e) e.preventDefault();
  const usernameVal = document.getElementById('gate-username').value.trim();
  const passwordVal = document.getElementById('gate-password').value;
  
  if (usernameVal.toLowerCase() === 'admin' && passwordVal === 'admin') {
    currentUserRole = 'staff';
    localStorage.setItem('aetheria_role', 'staff');
    
    applyUserSession();
    addLog("Staff Backoffice credentials verified. Logged in.");
    showToast("Login successful. Welcome back!", "success");
    
    document.getElementById('gate-username').value = '';
    document.getElementById('gate-password').value = '';
  } else {
    showToast("Invalid credentials. Use admin / admin for demo.", "danger");
  }
}

function logout() {
  addLog(`${currentUserRole === 'guest' ? `Guest Table ${currentTableNum}` : 'Staff'} logged out.`);
  currentUserRole = null;
  localStorage.removeItem('aetheria_role');
  
  applyUserSession();
  showToast("Logged out of portal.", "info");
}

// Data Initialization (Sync with Local Storage)
function initData() {
  // Initialize Menu
  const savedMenu = localStorage.getItem('aetheria_menu');
  if (savedMenu) {
    menu = JSON.parse(savedMenu);
  } else {
    menu = [...DEFAULT_MENU];
    localStorage.setItem('aetheria_menu', JSON.stringify(menu));
  }

  // Initialize Orders
  const savedOrders = localStorage.getItem('aetheria_orders');
  if (savedOrders) {
    orders = JSON.parse(savedOrders);
  } else {
    orders = [];
    localStorage.setItem('aetheria_orders', JSON.stringify(orders));
  }

  // Initialize Logs
  const savedLogs = localStorage.getItem('aetheria_logs');
  if (savedLogs) {
    logs = JSON.parse(savedLogs);
  } else {
    logs = [
      { time: getFormattedTime(), text: "System initialized. Welcome to Aetheria Bistro!" },
      { time: getFormattedTime(), text: "Menu pre-populated with premium fusion items." }
    ];
    localStorage.setItem('aetheria_logs', JSON.stringify(logs));
  }
}

// System Reset
function systemReset() {
  if (confirm("Are you sure you want to reset the simulator? This clears all active orders, custom menu additions, and sales metrics.")) {
    localStorage.removeItem('aetheria_menu');
    localStorage.removeItem('aetheria_orders');
    localStorage.removeItem('aetheria_logs');
    localStorage.removeItem('aetheria_role');
    localStorage.removeItem('aetheria_table');
    cart = {};
    initData();
    
    // Reset view variables
    currentUserRole = null;
    currentScreen = 'guest-kiosk-screen';
    currentCategory = 'All';
    currentTableNum = '5';
    document.getElementById('table-num-input').value = '5';
    const gateInput = document.getElementById('gate-table-input');
    if (gateInput) gateInput.value = '5';
    
    applyUserSession();
    renderCategories();
    renderKioskMenu();
    updateCartUI();
    updateNavBadges();
    renderLogs();
    showToast("Simulator reset successfully!", "info");
  }
}

// Utilities
function getFormattedTime() {
  const d = new Date();
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function addLog(text) {
  const time = getFormattedTime();
  logs.unshift({ time, text });
  // Cap logs at 50 entries
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
  
  // Slide out after 3.5s
  setTimeout(() => {
    toast.classList.add('fade-out');
    // Remove from DOM
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3500);
}

// Screen Routing
function switchScreen(screenId) {
  // Hide all screens
  document.querySelectorAll('.screen-container').forEach(screen => {
    screen.classList.remove('active');
  });
  
  // Show target screen
  const target = document.getElementById(screenId);
  if (target) {
    target.classList.add('active');
    currentScreen = screenId;
  }
  
  // Update sidebar active tab
  document.querySelectorAll('.nav-item').forEach(item => {
    if (item.getAttribute('data-screen') === screenId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Screen-specific triggers
  if (screenId === 'kitchen-monitor-screen') {
    renderKitchenDashboard();
  } else if (screenId === 'delivery-dispatch-screen') {
    renderDeliveryDispatch();
  } else if (screenId === 'guest-receiver-screen') {
    renderGuestReceiver();
  } else if (screenId === 'admin-manager-screen') {
    switchAdminTab(adminTab);
  }
  
  updateNavBadges();
}

// Badge Indicators Update
function updateNavBadges() {
  // Kitchen Badge: pending + preparing orders
  const kitchenCount = orders.filter(o => o.status === 'pending' || o.status === 'preparing').length;
  const kBadge = document.getElementById('kitchen-badge');
  kBadge.textContent = kitchenCount;
  kBadge.style.display = kitchenCount > 0 ? 'inline-block' : 'none';

  // Delivery Badge: ready_to_deliver + out_for_delivery
  const deliveryCount = orders.filter(o => o.status === 'ready_to_deliver' || o.status === 'out_for_delivery').length;
  const dBadge = document.getElementById('delivery-badge');
  dBadge.textContent = deliveryCount;
  dBadge.style.display = deliveryCount > 0 ? 'inline-block' : 'none';

  // Guest Receiver Badge: orders for the active table that are out_for_delivery or delivered
  const receiverCount = orders.filter(o => o.table === currentTableNum && 
    (o.status === 'out_for_delivery' || o.status === 'delivered' || o.status === 'confirmed')).length;
  const rBadge = document.getElementById('receiver-badge');
  rBadge.textContent = receiverCount;
  rBadge.style.display = receiverCount > 0 ? 'inline-block' : 'none';
}

// =======================================
// GUEST KIOSK FLOW CODE
// =======================================

function updateTableNum(val) {
  // Remove non-alphanumeric characters, keep it brief
  currentTableNum = val.replace(/[^a-zA-Z0-9]/g, '').trim();
  document.getElementById('cart-table-no').textContent = currentTableNum || '?';
  localStorage.setItem('aetheria_table', currentTableNum);
  
  // Keep gate input in sync
  const gateInput = document.getElementById('gate-table-input');
  if (gateInput) gateInput.value = currentTableNum;
  
  // Keep header text in sync
  const sessionText = document.getElementById('session-role-text');
  if (sessionText && currentUserRole === 'guest') {
    sessionText.textContent = `Guest (Table ${currentTableNum})`;
  }

  updateCartUI();
  updateNavBadges();
}

function renderCategories() {
  const container = document.getElementById('kiosk-categories-bar');
  if (!container) return;
  
  // Extract unique categories
  const categories = ['All', ...new Set(menu.map(item => item.category))];
  
  container.innerHTML = categories.map(cat => `
    <button class="category-tab ${currentCategory === cat ? 'active' : ''}" onclick="selectCategory('${cat}')">
      ${cat}
    </button>
  `).join('');
}

function selectCategory(cat) {
  currentCategory = cat;
  renderCategories();
  renderKioskMenu();
}

function renderKioskMenu() {
  const grid = document.getElementById('kiosk-menu-grid');
  if (!grid) return;
  
  // Filter menu items
  const filtered = currentCategory === 'All' 
    ? menu 
    : menu.filter(item => item.category === currentCategory);
    
  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; padding: 40px; text-align: center; color: var(--text-secondary);">No menu items found.</div>`;
    return;
  }
  
  grid.innerHTML = filtered.map(item => {
    const qtyInCart = cart[item.id] || 0;
    
    // Check if out of stock
    const isOut = item.available === false;
    
    let actionHTML = '';
    if (isOut) {
      actionHTML = `<span style="color: var(--color-danger); font-size:13px; font-weight:600;">Out of Stock</span>`;
    } else if (qtyInCart > 0) {
      actionHTML = `
        <div class="qty-controller">
          <button class="qty-btn" onclick="adjustQty('${item.id}', -1)">-</button>
          <span class="qty-val">${qtyInCart}</span>
          <button class="qty-btn" onclick="adjustQty('${item.id}', 1)">+</button>
        </div>
      `;
    } else {
      actionHTML = `
        <button class="btn-add-cart" onclick="addToCart('${item.id}')">
          ➕ Add to Order
        </button>
      `;
    }
    
    return `
      <div class="menu-card" style="${isOut ? 'opacity: 0.65; pointer-events: none;' : ''}">
        <div class="menu-card-img-placeholder">
          ${item.image}
          <div class="menu-card-badge">${item.category}</div>
        </div>
        <div class="menu-card-body">
          <div>
            <div class="menu-card-title">${item.name}</div>
            <div class="menu-card-desc">${item.description}</div>
          </div>
          <div class="menu-card-footer">
            <div class="menu-card-price">$${item.price.toFixed(2)}</div>
            <div>${actionHTML}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function addToCart(itemId) {
  const item = menu.find(i => i.id === itemId);
  if (!item || !item.available) {
    showToast("This item is currently unavailable.", "danger");
    return;
  }
  
  cart[itemId] = 1;
  addLog(`Added ${item.name} to Guest order selection.`);
  updateCartUI();
  renderKioskMenu();
}

function adjustQty(itemId, amount) {
  if (!cart[itemId]) return;
  cart[itemId] += amount;
  if (cart[itemId] <= 0) {
    const item = menu.find(i => i.id === itemId);
    if (item) addLog(`Removed ${item.name} from Guest selection.`);
    delete cart[itemId];
  }
  updateCartUI();
  renderKioskMenu();
}

function clearCart() {
  cart = {};
  updateCartUI();
  renderKioskMenu();
  showToast("Cart cleared", "info");
}

function updateCartUI() {
  const container = document.getElementById('cart-items-container');
  const btnCheckout = document.getElementById('btn-place-order');
  if (!container) return;

  const itemIds = Object.keys(cart);
  
  if (itemIds.length === 0) {
    container.innerHTML = `
      <div class="cart-empty-state">
        <div class="cart-empty-icon">🍽️</div>
        <p>No dishes selected.<br>Tap on items in the menu grid to add them here.</p>
      </div>
    `;
    document.getElementById('cart-subtotal').textContent = "$0.00";
    document.getElementById('cart-tax').textContent = "$0.00";
    document.getElementById('cart-total').textContent = "$0.00";
    btnCheckout.disabled = true;
    return;
  }
  
  let subtotal = 0;
  let itemsHTML = '';
  
  itemIds.forEach(id => {
    const item = menu.find(i => i.id === id);
    if (!item) return;
    const qty = cart[id];
    const cost = item.price * qty;
    subtotal += cost;
    
    itemsHTML += `
      <div class="cart-item">
        <div class="cart-item-details">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">$${item.price.toFixed(2)} x ${qty}</div>
        </div>
        <div class="qty-controller">
          <button class="qty-btn" onclick="adjustQty('${id}', -1)">-</button>
          <span class="qty-val">${qty}</span>
          <button class="qty-btn" onclick="adjustQty('${id}', 1)">+</button>
        </div>
      </div>
    `;
  });
  
  const tax = subtotal * 0.08;
  const total = subtotal + tax;
  
  container.innerHTML = itemsHTML;
  document.getElementById('cart-subtotal').textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById('cart-tax').textContent = `$${tax.toFixed(2)}`;
  document.getElementById('cart-total').textContent = `$${total.toFixed(2)}`;
  
  // Disable checkout if table number is blank or cart is empty
  btnCheckout.disabled = !currentTableNum;
}

function placeOrder() {
  if (!currentTableNum) {
    showToast("Please enter a valid Table or Room number.", "danger");
    return;
  }
  
  const itemIds = Object.keys(cart);
  if (itemIds.length === 0) return;
  
  const orderItems = [];
  let subtotal = 0;
  
  itemIds.forEach(id => {
    const item = menu.find(i => i.id === id);
    if (item) {
      const qty = cart[id];
      orderItems.push({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: qty
      });
      subtotal += item.price * qty;
    }
  });
  
  const tax = subtotal * 0.08;
  const total = subtotal + tax;
  const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
  
  const newOrder = {
    id: orderId,
    table: currentTableNum,
    items: orderItems,
    total: parseFloat(total.toFixed(2)),
    status: 'pending', // pending, preparing, ready_to_deliver, out_for_delivery, delivered, confirmed, issue, completed
    paymentStatus: 'unpaid', // unpaid, paid
    paymentMethod: null, // immediate, checkout
    createdAt: new Date().toISOString(),
    checklistChecked: false,
    deliveryIssueNotes: ""
  };
  
  orders.push(newOrder);
  localStorage.setItem('aetheria_orders', JSON.stringify(orders));
  
  // Clear cart
  cart = {};
  updateCartUI();
  renderKioskMenu();
  updateNavBadges();
  
  addLog(`New Order ${orderId} submitted by Table ${currentTableNum} (Total: $${total.toFixed(2)}).`);
  showToast(`Order ${orderId} placed successfully! Sent to Kitchen.`, "success");
}

// =======================================
// KITCHEN SCREEN CODE
// =======================================

function renderKitchenDashboard() {
  const pendingContainer = document.getElementById('kitchen-pending-container');
  const preparingContainer = document.getElementById('kitchen-preparing-container');
  const readyContainer = document.getElementById('kitchen-ready-container');
  
  if (!pendingContainer || !preparingContainer || !readyContainer) return;
  
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready_to_deliver' || o.status === 'out_for_delivery' || o.status === 'delivered' || o.status === 'issue');
  
  // Update Counts
  document.getElementById('kitchen-pending-count').textContent = pendingOrders.length;
  document.getElementById('kitchen-preparing-count').textContent = preparingOrders.length;
  document.getElementById('kitchen-ready-count').textContent = readyOrders.length;
  
  // Render Pending
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
  
  // Render Preparing
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
  
  // Render Ready / Delivery status (for Kitchen oversight)
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

// =======================================
// STAFF DELIVERY DISPATCH SCREEN CODE
// =======================================

function renderDeliveryDispatch() {
  const grid = document.getElementById('delivery-dispatch-grid');
  if (!grid) return;
  
  // Show orders waiting for dispatch (ready_to_deliver) or in-transit (out_for_delivery)
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
          <!-- Staff Delivery and Paid Checklist -->
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
          <!-- In-Transit View -->
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
  
  // Verify all 4 checkboxes are ticked
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
    addLog(`Delivery staff arrived at Table ${order.table} and handed over Order ${orderId}. Awaiting Guest Confirmation.`);
    showToast(`Order ${orderId} delivered. Awaiting confirmation.`, "success");
    renderDeliveryDispatch();
    updateNavBadges();
  }
}

// =======================================
// GUEST RECEIVER & PAYMENT SCREEN CODE
// =======================================

function renderGuestReceiver() {
  const container = document.getElementById('guest-receiver-content');
  if (!container) return;
  
  // Find orders for active table that are in delivery process
  const activeOrdersForTable = orders.filter(o => o.table === currentTableNum && 
    (o.status === 'out_for_delivery' || o.status === 'delivered' || o.status === 'confirmed' || o.status === 'issue'));
    
  if (activeOrdersForTable.length === 0) {
    // Show standard greeting and past order ledger for this table
    const pastTableOrders = orders.filter(o => o.table === currentTableNum && o.status === 'completed');
    
    container.innerHTML = `
      <div class="receiver-center-card">
        <div class="receiver-status-icon">🌌</div>
        <div class="receiver-title">Welcome to Aetheria Bistro</div>
        <div class="receiver-desc">
          Table Number: <strong>${currentTableNum}</strong><br>
          We are ready to serve you. Please use the <strong>Guest Kiosk</strong> panel to select items and place your order.
        </div>
        
        ${pastTableOrders.length > 0 ? `
          <div style="text-align: left; border-top: 1px solid var(--border-color); padding-top: 16px; margin-top: 16px;">
            <h4 style="font-size:12px; text-transform:uppercase; color: var(--text-muted); margin-bottom:10px;">Your Orders This Session</h4>
            <div style="display:flex; flex-direction:column; gap:8px; max-height: 180px; overflow-y:auto; padding-right:4px;">
              ${pastTableOrders.map(o => `
                <div style="display:flex; justify-content:space-between; font-size:13px; padding: 6px 8px; background: rgba(255,255,255,0.02); border-radius:6px;">
                  <span>Order <strong>${o.id}</strong> (${o.paymentStatus === 'paid' ? '💳 Paid Now' : '🏨 Billed to Room'})</span>
                  <span style="font-weight:600;">$${o.total.toFixed(2)}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
    return;
  }
  
  // Display status of the most recent active order
  const order = activeOrdersForTable[activeOrdersForTable.length - 1];
  
  if (order.status === 'out_for_delivery') {
    // In transit
    container.innerHTML = `
      <div class="receiver-center-card" style="border-color: var(--color-info);">
        <div class="receiver-status-icon">🛵</div>
        <div class="receiver-title">Your food is on the way!</div>
        <div class="receiver-desc">
          Order <strong>${order.id}</strong> has left the kitchen.<br>
          Our waitstaff is delivering your fresh dishes to <strong>Table ${order.table}</strong> right now.
        </div>
        <div style="font-size: 13px; color: var(--text-muted); background: rgba(0,0,0,0.15); padding: 10px; border-radius:6px;">
          🚚 Staff verified: Heat insulated | Napkins/Utensils packed
        </div>
      </div>
    `;
  } else if (order.status === 'delivered') {
    // Awaiting delivery receipt confirmation
    container.innerHTML = `
      <div class="receiver-center-card" style="border-color: var(--color-purple); box-shadow: 0 0 25px rgba(139, 92, 246, 0.15);">
        <div class="receiver-status-icon">🛎️</div>
        <div class="receiver-title">Order Arrived at Table ${order.table}!</div>
        <div class="receiver-desc">
          Your order <strong>${order.id}</strong> has been served.<br>
          Please verify your items before confirming:
          <div style="margin-top: 12px; font-family: monospace; font-size: 13px; color: var(--text-primary); text-align: left; background: rgba(255,255,255,0.03); padding: 10px; border-radius: 6px;">
            ${order.items.map(item => `• ${item.quantity}x ${item.name}`).join('<br>')}
          </div>
        </div>
        
        <div class="receiver-actions">
          <button class="btn-receiver yes" onclick="confirmOrderDelivery('${order.id}', true)">
            🟢 Yes, Received & Correct
          </button>
          <button class="btn-receiver no" onclick="showIssueForm('${order.id}')">
            🔴 No, Report Issue
          </button>
        </div>
        
        <div class="issue-form-box" id="issue-form-box" style="display: none;">
          <textarea id="issue-note-input" placeholder="Please describe what was wrong (e.g. missing Truffle Burger, incorrect beverage)..."></textarea>
          <button class="btn-receiver no" style="width:100%;" onclick="submitOrderIssue('${order.id}')">
            Submit Issue to Kitchen
          </button>
        </div>
      </div>
    `;
  } else if (order.status === 'issue') {
    // Reported an issue
    container.innerHTML = `
      <div class="receiver-center-card" style="border-color: var(--color-danger);">
        <div class="receiver-status-icon">⚠️</div>
        <div class="receiver-title" style="color: var(--color-danger);">Issue Sent to Kitchen</div>
        <div class="receiver-desc">
          We apologize for the inconvenience. Your issue report: <br>
          <em style="color: var(--text-primary);">"${order.deliveryIssueNotes}"</em><br>
          has been sent directly to the kitchen chefs for correction and preparation.
        </div>
        <div style="font-size: 13px; color: var(--text-muted);">
          Our service team will arrive at Table ${order.table} shortly.
        </div>
      </div>
    `;
  } else if (order.status === 'confirmed') {
    // Order confirmed correctly, awaiting payment preference
    container.innerHTML = `
      <div class="receiver-center-card" style="border-color: var(--color-success);">
        <div class="receiver-status-icon">💳</div>
        <div class="receiver-title">Select Payment Preference</div>
        <div class="receiver-desc">
          Order <strong>${order.id}</strong> has been received correctly.<br>
          Outstanding Balance: <strong style="color:var(--color-primary); font-size:18px;">$${order.total.toFixed(2)}</strong>
        </div>
        
        <div class="payment-box">
          <div class="payment-methods-grid">
            <div class="payment-method-card" id="pay-method-now" onclick="selectPaymentMethod('${order.id}', 'now')">
              <div class="method-icon">💳</div>
              <div class="method-label">Pay Immediately</div>
              <div style="font-size:11px; color:var(--text-secondary); margin-top:4px;">Credit / Debit card</div>
            </div>
            
            <div class="payment-method-card" id="pay-method-checkout" onclick="selectPaymentMethod('${order.id}', 'checkout')">
              <div class="method-icon">🏨</div>
              <div class="method-label">Pay at Checkout</div>
              <div style="font-size:11px; color:var(--text-secondary); margin-top:4px;">Charge to Table Bill</div>
            </div>
          </div>
          
          <div id="payment-input-area">
            <!-- Credit Card Form or checkout summary will show here -->
          </div>
        </div>
      </div>
    `;
  }
}

function showIssueForm(orderId) {
  const box = document.getElementById('issue-form-box');
  if (box) box.style.display = 'block';
}

function submitOrderIssue(orderId) {
  const note = document.getElementById('issue-note-input').value.trim();
  if (!note) {
    showToast("Please enter details about the issue.", "danger");
    return;
  }
  
  const order = orders.find(o => o.id === orderId);
  if (order) {
    order.status = 'issue';
    order.deliveryIssueNotes = note;
    localStorage.setItem('aetheria_orders', JSON.stringify(orders));
    addLog(`Guest reported issue on Order ${orderId}: "${note}". Kitchen alerted.`);
    showToast("Issue report sent to staff.", "danger");
    renderGuestReceiver();
    updateNavBadges();
  }
}

function confirmOrderDelivery(orderId, isOk) {
  const order = orders.find(o => o.id === orderId);
  if (order && isOk) {
    order.status = 'confirmed';
    localStorage.setItem('aetheria_orders', JSON.stringify(orders));
    addLog(`Guest confirmed correct delivery of Order ${orderId}. Awaiting payment.`);
    showToast("Order receipt confirmed.", "success");
    renderGuestReceiver();
    updateNavBadges();
  }
}

function selectPaymentMethod(orderId, method) {
  const cardNow = document.getElementById('pay-method-now');
  const cardCheckout = document.getElementById('pay-method-checkout');
  const inputArea = document.getElementById('payment-input-area');
  
  if (method === 'now') {
    cardNow.classList.add('selected');
    cardCheckout.classList.remove('selected');
    
    inputArea.innerHTML = `
      <div class="cc-form">
        <div style="font-size: 12px; font-weight:600; text-transform:uppercase; color: var(--color-primary); margin-bottom: 6px;">Secure Payment Details</div>
        <input type="text" class="cc-input" placeholder="Card Number (XXXX XXXX XXXX XXXX)" id="cc-num" maxlength="19">
        <div class="cc-row">
          <input type="text" class="cc-input" placeholder="MM/YY" id="cc-expiry" maxlength="5">
          <input type="password" class="cc-input" placeholder="CVV" id="cc-cvv" maxlength="3">
        </div>
        <button class="btn-form-submit" style="margin-top: 6px;" onclick="processCardPayment('${orderId}')" id="pay-process-btn">
          🔒 Pay $${orders.find(o => o.id === orderId).total.toFixed(2)}
        </button>
      </div>
    `;
  } else {
    cardCheckout.classList.add('selected');
    cardNow.classList.remove('selected');
    
    inputArea.innerHTML = `
      <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); padding: 16px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
        <p style="font-size:13.5px; color: var(--text-secondary); margin-bottom:12px;">
          This amount will be billed to your active table ledger (<strong>Table ${orders.find(o => o.id === orderId).table}</strong>). You can settle the full balance at the front desk upon checkout.
        </p>
        <button class="btn-form-submit" style="background: var(--color-success); color:black; width:100%;" onclick="confirmCheckoutBilling('${orderId}')">
          🏨 Confirm Bill to Room/Table
        </button>
      </div>
    `;
  }
}

function processCardPayment(orderId) {
  const ccNum = document.getElementById('cc-num').value.trim();
  const btn = document.getElementById('pay-process-btn');
  
  if (!ccNum) {
    showToast("Please enter credit card credentials.", "danger");
    return;
  }
  
  // Show processing state
  btn.disabled = true;
  btn.textContent = "Processing Payment...";
  
  setTimeout(() => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      order.status = 'completed';
      order.paymentStatus = 'paid';
      order.paymentMethod = 'immediate';
      localStorage.setItem('aetheria_orders', JSON.stringify(orders));
      
      addLog(`Payment of $${order.total.toFixed(2)} for Order ${orderId} processed successfully via Credit Card.`);
      showToast("Payment Successful!", "success");
      
      // Render Receipt
      renderReceipt(order);
      updateNavBadges();
    }
  }, 1500);
}

function confirmCheckoutBilling(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (order) {
    order.status = 'completed';
    order.paymentStatus = 'unpaid';
    order.paymentMethod = 'checkout';
    localStorage.setItem('aetheria_orders', JSON.stringify(orders));
    
    addLog(`Order ${orderId} ($${order.total.toFixed(2)}) charged to Table ${order.table} bill. Order closed.`);
    showToast("Charged to Room/Table bill.", "success");
    
    renderReceipt(order);
    updateNavBadges();
  }
}

function renderReceipt(order) {
  const container = document.getElementById('guest-receiver-content');
  if (!container) return;
  
  const subtotal = order.total / 1.08;
  const tax = order.total - subtotal;
  
  container.innerHTML = `
    <div class="receiver-center-card" style="border-color: var(--color-success);">
      <div class="receiver-status-icon">🧾</div>
      <div class="receiver-title">Thank You!</div>
      <div class="receiver-desc">
        Your order has been closed. Enjoy your food! Here is your digital receipt:
      </div>
      
      <div class="receipt-box">
        <div class="receipt-title">AETHERIA BISTRO RECEIPT</div>
        <div class="receipt-row">
          <span>Order Reference:</span>
          <strong>${order.id}</strong>
        </div>
        <div class="receipt-row">
          <span>Table/Room:</span>
          <span>Table ${order.table}</span>
        </div>
        <div class="receipt-row">
          <span>Date:</span>
          <span>${new Date(order.createdAt).toLocaleDateString()}</span>
        </div>
        <div class="receipt-divider"></div>
        
        ${order.items.map(item => `
          <div class="receipt-row">
            <span>${item.quantity}x ${item.name}</span>
            <span>$${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        `).join('')}
        
        <div class="receipt-divider"></div>
        <div class="receipt-row">
          <span>Subtotal:</span>
          <span>$${subtotal.toFixed(2)}</span>
        </div>
        <div class="receipt-row">
          <span>Tax (8%):</span>
          <span>$${tax.toFixed(2)}</span>
        </div>
        <div class="receipt-row receipt-total">
          <span>Total Balance:</span>
          <span>$${order.total.toFixed(2)}</span>
        </div>
        <div class="receipt-divider"></div>
        <div class="receipt-row" style="font-weight: 700; text-align: center; justify-content: center; width: 100%; margin-top: 10px;">
          <span>${order.paymentStatus === 'paid' ? '💳 PAID VIA CARD' : '🏨 CHARGED TO ROOM'}</span>
        </div>
      </div>
      
      <button class="btn-receiver yes" style="margin-top: 24px; width: 100%;" onclick="renderGuestReceiver()">
        Done
      </button>
    </div>
  `;
}

// =======================================
// ADMIN SCREEN CODE
// =======================================

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
    showToast(`"${item.name}" status updated.`, "info");
    renderKioskMenu();
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
    // Edit Mode
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
    // Add Mode
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
  renderKioskMenu();
}

function deleteMenuItem(itemId) {
  const item = menu.find(i => i.id === itemId);
  if (!item) return;
  
  if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
    menu = menu.filter(i => i.id !== itemId);
    localStorage.setItem('aetheria_menu', JSON.stringify(menu));
    addLog(`Admin deleted menu item "${item.name}".`);
    showToast("Item deleted from catalog.", "info");
    
    // Clear edit form if deleted item was active in it
    if (document.getElementById('edit-item-id').value === itemId) {
      cancelEditMenuItem();
    }
    
    renderAdminMenuTable();
    renderKioskMenu();
  }
}

function renderAdminSales() {
  const container = document.getElementById('admin-main-pane');
  if (!container) return;
  
  // Calculate Totals
  const paidOrders = orders.filter(o => o.status === 'completed' && o.paymentStatus === 'paid');
  const unpaidOrders = orders.filter(o => o.status === 'completed' && o.paymentStatus === 'unpaid');
  const activeQueued = orders.filter(o => o.status !== 'completed');
  
  const totalPaidRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
  const totalUnpaidLedger = unpaidOrders.reduce((sum, o) => sum + o.total, 0);
  
  container.innerHTML = `
    <!-- Stats Row -->
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

    <!-- Closed Ledger -->
    <h3 style="font-size:15px; font-weight:600; margin-bottom:12px;">Closed Transactions Ledger</h3>
    <div class="menu-table-container">
      <table class="menu-table" style="font-size: 13px;">
        <thead>
          <tr>
            <th>Order Ref</th>
            <th>Table</th>
            <th>Date</th>
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
