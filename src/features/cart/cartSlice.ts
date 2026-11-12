// src/features/cart/cartSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { api } from '../../services/api';
import type { CartState } from '../../types';

export const MAX_QTY = 10;
export const MAX_NOTE_LENGTH = 100;

const initialState: CartState = { items: {}, note: '' };

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // 不存在 → 1；存在 → +1；上限 10
    addItem(state, action: PayloadAction<string>) {
      const id = action.payload;
      state.items[id] = Math.min((state.items[id] ?? 0) + 1, MAX_QTY);
    },
    // 限制在 0～10；0（或以下）則移除
    setQuantity(state, action: PayloadAction<{ menuItemId: string; quantity: number }>) {
      const { menuItemId, quantity } = action.payload;
      if (quantity <= 0) delete state.items[menuItemId];
      else state.items[menuItemId] = Math.min(quantity, MAX_QTY);
    },
    removeItem(state, action: PayloadAction<string>) {
      delete state.items[action.payload];
    },
    setNote(state, action: PayloadAction<string>) {
      state.note = action.payload.slice(0, MAX_NOTE_LENGTH);
    },
    // 回傳新的 state（而不是修改 draft）也是合法的 reducer 寫法
    clearCart: () => initialState,
  },
  extraReducers: (builder) => {
    // 監聽「別的 slice」的 action：訂單建立成功 → 購物車回到初始狀態
    builder.addMatcher(api.endpoints.submitOrder.matchFulfilled, () => initialState);
  },
});

export const { addItem, setQuantity, removeItem, setNote, clearCart } = cartSlice.actions;
export const cartReducer = cartSlice.reducer;
export default cartSlice;
