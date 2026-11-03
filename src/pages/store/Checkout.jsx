import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { EmptyState, ImageFallback } from '../../components/common';
import { formatMoney } from '../../utils/format';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleDashed,
  CreditCard,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Truck,
} from 'lucide-react';

const STEPS = [
  { label: 'Cart synced', text: 'Your items are saved to your account.', status: 'done', icon: ShoppingCart },
  { label: 'Delivery address', text: 'Manage saved addresses from your account.', status: 'done', icon: MapPin },
  { label: 'Order placement', text: 'Waiting for the orders API to be connected.', status: 'pending', icon: CreditCard },
];

export default function Checkout() {
  const { cart, loading } = useCart();
  const items = cart.items || [];
  const summary = {
    subtotal: cart.subtotal ?? 0,
    discount: cart.discount ?? 0,
    delivery_fee: cart.delivery_fee ?? 0,
    total: cart.total ?? 0,
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="h-24 animate-pulse rounded-2xl bg-slate-200/70" />
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="h-80 animate-pulse rounded-2xl bg-slate-200/70" />
          <div className="h-80 animate-pulse rounded-2xl bg-slate-200/70" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Add a few products to your cart before starting checkout."
          action={
            <Link
              to="/products"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Browse products <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="border-b border-slate-200 pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Checkout</p>
        <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-slate-900">Complete your order</h1>
        <p className="mt-1 text-sm text-slate-500">Review your cart and the current checkout status.</p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/70">
            <div className="flex flex-wrap items-start gap-3 border-b border-amber-200/70 px-5 py-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <CircleDashed className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-bold text-amber-900">Ordering is not available yet</h2>
                  <span className="rounded-full bg-amber-200/70 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-900">
                    API pending
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-amber-800">
                  Your cart and addresses work, but the backend does not expose an orders endpoint
                  in this build. We do not simulate a successful order. Your cart remains saved.
                </p>
              </div>
            </div>
            <ul className="grid gap-3 px-5 py-4 sm:grid-cols-3">
              {STEPS.map(({ label, text, status, icon: Icon }) => (
                <li key={label} className="rounded-xl border border-amber-200/70 bg-white/70 p-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                        status === 'done'
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {status === 'done' ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </span>
                    <p className="text-xs font-semibold text-slate-900">{label}</p>
                  </div>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">{text}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-base font-bold text-slate-900">Your items</h2>
              <span className="text-xs text-slate-400">{items.length} line item{items.length === 1 ? '' : 's'}</span>
            </div>
            <ul className="divide-y divide-slate-100">
              {items.map((item) => {
                const product = item.product || {};
                const price = item.unit_price ?? product.price ?? 0;
                return (
                  <li key={item.id} className="flex items-center gap-4 p-4 sm:px-5">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                      <ImageFallback src={product.image_url || null} alt={product.name || ''} className="h-full w-full" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        to={product.id ? `/products/${product.id}` : '/products'}
                        className="line-clamp-1 text-sm font-semibold text-slate-900 transition-colors hover:text-brand-600"
                      >
                        {product.name || 'Product'}
                      </Link>
                      <p className="text-xs text-slate-400">Qty {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatMoney(price * item.quantity)}
                    </p>
                  </li>
                );
              })}
            </ul>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4">
              <Link
                to="/cart"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4" /> Back to cart
              </Link>
              <Link
                to="/products"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700"
              >
                Continue shopping <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24">
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
                  <dd className="font-medium text-emerald-600">-{formatMoney(summary.discount)}</dd>
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

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-slate-500">
              Nothing will be charged. Order placement will be enabled when the orders API is
              available.
            </div>

            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
              <p className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-brand-600" /> Account-based secure checkout
              </p>
              <p className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-brand-600" /> Delivery details will be confirmed before dispatch
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
