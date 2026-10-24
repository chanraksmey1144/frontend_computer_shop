import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminCustomers } from '../../services/dashboardService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common';
import { Badge } from '../../components/common';
import { Loader } from '../../components/common';
import { formatDate } from '../../utils/format';
import { fetchAllPages } from '../../utils/apiResponse';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchAllPages(getAdminCustomers)
      .then((rows) => { if (!cancelled) setCustomers(rows); })
      .catch((err) => { if (!cancelled) setError(err.message || 'Failed to load customers.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <Loader className="h-8 w-8 mx-auto mt-20" />;
  if (error) {
    return (
      <Card className="py-16 text-center">
        <CardHeader><CardTitle>Unable to load customers</CardTitle></CardHeader>
        <p className="text-sm text-slate-500">{error}</p>
        <p className="text-sm text-slate-500 mt-2">The customers API is not yet implemented on the backend.</p>
      </Card>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
        <Link to="/admin" className="inline-flex h-10 items-center rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700">Back to dashboard</Link>
      </div>

      <Card>
        <CardHeader><CardTitle>Customer list</CardTitle></CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <div className="py-12 text-center">
              <h3 className="text-lg font-semibold text-slate-900">No customers</h3>
              <p className="text-sm text-slate-500 mt-1">Customers will appear here once they register.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="pb-3 text-sm font-semibold text-slate-600">Name</th>
                    <th className="pb-3 text-sm font-semibold text-slate-600">Email</th>
                    <th className="pb-3 text-sm font-semibold text-slate-600">Phone</th>
                    <th className="pb-3 text-sm font-semibold text-slate-600 text-center">Role</th>
                    <th className="pb-3 text-sm font-semibold text-slate-600 text-center">Status</th>
                    <th className="pb-3 text-sm font-semibold text-slate-600 text-center">Registered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 group">
                      <td className="pb-4 text-sm font-medium text-slate-900">{c.name}</td>
                      <td className="pb-4 text-sm text-slate-500">{c.email}</td>
                      <td className="pb-4 text-sm text-slate-500">{c.phone || '—'}</td>
                      <td className="pb-4 text-center"><Badge variant="neutral" className="text-xs">{c.role?.name || 'customer'}</Badge></td>
                      <td className="pb-4 text-center"><Badge variant={c.status === 'active' ? 'success' : 'neutral'} className="text-xs">{c.status}</Badge></td>
                      <td className="pb-4 text-sm text-slate-500 text-center">{formatDate(c.created_at)}</td>
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



