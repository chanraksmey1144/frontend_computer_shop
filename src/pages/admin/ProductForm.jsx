import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createProduct, getProduct, updateProduct } from '../../services/productService';
import { getCategories } from '../../services/categoryService';
import { getBrands } from '../../services/brandService';
import { useToast } from '../../components/common';
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  PageHeader,
  Skeleton,
} from '../../components/common';
import { AlertTriangle, Package, RefreshCw } from 'lucide-react';
import { errorMessage, slugify } from '../../utils/format';

const INITIAL_FORM = {
  name: '',
  sku: '',
  slug: '',
  category_id: '',
  brand_id: '',
  product_type: 'other',
  status: 'draft',
  price: '',
  compare_at_price: '',
  cost_price: '',
  currency: 'USD',
  warranty_months: '0',
  short_description: '',
  description: '',
  specifications: '',
  track_inventory: true,
  allow_backorder: false,
};

async function getAllPages(request) {
  const records = [];
  let page = 1;
  let lastPage = 1;

  while (page <= lastPage) {
    const response = await request({ page });
    const payload = response.data?.data ?? response.data;

    if (Array.isArray(payload)) return payload;

    records.push(...(payload?.data || []));
    lastPage = payload?.last_page ?? 1;
    page += 1;
  }

  return records;
}

function productToForm(product) {
  return {
    name: product.name || '',
    sku: product.sku || '',
    slug: product.slug || '',
    category_id: product.category_id ? String(product.category_id) : '',
    brand_id: product.brand_id ? String(product.brand_id) : '',
    product_type: product.product_type || 'other',
    status: product.status || 'draft',
    price: product.price ?? '',
    compare_at_price: product.compare_at_price ?? '',
    cost_price: product.cost_price ?? '',
    currency: product.currency || 'USD',
    warranty_months: String(product.warranty_months ?? 0),
    short_description: product.short_description || '',
    description: product.description || '',
    specifications: product.specifications
      ? JSON.stringify(product.specifications, null, 2)
      : '',
    track_inventory: Boolean(product.track_inventory),
    allow_backorder: Boolean(product.allow_backorder),
  };
}

