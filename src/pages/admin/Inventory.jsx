import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adjustInventory, getInventory } from '../../services/inventoryService';
import { getWarehouses } from '../../services/warehouseService';
import InventoryCreateModal from './InventoryCreateModal';
import { useToast } from '../../components/common';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  Skeleton,
} from '../../components/common';
import { Boxes, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { errorMessage, firstError, formatNumber } from '../../utils/format';

const PAGE_SIZE = 10;

export default function AdminInventory() {
  const { show } = useToast();
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
  });
  const [page, setPage] = useState(1);
  const [warehouseId, setWarehouseId] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [retry, setRetry] = useState(0);
  const [requestState, setRequestState] = useState({ key: null, error: null });
  const [selectedItem, setSelectedItem] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [adjustment, setAdjustment] = useState({ quantity: '', reserved_quantity: '', reorder_level: '' });
  const [adjustmentErrors, setAdjustmentErrors] = useState({});
  const [adjustmentMessage, setAdjustmentMessage] = useState(null);
  const [savingAdjustment, setSavingAdjustment] = useState(false);
  const requestKey = `${page}-${warehouseId}-${lowStockOnly}-${retry}`;
  const loading = requestState.key !== requestKey;
  const error = requestState.key === requestKey ? requestState.error : null;

  useEffect(() => {
    let cancelled = false;

    async function loadWarehouses() {
      const rows = [];
      let currentPage = 1;
      let lastPage = 1;

      do {
        const response = await getWarehouses({ page: currentPage });
        const payload = response.data?.data ?? response.data;
        if (Array.isArray(payload)) {
          rows.push(...payload);
          break;
        }
        rows.push(...(payload?.data || []));
        lastPage = payload?.last_page ?? 1;
        currentPage += 1;
      } while (currentPage <= lastPage);

      if (!cancelled) setWarehouses(rows);
    }

    loadWarehouses().catch(() => {
      if (!cancelled) setWarehouses([]);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    getInventory({
      page,
      per_page: PAGE_SIZE,
      warehouse_id: warehouseId || undefined,
      low_stock: lowStockOnly ? 1 : undefined,
    })
      .then((response) => {
        if (cancelled) return;

        const payload = response.data?.data ?? response.data;
        const rows = Array.isArray(payload) ? payload : payload?.data || [];

        setItems(rows);
        setPagination({
          currentPage: payload?.current_page ?? 1,
          lastPage: payload?.last_page ?? 1,
          total: payload?.total ?? rows.length,
        });
        setRequestState({ key: requestKey, error: null });
      })
      .catch((err) => {
        if (!cancelled) {
          setRequestState({
            key: requestKey,
            error: errorMessage(err, 'Failed to load inventory.'),
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [page, requestKey, retry, warehouseId, lowStockOnly]);

  function openAdjustment(item) {
    setSelectedItem(item);
    setAdjustment({
      quantity: String(item.quantity ?? 0),
      reserved_quantity: String(item.reserved_quantity ?? 0),
      reorder_level: String(item.reorder_level ?? 0),
    });
    setAdjustmentErrors({});
    setAdjustmentMessage(null);
  }

  async function saveAdjustment(event) {
    event.preventDefault();
    setAdjustmentErrors({});
    setAdjustmentMessage(null);

    const quantity = Number(adjustment.quantity);
    const reservedQuantity = Number(adjustment.reserved_quantity);
    const reorderLevel = Number(adjustment.reorder_level);

    if (reservedQuantity > quantity) {
      setAdjustmentErrors({ reserved_quantity: ['Reserved stock cannot exceed the on-hand quantity.'] });
      return;
    }

    setSavingAdjustment(true);
    try {
      await adjustInventory(selectedItem.id, {
        quantity,
        reserved_quantity: reservedQuantity,
        reorder_level: reorderLevel,
      });
      setSelectedItem(null);
      setRetry((value) => value + 1);
      show({ title: 'Stock updated', description: 'The inventory record has been saved.', type: 'success' });
    } catch (err) {
      if (err.response?.status === 422) {
        setAdjustmentErrors(err.response.data.errors || {});
      } else {
        setAdjustmentMessage(errorMessage(err, 'Unable to update this stock record.'));
      }
    } finally {
      setSavingAdjustment(false);
    }
  }

  function closeAdjustment() {
    if (!savingAdjustment) setSelectedItem(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Stock management"
        title="Inventory"
        description="Review stock levels by product, variant, and warehouse."
        actions={(
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setCreateModalOpen(true)}>Add stock</Button>
            <Link
              to="/admin/warehouses"
              className="inline-flex h-10 items-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
            >
              Manage warehouses
            </Link>
          </div>
        )}
      />

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <label className="space-y-1.5 text-sm font-medium text-slate-700">
          <span>Warehouse</span>
          <select
            value={warehouseId}
            onChange={(event) => {
              setWarehouseId(event.target.value);
              setPage(1);
            }}
            className="h-11 min-w-56 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 shadow-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
          >
            <option value="">All warehouses</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name} ({warehouse.code})
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(event) => {
              setLowStockOnly(event.target.checked);
              setPage(1);
            }}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          Show low stock only
        </label>
      </div>

      {error ? (
        <EmptyState
          icon={Boxes}
          tone="warning"
          title="Unable to load inventory"
          description={error}
          action={(
            <Button variant="outline" onClick={() => setRetry((value) => value + 1)}>
              <RefreshCw className="mr-2 h-4 w-4" /> Try again
            </Button>
          )}
        />
      ) : loading ? (
        <Card>
          <CardHeader><CardTitle>Stock levels</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="No inventory records yet"
          description="Stock records from your warehouses will appear here once they are added."
          action={<Button onClick={() => setCreateModalOpen(true)}>Add stock</Button>}
        />
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>Stock levels</CardTitle>
              <p className="text-sm text-slate-500">
                {formatNumber(pagination.total)} records
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="pb-3 text-sm font-semibold text-slate-600">Product</th>
                    <th className="pb-3 text-sm font-semibold text-slate-600">Warehouse</th>
                    <th className="pb-3 text-right text-sm font-semibold text-slate-600">SKU</th>
                    <th className="pb-3 text-right text-sm font-semibold text-slate-600">Available</th>
                    <th className="pb-3 text-right text-sm font-semibold text-slate-600">Reserved</th>
                    <th className="pb-3 text-right text-sm font-semibold text-slate-600">Reorder level</th>
                    <th className="pb-3 text-center text-sm font-semibold text-slate-600">Status</th>
                    <th className="pb-3 text-right text-sm font-semibold text-slate-600">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => {
                    const quantity = Number(item.quantity) || 0;
                    const reserved = Number(item.reserved_quantity) || 0;
                    const reorderLevel = Number(item.reorder_level) || 0;
                    const lowStock = quantity <= reorderLevel;
                    const productName = item.variant?.name || item.product?.name || `Product #${item.product_id}`;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-4 text-sm font-medium text-slate-900">
                          {productName}
                          {item.variant && (
                            <span className="mt-0.5 block text-xs font-normal text-slate-500">
                              {item.product?.name}
                            </span>
                          )}
                        </td>
                        <td className="py-4 text-sm text-slate-600">
                          {item.warehouse?.name || `Warehouse #${item.warehouse_id}`}
                        </td>
                        <td className="py-4 text-right text-sm text-slate-500">
                          {item.variant?.sku || item.product?.sku || '—'}
                        </td>
                        <td className="py-4 text-right text-sm font-medium text-slate-900">
                          {formatNumber(Math.max(0, quantity - reserved))}
                        </td>
                        <td className="py-4 text-right text-sm text-slate-500">
                          {formatNumber(reserved)}
                        </td>
                        <td className="py-4 text-right text-sm text-slate-500">
                          {formatNumber(reorderLevel)}
                        </td>
                        <td className="py-4 text-center">
                          <Badge variant={lowStock ? 'danger' : 'success'}>
                            {lowStock ? 'Low stock' : 'OK'}
                          </Badge>
                        </td>
                        <td className="py-4 text-right">
                          <Button variant="outline" size="sm" onClick={() => openAdjustment(item)}>
                            Adjust
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {pagination.lastPage > 1 && (
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                <p className="text-sm text-slate-500">
                  Page {pagination.currentPage} of {pagination.lastPage}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= pagination.lastPage}
                    onClick={() => setPage((value) => Math.min(pagination.lastPage, value + 1))}
                  >
                    Next <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Modal isOpen={Boolean(selectedItem)} onClose={closeAdjustment} title="Adjust stock" className="max-w-lg">
        {selectedItem && (
          <form onSubmit={saveAdjustment} className="space-y-5">
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">
                {selectedItem.variant?.name || selectedItem.product?.name || `Product #${selectedItem.product_id}`}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {selectedItem.warehouse?.name || `Warehouse #${selectedItem.warehouse_id}`}
                {' · '}
                {selectedItem.variant?.sku || selectedItem.product?.sku || 'No SKU'}
              </p>
            </div>

            {adjustmentMessage && (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
                {adjustmentMessage}
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                id="inventory-quantity"
                label="On hand"
                type="number"
                min="0"
                step="1"
                value={adjustment.quantity}
                onChange={(event) => setAdjustment((current) => ({ ...current, quantity: event.target.value }))}
                error={firstError(adjustmentErrors, 'quantity')}
                required
              />
              <Input
                id="inventory-reserved"
                label="Reserved"
                type="number"
                min="0"
                step="1"
                value={adjustment.reserved_quantity}
                onChange={(event) => setAdjustment((current) => ({ ...current, reserved_quantity: event.target.value }))}
                error={firstError(adjustmentErrors, 'reserved_quantity')}
                required
              />
              <Input
                id="inventory-reorder"
                label="Reorder level"
                type="number"
                min="0"
                step="1"
                value={adjustment.reorder_level}
                onChange={(event) => setAdjustment((current) => ({ ...current, reorder_level: event.target.value }))}
                error={firstError(adjustmentErrors, 'reorder_level')}
                required
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <Button type="button" variant="outline" onClick={closeAdjustment} disabled={savingAdjustment}>
                Cancel
              </Button>
              <Button type="submit" loading={savingAdjustment}>Save stock</Button>
            </div>
          </form>
        )}
      </Modal>
      {createModalOpen && <InventoryCreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={(productName) => {
          setCreateModalOpen(false);
          setPage(1);
          setWarehouseId('');
          setLowStockOnly(false);
          setRetry((value) => value + 1);
          show({ title: 'Stock added', description: `Inventory for ${productName} has been created.`, type: 'success' });
        }}
        warehouses={warehouses}
      />}
    </div>
  );
}
