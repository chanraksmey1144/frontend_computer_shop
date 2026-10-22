import { Link } from 'react-router-dom';
import { Home, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="relative flex min-h-[60vh] flex-col items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-white px-6 py-20 text-center shadow-sm">
      <div className="absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-brand-100/60 blur-3xl" />
      <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <Compass className="h-8 w-8" />
      </span>
      <p className="relative mt-6 text-6xl font-extrabold tracking-tight text-slate-900">404</p>
      <h1 className="relative mt-2 text-2xl font-bold text-slate-900">Page not found</h1>
      <p className="relative mt-2 max-w-md text-sm text-slate-500">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <div className="relative mt-7 flex flex-col gap-2 sm:flex-row">
        <Link
          to="/"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <Home className="h-4 w-4" /> Go home
        </Link>
        <Link
          to="/products"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          Browse products
        </Link>
      </div>
    </div>
  );
}
