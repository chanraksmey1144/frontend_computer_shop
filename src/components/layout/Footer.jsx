import { Link } from 'react-router-dom';
import {
  Cpu,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Truck,
  Headset,
} from 'lucide-react';

const YEAR = new Date().getFullYear();

const COLUMNS = [
  {
    title: 'Shop',
    links: [
      { label: 'All products', to: '/products' },
      { label: 'Categories', to: '/categories' },
      { label: 'Brands', to: '/brands' },
      { label: 'Shopping cart', to: '/cart' },
    ],
  },
  {
    title: 'Your account',
    links: [
      { label: 'My profile', to: '/profile' },
      { label: 'My orders', to: '/my-orders' },
      { label: 'Addresses', to: '/addresses' },
      { label: 'Account settings', to: '/account/settings' },
    ],
  },
];

const PROMISES = [
  { icon: ShieldCheck, label: 'Genuine products' },
  { icon: Truck, label: 'Local delivery' },
  { icon: Headset, label: 'Human support' },
];

export default function Footer() {
  return (
    <footer className="mt-auto bg-slate-950 text-slate-400">
      <div className="container-page">
        <div className="grid gap-8 border-b border-white/10 py-12 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-300">
              Ready to upgrade?
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Find the right computer for the way you work and play.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
              Browse the full catalog or start with a category. Every order is handled by our local
              team in Phnom Penh.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              to="/products"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-500"
            >
              Shop all products <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/categories"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Browse categories
            </Link>
          </div>
        </div>

        <div className="grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-600/25">
                <Cpu size={20} strokeWidth={2.2} />
              </span>
              <span className="text-lg font-extrabold tracking-tight text-white">
                Computer<span className="text-brand-400">Shop</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
              Laptops, desktops, monitors, components and accessories for work, gaming and
              creativity.
            </p>

            <ul className="mt-6 space-y-2.5 text-sm">
              <li className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 text-brand-400" /> Phnom Penh, Cambodia
              </li>
              <li>
                <a href="tel:+85500000000" className="flex items-center gap-2.5 transition-colors hover:text-white">
                  <Phone className="h-4 w-4 text-brand-400" /> +855 00 000 000
                </a>
              </li>
              <li>
                <a href="mailto:hello@computershop.com" className="flex items-center gap-2.5 transition-colors hover:text-white">
                  <Mail className="h-4 w-4 text-brand-400" /> hello@computershop.com
                </a>
              </li>
            </ul>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-white">{col.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-slate-400 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Why shop here</h4>
            <ul className="mt-4 space-y-3">
              {PROMISES.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2.5 text-sm text-slate-400">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-brand-400">
                    <Icon className="h-4 w-4" />
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 py-6 text-xs text-slate-500 sm:flex-row">
          <p>(c) {YEAR} ComputerShop. All rights reserved.</p>
          <p>Storefront and admin built for desktop and mobile.</p>
        </div>
      </div>
    </footer>
  );
}
