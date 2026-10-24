import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCategories } from '../../services/categoryService';
import { fetchAllPages } from '../../utils/apiResponse';
import { Laptop, Monitor, Cpu, Keyboard, Headphones, Boxes, ArrowRight } from 'lucide-react';

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

export default function CategoriesList() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchAllPages(getCategories, { status: 'active' })
      .then((rows) => {
        if (!cancelled) setCategories(rows);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load categories.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-8">
      <div className="border-b border-slate-200 pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Browse</p>
        <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-slate-900">Categories</h1>
        <p className="mt-1 text-sm text-slate-500">
          Explore our full range of computers, components and accessories.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-slate-200/70" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <Boxes className="h-7 w-7" />
          </span>
          <h2 className="mt-4 text-lg font-bold text-slate-900">No categories yet</h2>
          <p className="mt-1 text-sm text-slate-500">Categories will appear here once added.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((c) => {
            const Icon = iconFor(c.name);
            return (
              <Link
                key={c.id}
                to={`/categories/${c.slug}`}
                className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg"
              >
                <span className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-brand-50 transition-transform group-hover:scale-150" />
                <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-600/25">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="relative mt-4 text-sm font-semibold text-slate-900">{c.name}</p>
                <p className="relative mt-0.5 text-xs text-slate-400">
                  {c.children?.length ? `${c.children.length} subcategories` : c.slug}
                </p>
                <span className="relative mt-3 flex items-center gap-1 text-xs font-semibold text-brand-600">
                  Browse <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
