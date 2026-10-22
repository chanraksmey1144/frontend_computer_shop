import { useEffect, useState } from 'react';
import {
  getAddresses as getAddressesApi,
  createAddress as createAddressApi,
  deleteAddress as deleteAddressApi,
} from '../../services/userService';
import { useToast } from '../../components/common';
import { Button, ConfirmDialog, Input, Badge } from '../../components/common';
import Modal from '../../components/common/Modal';
import AccountNav from '../../components/account/AccountNav';
import { MapPin, Plus, Trash2, Home } from 'lucide-react';

const EMPTY_FORM = {
  recipient_name: '',
  phone: '',
  province: '',
  district: '',
  commune: '',
  village: '',
  address_line: '',
  is_default: false,
};

export default function Addresses() {
  const { show } = useToast();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getAddressesApi()
      .then((res) => {
        if (!cancelled) setAddresses(res.data.data || res.data || []);
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load addresses.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await createAddressApi(form);
      setOpen(false);
      setForm(EMPTY_FORM);
      const res = await getAddressesApi();
      setAddresses(res.data.data || res.data || []);
      show({ title: 'Address saved', type: 'success' });
    } catch (err) {
      show({
        title: 'Save failed',
        description: err.message || 'Unable to save address.',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    setDeleting(true);
    try {
      await deleteAddressApi(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      show({ title: 'Address deleted', type: 'success' });
      setDeleteId(null);
    } catch (err) {
      show({
        title: 'Delete failed',
        description: err.message || 'Unable to delete address.',
        type: 'error',
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">My account</p>
          <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-slate-900">Addresses</h1>
          <p className="mt-1 text-sm text-slate-500">Save delivery addresses to check out faster.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="self-start sm:self-auto">
          <Plus className="h-4 w-4" /> Add address
        </Button>
      </div>

      <AccountNav />

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-slate-200/70" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          {error}
        </div>
      ) : addresses.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <MapPin className="h-7 w-7" />
          </span>
          <h2 className="mt-4 text-lg font-bold text-slate-900">No addresses yet</h2>
          <p className="mt-1 text-sm text-slate-500">
            Add a delivery address to speed up your next checkout.
          </p>
          <Button onClick={() => setOpen(true)} className="mt-6">
            Add your first address
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="group relative rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Home className="h-5 w-5" />
                </span>
                <div className="flex items-center gap-2">
                  {address.is_default && <Badge variant="success">Default</Badge>}
                  <button
                    type="button"
                    onClick={() => setDeleteId(address.id)}
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                    aria-label="Delete address"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <p className="mt-4 text-sm font-bold text-slate-900">{address.recipient_name}</p>
              <p className="text-xs text-slate-400">{address.phone}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                {[address.address_line, address.village, address.commune, address.district, address.province]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Add delivery address" className="max-w-lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Recipient name"
              value={form.recipient_name}
              onChange={(e) => setForm({ ...form, recipient_name: e.target.value })}
              required
            />
            <Input
              label="Phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
            />
          </div>
          <Input
            label="Address line"
            placeholder="Street, house number…"
            value={form.address_line}
            onChange={(e) => setForm({ ...form, address_line: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Input
              label="Province"
              value={form.province}
              onChange={(e) => setForm({ ...form, province: e.target.value })}
              required
            />
            <Input label="District" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
            <Input label="Commune" value={form.commune} onChange={(e) => setForm({ ...form, commune: e.target.value })} />
            <Input label="Village" value={form.village} onChange={(e) => setForm({ ...form, village: e.target.value })} />
          </div>

          <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={form.is_default}
              onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            Set as default address
          </label>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save address
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onConfirm={() => handleDelete(deleteId)}
        onCancel={() => setDeleteId(null)}
        title="Delete address"
        description="This address will be removed from your account. This action cannot be undone."
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}
