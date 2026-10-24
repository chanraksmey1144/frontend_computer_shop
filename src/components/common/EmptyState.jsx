import { cn } from '../../utils/cn';

const TONES = {
  neutral: 'bg-slate-100 text-slate-500',
  brand: 'bg-brand-50 text-brand-600',
  warning: 'bg-amber-50 text-amber-600',
};

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  tone = 'brand',
  className = '',
}) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-slate-200/80 bg-white px-6 py-16 text-center shadow-sm',
        className
      )}
    >
      {Icon && (
        <span
          className={cn(
            'mx-auto flex h-14 w-14 items-center justify-center rounded-2xl',
            TONES[tone] || TONES.brand
          )}
        >
          <Icon className="h-7 w-7" aria-hidden="true" />
        </span>
      )}
      <h2 className="mt-4 text-lg font-bold text-slate-900">{title}</h2>
      {description && (
        <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-slate-500">
          {description}
        </p>
      )}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}
