import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/common';

export default function AdminReports() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Reports &amp; analytics</h1>
        <Link to="/admin" className="inline-flex h-10 items-center rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700">Back to dashboard</Link>
      </div>

      <Card>
        <CardHeader><CardTitle>Analytics</CardTitle></CardHeader>
        <CardContent>
          <div className="py-16 text-center">
            <h3 className="text-lg font-semibold text-slate-900">Reports not available</h3>
            <p className="text-sm text-slate-500 mt-1">
              The analytics API is not yet implemented on the backend. No business figures are
              fabricated here. Connect the <code>/admin/dashboard</code> endpoint to enable reports.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Link to="/admin/products" className="inline-flex h-10 items-center rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700">Manage products</Link>
        </CardFooter>
      </Card>
    </div>
  );
}





