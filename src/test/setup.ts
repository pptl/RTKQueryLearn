import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from '../mocks/server';
import { resetMenu } from '../mocks/data';

// Node 的 fetch / Request 不接受相對網址（'/api/menu'），瀏覽器會自動以頁面 origin 補齊。
// 這裡讓測試環境的行為和瀏覽器一致，應用程式碼就不必為了測試改 baseUrl。
const NativeRequest = globalThis.Request;
globalThis.Request = class extends NativeRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(typeof input === 'string' ? new URL(input, window.location.origin) : input, init);
  }
} as typeof Request;

// jsdom 沒有 matchMedia（react-hot-toast 用來偵測 prefers-reduced-motion）
window.matchMedia ??= (query: string) =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: () => false,
  }) as MediaQueryList;

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
  resetMenu();
});
afterAll(() => server.close());
