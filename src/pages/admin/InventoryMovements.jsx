import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  createInventoryMovement,
  getInventoryMovements,
} from '../../services/inventoryMovementService';
import { getWarehouses } from '../../services/warehouseService';
import { getProducts, getProductVariants } from '../../services/productService';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  Skeleton,
  useToast,
} from '../../components/common';
import { ArrowLeftRight, ChevronLeft, ChevronRight, Plus, RefreshCw } from 'lucide-react';
import { fetchAllPages } from '../../utils/apiResponse';
import { errorMessage, firstError, formatDateTime, formatNumber } from '../../utils/format';

const PAGE_SIZE = 10;

const MOVEMENT_TYPES = [
  { value: 'stock_in', label: 'Stock in', tone: 'success' },
  { value: 'stock_out', label: 'Stock out', tone: 'warning' },
  { value: 'sale', label: 'Sale', tone: 'info' },
  { value: 'return', label: 'Return', tone: 'success' },
  { value: 'adjustment', label: 'Adjustment', tone: 'neutral' },
  { value: 'reservation', label: 'Reservation', tone: 'warning' },
  { value: 'release', label: 'Release', tone: 'success' },
];

const POSITIVE_TYPES = ['stock_in', 'return', 'reservation', 'release'];
const NEGATIVE_TYPES = ['stock_out', 'sale'];

const EMPTY_FORM = {
  warehouse_id: '',
  product_id: '',
  variant_id: '',
  movement_type: 'stock_in',
  quantity_change: '',
  reference_type: '',
  reference_id: '',
  notes: '',
};

function movementMeta(type) {
  return MOVEMENT_TYPES.find((item) => item.value === type) || { label: type, tone: 'neutral' };
}

