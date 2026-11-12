// src/mocks/handlers.ts
import { http, HttpResponse, delay } from 'msw';
import { menu } from './data';
import type { ApiError, Order, OrderRequest } from '../types';

// 瀏覽器中每個請求延遲 600 ms，方便觀察載入狀態；跑單元測試時不延遲
const LATENCY = import.meta.env.MODE === 'test' ? 0 : 600;

const orders = new Map<string, Order>();
let seq = 0;

/**
 * 測試錯誤狀態用的開關，讀「目前頁面網址」的 query string：
 *   ?fail=menu        → GET /api/menu 回 500
 *   ?fail=order       → POST /api/orders 回 500
 *   ?soldout=m-001    → 送出訂單時，該餐點「剛好」被賣完 → 409（模擬瀏覽途中售完）
 * MSW 2 的 handler 在頁面主執行緒執行，所以可以讀到 window.location。
 */
function pageParam(name: string): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get(name);
}

const apiError = (status: number, body: ApiError) => HttpResponse.json(body, { status });

function buildOrderId(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `o-${ymd}-${String(++seq).padStart(4, '0')}`;
}

// 依菜單價格計算小計與總額（價格以後端為準）
function buildOrder(id: string, body: OrderRequest): Order {
  const items = body.items.map(({ menuItemId, quantity }) => {
    const m = menu.find((x) => x.id === menuItemId)!;
    return { menuItemId, name: m.name, unitPrice: m.price, quantity, subtotal: m.price * quantity };
  });
  return {
    id,
    items,
    note: body.note ?? '',
    total: items.reduce((sum, i) => sum + i.subtotal, 0),
    status: 'received',
    createdAt: new Date().toISOString(),
  };
}

export const handlers = [
  http.get('/api/menu', async () => {
    await delay(LATENCY);
    if (pageParam('fail') === 'menu') {
      return apiError(500, { code: 'SERVER_ERROR', message: '伺服器忙碌中，無法取得菜單' });
    }
    return HttpResponse.json(menu);
  }),

  http.post('/api/orders', async ({ request }) => {
    await delay(LATENCY);
    if (pageParam('fail') === 'order') {
      return apiError(500, { code: 'SERVER_ERROR', message: '伺服器發生錯誤，訂單未送出，請稍後再試' });
    }

    const body = (await request.json()) as OrderRequest;
    if (!body.items?.length) {
      return apiError(400, { code: 'EMPTY_ORDER', message: '購物車是空的' });
    }

    // 模擬「瀏覽菜單時還有，送出時剛好賣完」
    const soldOutNow = pageParam('soldout');
    if (soldOutNow) {
      const target = menu.find((m) => m.id === soldOutNow);
      if (target) target.available = false;
    }

    const soldOut = body.items.filter((i) => !menu.find((m) => m.id === i.menuItemId)?.available);
    if (soldOut.length) {
      const names = soldOut.map((i) => menu.find((m) => m.id === i.menuItemId)?.name ?? i.menuItemId).join('、');
      return apiError(409, {
        code: 'ITEM_UNAVAILABLE',
        message: `${names} 已售完，請從購物車移除後再送出`,
        details: soldOut.map((i) => ({ menuItemId: i.menuItemId })),
      });
    }

    const order = buildOrder(buildOrderId(), body);
    orders.set(order.id, order);
    return HttpResponse.json(order, { status: 201 });
  }),

  http.get('/api/orders/:id', async ({ params }) => {
    await delay(LATENCY);
    const order = orders.get(params.id as string);
    return order
      ? HttpResponse.json(order)
      : apiError(404, { code: 'ORDER_NOT_FOUND', message: '查無此訂單' });
  }),
];
