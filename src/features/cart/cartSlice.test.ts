import { describe, expect, it } from 'vitest';
import { cartReducer, addItem, setQuantity, removeItem, setNote, clearCart, MAX_QTY } from './cartSlice';
import { api } from '../../services/api';
import type { CartState, Order } from '../../types';

const empty: CartState = { items: {}, note: '' };

describe('cartSlice reducer', () => {
  it('回傳初始狀態', () => {
    expect(cartReducer(undefined, { type: '@@INIT' })).toEqual(empty);
  });

  it('addItem：不存在則新增為 1，存在則 +1', () => {
    let s = cartReducer(empty, addItem('m-001'));
    expect(s.items).toEqual({ 'm-001': 1 });
    s = cartReducer(s, addItem('m-001'));
    expect(s.items).toEqual({ 'm-001': 2 });
  });

  it('addItem：數量上限 10', () => {
    const s = cartReducer({ items: { 'm-001': MAX_QTY }, note: '' }, addItem('m-001'));
    expect(s.items['m-001']).toBe(MAX_QTY);
  });

  it('setQuantity：限制在 10 以內，0 以下則移除', () => {
    const base: CartState = { items: { 'm-001': 3 }, note: '' };
    expect(cartReducer(base, setQuantity({ menuItemId: 'm-001', quantity: 99 })).items['m-001']).toBe(10);
    expect(cartReducer(base, setQuantity({ menuItemId: 'm-001', quantity: 5 })).items['m-001']).toBe(5);
    expect(cartReducer(base, setQuantity({ menuItemId: 'm-001', quantity: 0 })).items).toEqual({});
    expect(cartReducer(base, setQuantity({ menuItemId: 'm-001', quantity: -1 })).items).toEqual({});
  });

  it('removeItem：只移除指定餐點', () => {
    const s = cartReducer({ items: { 'm-001': 1, 'm-201': 2 }, note: '' }, removeItem('m-001'));
    expect(s.items).toEqual({ 'm-201': 2 });
  });

  it('setNote：最多 100 字', () => {
    const s = cartReducer(empty, setNote('a'.repeat(150)));
    expect(s.note).toHaveLength(100);
  });

  it('clearCart：清空餐點與備註', () => {
    const s = cartReducer({ items: { 'm-001': 2 }, note: '少冰' }, clearCart());
    expect(s).toEqual(empty);
  });

  it('submitOrder fulfilled（外部 action）：回到初始狀態', () => {
    // 手動組出 RTK Query 的 fulfilled action，驗證 extraReducers 的 matcher
    const fulfilled = {
      type: 'api/executeMutation/fulfilled',
      payload: {} as Order,
      meta: {
        requestId: 'x',
        requestStatus: 'fulfilled',
        arg: { type: 'mutation', endpointName: 'submitOrder', originalArgs: { items: [] }, track: true },
        fulfilledTimeStamp: Date.now(),
        baseQueryMeta: {},
        RTK_autoBatch: true,
      },
    };
    expect(api.endpoints.submitOrder.matchFulfilled(fulfilled)).toBe(true);
    const s = cartReducer({ items: { 'm-001': 2 }, note: '少冰' }, fulfilled);
    expect(s).toEqual(empty);
  });
});
