import { NavLink } from 'react-router-dom';
import { User, Package, MapPin, Settings } from 'lucide-react';
import { cn } from '../../utils/cn';

const LINKS = [
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/my-orders', label: 'Orders', icon: Package },
  { to: '/addresses', label: 'Addresses', icon: MapPin },
  { to: '/account/settings', label: 'Settings', icon: Settings },
];

export default function AccountNav() {
  return (
    <nav className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
      {LINKS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/my-orders'}
          className={({ isActive }) =>
            cn(
              'flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors',
              isActive
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            )
          }
        >
          <Icon className="h-4 w-4" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
