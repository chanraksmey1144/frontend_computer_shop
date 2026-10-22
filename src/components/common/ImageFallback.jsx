import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '../../utils/cn';

export default function ImageFallback({ src, alt = 'Product', className = '', width, height }) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className={cn('relative overflow-hidden bg-slate-100', className)}
      style={{ width, height }}
    >
      {!loaded && !error && <div className="shimmer absolute inset-0 bg-slate-100" aria-hidden="true" />}

      {!error && src ? (
        <img
          src={src}
          alt={alt}
          className={cn(
            'h-full w-full object-cover transition-all duration-500',
            loaded ? 'scale-100 opacity-100' : 'scale-105 opacity-0'
          )}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          decoding="async"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-400">
          <ImageOff className="h-7 w-7" strokeWidth={1.5} />
          <span className="text-[11px] font-medium uppercase tracking-wide">No image</span>
        </div>
      )}
    </div>
  );
}
