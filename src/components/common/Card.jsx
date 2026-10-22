import { cn } from '../../utils/cn';

export default function Card({ children, className = '', padding = true, ...props }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/40 transition-all duration-300',
        padding ? 'p-5' : '',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return <div className={cn('mb-3', className)}>{children}</div>;
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={cn('text-lg font-semibold leading-tight text-slate-900', className)}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className = '' }) {
  return <div className={cn('text-sm leading-relaxed text-slate-600', className)}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return <div className={cn('mt-4 flex items-center justify-between gap-2', className)}>{children}</div>;
}
