// Application State
let menu = [];
let orders = [];
let cart = {}; // { itemId: quantity }
let cartNotes = {}; // { itemId: note }
let currentScreen = 'guest-kiosk-screen';
let currentCategory = 'All';
let currentTableNum = '5';
let logs = []; // Shared logs for tracking
let currentUserRole = null;

// Search & Dietary State
let searchQuery = '';
let selectedDietary = 'all';
let selectedItemIdForModal = null;
let tempRatingValue = null;

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
  
  // Set default values in DOM (if they exist)
  const tableInput = document.getElementById('table-num-input');
  if (tableInput) tableInput.value = currentTableNum;
  
  const cartTableNo = document.getElementById('cart-table-no');
  if (cartTableNo) cartTableNo.textContent = currentTableNum;
  
  const gateInput = document.getElementById('gate-table-input');
  if (gateInput) gateInput.value = currentTableNum;

  // Apply visual roles
  applyGuestSession();
});

// Watch for changes from the Staff Backoffice in other tabs
window.addEventListener('storage', (e) => {
  if (e.key === 'aetheria_orders') {
    orders = JSON.parse(e.newValue || '[]');
    updateNavBadges();
    if (currentScreen === 'guest-receiver-screen') {
      renderGuestReceiver();
    }
    if (currentScreen === 'guest-history-screen') {
      renderOrderHistory();
    }
  }
  if (e.key === 'aetheria_menu') {
    menu = JSON.parse(e.newValue || '[]');
    renderKioskMenu();
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
    logs = [];
  }
}

// Session Gate Management
function applyGuestSession() {
  const gate = document.getElementById('login-gate-screen');
  const topbar = document.getElementById('guest-topbar');
  const main = document.getElementById('guest-main');
  const tabbar = document.getElementById('guest-tabbar');
  const sessionBadge = document.getElementById('session-badge');
  const sessionText = document.getElementById('session-role-text');
  const tablePill = document.getElementById('table-pill-num');

  if (!gate) return;

  if (currentUserRole !== 'guest') {
    gate.style.display = 'flex';
    if (topbar) topbar.style.display = 'none';
    if (main) main.style.display = 'none';
    if (tabbar) tabbar.style.display = 'none';
    if (sessionBadge) sessionBadge.style.display = 'none';
  } else {
    gate.style.display = 'none';
    if (topbar) topbar.style.display = 'flex';
    if (main) main.style.display = 'block';
    if (tabbar) tabbar.style.display = 'flex';
    if (tablePill) tablePill.textContent = currentTableNum;
    if (sessionBadge) {
      sessionBadge.style.display = 'inline-flex';
      if (sessionText) sessionText.textContent = `Table ${currentTableNum}`;
    }

    // Default to the kiosk screen
    switchScreen('guest-kiosk-screen');
  }
}

function loginAsGuest() {
  const gateInput = document.getElementById('gate-table-input');
  if (!gateInput) return;
  const tableVal = gateInput.value.trim();
  if (!tableVal) {
    showToast("Please enter a Table / Room number.", "danger");
    return;
  }
  
  currentTableNum = tableVal.replace(/[^a-zA-Z0-9]/g, '');
  currentUserRole = 'guest';
  
  localStorage.setItem('aetheria_role', 'guest');
  localStorage.setItem('aetheria_table', currentTableNum);
  
  const tableInput = document.getElementById('table-num-input');
  if (tableInput) tableInput.value = currentTableNum;
  
  const cartTableNo = document.getElementById('cart-table-no');
  if (cartTableNo) cartTableNo.textContent = currentTableNum;
  
  applyGuestSession();
  addLog(`Guest logged in at Table ${currentTableNum}.`);
  showToast(`Welcome! Dining terminal open for Table ${currentTableNum}.`, "success");
}

function logout() {
  addLog(`Guest Table ${currentTableNum} left terminal.`);
  currentUserRole = null;
  localStorage.removeItem('aetheria_role');
  
  applyGuestSession();
  showToast("Session ended. Thank you for dining with us!", "info");
}

function updateTableNum(val) {
  currentTableNum = val.replace(/[^a-zA-Z0-9]/g, '').trim();
  const cartTableNo = document.getElementById('cart-table-no');
  if (cartTableNo) cartTableNo.textContent = currentTableNum || '?';
  localStorage.setItem('aetheria_table', currentTableNum);
  
  const gateInput = document.getElementById('gate-table-input');
  if (gateInput) gateInput.value = currentTableNum;
  
  const sessionText = document.getElementById('session-role-text');
  if (sessionText && currentUserRole === 'guest') {
    sessionText.textContent = `Table ${currentTableNum}`;
  }

  updateCartUI();
  updateNavBadges();
}

// Logging Hook
function addLog(text) {
  const d = new Date();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  logs.unshift({ time, text });
  if (logs.length > 50) logs.pop();
  localStorage.setItem('aetheria_logs', JSON.stringify(logs));
}

// Router
function switchScreen(screenId) {
  document.querySelectorAll('.screen-container, .guest-screen').forEach(screen => {
    screen.classList.remove('active');
  });
  
  const target = document.getElementById(screenId);
  if (target) {
    target.classList.add('active');
    currentScreen = screenId;
  }
  
  document.querySelectorAll('.guest-tab-btn').forEach(btn => {
    if (btn.getAttribute('data-screen') === screenId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  if (screenId === 'guest-receiver-screen') {
    renderGuestReceiver();
  } else if (screenId === 'guest-history-screen') {
    renderOrderHistory();
  }
  
  updateNavBadges();
}

function updateNavBadges() {
  // Receiver badge dot
  const receiverCount = orders.filter(o => o.table === currentTableNum &&
    (o.status === 'out_for_delivery' || o.status === 'delivered' || o.status === 'confirmed')).length;
  const rBadge = document.getElementById('receiver-badge');
  if (rBadge) {
    rBadge.style.display = receiverCount > 0 ? 'block' : 'none';
  }

  // Floating cart button
  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const floatingBtn = document.getElementById('floating-cart-btn');
  const floatingCount = document.getElementById('floating-cart-count');
  if (floatingBtn) {
    floatingBtn.style.display = cartCount > 0 && currentUserRole === 'guest' ? 'flex' : 'none';
    if (floatingCount) floatingCount.textContent = cartCount;
  }
}

// Kiosk Utilities
function renderCategories() {
  const container = document.getElementById('kiosk-categories-bar');
  if (!container) return;
  
  const categories = ['All', ...new Set(menu.map(item => item.category))];
  
  container.innerHTML = categories.map(cat => `
    <button class="category-tab ${currentCategory === cat ? 'active' : ''}" onclick="selectCategory('${cat}')">
      ${cat}
    </button>
  `).join('');
}

function selectDietaryFilter(tag) {
  selectedDietary = tag;
  
  // Toggle active class on filter buttons
  document.querySelectorAll('.dietary-filter-btn').forEach(btn => {
    if (btn.getAttribute('data-tag') === tag) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  renderKioskMenu();
}

function filterMenuSearch() {
  const searchInput = document.getElementById('menu-search');
  if (searchInput) {
    searchQuery = searchInput.value;
    renderKioskMenu();
  }
}

function renderKioskMenu() {
  const grid = document.getElementById('kiosk-menu-grid');
  if (!grid) return;
  
  let filtered = currentCategory === 'All' 
    ? menu 
    : menu.filter(item => item.category === currentCategory);
    
  // Filter by search query
  if (searchQuery) {
    const q = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(item => 
      item.name.toLowerCase().includes(q) || 
      item.description.toLowerCase().includes(q)
    );
  }
  
  // Filter by dietary tag
  if (selectedDietary !== 'all') {
    filtered = filtered.filter(item => 
      item.tags && item.tags.includes(selectedDietary)
    );
  }
  
  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; padding: 40px; text-align: center; color: var(--text-secondary);">No menu items found.</div>`;
    return;
  }
  
  grid.innerHTML = filtered.map(item => {
    const qtyInCart = cart[item.id] || 0;
    const isOut = item.available === false;
    
    let actionHTML = '';
    if (isOut) {
      actionHTML = `<span style="color: var(--color-danger); font-size:13px; font-weight:600;">Out of Stock</span>`;
    } else if (qtyInCart > 0) {
      actionHTML = `
        <div class="qty-controller" onclick="event.stopPropagation()">
          <button class="qty-btn" onclick="adjustQty('${item.id}', -1)">-</button>
          <span class="qty-val">${qtyInCart}</span>
          <button class="qty-btn" onclick="adjustQty('${item.id}', 1)">+</button>
        </div>
      `;
    } else {
      actionHTML = `
        <button class="btn-add-cart" onclick="event.stopPropagation(); openItemModal('${item.id}')">
          ➕ Add
        </button>
      `;
    }
    
    const tagsHTML = typeof renderTagBadges === 'function' ? renderTagBadges(item.tags) : '';
    
    return `
      <div class="menu-card" onclick="openItemModal('${item.id}')" style="${isOut ? 'opacity: 0.65; pointer-events: none;' : 'cursor:pointer;'}">
        <div class="menu-card-img-placeholder">
          ${item.image}
          <div class="menu-card-badge">${item.category}</div>
        </div>
        <div class="menu-card-body">
          <div>
            <div class="menu-card-title">${item.name}</div>
            <div class="menu-card-desc">${item.description}</div>
            <div style="margin-top: 4px; display: flex; flex-wrap: wrap;">${tagsHTML}</div>
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

// Item Detail Modal Actions
function openItemModal(itemId) {
  const item = menu.find(i => i.id === itemId);
  if (!item || !item.available) return;
  
  selectedItemIdForModal = itemId;
  const overlay = document.getElementById('item-modal-overlay');
  const modal = document.getElementById('item-modal');
  if (!overlay || !modal) return;
  
  const currentQty = cart[itemId] || 1;
  const currentNote = cartNotes[itemId] || '';
  const tagsHTML = typeof renderTagBadges === 'function' ? renderTagBadges(item.tags) : '';
  
  modal.innerHTML = `
    <div class="item-modal-hero">
      ${item.image}
      <button class="item-modal-close-btn" onclick="closeItemModal()">✕</button>
    </div>
    <div class="item-modal-body">
      <div class="item-modal-name">${item.name}</div>
      <div class="item-modal-price">$${item.price.toFixed(2)}</div>
      <div class="item-modal-desc">${item.description}</div>
      
      <div style="margin-bottom:12px; display:flex; flex-wrap:wrap;">
        ${tagsHTML}
      </div>
      
      <div class="item-modal-section-label">⏱️ Estimated Prep Time</div>
      <div style="font-size:13px; color:var(--text-secondary); margin-bottom:12px;">
        ~${item.prepTime || 10} minutes
      </div>

      <div class="item-modal-section-label">✍️ Special Instructions / Notes</div>
      <textarea class="special-instructions-input" id="modal-item-note" placeholder="E.g., No onions, extra spicy, sauce on the side..." rows="3">${currentNote}</textarea>
    </div>
    <div class="item-modal-footer">
      <div class="modal-qty-controller">
        <button class="modal-qty-btn" onclick="adjustModalQty(-1)">-</button>
        <span class="modal-qty-val" id="modal-qty-val">${currentQty}</span>
        <button class="modal-qty-btn" onclick="adjustModalQty(1)">+</button>
      </div>
      <button class="btn-add-to-order" onclick="submitModalToCart()">
        ➕ Add to Order
      </button>
    </div>
  `;
  
  overlay.classList.add('open');
}

function closeItemModal() {
  const overlay = document.getElementById('item-modal-overlay');
  if (overlay) overlay.classList.remove('open');
  selectedItemIdForModal = null;
}

function closeItemModalOnOutsideClick(e) {
  if (e.target === document.getElementById('item-modal-overlay')) {
    closeItemModal();
  }
}

function adjustModalQty(amount) {
  const qtyValEl = document.getElementById('modal-qty-val');
  if (!qtyValEl) return;
  let currentQty = parseInt(qtyValEl.textContent) || 1;
  currentQty += amount;
  if (currentQty < 1) currentQty = 1;
  qtyValEl.textContent = currentQty;
}

function submitModalToCart() {
  if (!selectedItemIdForModal) return;
  const itemId = selectedItemIdForModal;
  const item = menu.find(i => i.id === itemId);
  if (!item) return;
  
  const qtyValEl = document.getElementById('modal-qty-val');
  const qty = qtyValEl ? (parseInt(qtyValEl.textContent) || 1) : 1;
  
  const noteEl = document.getElementById('modal-item-note');
  const note = noteEl ? noteEl.value.trim() : '';
  
  cart[itemId] = qty;
  if (note) {
    cartNotes[itemId] = note;
  } else {
    delete cartNotes[itemId];
  }
  
  addLog(`Added ${qty}x ${item.name} to Table ${currentTableNum} order selection.`);
  showToast(`${qty}x ${item.name} added to cart`, "success");
  
  closeItemModal();
  updateCartUI();
  renderKioskMenu();
}

function addToCart(itemId) {
  const item = menu.find(i => i.id === itemId);
  if (!item || !item.available) {
    showToast("This item is currently unavailable.", "danger");
    return;
  }
  
  cart[itemId] = 1;
  addLog(`Added ${item.name} to Table ${currentTableNum} order selection.`);
  updateCartUI();
  renderKioskMenu();
}

function adjustQty(itemId, amount) {
  if (!cart[itemId]) return;
  cart[itemId] += amount;
  if (cart[itemId] <= 0) {
    const item = menu.find(i => i.id === itemId);
    if (item) addLog(`Removed ${item.name} from Table ${currentTableNum} selection.`);
    delete cart[itemId];
    delete cartNotes[itemId];
  }
  updateCartUI();
  renderKioskMenu();
}

function clearCart() {
  cart = {};
  cartNotes = {};
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
    const note = cartNotes[id];
    
    itemsHTML += `
      <div class="cart-item">
        <div class="cart-item-details" onclick="openItemModal('${id}')" style="cursor:pointer; flex: 1; margin-right: 8px;">
          <div class="cart-item-name" style="font-weight: 600;">${item.name}</div>
          <div class="cart-item-price" style="font-size: 13px; color: var(--text-secondary);">$${item.price.toFixed(2)} x ${qty}</div>
          ${note ? `<div class="cart-item-note">✍️ Note: ${note}</div>` : ''}
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
  btnCheckout.disabled = !currentTableNum;
}

function placeOrder() {
  if (!currentTableNum) {
    showToast("Please enter a valid Table or Room number.", "danger");
    return;
  }

  // Close cart modal if open (guest.html specific)
  const cartOverlay = document.getElementById('cart-modal-overlay');
  if (cartOverlay) cartOverlay.classList.remove('open');

  const itemIds = Object.keys(cart);
  if (itemIds.length === 0) return;
  
  const orderItems = [];
  let subtotal = 0;
  let maxPrepTime = 0;
  
  itemIds.forEach(id => {
    const item = menu.find(i => i.id === id);
    if (item) {
      const qty = cart[id];
      orderItems.push({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: qty,
        note: cartNotes[item.id] || ""
      });
      subtotal += item.price * qty;
      
      if (item.prepTime && item.prepTime > maxPrepTime) {
        maxPrepTime = item.prepTime;
      }
    }
  });
  
  const tax = subtotal * 0.08;
  const total = subtotal + tax;
  const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
  
  if (maxPrepTime === 0) maxPrepTime = 15; // default prep time fallback
  const etaMinutes = maxPrepTime + 5;
  const etaTimestamp = new Date(new Date().getTime() + etaMinutes * 60000).toISOString();
  
  const newOrder = {
    id: orderId,
    table: currentTableNum,
    items: orderItems,
    total: parseFloat(total.toFixed(2)),
    status: 'pending',
    paymentStatus: 'unpaid',
    paymentMethod: null,
    createdAt: new Date().toISOString(),
    checklistChecked: false,
    deliveryIssueNotes: "",
    etaMinutes: etaMinutes,
    etaTimestamp: etaTimestamp,
    rating: null,
    ratingComment: ""
  };
  
  orders.push(newOrder);
  localStorage.setItem('aetheria_orders', JSON.stringify(orders));
  
  // Clear cart & switch tabs to Receiver
  cart = {};
  cartNotes = {};
  updateCartUI();
  renderKioskMenu();
  updateNavBadges();
  
  addLog(`New Order ${orderId} submitted by Table ${currentTableNum} (Total: $${total.toFixed(2)}).`);
  showToast(`Order ${orderId} placed successfully! Kitchen has received it.`, "success");
  
  // Switch to active order status tab
  switchScreen('guest-receiver-screen');
}

// Receiver View
function renderGuestReceiver() {
  const container = document.getElementById('guest-receiver-content');
  if (!container) return;
  
  const activeOrdersForTable = orders.filter(o => o.table === currentTableNum && 
    (o.status === 'out_for_delivery' || o.status === 'delivered' || o.status === 'confirmed' || o.status === 'issue' || o.status === 'pending' || o.status === 'preparing' || o.status === 'ready_to_deliver'));
    
  if (activeOrdersForTable.length === 0) {
    const pastTableOrders = orders.filter(o => o.table === currentTableNum && o.status === 'completed');
    
    container.innerHTML = `
      <div class="receiver-center-card">
        <div class="receiver-status-icon">🌌</div>
        <div class="receiver-title">No Active Orders</div>
        <div class="receiver-desc">
          Table Number: <strong>${currentTableNum}</strong><br>
          We are ready to serve you. Please use the <strong>Order Menu</strong> tab to select and place an order.
        </div>
        
        ${pastTableOrders.length > 0 ? `
          <div style="text-align: left; border-top: 1px solid var(--border-color); padding-top: 16px; margin-top: 16px;">
            <h4 style="font-size:12px; text-transform:uppercase; color: var(--text-muted); margin-bottom:10px;">Your Closed Orders</h4>
            <div style="display:flex; flex-direction:column; gap:8px; max-height: 180px; overflow-y:auto; padding-right:4px;">
              ${pastTableOrders.map(o => `
                <div style="display:flex; justify-content:space-between; font-size:13px; padding: 6px 8px; background: rgba(255,255,255,0.02); border-radius:6px;">
                  <span>Order <strong>${o.id}</strong> (${o.paymentStatus === 'paid' ? '💳 Paid Card' : '🏨 Room Charge'})</span>
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
  
  const order = activeOrdersForTable[activeOrdersForTable.length - 1];
  
  // Calculate remaining ETA
  let etaHTML = '';
  if (order.etaTimestamp && (order.status === 'pending' || order.status === 'preparing' || order.status === 'ready_to_deliver' || order.status === 'out_for_delivery')) {
    const remainingMs = new Date(order.etaTimestamp) - new Date();
    const remainingMins = Math.max(1, Math.ceil(remainingMs / 60000));
    etaHTML = `
      <div class="eta-banner">
        <span class="eta-banner-icon">⏱️</span>
        <div style="text-align: left;">
          <div class="eta-banner-text">Estimated Arrival: ~${remainingMins} mins</div>
          <div class="eta-banner-sub">Calculated live based on kitchen preparation times</div>
        </div>
      </div>
    `;
  }
  
  if (order.status === 'pending') {
    container.innerHTML = `
      <div class="receiver-center-card" style="border-color: var(--text-muted);">
        <div class="receiver-status-icon">📥</div>
        <div class="receiver-title">Order Submitted</div>
        <div class="receiver-desc" style="margin-bottom: 14px;">
          Order <strong>${order.id}</strong> has been received by the backoffice.<br>
          Chefs will accept and begin preparation shortly.
        </div>
        ${etaHTML}
      </div>
    `;
  } else if (order.status === 'preparing') {
    container.innerHTML = `
      <div class="receiver-center-card" style="border-color: var(--color-info);">
        <div class="receiver-status-icon">👨‍🍳</div>
        <div class="receiver-title">Chefs Cooking...</div>
        <div class="receiver-desc" style="margin-bottom: 14px;">
          Your order <strong>${order.id}</strong> is being prepared by our kitchen team.<br>
          We prepare everything fresh. Hang tight!
        </div>
        ${etaHTML}
      </div>
    `;
  } else if (order.status === 'ready_to_deliver') {
    container.innerHTML = `
      <div class="receiver-center-card" style="border-color: var(--color-primary);">
        <div class="receiver-status-icon">📦</div>
        <div class="receiver-title">Order Packaged & Ready</div>
        <div class="receiver-desc" style="margin-bottom: 14px;">
          Chefs finished Order <strong>${order.id}</strong>.<br>
          Waitstaff is executing final temp and packaging checks before delivery.
        </div>
        ${etaHTML}
      </div>
    `;
  } else if (order.status === 'out_for_delivery') {
    container.innerHTML = `
      <div class="receiver-center-card" style="border-color: var(--color-info);">
        <div class="receiver-status-icon">🛵</div>
        <div class="receiver-title">Food is on the way!</div>
        <div class="receiver-desc" style="margin-bottom: 14px;">
          Order <strong>${order.id}</strong> is in-transit to <strong>Table ${order.table}</strong>.
        </div>
        <div style="font-size: 12px; color: var(--text-muted); background: rgba(0,0,0,0.15); padding: 10px; border-radius:6px; margin-bottom:12px; text-align: left;">
          Staff checklist verified: Insulation OK | Tableware packed
        </div>
        ${etaHTML}
      </div>
    `;
  } else if (order.status === 'delivered') {
    container.innerHTML = `
      <div class="receiver-center-card" style="border-color: var(--color-purple); box-shadow: 0 0 25px rgba(139, 92, 246, 0.15);">
        <div class="receiver-status-icon">🛎️</div>
        <div class="receiver-title">Food Served!</div>
        <div class="receiver-desc">
          Order <strong>${order.id}</strong> arrived. Please verify your items:
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
          <textarea id="issue-note-input" placeholder="Please describe the issue (e.g. missing items, cold food)..."></textarea>
          <button class="btn-receiver no" style="width:100%;" onclick="submitOrderIssue('${order.id}')">
            Submit Issue to Kitchen
          </button>
        </div>
      </div>
    `;
  } else if (order.status === 'issue') {
    container.innerHTML = `
      <div class="receiver-center-card" style="border-color: var(--color-danger);">
        <div class="receiver-status-icon">⚠️</div>
        <div class="receiver-title" style="color: var(--color-danger);">Correction Requested</div>
        <div class="receiver-desc">
          Your issue report:<br>
          <em style="color: var(--text-primary);">"${order.deliveryIssueNotes}"</em><br>
          is being reviewed. Chefs will prepare replacements immediately.
        </div>
      </div>
    `;
  } else if (order.status === 'confirmed') {
    // If the order has not been rated yet, show rating flow first
    if (order.rating === null) {
      container.innerHTML = `
        <div class="receiver-center-card" style="border-color: var(--color-primary); text-align: center;">
          <div class="receiver-status-icon">⭐</div>
          <div class="receiver-title">Rate Your Experience</div>
          <div class="receiver-desc">
            How was your dining experience for Order <strong>${order.id}</strong>?
          </div>
          
          <div class="star-rating-wrap">
            <button class="star-btn" onclick="setStarRating(1)">★</button>
            <button class="star-btn" onclick="setStarRating(2)">★</button>
            <button class="star-btn" onclick="setStarRating(3)">★</button>
            <button class="star-btn" onclick="setStarRating(4)">★</button>
            <button class="star-btn" onclick="setStarRating(5)">★</button>
          </div>
          <div class="rating-label" id="rating-label-text">Tap stars to rate</div>
          
          <textarea id="rating-comment" class="special-instructions-input" style="margin-top:12px; margin-bottom:12px;" placeholder="Add optional comments or feedback..."></textarea>
          
          <button class="btn-receiver yes" style="width:100%;" onclick="submitOrderRating('${order.id}')">
            Submit & Proceed to Settlement
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="receiver-center-card" style="border-color: var(--color-success);">
        <div class="receiver-status-icon">💳</div>
        <div class="receiver-title">Select Settle Option</div>
        <div class="receiver-desc">
          Order <strong>${order.id}</strong>. Outstanding Balance: 
          <strong style="color:var(--color-primary); font-size:18px; display:block; margin-top:6px;">$${order.total.toFixed(2)}</strong>
        </div>
        
        <div class="payment-box">
          <div class="payment-methods-grid">
            <div class="payment-method-card" id="pay-method-now" onclick="selectPaymentMethod('${order.id}', 'now')">
              <div class="method-icon">💳</div>
              <div class="method-label">Pay Now</div>
            </div>
            <div class="payment-method-card" id="pay-method-checkout" onclick="selectPaymentMethod('${order.id}', 'checkout')">
              <div class="method-icon">🏨</div>
              <div class="method-label">Room Charge</div>
            </div>
          </div>
          <div id="payment-input-area" style="margin-top:16px;"></div>
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
    addLog(`Guest reported issue on Order ${orderId} (Table ${currentTableNum}): "${note}".`);
    showToast("Issue report sent to kitchen.", "danger");
    renderGuestReceiver();
    updateNavBadges();
  }
}

function confirmOrderDelivery(orderId, isOk) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  if (isOk) {
    order.status = 'confirmed';
    order.deliveryConfirmedAt = new Date().toISOString();
    localStorage.setItem('aetheria_orders', JSON.stringify(orders));
    addLog(`Guest at Table ${currentTableNum} confirmed correct delivery of Order ${orderId}.`);
    showToast("Order confirmed! Please rate and choose payment.", "success");
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
        <input type="text" class="cc-input" placeholder="Card Number" id="cc-num" maxlength="19">
        <div class="cc-row">
          <input type="text" class="cc-input" placeholder="MM/YY" id="cc-expiry" maxlength="5">
          <input type="password" class="cc-input" placeholder="CVV" id="cc-cvv" maxlength="3">
        </div>
        <button class="btn-form-submit" style="margin-top: 8px;" onclick="processCardPayment('${orderId}')" id="pay-process-btn">
          🔒 Pay $${orders.find(o => o.id === orderId).total.toFixed(2)}
        </button>
      </div>
    `;
  } else {
    cardCheckout.classList.add('selected');
    cardNow.classList.remove('selected');
    
    inputArea.innerHTML = `
      <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); padding: 12px; border-radius: 8px; text-align: center;">
        <p style="font-size:12.5px; color: var(--text-secondary); margin-bottom:12px;">
          Charged to room bill for Table ${orders.find(o => o.id === orderId).table}. Settle upon departure checkout.
        </p>
        <button class="btn-form-submit" style="background: var(--color-success); color:black; width:100%;" onclick="confirmCheckoutBilling('${orderId}')">
          🏨 Charge Room Bill
        </button>
      </div>
    `;
  }
}

function processCardPayment(orderId) {
  const order = orders.find(o => o.id === orderId);
  // FR-11 guard: delivery must be confirmed first
  if (!order || order.status !== 'confirmed') {
    showToast("Delivery must be confirmed before payment.", "danger");
    return;
  }
  const ccNum = document.getElementById('cc-num').value.trim();
  const btn = document.getElementById('pay-process-btn');
  if (!ccNum) {
    showToast("Please enter credit card credentials.", "danger");
    return;
  }
  
  btn.disabled = true;
  btn.textContent = "Processing Card...";
  
  setTimeout(() => {
    order.status = 'completed';
    order.paymentStatus = 'paid';
    order.paymentMethod = 'immediate';
    order.closedAt = new Date().toISOString();
    localStorage.setItem('aetheria_orders', JSON.stringify(orders));
    
    addLog(`Payment of $${order.total.toFixed(2)} for Order ${orderId} processed via Credit Card. Order CLOSED.`);
    showToast("Payment Successful! Order closed.", "success");
    renderReceipt(order);
    updateNavBadges();
  }, 1200);
}

function confirmCheckoutBilling(orderId) {
  const order = orders.find(o => o.id === orderId);
  // FR-11 guard: delivery must be confirmed first
  if (!order || order.status !== 'confirmed') {
    showToast("Delivery must be confirmed before charging room.", "danger");
    return;
  }
  
  order.status = 'completed';
  order.paymentStatus = 'unpaid';
  order.paymentMethod = 'checkout';
  order.closedAt = new Date().toISOString();
  localStorage.setItem('aetheria_orders', JSON.stringify(orders));
  
  // FR-10: Post to mock PMS folio ledger
  const folio = JSON.parse(localStorage.getItem('aetheria_folio') || '[]');
  folio.push({
    id: 'FLO-' + Date.now(),
    orderId: order.id,
    table: order.table,
    amount: order.total,
    postedAt: new Date().toISOString(),
    status: 'unpaid',
    items: order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')
  });
  localStorage.setItem('aetheria_folio', JSON.stringify(folio));
  
  addLog(`Order ${orderId} ($${order.total.toFixed(2)}) charged to Table ${order.table} room bill. Posted to Folio. Order CLOSED.`);
  showToast("Charged to Room Bill. Posted to Folio.", "success");
  renderReceipt(order);
  updateNavBadges();
}

function renderReceipt(order) {
  const container = document.getElementById('guest-receiver-content');
  if (!container) return;
  
  const subtotal = order.total / 1.08;
  const tax = order.total - subtotal;
  
  container.innerHTML = `
    <div class="receiver-center-card" style="border-color: var(--color-success);">
      <div class="receiver-status-icon">🧾</div>
      <div class="receiver-title">Dining Receipt</div>
      <div class="receiver-desc">
        Enjoy your meals! Here is your receipt receipt copy:
      </div>
      
      <div class="receipt-box">
        <div class="receipt-title">AETHERIA BISTRO RECEIPT</div>
        <div class="receipt-row">
          <span>Order Ref:</span>
          <strong>${order.id}</strong>
        </div>
        <div class="receipt-row">
          <span>Table/Room:</span>
          <span>Table ${order.table}</span>
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
        <div class="receipt-row receipt-total">
          <span>Total Balance:</span>
          <span>$${order.total.toFixed(2)}</span>
        </div>
        <div class="receipt-divider"></div>
        <div class="receipt-row" style="font-weight:700; text-align:center; justify-content:center; width:100%; margin-top:8px;">
          <span>${order.paymentStatus === 'paid' ? '💳 TRANSACTION APPROVED' : '🏨 CHARGED TO ROOM'}</span>
        </div>
      </div>
      
      <button class="btn-receiver yes" style="margin-top: 16px; width: 100%;" onclick="renderGuestReceiver()">
        Done
      </button>
    </div>
  `;
}

// Toast
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

// Star Rating helper functions
function setStarRating(rating) {
  tempRatingValue = rating;
  const stars = document.querySelectorAll('.star-btn');
  const label = document.getElementById('rating-label-text');
  
  stars.forEach((star, idx) => {
    if (idx < rating) {
      star.classList.add('lit');
    } else {
      star.classList.remove('lit');
    }
  });
  
  const labels = ["Poor 😞", "Fair 😐", "Good 🙂", "Very Good 😊", "Excellent! 😍"];
  if (label) label.textContent = labels[rating - 1];
}

function submitOrderRating(orderId) {
  if (tempRatingValue === null) {
    showToast("Please select a star rating.", "danger");
    return;
  }
  
  const order = orders.find(o => o.id === orderId);
  if (order) {
    order.rating = tempRatingValue;
    const commentEl = document.getElementById('rating-comment');
    order.ratingComment = commentEl ? commentEl.value.trim() : '';
    localStorage.setItem('aetheria_orders', JSON.stringify(orders));
    
    addLog(`Guest rated Order ${orderId} (${tempRatingValue} stars). Comments: "${order.ratingComment}".`);
    
    // Section 7.6: Auto-flag ratings ≤2 stars to supervisor
    if (tempRatingValue <= 2) {
      const flags = JSON.parse(localStorage.getItem('aetheria_flagged_feedback') || '[]');
      flags.push({
        orderId: order.id,
        table: order.table,
        rating: tempRatingValue,
        comment: order.ratingComment,
        flaggedAt: new Date().toISOString()
      });
      localStorage.setItem('aetheria_flagged_feedback', JSON.stringify(flags));
      addLog(`⚠️ LOW RATING ALERT: Order ${orderId} received ${tempRatingValue} stars — flagged for F&B supervisor review.`);
    }
    
    showToast("Thank you for your feedback!", "success");
    tempRatingValue = null;
    renderGuestReceiver();
  }
}

// Order History
function renderOrderHistory() {
  const container = document.getElementById('guest-history-content');
  const tablePill = document.getElementById('history-table-pill-num');
  if (!container) return;
  if (tablePill) tablePill.textContent = currentTableNum;
  
  // Filter for completed/closed orders for the current table
  const pastOrders = orders.filter(o => o.table === currentTableNum && o.status === 'completed');
  
  if (pastOrders.length === 0) {
    container.innerHTML = `
      <div class="history-empty-state">
        <div class="history-empty-icon">🧾</div>
        <p>No previous orders found for Table ${currentTableNum}.</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = pastOrders.map(order => {
    const formattedDate = new Date(order.createdAt).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const itemsText = order.items.map(item => `${item.quantity}x ${item.name}`).join(', ');
    
    return `
      <div class="history-card">
        <div class="history-card-header">
          <div>
            <span class="history-order-ref">${order.id}</span>
            <div class="history-order-date">${formattedDate}</div>
          </div>
          <span class="history-order-total">$${order.total.toFixed(2)}</span>
        </div>
        <div class="history-order-items">
          ${itemsText}
        </div>
        <button class="history-reorder-btn" onclick="reorderItems('${order.id}')">
          🔄 Re-order these items
        </button>
      </div>
    `;
  }).join('');
}

function reorderItems(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  
  order.items.forEach(item => {
    cart[item.id] = (cart[item.id] || 0) + item.quantity;
  });
  
  addLog(`Re-ordered items from Order ${orderId} into cart.`);
  showToast("Items added back to cart!", "success");
  
  updateCartUI();
  renderKioskMenu();
  switchScreen('guest-kiosk-screen');
  openCartModal();
}
