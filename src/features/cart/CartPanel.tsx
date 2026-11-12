import { useNavigate } from 'react-router';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { useSubmitOrderMutation } from '../../services/api';
import { formatPrice } from '../../format';
import { MAX_NOTE_LENGTH, MAX_QTY, clearCart, removeItem, setNote, setQuantity } from './cartSlice';
import {
  selectCartLines,
  selectCartNote,
  selectCartTotal,
  selectHasUnavailable,
  selectIsCartEmpty,
  selectOrderRequest,
  type CartLine,
} from './cartSelectors';

export function CartPanel() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const lines = useAppSelector(selectCartLines);
  const total = useAppSelector(selectCartTotal);
  const note = useAppSelector(selectCartNote);
  const isEmpty = useAppSelector(selectIsCartEmpty);
  const hasUnavailable = useAppSelector(selectHasUnavailable);
  const orderRequest = useAppSelector(selectOrderRequest);

  // mutation 的 isLoading 用來停用按鈕，防止重複送出
  const [submitOrder, { isLoading: isSubmitting }] = useSubmitOrderMutation();

  const canSubmit = !isEmpty && !hasUnavailable && !isSubmitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    try {
      // unwrap()：成功回傳 Order，失敗 throw error
      const order = await submitOrder(orderRequest).unwrap();
      // 走到這裡時，cartSlice 的 extraReducers 已經在 fulfilled 時清空購物車
      navigate(`/orders/${order.id}`);
    } catch {
      // 錯誤提示由 errorToastMiddleware 統一處理；409 時 api.middleware 會讓 Menu 失效並重新載入
    }
  }

  return (
    <aside className="cart" aria-labelledby="cart-title">
      <div className="cart__header">
        <h2 id="cart-title">購物車</h2>
        {!isEmpty && (
          <button type="button" className="btn btn--link" onClick={() => dispatch(clearCart())} disabled={isSubmitting}>
            清空購物車
          </button>
        )}
      </div>

      {isEmpty ? (
        <p className="cart__empty">購物車是空的，從左側菜單挑選餐點吧！</p>
      ) : (
        <ul className="cart__lines">
          {lines.map((line) => (
            <CartLineRow key={line.id} line={line} disabled={isSubmitting} />
          ))}
        </ul>
      )}

      <label className="cart__note">
        <span>訂單備註</span>
        <textarea
          value={note}
          maxLength={MAX_NOTE_LENGTH}
          rows={3}
          placeholder="例如：不要酸黃瓜"
          onChange={(e) => dispatch(setNote(e.target.value))}
          disabled={isSubmitting}
        />
        <span className="cart__note-count" aria-live="polite">
          {note.length}/{MAX_NOTE_LENGTH}
        </span>
      </label>

      {hasUnavailable && (
        <p className="cart__warning" role="alert">
          購物車中有無法購買的餐點，請移除後再送出。
        </p>
      )}

      <div className="cart__total">
        <span>總額（預覽）</span>
        <strong data-testid="cart-total">{formatPrice(total)}</strong>
      </div>

      <button type="button" className="btn btn--primary btn--block" onClick={handleSubmit} disabled={!canSubmit}>
        {isSubmitting ? '送出中…' : '送出訂單'}
      </button>
    </aside>
  );
}

function CartLineRow({ line, disabled }: { line: CartLine; disabled: boolean }) {
  const dispatch = useAppDispatch();
  const name = line.item?.name ?? '已下架餐點';
  const changeQty = (quantity: number) => dispatch(setQuantity({ menuItemId: line.id, quantity }));

  return (
    <li className={line.unavailable ? 'cart-line cart-line--unavailable' : 'cart-line'} data-testid={`cart-line-${line.id}`}>
      <div className="cart-line__info">
        <span className="cart-line__name">{name}</span>
        {line.unavailable ? (
          <span className="tag tag--danger">無法購買</span>
        ) : (
          <span className="cart-line__unit">{formatPrice(line.item!.price)}</span>
        )}
      </div>
      <div className="cart-line__controls">
        <div className="stepper" role="group" aria-label={`${name} 數量`}>
          <button type="button" aria-label={`減少 ${name}`} onClick={() => changeQty(line.quantity - 1)} disabled={disabled}>
            −
          </button>
          <output aria-label={`${name} 數量`}>{line.quantity}</output>
          <button
            type="button"
            aria-label={`增加 ${name}`}
            onClick={() => changeQty(line.quantity + 1)}
            disabled={disabled || line.unavailable || line.quantity >= MAX_QTY}
          >
            +
          </button>
        </div>
        <span className="cart-line__subtotal">{formatPrice(line.subtotal)}</span>
        <button
          type="button"
          className="btn btn--link btn--danger"
          aria-label={`移除 ${name}`}
          onClick={() => dispatch(removeItem(line.id))}
          disabled={disabled}
        >
          移除
        </button>
      </div>
    </li>
  );
}
