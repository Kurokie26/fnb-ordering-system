export type Category = string;

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: Category;
  description: string;
  image: string; // emoji or URL
  available: boolean;
  tags: string[];
  prepTime: number; // minutes
}

export type OrderStatus = 
  | 'pending'
  | 'preparing'
  | 'ready_to_deliver'
  | 'out_for_delivery'
  | 'delivered'
  | 'issue'
  | 'confirmed'
  | 'completed';

export type PaymentStatus = 'unpaid' | 'paid';
export type PaymentMethod = 'immediate' | 'checkout';

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  note?: string;
}

export interface Order {
  id: string;
  table: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  createdAt: string;
  updatedAt?: string;
  etaMinutes?: number;
  etaTimestamp?: string;
  rating?: number | null;
  ratingComment?: string;
  deliveryConfirmedAt?: string;
  deliveryIssueNotes?: string;
  checklistChecked: boolean;
}

export interface FolioItem {
  id: string;
  orderId: string;
  table: string;
  amount: number;
  postedAt: string;
  status: 'unpaid' | 'paid';
  items: string; // Summary string
}

export interface TagConfig {
  label: string;
  color: string;
  bg: string;
  border: string;
}
