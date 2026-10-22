import { useParams } from 'react-router-dom';
import ProductList from './ProductList';

export default function BrandPage() {
  const { slug } = useParams();
  const name = titleCase(slug);

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Brand</p>
        <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-slate-900">{name}</h1>
        <p className="mt-1 text-sm text-slate-500">Explore genuine {name} products.</p>
      </div>
      <ProductList initialQuery={{ brand: slug }} />
    </div>
  );
}

function titleCase(s = '') {
  return s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