export default function ProductForm({ productId }) {
  const navigate = useNavigate();
  const { show } = useToast();
  const editing = Boolean(productId);
  const [form, setForm] = useState(INITIAL_FORM);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);
  const [retry, setRetry] = useState(0);
  const [loadState, setLoadState] = useState({ key: null, error: null });
  const loadKey = `${productId || 'new'}-${retry}`;
  const loading = loadState.key !== loadKey;
  const loadError = loadState.key === loadKey ? loadState.error : null;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [optionsResult, productResult] = await Promise.allSettled([
        Promise.all([getAllPages(getCategories), getAllPages(getBrands)]),
        editing
          ? getProduct(productId).then((response) => response.data?.data ?? response.data)
          : Promise.resolve(null),
      ]);

      if (cancelled) return;

      if (optionsResult.status === 'rejected') {
        setLoadState({
          key: loadKey,
          error: errorMessage(optionsResult.reason, 'Unable to load categories and brands.'),
        });
        return;
      }

      if (productResult.status === 'rejected') {
        setLoadState({
          key: loadKey,
          error: errorMessage(productResult.reason, 'Unable to load this product.'),
        });
        return;
      }

      setCategories(optionsResult.value[0]);
      setBrands(optionsResult.value[1]);

      if (productResult.value) {
        setForm(productToForm(productResult.value));
      }

      setLoadState({ key: loadKey, error: null });
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [editing, loadKey, productId]);

  function updateField(field, value) {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === 'name' && !slugEdited) next.slug = slugify(value);
      return next;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrors({});
    setSubmitError(null);

    let specifications = null;
    if (form.specifications.trim()) {
      try {
        specifications = JSON.parse(form.specifications);
      } catch {
        setErrors({ specifications: 'Enter valid JSON, for example {"ram":"16GB"}.' });
        return;
      }

      if (!specifications || Array.isArray(specifications) || typeof specifications !== 'object') {
        setErrors({ specifications: 'Specifications must be a JSON object.' });
        return;
      }
    }

    const payload = {
      category_id: Number(form.category_id),
      brand_id: form.brand_id ? Number(form.brand_id) : null,
      name: form.name.trim(),
      sku: form.sku.trim(),
      short_description: form.short_description.trim() || null,
      description: form.description.trim() || null,
      product_type: form.product_type,
      price: Number(form.price),
      compare_at_price: form.compare_at_price === '' ? null : Number(form.compare_at_price),
      cost_price: form.cost_price === '' ? null : Number(form.cost_price),
      currency: form.currency,
      warranty_months: Number(form.warranty_months || 0),
      specifications,
      track_inventory: form.track_inventory,
      allow_backorder: form.allow_backorder,
      status: form.status,
    };

    if (form.slug.trim()) payload.slug = form.slug.trim();
    else if (!editing) payload.slug = null;

    setSubmitting(true);

    try {
      if (editing) await updateProduct(productId, payload);
      else await createProduct(payload);

      show({
        title: editing ? 'Product updated' : 'Product created',
        description: `${form.name.trim()} is saved to the catalog.`,
        type: 'success',
      });
      navigate('/admin/products');
    } catch (error) {
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
      } else {
        setSubmitError(errorMessage(error, 'Unable to save this product.'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-[32rem] w-full" />
      </div>
    );
  }

  if (loadError) {
    return (
      <EmptyState
        icon={AlertTriangle}
        tone="warning"
        title={editing ? 'Unable to open this product' : 'Catalog options unavailable'}
        description={loadError}
        action={(
          <Button variant="outline" onClick={() => setRetry((value) => value + 1)}>
            <RefreshCw className="h-4 w-4" /> Try again
          </Button>
        )}
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        eyebrow="Catalog management"
        title={editing ? 'Edit product' : 'Add product'}
        description={editing ? 'Update the product details shown in your catalog.' : 'Add a product to your catalog with clear pricing and classification.'}
        actions={(
          <Link
            to="/admin/products"
            className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            Back to products
          </Link>
        )}
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        {submitError && (
          <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{submitError}</p>
          </div>
        )}

        {categories.length === 0 && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <Package className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Create a category before adding products. A category is required by the catalog API.</p>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Product details</CardTitle>
            <p className="text-sm text-slate-500">Use a recognizable name and a unique SKU for warehouse and order workflows.</p>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <Input
              id="product-name"
              label="Product name"
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              error={errors.name?.[0]}
              maxLength={200}
              required
            />
            <Input
              id="product-sku"
              label="SKU"
              value={form.sku}
              onChange={(event) => updateField('sku', event.target.value)}
              error={errors.sku?.[0]}
              maxLength={100}
              hint="Keep this code unique across your catalog."
              required
            />
            <Input
              id="product-slug"
              label="URL slug"
              value={form.slug}
              onChange={(event) => {
                setSlugEdited(true);
                updateField('slug', event.target.value);
              }}
              error={errors.slug?.[0]}
              maxLength={220}
              hint="Suggested from the product name. Leave blank to generate it automatically."
            />
            <SelectField
              id="product-category"
              label="Category"
              value={form.category_id}
              onChange={(value) => updateField('category_id', value)}
              options={categories.map((category) => ({ value: category.id, label: category.name }))}
              placeholder="Choose a category"
              error={errors.category_id?.[0]}
              required
            />
            <SelectField
              id="product-brand"
              label="Brand"
              value={form.brand_id}
              onChange={(value) => updateField('brand_id', value)}
              options={brands.map((brand) => ({ value: brand.id, label: brand.name }))}
              placeholder="No brand"
              error={errors.brand_id?.[0]}
            />
            <SelectField
              id="product-type"
              label="Product type"
              value={form.product_type}
              onChange={(value) => updateField('product_type', value)}
              options={[
                { value: 'laptop', label: 'Laptop' },
                { value: 'desktop', label: 'Desktop' },
                { value: 'monitor', label: 'Monitor' },
                { value: 'component', label: 'Component' },
                { value: 'accessory', label: 'Accessory' },
                { value: 'other', label: 'Other' },
              ]}
            />
            <SelectField
              id="product-status"
              label="Status"
              value={form.status}
              onChange={(value) => updateField('status', value)}
              options={[
                { value: 'draft', label: 'Draft' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
              error={errors.status?.[0]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
            <p className="text-sm text-slate-500">Optional comparison and cost prices can be added now or later.</p>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              id="product-price"
              label="Selling price"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(event) => updateField('price', event.target.value)}
              error={errors.price?.[0]}
              required
            />
            <Input
              id="product-compare-price"
              label="Compare at"
              type="number"
              min="0"
              step="0.01"
              value={form.compare_at_price}
              onChange={(event) => updateField('compare_at_price', event.target.value)}
              error={errors.compare_at_price?.[0]}
            />
            <Input
              id="product-cost-price"
              label="Unit cost"
              type="number"
              min="0"
              step="0.01"
              value={form.cost_price}
              onChange={(event) => updateField('cost_price', event.target.value)}
              error={errors.cost_price?.[0]}
            />
            <SelectField
              id="product-currency"
              label="Currency"
              value={form.currency}
              onChange={(value) => updateField('currency', value)}
              options={[
                { value: 'USD', label: 'USD' },
                { value: 'KHR', label: 'KHR' },
              ]}
              error={errors.currency?.[0]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Specifications and warranty</CardTitle>
            <p className="text-sm text-slate-500">Add structured specifications so shoppers can compare products.</p>
          </CardHeader>
          <CardContent className="space-y-5">
            <Input
              id="product-warranty"
              label="Warranty (months)"
              type="number"
              min="0"
              max="65535"
              value={form.warranty_months}
              onChange={(event) => updateField('warranty_months', event.target.value)}
              error={errors.warranty_months?.[0]}
            />
            <TextAreaField
              id="product-specifications"
              label="Specifications (JSON object)"
              value={form.specifications}
              onChange={(value) => updateField('specifications', value)}
              error={errors.specifications?.[0]}
              placeholder={'{"ram":"16GB","storage":"512GB SSD"}'}
              rows={5}
              hint="Use simple key/value pairs. Leave empty if there are no specifications yet."
            />
            <TextAreaField
              id="product-short-description"
              label="Short description"
              value={form.short_description}
              onChange={(value) => updateField('short_description', value)}
              error={errors.short_description?.[0]}
              maxLength={500}
              rows={2}
            />
            <TextAreaField
              id="product-description"
              label="Full description"
              value={form.description}
              onChange={(value) => updateField('description', value)}
              error={errors.description?.[0]}
              rows={5}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory behavior</CardTitle>
            <p className="text-sm text-slate-500">These settings control whether stock is tracked and backorders are allowed.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <ToggleField
              id="track-inventory"
              label="Track inventory for this product"
              hint="Turn this off for services or products that do not have a stock count."
              checked={form.track_inventory}
              onChange={(checked) => updateField('track_inventory', checked)}
            />
            <ToggleField
              id="allow-backorder"
              label="Allow customers to order when out of stock"
              hint="Enable only if you can fulfill orders after the item sells out."
              checked={form.allow_backorder}
              onChange={(checked) => updateField('allow_backorder', checked)}
            />
          </CardContent>
          <CardFooter className="justify-end border-t border-slate-100 pt-4">
            <Link
              to="/admin/products"
              className="inline-flex h-10 items-center rounded-xl px-4 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100"
            >
              Cancel
            </Link>
            <Button type="submit" loading={submitting} disabled={categories.length === 0}>
              {editing ? 'Save changes' : 'Create product'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
  required = false,
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}{required && <span className="ml-1 text-rose-500" aria-hidden="true">*</span>}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        aria-invalid={error ? 'true' : 'false'}
        className={`h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 shadow-sm outline-none transition-colors focus:ring-4 ${error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15' : 'border-slate-200 hover:border-slate-300 focus:border-brand-500 focus:ring-brand-500/15'}`}
      >
        <option value="">{placeholder || 'Select an option'}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      {error && <p className="text-xs font-medium text-rose-600" role="alert">{error}</p>}
    </div>
  );
}

function TextAreaField({ id, label, value, onChange, error, hint, rows = 4, ...props }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">{label}</label>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        aria-invalid={error ? 'true' : 'false'}
        className={`w-full rounded-xl border bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:ring-4 ${error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15' : 'border-slate-200 hover:border-slate-300 focus:border-brand-500 focus:ring-brand-500/15'}`}
        {...props}
      />
      {error ? (
        <p className="text-xs font-medium text-rose-600" role="alert">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}

function ToggleField({ id, label, hint, checked, onChange }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 transition-colors hover:border-brand-200 hover:bg-brand-50/30">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
      />
      <span>
        <span className="block text-sm font-medium text-slate-800">{label}</span>
        <span className="mt-1 block text-xs text-slate-500">{hint}</span>
      </span>
    </label>
  );
}
