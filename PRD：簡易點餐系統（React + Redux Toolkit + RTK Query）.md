# PRD：簡易點餐系統（React + Redux Toolkit + RTK Query）

Nov 12, 2026 · @Alen

## 產品概述

這是一個單店、單一使用者的點餐網頁：顧客瀏覽菜單、把餐點加入購物車、送出訂單並看到訂單編號。後端全部使用 mock API。

本專案的主要目的是**練習 Redux Toolkit 與 RTK Query 的完整資料流**，因此刻意把 server state（菜單、訂單）交給 RTK Query，把 client state（購物車）交給 slice，並用 selector 組合兩者。

**範圍內**

- 菜單瀏覽（含分類篩選）
- 購物車：加入、調整數量、移除、即時計算總額
- 送出訂單、顯示訂單完成頁
- 載入中、錯誤、售完等狀態處理

**範圍外（非目標）**

- 會員登入、付款、優惠券
- 後台管理、庫存管理
- 真實後端與資料庫
- 多語系、手機版版面（只做桌面版）

## 使用者流程

整個流程只有兩個頁面：菜單頁（含購物車側欄）和訂單完成頁。

1. 開啟網站，進入菜單頁 `/`，系統載入菜單。
2. 點選分類標籤（主餐、點心、飲料）篩選餐點。
3. 點擊餐點的「加入」，餐點進入購物車，右側購物車和徽章數字即時更新。
4. 在購物車中調整數量或移除餐點，可填寫備註。
5. 點擊「送出訂單」。
   - 成功：清空購物車，導向 `/orders/:id`。
   - 失敗：跳出錯誤提示，購物車保留，可重試。
6. 在訂單完成頁看到訂單編號、明細、總額，可點擊「繼續點餐」回到菜單頁。

## 功能需求

共 4 個功能，每個功能列出可以直接拿來檢查的驗收條件。

### F1 菜單頁

- [ ] 進入頁面時呼叫 `GET /api/menu`，載入中顯示骨架畫面（skeleton）
- [ ] 餐點卡片顯示名稱、描述、價格、圖片
- [ ] 分類標籤：全部、主餐、點心、飲料；切換分類不重新發出請求（在前端篩選）
- [ ] `available: false` 的餐點顯示「已售完」，加入按鈕停用
- [ ] 載入失敗時顯示錯誤訊息與「重新載入」按鈕
- [ ] 離開再回到菜單頁時，若快取還在，直接顯示而不重新請求

### F2 購物車

- [ ] 點擊「加入」：餐點不在購物車則新增（數量 1），已存在則數量 +1
- [ ] 每項餐點可用 +/- 調整數量，範圍 1～10；減到 0 時自動移除
- [ ] 可直接移除單一餐點、可清空整個購物車
- [ ] 小計與總額由菜單的最新價格即時計算，不存在購物車裡
- [ ] 購物車徽章顯示餐點總件數
- [ ] 購物車為空時顯示提示文字，「送出訂單」停用
- [ ] 可填寫訂單備註，最多 100 字

### F3 送出訂單

- [ ] 點擊送出後呼叫 `POST /api/orders`，請求中按鈕停用並顯示「送出中…」，防止重複送出
- [ ] 成功：清空購物車、清空備註，導向 `/orders/:id`
- [ ] 失敗：由全域錯誤提示顯示後端的 `message`，購物車保留
- [ ] 後端回應「餐點已售完」時，重新載入菜單，購物車中該餐點標示為無法購買

### F4 訂單完成頁

- [ ] 依網址中的 id 呼叫 `GET /api/orders/:id`
- [ ] 顯示訂單編號、狀態、餐點明細、備註、總額、建立時間
- [ ] 訂單不存在（404）時顯示「查無此訂單」
- [ ] 「繼續點餐」按鈕回到菜單頁

## 資料模型

購物車只存「餐點 id 與數量」，不存價格；價格一律從菜單快取查，避免兩份資料不一致。金額單位為新台幣，整數。

