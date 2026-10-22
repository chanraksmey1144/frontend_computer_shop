import { Link, Outlet } from 'react-router-dom';
import { Cpu, ShieldCheck, Truck, Headset, Star } from 'lucide-react';

const BENEFITS = [
  { icon: ShieldCheck, text: 'Genuine products with official warranty' },
  { icon: Truck, text: 'Fast, reliable delivery across Cambodia' },
  { icon: Headset, text: 'Expert support before and after you buy' },
];

export default function AuthLayout({ children }) {
  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <img
          src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1400&q=80"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/90 to-brand-900/60" />
        <div className="absolute -left-20 top-1/3 h-72 w-72 rounded-full bg-brand-500/30 blur-3xl" />

        <Link to="/" className="relative flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-600/30">
            <Cpu size={20} strokeWidth={2.2} />
          </span>
          <span className="text-lg font-extrabold tracking-tight">
            Computer<span className="text-brand-400">Shop</span>
          </span>
        </Link>

        <div className="relative max-w-md">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-300">Welcome</p>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight">
            Your next upgrade starts here.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            Create an account to track orders, save addresses and get exclusive member pricing on
            laptops, desktops and accessories.
          </p>
          <ul className="mt-8 space-y-3">
            {BENEFITS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-slate-200">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-brand-300">
                  <Icon className="h-4 w-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <div className="flex gap-0.5 text-amber-400">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-current" />
            ))}
          </div>
          <p className="mt-2 text-sm text-slate-200">
            “Fast delivery and genuine products. The team helped me pick the perfect laptop for my
            work.”
          </p>
          <p className="mt-3 text-xs font-medium text-slate-400">— Sokha, Phnom Penh</p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between px-5 py-5 lg:px-10">
          <Link to="/" className="flex items-center gap-2.5 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white">
              <Cpu size={18} />
            </span>
            <span className="font-extrabold tracking-tight text-slate-900">
              Computer<span className="text-brand-600">Shop</span>
            </span>
          </Link>
          <Link
            to="/"
            className="ml-auto text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
          >
            ← Back to store
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 pb-12 sm:px-8">
          <div className="w-full max-w-md animate-fade-up">
            {children ?? <Outlet />}
          </div>
        </div>
      </div>
    </div>
  );
}
