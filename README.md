# 簡易點餐系統（React + Redux Toolkit + RTK Query）

依 PRD 實作的 Redux 練習專案。後端全部由 MSW 模擬。

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # Vitest + RTL + MSW
npm run typecheck
```

## 測試錯誤狀態的網址開關

| 網址 | 效果 |
| --- | --- |
| `/?fail=menu` | `GET /api/menu` 回 500 → 錯誤訊息 + 重新載入 |
| `/?fail=order` | `POST /api/orders` 回 500 → toast，購物車保留 |
| `/?soldout=m-001` | 送出時該餐點「剛好」售完 → 409 → 菜單重新載入、購物車標示無法購買 |
| `/orders/不存在的id` | 404 → 查無此訂單 |

> mock 的訂單存在記憶體，重新整理頁面後舊訂單會變成 404，訂單編號也會從 0001 重新開始。

## 讀程式碼的建議順序

1. [src/services/api.ts](src/services/api.ts)：`createApi`、`providesTags` / `invalidatesTags`（409 才讓 Menu 失效）
2. [src/features/cart/cartSlice.ts](src/features/cart/cartSlice.ts)：`createSlice`、`extraReducers` 監聽 `submitOrder.matchFulfilled`
3. [src/features/cart/cartSelectors.ts](src/features/cart/cartSelectors.ts)：`createSelector` 組合購物車與菜單快取，注意參考穩定的寫法
4. [src/app/middleware/errorToastMiddleware.ts](src/app/middleware/errorToastMiddleware.ts)：`isRejectedWithValue` + `matchRejected`
5. [src/app/store.ts](src/app/store.ts)：`configureStore`、`setupStore` 工廠（測試用）
6. [src/features/menu/MenuPage.tsx](src/features/menu/MenuPage.tsx)：`isLoading` vs `isFetching`、`refetch`
7. [src/features/cart/CartPanel.tsx](src/features/cart/CartPanel.tsx)：mutation `isLoading`、`unwrap()`
8. [src/test/orderFlow.test.tsx](src/test/orderFlow.test.tsx)：RTL + MSW 整合測試
