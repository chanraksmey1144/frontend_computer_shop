import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCategories } from '../../services/categoryService';
import { getBrands } from '../../services/brandService';
import { fetchAllPages } from '../../utils/apiResponse';
import { ImageFallback } from '../../components/common';
import {
  Laptop,
  Monitor,
  Cpu,
  Keyboard,
  Headphones,
  Boxes,
  ArrowRight,
  ShieldCheck,
  Truck,
  CreditCard,
  Headset,
  Sparkles,
  Gamepad2,
  PackageSearch,
  Star,
} from 'lucide-react';

const TRUST = [
  { icon: ShieldCheck, title: 'Official warranty', text: 'Genuine products with manufacturer warranty.' },
  { icon: Truck, title: 'Fast delivery', text: 'Same-day options across Phnom Penh.' },
  { icon: CreditCard, title: 'Secure payment', text: 'Pay safely, including cash on delivery.' },
  { icon: Headset, title: 'Expert support', text: 'Helpful advice before and after you buy.' },
];

const ICON_MAP = [
  { match: ['laptop', 'notebook'], icon: Laptop },
  { match: ['desktop', 'gaming', 'pc', 'monitor', 'display'], icon: Monitor },
  { match: ['component', 'part', 'hardware'], icon: Cpu },
  { match: ['accessor', 'keyboard', 'mouse'], icon: Keyboard },
  { match: ['audio', 'head'], icon: Headphones },
];

