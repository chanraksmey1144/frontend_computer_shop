import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getProduct, getProductImages, getProducts } from '../../services/productService';
import { getInventory } from '../../services/inventoryService';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../components/common';
import { Badge, Button, EmptyState, ImageFallback } from '../../components/common';
import { formatMoney, errorMessage } from '../../utils/format';
import { parseApiCollection } from '../../utils/apiResponse';
import {
  ChevronRight,
  Minus,
  Plus,
  ShieldCheck,
  Truck,
  RotateCcw,
  PackageSearch,
  RefreshCw,
  LogIn,
} from 'lucide-react';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart: addToCartCtx } = useCart();
  const { show } = useToast();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [reload, setReload] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setNotFound(false);
      try {
        const [productResponse, imageResponse, inventoryResponse] = await Promise.all([
          getProduct(id),
          getProductImages(id).catch(() => null),
          getInventory({ product_id: id, per_page: 100 }).catch(() => null),
        ]);

        if (cancelled) return;

        const nextProduct = productResponse.data?.data ?? productResponse.data;
        const { items: images } = parseApiCollection(imageResponse);
        const { items: inventoryRows } = parseApiCollection(inventoryResponse);
        setProduct({ ...nextProduct, images, inventoryRows });
        setActiveImage(0);
        setQuantity(1);

        if (nextProduct?.category_id) {
          getProducts({ category_id: nextProduct.category_id, status: 'active', page: 1 })
            .then((response) => {
              if (cancelled) return;
              const { items } = parseApiCollection(response);
              setRelated(items.filter((item) => item.id !== nextProduct.id).slice(0, 4));
            })
            .catch(() => {
              if (!cancelled) setRelated([]);
            });
        } else {
          setRelated([]);
        }
      } catch (err) {
        if (!cancelled) {
          setNotFound(err?.response?.status === 404);
          setError(errorMessage(err, 'Unable to load this product.'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, reload]);

  if (loading) return <ProductDetailSkeleton />;

  if (error || !product) {
    return (
      <div className="mx-auto max-w-lg">
        <EmptyState
          icon={PackageSearch}
          tone={notFound ? 'neutral' : 'warning'}
          title={notFound ? 'Product not found' : 'Unable to load product'}
          description={
            notFound
              ? 'This product may have been removed or the link is incorrect.'
              : error || 'Please check your connection and try again.'
          }
          action={
            <>
              {!notFound && (
                <Button onClick={() => setReload((value) => value + 1)}>
                  <RefreshCw className="h-4 w-4" /> Try again
                </Button>
              )}
              <Link
                to="/products"
                className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Browse products
              </Link>
            </>
          }
        />
      </div>
    );
  }

  const images = product.images || [];
  const gallery = images.length
    ? images
        .map((img) => (typeof img === 'string' ? img : img.image_url || img.url))
        .filter(Boolean)
    : [product.image_url].filter(Boolean);
  const mainImage = gallery[activeImage] || product.image_url || null;
  const brandName = product.brand?.name || (typeof product.brand === 'string' ? product.brand : '');
  const inventoryRows = Array.isArray(product.inventoryRows) ? product.inventoryRows : [];
  const hasInventory = inventoryRows.length > 0;
  const available = inventoryRows.reduce(
    (sum, row) => sum + Math.max(0, Number(row.quantity || 0) - Number(row.reserved_quantity || 0)),
    0
  );
  const tracked = product.track_inventory !== false;
  const outOfStock = tracked && hasInventory && available <= 0 && !product.allow_backorder;
  const unavailable = product.status !== 'active' || outOfStock;
  const maxQuantity = !outOfStock && tracked && hasInventory ? Math.max(1, available) : undefined;

  const availability = (() => {
    if (product.status !== 'active') {
      return { label: 'Unavailable', tone: 'bg-rose-50 text-rose-700', dot: 'bg-rose-500' };
    }
    if (outOfStock) {
      return { label: 'Out of stock', tone: 'bg-rose-50 text-rose-700', dot: 'bg-rose-500' };
    }
    if (tracked && hasInventory) {
      return {
        label: `${available} available`,
        tone: 'bg-emerald-50 text-emerald-700',
        dot: 'bg-emerald-500',
      };
    }
    if (product.allow_backorder) {
      return { label: 'Available to order', tone: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' };
    }
    return { label: 'Availability confirmed at checkout', tone: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' };
  })();

  function setSafeQuantity(next) {
    const parsed = Math.max(1, parseInt(next, 10) || 1);
    setQuantity(maxQuantity ? Math.min(parsed, maxQuantity) : parsed);
  }

  function handleAddToCart(e) {
    e.preventDefault();
    if (!isAuthenticated) {
      show({
        title: 'Sign in to add items',
        description: 'Your cart is saved to your account.',
        type: 'info',
      });
      navigate('/login', { state: { from: { pathname: `/products/${id}` } } });
      return;
    }
    if (unavailable) return;

    setAdding(true);
    addToCartCtx({ product_id: product.id, quantity })
      .then(() => {
        show({
          title: 'Added to cart',
          description: `${product.name} has been added to your cart.`,
          type: 'success',
        });
      })
      .catch((err) =>
        show({
          title: 'Add to cart failed',
          description: errorMessage(err, 'Unable to add item.'),
          type: 'error',
        })
      )
      .finally(() => setAdding(false));
  }

  return (
    <div className="space-y-10">
      <nav className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
        <Link to="/" className="transition-colors hover:text-brand-600">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/products" className="transition-colors hover:text-brand-600">Products</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="line-clamp-1 font-medium text-slate-600">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
            <ImageFallback src={mainImage} alt={product.name} className="h-full w-full" />
            {unavailable && (
              <span className="absolute left-4 top-4">
                <Badge variant="danger">{product.status !== 'active' ? 'Unavailable' : 'Out of stock'}</Badge>
              </span>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {gallery.slice(0, 8).map((img, index) => (
                <button
                  key={`${img}-${index}`}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  className={`aspect-square overflow-hidden rounded-xl border-2 bg-white transition-all ${
                    activeImage === index
                      ? 'border-brand-500 ring-2 ring-brand-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  aria-label={`View image ${index + 1}`}
                  aria-pressed={activeImage === index}
                >
                  <ImageFallback src={img} alt="" className="h-full w-full" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {brandName && (
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">{brandName}</p>
              )}
              {product.product_type && <Badge variant="neutral">{product.product_type}</Badge>}
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{product.name}</h1>
            {product.short_description && (
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{product.short_description}</p>
            )}
            <p className="mt-3 text-xs text-slate-400">SKU: {product.sku || '-'}</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">Price</p>
                <p className="text-3xl font-extrabold tracking-tight text-slate-900">
                  {formatMoney(product.price)}
                </p>
                {product.compare_at_price && Number(product.compare_at_price) > Number(product.price) && (
                  <p className="mt-1 text-sm text-slate-400 line-through">
                    {formatMoney(product.compare_at_price)}
                  </p>
                )}
              </div>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${availability.tone}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${availability.dot}`} />
                {availability.label}
              </span>
            </div>

            <form onSubmit={handleAddToCart} className="mt-5 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-700">Quantity</span>
                <div className="flex items-center rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setSafeQuantity(quantity - 1)}
                    disabled={quantity <= 1}
                    className="flex h-10 w-10 items-center justify-center rounded-l-xl text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    min={1}
                    max={maxQuantity}
                    onChange={(e) => setSafeQuantity(e.target.value)}
                    className="h-10 w-14 border-x border-slate-200 text-center text-sm font-semibold text-slate-900 focus:outline-none"
                    aria-label="Quantity"
                  />
                  <button
                    type="button"
                    onClick={() => setSafeQuantity(quantity + 1)}
                    disabled={maxQuantity ? quantity >= maxQuantity : false}
                    className="flex h-10 w-10 items-center justify-center rounded-r-xl text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {maxQuantity && <span className="text-xs text-slate-400">Max {maxQuantity}</span>}
              </div>

              <Button type="submit" size="lg" disabled={adding || unavailable} loading={adding} className="w-full">
                {!isAuthenticated ? (
                  <>
                    <LogIn className="h-4 w-4" /> Sign in to add to cart
                  </>
                ) : unavailable ? (
                  'Unavailable'
                ) : (
                  'Add to cart'
                )}
              </Button>
            </form>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: ShieldCheck, label: 'Warranty', text: 'Official' },
              { icon: Truck, label: 'Delivery', text: 'At checkout' },
              { icon: RotateCcw, label: 'Returns', text: 'Ask support' },
            ].map(({ icon: Icon, label, text }) => (
              <div key={label} className="rounded-xl border border-slate-200/80 bg-white p-3 text-center">
                <Icon className="mx-auto h-5 w-5 text-brand-600" />
                <p className="mt-1.5 text-xs font-semibold text-slate-900">{label}</p>
                <p className="text-[11px] text-slate-400">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Description</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
            {product.description || 'No description is available for this product yet.'}
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Specifications</h2>
          <ProductSpecs value={product.specifications} />
        </section>
      </div>

      {related.length > 0 && (
        <section>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Keep browsing</p>
              <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">Related products</h2>
            </div>
            <Link
              to="/products"
              className="text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700"
            >
              View all
            </Link>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {related.map((item) => (
              <RelatedCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ProductSpecs({ value }) {
  if (!value) {
    return <p className="mt-3 text-sm text-slate-500">Specifications are not available for this product yet.</p>;
  }

  if (typeof value === 'string') {
    return <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{value}</p>;
  }

  if (typeof value !== 'object' || Array.isArray(value)) {
    return (
      <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  const entries = Object.entries(value);
  if (entries.length === 0) {
    return <p className="mt-3 text-sm text-slate-500">Specifications are not available for this product yet.</p>;
  }

  return (
    <dl className="mt-3 divide-y divide-slate-100">
      {entries.map(([key, val]) => (
        <div key={key} className="flex items-start justify-between gap-4 py-2 text-sm">
          <dt className="capitalize text-slate-500">{key.replace(/_/g, ' ')}</dt>
          <dd className="max-w-[60%] text-right font-medium text-slate-900">
            {typeof val === 'object' ? JSON.stringify(val) : String(val)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function RelatedCard({ product }) {
  const image = product.image_url
    || (Array.isArray(product.images) && product.images[0]?.image_url)
    || null;

  return (
    <Link
      to={`/products/${product.id}`}
      className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg"
    >
      <div className="aspect-[4/3] overflow-hidden bg-slate-100">
        <ImageFallback
          src={image}
          alt={product.name || 'Product'}
          className="h-full w-full transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="p-3">
        <p className="line-clamp-2 text-sm font-semibold text-slate-900 transition-colors group-hover:text-brand-600">
          {product.name}
        </p>
        <p className="mt-1 text-sm font-bold text-slate-900">{formatMoney(product.price)}</p>
      </div>
    </Link>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="space-y-10">
      <div className="h-4 w-64 animate-pulse rounded bg-slate-200" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="aspect-square animate-pulse rounded-3xl bg-slate-200" />
        <div className="space-y-4">
          <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
          <div className="h-9 w-3/4 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
          <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-12 animate-pulse rounded-xl bg-slate-200" />
        </div>
      </div>
    </div>
  );
}
