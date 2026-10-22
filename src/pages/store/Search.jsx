import { useSearchParams } from 'react-router-dom';
import ProductList from './ProductList';

export default function Search() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Search</p>
        <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-slate-900">Search results</h1>
        <p className="mt-1 text-sm text-slate-500">
          Results for <span className="font-semibold text-slate-700">“{q}”</span>
        </p>
      </div>
      <ProductList initialQuery={{ search: q }} />
    </div>
  );
}
