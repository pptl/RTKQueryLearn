import { useMemo, useState } from 'react';
import { useGetMenuQuery } from '../../services/api';
import { getErrorMessage } from '../../format';
import { CartPanel } from '../cart/CartPanel';
import { CategoryTabs, type CategoryFilter } from './CategoryTabs';
import { MenuCard } from './MenuCard';

export function MenuPage() {
  // isLoading：第一次載入、快取完全沒有資料
  // isFetching：任何一次請求進行中（包含背景重新載入，此時 data 仍是舊的）
  const { data: menu, isLoading, isFetching, isError, error, refetch } = useGetMenuQuery();

  // 只有這個頁面用到的 UI 狀態 → 元件內 useState，不放 Redux
  const [category, setCategory] = useState<CategoryFilter>('all');

  // 前端篩選，不重新發出請求；useMemo 讓 menu、category 不變時回傳同一個陣列參考
  const visible = useMemo(
    () => (category === 'all' ? menu ?? [] : (menu ?? []).filter((m) => m.category === category)),
    [menu, category],
  );

  return (
    <div className="menu-layout">
      <section className="menu" aria-labelledby="menu-title">
        <div className="menu__header">
          <h1 id="menu-title">菜單</h1>
          {isFetching && !isLoading && (
            <span className="menu__refreshing" role="status">
              更新菜單中…
            </span>
          )}
        </div>

        <CategoryTabs value={category} onChange={setCategory} />

        {isLoading ? (
          <div className="grid" aria-busy="true" aria-label="菜單載入中">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="card skeleton" data-testid="menu-skeleton">
                <div className="skeleton__image" />
                <div className="card__body">
                  <div className="skeleton__line skeleton__line--title" />
                  <div className="skeleton__line" />
                  <div className="skeleton__line skeleton__line--short" />
                </div>
              </div>
            ))}
          </div>
        ) : isError && !menu ? (
          <div className="error-box" role="alert">
            <p>菜單載入失敗：{getErrorMessage(error, '請檢查網路連線')}</p>
            <button type="button" className="btn btn--primary" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? '載入中…' : '重新載入'}
            </button>
          </div>
        ) : visible.length === 0 ? (
          <p className="empty">這個分類目前沒有餐點</p>
        ) : (
          <div className="grid">
            {visible.map((item) => (
              <MenuCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* CartPanel 自己訂閱購物車；它重渲染時不會讓 MenuPage 重渲染 */}
      <CartPanel />
    </div>
  );
}