```ts
// src/types.ts
export type Category = 'main' | 'side' | 'drink';

export interface MenuItem {
  id: string;          // 'm-001'
  name: string;
  description: string;
  price: number;       // TWD
  category: Category;
  imageUrl: string;
  available: boolean;  // false = 售完
}

// client state：購物車
export interface CartState {
  items: Record<string, number>;  // { [menuItemId]: quantity }
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
  id: string;          // 'o-20261112-0001'
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
  createdAt: string;   // ISO 8601
}

// 共用錯誤格式
export interface ApiError {
  code: string;
  message: string;
  details?: { menuItemId?: string }[];
}
```

訂單的單價與總額由後端計算並回傳；前端購物車的總額只是預覽，永遠以 `Order.total` 為準。

## Mock API 規格

API 用 MSW（Mock Service Worker）模擬，在瀏覽器層攔截請求。前端程式碼和接真實後端時完全一樣，之後只要移除 MSW 就能切換。每個請求加上 600 ms 延遲，方便觀察載入狀態。

| 方法 | 路徑 | 用途 | 成功回應 | 錯誤回應 |
| --- | --- | --- | --- | --- |
| GET | `/api/menu` | 取得完整菜單 | 200，`MenuItem[]` | 500 `SERVER_ERROR` |
| POST | `/api/orders` | 建立訂單 | 201，`Order` | 400 `EMPTY_ORDER`、409 `ITEM_UNAVAILABLE`、500 `SERVER_ERROR` |
| GET | `/api/orders/:id` | 取得單筆訂單 | 200，`Order` | 404 `ORDER_NOT_FOUND` |

### GET /api/menu 回應範例

```json
[
  { "id": "m-001", "name": "經典牛肉堡", "description": "雙層牛肉、切達起司", "price": 159, "category": "main", "imageUrl": "/img/burger.jpg", "available": true },
  { "id": "m-002", "name": "辣味雞腿堡", "description": "酥炸雞腿、辣味美乃滋", "price": 139, "category": "main", "imageUrl": "/img/chicken.jpg", "available": true },
  { "id": "m-003", "name": "鮭魚堡", "description": "鮭魚排、塔塔醬", "price": 149, "category": "main", "imageUrl": "/img/salmon.jpg", "available": false },
  { "id": "m-101", "name": "薄脆薯條", "description": "中份", "price": 59, "category": "side", "imageUrl": "/img/fries.jpg", "available": true },
  { "id": "m-102", "name": "洋蔥圈", "description": "6 入", "price": 69, "category": "side", "imageUrl": "/img/onion.jpg", "available": true },
  { "id": "m-201", "name": "紅茶", "description": "微糖，中杯", "price": 35, "category": "drink", "imageUrl": "/img/tea.jpg", "available": true },
  { "id": "m-202", "name": "拿鐵", "description": "熱，中杯", "price": 75, "category": "drink", "imageUrl": "/img/latte.jpg", "available": true }
]
```

### POST /api/orders

請求：

```json
{ "items": [{ "menuItemId": "m-001", "quantity": 2 }, { "menuItemId": "m-201", "quantity": 1 }], "note": "不要酸黃瓜" }
```

成功回應（201）：

```json
{
  "id": "o-20261112-0001",
  "items": [
    { "menuItemId": "m-001", "name": "經典牛肉堡", "unitPrice": 159, "quantity": 2, "subtotal": 318 },
    { "menuItemId": "m-201", "name": "紅茶", "unitPrice": 35, "quantity": 1, "subtotal": 35 }
  ],
  "note": "不要酸黃瓜",
  "total": 353,
  "status": "received",
  "createdAt": "2026-11-12T07:30:00.000Z"
}
```

餐點已售完（409）：

```json
{ "code": "ITEM_UNAVAILABLE", "message": "鮭魚堡 已售完，請從購物車移除後再送出", "details": [{ "menuItemId": "m-003" }] }
```

### MSW handler 骨架

