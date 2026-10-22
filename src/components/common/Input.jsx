import { cn } from '../../utils/cn';

export default function Input({
  id,
  label,
  type = 'text',
  value,
  defaultValue,
  onChange,
  onBlur,
  placeholder,
  disabled = false,
  error,
  required = false,
  className = '',
  ...props
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700">
          {label}
          {required && (
            <span className="ml-1 text-rose-500" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        aria-invalid={error ? 'true' : 'false'}
        aria-required={required}
        className={cn(
          'block h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-4 disabled:bg-slate-50 disabled:text-slate-500',
          error
            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
            : 'border-slate-200 hover:border-slate-300 focus:border-brand-500 focus:ring-brand-500/15',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-xs font-medium text-rose-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
