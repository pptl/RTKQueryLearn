import { Link, useParams } from 'react-router';
import { skipToken } from '@reduxjs/toolkit/query/react';
import { useGetOrderQuery } from '../../services/api';
import { formatDateTime, formatPrice, getErrorMessage } from '../../format';
import type { OrderStatus } from '../../types';

const STATUS_LABEL: Record<OrderStatus, string> = {
  received: '已接單',
  preparing: '製作中',
  ready: '可取餐',
};

export function OrderCompletePage() {
  const { id } = useParams<{ id: string }>();
  // skipToken：沒有 id 時不發請求（比 { skip: true } 更好推導型別）
  const { data: order, isLoading, isError, error, refetch } = useGetOrderQuery(id ?? skipToken);

  const isNotFound = isError && error && 'status' in error && error.status === 404;

  let content;
  if (isLoading) {
    content = (
      <p className="order__loading" role="status">
        訂單載入中…
      </p>
    );
  } else if (isNotFound) {
    content = (
      <div className="error-box" role="alert">
        <h1>查無此訂單</h1>
        <p>訂單編號「{id}」不存在，請確認網址是否正確。</p>
      </div>
    );
  } else if (isError || !order) {
    content = (
      <div className="error-box" role="alert">
        <p>訂單載入失敗：{getErrorMessage(error, '請稍後再試')}</p>
        <button type="button" className="btn btn--primary" onClick={() => refetch()}>
          重新載入
        </button>
      </div>
    );
  } else {
    content = (
      <>
        <div className="order__hero">
          <span className="order__check" aria-hidden="true">
            ✓
          </span>
          <h1>訂單已送出</h1>
          <p>
            訂單編號 <strong data-testid="order-id">{order.id}</strong>
          </p>
        </div>

        <dl className="order__meta">
          <div>
            <dt>狀態</dt>
            <dd>
              <span className={`tag tag--${order.status}`}>{STATUS_LABEL[order.status]}</span>
            </dd>
          </div>
          <div>
            <dt>建立時間</dt>
            <dd>
              <time dateTime={order.createdAt}>{formatDateTime(order.createdAt)}</time>
            </dd>
          </div>
          <div>
            <dt>備註</dt>
            <dd>{order.note || '（無）'}</dd>
          </div>
        </dl>

        <table className="order__table">
          <thead>
            <tr>
              <th scope="col">餐點</th>
              <th scope="col">單價</th>
              <th scope="col">數量</th>
              <th scope="col">小計</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((i) => (
              <tr key={i.menuItemId}>
                <td>{i.name}</td>
                <td>{formatPrice(i.unitPrice)}</td>
                <td>{i.quantity}</td>
                <td>{formatPrice(i.subtotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colSpan={3}>
                總額
              </th>
              <td data-testid="order-total">{formatPrice(order.total)}</td>
            </tr>
          </tfoot>
        </table>
      </>
    );
  }

  return (
    <section className="order">
      {content}
      <Link to="/" className="btn btn--primary order__back">
        繼續點餐
      </Link>
    </section>
  );
}
