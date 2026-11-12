// src/app/middleware/errorToastMiddleware.ts
import { isRejectedWithValue, type Middleware } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import type { ApiError } from '../../types';

/**
 * 統一的錯誤提示：只看 rejected action，其他一律放行。
 * getMenu 的錯誤由菜單頁自己顯示，所以這裡只處理 submitOrder，避免同一個錯誤出現兩次。
 *
 * isRejectedWithValue：baseQuery 回傳 { error } 時，RTK Query 會 rejectWithValue，
 * 後端的回應內容放在 action.payload = { status, data }。
 */
export const errorToastMiddleware: Middleware = () => (next) => (action) => {
  if (isRejectedWithValue(action) && api.endpoints.submitOrder.matchRejected(action)) {
    const message = (action.payload as { data?: ApiError })?.data?.message ?? '送出失敗，請稍後再試';
    toast.error(message, { id: 'submit-order-error' });
  }
  return next(action);
};
