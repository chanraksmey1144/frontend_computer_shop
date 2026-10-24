import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

export default function Breadcrumbs({ items = [], className = '' }) {
  if (!items.length) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn('min-w-0', className)}>
      <ol className="no-scrollbar flex items-center gap-1.5 overflow-x-auto text-xs text-slate-400">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex shrink-0 items-center gap-1.5">
              {item.to && !last ? (
                <Link
                  to={item.to}
                  className="whitespace-nowrap transition-colors hover:text-brand-600"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={last ? 'page' : undefined}
                  className={cn('whitespace-nowrap', last && 'font-medium text-slate-600')}
                >
                  {item.label}
                </span>
              )}
              {!last && <ChevronRight className="h-3 w-3 text-slate-300" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
