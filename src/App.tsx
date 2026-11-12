import { Link, Navigate, Route, Routes } from 'react-router';
import { Toaster } from 'react-hot-toast';
import { CartBadge } from './features/cart/CartBadge';
import { MenuPage } from './features/menu/MenuPage';
import { OrderCompletePage } from './features/order/OrderCompletePage';

export function App() {
  return (
    <>
      <header className="app-header">
        <Link to="/" className="app-header__brand">
          🍔 簡易點餐
        </Link>
        <CartBadge />
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<MenuPage />} />
          <Route path="/orders/:id" element={<OrderCompletePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
    </>
  );
}
