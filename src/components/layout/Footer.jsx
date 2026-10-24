import { Link } from 'react-router-dom';
import {
  Cpu,
  Facebook,
  Instagram,
  Youtube,
  Send,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
} from 'lucide-react';

const YEAR = new Date().getFullYear();

const COLUMNS = [
  {
    title: 'Shop',
    links: [
      { label: 'All products', to: '/products' },
      { label: 'Categories', to: '/categories' },
      { label: 'Brands', to: '/brands' },
      { label: 'Search', to: '/search' },
      { label: 'Shopping cart', to: '/cart' },
    ],
  },
  {
    title: 'Customer care',
    links: [
      { label: 'My orders', to: '/my-orders' },
      { label: 'My account', to: '/profile' },
      { label: 'Addresses', to: '/addresses' },
      { label: 'Account settings', to: '/account/settings' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About us', to: '/products' },
      { label: 'Privacy policy', to: '/products' },
      { label: 'Terms of service', to: '/products' },
    ],
  },
];

const SOCIALS = [
  { label: 'Facebook', icon: Facebook, href: '#' },
  { label: 'Instagram', icon: Instagram, href: '#' },
  { label: 'YouTube', icon: Youtube, href: '#' },
  { label: 'Telegram', icon: Send, href: '#' },
];

export default function Footer() {
  return (
    <footer className="mt-auto bg-slate-950 text-slate-400">
      <div className="container-page">
        {/* Newsletter */}
        <div className="grid gap-8 border-b border-white/10 py-12 lg:grid-cols-2 lg:items-center">
          <div>
            <h3 className="text-2xl font-bold text-white">Stay ahead of the curve</h3>
            <p className="mt-2 max-w-md text-sm text-slate-400">
              Get product launches, build guides and exclusive deals in your inbox.
            </p>
          </div>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex w-full max-w-md flex-col gap-2 sm:flex-row lg:ml-auto"
          >
            <div className="relative flex-1">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                required
                placeholder="Enter your email"
                className="h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-500"
            >
              Subscribe <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>

        {/* Main */}
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
              Premium laptops, desktops, monitors, components and accessories for work, gaming and
              creativity — trusted by customers across Cambodia.
            </p>
            <ul className="mt-6 space-y-2.5 text-sm">
              <li className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 text-brand-400" /> Phnom Penh, Cambodia
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-brand-400" /> +855 00 000 000
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-brand-400" /> hello@computershop.com
              </li>
            </ul>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
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
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 py-6 sm:flex-row">
          <p className="text-xs text-slate-500">
            © {YEAR} ComputerShop. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            {SOCIALS.map(({ label, icon: Icon, href }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-slate-400 transition-colors hover:bg-brand-600 hover:text-white"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
