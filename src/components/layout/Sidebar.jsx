import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Tags,
  ShoppingCart,
  Users,
  Settings,
  BarChart3,
  Boxes,
  Store,
  Cpu,
  ChevronLeft,
  X,
} from 'lucide-react';
import { cn } from '../../utils/cn';

const GROUPS = [
  {
    label: 'Overview',
    items: [{ name: 'Dashboard', icon: LayoutDashboard, to: '/admin' }],
  },
  {
    label: 'Catalog',
    items: [
      { name: 'Products', icon: Package, to: '/admin/products' },
      { name: 'Categories', icon: Tags, to: '/admin/categories' },
      { name: 'Brands', icon: Boxes, to: '/admin/brands' },
      { name: 'Inventory', icon: BarChart3, to: '/admin/inventory' },
    ],
  },
  {
    label: 'Sales',
    items: [
      { name: 'Orders', icon: ShoppingCart, to: '/admin/orders' },
      { name: 'Customers', icon: Users, to: '/admin/customers' },
    ],
  },
  {
    label: 'Insights',
    items: [{ name: 'Reports', icon: BarChart3, to: '/admin/reports' }],
  },
  {
    label: 'System',
    items: [{ name: 'Settings', icon: Settings, to: '/admin/settings' }],
  },
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onClose }) {
  const location = useLocation();

  const isActive = (to) =>
    to === '/admin'
      ? location.pathname === '/admin'
      : location.pathname === to || location.pathname.startsWith(`${to}/`);

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r border-white/5 bg-slate-950 text-slate-300 transition-[width,transform] duration-300',
        collapsed ? 'lg:w-[76px]' : 'lg:w-[264px]',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      {/* Brand */}
      <div className="flex h-16 items-center gap-2.5 border-b border-white/5 px-4">
        <Link to="/admin" className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-600/30">
            <Cpu size={20} strokeWidth={2.2} />
          </span>
          {!collapsed && (
            <span className="truncate text-base font-extrabold tracking-tight text-white">
              Computer<span className="text-brand-400">Shop</span>
            </span>
          )}
        </Link>
        <button
          onClick={onClose}
          className="ml-auto rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
        <button
          onClick={onToggle}
          className={cn(
            'hidden rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white lg:block',
            collapsed ? 'absolute -right-3 top-5 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-slate-700 bg-slate-900' : 'ml-auto'
          )}
          aria-label="Toggle sidebar"
        >
          <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
        {GROUPS.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.to);
                return (
                  <Link
                    key={item.name}
                    to={item.to}
                    title={collapsed ? item.name : undefined}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                      active
                        ? 'bg-white/10 text-white'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white',
                      collapsed && 'justify-center'
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-500" />
                    )}
                    <item.icon
                      className={cn(
                        'h-5 w-5 shrink-0 transition-colors',
                        active ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'
                      )}
                    />
                    {!collapsed && <span className="truncate">{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/5 p-3">
        <Link
          to="/"
          className={cn(
            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white',
            collapsed && 'justify-center'
          )}
          title={collapsed ? 'View store' : undefined}
        >
          <Store className="h-5 w-5 shrink-0 text-slate-500" />
          {!collapsed && <span>View store</span>}
        </Link>
      </div>
    </aside>
  );
}
