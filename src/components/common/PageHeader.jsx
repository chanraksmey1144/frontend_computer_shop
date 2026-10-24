import { cn } from '../../utils/cn';

export default function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  children,
  className = '',
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between',
        className
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">{eyebrow}</p>
        )}
        <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>}
        {children}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
