import { useEffect, useState } from 'react';
import {
  createCoupon,
  deleteCoupon,
  getCoupons,
  updateCoupon,
} from '../../services/couponService';
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
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  TicketPercent,
  Trash2,
  X,
} from 'lucide-react';
import { fetchAllPages } from '../../utils/apiResponse';
import { errorMessage, firstError, formatDate, formatMoney, formatNumber } from '../../utils/format';

const PAGE_SIZE = 10;

const EMPTY_FORM = {
  code: '',
  description: '',
  discount_type: 'percentage',
  discount_value: '',
  minimum_order_amount: '',
  maximum_discount_amount: '',
  usage_limit: '',
  starts_at: '',
  expires_at: '',
  status: 'active',
};

function toDateTimeInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (number) => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function isExpired(coupon) {
  return Boolean(coupon.expires_at) && new Date(coupon.expires_at).getTime() < Date.now();
}

function couponMatches(coupon, search, status) {
  const term = search.trim().toLowerCase();
  const matchesSearch = !term
    || String(coupon.code || '').toLowerCase().includes(term)
    || String(coupon.description || '').toLowerCase().includes(term);

  let matchesStatus = true;
  if (status === 'active') matchesStatus = coupon.status === 'active' && !isExpired(coupon);
  else if (status === 'inactive') matchesStatus = coupon.status === 'inactive' && !isExpired(coupon);
  else if (status === 'expired') matchesStatus = isExpired(coupon);

  return matchesSearch && matchesStatus;
}

