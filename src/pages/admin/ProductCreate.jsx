import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createProduct } from '../../services/productService';
import { useToast } from '../../components/common';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/common';
import { Button } from '../../components/common';
import { Input } from '../../components/common';

export default function ProductCreate() {
  const navigate = useNavigate();
  const { show } = useToast();
  const [form, setForm] = useState({
    name: '', sku: '', slug: '', category_id: '', brand_id: '', description: '',
    short_description: '', price: '', compare_at_price: '', cost_price: '',
    currency: 'USD', warranty_months: '0', track_inventory: 'true', allow_backorder: 'false',
    product_type: 'other', status: 'draft', specifications: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      await createProduct({
        ...form,
        price: form.price ? Number(form.price) : null,
        compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null,
        cost_price: form.cost_price ? Number(form.cost_price) : null,
        warranty_months: Number(form.warranty_months),
        track_inventory: form.track_inventory === 'true',
        allow_backorder: form.allow_backorder === 'true',
        specifications: form.specifications ? JSON.parse(form.specifications || '{}') : {},
      });
      show({ title: 'Product created', type: 'success' });
      navigate('/admin/products');
    } catch (err) {
      if (err.response && err.response.status === 422) {
        setErrors(err.response.data.errors || {});
      } else {
        show({ title: 'Create failed', description: err.message || 'Unable to create product.', type: 'error' });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/admin/products" className="inline-flex h-10 items-center rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700">Back to products</Link>
        <h1 className="text-2xl font-bold text-slate-900">Add product</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>Product information</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Product name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} required />
              <Input label="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} error={errors.sku} required />
              <Input label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} error={errors.slug} required />
              <Input label="Category ID" type="number" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} error={errors.category_id} required />
              <Input label="Brand ID" type="number" value={form.brand_id} onChange={(e) => setForm({ ...form, brand_id: e.target.value })} error={errors.brand_id} />
            </div>

            <Input label="Short description" value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} />
            <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input label="Price (USD)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} error={errors.price} required />
              <Input label="Compare at price" type="number" value={form.compare_at_price} onChange={(e) => setForm({ ...form, compare_at_price: e.target.value })} />
              <Input label="Cost price" type="number" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="USD">USD</option>
                <option value="KHR">KHR</option>
              </select>
              <Input label="Warranty (months)" type="number" value={form.warranty_months} onChange={(e) => setForm({ ...form, warranty_months: e.target.value })} />
              <select value={form.product_type} onChange={(e) => setForm({ ...form, product_type: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="laptop">Laptop</option>
                <option value="desktop">Desktop</option>
                <option value="monitor">Monitor</option>
                <option value="component">Component</option>
                <option value="accessory">Accessory</option>
                <option value="other">Other</option>
              </select>
            </div>

            <Input label="Specifications (JSON)" value={form.specifications} onChange={(e) => setForm({ ...form, specifications: e.target.value })} placeholder='{"ram":"16GB","storage":"512GB"}' />
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.track_inventory === 'true'} onChange={(e) => setForm({ ...form, track_inventory: e.target.checked ? 'true' : 'false' })} className="rounded text-brand-600" />
              <label className="text-sm text-slate-700">Track inventory</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.allow_backorder === 'true'} onChange={(e) => setForm({ ...form, allow_backorder: e.target.checked ? 'true' : 'false' })} className="rounded text-brand-600" />
              <label className="text-sm text-slate-700">Allow backorder</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.status === 'active'} onChange={(e) => setForm({ ...form, status: e.target.checked ? 'active' : 'draft' })} className="rounded text-brand-600" />
              <label className="text-sm text-slate-700">Active</label>
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <Link to="/admin/products" className="inline-flex h-10 items-center rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700">Cancel</Link>
          <Button type="submit" variant="primary" loading={submitting} disabled={submitting}>Create product</Button>
        </CardFooter>
      </Card>
    </div>
  );
}







