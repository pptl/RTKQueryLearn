// src/features/cart/cartSelectors.ts
import { createSelector } from '@reduxjs/toolkit';
import { api } from '../../services/api';
import type { RootState } from '../../app/store';
import type { MenuItem } from '../../types';

// 注意兩個「參考穩定」的細節：
// 1. endpoint.select() 每次呼叫都會建立新的 selector，所以只建立一次放在模組層級。
// 2. 沒資料時回傳同一個常數陣列，而不是每次 `?? []` 產生新陣列，
//    否則 createSelector 的 input stability check 會在開發模式警告，並導致每次都重算。
const selectMenuResult = api.endpoints.getMenu.select();
const EMPTY_MENU: MenuItem[] = [];

const selectMenu = (s: RootState) => selectMenuResult(s).data ?? EMPTY_MENU;
const selectCartItems = (s: RootState) => s.cart.items;
export const selectCartNote = (s: RootState) => s.cart.note;

export interface CartLine {
  id: string;
  quantity: number;
  item: MenuItem | undefined; // undefined = 已不在菜單中
  subtotal: number;
  unavailable: boolean;
}

export const selectCartCount = createSelector([selectCartItems], (items) =>
  Object.values(items).reduce((sum, q) => sum + q, 0),
);

// 購物車只存 id 與數量；顯示用的名稱、價格、是否可購買一律從菜單快取算出來
export const selectCartLines = createSelector([selectCartItems, selectMenu], (items, menu): CartLine[] =>
  Object.entries(items).map(([id, quantity]) => {
    const item = menu.find((m) => m.id === id);
    return { id, quantity, item, subtotal: (item?.price ?? 0) * quantity, unavailable: !item?.available };
  }),
);

export const selectCartTotal = createSelector([selectCartLines], (lines) =>
  lines.reduce((sum, l) => sum + l.subtotal, 0),
);

export const selectHasUnavailable = createSelector([selectCartLines], (lines) =>
  lines.some((l) => l.unavailable),
);

export const selectIsCartEmpty = createSelector([selectCartItems], (items) => Object.keys(items).length === 0);

// 送出訂單用的 request body
export const selectOrderRequest = createSelector([selectCartItems, selectCartNote], (items, note) => ({
  items: Object.entries(items).map(([menuItemId, quantity]) => ({ menuItemId, quantity })),
  note: note.trim() || undefined,
}));
