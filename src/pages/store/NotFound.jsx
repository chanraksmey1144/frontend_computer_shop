import { Link } from 'react-router-dom';
import { Home, LayoutGrid, PackageSearch } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="relative flex min-h-[60vh] flex-col items-center justify-center overflow-hidden rounded-3xl border border-slate-200/80 bg-white px-6 py-16 text-center shadow-sm sm:py-20">
      <div className="absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-brand-100/60 blur-3xl" />
      <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <PackageSearch className="h-8 w-8" />
      </span>
      <p className="relative mt-6 text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">Oops</p>
      <h1 className="relative mt-2 text-xl font-bold text-slate-900 sm:text-2xl">This page is unavailable</h1>
      <p className="relative mt-2 max-w-md text-sm leading-relaxed text-slate-500">
        We couldn't find the page you're looking for. Use the links below to continue shopping.
      </p>
      <div className="relative mt-7 flex flex-wrap items-center justify-center gap-2">
        <Link
          to="/"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <Home className="h-4 w-4" /> Go home
        </Link>
        <Link
          to="/products"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          Browse products
        </Link>
        <Link
          to="/categories"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          <LayoutGrid className="h-4 w-4" /> Shop by category
        </Link>
      </div>
    </div>
  );
}
