// Application State
let menu = [];
let orders = [];
let cart = {}; // { itemId: quantity }
let currentScreen = 'guest-kiosk-screen';
let currentCategory = 'All';
let currentTableNum = '5';
let logs = []; // Shared logs for tracking
let currentUserRole = null;

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
  
  // Set default values in DOM
  document.getElementById('table-num-input').value = currentTableNum;
  document.getElementById('cart-table-no').textContent = currentTableNum;
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
  const sessionBadge = document.getElementById('session-badge');
  const sessionText = document.getElementById('session-role-text');
  
  if (!gate) return;

  if (currentUserRole !== 'guest') {
    gate.style.display = 'flex';
    if (sessionBadge) sessionBadge.style.display = 'none';
  } else {
    gate.style.display = 'none';
    if (sessionBadge) {
      sessionBadge.style.display = 'inline-flex';
      sessionText.textContent = `Table ${currentTableNum}`;
    }
    
    // Default to the kiosk screen
    switchScreen('guest-kiosk-screen');
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
  document.getElementById('cart-table-no').textContent = currentTableNum || '?';
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
  document.querySelectorAll('.screen-container').forEach(screen => {
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
  }
  
  updateNavBadges();
}

function updateNavBadges() {
  // Check if there are active items in-transit or arrived
  const receiverCount = orders.filter(o => o.table === currentTableNum && 
    (o.status === 'out_for_delivery' || o.status === 'delivered' || o.status === 'confirmed')).length;
  const rBadge = document.getElementById('receiver-badge');
  if (rBadge) {
    rBadge.textContent = receiverCount;
    rBadge.style.display = receiverCount > 0 ? 'inline-block' : 'none';
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

function selectCategory(cat) {
  currentCategory = cat;
  renderCategories();
  renderKioskMenu();
}

function renderKioskMenu() {
  const grid = document.getElementById('kiosk-menu-grid');
  if (!grid) return;
  
  const filtered = currentCategory === 'All' 
    ? menu 
    : menu.filter(item => item.category === currentCategory);
    
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
    status: 'pending',
    paymentStatus: 'unpaid',
    paymentMethod: null,
    createdAt: new Date().toISOString(),
    checklistChecked: false,
    deliveryIssueNotes: ""
  };
  
  orders.push(newOrder);
  localStorage.setItem('aetheria_orders', JSON.stringify(orders));
  
  // Clear cart & switch tabs to Receiver
  cart = {};
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
  
  if (order.status === 'pending') {
    container.innerHTML = `
      <div class="receiver-center-card" style="border-color: var(--text-muted);">
        <div class="receiver-status-icon">📥</div>
        <div class="receiver-title">Order Submitted</div>
        <div class="receiver-desc">
          Order <strong>${order.id}</strong> has been received by the backoffice.<br>
          Chefs will accept and begin preparation shortly.
        </div>
      </div>
    `;
  } else if (order.status === 'preparing') {
    container.innerHTML = `
      <div class="receiver-center-card" style="border-color: var(--color-info);">
        <div class="receiver-status-icon">👨‍🍳</div>
        <div class="receiver-title">Chefs Cooking...</div>
        <div class="receiver-desc">
          Your order <strong>${order.id}</strong> is being prepared by our kitchen team.<br>
          We prepare everything fresh. Hang tight!
        </div>
      </div>
    `;
  } else if (order.status === 'ready_to_deliver') {
    container.innerHTML = `
      <div class="receiver-center-card" style="border-color: var(--color-primary);">
        <div class="receiver-status-icon">📦</div>
        <div class="receiver-title">Order Packaged & Ready</div>
        <div class="receiver-desc">
          Chefs finished Order <strong>${order.id}</strong>.<br>
          Waitstaff is executing final temp and packaging checks before delivery.
        </div>
      </div>
    `;
  } else if (order.status === 'out_for_delivery') {
    container.innerHTML = `
      <div class="receiver-center-card" style="border-color: var(--color-info);">
        <div class="receiver-status-icon">🛵</div>
        <div class="receiver-title">Food is on the way!</div>
        <div class="receiver-desc">
          Order <strong>${order.id}</strong> is in-transit to <strong>Table ${order.table}</strong>.
        </div>
        <div style="font-size: 12px; color: var(--text-muted); background: rgba(0,0,0,0.15); padding: 10px; border-radius:6px; margin-top:12px;">
          Staff checklist verified: Insulation OK | Tableware packed
        </div>
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
  if (order && isOk) {
    order.status = 'confirmed';
    localStorage.setItem('aetheria_orders', JSON.stringify(orders));
    addLog(`Guest at Table ${currentTableNum} confirmed correct delivery of Order ${orderId}.`);
    showToast("Order confirmed successfully.", "success");
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
  const ccNum = document.getElementById('cc-num').value.trim();
  const btn = document.getElementById('pay-process-btn');
  if (!ccNum) {
    showToast("Please enter credit card credentials.", "danger");
    return;
  }
  
  btn.disabled = true;
  btn.textContent = "Processing Card...";
  
  setTimeout(() => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      order.status = 'completed';
      order.paymentStatus = 'paid';
      order.paymentMethod = 'immediate';
      localStorage.setItem('aetheria_orders', JSON.stringify(orders));
      
      addLog(`Payment of $${order.total.toFixed(2)} for Order ${orderId} processed successfully via Credit Card.`);
      showToast("Payment Successful!", "success");
      renderReceipt(order);
      updateNavBadges();
    }
  }, 1200);
}

function confirmCheckoutBilling(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (order) {
    order.status = 'completed';
    order.paymentStatus = 'unpaid';
    order.paymentMethod = 'checkout';
    localStorage.setItem('aetheria_orders', JSON.stringify(orders));
    
    addLog(`Order ${orderId} ($${order.total.toFixed(2)}) charged to Table ${order.table} bill.`);
    showToast("Charged to Room successfully.", "success");
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
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3200);
}
