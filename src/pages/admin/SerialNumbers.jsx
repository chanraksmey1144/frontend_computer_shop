import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  createSerialNumber,
  deleteSerialNumber,
  getSerialNumbers,
  updateSerialNumber,
} from '../../services/serialNumberService';
import { getWarehouses } from '../../services/warehouseService';
import { getProducts, getProductVariants } from '../../services/productService';
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
import { Barcode, ChevronLeft, ChevronRight, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { fetchAllPages } from '../../utils/apiResponse';
import { errorMessage, firstError, formatDate, formatNumber } from '../../utils/format';

const PAGE_SIZE = 10;

const STATUSES = [
  { value: 'in_stock', label: 'In stock', tone: 'success' },
  { value: 'reserved', label: 'Reserved', tone: 'warning' },
  { value: 'sold', label: 'Sold', tone: 'info' },
  { value: 'returned', label: 'Returned', tone: 'success' },
  { value: 'repair', label: 'Repair', tone: 'warning' },
  { value: 'written_off', label: 'Written off', tone: 'danger' },
];

const LOCKED_STATUSES = ['sold', 'reserved'];

const EMPTY_FORM = {
  product_id: '',
  variant_id: '',
  warehouse_id: '',
  serial_number: '',
  status: 'in_stock',
  order_item_id: '',
};

function statusMeta(status) {
  return STATUSES.find((item) => item.value === status) || { label: status, tone: 'neutral' };
}

export default function AdminSerialNumbers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { show } = useToast();
  const [serials, setSerials] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0 });
  const [retry, setRetry] = useState(0);
  const [requestState, setRequestState] = useState({ key: null, error: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSerial, setEditingSerial] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [variants, setVariants] = useState([]);
  const [variantsForProduct, setVariantsForProduct] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [formMessage, setFormMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingSerial, setDeletingSerial] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const query = Object.fromEntries(searchParams.entries());
  const page = Math.max(1, Number(query.page) || 1);
  const requestKey = `${page}|${debouncedSearch}|${query.product_id || ''}|${query.warehouse_id || ''}|${query.status || ''}|${retry}`;
  const loading = requestState.key !== requestKey;
  const loadError = requestState.key === requestKey ? requestState.error : null;
  const variantsLoading = Boolean(form.product_id) && variantsForProduct !== Number(form.product_id);

  useEffect(() => {
    let cancelled = false;

    Promise.all([fetchAllPages(getProducts), fetchAllPages(getWarehouses)])
      .then(([productRows, warehouseRows]) => {
        if (cancelled) return;
        setProducts(productRows);
        setWarehouses(warehouseRows);
      })
      .catch(() => {
        if (!cancelled) {
          setProducts([]);
          setWarehouses([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    let cancelled = false;

    getSerialNumbers({
      page,
      per_page: PAGE_SIZE,
      search: debouncedSearch || undefined,
      product_id: query.product_id || undefined,
      warehouse_id: query.warehouse_id || undefined,
      status: query.status || undefined,
    })
      .then((response) => {
        if (cancelled) return;
        const payload = response.data?.data ?? response.data;
        const rows = Array.isArray(payload) ? payload : payload?.data || [];
        setSerials(rows);
        setPagination({
          currentPage: payload?.current_page ?? page,
          lastPage: payload?.last_page ?? 1,
          total: payload?.total ?? rows.length,
        });
        setRequestState({ key: requestKey, error: null });
      })
      .catch((error) => {
        if (!cancelled) {
          setRequestState({ key: requestKey, error: errorMessage(error, 'Unable to load serial numbers.') });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [page, debouncedSearch, query.product_id, query.warehouse_id, query.status, requestKey]);

  useEffect(() => {
    if (!modalOpen || !form.product_id) {
      return undefined;
    }

    let cancelled = false;
    const productId = Number(form.product_id);

    fetchAllPages((params) => getProductVariants(form.product_id, params))
      .then((rows) => {
        if (!cancelled) setVariants(rows);
      })
      .catch(() => {
        if (!cancelled) setVariants([]);
      })
      .finally(() => {
        if (!cancelled) setVariantsForProduct(productId);
      });

    return () => {
      cancelled = true;
    };
  }, [modalOpen, form.product_id]);

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next, { replace: true });
  }

  function openCreate() {
    setEditingSerial(null);
    setForm(EMPTY_FORM);
    setVariants([]);
    setVariantsForProduct(null);
    setFormErrors({});
    setFormMessage(null);
    setModalOpen(true);
  }

  function openEdit(serial) {
    setEditingSerial(serial);
    setVariants([]);
    setVariantsForProduct(null);
    setForm({
      product_id: String(serial.product_id ?? ''),
      variant_id: serial.variant_id ? String(serial.variant_id) : '',
      warehouse_id: serial.warehouse_id ? String(serial.warehouse_id) : '',
      serial_number: serial.serial_number || '',
      status: serial.status || 'in_stock',
      order_item_id: serial.order_item_id ? String(serial.order_item_id) : '',
    });
    setFormErrors({});
    setFormMessage(null);
    setModalOpen(true);
  }

  async function saveSerial(event) {
    event.preventDefault();
    setFormErrors({});
    setFormMessage(null);

    const payload = {
      product_id: Number(form.product_id),
      variant_id: form.variant_id ? Number(form.variant_id) : null,
      warehouse_id: form.warehouse_id ? Number(form.warehouse_id) : null,
      serial_number: form.serial_number.trim(),
      status: form.status,
      order_item_id: form.order_item_id ? Number(form.order_item_id) : null,
    };

    setSaving(true);
    try {
      if (editingSerial) await updateSerialNumber(editingSerial.id, payload);
      else await createSerialNumber(payload);
      setModalOpen(false);
      setEditingSerial(null);
      setRetry((value) => value + 1);
      show({
        title: editingSerial ? 'Serial updated' : 'Serial added',
        description: `${payload.serial_number} is saved.`,
        type: 'success',
      });
    } catch (error) {
      if (error.response?.status === 422) setFormErrors(error.response.data.errors || {});
      else setFormMessage(errorMessage(error, 'Unable to save this serial number.'));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deletingSerial) return;
    setDeleting(true);
    try {
      await deleteSerialNumber(deletingSerial.id);
      show({ title: 'Serial deleted', description: `${deletingSerial.serial_number} was removed.`, type: 'success' });
      setDeletingSerial(null);
      if (serials.length === 1 && page > 1) updateParam('page', String(page - 1));
      else setRetry((value) => value + 1);
    } catch (error) {
      show({
        title: 'Unable to delete serial',
        description: errorMessage(error, 'This serial number could not be deleted.'),
        type: 'error',
      });
      setDeletingSerial(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Stock management"
        title="Serial numbers"
        description="Track individual devices by serial number across warehouses and statuses."
        actions={(
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add serial
          </Button>
        )}
      />

      <div className="grid gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <Input
            id="serial-search"
            type="search"
            aria-label="Search serial numbers"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search serial number"
            className="pl-9"
          />
        </div>
        <label className="space-y-1.5 text-sm font-medium text-slate-700">
          <span className="sr-only">Product</span>
          <select
            value={query.product_id || ''}
            onChange={(event) => updateParam('product_id', event.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 shadow-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
            aria-label="Filter by product"
          >
            <option value="">All products</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>{product.sku ? `${product.name} (${product.sku})` : product.name}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5 text-sm font-medium text-slate-700">
          <span className="sr-only">Warehouse</span>
          <select
            value={query.warehouse_id || ''}
            onChange={(event) => updateParam('warehouse_id', event.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 shadow-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
            aria-label="Filter by warehouse"
          >
            <option value="">All warehouses</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>{warehouse.name} ({warehouse.code})</option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5 text-sm font-medium text-slate-700">
          <span className="sr-only">Status</span>
          <select
            value={query.status || ''}
            onChange={(event) => updateParam('status', event.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 shadow-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            {STATUSES.map((status) => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
        </label>
      </div>

      {loadError ? (
        <EmptyState
          icon={Barcode}
          tone="warning"
          title="Serial numbers unavailable"
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
              <h2 className="text-sm font-bold text-slate-900">Tracked serials</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {loading ? 'Updating serials…' : `${formatNumber(pagination.total)} serial numbers`}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-14 w-full" />)}
            </div>
          ) : serials.length === 0 ? (
            <div className="px-5 py-12">
              <EmptyState
                icon={Barcode}
                title="No serial numbers found"
                description="Add a serial number to track a specific device through its lifecycle."
                action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Add serial</Button>}
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-3 font-semibold">Serial number</th>
                      <th className="px-5 py-3 font-semibold">Product</th>
                      <th className="px-5 py-3 font-semibold">Warehouse</th>
                      <th className="px-5 py-3 text-center font-semibold">Status</th>
                      <th className="px-5 py-3 font-semibold">Added</th>
                      <th className="px-5 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {serials.map((serial) => {
                      const meta = statusMeta(serial.status);
                      const locked = LOCKED_STATUSES.includes(serial.status);
                      return (
                        <tr key={serial.id} className="transition-colors hover:bg-slate-50/70">
                          <td className="px-5 py-4">
                            <p className="font-mono text-sm font-semibold text-slate-900">{serial.serial_number}</p>
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-slate-900">
                              {serial.product?.name || `Product #${serial.product_id}`}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {serial.variant?.name || serial.variant?.sku || serial.product?.sku || 'No variant'}
                            </p>
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-600">
                            {serial.warehouse?.name || '—'}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <Badge variant={meta.tone}>{meta.label}</Badge>
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-600">{formatDate(serial.created_at)}</td>
                          <td className="px-5 py-4 text-right">
                            <div className="inline-flex items-center gap-1">
                              <Button variant="ghost" size="sm" onClick={() => openEdit(serial)}>Edit</Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 disabled:text-slate-300 disabled:hover:bg-transparent"
                                aria-label={`Delete ${serial.serial_number}`}
                                title={locked ? 'Sold or reserved serials cannot be deleted.' : `Delete ${serial.serial_number}`}
                                disabled={locked}
                                onClick={() => setDeletingSerial(serial)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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
        isOpen={modalOpen}
        onClose={() => { if (!saving) setModalOpen(false); }}
        title={editingSerial ? 'Edit serial number' : 'Add serial number'}
        className="max-w-2xl"
      >
        <form onSubmit={saveSerial} className="space-y-5">
          {formMessage && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
              {formMessage}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              <span>Product<span className="ml-1 text-rose-500" aria-hidden="true">*</span></span>
              <select
                value={form.product_id}
                onChange={(event) => {
                  setVariants([]);
                  setVariantsForProduct(null);
                  setForm((current) => ({ ...current, product_id: event.target.value, variant_id: '' }));
                }}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
                required
              >
                <option value="">Select product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>{product.sku ? `${product.name} (${product.sku})` : product.name}</option>
                ))}
              </select>
              {firstError(formErrors, 'product_id') && (
                <p className="text-xs text-rose-600" role="alert">{firstError(formErrors, 'product_id')}</p>
              )}
            </label>
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              <span>Variant</span>
              <select
                value={form.variant_id}
                onChange={(event) => setForm((current) => ({ ...current, variant_id: event.target.value }))}
                disabled={!form.product_id || variantsLoading}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">{variantsLoading ? 'Loading variants…' : 'No variant'}</option>
                {variants.map((variant) => (
                  <option key={variant.id} value={variant.id}>{variant.name} ({variant.sku})</option>
                ))}
              </select>
              {firstError(formErrors, 'variant_id') && (
                <p className="text-xs text-rose-600" role="alert">{firstError(formErrors, 'variant_id')}</p>
              )}
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="serial-number"
              label="Serial number"
              value={form.serial_number}
              onChange={(event) => setForm((current) => ({ ...current, serial_number: event.target.value }))}
              error={firstError(formErrors, 'serial_number')}
              maxLength={150}
              required
            />
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              <span>Status</span>
              <select
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
              >
                {STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
              {firstError(formErrors, 'status') && (
                <p className="text-xs text-rose-600" role="alert">{firstError(formErrors, 'status')}</p>
              )}
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              <span>Warehouse</span>
              <select
                value={form.warehouse_id}
                onChange={(event) => setForm((current) => ({ ...current, warehouse_id: event.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
              >
                <option value="">Unassigned</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>{warehouse.name} ({warehouse.code})</option>
                ))}
              </select>
              {firstError(formErrors, 'warehouse_id') && (
                <p className="text-xs text-rose-600" role="alert">{firstError(formErrors, 'warehouse_id')}</p>
              )}
            </label>
            <Input
              id="serial-order-item"
              label="Order item ID"
              type="number"
              min="1"
              step="1"
              value={form.order_item_id}
              onChange={(event) => setForm((current) => ({ ...current, order_item_id: event.target.value }))}
              error={firstError(formErrors, 'order_item_id')}
              hint="Optional link to an order item."
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editingSerial ? 'Save changes' : 'Add serial'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deletingSerial)}
        onConfirm={confirmDelete}
        onCancel={() => { if (!deleting) setDeletingSerial(null); }}
        title="Delete serial number?"
        description={deletingSerial ? `${deletingSerial.serial_number} will be removed from tracking. This cannot be undone.` : ''}
        confirmLabel="Delete serial"
        loading={deleting}
      />
    </div>
  );
}
