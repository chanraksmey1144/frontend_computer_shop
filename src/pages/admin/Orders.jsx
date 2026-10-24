import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminOrders } from '../../services/dashboardService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common';
import { Badge } from '../../components/common';
import { Loader } from '../../components/common';
import { formatMoney, formatDate } from '../../utils/format';
import { fetchAllPages } from '../../utils/apiResponse';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchAllPages(getAdminOrders)
      .then((rows) => { if (!cancelled) setOrders(rows); })
      .catch((err) => { if (!cancelled) setError(err.message || 'Failed to load orders.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <Loader className="h-8 w-8 mx-auto mt-20" />;
  if (error) {
    return (
      <Card className="py-16 text-center">
        <CardHeader><CardTitle>Unable to load orders</CardTitle></CardHeader>
        <p className="text-sm text-slate-500">{error}</p>
        <p className="text-sm text-slate-500 mt-2">The admin orders API is not yet implemented on the backend.</p>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
        <Link to="/admin" className="inline-flex h-10 items-center rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700">Back to dashboard</Link>
      </div>

      <Card>
        <CardHeader><CardTitle>Order management</CardTitle></CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="py-12 text-center">
              <h3 className="text-lg font-semibold text-slate-900">No orders</h3>
              <p className="text-sm text-slate-500 mt-1">Orders will appear here once customers place them.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="pb-3 text-sm font-semibold text-slate-600">Order #</th>
                    <th className="pb-3 text-sm font-semibold text-slate-600">Customer</th>
                    <th className="pb-3 text-sm font-semibold text-slate-600">Date</th>
                    <th className="pb-3 text-sm font-semibold text-slate-600 text-right">Total</th>
                    <th className="pb-3 text-sm font-semibold text-slate-600 text-center">Status</th>
                    <th className="pb-3 text-sm font-semibold text-slate-600 text-center">Payment</th>
                    <th className="pb-3 text-sm font-semibold text-slate-600 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50 group">
                      <td className="pb-4 text-sm font-medium text-slate-900">{o.order_number || o.id}</td>
                      <td className="pb-4 text-sm text-slate-700">{o.user?.name || o.customer_name || '—'}</td>
                      <td className="pb-4 text-sm text-slate-500">{formatDate(o.created_at)}</td>
                      <td className="pb-4 text-sm font-medium text-slate-900 text-right">{formatMoney(o.total_amount || 0)}</td>
                      <td className="pb-4 text-center"><Badge variant={statusVariant(o.status)} className="text-xs">{o.status}</Badge></td>
                      <td className="pb-4 text-center"><Badge variant="info" className="text-xs">{o.payment_status || '—'}</Badge></td>
                      <td className="pb-4 text-right">
                        <Link to={`/admin/orders/${o.id}`} className="text-sm text-brand-600 hover:underline font-medium">View</Link>
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

function statusVariant(status) {
  switch (status) {
    case 'delivered': return 'success';
    case 'shipped': return 'info';
    case 'confirmed': return 'info';
    case 'processing': return 'warning';
    case 'cancelled': return 'danger';
    case 'refunded': return 'danger';
    default: return 'neutral';
  }
}



