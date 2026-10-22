import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getOrder as getOrderApi } from '../../services/orderService';
import { Badge, ImageFallback } from '../../components/common';
import AccountNav from '../../components/account/AccountNav';
import { formatMoney, formatDate } from '../../utils/format';
import {
  ChevronLeft,
  ChevronRight,
  PackageSearch,
  MapPin,
  CreditCard,
  CalendarDays,
  StickyNote,
  Package,
} from 'lucide-react';

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getOrderApi(id)
      .then((res) => {
        if (!cancelled) setOrder(res.data.data || res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load order.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-2xl bg-slate-200/70" />
        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <div className="h-80 animate-pulse rounded-2xl bg-slate-200/70" />
          <div className="h-80 animate-pulse rounded-2xl bg-slate-200/70" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          <PackageSearch className="h-7 w-7" />
        </span>
        <h1 className="mt-4 text-xl font-bold text-slate-900">Order not found</h1>
        <p className="mt-1 text-sm text-slate-500">{error || 'The order does not exist.'}</p>
        <Link
          to="/my-orders"
          className="mt-6 inline-flex h-10 items-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Back to orders
        </Link>
      </div>
    );
  }

  const items = order.order_items || [];

  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
        <Link to="/profile" className="transition-colors hover:text-brand-600">Account</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/my-orders" className="transition-colors hover:text-brand-600">Orders</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-slate-600">#{order.order_number || order.id}</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            to="/my-orders"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 transition-colors hover:text-brand-600"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Back to orders
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Order #{order.order_number || order.id}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Placed {formatDate(order.placed_at || order.created_at)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={statusVariant(order.status)}>{order.status || 'pending'}</Badge>
          <Badge variant="neutral">{order.payment_status || 'unpaid'}</Badge>
        </div>
      </div>

      <AccountNav />

      <div className="grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="text-base font-bold text-slate-900">Items</h2>
            <span className="text-xs text-slate-400">{items.length} line item{items.length === 1 ? '' : 's'}</span>
          </div>

          {items.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <Package className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm text-slate-500">No items were recorded for this order.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {items.map((item) => {
                const product = item.product || {};
                const image = product.image_url || item.product_image || null;
                return (
                  <li key={item.id} className="flex items-center gap-4 p-4 sm:px-5">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                      <ImageFallback src={image} alt={item.product_name || ''} className="h-full w-full" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-semibold text-slate-900">
                        {item.product_name || product.name || 'Item'}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        Qty {item.quantity} · {formatMoney(item.unit_price || 0)} each
                      </p>
                    </div>
                    <p className="text-sm font-bold text-slate-900">
                      {formatMoney((item.unit_price || 0) * (item.quantity || 0))}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}

          <dl className="space-y-2.5 border-t border-slate-100 bg-slate-50/60 px-5 py-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Subtotal</dt>
              <dd className="font-medium text-slate-900">{formatMoney(order.subtotal || 0)}</dd>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between">
                <dt className="text-slate-500">Discount</dt>
                <dd className="font-medium text-emerald-600">−{formatMoney(order.discount_amount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-slate-500">Delivery fee</dt>
              <dd className="font-medium text-slate-900">{formatMoney(order.delivery_fee || 0)}</dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-slate-200 pt-2.5">
              <dt className="font-semibold text-slate-900">Total</dt>
              <dd className="text-xl font-extrabold tracking-tight text-slate-900">
                {formatMoney(order.total_amount || 0)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <MapPin className="h-4 w-4 text-brand-600" /> Shipping address
            </h2>
            <div className="mt-3 space-y-1 text-sm">
              <p className="font-semibold text-slate-900">{order.recipient_name || '—'}</p>
              <p className="text-slate-500">{order.recipient_phone || '—'}</p>
              <p className="whitespace-pre-wrap leading-relaxed text-slate-600">
                {order.shipping_address || '—'}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <CreditCard className="h-4 w-4 text-brand-600" /> Payment &amp; dates
            </h2>
            <dl className="mt-3 space-y-2.5 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Method</dt>
                <dd className="text-right font-medium capitalize text-slate-900">
                  {(order.payment_method || '—').replace(/_/g, ' ')}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Status</dt>
                <dd className="text-right font-medium capitalize text-slate-900">
                  {order.payment_status || '—'}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="flex items-center gap-1 text-slate-500">
                  <CalendarDays className="h-3.5 w-3.5" /> Placed
                </dt>
                <dd className="text-right font-medium text-slate-900">
                  {order.placed_at ? formatDate(order.placed_at) : '—'}
                </dd>
              </div>
            </dl>
          </div>

          {order.customer_note && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <h2 className="flex items-center gap-2 text-sm font-bold text-amber-900">
                <StickyNote className="h-4 w-4" /> Customer note
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-amber-800">
                {order.customer_note}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function statusVariant(status) {
  switch (status) {
    case 'delivered':
      return 'success';
    case 'shipped':
    case 'confirmed':
      return 'info';
    case 'processing':
      return 'warning';
    case 'cancelled':
    case 'refunded':
      return 'danger';
    default:
      return 'neutral';
  }
}
