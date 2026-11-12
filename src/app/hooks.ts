// src/app/hooks.ts
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from './store';

// 帶型別的 hooks：元件內不用每次寫 RootState / AppDispatch
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
