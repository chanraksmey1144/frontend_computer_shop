import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCart, updateCartItem, removeCartItem } from '../../services/cartService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common';
import { ImageFallback } from '../../components/common';
import { formatMoney } from '../../utils/format';
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Truck,
  ChevronRight,
} from 'lucide-react';

export default function Cart() {
  const { isAuthenticated } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({ subtotal: 0, discount: 0, delivery_fee: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(new Set());

  useEffect(() => {
    loadCart();
  }, []);

  async function loadCart() {
    setLoading(true);
    try {
      const res = await getCart();
      const data = res.data.data || res.data || {};
      setItems(data.items || []);
      setSummary({
        subtotal: data.subtotal ?? 0,
        discount: data.discount ?? 0,
        delivery_fee: data.delivery_fee ?? 0,
        total: data.total ?? 0,
      });
    } catch {
      setItems([]);
      setSummary({ subtotal: 0, discount: 0, delivery_fee: 0, total: 0 });
    } finally {
      setLoading(false);
    }
  }

  async function updateQuantity(itemId, delta) {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    const next = item.quantity + delta;
    if (next <= 0) {
      await removeItem(itemId);
      return;
    }
    setSaving((prev) => new Set([...prev, itemId]));
    try {
      await updateCartItem(itemId, { quantity: next });
      await loadCart();
    } catch (err) {
      show({ title: 'Update failed', description: err.message || 'Could not update quantity.', type: 'error' });
    } finally {
      setSaving((prev) => {
        const n = new Set(prev);
        n.delete(itemId);
        return n;
      });
    }
  }

  async function removeItem(itemId) {
    setSaving((prev) => new Set([...prev, itemId]));
    try {
      await removeCartItem(itemId);
      await loadCart();
    } catch (err) {
      show({ title: 'Remove failed', description: err.message || 'Could not remove item.', type: 'error' });
    } finally {
      setSaving((prev) => {
        const n = new Set(prev);
        n.delete(itemId);
        return n;
      });
    }
  }

  function handleCheckout() {
    if (!isAuthenticated) {
      show({ title: 'Login required', description: 'Please log in to place an order.', type: 'warning' });
      navigate('/login');
      return;
    }
    navigate('/checkout');
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="h-8 w-40 animate-pulse rounded bg-slate-200" />
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="h-72 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-72 animate-pulse rounded-2xl bg-slate-200" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white px-6 py-20 text-center shadow-sm">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <ShoppingBag className="h-8 w-8" />
        </span>
        <h1 className="mt-5 text-2xl font-bold text-slate-900">Your cart is empty</h1>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-slate-500">
          Looks like you haven't added anything yet. Explore our latest computers and accessories.
        </p>
        <Link
          to="/products"
          className="mt-7 inline-flex h-11 items-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Start shopping <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1.5 text-xs text-slate-400">
        <Link to="/" className="transition-colors hover:text-brand-600">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-slate-600">Cart</span>
      </nav>

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Shopping cart</h1>
        <p className="mt-1 text-sm text-slate-500">
          {items.length} item{items.length !== 1 ? 's' : ''} in your cart
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Items */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <ul className="divide-y divide-slate-100">
            {items.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                onUpdate={updateQuantity}
                onRemove={removeItem}
                saving={saving}
              />
            ))}
          </ul>
          <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4">
            <Link
              to="/products"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700"
            >
              ← Continue shopping
            </Link>
          </div>
        </div>

        {/* Summary */}
        <div className="lg:sticky lg:top-24">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Order summary</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Subtotal</dt>
                <dd className="font-medium text-slate-900">{formatMoney(summary.subtotal)}</dd>
              </div>
              {summary.discount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Discount</dt>
                  <dd className="font-medium text-emerald-600">−{formatMoney(summary.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-slate-500">Delivery fee</dt>
                <dd className="font-medium text-slate-900">{formatMoney(summary.delivery_fee)}</dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-slate-100 pt-3">
                <dt className="font-semibold text-slate-900">Total</dt>
                <dd className="text-2xl font-extrabold tracking-tight text-slate-900">
                  {formatMoney(summary.total)}
                </dd>
              </div>
            </dl>

            <button
              type="button"
              onClick={handleCheckout}
              className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 text-sm font-semibold text-white shadow-sm shadow-brand-600/20 transition-colors hover:bg-brand-700"
            >
              {isAuthenticated ? 'Proceed to checkout' : 'Log in to checkout'}
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
              <p className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-brand-600" /> Secure checkout & buyer protection
              </p>
              <p className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-brand-600" /> Free delivery over $100 in Phnom Penh
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CartItemRow({ item, onUpdate, onRemove, saving }) {
  const product = item.product || {};
  const busy = saving.has(item.id);
  const unitPrice = item.unit_price ?? product.price ?? 0;
  const lineTotal = unitPrice * (item.quantity || 0);

  return (
    <li className="flex gap-4 p-4 sm:p-5">
      <Link
        to={product.id ? `/products/${product.id}` : '/products'}
        className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
      >
        <ImageFallback
          src={product.image_url || null}
          alt={product.name || 'Item'}
          className="h-full w-full"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              to={product.id ? `/products/${product.id}` : '/products'}
              className="line-clamp-2 text-sm font-semibold text-slate-900 transition-colors hover:text-brand-600"
            >
              {product.name || 'Product'}
            </Link>
            <p className="mt-0.5 text-xs text-slate-400">SKU: {product.sku || '—'}</p>
          </div>
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            disabled={busy}
            className="-mr-1 shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
            aria-label="Remove item"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
          <div className="flex items-center rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => onUpdate(item.id, -1)}
              disabled={busy}
              className="flex h-9 w-9 items-center justify-center rounded-l-xl text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
              aria-label="Decrease quantity"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-9 text-center text-sm font-semibold text-slate-900">{item.quantity}</span>
            <button
              type="button"
              onClick={() => onUpdate(item.id, 1)}
              disabled={busy}
              className="flex h-9 w-9 items-center justify-center rounded-r-xl text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
              aria-label="Increase quantity"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-400">{formatMoney(unitPrice)} each</p>
            <p className="text-base font-bold text-slate-900">{formatMoney(lineTotal)}</p>
          </div>
        </div>
      </div>
    </li>
  );
}
