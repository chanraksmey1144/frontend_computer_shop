import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getProduct, getProductImages } from '../../services/productService';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../components/common';
import { Badge, Button, ImageFallback } from '../../components/common';
import { formatMoney } from '../../utils/format';
import { parseApiCollection } from '../../utils/apiResponse';
import {
  ChevronRight,
  Minus,
  Plus,
  ShieldCheck,
  Truck,
  RotateCcw,
  PackageSearch,
  Star,
} from 'lucide-react';

export default function ProductDetail() {
  const { id } = useParams();
  const { addToCart: addToCartCtx } = useCart();
  const { show } = useToast();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [productResponse, imageResponse] = await Promise.all([
          getProduct(id),
          getProductImages(id).catch(() => null),
        ]);
        if (!cancelled) {
          const product = productResponse.data?.data ?? productResponse.data;
          const { items: images } = parseApiCollection(imageResponse);
          setProduct({ ...product, images });
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load product.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <ProductDetailSkeleton />;

  if (error || !product) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          <PackageSearch className="h-7 w-7" />
        </span>
        <h1 className="mt-4 text-xl font-bold text-slate-900">Product not found</h1>
        <p className="mt-1 text-sm text-slate-500">{error || 'The product does not exist.'}</p>
        <Link
          to="/products"
          className="mt-6 inline-flex h-11 items-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Browse products
        </Link>
      </div>
    );
  }

  const images = product.images || [];
  const gallery = images.length
    ? images.map((img) => (typeof img === 'string' ? img : img.image_url || img.url)).filter(Boolean)
    : [product.image_url].filter(Boolean);
  const mainImage = gallery[activeImage] || product.image_url || null;
  const unavailable = product.status !== 'active' || product.stock === 0;
  const brandName = product.brand?.name || (typeof product.brand === 'string' ? product.brand : '');

  function handleAddToCart(e) {
    e.preventDefault();
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
          description: err.message || 'Unable to add item.',
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
        {/* Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
            <ImageFallback src={mainImage} alt={product.name} className="h-full w-full" />
            {unavailable && (
              <span className="absolute left-4 top-4">
                <Badge variant="danger">Out of stock</Badge>
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
                >
                  <ImageFallback src={img} alt="" className="h-full w-full" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-6">
          <div>
            {brandName && (
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">{brandName}</p>
            )}
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{product.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1 text-sm text-slate-500">
                <span className="flex text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </span>
                4.9 (128 reviews)
              </span>
              <span className="text-xs text-slate-400">SKU: {product.sku || '—'}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">Price</p>
                <p className="text-3xl font-extrabold tracking-tight text-slate-900">
                  {formatMoney(product.price)}
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  unavailable
                    ? 'bg-rose-50 text-rose-700'
                    : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${unavailable ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                {unavailable
                  ? 'Out of stock'
                  : `In stock${product.stock !== undefined ? ` · ${product.stock}` : ''}`}
              </span>
            </div>

            <form onSubmit={handleAddToCart} className="mt-5 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-700">Quantity</span>
                <div className="flex items-center rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
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
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="h-10 w-14 border-x border-slate-200 text-center text-sm font-semibold text-slate-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-r-xl text-slate-600 transition-colors hover:bg-slate-50"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={adding || unavailable}
                loading={adding}
                className="w-full"
              >
                {unavailable ? 'Unavailable' : adding ? 'Adding…' : 'Add to cart'}
              </Button>
            </form>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: ShieldCheck, label: 'Warranty', text: 'Official' },
              { icon: Truck, label: 'Delivery', text: 'Fast & local' },
              { icon: RotateCcw, label: 'Returns', text: 'Easy policy' },
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

      {/* Details */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Description</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
            {product.description || 'No description available for this product yet.'}
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Specifications</h2>
          <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
            {product.specifications
              ? typeof product.specifications === 'string'
                ? product.specifications
                : JSON.stringify(product.specifications, null, 2)
              : 'Specifications will be available soon.'}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Related products</h2>
        <p className="mt-2 text-sm text-slate-500">
          Recommendations will appear once the product catalog is fully connected.
        </p>
      </section>
    </div>
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
