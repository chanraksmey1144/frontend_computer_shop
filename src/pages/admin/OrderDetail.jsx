import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getOrder as getOrderApi } from '../../services/orderService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common';
import { Badge } from '../../components/common';
import { Loader } from '../../components/common';
import { formatMoney, formatDate } from '../../utils/format';

export default function AdminOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getOrderApi(id)
      .then((res) => { if (!cancelled) setOrder(res.data.data || res.data); })
      .catch((err) => { if (!cancelled) setError(err.message || 'Failed to load order.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <Loader className="h-8 w-8 mx-auto mt-20" />;
  if (error || !order) {
    return (
      <Card className="py-16 text-center">
        <CardHeader><CardTitle>Order not found</CardTitle></CardHeader>
        <p className="text-sm text-slate-500">{error || 'The order does not exist.'}</p>
        <Link to="/admin/orders" className="inline-flex h-10 items-center rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700 mt-4">Back to orders</Link>
      </Card>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/admin/orders" className="inline-flex h-10 items-center rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700">Back to orders</Link>
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
          <Badge variant="info" className="text-xs">{order.payment_status || '—'}</Badge>
        </div>
      </div>
      <h1 className="text-2xl font-bold text-slate-900">Order #{order.order_number || order.id}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Order summary</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="text-slate-900">{formatMoney(order.subtotal || 0)}</span>
              </div>
              {order.discount_amount && order.discount_amount > 0 && (
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-slate-500">Discount</span>
                  <span className="text-emerald-600 font-medium">âˆ’{formatMoney(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Delivery fee</span>
                <span className="text-slate-900">{formatMoney(order.delivery_fee || 0)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-slate-900 pt-2 border-t border-slate-100">
                <span>Total</span>
                <span className="text-lg">{formatMoney(order.total_amount || 0)}</span>
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-700 mb-1">Items</div>
              <div className="space-y-2">
                {(order.order_items || []).map((item) => (
                  <div key={item.id} className="flex justify-between text-sm text-slate-700">
                    <span>{item.product_name || 'Item'} × {item.quantity}</span>
                    <span>{formatMoney(item.unit_price || 0)}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Customer</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-700">Name</div>
              <div className="text-sm text-slate-900">{order.user?.name || order.recipient_name || '—'}</div>
            </div>
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-700">Email</div>
              <div className="text-sm text-slate-900">{order.user?.email || '—'}</div>
            </div>
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-700">Phone</div>
              <div className="text-sm text-slate-900">{order.recipient_phone || '—'}</div>
            </div>
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-700">Order date</div>
              <div className="text-sm text-slate-900">{formatDate(order.created_at)}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Shipping address</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-sm font-semibold text-slate-900">{order.recipient_name || '—'}</div>
            <div className="text-sm text-slate-600">{order.recipient_phone || '—'}</div>
            <div className="text-sm text-slate-600 whitespace-pre-wrap">{order.shipping_address || '—'}</div>
          </div>
        </CardContent>
      </Card>

      {order.customer_note && (
        <Card>
          <CardHeader><CardTitle>Customer note</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{order.customer_note}</p>
          </CardContent>
        </Card>
      )}
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




