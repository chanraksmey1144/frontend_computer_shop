import { useEffect, useState } from 'react';
import { User } from 'lucide-react';
import { cn } from '../../utils/cn';

const SIZES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

export default function Avatar({ src, alt = 'User', className = '', size = 'md' }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 font-semibold text-slate-500',
        SIZES[size] || SIZES.md,
        className
      )}
    >
      {src && !failed ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <User className="h-[60%] w-[60%]" aria-label={alt} />
      )}
    </span>
  );
}