export default function AdminInventoryMovements() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { show } = useToast();
  const [movements, setMovements] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0 });
  const [retry, setRetry] = useState(0);
  const [requestState, setRequestState] = useState({ key: null, error: null });
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [variants, setVariants] = useState([]);
  const [variantsForProduct, setVariantsForProduct] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [formMessage, setFormMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  const query = Object.fromEntries(searchParams.entries());
  const page = Math.max(1, Number(query.page) || 1);
  const requestKey = `${page}|${query.warehouse_id || ''}|${query.product_id || ''}|${query.movement_type || ''}|${retry}`;
  const loading = requestState.key !== requestKey;
  const loadError = requestState.key === requestKey ? requestState.error : null;
  const variantsLoading = Boolean(form.product_id) && variantsForProduct !== Number(form.product_id);

  useEffect(() => {
    let cancelled = false;

    Promise.all([fetchAllPages(getWarehouses), fetchAllPages(getProducts)])
      .then(([warehouseRows, productRows]) => {
        if (cancelled) return;
        setWarehouses(warehouseRows);
        setProducts(productRows);
      })
      .catch(() => {
        if (!cancelled) {
          setWarehouses([]);
          setProducts([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    getInventoryMovements({
      page,
      per_page: PAGE_SIZE,
      warehouse_id: query.warehouse_id || undefined,
      product_id: query.product_id || undefined,
      movement_type: query.movement_type || undefined,
    })
      .then((response) => {
        if (cancelled) return;
        const payload = response.data?.data ?? response.data;
        const rows = Array.isArray(payload) ? payload : payload?.data || [];
        setMovements(rows);
        setPagination({
          currentPage: payload?.current_page ?? page,
          lastPage: payload?.last_page ?? 1,
          total: payload?.total ?? rows.length,
        });
        setRequestState({ key: requestKey, error: null });
      })
      .catch((error) => {
        if (!cancelled) {
          setRequestState({ key: requestKey, error: errorMessage(error, 'Unable to load stock movements.') });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [page, query.warehouse_id, query.product_id, query.movement_type, requestKey]);

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
    setForm(EMPTY_FORM);
    setVariants([]);
    setVariantsForProduct(null);
    setFormErrors({});
    setFormMessage(null);
    setModalOpen(true);
  }

  function changeProduct(value) {
    setVariants([]);
    setVariantsForProduct(null);
    setForm((current) => ({ ...current, product_id: value, variant_id: '' }));
  }

  function changeMovementType(value) {
    const sign = POSITIVE_TYPES.includes(value) ? 1 : NEGATIVE_TYPES.includes(value) ? -1 : 0;
    setForm((current) => {
      const quantity = Number(current.quantity_change);
      const normalized = current.quantity_change && sign !== 0 && Number.isFinite(quantity)
        ? String(Math.abs(quantity) * sign)
        : current.quantity_change;
      return { ...current, movement_type: value, quantity_change: normalized };
    });
  }

  async function saveMovement(event) {
    event.preventDefault();
    setFormErrors({});
    setFormMessage(null);

    const change = Number(form.quantity_change);
    if (!Number.isInteger(change) || change === 0) {
      setFormErrors({ quantity_change: ['Enter a non-zero whole number.'] });
      return;
    }
    if (POSITIVE_TYPES.includes(form.movement_type) && change < 0) {
      setFormErrors({ quantity_change: ['This movement type requires a positive quantity.'] });
      return;
    }
    if (NEGATIVE_TYPES.includes(form.movement_type) && change > 0) {
      setFormErrors({ quantity_change: ['This movement type requires a negative quantity.'] });
      return;
    }

    setSaving(true);
    try {
      const response = await createInventoryMovement({
        warehouse_id: Number(form.warehouse_id),
        product_id: Number(form.product_id),
        variant_id: form.variant_id ? Number(form.variant_id) : null,
        movement_type: form.movement_type,
        quantity_change: change,
        reference_type: form.reference_type.trim() || null,
        reference_id: form.reference_id ? Number(form.reference_id) : null,
        notes: form.notes.trim() || null,
      });

      const inventory = response.data?.data?.inventory;
      setModalOpen(false);
      setForm(EMPTY_FORM);
      setRetry((value) => value + 1);
      show({
        title: 'Movement recorded',
        description: inventory
          ? `Available stock is now ${formatNumber(inventory.available_quantity)}.`
          : 'The stock movement was saved.',
        type: 'success',
      });
    } catch (error) {
      if (error.response?.status === 422) setFormErrors(error.response.data.errors || {});
      else setFormMessage(errorMessage(error, 'Unable to record this movement.'));
    } finally {
      setSaving(false);
    }
  }

  const quantityHint = POSITIVE_TYPES.includes(form.movement_type)
    ? 'Use a positive number, for example 5.'
    : NEGATIVE_TYPES.includes(form.movement_type)
      ? 'Use a negative number, for example -2.'
      : 'Use a positive or negative number to correct the stock level.';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Stock management"
        title="Stock movements"
        description="Every stock change is recorded here with the product, warehouse, and reason."
        actions={(
          <div className="flex flex-wrap gap-2">
            <Link
              to="/admin/inventory"
              className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              View inventory
            </Link>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> Record movement
            </Button>
          </div>
        )}
      />

      <div className="grid gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:grid-cols-3">
        <label className="space-y-1.5 text-sm font-medium text-slate-700">
          <span>Warehouse</span>
          <select
            value={query.warehouse_id || ''}
            onChange={(event) => updateParam('warehouse_id', event.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 shadow-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
          >
            <option value="">All warehouses</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name} ({warehouse.code})
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5 text-sm font-medium text-slate-700">
          <span>Product</span>
          <select
            value={query.product_id || ''}
            onChange={(event) => updateParam('product_id', event.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 shadow-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
          >
            <option value="">All products</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>{product.sku ? `${product.name} (${product.sku})` : product.name}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5 text-sm font-medium text-slate-700">
          <span>Type</span>
          <select
            value={query.movement_type || ''}
            onChange={(event) => updateParam('movement_type', event.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 shadow-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
          >
            <option value="">All types</option>
            {MOVEMENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </label>
      </div>

      {loadError ? (
        <EmptyState
          icon={ArrowLeftRight}
          tone="warning"
          title="Movements unavailable"
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
              <h2 className="text-sm font-bold text-slate-900">Movement history</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {loading ? 'Updating history…' : `${formatNumber(pagination.total)} movements`}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-14 w-full" />)}
            </div>
          ) : movements.length === 0 ? (
            <div className="px-5 py-12">
              <EmptyState
                icon={ArrowLeftRight}
                title="No stock movements yet"
                description="Record a movement to track stock in, stock out, sales, and adjustments."
                action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Record movement</Button>}
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-3 font-semibold">Date</th>
                      <th className="px-5 py-3 font-semibold">Product</th>
                      <th className="px-5 py-3 font-semibold">Warehouse</th>
                      <th className="px-5 py-3 font-semibold">Type</th>
                      <th className="px-5 py-3 text-right font-semibold">Change</th>
                      <th className="px-5 py-3 font-semibold">Recorded by</th>
                      <th className="px-5 py-3 font-semibold">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {movements.map((movement) => {
                      const meta = movementMeta(movement.movement_type);
                      const change = Number(movement.quantity_change) || 0;
                      return (
                        <tr key={movement.id} className="transition-colors hover:bg-slate-50/70">
                          <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                            {formatDateTime(movement.created_at)}
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-slate-900">
                              {movement.variant?.name || movement.product?.name || `Product #${movement.product_id}`}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {movement.variant ? `${movement.product?.name || ''} · ` : ''}
                              {movement.variant?.sku || movement.product?.sku || 'No SKU'}
                            </p>
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-600">
                            {movement.warehouse?.name || `Warehouse #${movement.warehouse_id}`}
                          </td>
                          <td className="px-5 py-4">
                            <Badge variant={meta.tone}>{meta.label}</Badge>
                          </td>
                          <td className={`px-5 py-4 text-right text-sm font-bold ${change < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {change > 0 ? '+' : ''}{formatNumber(change)}
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-600">
                            {movement.user?.name || 'System'}
                          </td>
                          <td className="max-w-xs truncate px-5 py-4 text-sm text-slate-500">
                            {movement.notes || '—'}
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
        title="Record stock movement"
        className="max-w-2xl"
      >
        <form onSubmit={saveMovement} className="space-y-5">
          {formMessage && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
              {formMessage}
            </p>
          )}

          <p className="rounded-xl bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-500">
            A matching inventory record must already exist for the selected warehouse, product, and variant.
            {' '}
            <Link to="/admin/inventory" className="font-semibold text-brand-600 hover:text-brand-700">
              Add stock first
            </Link>
            {' '}
            if it is missing.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              <span>Warehouse<span className="ml-1 text-rose-500" aria-hidden="true">*</span></span>
              <select
                value={form.warehouse_id}
                onChange={(event) => setForm((current) => ({ ...current, warehouse_id: event.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
                required
              >
                <option value="">Select warehouse</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>{warehouse.name} ({warehouse.code})</option>
                ))}
              </select>
              {firstError(formErrors, 'warehouse_id') && (
                <p className="text-xs text-rose-600" role="alert">{firstError(formErrors, 'warehouse_id')}</p>
              )}
            </label>
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              <span>Product<span className="ml-1 text-rose-500" aria-hidden="true">*</span></span>
              <select
                value={form.product_id}
                onChange={(event) => changeProduct(event.target.value)}
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
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              <span>Movement type<span className="ml-1 text-rose-500" aria-hidden="true">*</span></span>
              <select
                value={form.movement_type}
                onChange={(event) => changeMovementType(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
                required
              >
                {MOVEMENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              {firstError(formErrors, 'movement_type') && (
                <p className="text-xs text-rose-600" role="alert">{firstError(formErrors, 'movement_type')}</p>
              )}
            </label>
          </div>

          <Input
            id="movement-quantity"
            label="Quantity change"
            type="number"
            step="1"
            value={form.quantity_change}
            onChange={(event) => setForm((current) => ({ ...current, quantity_change: event.target.value }))}
            error={firstError(formErrors, 'quantity_change')}
            hint={quantityHint}
            required
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="movement-reference-type"
              label="Reference type"
              value={form.reference_type}
              onChange={(event) => setForm((current) => ({ ...current, reference_type: event.target.value }))}
              error={firstError(formErrors, 'reference_type')}
              hint="Optional, for example order or return."
              maxLength={80}
            />
            <Input
              id="movement-reference-id"
              label="Reference ID"
              type="number"
              min="1"
              step="1"
              value={form.reference_id}
              onChange={(event) => setForm((current) => ({ ...current, reference_id: event.target.value }))}
              error={firstError(formErrors, 'reference_id')}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="movement-notes" className="block text-sm font-medium text-slate-700">Notes</label>
            <textarea
              id="movement-notes"
              rows={3}
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              maxLength={500}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
            />
            {firstError(formErrors, 'notes') && (
              <p className="text-xs text-rose-600" role="alert">{firstError(formErrors, 'notes')}</p>
            )}
            {firstError(formErrors, 'inventory') && (
              <p className="text-xs text-rose-600" role="alert">{firstError(formErrors, 'inventory')}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>Record movement</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