```ts
// src/mocks/handlers.ts
import { http, HttpResponse, delay } from 'msw';
import { menu } from './data';

const orders = new Map<string, Order>();
let seq = 0;

export const handlers = [
  http.get('/api/menu', async () => {
    await delay(600);
    return HttpResponse.json(menu);
  }),

  http.post('/api/orders', async ({ request }) => {
    await delay(600);
    const body = (await request.json()) as OrderRequest;
    if (!body.items?.length) {
      return HttpResponse.json({ code: 'EMPTY_ORDER', message: '購物車是空的' }, { status: 400 });
    }
    const soldOut = body.items.filter((i) => !menu.find((m) => m.id === i.menuItemId)?.available);
    if (soldOut.length) {
      return HttpResponse.json(
        { code: 'ITEM_UNAVAILABLE', message: '部分餐點已售完', details: soldOut.map((i) => ({ menuItemId: i.menuItemId })) },
        { status: 409 },
      );
    }
    const order = buildOrder(`o-${++seq}`, body); // 依菜單價格計算小計與總額
    orders.set(order.id, order);
    return HttpResponse.json(order, { status: 201 });
  }),

  http.get('/api/orders/:id', async ({ params }) => {
    await delay(600);
    const order = orders.get(params.id as string);
    return order
      ? HttpResponse.json(order)
      : HttpResponse.json({ code: 'ORDER_NOT_FOUND', message: '查無此訂單' }, { status: 404 });
  }),
];
```

測試錯誤狀態時，可在網址加上 `?fail=menu` 或 `?fail=order`，讓對應的 handler 回傳 500。

## 技術架構

server state 全部交給 RTK Query，只有購物車是自己寫的 slice。

| 層面 | 選用 |
| --- | --- |
| 建置工具 | Vite + React 18 + TypeScript |
| 狀態管理 | `@reduxjs/toolkit` 2.x、`react-redux` 9.x |
| server state | RTK Query（`createApi` + `fetchBaseQuery`） |
| 路由 | React Router（`/`、`/orders/:id`） |
| Mock API | MSW 2.x |
| 測試 | Vitest + React Testing Library（搭配 MSW） |

### State 分工

| 資料 | 類型 | 存放位置 |
| --- | --- | --- |
| 菜單 | server state | RTK Query 快取 `state.api` |
| 訂單 | server state | RTK Query 快取 `state.api` |
| 購物車餐點與數量、備註 | client state，跨元件共享 | `cartSlice` → `state.cart` |
| 目前選取的分類標籤 | client state，只有菜單頁使用 | 元件內 `useState` |
| 購物車總額、件數 | 衍生資料，不儲存 | `createSelector` |

分類標籤刻意不放進 Redux：只有一個元件使用的狀態，放在元件內最簡單。

### 檔案結構

```text
src/
  app/
    store.ts                    ← configureStore、RootState、AppDispatch
    hooks.ts                    ← useAppDispatch、useAppSelector
    middleware/
      errorToastMiddleware.ts   ← 統一錯誤提示
  services/
    api.ts                      ← createApi：getMenu、submitOrder、getOrder
  features/
    menu/
      MenuPage.tsx
      MenuCard.tsx
      CategoryTabs.tsx
    cart/
      cartSlice.ts
      cartSelectors.ts
      CartPanel.tsx
      CartBadge.tsx
    order/
      OrderCompletePage.tsx
  mocks/
    browser.ts                  ← setupWorker(...handlers)
    handlers.ts
    data.ts
  types.ts
  main.tsx                      ← 開發模式先啟動 MSW，再 render <Provider>
```

## Redux 設計

五個檔案構成整個 Redux 層：API 定義、購物車 slice、selector、錯誤 middleware、store。

### RTK Query endpoints

| Endpoint | 類型 | 請求 | Tags | 說明 |
| --- | --- | --- | --- | --- |
| `getMenu` | query | GET `/menu` | provides `Menu` | `keepUnusedDataFor: 300`，菜單很少變動 |
| `submitOrder` | mutation | POST `/orders` | 失敗且為 409 時 invalidates `Menu` | 售完時自動重新載入菜單 |
| `getOrder` | query | GET `/orders/:id` | provides `Order:<id>` | 訂單完成頁使用 |

