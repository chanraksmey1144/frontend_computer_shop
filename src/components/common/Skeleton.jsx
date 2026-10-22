import { cn } from '../../utils/cn';

export default function Skeleton({ className = '', height, width }) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-slate-200', className)}
      style={{ height, width }}
    />
  );
}

