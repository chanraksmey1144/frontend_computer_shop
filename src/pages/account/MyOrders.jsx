import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOrders as getOrdersApi } from '../../services/orderService';
import { Badge } from '../../components/common';
import AccountNav from '../../components/account/AccountNav';
import { formatMoney, formatDate } from '../../utils/format';
import { Package, PackageSearch, ChevronRight, ShoppingBag } from 'lucide-react';

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getOrdersApi()
      .then((res) => {
        if (!cancelled) setOrders(res.data.data || res.data || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load orders.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">My account</p>
          <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-slate-900">Orders</h1>
          <p className="mt-1 text-sm text-slate-500">Track and review your purchases.</p>
        </div>
        <Link
          to="/products"
          className="inline-flex h-10 items-center gap-2 self-start rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700 sm:self-auto"
        >
          <ShoppingBag className="h-4 w-4" /> Continue shopping
        </Link>
      </div>

      <AccountNav />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-200/70" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <PackageSearch className="h-7 w-7" />
          </span>
          <h2 className="mt-4 text-lg font-bold text-slate-900">Unable to load orders</h2>
          <p className="mt-1 text-sm text-slate-500">{error}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <Package className="h-7 w-7" />
          </span>
          <h2 className="mt-4 text-lg font-bold text-slate-900">No orders yet</h2>
          <p className="mt-1 text-sm text-slate-500">
            When you place an order it will appear here with live status updates.
          </p>
          <Link
            to="/products"
            className="mt-6 inline-flex h-10 items-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Browse products
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const items = order.order_items || [];
            const count = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
            return (
              <Link
                key={order.id}
                to={`/my-orders/${order.id}`}
                className="group block rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Order #{order.order_number || order.id}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">{formatDate(order.created_at)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={statusVariant(order.status)}>{order.status || 'pending'}</Badge>
                    <Badge variant="neutral">{order.payment_status || 'unpaid'}</Badge>
                  </div>
                </div>

                <div className="mt-4 flex items-end justify-between gap-3 border-t border-slate-100 pt-4">
                  <p className="text-sm text-slate-500">
                    {count > 0 ? `${count} item${count === 1 ? '' : 's'}` : 'Order details'}
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-[11px] uppercase tracking-wide text-slate-400">Total</p>
                      <p className="text-lg font-extrabold tracking-tight text-slate-900">
                        {formatMoney(order.total_amount || 0)}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
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
