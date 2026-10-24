import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getProducts } from '../../services/productService';
import { getCategories } from '../../services/categoryService';
import { getBrands } from '../../services/brandService';
import { Badge, ImageFallback } from '../../components/common';
import { formatMoney } from '../../utils/format';
import { fetchAllPages, parseApiCollection } from '../../utils/apiResponse';
import {
  SearchX,
  SlidersHorizontal,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  PackageSearch,
} from 'lucide-react';

const SORTS = [
  { key: 'newest', label: 'Newest' },
  { key: 'price_asc', label: 'Price: Low to High' },
  { key: 'price_desc', label: 'Price: High to Low' },
];

const catalogPromises = { categories: null, brands: null };

async function getCatalogId(kind, slug) {
  const service = kind === 'categories' ? getCategories : getBrands;
  if (!catalogPromises[kind]) {
    catalogPromises[kind] = fetchAllPages(service, { status: 'active' }).catch((error) => {
      catalogPromises[kind] = null;
      throw error;
    });
  }
  const records = await catalogPromises[kind];
  return records.find((record) => record.slug === slug)?.id ?? null;
}

export default function ProductList({ initialQuery = {} } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const urlQuery = Object.fromEntries(searchParams.entries());
  const query = { ...initialQuery, ...urlQuery };
  const page = query.page || '1';

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [categoryId, brandId] = await Promise.all([
          query.category
            ? (/^\d+$/.test(query.category) ? Number(query.category) : getCatalogId('categories', query.category))
            : Promise.resolve(undefined),
          query.brand
            ? (/^\d+$/.test(query.brand) ? Number(query.brand) : getCatalogId('brands', query.brand))
            : Promise.resolve(undefined),
        ]);

        if ((query.category && !categoryId) || (query.brand && !brandId)) {
          if (!cancelled) {
            setProducts([]);
            setMeta({});
          }
          return;
        }

        const res = await getProducts({
          page,
          search: query.search || undefined,
          category_id: categoryId,
          brand_id: brandId,
          status: query.status || 'active',
          sort: query.sort || 'newest',
        });
        if (!cancelled) {
          const { items, meta: pageMeta } = parseApiCollection(res);
          setProducts(items);
          setMeta(pageMeta);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load products.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [page, query.search, query.category, query.brand, query.status, query.sort]);

  function changeParam(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value === undefined || value === null || value === '') next.delete(key);
    else next.set(key, String(value));
    if (key !== 'page') next.set('page', '1');
    setSearchParams(next, { replace: true });
  }

  function clearFilters() {
    setSearchParams({}, { replace: true });
  }

  const total = meta.total ?? products.length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Catalog</p>
          <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-slate-900">All products</h1>
          <p className="mt-1 text-sm text-slate-500">
            {loading ? 'Loading products…' : `${total} product${total !== 1 ? 's' : ''} available`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 text-sm font-medium text-slate-500 sm:flex">
            <SlidersHorizontal className="h-4 w-4" /> Sort
          </span>
          <select
            value={query.sort || 'newest'}
            onChange={(e) => changeParam('sort', e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 pr-8 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-slate-300 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <PackageSearch className="h-7 w-7" />
          </span>
          <h2 className="mt-4 text-lg font-bold text-slate-900">Unable to load products</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{error}</p>
          <p className="mx-auto mt-2 max-w-md text-xs text-slate-400">
            The <code className="rounded bg-slate-100 px-1 py-0.5">/api/products</code> endpoint is
            not yet available on the backend.
          </p>
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <SearchX className="h-7 w-7" />
          </span>
          <h2 className="mt-4 text-lg font-bold text-slate-900">No products found</h2>
          <p className="mt-1 text-sm text-slate-500">Try adjusting your search or filters.</p>
          <button
            onClick={clearFilters}
            className="mt-5 inline-flex h-10 items-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>

          {meta.last_page && meta.last_page > 1 && (
            <Pagination
              current={meta.current_page || Number(page)}
              last={meta.last_page}
              onChange={(p) => changeParam('page', p)}
            />
          )}
        </>
      )}
    </div>
  );
}

function ProductCard({ product }) {
  const price = product.price ?? 0;
  const unavailable = product.status !== 'active' || product.stock === 0;
  const brandName = product.brand?.name || (typeof product.brand === 'string' ? product.brand : '');
  const productImages = Array.isArray(product.images) ? product.images : [];
  const imageUrl = product.image_url
    || product.thumbnail
    || productImages.find((image) => image.is_primary)?.image_url
    || productImages[0]?.image_url
    || null;

  return (
    <Link
      to={`/products/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-slate-200/60"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <ImageFallback
          src={imageUrl}
          alt={product.name || 'Product'}
          className="h-full w-full transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.discount ? (
            <span className="rounded-full bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white shadow">
              -{product.discount}%
            </span>
          ) : null}
          {unavailable && <Badge variant="danger">Unavailable</Badge>}
        </div>
        <span className="absolute bottom-3 right-3 flex h-9 w-9 translate-y-2 items-center justify-center rounded-full bg-white text-slate-900 opacity-0 shadow-lg transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        {brandName && (
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {brandName}
          </span>
        )}
        <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-slate-900 transition-colors group-hover:text-brand-600">
          {product.name}
        </h3>

        <div className="mt-3 flex items-end justify-between gap-2">
          <span className="text-lg font-bold text-slate-900">{formatMoney(price)}</span>
          {product.stock !== undefined && (
            <span
              className={`text-xs font-medium ${
                product.stock > 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {product.stock > 0 ? 'In stock' : 'Out of stock'}
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-xs text-slate-400">SKU: {product.sku || '—'}</span>
          <span className="text-xs font-semibold text-brand-600">View details</span>
        </div>
      </div>
    </Link>
  );
}

function Pagination({ current, last, onChange }) {
  const pages = [];
  const start = Math.max(1, current - 2);
  const end = Math.min(last, current + 2);
  for (let i = start; i <= end; i += 1) pages.push(i);

  return (
    <div className="mt-2 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 sm:flex-row">
      <p className="text-sm text-slate-500">
        Page <span className="font-semibold text-slate-900">{current}</span> of {last}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onChange(current - 1)}
          disabled={current <= 1}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            aria-current={p === current ? 'page' : undefined}
            className={`h-9 min-w-9 rounded-lg px-3 text-sm font-semibold transition-colors ${
              p === current
                ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/20'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onChange(current + 1)}
          disabled={current >= last}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
      <div className="aspect-[4/3] animate-pulse bg-slate-200" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-1/3 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
        <div className="h-5 w-1/2 animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
      </div>
    </div>
  );
}
