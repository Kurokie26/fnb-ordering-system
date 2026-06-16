import React from 'react';
import { MenuItem } from '../types';
import { TAG_CONFIG } from '../data';

interface MenuItemCardProps {
  item: MenuItem;
  quantity: number;
  onAdd: (item: MenuItem) => void;
  onAdjust: (itemId: string, amount: number) => void;
  onClick: (item: MenuItem) => void;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, quantity, onAdd, onAdjust, onClick }) => {
  const isOut = !item.available;

  return (
    <div 
      className="menu-card" 
      onClick={() => !isOut && onClick(item)}
      style={{ opacity: isOut ? 0.65 : 1, pointerEvents: isOut ? 'none' : 'auto', cursor: isOut ? 'default' : 'pointer' }}
    >
      <div className="menu-card-img-placeholder">
        {item.image}
        <div className="menu-card-badge">{item.category}</div>
      </div>
      <div className="menu-card-body">
        <div>
          <div className="menu-card-title">{item.name}</div>
          <div className="menu-card-desc">{item.description}</div>
          <div style={{ marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {item.tags.map(tag => {
              const cfg = TAG_CONFIG[tag];
              if (!cfg) return null;
              return (
                <span 
                  key={tag}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '10px',
                    background: cfg.bg,
                    color: cfg.color,
                    border: \`1px solid \${cfg.border}\`
                  }}
                >
                  {cfg.label}
                </span>
              );
            })}
          </div>
        </div>
        <div className="menu-card-footer">
          <div className="menu-card-price">\${item.price.toFixed(2)}</div>
          <div>
            {isOut ? (
              <span style={{ color: 'var(--color-danger)', fontSize: '13px', fontWeight: 600 }}>Out of Stock</span>
            ) : quantity > 0 ? (
              <div className="qty-controller" onClick={(e) => e.stopPropagation()}>
                <button className="qty-btn" onClick={() => onAdjust(item.id, -1)}>-</button>
                <span className="qty-val">{quantity}</span>
                <button className="qty-btn" onClick={() => onAdjust(item.id, 1)}>+</button>
              </div>
            ) : (
              <button className="btn-add-cart" onClick={(e) => { e.stopPropagation(); onAdd(item); }}>
                ➕ Add
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuItemCard;
