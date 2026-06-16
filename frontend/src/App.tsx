import { useState, useEffect, useMemo, useCallback } from 'react'
import './App.css'
import { MenuItem, Order, OrderItem, OrderStatus } from './types'
import GuestLayout from './components/GuestLayout'
import StaffLayout from './components/StaffLayout'
import MenuGrid from './components/MenuGrid'
import ItemModal from './components/ItemModal'
import CartView from './components/CartView'
import KitchenMonitor from './components/KitchenMonitor'
import { menuService, orderService } from './services/api'
import { io, Socket } from 'socket.io-client'

const SOCKET_URL = 'http://localhost:5000'

function App() {
  // Authentication & Session
  const [userRole, setUserRole] = useState<'guest' | 'staff' | null>(() => {
    return (localStorage.getItem('aetheria_role') as any) || null
  })
  const [tableNumber, setTableNumber] = useState(() => {
    return localStorage.getItem('aetheria_table') || ''
  })

  // Navigation
  const [activeScreen, setActiveScreen] = useState('menu')

  // Data State
  const [menu, setMenu] = useState<MenuItem[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [socket, setSocket] = useState<Socket | null>(null)

  // UI State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedDietary, setSelectedDietary] = useState('all')
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [cart, setCart] = useState<Record<string, number>>({})
  const [cartNotes, setCartNotes] = useState<Record<string, string>>({})

  // Initialize Data & Socket
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [menuData, ordersData] = await Promise.all([
          menuService.getMenu(),
          userRole === 'staff' ? orderService.getOrders() : orderService.getOrdersByTable(tableNumber)
        ])
        setMenu(menuData)
        setOrders(ordersData)
      } catch (error) {
        console.error('Failed to fetch initial data:', error)
      }
    }

    if (userRole) fetchData()

    const newSocket = io(SOCKET_URL)
    setSocket(newSocket)

    newSocket.on('menu-update', (updatedItem: MenuItem) => {
      setMenu(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item))
    })

    newSocket.on('new-order', (newOrder: Order) => {
      if (userRole === 'staff') {
        setOrders(prev => [newOrder, ...prev])
      }
    })

    newSocket.on('order-update', (updatedOrder: Order) => {
      setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o))
    })

    return () => {
      newSocket.disconnect()
    }
  }, [userRole, tableNumber])

  // Persistence
  useEffect(() => {
    localStorage.setItem('aetheria_role', userRole || '')
    localStorage.setItem('aetheria_table', tableNumber)
  }, [userRole, tableNumber])

  // Computed
  const categories = useMemo(() => {
    return ['All', ...new Set(menu.map(item => item.category))]
  }, [menu])

  const filteredMenu = useMemo(() => {
    let filtered = selectedCategory === 'All' 
      ? menu 
      : menu.filter(item => item.category === (typeof item.category === 'string' ? item.category : (item.category as any).name))
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(q) || 
        item.description.toLowerCase().includes(q)
      )
    }
    
    if (selectedDietary !== 'all') {
      filtered = filtered.filter(item => 
        item.tags && item.tags.includes(selectedDietary)
      )
    }
    
    return filtered
  }, [menu, selectedCategory, searchQuery, selectedDietary])

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0)

  // Actions
  const handleLogin = (table: string) => {
    if (!table.trim()) return
    setTableNumber(table)
    setUserRole('guest')
    setActiveScreen('menu')
  }

  const handleStaffLogin = () => {
    const pass = prompt("Enter Backoffice Password:", "admin")
    if (pass === 'admin') {
      setUserRole('staff')
      setActiveScreen('kitchen')
    } else {
      alert("Invalid password")
    }
  }

  const handleLogout = () => {
    setUserRole(null)
    setTableNumber('')
    setActiveScreen('menu')
    localStorage.removeItem('aetheria_role')
    localStorage.removeItem('aetheria_table')
  }

  const handleAddToCart = (item: MenuItem, quantity: number = 1, note: string = '') => {
    setCart(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + quantity }))
    if (note) {
      setCartNotes(prev => ({ ...prev, [item.id]: note }))
    }
    setSelectedItem(null)
  }

  const handleAdjustQty = (itemId: string, amount: number) => {
    setCart(prev => {
      const newQty = (prev[itemId] || 0) + amount
      if (newQty <= 0) {
        const next = { ...prev }
        delete next[itemId]
        return next
      }
      return { ...prev, [itemId]: newQty }
    })
  }

  const handlePlaceOrder = async () => {
    if (!tableNumber) return

    const itemIds = Object.keys(cart)
    if (itemIds.length === 0) return

    const orderItems: any[] = []
    let subtotal = 0
    let maxPrepTime = 0

    itemIds.forEach(id => {
      const item = menu.find(i => i.id === id)
      if (item) {
        const qty = cart[id]
        orderItems.push({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: qty,
          note: cartNotes[item.id] || ""
        })
        subtotal += item.price * qty
        if (item.prepTime > maxPrepTime) maxPrepTime = item.prepTime
      }
    })

    const tax = subtotal * 0.08
    const total = subtotal + tax
    
    const etaMinutes = maxPrepTime + 5
    const etaTimestamp = new Date(Date.now() + etaMinutes * 60000).toISOString()

    try {
      const newOrder = await orderService.placeOrder({
        table: tableNumber,
        items: orderItems,
        total: parseFloat(total.toFixed(2)),
        etaMinutes,
        etaTimestamp,
      })
      setOrders(prev => [newOrder, ...prev])
      setCart({})
      setCartNotes({})
      setActiveScreen('status')
    } catch (error) {
      alert('Failed to place order. Please try again.')
    }
  }

  const handleUpdateOrderStatus = async (id: string, status: OrderStatus) => {
    try {
      await orderService.updateStatus(id, status)
    } catch (error) {
      alert('Failed to update status')
    }
  }

  // Render Login Gate
  if (!userRole) {
    return (
      <div className="login-gate">
        <div className="login-box">
          <div className="login-header">
            <h2>🌌 AETHERIA</h2>
            <p>Select your portal to begin the dining experience</p>
          </div>
          <div className="login-portals">
            <div className="login-portal-card" onClick={() => {
              const table = prompt("Enter Table / Room Number:", "5")
              if (table) handleLogin(table)
            }}>
              <div className="portal-icon">🍽️</div>
              <h3>Guest Dining</h3>
              <p>Browse our artisanal menu and place orders directly to the kitchen.</p>
            </div>
            <div className="login-portal-card" onClick={handleStaffLogin}>
              <div className="portal-icon">💼</div>
              <h3>Staff Backoffice</h3>
              <p>Management, kitchen display, and delivery logistics.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render Staff View
  if (userRole === 'staff') {
    return (
      <StaffLayout 
        activeScreen={activeScreen} 
        onScreenChange={setActiveScreen}
        onLogout={handleLogout}
      >
        {activeScreen === 'kitchen' && (
          <KitchenMonitor orders={orders} onUpdateStatus={handleUpdateOrderStatus} />
        )}
        {activeScreen === 'dispatch' && (
          <div className="screen-container active">
            <div className="screen-header">
              <div className="screen-title">
                <h2>Dispatch Queue</h2>
                <p>Manage order delivery and handoffs</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {orders.filter(o => o.status === 'ready_to_deliver' || o.status === 'out_for_delivery').map(order => (
                <div key={order.id} className="delivery-card">
                   <div className="delivery-card-header">
                    <span className="order-num">{order.id}</span>
                    <span className="order-table-badge">Table {order.table}</span>
                  </div>
                  <div className="delivery-items-summary">
                    {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                  </div>
                  <button 
                    className="btn-dispatch start" 
                    onClick={() => handleUpdateOrderStatus(order.id, order.status === 'ready_to_deliver' ? 'out_for_delivery' : 'delivered')}
                  >
                    {order.status === 'ready_to_deliver' ? '🚀 Dispatch Now' : '🛎️ Mark Delivered'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeScreen === 'menu-editor' && (
          <div className="screen-container active">
            <div className="screen-header">
              <div className="screen-title">
                <h2>Menu Management</h2>
                <p>Toggle availability and manage items</p>
              </div>
            </div>
            <div className="menu-table-container">
              <table className="menu-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {menu.map(item => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{typeof item.category === 'string' ? item.category : (item.category as any).name}</td>
                      <td>${item.price.toFixed(2)}</td>
                      <td>
                        <label className="toggle-switch">
                          <input 
                            type="checkbox" 
                            checked={item.available} 
                            onChange={(e) => menuService.updateAvailability(item.id, e.target.checked)}
                          />
                          <span className="slider"></span>
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </StaffLayout>
    )
  }

  // Render Guest View
  return (
    <GuestLayout 
      activeScreen={activeScreen}
      onScreenChange={setActiveScreen}
      tableNumber={tableNumber}
      cartCount={cartCount}
    >
      {activeScreen === 'menu' && (
        <div className="screen-container active">
          <div className="kiosk-controls">
            <div className="menu-search-bar" style={{ flex: 1 }}>
              <span className="menu-search-icon">🔍</span>
              <input 
                type="text" 
                className="menu-search-input" 
                placeholder="Search for dishes, drinks, or ingredients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="categories-bar" style={{ marginBottom: '20px' }}>
            {categories.map(cat => (
              <button 
                key={cat}
                className={`category-tab ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="dietary-filter-bar">
            {['all', 'vegetarian', 'vegan', 'halal', 'gluten-free', 'spicy'].map(tag => (
              <button 
                key={tag}
                className={`dietary-filter-btn ${selectedDietary === tag ? 'active' : ''}`}
                onClick={() => setSelectedDietary(tag)}
              >
                {tag.charAt(0).toUpperCase() + tag.slice(1)}
              </button>
            ))}
          </div>

          <MenuGrid 
            items={filteredMenu}
            cart={cart}
            onAdd={(item) => handleAddToCart(item)}
            onAdjust={handleAdjustQty}
            onItemClick={setSelectedItem}
          />

          <ItemModal 
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            onAdd={handleAddToCart}
            initialQuantity={selectedItem ? (cart[selectedItem.id] || 1) : 1}
            initialNote={selectedItem ? (cartNotes[selectedItem.id] || '') : ''}
          />
        </div>
      )}

      {activeScreen === 'cart' && (
        <CartView 
          cart={cart}
          cartNotes={cartNotes}
          menu={menu}
          onAdjust={handleAdjustQty}
          onPlaceOrder={handlePlaceOrder}
          onClear={() => { setCart({}); setCartNotes({}); }}
        />
      )}

      {activeScreen === 'status' && (
        <div className="screen-container active">
          <div className="receiver-center-card">
            <div className="receiver-status-icon">🌌</div>
            <div className="receiver-title">Order Status</div>
            <div className="receiver-desc">
              Your active orders for Table {tableNumber}.
            </div>
            <div style={{ textAlign: 'left', marginTop: '20px' }}>
              {orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').map(order => (
                <div key={order.id} style={{ padding: '15px', background: 'var(--bg-card)', borderRadius: '12px', marginBottom: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '700', color: 'var(--color-primary)' }}>{order.id}</span>
                    <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--color-info)' }}>{order.status.replace(/_/g, ' ')}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                  </div>
                  {order.status === 'delivered' && (
                    <button 
                      className="btn-receiver yes" 
                      style={{ width: '100%', marginTop: '10px' }}
                      onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')}
                    >
                      ✅ Confirm Received
                    </button>
                  )}
                  {order.status === 'confirmed' && (
                    <div style={{ marginTop: '10px' }}>
                      <button 
                        className="btn-receiver yes" 
                        style={{ width: '100%' }}
                        onClick={() => setActiveScreen('payment')}
                      >
                        💳 Settle Bill
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeScreen === 'history' && (
        <div className="screen-container active">
           <div className="receiver-center-card">
            <div className="receiver-status-icon">🧾</div>
            <div className="receiver-title">Order History</div>
            <div className="receiver-desc">
              Your past orders for Table {tableNumber}.
            </div>
            <div style={{ textAlign: 'left', marginTop: '20px' }}>
              {orders.filter(o => o.status === 'completed').map(order => (
                <div key={order.id} style={{ padding: '15px', background: 'var(--bg-card)', borderRadius: '12px', marginBottom: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: '700' }}>{order.id}</span>
                    <span style={{ fontWeight: '700', color: 'var(--color-success)' }}>${order.total.toFixed(2)}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(order.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </GuestLayout>
  )
}

export default App
