import React, { useState } from 'react';
import { MenuItem } from '../types';
import { TAG_CONFIG } from '../data';

interface ItemModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onAdd: (item: MenuItem, quantity: number, note: string) => void;
  initialQuantity?: number;
  initialNote?: string;
}

const ItemModal: React.FC<ItemModalProps> = ({ item, onClose, onAdd, initialQuantity = 1, initialNote = '' }) => {
  const [qty, setQty] = useState(initialQuantity);
  const [note, setNote] = useState(initialNote);

  if (!item) return null;

  return (
    <div className="item-modal-overlay open" onClick={onClose}>
      <div className="item-modal" onClick={(e) => e.stopPropagation()}>
        <div className="item-modal-hero">
          {item.image}
          <button className="item-modal-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="item-modal-body">
          <div className="item-modal-name">{item.name}</div>
          <div className="item-modal-price">${item.price.toFixed(2)}</div>
          <div className="item-modal-desc">{item.description}</div>
          
          <div style={{ marginBottom: '12px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
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
                    border: `1px solid ${cfg.border}`
                  }}
                >
                  {cfg.label}
                </span>
              );
            })}
          </div>
          
          <div className="item-modal-section-label">⏱️ Estimated Prep Time</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            ~{item.prepTime || 10} minutes
          </div>

          <div className="item-modal-section-label">✍️ Special Instructions / Notes</div>
          <textarea 
            className="special-instructions-input" 
            placeholder="E.g., No onions, extra spicy, sauce on the side..." 
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <div className="item-modal-footer">
          <div className="modal-qty-controller">
            <button className="modal-qty-btn" onClick={() => setQty(Math.max(1, qty - 1))}>-</button>
            <span className="modal-qty-val">{qty}</span>
            <button className="modal-qty-btn" onClick={() => setQty(qty + 1)}>+</button>
          </div>
          <button className="btn-add-to-order" onClick={() => onAdd(item, qty, note)}>
            ➕ Add to Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemModal;
