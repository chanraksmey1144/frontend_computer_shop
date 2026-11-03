import { useEffect, useState } from 'react';
import {
  getAddresses as getAddressesApi,
  createAddress as createAddressApi,
  updateAddress as updateAddressApi,
  deleteAddress as deleteAddressApi,
  setDefaultAddress as setDefaultAddressApi,
} from '../../services/userService';
import { useToast } from '../../components/common';
import { Button, ConfirmDialog, Input, Badge } from '../../components/common';
import Modal from '../../components/common/Modal';
import AccountNav from '../../components/account/AccountNav';
import { MapPin, Pencil, Plus, Star, Trash2, Home } from 'lucide-react';
import { fetchAllPages } from '../../utils/apiResponse';
import { errorMessage, firstError } from '../../utils/format';

const EMPTY_FORM = {
  recipient_name: '',
  phone: '',
  province: '',
  district: '',
  commune: '',
  village: '',
  address_line: '',
  delivery_note: '',
  is_default: false,
};

export default function Addresses() {
  const { show } = useToast();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [formMessage, setFormMessage] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [defaultingId, setDefaultingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchAllPages(getAddressesApi)
      .then((rows) => {
        if (!cancelled) setAddresses(rows);
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

  async function reloadAddresses() {
    const rows = await fetchAllPages(getAddressesApi);
    setAddresses(rows);
  }

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setFormMessage(null);
    setOpen(true);
  }

  function openEdit(address) {
    setEditing(address);
    setForm({
      recipient_name: address.recipient_name || '',
      phone: address.phone || '',
      province: address.province || '',
      district: address.district || '',
      commune: address.commune || '',
      village: address.village || '',
      address_line: address.address_line || '',
      delivery_note: address.delivery_note || '',
      is_default: Boolean(address.is_default),
    });
    setFormErrors({});
    setFormMessage(null);
    setOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setFormErrors({});
    setFormMessage(null);

    const payload = {
      recipient_name: form.recipient_name.trim(),
      phone: form.phone.trim(),
      province: form.province.trim(),
      district: form.district.trim() || null,
      commune: form.commune.trim() || null,
      village: form.village.trim() || null,
      address_line: form.address_line.trim(),
      delivery_note: form.delivery_note.trim() || null,
      is_default: form.is_default,
    };

    try {
      if (editing) await updateAddressApi(editing.id, payload);
      else await createAddressApi(payload);
      setOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      await reloadAddresses();
      show({
        title: editing ? 'Address updated' : 'Address saved',
        description: `${payload.recipient_name}'s delivery address is ready.`,
        type: 'success',
      });
    } catch (err) {
      if (err.response?.status === 422) {
        setFormErrors(err.response.data.errors || {});
        setFormMessage(errorMessage(err, 'Please check the address details.'));
      } else {
        setFormMessage(errorMessage(err, 'Unable to save address.'));
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    setDeleting(true);
    try {
      await deleteAddressApi(id);
      await reloadAddresses();
      show({ title: 'Address deleted', type: 'success' });
      setDeleteId(null);
    } catch (err) {
      show({
        title: 'Delete failed',
        description: errorMessage(err, 'Unable to delete address.'),
        type: 'error',
      });
    } finally {
      setDeleting(false);
    }
  }

  async function handleSetDefault(id) {
    setDefaultingId(id);
    try {
      await setDefaultAddressApi(id);
      await reloadAddresses();
      show({ title: 'Default address updated', type: 'success' });
    } catch (err) {
      show({
        title: 'Update failed',
        description: errorMessage(err, 'Unable to set the default address.'),
        type: 'error',
      });
    } finally {
      setDefaultingId(null);
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
        <Button onClick={openCreate} className="self-start sm:self-auto">
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
          <Button onClick={openCreate} className="mt-6">
            Add your first address
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="group relative flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Home className="h-5 w-5" />
                </span>
                <div className="flex items-center gap-1">
                  {address.is_default && <Badge variant="success">Default</Badge>}
                  {!address.is_default && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(address.id)}
                      disabled={Boolean(defaultingId)}
                      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-600 disabled:opacity-50"
                      aria-label={`Set ${address.recipient_name} as default address`}
                      title="Set as default"
                    >
                      <Star className={`h-4 w-4 ${defaultingId === address.id ? 'animate-pulse' : ''}`} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => openEdit(address)}
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    aria-label={`Edit ${address.recipient_name}'s address`}
                    title="Edit address"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteId(address.id)}
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                    aria-label="Delete address"
                    title="Delete address"
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
              {address.delivery_note && (
                <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-500">
                  {address.delivery_note}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={open}
        onClose={() => { if (!saving) setOpen(false); }}
        title={editing ? 'Edit delivery address' : 'Add delivery address'}
        className="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formMessage && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
              {formMessage}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="address-recipient"
              label="Recipient name"
              value={form.recipient_name}
              onChange={(e) => setForm({ ...form, recipient_name: e.target.value })}
              error={firstError(formErrors, 'recipient_name')}
              maxLength={150}
              required
            />
            <Input
              id="address-phone"
              label="Phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              error={firstError(formErrors, 'phone')}
              maxLength={30}
              required
            />
          </div>
          <Input
            id="address-line"
            label="Address line"
            placeholder="Street, house number…"
            value={form.address_line}
            onChange={(e) => setForm({ ...form, address_line: e.target.value })}
            error={firstError(formErrors, 'address_line')}
            maxLength={500}
            required
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Input
              id="address-province"
              label="Province"
              value={form.province}
              onChange={(e) => setForm({ ...form, province: e.target.value })}
              error={firstError(formErrors, 'province')}
              maxLength={120}
              required
            />
            <Input
              id="address-district"
              label="District"
              value={form.district}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
              error={firstError(formErrors, 'district')}
              maxLength={120}
            />
            <Input
              id="address-commune"
              label="Commune"
              value={form.commune}
              onChange={(e) => setForm({ ...form, commune: e.target.value })}
              error={firstError(formErrors, 'commune')}
              maxLength={120}
            />
            <Input
              id="address-village"
              label="Village"
              value={form.village}
              onChange={(e) => setForm({ ...form, village: e.target.value })}
              error={firstError(formErrors, 'village')}
              maxLength={120}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="address-note" className="block text-sm font-medium text-slate-700">
              Delivery note
            </label>
            <textarea
              id="address-note"
              rows={2}
              value={form.delivery_note}
              onChange={(e) => setForm({ ...form, delivery_note: e.target.value })}
              maxLength={500}
              placeholder="Gate code, landmark, preferred delivery time…"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
            />
            {firstError(formErrors, 'delivery_note') && (
              <p className="text-xs text-rose-600" role="alert">{firstError(formErrors, 'delivery_note')}</p>
            )}
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? 'Save changes' : 'Save address'}
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
