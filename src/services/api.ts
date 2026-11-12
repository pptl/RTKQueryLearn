// src/services/api.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { MenuItem, Order, OrderRequest } from '../types';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Menu', 'Order'],
  endpoints: (build) => ({
    getMenu: build.query<MenuItem[], void>({
      query: () => 'menu',
      providesTags: ['Menu'],
      // 菜單很少變動：沒有元件使用後仍保留 5 分鐘，回到菜單頁直接用快取
      keepUnusedDataFor: 300,
    }),

    submitOrder: build.mutation<Order, OrderRequest>({
      query: (body) => ({ url: 'orders', method: 'POST', body }),
      // invalidatesTags 在 fulfilled 與 rejected（有 payload）時都會被呼叫：
      // 只有 409「餐點已售完」時讓菜單失效 → 正在使用菜單的元件自動重新請求
      invalidatesTags: (_result, error) => (error?.status === 409 ? ['Menu'] : []),
    }),

    getOrder: build.query<Order, string>({
      query: (id) => `orders/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Order', id }],
    }),
  }),
});

export const { useGetMenuQuery, useSubmitOrderMutation, useGetOrderQuery } = api;
