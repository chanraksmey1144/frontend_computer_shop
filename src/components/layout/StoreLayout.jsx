import { NavLink, Outlet } from 'react-router-dom';
import { Home, LayoutGrid, Search, ShoppingCart, User } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { cn } from '../../utils/cn';

export default function StoreLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-700">
      <a
        href="#store-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-xl focus:bg-brand-600 focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
      >
        Skip to content
      </a>
      <Header />
      <main id="store-content" className="flex-1">
        <div className="container-page py-8 pb-24 lg:py-10 lg:pb-10">
          {children ?? <Outlet />}
        </div>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}

function MobileBottomNav() {
  const { isAuthenticated } = useAuth();
  const { itemCount } = useCart();

  const items = [
    { label: 'Home', to: '/', icon: Home, end: true },
    { label: 'Categories', to: '/categories', icon: LayoutGrid },
    { label: 'Search', to: '/search', icon: Search },
    { label: 'Cart', to: '/cart', icon: ShoppingCart, badge: itemCount },
    {
      label: isAuthenticated ? 'Account' : 'Sign in',
      to: isAuthenticated ? '/profile' : '/login',
      icon: User,
    },
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-safe backdrop-blur-xl lg:hidden"
    >
      <ul className="grid grid-cols-5">
        {items.map(({ label, to, icon: Icon, badge, end }) => (
          <li key={label}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'relative flex h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors',
                  isActive ? 'text-brand-600' : 'text-slate-500 hover:text-slate-900'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                    {badge > 0 && (
                      <span className="absolute -right-2.5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                  </span>
                  <span>{label}</span>
                  {isActive && (
                    <span className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-brand-600" />
                  )}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
