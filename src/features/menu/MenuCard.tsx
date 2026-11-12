import { memo } from 'react';
import { useAppDispatch } from '../../app/hooks';
import { addItem } from '../cart/cartSlice';
import { formatPrice } from '../../format';
import type { MenuItem } from '../../types';

// MenuCard 只 dispatch、不訂閱購物車，所以加入餐點時卡片不會重渲染。
// memo：父層（MenuPage）因切換分類重渲染時，item 參考沒變的卡片直接略過。
export const MenuCard = memo(function MenuCard({ item }: { item: MenuItem }) {
  const dispatch = useAppDispatch();
  const soldOut = !item.available;

  return (
    <article className={soldOut ? 'card card--soldout' : 'card'} data-testid={`menu-card-${item.id}`}>
      <div className="card__image">
        <img src={item.imageUrl} alt={item.name} loading="lazy" />
        {soldOut && <span className="card__badge">已售完</span>}
      </div>
      <div className="card__body">
        <h3 className="card__title">{item.name}</h3>
        <p className="card__desc">{item.description}</p>
        <div className="card__footer">
          <span className="card__price">{formatPrice(item.price)}</span>
          <button
            type="button"
            className="btn btn--primary"
            disabled={soldOut}
            aria-label={soldOut ? `${item.name} 已售完` : `加入 ${item.name}`}
            onClick={() => dispatch(addItem(item.id))}
          >
            {soldOut ? '已售完' : '加入'}
          </button>
        </div>
      </div>
    </article>
  );
});
