import React from 'react';
import { MenuItem } from '../types';

interface CartViewProps {
  cart: Record<string, number>;
  cartNotes: Record<string, string>;
  menu: MenuItem[];
  onAdjust: (itemId: string, amount: number) => void;
  onPlaceOrder: () => void;
  onClear: () => void;
}

const CartView: React.FC<CartViewProps> = ({ 
  cart, 
  cartNotes, 
  menu, 
  onAdjust, 
  onPlaceOrder, 
  onClear 
}) => {
  const itemIds = Object.keys(cart);
  
  const cartItems = itemIds.map(id => {
    const item = menu.find(i => i.id === id);
    if (!item) return null;
    return {
      item,
      quantity: cart[id],
      note: cartNotes[id]
    };
  }).filter((i): i is { item: MenuItem; quantity: number; note: string } => i !== null);

  const subtotal = cartItems.reduce((acc, curr) => acc + curr.item.price * curr.quantity, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  if (itemIds.length === 0) {
    return (
      <div className="screen-container active">
        <div className="cart-empty-state">
          <div className="cart-empty-icon">🍽️</div>
          <p>No dishes selected.<br />Return to the menu to add some artisanal dishes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-container active">
      <div className="screen-header">
        <div className="screen-title">
          <h2>Your Selection</h2>
          <p>Review your dishes before sending to the kitchen</p>
        </div>
        <button className="btn-reset" onClick={onClear}>Clear All</button>
      </div>

      <div className="kiosk-layout">
        <div className="kiosk-main-content">
          <div className="cart-items-list" style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '20px' }}>
            {cartItems.map(({ item, quantity, note }) => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-details">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-price">${item.price.toFixed(2)}</div>
                  {note && <div className="cart-item-note">✍️ Note: {note}</div>}
                </div>
                <div className="qty-controller">
                  <button className="qty-btn" onClick={() => onAdjust(item.id, -1)}>-</button>
                  <span className="qty-val">{quantity}</span>
                  <button className="qty-btn" onClick={() => onAdjust(item.id, 1)}>+</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="cart-sidebar" style={{ height: 'auto' }}>
          <div className="cart-header">
            <h3>Order Summary</h3>
          </div>
          <div className="cart-footer" style={{ background: 'none' }}>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Service Tax (8%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="summary-row total">
              <span>Total Amount</span>
              <span>${total.toFixed(2)}</span>
            </div>
            
            <button 
              className="btn-checkout" 
              onClick={onPlaceOrder}
              style={{ marginTop: '24px' }}
            >
              🚀 Send to Kitchen
            </button>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '12px' }}>
              By placing this order, you agree to our terms of service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartView;
