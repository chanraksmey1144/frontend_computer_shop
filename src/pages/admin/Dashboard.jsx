import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProducts } from '../../services/productService';
import { getCategories } from '../../services/categoryService';
import { getBrands } from '../../services/brandService';
import { getWarehouses } from '../../services/warehouseService';
import { getInventory } from '../../services/inventoryService';
import { getCoupons } from '../../services/couponService';
import { fetchAllPages, parseApiCollection } from '../../utils/apiResponse';
import { Badge } from '../../components/common';
import { formatNumber } from '../../utils/format';
import {
  Package,
  Plus,
  Layers,
  Tags,
  Boxes,
  ArrowRight,
  AlertTriangle,
  TicketPercent,
  ArrowLeftRight,
  Store,
  RefreshCw,
  ShoppingCart,
} from 'lucide-react';

const QUICK_ACTIONS = [
  { label: 'Add product', to: '/admin/products/create', icon: Plus },
  { label: 'Products', to: '/admin/products', icon: Package },
  { label: 'Inventory', to: '/admin/inventory', icon: Boxes },
  { label: 'Stock movements', to: '/admin/movements', icon: ArrowLeftRight },
  { label: 'Coupons', to: '/admin/coupons', icon: TicketPercent },
  { label: 'Warehouses', to: '/admin/warehouses', icon: Store },
];

function totalFrom(response) {
  if (!response) return null;
  const { items, meta } = parseApiCollection(response);
  const total = Number(meta.total);
  return Number.isFinite(total) ? total : items.length;
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const results = await Promise.allSettled([
        getProducts({ page: 1 }),
        getCategories({ page: 1 }),
        getBrands({ page: 1 }),
        getWarehouses({ page: 1 }),
        fetchAllPages(getInventory, { per_page: 100 }),
        fetchAllPages(getCoupons),
      ]);

      if (cancelled) return;

      const [products, categories, brands, warehouses, inventories, coupons] = results;
      const inventoryRows = inventories.status === 'fulfilled' ? inventories.value : null;
      const couponRows = coupons.status === 'fulfilled' ? coupons.value : null;
      const failed = results.filter((result) => result.status === 'rejected').length;

      const availableUnits = inventoryRows
        ? inventoryRows.reduce(
            (sum, row) =>
              sum + Math.max(0, Number(row.quantity || 0) - Number(row.reserved_quantity || 0)),
            0
          )
        : null;

      const lowStock = inventoryRows
        ? inventoryRows.filter(
            (row) =>
              Number(row.quantity || 0) - Number(row.reserved_quantity || 0) <=
              Number(row.reorder_level || 0)
          ).length
        : null;

      const activeCoupons = couponRows
        ? couponRows.filter((coupon) => {
            if (coupon.status !== 'active') return false;
            if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()) return false;
            return true;
          }).length
        : null;

      setMetrics([
        {
          label: 'Products',
          value: products.status === 'fulfilled' ? totalFrom(products.value) : null,
          icon: Package,
          tile: 'bg-brand-50 text-brand-600',
          to: '/admin/products',
        },
        {
          label: 'Categories',
          value: categories.status === 'fulfilled' ? totalFrom(categories.value) : null,
          icon: Layers,
          tile: 'bg-indigo-50 text-indigo-600',
          to: '/admin/categories',
        },
        {
          label: 'Brands',
          value: brands.status === 'fulfilled' ? totalFrom(brands.value) : null,
          icon: Tags,
          tile: 'bg-violet-50 text-violet-600',
          to: '/admin/brands',
        },
        {
          label: 'Available units',
          value: availableUnits,
          icon: Boxes,
          tile: 'bg-emerald-50 text-emerald-600',
          to: '/admin/inventory',
        },
        {
          label: 'Low stock',
          value: lowStock,
          icon: AlertTriangle,
          tile: 'bg-amber-50 text-amber-600',
          to: '/admin/inventory',
          alert: lowStock > 0,
        },
        {
          label: 'Active coupons',
          value: activeCoupons,
          icon: TicketPercent,
          tile: 'bg-rose-50 text-rose-600',
          to: '/admin/coupons',
        },
      ]);

      setError(failed > 0 ? `${failed} of ${results.length} data sources could not be loaded.` : null);
      setLoading(false);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [reload]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Overview</p>
          <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Live catalog, inventory and coupon data from the store API.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setReload((value) => value + 1)}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <Link
            to="/admin/products/create"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm shadow-brand-600/20 transition-colors hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" /> Add product
          </Link>
        </div>
      </div>

      {error && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <p className="min-w-0 flex-1">{error} Unavailable figures show as N/A instead of zero.</p>
          <button
            type="button"
            onClick={() => setReload((value) => value + 1)}
            className="text-xs font-bold uppercase tracking-wide text-amber-900 underline underline-offset-4"
          >
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, index) => <MetricSkeleton key={index} />)
          : metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Quick actions</h2>
            <ArrowRight className="h-4 w-4 text-slate-300" />
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
              <span className="text-slate-500">Catalog</span>
              <Badge variant="success">Live</Badge>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span className="text-slate-500">Inventory tracking</span>
              <Badge variant="success">Live</Badge>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span className="text-slate-500">Coupons</span>
              <Badge variant="success">Live</Badge>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-slate-500">
                <ShoppingCart className="h-4 w-4 text-slate-400" /> Orders &amp; customers
              </span>
              <Badge variant="warning">Not available</Badge>
            </li>
          </ul>
          <p className="mt-5 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-400">
            Orders, customers and reporting are hidden from the navigation until their API
            endpoints are implemented. No business figures are fabricated.
          </p>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ metric }) {
  const Icon = metric.icon;
  const available = metric.value !== null && metric.value !== undefined;

  return (
    <Link
      to={metric.to}
      className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${metric.tile}`}>
          <Icon className="h-5 w-5" />
        </span>
        {metric.alert && (
          <Badge variant="warning" className="text-[10px]">
            Review
          </Badge>
        )}
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {metric.label}
      </p>
      <p className={`mt-1 text-2xl font-extrabold tracking-tight ${available ? 'text-slate-900' : 'text-slate-400'}`}>
        {available ? formatNumber(metric.value) : 'N/A'}
      </p>
    </Link>
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
