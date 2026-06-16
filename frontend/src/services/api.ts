import { MenuItem, Order, OrderStatus } from '../types';

const API_BASE = 'http://localhost:5000/api';

export const menuService = {
  getMenu: async (): Promise<MenuItem[]> => {
    const res = await fetch(`${API_BASE}/menu`);
    if (!res.ok) throw new Error('Failed to fetch menu');
    return res.json();
  },
  updateAvailability: async (id: string, available: boolean): Promise<MenuItem> => {
    const res = await fetch(`${API_BASE}/menu/${id}/availability`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ available }),
    });
    if (!res.ok) throw new Error('Failed to update availability');
    return res.json();
  }
};

export const orderService = {
  getOrders: async (): Promise<Order[]> => {
    const res = await fetch(`${API_BASE}/orders`);
    if (!res.ok) throw new Error('Failed to fetch orders');
    return res.json();
  },
  getOrdersByTable: async (table: string): Promise<Order[]> => {
    const res = await fetch(`${API_BASE}/orders/table/${table}`);
    if (!res.ok) throw new Error('Failed to fetch table orders');
    return res.json();
  },
  placeOrder: async (orderData: Partial<Order>): Promise<Order> => {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    if (!res.ok) throw new Error('Failed to place order');
    return res.json();
  },
  updateStatus: async (id: string, status: OrderStatus): Promise<Order> => {
    const res = await fetch(`${API_BASE}/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update status');
    return res.json();
  },
  updatePayment: async (id: string, paymentData: { paymentStatus: string, paymentMethod: string }): Promise<Order> => {
    const res = await fetch(`${API_BASE}/orders/${id}/payment`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData),
    });
    if (!res.ok) throw new Error('Failed to update payment');
    return res.json();
  }
};
