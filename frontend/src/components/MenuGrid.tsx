import React from 'react';
import { MenuItem } from '../types';
import MenuItemCard from './MenuItemCard';

interface MenuGridProps {
  items: MenuItem[];
  cart: Record<string, number>;
  onAdd: (item: MenuItem) => void;
  onAdjust: (itemId: string, amount: number) => void;
  onItemClick: (item: MenuItem) => void;
}

const MenuGrid: React.FC<MenuGridProps> = ({ items, cart, onAdd, onAdjust, onItemClick }) => {
  if (items.length === 0) {
    return (
      <div style={{ gridColumn: '1/-1', padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        No menu items found.
      </div>
    );
  }

  return (
    <div className="menu-grid">
      {items.map(item => (
        <MenuItemCard 
          key={item.id}
          item={item}
          quantity={cart[item.id] || 0}
          onAdd={onAdd}
          onAdjust={onAdjust}
          onClick={onItemClick}
        />
      ))}
    </div>
  );
};

export default MenuGrid;
