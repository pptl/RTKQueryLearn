// src/types.ts
export type Category = 'main' | 'side' | 'drink';

export interface MenuItem {
  id: string; // 'm-001'
  name: string;
  description: string;
  price: number; // TWD
  category: Category;
  imageUrl: string;
  available: boolean; // false = 售完
}

// client state：購物車（只存 id 與數量，不存價格）
export interface CartState {
  items: Record<string, number>; // { [menuItemId]: quantity }
  note: string;
}

// 送出訂單的請求
export interface OrderRequest {
  items: { menuItemId: string; quantity: number }[];
  note?: string;
}

// 後端回傳的訂單（價格以後端計算為準）
export type OrderStatus = 'received' | 'preparing' | 'ready';

export interface Order {
  id: string; // 'o-20261112-0001'
  items: {
    menuItemId: string;
    name: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
  }[];
  note: string;
  total: number;
  status: OrderStatus;
  createdAt: string; // ISO 8601
}

// 共用錯誤格式
export interface ApiError {
  code: string;
  message: string;
  details?: { menuItemId?: string }[];
}
