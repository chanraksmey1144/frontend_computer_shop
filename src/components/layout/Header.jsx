import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import {
  Menu,
  X,
  ShoppingCart,
  Search,
  User,
  Cpu,
  ChevronDown,
  LogOut,
  Package,
  MapPin,
  Phone,
  LayoutDashboard,
} from 'lucide-react';

const CATEGORIES = [
  { name: 'Laptops', to: '/categories/laptops' },
  { name: 'Desktops', to: '/categories/desktops' },
  { name: 'Monitors', to: '/categories/monitors' },
  { name: 'Components', to: '/categories/components' },
  { name: 'Accessories', to: '/categories/accessories' },
];

const NAV = [
  { name: 'Shop All', to: '/products' },
  { name: 'Laptops', to: '/categories/laptops' },
  { name: 'Desktops', to: '/categories/desktops' },
  { name: 'Monitors', to: '/categories/monitors' },
  { name: 'Brands', to: '/brands' },
];

export default function Header() {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const { cart } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const itemCount = cart.item_count || (cart.items ? cart.items.length : 0);

  function handleSearch(e) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    setMobileOpen(false);
  }

  const isActive = (to) => location.pathname === to || location.pathname.startsWith(`${to}/`);

  return (
    <header className="sticky top-0 z-40">
      {/* Utility bar */}
      <div className="hidden bg-slate-900 text-slate-300 md:block">
        <div className="container-page flex h-9 items-center justify-between text-xs">
          <p className="flex items-center gap-1.5">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Free delivery on orders over $100 within Phnom Penh
          </p>
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> Phnom Penh, Cambodia
            </span>
            <a href="tel:+85500000000" className="flex items-center gap-1.5 transition-colors hover:text-white">
              <Phone className="h-3.5 w-3.5" /> +855 00 000 000
            </a>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
        <div className="container-page flex h-16 items-center gap-4 lg:h-[72px]">
          {/* Mobile menu */}
          <button
            type="button"
            className="-ml-1 rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          {/* Logo */}
          <Link to="/" className="group flex shrink-0 items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-600/25 transition-transform group-hover:scale-105">
              <Cpu size={20} strokeWidth={2.2} />
            </span>
            <span className="text-lg font-extrabold tracking-tight text-slate-900">
              Computer<span className="text-brand-600">Shop</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="ml-4 hidden items-center gap-0.5 lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.name}
                to={item.to}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(item.to)
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Search */}
          <form onSubmit={handleSearch} className="ml-auto hidden max-w-md flex-1 md:block">
            <div className="group relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search laptops, components..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-24 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10"
              />
              <button
                type="submit"
                className="absolute right-1 top-1 h-8 rounded-lg bg-brand-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
              >
                Search
              </button>
            </div>
          </form>

          {/* Actions */}
          <div className="ml-auto flex items-center gap-1 md:ml-2">
            <Link
              to="/cart"
              className="relative rounded-xl p-2.5 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              aria-label="Cart"
            >
              <ShoppingCart size={20} />
              {itemCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                  {itemCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <AccountMenu
                user={user}
                isAdmin={isAdmin}
                open={accountOpen}
                setOpen={setAccountOpen}
                onLogout={logout}
              />
            ) : (
              <div className="hidden items-center gap-1.5 sm:flex">
                <Link
                  to="/login"
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-brand-600/20 transition-colors hover:bg-brand-700"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {mobileOpen && (
        <MobileMenu
          onClose={() => setMobileOpen(false)}
          isAuthenticated={isAuthenticated}
          user={user}
          isAdmin={isAdmin}
          onLogout={logout}
          itemCount={itemCount}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearch={handleSearch}
        />
      )}
    </header>
  );
}

function AccountMenu({ user, isAdmin, open, setOpen, onLogout }) {
  const initials = (user?.name || 'A').slice(0, 1).toUpperCase();
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl p-1.5 text-slate-600 transition-colors hover:bg-slate-100"
        aria-expanded={open}
        aria-label="Account"
      >
        <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </span>
        <ChevronDown className={`hidden h-4 w-4 text-slate-400 transition-transform sm:block ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10">
            <div className="px-3 py-2">
              <p className="truncate text-sm font-semibold text-slate-900">{user?.name || 'Account'}</p>
              <p className="truncate text-xs text-slate-500">{user?.email || ''}</p>
            </div>
            <div className="my-1 h-px bg-slate-100" />
            {isAdmin && (
              <MenuLink to="/admin" icon={LayoutDashboard} onClick={() => setOpen(false)}>
                Admin dashboard
              </MenuLink>
            )}
            <MenuLink to="/profile" icon={User} onClick={() => setOpen(false)}>
              My profile
            </MenuLink>
            <MenuLink to="/my-orders" icon={Package} onClick={() => setOpen(false)}>
              My orders
            </MenuLink>
            <MenuLink to="/account/settings" icon={Cpu} onClick={() => setOpen(false)}>
              Account settings
            </MenuLink>
            <div className="my-1 h-px bg-slate-100" />
            <button
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function MenuLink({ to, icon: Icon, children, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
    >
      <Icon className="h-4 w-4 text-slate-400" /> {children}
    </Link>
  );
}

function MobileMenu({
  onClose,
  isAuthenticated,
  user,
  isAdmin,
  onLogout,
  itemCount,
  searchQuery,
  setSearchQuery,
  onSearch,
}) {
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Close menu"
        className="absolute inset-0 cursor-default bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm animate-fade-up flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <Link to="/" onClick={onClose} className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white">
              <Cpu size={18} />
            </span>
            <span className="font-extrabold tracking-tight text-slate-900">
              Computer<span className="text-brand-600">Shop</span>
            </span>
          </Link>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <form onSubmit={onSearch}>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10"
              />
            </div>
          </form>

          <div>
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Browse</p>
            <nav className="space-y-1">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.name}
                  to={cat.to}
                  onClick={onClose}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
                >
                  {cat.name}
                </Link>
              ))}
              <Link
                to="/brands"
                onClick={onClose}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                Brands
              </Link>
              <Link
                to="/cart"
                onClick={onClose}
                className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                Cart <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-700">{itemCount}</span>
              </Link>
            </nav>
          </div>
        </div>

        <div className="border-t border-slate-100 p-5">
          {isAuthenticated ? (
            <div className="space-y-1">
              <div className="mb-2 px-1">
                <p className="text-sm font-semibold text-slate-900">{user?.name || 'Account'}</p>
                <p className="truncate text-xs text-slate-500">{user?.email || ''}</p>
              </div>
              {isAdmin && (
                <Link to="/admin" onClick={onClose} className="block rounded-lg px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50">
                  Admin dashboard
                </Link>
              )}
              <Link to="/profile" onClick={onClose} className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">My profile</Link>
              <Link to="/my-orders" onClick={onClose} className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">My orders</Link>
              <button
                onClick={() => { onClose(); onLogout(); }}
                className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-rose-600 hover:bg-rose-50"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Link to="/login" onClick={onClose} className="flex h-11 items-center justify-center rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50">Login</Link>
              <Link to="/register" onClick={onClose} className="flex h-11 items-center justify-center rounded-xl bg-brand-600 text-sm font-semibold text-white hover:bg-brand-700">Sign up</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
