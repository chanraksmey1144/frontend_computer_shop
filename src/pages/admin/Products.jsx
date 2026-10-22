import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getAdminProducts } from '../../services/dashboardService';
import { Badge, ImageFallback } from '../../components/common';
import { formatMoney } from '../../utils/format';
import { Plus, Search, PackageSearch, Pencil, AlertTriangle } from 'lucide-react';

export default function AdminProducts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const query = Object.fromEntries(searchParams.entries());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAdminProducts({ search: query.search || undefined, status: query.status || undefined })
      .then((res) => {
        if (!cancelled) {
          setError(null);
          setProducts(res.data.data || res.data || []);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load products.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query.search, query.status]);

  function updateParam(key, value) {
    const next = new URLSearchParams(query);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next.toString(), { replace: true });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Catalog</p>
          <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-slate-900">Products</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your product catalog and stock.</p>
        </div>
        <Link
          to="/admin/products/create"
          className="inline-flex h-10 items-center gap-2 self-start rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm shadow-brand-600/20 transition-colors hover:bg-brand-700 sm:self-auto"
        >
          <Plus className="h-4 w-4" /> Add product
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query.search || ''}
            onChange={(e) => updateParam('search', e.target.value)}
            placeholder="Search products…"
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
          />
        </div>
        <select
          value={query.status || 'all'}
          onChange={(e) => updateParam('status', e.target.value === 'all' ? '' : e.target.value)}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
        >
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {error ? (
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <AlertTriangle className="h-7 w-7" />
          </span>
          <h2 className="mt-4 text-lg font-bold text-slate-900">Products unavailable</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{error}</p>
          <p className="mt-2 text-xs text-slate-400">
            The admin products API is not yet implemented on the backend.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60 text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3 font-semibold">Product</th>
                  <th className="px-5 py-3 text-right font-semibold">Price</th>
                  <th className="px-5 py-3 text-center font-semibold">Stock</th>
                  <th className="px-5 py-3 text-center font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={5} className="px-5 py-4">
                          <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
                        </td>
                      </tr>
                    ))
                  : products.map((product) => (
                      <tr key={product.id} className="transition-colors hover:bg-slate-50/70">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                              <ImageFallback
                                src={product.image_url || null}
                                alt={product.name}
                                className="h-full w-full"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900">{product.name}</p>
                              <p className="text-xs text-slate-400">SKU: {product.sku || '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right text-sm font-semibold text-slate-900">
                          {formatMoney(product.price)}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              product.stock > 0
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {product.stock ?? '—'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <Badge variant={product.status === 'active' ? 'success' : 'neutral'}>
                            {product.status || 'draft'}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Link
                            to={`/admin/products/${product.id}/edit`}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-50"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </Link>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          {!loading && products.length === 0 && (
            <div className="px-6 py-14 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                <PackageSearch className="h-6 w-6" />
              </span>
              <h3 className="mt-3 text-base font-bold text-slate-900">No products found</h3>
              <p className="mt-1 text-sm text-slate-500">
                {query.search ? 'Try a different search term.' : 'Add your first product to get started.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
