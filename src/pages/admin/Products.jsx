import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getProducts } from '../../services/productService';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
  Skeleton,
} from '../../components/common';
import { AlertTriangle, ChevronLeft, ChevronRight, Package, Plus, RefreshCw, Search } from 'lucide-react';
import { errorMessage, formatMoney, formatNumber } from '../../utils/format';

const PAGE_SIZE = 10;

export default function AdminProducts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0 });
  const [retry, setRetry] = useState(0);
  const query = Object.fromEntries(searchParams.entries());
  const page = Math.max(1, Number(query.page) || 1);
  const requestKey = `${query.search || ''}|${query.status || ''}|${page}|${retry}`;
  const [requestState, setRequestState] = useState({ key: null, error: null });
  const loading = requestState.key !== requestKey;
  const error = requestState.key === requestKey ? requestState.error : null;

  useEffect(() => {
    let cancelled = false;

    getProducts({
      page,
      per_page: PAGE_SIZE,
      search: query.search || undefined,
      status: query.status || undefined,
    })
      .then((response) => {
        if (cancelled) return;

        const payload = response.data?.data ?? response.data;
        const rows = Array.isArray(payload) ? payload : payload?.data || [];

        setProducts(rows);
        setPagination({
          currentPage: payload?.current_page ?? page,
          lastPage: payload?.last_page ?? 1,
          total: payload?.total ?? rows.length,
        });
        setRequestState({ key: requestKey, error: null });
      })
      .catch((err) => {
        if (!cancelled) {
          setRequestState({ key: requestKey, error: errorMessage(err, 'Unable to load products.') });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [page, query.search, query.status, requestKey]);

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next, { replace: true });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catalog"
        title="Products"
        description="Keep product details, pricing, and stock tracking up to date."
        actions={(
          <Link
            to="/admin/products/create"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm shadow-brand-600/20 transition-colors hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" /> Add product
          </Link>
        )}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <Input
            id="product-search"
            aria-label="Search products"
            type="search"
            value={query.search || ''}
            onChange={(event) => updateParam('search', event.target.value)}
            placeholder="Search by product name or SKU"
            className="pl-9"
          />
        </div>
        <label className="space-y-1.5 text-sm font-medium text-slate-700">
          <span>Status</span>
          <select
            value={query.status || 'all'}
            onChange={(event) => updateParam('status', event.target.value === 'all' ? '' : event.target.value)}
            className="h-11 min-w-36 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 shadow-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
      </div>

      {error ? (
        <EmptyState
          icon={AlertTriangle}
          tone="warning"
          title="Products unavailable"
          description={error}
          action={(
            <Button variant="outline" onClick={() => setRetry((value) => value + 1)}>
              <RefreshCw className="h-4 w-4" /> Try again
            </Button>
          )}
        />
      ) : (
        <Card padding={false}>
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Product catalog</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {loading ? 'Updating results…' : `${formatNumber(pagination.total)} products`}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="px-5 py-12">
              <EmptyState
                icon={Package}
                title="No products found"
                description={query.search ? 'Try a different search or clear the status filter.' : 'Add your first product to start building the catalog.'}
                action={(
                  <>
                    {(query.search || query.status) && (
                      <Button variant="outline" onClick={() => setSearchParams({}, { replace: true })}>
                        Clear filters
                      </Button>
                    )}
                    <Link
                      to="/admin/products/create"
                      className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
                    >
                      <Plus className="h-4 w-4" /> Add product
                    </Link>
                  </>
                )}
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-3 font-semibold">Product</th>
                      <th className="px-5 py-3 font-semibold">Category / brand</th>
                      <th className="px-5 py-3 text-right font-semibold">Price</th>
                      <th className="px-5 py-3 text-center font-semibold">Inventory</th>
                      <th className="px-5 py-3 text-center font-semibold">Status</th>
                      <th className="px-5 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map((product) => (
                      <tr key={product.id} className="transition-colors hover:bg-slate-50/70">
                        <td className="px-5 py-3">
                          <p className="max-w-xs truncate text-sm font-semibold text-slate-900">{product.name}</p>
                          <p className="mt-0.5 text-xs text-slate-500">SKU: {product.sku || '—'}</p>
                        </td>
                        <td className="px-5 py-3">
                          <p className="text-sm text-slate-700">{product.category?.name || 'No category'}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{product.brand?.name || 'No brand'}</p>
                        </td>
                        <td className="px-5 py-3 text-right text-sm font-semibold text-slate-900">
                          {formatMoney(product.price, product.currency || 'USD')}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <Badge variant={product.track_inventory ? 'info' : 'neutral'}>
                            {product.track_inventory ? 'Tracked' : 'Not tracked'}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <Badge variant={product.status === 'active' ? 'success' : product.status === 'draft' ? 'warning' : 'neutral'}>
                            {product.status || 'draft'}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Link
                            to={`/admin/products/${product.id}/edit`}
                            className="inline-flex h-9 items-center rounded-lg px-3 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-50"
                          >
                            Edit
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination.lastPage > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
                  <p className="text-sm text-slate-500">Page {pagination.currentPage} of {pagination.lastPage}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => updateParam('page', String(page - 1))}>
                      <ChevronLeft className="h-4 w-4" /> Previous
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= pagination.lastPage} onClick={() => updateParam('page', String(page + 1))}>
                      Next <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      )}
    </div>
  );
}
