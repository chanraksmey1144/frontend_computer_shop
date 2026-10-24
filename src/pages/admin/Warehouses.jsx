import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  createWarehouse,
  deleteWarehouse,
  getWarehouses,
  updateWarehouse,
} from '../../services/warehouseService';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  Skeleton,
  useToast,
} from '../../components/common';
import { AlertTriangle, Boxes, ChevronLeft, ChevronRight, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { errorMessage, formatNumber } from '../../utils/format';

const EMPTY_FORM = { name: '', code: '', address: '', phone: '', status: 'active' };

export default function AdminWarehouses() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { show } = useToast();
  const [warehouses, setWarehouses] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0 });
  const [requestState, setRequestState] = useState({ key: null, error: null });
  const [retry, setRetry] = useState(0);
  const [warehouseModalOpen, setWarehouseModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [formMessage, setFormMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingWarehouse, setDeletingWarehouse] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const query = Object.fromEntries(searchParams.entries());
  const page = Math.max(1, Number(query.page) || 1);
  const requestKey = `${query.search || ''}|${query.status || ''}|${page}|${retry}`;
  const loading = requestState.key !== requestKey;
  const loadError = requestState.key === requestKey ? requestState.error : null;

  useEffect(() => {
    let cancelled = false;

    getWarehouses({
      page,
      search: query.search || undefined,
      status: query.status || undefined,
    })
      .then((response) => {
        if (cancelled) return;
        const payload = response.data?.data ?? response.data;
        const rows = Array.isArray(payload) ? payload : payload?.data || [];
        setWarehouses(rows);
        setPagination({
          currentPage: payload?.current_page ?? page,
          lastPage: payload?.last_page ?? 1,
          total: payload?.total ?? rows.length,
        });
        setRequestState({ key: requestKey, error: null });
      })
      .catch((error) => {
        if (!cancelled) {
          setRequestState({ key: requestKey, error: errorMessage(error, 'Unable to load warehouses.') });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [page, query.search, query.status, requestKey]);

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next, { replace: true });
  }

  function openCreate() {
    setEditingWarehouse(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setFormMessage(null);
    setWarehouseModalOpen(true);
  }

  function openEdit(warehouse) {
    setEditingWarehouse(warehouse);
    setForm({
      name: warehouse.name || '',
      code: warehouse.code || '',
      address: warehouse.address || '',
      phone: warehouse.phone || '',
      status: warehouse.status || 'active',
    });
    setFormErrors({});
    setFormMessage(null);
    setWarehouseModalOpen(true);
  }

  async function saveWarehouse(event) {
    event.preventDefault();
    setFormErrors({});
    setFormMessage(null);
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      code: form.code.trim(),
      address: form.address.trim() || null,
      phone: form.phone.trim() || null,
      status: form.status,
    };

    try {
      if (editingWarehouse) await updateWarehouse(editingWarehouse.id, payload);
      else await createWarehouse(payload);
      setEditingWarehouse(null);
      setWarehouseModalOpen(false);
      setRetry((value) => value + 1);
      show({
        title: editingWarehouse ? 'Warehouse updated' : 'Warehouse created',
        description: `${payload.name} is saved.`,
        type: 'success',
      });
    } catch (error) {
      if (error.response?.status === 422) setFormErrors(error.response.data.errors || {});
      else setFormMessage(errorMessage(error, 'Unable to save this warehouse.'));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deletingWarehouse) return;
    setDeleting(true);
    try {
      await deleteWarehouse(deletingWarehouse.id);
      setDeletingWarehouse(null);
      setRetry((value) => value + 1);
      show({ title: 'Warehouse deleted', description: `${deletingWarehouse.name} was removed.`, type: 'success' });
    } catch (error) {
      show({
        title: 'Unable to delete warehouse',
        description: errorMessage(error, 'This warehouse could not be deleted.'),
        type: 'error',
      });
      setDeletingWarehouse(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Stock management"
        title="Warehouses"
        description="Manage the locations where product stock is stored."
        actions={(
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add warehouse
          </Button>
        )}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <Input
            id="warehouse-search"
            type="search"
            aria-label="Search warehouses"
            value={query.search || ''}
            onChange={(event) => updateParam('search', event.target.value)}
            placeholder="Search name or code"
            className="pl-9"
          />
        </div>
        <label className="space-y-1.5 text-sm font-medium text-slate-700">
          <span>Status</span>
          <select
            value={query.status || 'all'}
            onChange={(event) => updateParam('status', event.target.value === 'all' ? '' : event.target.value)}
            className="h-11 min-w-36 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 shadow-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
      </div>

      {loadError ? (
        <EmptyState
          icon={AlertTriangle}
          tone="warning"
          title="Warehouses unavailable"
          description={loadError}
          action={(
            <Button variant="outline" onClick={() => setRetry((value) => value + 1)}>
              <RefreshCw className="h-4 w-4" /> Try again
            </Button>
          )}
        />
      ) : (
        <Card padding={false}>
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Warehouse locations</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {loading ? 'Updating locations…' : `${formatNumber(pagination.total)} locations`}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-14 w-full" />)}
            </div>
          ) : warehouses.length === 0 ? (
            <div className="px-5 py-12">
              <EmptyState
                icon={Boxes}
                title="No warehouses yet"
                description="Add a warehouse before entering stock for your products."
                action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Add warehouse</Button>}
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-3 font-semibold">Location</th>
                      <th className="px-5 py-3 font-semibold">Code</th>
                      <th className="px-5 py-3 font-semibold">Contact</th>
                      <th className="px-5 py-3 font-semibold">Address</th>
                      <th className="px-5 py-3 text-center font-semibold">Status</th>
                      <th className="px-5 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {warehouses.map((warehouse) => (
                      <tr key={warehouse.id} className="transition-colors hover:bg-slate-50/70">
                        <td className="px-5 py-4 text-sm font-semibold text-slate-900">{warehouse.name}</td>
                        <td className="px-5 py-4 text-sm font-medium text-slate-600">{warehouse.code}</td>
                        <td className="px-5 py-4 text-sm text-slate-600">{warehouse.phone || '—'}</td>
                        <td className="max-w-xs truncate px-5 py-4 text-sm text-slate-600">{warehouse.address || '—'}</td>
                        <td className="px-5 py-4 text-center">
                          <Badge variant={warehouse.status === 'active' ? 'success' : 'neutral'}>{warehouse.status}</Badge>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEdit(warehouse)}>Edit</Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                              aria-label={`Delete ${warehouse.name}`}
                              onClick={() => setDeletingWarehouse(warehouse)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination.lastPage > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
                  <p className="text-sm text-slate-500">Page {pagination.currentPage} of {pagination.lastPage}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => updateParam('page', String(page - 1))}>
                      <ChevronLeft className="h-4 w-4" /> Previous
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= pagination.lastPage} onClick={() => updateParam('page', String(page + 1))}>
                      Next <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      )}

      <Modal
        isOpen={warehouseModalOpen}
        onClose={() => { if (!saving) setWarehouseModalOpen(false); }}
        title={editingWarehouse ? 'Edit warehouse' : 'Add warehouse'}
        className="max-w-xl"
      >
        <WarehouseForm
          editing={Boolean(editingWarehouse)}
          form={form}
          setForm={setForm}
          errors={formErrors}
          message={formMessage}
          saving={saving}
          onSubmit={saveWarehouse}
          onCancel={() => setWarehouseModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deletingWarehouse)}
        onConfirm={confirmDelete}
        onCancel={() => { if (!deleting) setDeletingWarehouse(null); }}
        title="Delete warehouse?"
        description={deletingWarehouse ? `${deletingWarehouse.name} will be removed. Warehouses with inventory may not be deletable.` : ''}
        confirmLabel="Delete warehouse"
        loading={deleting}
      />
    </div>
  );
}

function WarehouseForm({ editing, form, setForm, errors, message, saving, onSubmit, onCancel }) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {message && <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">{message}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="warehouse-name"
          label="Warehouse name"
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          error={errors.name?.[0]}
          maxLength={150}
          required
        />
        <Input
          id="warehouse-code"
          label="Location code"
          value={form.code}
          onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))}
          error={errors.code?.[0]}
          maxLength={50}
          hint="Use a short unique code, for example PP-01."
          required
        />
        <Input
          id="warehouse-phone"
          label="Phone"
          type="tel"
          value={form.phone}
          onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
          error={errors.phone?.[0]}
          maxLength={30}
        />
        <label className="space-y-1.5 text-sm font-medium text-slate-700">
          <span>Status</span>
          <select
            value={form.status}
            onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="warehouse-address" className="block text-sm font-medium text-slate-700">Address</label>
        <textarea
          id="warehouse-address"
          rows={3}
          value={form.address}
          onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
        />
        {errors.address?.[0] && <p className="text-xs text-rose-600" role="alert">{errors.address[0]}</p>}
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button type="submit" loading={saving}>{editing ? 'Save changes' : 'Create warehouse'}</Button>
      </div>
    </form>
  );
}