function iconFor(name = '') {
  const n = name.toLowerCase();
  const found = ICON_MAP.find((entry) => entry.match.some((m) => n.includes(m)));
  return found ? found.icon : Boxes;
}

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [categoryRows, brandRows] = await Promise.all([
          fetchAllPages(getCategories, { status: 'active', root_only: 'true' }),
          fetchAllPages(getBrands, { status: 'active' }),
        ]);
        if (!cancelled) {
          setCategories(categoryRows);
          setBrands(brandRows);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load homepage data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-14 lg:space-y-20">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-2xl shadow-slate-900/20">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1587202390267-f79af44ab54a?w=1600&q=80"
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-900/30" />
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-500/30 blur-3xl" />
        </div>

        <div className="relative grid gap-12 px-6 py-14 sm:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-14 lg:py-20">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-brand-200 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> New 2026 lineup is here
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Power your next
              <span className="block bg-gradient-to-r from-brand-300 via-white to-brand-200 bg-clip-text text-transparent">
                big upgrade
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Laptops, gaming desktops, monitors and components — curated for work, play and
              creativity, with genuine warranty and local support in Cambodia.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/products"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition-colors hover:bg-brand-400"
              >
                Shop all products <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/categories"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/10"
              >
                Browse categories
              </Link>
            </div>

            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-white/10 pt-6">
              {[
                { value: '500+', label: 'Products' },
                { value: '4.9/5', label: 'Customer rating' },
                { value: '24h', label: 'Delivery' },
              ].map((stat) => (
                <div key={stat.label}>
                  <dt className="text-2xl font-bold text-white">{stat.value}</dt>
                  <dd className="text-xs text-slate-400">{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Featured showcase card */}
          <div className="relative hidden lg:block">
            <div className="absolute inset-0 -rotate-3 rounded-3xl border border-white/10 bg-white/5 backdrop-blur" />
            <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur-xl">
              <ImageFallback
                src="https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=900&q=80"
                alt="Featured gaming laptop"
                className="aspect-[4/3] w-full rounded-2xl"
              />
              <div className="flex items-center justify-between px-2 pb-1 pt-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-brand-200">Featured</p>
                  <p className="text-lg font-bold text-white">Pro Gaming Laptop</p>
                  <p className="text-sm text-slate-300">RTX graphics · 165Hz display</p>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> 4.9
                </div>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-5 flex items-center gap-2 rounded-2xl border border-white/15 bg-slate-900/90 px-4 py-3 shadow-xl backdrop-blur">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold text-white">Genuine warranty</p>
                <p className="text-[11px] text-slate-400">Official local coverage</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {TRUST.map(({ icon: Icon, title, text }) => (
          <div
            key={title}
            className="group flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">{title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{text}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Categories */}
      <section>
        <SectionHeading
          eyebrow="Shop by category"
          title="Find exactly what you need"
          subtitle="From ultrabooks to custom gaming rigs and every component in between."
          to="/categories"
        />
        {error ? (
          <Notice>{error}</Notice>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <TileSkeleton key={i} />)
              : categories.length
              ? categories.map((cat) => {
                  const Icon = iconFor(cat.name);
                  return (
                    <Link
                      key={cat.id}
                      to={`/categories/${cat.slug}`}
                      className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg"
                    >
                      <span className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-brand-50 transition-transform group-hover:scale-150" />
                      <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-600/25">
                        <Icon className="h-5 w-5" />
                      </span>
                      <p className="relative mt-4 text-sm font-semibold text-slate-900">{cat.name}</p>
                      <span className="relative mt-1 flex items-center gap-1 text-xs font-medium text-slate-400 transition-colors group-hover:text-brand-600">
                        Shop now <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </Link>
                  );
                })
              : <p className="col-span-full py-6 text-sm text-slate-500">No categories available yet.</p>}
          </div>
        )}
      </section>

      {/* Promo banners */}
      <section className="grid gap-4 lg:grid-cols-2">
        <PromoCard
          to="/categories/desktops"
          image="https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=1200&q=80"
          eyebrow="Build your dream rig"
          title="Gaming desktops & custom builds"
          description="High-FPS performance with the latest GPUs and processors."
          icon={Gamepad2}
          dark
        />
        <PromoCard
          to="/categories/laptops"
          image="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1200&q=80"
          eyebrow="Work anywhere"
          title="Lightweight laptops for productivity"
          description="All-day battery, sharp displays and quiet performance."
          icon={Laptop}
        />
      </section>

      {/* Brands */}
      <section>
        <SectionHeading
          eyebrow="Trusted brands"
          title="Shop the names you know"
          subtitle="Authorised retailer for the world's leading technology brands."
          to="/brands"
        />
        {loading ? (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200/70" />
            ))}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {brands.length ? (
              brands.map((brand) => (
                <Link
                  key={brand.id}
                  to={`/brands/${brand.slug}`}
                  className="group flex h-24 items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
                >
                  {brand.logo_url ? (
                    <ImageFallback
                      src={brand.logo_url}
                      alt={brand.name}
                      className="h-10 w-full bg-transparent grayscale transition-all group-hover:grayscale-0"
                    />
                  ) : (
                    <span className="text-lg font-bold tracking-tight text-slate-400 transition-colors group-hover:text-brand-600">
                      {brand.name}
                    </span>
                  )}
                </Link>
              ))
            ) : (
              <p className="col-span-full py-6 text-sm text-slate-500">No brands available yet.</p>
            )}
          </div>
        )}
      </section>

      {/* Catalog status */}
      <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
        <div className="grid gap-6 p-8 sm:p-10 lg:grid-cols-[auto_1fr_auto] lg:items-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <PackageSearch className="h-7 w-7" />
          </span>
          <div>
            <h3 className="text-xl font-bold text-slate-900">The full catalog is coming online</h3>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
              Our product feed is being connected to the store. In the meantime, explore categories
              and brands, or contact us for availability and personalised recommendations.
            </p>
          </div>
          <Link
            to="/categories"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
          >
            Explore categories <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function SectionHeading({ eyebrow, title, subtitle, to }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h2>
        {subtitle && <p className="mt-2 max-w-2xl text-sm text-slate-500">{subtitle}</p>}
      </div>
      {to && (
        <Link
          to={to}
          className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700"
        >
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

function PromoCard({ to, image, eyebrow, title, description, icon: Icon, dark = false }) {
  return (
    <Link
      to={to}
      className="group relative overflow-hidden rounded-3xl border border-slate-200/80 shadow-sm transition-shadow hover:shadow-xl"
    >
      <div className="relative h-64 sm:h-72">
        <img src={image} alt="" aria-hidden="true" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div
          className={`absolute inset-0 ${
            dark
              ? 'bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-slate-950/20'
              : 'bg-gradient-to-r from-brand-900/90 via-brand-800/70 to-brand-700/20'
          }`}
        />
        <div className="absolute inset-0 flex flex-col justify-center p-7 sm:p-9">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white backdrop-blur">
            <Icon className="h-5 w-5" />
          </span>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-brand-200">{eyebrow}</p>
          <h3 className="mt-1 max-w-sm text-2xl font-bold text-white">{title}</h3>
          <p className="mt-2 max-w-sm text-sm text-white/80">{description}</p>
          <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-white">
            Explore <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function Notice({ children }) {
  return (
    <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      {children}
    </div>
  );
}

function TileSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
      <div className="h-11 w-11 animate-pulse rounded-xl bg-slate-200" />
      <div className="mt-4 h-4 w-2/3 animate-pulse rounded bg-slate-200" />
      <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-slate-200" />
    </div>
  );
}
