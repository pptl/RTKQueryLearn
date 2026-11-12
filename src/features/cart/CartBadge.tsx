import { Link } from 'react-router';
import { useAppSelector } from '../../app/hooks';
import { selectCartCount } from './cartSelectors';

export function CartBadge() {
  const count = useAppSelector(selectCartCount);
  return (
    <Link to="/" className="cart-badge" aria-label={`購物車，共 ${count} 件`}>
      <span aria-hidden="true">🛒</span> 購物車
      <span className="cart-badge__count" data-testid="cart-badge-count">
        {count}
      </span>
    </Link>
  );
}
