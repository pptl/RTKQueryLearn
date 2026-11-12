import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { setupStore } from '../app/store';
import { App } from '../App';

function renderApp(route = '/') {
  const store = setupStore(); // 每個測試一個乾淨的 store（含乾淨的 RTK Query 快取）
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[route]}>
        <App />
      </MemoryRouter>
    </Provider>,
  );
  return { store, user: userEvent.setup() };
}

describe('點餐完整流程', () => {
  it('加入 → 送出 → 導向訂單完成頁', async () => {
    const { store, user } = renderApp();

    // 菜單載入：先骨架，再顯示卡片
    expect(screen.getAllByTestId('menu-skeleton').length).toBeGreaterThan(0);
    await user.click(await screen.findByRole('button', { name: '加入 經典牛肉堡' }));
    await user.click(screen.getByRole('button', { name: '加入 經典牛肉堡' }));
    await user.click(screen.getByRole('button', { name: '加入 紅茶' }));

    expect(screen.getByTestId('cart-badge-count')).toHaveTextContent('3');
    expect(screen.getByTestId('cart-total')).toHaveTextContent('NT$ 353');

    await user.type(screen.getByPlaceholderText('例如：不要酸黃瓜'), '不要酸黃瓜');
    await user.click(screen.getByRole('button', { name: '送出訂單' }));

    // 訂單完成頁
    expect(await screen.findByRole('heading', { name: '訂單已送出' })).toBeInTheDocument();
    expect(screen.getByTestId('order-id')).toHaveTextContent(/^o-\d{8}-\d{4}$/);
    expect(screen.getByTestId('order-total')).toHaveTextContent('NT$ 353');
    expect(screen.getByText('不要酸黃瓜')).toBeInTheDocument();

    // 購物車與備註已清空
    expect(store.getState().cart).toEqual({ items: {}, note: '' });
    expect(screen.getByTestId('cart-badge-count')).toHaveTextContent('0');
  });

  it('送出失敗（500）：顯示後端訊息，購物車保留', async () => {
    server.use(
      http.post('/api/orders', () =>
        HttpResponse.json({ code: 'SERVER_ERROR', message: '伺服器爆炸了' }, { status: 500 }),
      ),
    );
    const { store, user } = renderApp();

    await user.click(await screen.findByRole('button', { name: '加入 拿鐵' }));
    await user.click(screen.getByRole('button', { name: '送出訂單' }));

    expect(await screen.findByText('伺服器爆炸了')).toBeInTheDocument();
    expect(store.getState().cart.items).toEqual({ 'm-202': 1 });
    expect(screen.getByRole('button', { name: '送出訂單' })).toBeEnabled();
  });

  it('送出時餐點已售完（409）：菜單重新載入，該餐點標示無法購買且不能送出', async () => {
    const { user } = renderApp();
    await user.click(await screen.findByRole('button', { name: '加入 經典牛肉堡' }));

    // 模擬「瀏覽途中被賣完」：之後的菜單與下單都視為售完
    const { menu } = await import('../mocks/data');
    menu.find((m) => m.id === 'm-001')!.available = false;

    await user.click(screen.getByRole('button', { name: '送出訂單' }));

    expect(await screen.findByText('經典牛肉堡 已售完，請從購物車移除後再送出')).toBeInTheDocument();
    // invalidatesTags(['Menu']) → 重新請求菜單 → selector 重算
    const line = await screen.findByTestId('cart-line-m-001');
    expect(await within(line).findByText('無法購買')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '送出訂單' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '經典牛肉堡 已售完' })).toBeDisabled();
  });

  it('訂單不存在：顯示「查無此訂單」', async () => {
    renderApp('/orders/o-not-exist');
    expect(await screen.findByRole('heading', { name: '查無此訂單' })).toBeInTheDocument();
  });
});
