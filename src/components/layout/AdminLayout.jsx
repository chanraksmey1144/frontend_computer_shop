import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';
import { Menu, LogOut, Bell, Store, Settings as SettingsIcon } from 'lucide-react';

const TODAY = new Date().toLocaleDateString('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});

function pageTitle(pathname) {
  const map = {
    '/admin': 'Dashboard',
    '/admin/products': 'Products',
    '/admin/products/create': 'New product',
    '/admin/categories': 'Categories',
    '/admin/brands': 'Brands',
    '/admin/inventory': 'Inventory',
    '/admin/orders': 'Orders',
    '/admin/customers': 'Customers',
    '/admin/reports': 'Reports',
    '/admin/settings': 'Settings',
  };
  if (map[pathname]) return map[pathname];
  const segment = pathname.split('/').filter(Boolean).pop() || 'Dashboard';
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

export default function AdminLayout() {
  const { logout, user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const title = pageTitle(location.pathname);
  const initials = (user?.name || 'A').slice(0, 1).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div
        className={cn(
          'flex min-h-screen flex-col transition-[padding] duration-300',
          collapsed ? 'lg:pl-[76px]' : 'lg:pl-[264px]'
        )}
      >
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/85 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Admin
              </p>
              <h1 className="truncate text-base font-bold text-slate-900">{title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="hidden rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500 md:block">
              {TODAY}
            </span>
            <Link
              to="/"
              className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 sm:flex"
            >
              <Store className="h-4 w-4" /> Store
            </Link>
            <button
              type="button"
              className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-500" />
            </button>

            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-xl p-1 pr-2 transition-colors hover:bg-slate-100"
                aria-label="Account"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    initials
                  )}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block max-w-[120px] truncate text-sm font-semibold leading-tight text-slate-900">
                    {user?.name || 'Admin'}
                  </span>
                  <span className="block text-[11px] leading-tight text-slate-500">Administrator</span>
                </span>
              </button>

              {userMenuOpen && (
                <>
                  <button
                    type="button"
                    aria-hidden="true"
                    tabIndex={-1}
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10">
                    <div className="px-3 py-2">
                      <p className="truncate text-sm font-semibold text-slate-900">{user?.name || 'Admin'}</p>
                      <p className="truncate text-xs text-slate-500">{user?.email || ''}</p>
                    </div>
                    <div className="my-1 h-px bg-slate-100" />
                    <Link
                      to="/admin/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                    >
                      <SettingsIcon className="h-4 w-4 text-slate-400" /> Settings
                    </Link>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet context={{ location }} />
        </main>
      </div>
    </div>
  );
}
