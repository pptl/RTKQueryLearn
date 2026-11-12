// src/app/store.ts
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { api } from '../services/api';
import { cartReducer } from '../features/cart/cartSlice';
import { errorToastMiddleware } from './middleware/errorToastMiddleware';

const rootReducer = combineReducers({
  [api.reducerPath]: api.reducer, // server state：菜單、訂單
  cart: cartReducer, // client state：購物車
});

export type RootState = ReturnType<typeof rootReducer>;

// 用工廠函式建立 store：App 用一個，每個測試各自建立一個乾淨的
export function setupStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
    // api.middleware 負責快取生命週期、tag 失效後重新請求、polling 等
    middleware: (getDefault) => getDefault().concat(api.middleware, errorToastMiddleware),
  });
}

export const store = setupStore();

export type AppStore = ReturnType<typeof setupStore>;
export type AppDispatch = AppStore['dispatch'];