```ts
// src/services/api.ts
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Menu', 'Order'],
  endpoints: (build) => ({
    getMenu: build.query<MenuItem[], void>({
      query: () => 'menu',
      providesTags: ['Menu'],
      keepUnusedDataFor: 300,
    }),
    submitOrder: build.mutation<Order, OrderRequest>({
      query: (body) => ({ url: 'orders', method: 'POST', body }),
      invalidatesTags: (_result, error) => (error?.status === 409 ? ['Menu'] : []),
    }),
    getOrder: build.query<Order, string>({
      query: (id) => `orders/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Order', id }],
    }),
  }),
});

export const { useGetMenuQuery, useSubmitOrderMutation, useGetOrderQuery } = api;
```

### cartSlice

| Action | Payload | 行為 |
| --- | --- | --- |
| `cart/addItem` | `menuItemId` | 不存在則設為 1，存在則 +1，上限 10 |
| `cart/setQuantity` | `{ menuItemId, quantity }` | 限制在 0～10；0 則移除 |
| `cart/removeItem` | `menuItemId` | 移除該餐點 |
| `cart/setNote` | `string` | 最多 100 字 |
| `cart/clearCart` | 無 | 清空餐點與備註 |
| `api/.../submitOrder/fulfilled` | 外部 action | 透過 `extraReducers` 回到初始狀態 |

```ts
// src/features/cart/cartSlice.ts
const MAX_QTY = 10;
const initialState: CartState = { items: {}, note: '' };

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem(state, action: PayloadAction<string>) {
      const id = action.payload;
      state.items[id] = Math.min((state.items[id] ?? 0) + 1, MAX_QTY);
    },
    setQuantity(state, action: PayloadAction<{ menuItemId: string; quantity: number }>) {
      const { menuItemId, quantity } = action.payload;
      if (quantity <= 0) delete state.items[menuItemId];
      else state.items[menuItemId] = Math.min(quantity, MAX_QTY);
    },
    removeItem(state, action: PayloadAction<string>) {
      delete state.items[action.payload];
    },
    setNote(state, action: PayloadAction<string>) {
      state.note = action.payload.slice(0, 100);
    },
    clearCart: () => initialState,
  },
  extraReducers: (builder) => {
    builder.addMatcher(api.endpoints.submitOrder.matchFulfilled, () => initialState);
  },
});
```

### Selectors

購物車只存 id 與數量，顯示用的資料一律用 `createSelector` 結合菜單快取算出來。

```ts
// src/features/cart/cartSelectors.ts
const selectMenu = (s: RootState) => api.endpoints.getMenu.select()(s).data ?? [];
const selectCartItems = (s: RootState) => s.cart.items;

export const selectCartCount = createSelector([selectCartItems], (items) =>
  Object.values(items).reduce((sum, q) => sum + q, 0),
);

