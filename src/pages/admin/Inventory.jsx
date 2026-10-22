import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getInventory } from '../../services/inventoryService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common';
import { Badge } from '../../components/common';
import { Loader } from '../../components/common';

export default function AdminInventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getInventory()
      .then((res) => { if (!cancelled) setItems(res.data.data || res.data || []); })
      .catch((err) => { if (!cancelled) setError(err.message || 'Failed to load inventory.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <Loader className="h-8 w-8 mx-auto mt-20" />;
  if (error) {
    return (
      <Card className="py-16 text-center">
        <CardHeader><CardTitle>Unable to load inventory</CardTitle></CardHeader>
        <p className="text-sm text-slate-500">{error}</p>
        <p className="text-sm text-slate-500 mt-2">The inventory API is not yet implemented on the backend.</p>
      </Card>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
        <Link to="/admin/products" className="inline-flex h-10 items-center rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700">Manage products</Link>
      </div>

      <Card>
        <CardHeader><CardTitle>Stock levels</CardTitle></CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="py-12 text-center">
              <h3 className="text-lg font-semibold text-slate-900">No inventory records</h3>
              <p className="text-sm text-slate-500 mt-1">Inventory tracking is not yet connected to the backend.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="pb-3 text-sm font-semibold text-slate-600">Product</th>
                    <th className="pb-3 text-sm font-semibold text-slate-600 text-right">SKU</th>
                    <th className="pb-3 text-sm font-semibold text-slate-600 text-right">Available</th>
                    <th className="pb-3 text-sm font-semibold text-slate-600 text-right">Reserved</th>
                    <th className="pb-3 text-sm font-semibold text-slate-600 text-right">Reorder level</th>
                    <th className="pb-3 text-sm font-semibold text-slate-600 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((i) => (
                    <tr key={i.id} className={cn('hover:bg-slate-50 group', i.low_stock ? 'bg-amber-50' : '')}>
                      <td className="pb-4 text-sm font-medium text-slate-900">{i.product_name || 'Product'}</td>
                      <td className="pb-4 text-sm text-slate-500 text-right">{i.sku || '—'}</td>
                      <td className="pb-4 text-sm font-medium text-slate-900 text-right">{i.quantity ?? 0}</td>
                      <td className="pb-4 text-sm text-slate-500 text-right">{i.reserved_quantity ?? 0}</td>
                      <td className="pb-4 text-sm text-slate-500 text-right">{i.reorder_level ?? 0}</td>
                      <td className="pb-4 text-center">
                        <Badge variant={i.low_stock ? 'danger' : 'success'} className="text-xs">
                          {i.low_stock ? 'Low stock' : 'OK'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}



