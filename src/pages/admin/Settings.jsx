import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common';
import { Button } from '../../components/common';

export default function AdminSettings() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Admin settings</h1>
        <Link to="/admin" className="inline-flex h-10 items-center rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700">Back to dashboard</Link>
      </div>

      <Card>
        <CardHeader><CardTitle>Account</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-700">Store name</div>
            <input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white" defaultValue="Computer Shop" readOnly />
          </div>
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-700">Currency</div>
            <select className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
              <option>USD</option>
              <option>KHR</option>
            </select>
          </div>
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-700">Timezone</div>
            <select className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
              <option>Asia/Phnom_Penh</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Danger zone</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">Actions in this section cannot be undone.</p>
          <Button variant="danger" className="w-full">Delete admin account</Button>
        </CardContent>
      </Card>
    </div>
  );
}





