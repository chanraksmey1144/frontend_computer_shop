import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/common';
import { Button } from '../../components/common';
import { Input } from '../../components/common';

export default function ProductEdit() {
  const { id } = useParams();
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/admin/products" className="inline-flex h-10 items-center rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700">Back to products</Link>
        <h1 className="text-2xl font-bold text-slate-900">Edit product #{id}</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>Product information</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">
            The product edit API (<code>/api/products/{id}</code>) is not yet implemented on the
            backend. This form is a placeholder ready to be wired to the API.
          </p>
          <Input label="Product name" placeholder="Product name" />
          <Input label="SKU" placeholder="SKU" />
          <Input label="Price (USD)" type="number" placeholder="0.00" />
          <select className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white w-full mt-2">
            <option>draft</option>
            <option>active</option>
            <option>inactive</option>
          </select>
        </CardContent>
        <CardFooter>
          <Link to="/admin/products" className="inline-flex h-10 items-center rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700">Cancel</Link>
          <Button variant="primary" onClick={() => { setSubmitting(true); }} loading={submitting} disabled={submitting}>
            Save changes
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}






