import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createInventory } from '../../services/inventoryService';
import { getProducts, getProductVariants } from '../../services/productService';
import { Button, Input, Modal } from '../../components/common';
import { errorMessage, firstError } from '../../utils/format';

function responseRows(response) {
  const payload = response.data?.data ?? response.data;
  return Array.isArray(payload) ? payload : payload?.data || [];
}

export default function InventoryCreateModal({ isOpen, onClose, onCreated, warehouses }) {
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productResult, setProductResult] = useState({ key: null, products: [], error: null });
  const [variantResult, setVariantResult] = useState({ productId: null, variants: [], error: null });
  const [form, setForm] = useState({ warehouse_id: '', variant_id: '', quantity: '0', reserved_quantity: '0', reorder_level: '5' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  const activeWarehouses = warehouses.filter((warehouse) => warehouse.status === 'active');

  const productSearchKey = productSearch.trim();
  const productsLoading = isOpen && productResult.key !== productSearchKey;
  const products = productResult.key === productSearchKey ? productResult.products : [];
  const productsError = productResult.key === productSearchKey ? productResult.error : null;
  const variantsLoading = Boolean(selectedProduct) && variantResult.productId !== selectedProduct.id;
  const variants = variantResult.productId === selectedProduct?.id ? variantResult.variants : [];
  const variantsError = variantResult.productId === selectedProduct?.id ? variantResult.error : null;

  useEffect(() => {
    if (!isOpen) return undefined;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      getProducts({ search: productSearchKey || undefined })
        .then((response) => {
          if (!cancelled) setProductResult({ key: productSearchKey, products: responseRows(response), error: null });
        })
        .catch((error) => {
          if (!cancelled) setProductResult({ key: productSearchKey, products: [], error: errorMessage(error, 'Unable to search products.') });
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isOpen, productSearchKey]);

  useEffect(() => {
    if (!isOpen || !selectedProduct) return undefined;

    let cancelled = false;
    async function loadVariants() {
      try {
        const rows = [];
        let page = 1;
        let lastPage = 1;
        do {
          const response = await getProductVariants(selectedProduct.id, { page });
          const payload = response.data?.data ?? response.data;
          if (Array.isArray(payload)) {
            rows.push(...payload);
            break;
          }
          rows.push(...(payload?.data || []));
          lastPage = payload?.last_page ?? 1;
          page += 1;
        } while (page <= lastPage);

        if (!cancelled) setVariantResult({ productId: selectedProduct.id, variants: rows.filter((variant) => variant.status === 'active'), error: null });
      } catch (error) {
        if (!cancelled) setVariantResult({ productId: selectedProduct.id, variants: [], error: errorMessage(error, 'Product variants could not be loaded.') });
      }
    }

    loadVariants();
    return () => {
      cancelled = true;
    };
  }, [isOpen, selectedProduct]);

  function chooseProduct(product) {
    setSelectedProduct(product);
    setProductSearch('');
    setForm((current) => ({ ...current, variant_id: '' }));
    setErrors((current) => ({ ...current, product_id: undefined, variant_id: undefined }));
  }

  async function submit(event) {
    event.preventDefault();
    setErrors({});
    setMessage(null);

    const quantity = Number(form.quantity);
    const reservedQuantity = Number(form.reserved_quantity);
    if (reservedQuantity > quantity) {
      setErrors({ reserved_quantity: ['Reserved stock cannot exceed the on-hand quantity.'] });
      return;
    }
    if (!selectedProduct) {
      setErrors({ product_id: ['Choose a product to continue.'] });
      return;
    }

    const payload = {
      warehouse_id: Number(form.warehouse_id),
      product_id: Number(selectedProduct.id),
      variant_id: form.variant_id ? Number(form.variant_id) : null,
      quantity,
      reserved_quantity: reservedQuantity,
      reorder_level: Number(form.reorder_level),
    };

    setSaving(true);
    try {
      await createInventory(payload);
      onCreated(selectedProduct.name);
    } catch (error) {
      if (error.response?.status === 422) setErrors(error.response.data.errors || {});
      else if (error.response?.status === 409) {
        setMessage('A stock record already exists for this product and warehouse. Close this form and use Adjust in the inventory list.');
      } else setMessage(errorMessage(error, 'Unable to add stock.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={() => { if (!saving) onClose(); }} title="Add stock" className="max-w-xl">
      <form onSubmit={submit} className="space-y-5">
        {message && <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">{message}</p>}

        <div className="space-y-2">
          {selectedProduct ? (
            <div className="flex items-start justify-between gap-3 rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{selectedProduct.name}</p>
                <p className="mt-1 text-xs text-slate-500">SKU: {selectedProduct.sku || 'Not set'}</p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => { setSelectedProduct(null); setForm((current) => ({ ...current, variant_id: '' })); }}>
                Change
              </Button>
            </div>
          ) : (
            <>
              <Input
                id="inventory-product-search"
                label="Product"
                value={productSearch}
                onChange={(event) => setProductSearch(event.target.value)}
                placeholder="Search by product name or SKU"
                autoComplete="off"
                error={firstError(errors, 'product_id')}
                required
              />
              {productsLoading && <p className="text-xs text-slate-500" role="status">Searching products…</p>}
              {productsError && <p className="text-xs text-rose-600" role="alert">{productsError}</p>}
              {!productsLoading && !productsError && products.length > 0 && (
                <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1" role="listbox" aria-label="Product search results">
                  {products.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      role="option"
                      aria-selected="false"
                      onClick={() => chooseProduct(product)}
                      className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-slate-800">{product.name}</span>
                        <span className="block text-xs text-slate-500">SKU: {product.sku || 'Not set'}</span>
                      </span>
                      <span className="shrink-0 text-xs text-slate-400">Select</span>
                    </button>
                  ))}
                </div>
              )}
              {!productsLoading && !productsError && productSearch.trim().length > 0 && products.length === 0 && (
                <p className="text-xs text-slate-500">No products match that search.</p>
              )}
            </>
          )}
        </div>

        {selectedProduct && (
          <label className="block space-y-1.5 text-sm font-medium text-slate-700">
            <span>Variant <span className="font-normal text-slate-400">(optional)</span></span>
            <select
              value={form.variant_id}
              onChange={(event) => setForm((current) => ({ ...current, variant_id: event.target.value }))}
              disabled={variantsLoading || variants.length === 0}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 disabled:bg-slate-50"
            >
              <option value="">Base product (no variant)</option>
              {variants.map((variant) => (
                <option key={variant.id} value={variant.id}>{variant.name} · {variant.sku}</option>
              ))}
            </select>
            {variantsLoading && <span className="block text-xs font-normal text-slate-400">Loading variants…</span>}
            {variantsError && <span className="block text-xs font-normal text-amber-700" role="status">{variantsError} You can still add stock for the base product.</span>}
            {firstError(errors, 'variant_id') && <span className="block text-xs font-medium text-rose-600" role="alert">{firstError(errors, 'variant_id')}</span>}
          </label>
        )}

        <label className="block space-y-1.5 text-sm font-medium text-slate-700">
          <span>Warehouse</span>
          <select
            value={form.warehouse_id}
            onChange={(event) => setForm((current) => ({ ...current, warehouse_id: event.target.value }))}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
            required
          >
            <option value="">Choose a warehouse</option>
            {activeWarehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>{warehouse.name} ({warehouse.code})</option>
            ))}
          </select>
          {firstError(errors, 'warehouse_id') && <span className="block text-xs font-medium text-rose-600" role="alert">{firstError(errors, 'warehouse_id')}</span>}
          {activeWarehouses.length === 0 && (
            <span className="block text-xs font-normal text-amber-700">
              No active warehouses are available. <Link className="font-semibold underline" to="/admin/warehouses" onClick={onClose}>Add a warehouse</Link> first.
            </span>
          )}
        </label>

        <div className="grid gap-4 sm:grid-cols-3">
          <Input id="new-stock-quantity" label="On hand" type="number" min="0" step="1" value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))} error={firstError(errors, 'quantity')} required />
          <Input id="new-stock-reserved" label="Reserved" type="number" min="0" step="1" value={form.reserved_quantity} onChange={(event) => setForm((current) => ({ ...current, reserved_quantity: event.target.value }))} error={firstError(errors, 'reserved_quantity')} required />
          <Input id="new-stock-reorder" label="Reorder level" type="number" min="0" step="1" value={form.reorder_level} onChange={(event) => setForm((current) => ({ ...current, reorder_level: event.target.value }))} error={firstError(errors, 'reorder_level')} required />
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" loading={saving} disabled={activeWarehouses.length === 0}>Add stock</Button>
        </div>
      </form>
    </Modal>
  );
}
