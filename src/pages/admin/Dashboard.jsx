import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardMetrics } from '../../services/dashboardService';
import { Badge } from '../../components/common';
import { formatMoney } from '../../utils/format';
import {
  Package,
  ShoppingCart,
  Users,
  CreditCard,
  AlertTriangle,
  Plus,
  Layers,
  Tags,
  Boxes,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

const METRICS = [
  { label: 'Total sales', key: 'total_sales', format: 'money', icon: CreditCard, tile: 'bg-brand-50 text-brand-600' },
  { label: 'Total orders', key: 'total_orders', format: 'number', icon: ShoppingCart, tile: 'bg-indigo-50 text-indigo-600' },
  { label: 'Total products', key: 'total_products', format: 'number', icon: Package, tile: 'bg-emerald-50 text-emerald-600' },
  { label: 'Customers', key: 'total_customers', format: 'number', icon: Users, tile: 'bg-violet-50 text-violet-600' },
  { label: 'Low stock', key: 'low_stock', format: 'number', icon: AlertTriangle, tile: 'bg-amber-50 text-amber-600' },
];

const QUICK_ACTIONS = [
  { label: 'Add product', to: '/admin/products/create', icon: Plus },
  { label: 'Orders', to: '/admin/orders', icon: ShoppingCart },
  { label: 'Categories', to: '/admin/categories', icon: Layers },
  { label: 'Brands', to: '/admin/brands', icon: Tags },
  { label: 'Inventory', to: '/admin/inventory', icon: Boxes },
  { label: 'Customers', to: '/admin/customers', icon: Users },
];

export default function Dashboard() {
  const [metrics, setMetrics] = useState(
    METRICS.map((m) => ({ ...m, value: undefined }))
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getDashboardMetrics()
      .then((res) => {
        if (cancelled) return;
        const data = res.data.data || res.data || {};
        setMetrics((prev) =>
          prev.map((metric) => ({
            ...metric,
            value: data[metric.key] !== undefined ? data[metric.key] : undefined,
          }))
        );
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Dashboard metrics are not available yet.');
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
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Overview</p>
          <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">A snapshot of your store performance.</p>
        </div>
        <Link
          to="/admin/products/create"
          className="inline-flex h-10 items-center gap-2 self-start rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm shadow-brand-600/20 transition-colors hover:bg-brand-700 sm:self-auto"
        >
          <Plus className="h-4 w-4" /> Add product
        </Link>
      </div>

      {error && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <p className="min-w-0 flex-1">
            Metrics are unavailable: {error} The dashboard will populate automatically once the
            reporting API is implemented.
          </p>
          <Badge variant="warning">API pending</Badge>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <MetricSkeleton key={i} />)
          : metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Quick actions</h2>
            <TrendingUp className="h-4 w-4 text-slate-300" />
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {QUICK_ACTIONS.map(({ label, to, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="group flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50/40 hover:text-brand-700"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors group-hover:bg-brand-100 group-hover:text-brand-600">
                  <Icon className="h-4 w-4" />
                </span>
                {label}
                <ArrowRight className="ml-auto h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-500" />
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">Store status</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-center justify-between gap-3">
              <span className="text-slate-500">Catalog API</span>
              <Badge variant="success">Connected</Badge>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span className="text-slate-500">Orders &amp; payments</span>
              <Badge variant="warning">Pending</Badge>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span className="text-slate-500">Inventory tracking</span>
              <Badge variant="warning">Pending</Badge>
            </li>
          </ul>
          <p className="mt-5 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-400">
            Admin screens show graceful unavailable states until the corresponding backend
            endpoints are implemented.
          </p>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ metric }) {
  const Icon = metric.icon;
  const hasValue = metric.value !== undefined && metric.value !== null;
  const display =
    metric.format === 'money'
      ? hasValue
        ? formatMoney(metric.value)
        : '—'
      : hasValue
        ? metric.value
        : '—';

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${metric.tile}`}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {metric.label}
      </p>
      <p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">{display}</p>
    </div>
  );
}

function MetricSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-200" />
      <div className="mt-4 h-3 w-24 animate-pulse rounded bg-slate-200" />
      <div className="mt-2 h-6 w-16 animate-pulse rounded bg-slate-200" />
    </div>
  );
}
