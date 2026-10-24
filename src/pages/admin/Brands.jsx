import { useEffect, useState } from 'react';
import { getBrands, createBrand, deleteBrand } from '../../services/brandService';
import { useToast } from '../../components/common';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common';
import { Button } from '../../components/common';
import { Input } from '../../components/common';
import { Badge } from '../../components/common';
import { ConfirmDialog } from '../../components/common';
import { ImageFallback } from '../../components/common';
import { fetchAllPages } from '../../utils/apiResponse';

export default function AdminBrands() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { show } = useToast();
  const [form, setForm] = useState({ name: '', slug: '', logo_url: '', description: '', status: 'active' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchAllPages(getBrands)
      .then((rows) => { if (!cancelled) setBrands(rows); })
      .catch((err) => { if (!cancelled) setError(err.message || 'Failed to load brands.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="py-20 text-center"><Loader size="lg" className="mx-auto" /></div>;
  if (error) {
    return (
      <Card className="py-16 text-center">
        <CardHeader><CardTitle>Unable to load brands</CardTitle></CardHeader>
        <p className="text-sm text-slate-500">{error}</p>
      </Card>
    );
  }

  async function handleCreate(e) {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      await createBrand(form);
      setOpen(false);
      setForm({ name: '', slug: '', logo_url: '', description: '', status: 'active' });
      setBrands(await fetchAllPages(getBrands));
      show({ title: 'Brand created', type: 'success' });
    } catch (err) {
      if (err.response && err.response.status === 422) {
        setErrors(err.response.data.errors || {});
      } else {
        show({ title: 'Create failed', description: err.message || 'Unable to create brand.', type: 'error' });
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteBrand(id);
      setBrands(brands.filter((b) => b.id !== id));
      show({ title: 'Brand deleted', type: 'success' });
    } catch (err) {
      show({ title: 'Delete failed', description: err.message || 'Unable to delete brand.', type: 'error' });
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Brands</h1>
        <Button onClick={() => setOpen(true)}>Add brand</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Brand list</CardTitle></CardHeader>
        <CardContent>
          {brands.length === 0 ? (
            <div className="py-12 text-center">
              <h3 className="text-lg font-semibold text-slate-900">No brands</h3>
              <p className="text-sm text-slate-500 mt-1">Add your first brand.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="pb-3 text-sm font-semibold text-slate-600">Logo</th>
                    <th className="pb-3 text-sm font-semibold text-slate-600">Name</th>
                    <th className="pb-3 text-sm font-semibold text-slate-600">Slug</th>
                    <th className="pb-3 text-sm font-semibold text-slate-600 text-center">Status</th>
                    <th className="pb-3 text-sm font-semibold text-slate-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {brands.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50 group">
                      <td className="pb-4">
                        <div className="w-12 h-12 rounded-lg border border-slate-200 bg-slate-100 overflow-hidden">
                          <ImageFallback src={b.logo_url || null} alt={b.name} className="w-full h-full object-contain" />
                        </div>
                      </td>
                      <td className="pb-4 text-sm font-medium text-slate-900">{b.name}</td>
                      <td className="pb-4 text-sm text-slate-500">{b.slug}</td>
                      <td className="pb-4 text-center"><Badge variant={b.status === 'active' ? 'success' : 'neutral'} className="text-xs">{b.status}</Badge></td>
                      <td className="pb-4 text-right">
                        <button onClick={() => setDeleteId(b.id)} className="text-sm text-rose-600 hover:underline">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <ModalForm isOpen={open} onClose={() => setOpen(false)} onSubmit={handleCreate} form={form} setForm={setForm} errors={errors} submitting={submitting} />
      <ConfirmDialog
        isOpen={!!deleteId}
        onConfirm={() => handleDelete(deleteId)}
        onCancel={() => setDeleteId(null)}
        title="Delete brand"
        description="This brand will be removed."
        confirmLabel="Delete"
      />
    </div>
  );
}

function Loader({ size = 'lg', className = '' }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' };
  return (
    <svg className={`animate-spin text-brand-600 ${sizes[size]} ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

function ModalForm({ isOpen, onClose, onSubmit, form, setForm, errors, submitting }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {isOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
          <div className="relative w-full max-w-md m-4 rounded-xl border border-slate-200 bg-white shadow-2xl p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Add brand</h3>
            <form onSubmit={onSubmit} className="space-y-4">
              <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} required />
              <Input label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} error={errors.slug} required />
              <Input label="Logo URL" value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} error={errors.logo_url} />
              <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                <Button type="submit" variant="primary" loading={submitting} disabled={submitting}>Create brand</Button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}