export default function AdminCoupons() {
  const { show } = useToast();
  const [coupons, setCoupons] = useState([]);
  const [retry, setRetry] = useState(0);
  const [requestState, setRequestState] = useState({ key: null, error: null });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [formMessage, setFormMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [deletingCoupon, setDeletingCoupon] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const requestKey = String(retry);
  const loading = requestState.key !== requestKey;
  const loadError = requestState.key === requestKey ? requestState.error : null;

  useEffect(() => {
    let cancelled = false;

    fetchAllPages(getCoupons)
      .then((rows) => {
        if (cancelled) return;
        setCoupons(rows);
        setRequestState({ key: requestKey, error: null });
      })
      .catch((error) => {
        if (!cancelled) {
          setRequestState({ key: requestKey, error: errorMessage(error, 'Unable to load coupons.') });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [requestKey]);

  const filteredCoupons = coupons.filter((coupon) => couponMatches(coupon, search, statusFilter));
  const totalPages = Math.max(1, Math.ceil(filteredCoupons.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const visibleCoupons = filteredCoupons.slice(startIndex, startIndex + PAGE_SIZE);
  const hasFilters = Boolean(search.trim()) || statusFilter !== 'all';
  const activeCount = coupons.filter((coupon) => coupon.status === 'active' && !isExpired(coupon)).length;
  const expiredCount = coupons.filter(isExpired).length;
  const redemptionCount = coupons.reduce((total, coupon) => total + Number(coupon.usage_count || 0), 0);

  function clearFilters() {
    setSearch('');
    setStatusFilter('all');
    setPage(1);
  }

  function openCreate() {
    setEditingCoupon(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setFormMessage(null);
    setCouponModalOpen(true);
  }

  function openEdit(coupon) {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code || '',
      description: coupon.description || '',
      discount_type: coupon.discount_type || 'percentage',
      discount_value: coupon.discount_value ?? '',
      minimum_order_amount: coupon.minimum_order_amount ?? '',
      maximum_discount_amount: coupon.maximum_discount_amount ?? '',
      usage_limit: coupon.usage_limit ?? '',
      starts_at: toDateTimeInput(coupon.starts_at),
      expires_at: toDateTimeInput(coupon.expires_at),
      status: coupon.status || 'active',
    });
    setFormErrors({});
    setFormMessage(null);
    setCouponModalOpen(true);
  }

  async function copyCode(code) {
    try {
      await navigator.clipboard.writeText(code);
      show({ title: 'Code copied', description: `${code} is on your clipboard.`, type: 'success' });
    } catch {
      show({ title: 'Copy failed', description: 'Select the code and copy it manually.', type: 'warning' });
    }
  }

  async function toggleStatus(coupon) {
    const nextStatus = coupon.status === 'active' ? 'inactive' : 'active';
    setTogglingId(coupon.id);
    try {
      await updateCoupon(coupon.id, { status: nextStatus });
      setRetry((value) => value + 1);
      show({
        title: nextStatus === 'active' ? 'Coupon activated' : 'Coupon paused',
        description: `${coupon.code} is now ${nextStatus}.`,
        type: 'success',
      });
    } catch (error) {
      show({
        title: 'Unable to update coupon',
        description: errorMessage(error, 'The coupon status could not be changed.'),
        type: 'error',
      });
    } finally {
      setTogglingId(null);
    }
  }

  async function saveCoupon(event) {
    event.preventDefault();
    setFormErrors({});
    setFormMessage(null);

    const discountValue = Number(form.discount_value);
    if (form.discount_type === 'percentage' && discountValue > 100) {
      setFormErrors({ discount_value: ['Percentage discount cannot exceed 100.'] });
      return;
    }
    if (form.starts_at && form.expires_at && new Date(form.expires_at) <= new Date(form.starts_at)) {
      setFormErrors({ expires_at: ['Expiry must be after the start date.'] });
      return;
    }

    const payload = {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim() || null,
      discount_type: form.discount_type,
      discount_value: discountValue,
      minimum_order_amount: form.minimum_order_amount === '' ? 0 : Number(form.minimum_order_amount),
      maximum_discount_amount: form.maximum_discount_amount === '' ? null : Number(form.maximum_discount_amount),
      usage_limit: form.usage_limit === '' ? null : Number(form.usage_limit),
      starts_at: form.starts_at || null,
      expires_at: form.expires_at || null,
      status: form.status,
    };

    setSaving(true);
    try {
      if (editingCoupon) await updateCoupon(editingCoupon.id, payload);
      else await createCoupon(payload);
      setCouponModalOpen(false);
      setEditingCoupon(null);
      setRetry((value) => value + 1);
      show({
        title: editingCoupon ? 'Coupon updated' : 'Coupon created',
        description: `${payload.code} is ready to use.`,
        type: 'success',
      });
    } catch (error) {
      if (error.response?.status === 422) setFormErrors(error.response.data.errors || {});
      else setFormMessage(errorMessage(error, 'Unable to save this coupon.'));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deletingCoupon) return;
    setDeleting(true);
    try {
      await deleteCoupon(deletingCoupon.id);
      show({ title: 'Coupon deleted', description: `${deletingCoupon.code} was removed.`, type: 'success' });
      setDeletingCoupon(null);
      if (visibleCoupons.length === 1 && currentPage > 1) setPage(currentPage - 1);
      else setRetry((value) => value + 1);
    } catch (error) {
      show({
        title: 'Unable to delete coupon',
        description: errorMessage(error, 'This coupon could not be deleted.'),
        type: 'error',
      });
      setDeletingCoupon(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Sales"
        title="Coupons"
        description="Create discount codes, pause campaigns, and keep an eye on redemptions."
        actions={(
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add coupon
          </Button>
        )}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total codes" value={coupons.length} loading={loading} />
        <StatCard label="Active" value={activeCount} tone="emerald" loading={loading} />
        <StatCard label="Expired" value={expiredCount} tone="amber" loading={loading} />
        <StatCard label="Redemptions" value={redemptionCount} tone="brand" loading={loading} />
      </div>

      {loadError ? (
        <EmptyState
          icon={TicketPercent}
          tone="warning"
          title="Coupons unavailable"
          description={loadError}
          action={(
            <Button variant="outline" onClick={() => setRetry((value) => value + 1)}>
              <RefreshCw className="h-4 w-4" /> Try again
            </Button>
          )}
        />
      ) : (
        <Card padding={false}>
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Discount codes</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {loading
                  ? 'Updating coupons…'
                  : hasFilters
                    ? `${formatNumber(filteredCoupons.length)} of ${formatNumber(coupons.length)} coupons match`
                    : `${formatNumber(coupons.length)} coupons`}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <Input
                  id="coupon-search"
                  type="search"
                  aria-label="Search coupons"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search code or description"
                  className="pl-9"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setPage(1);
                }}
                aria-label="Filter coupons by status"
                className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 shadow-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Paused</option>
                <option value="expired">Expired</option>
              </select>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-11">
                  <X className="h-4 w-4" /> Clear
                </Button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-14 w-full" />)}
            </div>
          ) : coupons.length === 0 ? (
            <div className="px-5 py-12">
              <EmptyState
                icon={TicketPercent}
                title="No coupons yet"
                description="Create your first discount code to offer savings at checkout."
                action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Add coupon</Button>}
              />
            </div>
          ) : visibleCoupons.length === 0 ? (
            <div className="px-5 py-12">
              <EmptyState
                icon={Search}
                title="No coupons match"
                description="Try a different code, description, or status filter."
                action={<Button variant="outline" onClick={clearFilters}>Clear filters</Button>}
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-3 font-semibold">Code</th>
                      <th className="px-5 py-3 font-semibold">Discount</th>
                      <th className="px-5 py-3 font-semibold">Minimum</th>
                      <th className="px-5 py-3 font-semibold">Usage</th>
                      <th className="px-5 py-3 font-semibold">Window</th>
                      <th className="px-5 py-3 text-center font-semibold">Status</th>
                      <th className="px-5 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleCoupons.map((coupon) => {
                      const expired = isExpired(coupon);
                      const toggling = togglingId === coupon.id;
                      return (
                        <tr key={coupon.id} className="transition-colors hover:bg-slate-50/70">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5">
                              <span className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs font-bold tracking-wide text-slate-800">
                                {coupon.code}
                              </span>
                              <button
                                type="button"
                                onClick={() => copyCode(coupon.code)}
                                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                                aria-label={`Copy ${coupon.code}`}
                                title="Copy code"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                              {coupon.description || 'No description'}
                            </p>
                          </td>
                          <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                            {coupon.discount_type === 'percentage'
                              ? `${Number(coupon.discount_value)}%`
                              : formatMoney(coupon.discount_value)}
                            {coupon.discount_type === 'percentage' && Number(coupon.maximum_discount_amount) > 0 && (
                              <span className="mt-0.5 block text-xs font-normal text-slate-500">
                                Max {formatMoney(coupon.maximum_discount_amount)}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-600">
                            {Number(coupon.minimum_order_amount) > 0
                              ? formatMoney(coupon.minimum_order_amount)
                              : '—'}
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-600">
                            {coupon.usage_count} / {coupon.usage_limit ?? '∞'}
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-600">
                            {coupon.starts_at && <span className="block">From {formatDate(coupon.starts_at)}</span>}
                            {coupon.expires_at && <span className="block">Until {formatDate(coupon.expires_at)}</span>}
                            {!coupon.starts_at && !coupon.expires_at && 'Always available'}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <Badge variant={expired ? 'warning' : coupon.status === 'active' ? 'success' : 'neutral'}>
                              {expired ? 'Expired' : coupon.status}
                            </Badge>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="inline-flex items-center gap-1">
                              <Button variant="ghost" size="sm" onClick={() => openEdit(coupon)}>Edit</Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleStatus(coupon)}
                                loading={toggling}
                                disabled={expired}
                                title={expired ? 'Expired coupons cannot be activated' : undefined}
                              >
                                {coupon.status === 'active' ? (
                                  <><Pause className="h-3.5 w-3.5" /> Pause</>
                                ) : (
                                  <><Play className="h-3.5 w-3.5" /> Activate</>
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                aria-label={`Delete ${coupon.code}`}
                                onClick={() => setDeletingCoupon(coupon)}
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

              <div className="flex flex-col gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  Showing {formatNumber(startIndex + 1)}–{formatNumber(Math.min(startIndex + PAGE_SIZE, filteredCoupons.length))} of {formatNumber(filteredCoupons.length)}
                </p>
                {totalPages > 1 && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>
                      <ChevronLeft className="h-4 w-4" /> Previous
                    </Button>
                    <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>
                      Next <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </Card>
      )}

      <Modal
        isOpen={couponModalOpen}
        onClose={() => { if (!saving) setCouponModalOpen(false); }}
        title={editingCoupon ? 'Edit coupon' : 'Add coupon'}
        className="max-w-2xl"
      >
        <form onSubmit={saveCoupon} className="space-y-5">
          {formMessage && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
              {formMessage}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="coupon-code"
              label="Coupon code"
              value={form.code}
              onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))}
              error={firstError(formErrors, 'code')}
              hint="Letters, numbers, and dashes. Codes are saved uppercase."
              maxLength={80}
              required
            />
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              <span>Status</span>
              <select
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
              >
                <option value="active">Active</option>
                <option value="inactive">Paused</option>
              </select>
              {firstError(formErrors, 'status') && (
                <p className="text-xs text-rose-600" role="alert">{firstError(formErrors, 'status')}</p>
              )}
            </label>
          </div>

          <Input
            id="coupon-description"
            label="Description"
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            error={firstError(formErrors, 'description')}
            maxLength={255}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              <span>Discount type</span>
              <select
                value={form.discount_type}
                onChange={(event) => setForm((current) => ({ ...current, discount_type: event.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed amount</option>
              </select>
            </label>
            <Input
              id="coupon-value"
              label={form.discount_type === 'percentage' ? 'Discount (%)' : 'Discount amount'}
              type="number"
              min="0.01"
              step="0.01"
              value={form.discount_value}
              onChange={(event) => setForm((current) => ({ ...current, discount_value: event.target.value }))}
              error={firstError(formErrors, 'discount_value')}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="coupon-minimum"
              label="Minimum order"
              type="number"
              min="0"
              step="0.01"
              value={form.minimum_order_amount}
              onChange={(event) => setForm((current) => ({ ...current, minimum_order_amount: event.target.value }))}
              error={firstError(formErrors, 'minimum_order_amount')}
              hint="Leave empty for no minimum."
            />
            <Input
              id="coupon-maximum"
              label="Maximum discount"
              type="number"
              min="0.01"
              step="0.01"
              value={form.maximum_discount_amount}
              onChange={(event) => setForm((current) => ({ ...current, maximum_discount_amount: event.target.value }))}
              error={firstError(formErrors, 'maximum_discount_amount')}
              hint="Optional cap for percentage coupons."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              id="coupon-usage-limit"
              label="Usage limit"
              type="number"
              min="1"
              step="1"
              value={form.usage_limit}
              onChange={(event) => setForm((current) => ({ ...current, usage_limit: event.target.value }))}
              error={firstError(formErrors, 'usage_limit')}
              hint="Empty means unlimited."
            />
            <Input
              id="coupon-starts"
              label="Starts at"
              type="datetime-local"
              value={form.starts_at}
              onChange={(event) => setForm((current) => ({ ...current, starts_at: event.target.value }))}
              error={firstError(formErrors, 'starts_at')}
            />
            <Input
              id="coupon-expires"
              label="Expires at"
              type="datetime-local"
              value={form.expires_at}
              onChange={(event) => setForm((current) => ({ ...current, expires_at: event.target.value }))}
              error={firstError(formErrors, 'expires_at')}
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button type="button" variant="outline" onClick={() => setCouponModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editingCoupon ? 'Save changes' : 'Create coupon'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deletingCoupon)}
        onConfirm={confirmDelete}
        onCancel={() => { if (!deleting) setDeletingCoupon(null); }}
        title="Delete coupon?"
        description={deletingCoupon ? `${deletingCoupon.code} will no longer be redeemable. This cannot be undone.` : ''}
        confirmLabel="Delete coupon"
        loading={deleting}
      />
    </div>
  );
}

function StatCard({ label, value, tone = 'slate', loading }) {
  const tones = {
    slate: 'text-slate-900',
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
    brand: 'text-brand-600',
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      {loading ? (
        <div className="mt-2 h-8 w-16 animate-pulse rounded-lg bg-slate-100" />
      ) : (
        <p className={`mt-1 text-2xl font-extrabold tracking-tight ${tones[tone] || tones.slate}`}>
          {formatNumber(value)}
        </p>
      )}
    </div>
  );
}
