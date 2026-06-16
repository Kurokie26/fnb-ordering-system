import React from 'react';
import { Order, OrderStatus } from '../types';

interface KitchenMonitorProps {
  orders: Order[];
  onUpdateStatus: (id: string, status: OrderStatus) => void;
}

const KitchenMonitor: React.FC<KitchenMonitorProps> = ({ orders, onUpdateStatus }) => {
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready_to_deliver' || o.status === 'out_for_delivery');

  const renderOrderCard = (order: Order) => (
    <div key={order.id} className="kitchen-order-card">
      <div className="order-card-header">
        <span className="order-num">{order.id}</span>
        <span className="order-table-badge">Table {order.table}</span>
      </div>
      <div className="order-items-checklist">
        {order.items.map((item, idx) => (
          <div key={idx} className="checklist-item">
            <span>{item.quantity}x {item.name}</span>
            {item.note && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Note: {item.note}</div>}
          </div>
        ))}
      </div>
      <div className="kitchen-actions">
        {order.status === 'pending' && (
          <button className="btn-kitchen-action accept" onClick={() => onUpdateStatus(order.id, 'preparing')}>
            Accept & Prep
          </button>
        )}
        {order.status === 'preparing' && (
          <button className="btn-kitchen-action ready" onClick={() => onUpdateStatus(order.id, 'ready_to_deliver')}>
            Mark Ready
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="screen-container active">
      <div className="screen-header">
        <div className="screen-title">
          <h2>Kitchen Monitor</h2>
          <p>Real-time order management for culinary staff</p>
        </div>
      </div>
      <div className="kitchen-kanban">
        <div className="kitchen-col">
          <div className="kitchen-col-header">
            <h3>📥 Incoming <span className="col-badge pending">{pendingOrders.length}</span></h3>
          </div>
          {pendingOrders.map(renderOrderCard)}
        </div>

        <div className="kitchen-col">
          <div className="kitchen-col-header">
            <h3>👨‍🍳 Preparing <span className="col-badge preparing">{preparingOrders.length}</span></h3>
          </div>
          {preparingOrders.map(renderOrderCard)}
        </div>

        <div className="kitchen-col">
          <div className="kitchen-col-header">
            <h3>✅ Ready / Dispatch <span className="col-badge ready">{readyOrders.length}</span></h3>
          </div>
          {readyOrders.map(renderOrderCard)}
        </div>
      </div>
    </div>
  );
};

export default KitchenMonitor;