export const selectCartLines = createSelector([selectCartItems, selectMenu], (items, menu) =>
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
```

### Middleware 與 store

`errorToastMiddleware` 只處理 rejected action，其他一律放行。`getMenu` 的錯誤由菜單頁自己顯示，所以只對 mutation 跳提示，避免同一個錯誤出現兩次。

```ts
// src/app/middleware/errorToastMiddleware.ts
export const errorToastMiddleware: Middleware = () => (next) => (action) => {
  if (isRejectedWithValue(action) && api.endpoints.submitOrder.matchRejected(action)) {
    const message = (action.payload as { data?: ApiError })?.data?.message ?? '送出失敗，請稍後再試';
    toast.error(message);
  }
  return next(action);
};

// src/app/store.ts
export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    cart: cartSlice.reducer,
  },
  middleware: (getDefault) => getDefault().concat(api.middleware, errorToastMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// src/app/hooks.ts
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
```

## 資料流

三個關鍵操作都走同一條路，差別只在是否經過 mock API。

&#91;embedded content: Redux 資料流 · 元件、middleware、reducer、selector\]

**載入菜單**

1. `MenuPage` 掛載，`useGetMenuQuery()` dispatch 一個 thunk。
2. 快取沒有資料 → `getMenu/pending` → `isLoading: true`。
3. GET `/api/menu`，MSW 回應 → `getMenu/fulfilled` → api reducer 寫入 `state.api`。
4. `MenuPage` 的 selector 結果改變 → 重渲染，顯示菜單。

**加入購物車**

1. dispatch `cart/addItem('m-001')`，三個 middleware 都直接放行。
2. cart reducer 更新 `state.cart.items`，`state.api` 參考不變。
3. `CartBadge`、`CartPanel` 的 selector 結果改變 → 重渲染；`MenuPage` 不訂閱購物車 → 不重渲染。

**送出訂單**

1. `submitOrder({ items, note })` → `submitOrder/pending` → 按鈕停用。
2. POST `/api/orders`。
3. 成功：`submitOrder/fulfilled` → cart reducer（`extraReducers`）清空購物車 → `unwrap()` resolve → 導向 `/orders/:id`。
4. 失敗：`submitOrder/rejected` → `errorToastMiddleware` 跳出提示；若為 409，`api.middleware` 讓 `Menu` tag 失效 → 重新載入菜單 → 售完餐點在購物車中被標示。

## 非功能需求與邊界情況

每個邊界情況都對應到一個 Redux 機制，實作時可以當成檢查清單。

| 情況 | 預期行為 | 實現方式 |
| --- | --- | --- |
| 菜單第一次載入 | 顯示骨架畫面 | `isLoading` |
| 菜單背景重新載入 | 繼續顯示舊菜單，不出現骨架 | 區分 `isLoading` 與 `isFetching` |
| 菜單載入失敗 | 錯誤訊息 + 重新載入按鈕 | `isError` + `refetch()` |
| 連點「送出訂單」 | 只送出一次 | mutation 的 `isLoading` 停用按鈕 |
| 送出時餐點已售完（409） | 提示訊息；菜單重新載入；購物車中該餐點標示無法購買；移除前不能送出 | `invalidatesTags` → `selectCartLines` 重算 → `selectHasUnavailable` |
| 菜單價格改變 | 購物車總額自動更新 | 購物車不存價格，selector 依菜單重算 |
| 購物車內餐點已不在菜單中 | 標示為無法購買 | `item` 為 `undefined` 即視為 unavailable |
| 重新整理頁面 | 購物車清空（本版可接受） | 視為延伸練習 |
| 直接開啟不存在的訂單網址 | 顯示「查無此訂單」 | `getOrder` 的 404 錯誤 |

**效能要求**

- 加入餐點時，菜單列表不重新渲染：`MenuPage` 不訂閱 `state.cart`，用 React DevTools Profiler 驗證。
- selector 不在元件內寫 `filter`/`map` 產生新參考，一律用 `createSelector`。
- 開發模式下不出現 react-redux 的 selector 穩定性警告。

**可用性**

- 按鈕使用 `<button>`，數量調整可用鍵盤操作。
- 只支援桌面瀏覽器，最小寬度 1024px。

## 實作里程碑與延伸練習

依序完成 5 個里程碑，每個都可以單獨驗證。

1. **環境與 mock**：Vite + TS 專案、MSW 啟動，在瀏覽器可以打到 3 個 mock API。
2. **store 與菜單**：`configureStore`、`api.ts` 的 `getMenu`、菜單頁與分類篩選；在 Redux DevTools 看得到 pending → fulfilled。
3. **購物車**：`cartSlice`、selectors、購物車側欄與徽章；用 Profiler 確認加入餐點時菜單不重新渲染。
4. **送出訂單**：`submitOrder`、`errorToastMiddleware`、訂單完成頁；覆蓋 409 售完與 500 兩種失敗。
5. **測試**：`cartSlice` reducer 單元測試；用 RTL + MSW 測試「加入 → 送出 → 導向完成頁」完整流程。

### 延伸練習

完成主線後，每題對應一個面試常問的進階主題。

- [ ] 用 listener middleware 把購物車存到 localStorage（500 ms debounce），重新整理後還原
- [ ] 送出訂單改為樂觀更新，失敗時 `patch.undo()`
- [ ] 訂單完成頁加上 `pollingInterval`，每 5 秒更新訂單狀態，`ready` 後停止
- [ ] 用 `createEntityAdapter` 重寫購物車，比較和 `Record` 寫法的差異
- [ ] 用 `prepare` callback 在加入餐點時記錄 `addedAt`，維持 reducer 純粹
- [ ] 內容相同的功能改用 TanStack Query + Zustand 實作一次，寫下兩者的取捨
