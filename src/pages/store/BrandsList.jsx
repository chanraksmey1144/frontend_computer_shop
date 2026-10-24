import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBrands } from '../../services/brandService';
import { ImageFallback } from '../../components/common';
import { fetchAllPages } from '../../utils/apiResponse';
import { Boxes, ArrowRight } from 'lucide-react';

export default function BrandsList() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchAllPages(getBrands, { status: 'active' })
      .then((rows) => {
        if (!cancelled) setBrands(rows);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load brands.');
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
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Partners</p>
        <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-slate-900">Brands</h1>
        <p className="mt-1 text-sm text-slate-500">
          Shop products from the world's leading technology brands.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200/70" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      ) : brands.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <Boxes className="h-7 w-7" />
          </span>
          <h2 className="mt-4 text-lg font-bold text-slate-900">No brands yet</h2>
          <p className="mt-1 text-sm text-slate-500">Brands will appear here once added.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {brands.map((b) => (
            <Link
              key={b.id}
              to={`/brands/${b.slug}`}
              className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg"
            >
              <div className="flex h-16 w-full items-center justify-center">
                {b.logo_url ? (
                  <ImageFallback
                    src={b.logo_url}
                    alt={b.name}
                    className="h-10 w-full bg-transparent grayscale transition-all group-hover:grayscale-0"
                  />
                ) : (
                  <span className="text-xl font-extrabold tracking-tight text-slate-300 transition-colors group-hover:text-brand-600">
                    {b.name}
                  </span>
                )}
              </div>
              <span className="flex items-center gap-1 text-xs font-semibold text-slate-500 transition-colors group-hover:text-brand-600">
                View products <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
