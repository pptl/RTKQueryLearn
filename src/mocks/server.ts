// src/mocks/server.ts：測試用 MSW，同一份 handlers 改在 Node 層攔截
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
