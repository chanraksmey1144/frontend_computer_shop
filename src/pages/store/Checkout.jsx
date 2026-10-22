import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { createOrder } from '../../services/orderService';
import { getCart } from '../../services/cartService';
import { useToast } from '../../components/common';
import { Button, Input, ImageFallback } from '../../components/common';
import { formatMoney } from '../../utils/format';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  MapPin,
  ShieldCheck,
  User,
  Truck,
  Lock,
} from 'lucide-react';

const STEPS = [
  { key: 'customer', label: 'Customer', icon: User },
  { key: 'delivery', label: 'Delivery', icon: MapPin },
  { key: 'payment', label: 'Payment', icon: CreditCard },
  { key: 'review', label: 'Review', icon: Check },
];

export default function Checkout() {
  const { user, isAuthenticated } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [form, setForm] = useState({
    recipient_name: user?.name || '',
    email: user?.email || '',
    recipient_phone: user?.phone || '',
    address_line: '',
    province: '',
    district: '',
    commune: '',
    village: '',
    notes: '',
    payment_method: 'cash_on_delivery',
    delivery_method: 'standard',
  });

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    getCart()
      .then((res) => {
        if (cancelled) return;
        const data = res.data.data || res.data || {};
        setCart({ items: data.items || [], total: data.total ?? 0 });
      })
      .catch(() => {
        if (!cancelled) setCart({ items: [], total: 0 });
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }
    setLoading(true);
    try {
      const res = await createOrder({ ...form, total_amount: cart.total });
      const created = res.data.data || {};
      show({
        title: 'Order placed',
        description: `Order #${created.order_number || created.id || '—'} has been submitted.`,
        type: 'success',
      });
      navigate(`/my-orders/${created.id || created.order_number}`);
    } catch (err) {
      show({
        title: 'Checkout failed',
        description: err.message || 'Unable to place order.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="border-b border-slate-200 pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Checkout</p>
        <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-slate-900">Complete your order</h1>
      </div>

      {!isAuthenticated && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          <p>Please sign in to complete your purchase.</p>
          <Link
            to="/login"
            className="inline-flex h-9 items-center rounded-lg bg-amber-900 px-4 text-xs font-semibold text-white transition-colors hover:bg-amber-950"
          >
            Sign in
          </Link>
        </div>
      )}

      {/* Stepper */}
      <ol className="flex items-center gap-2 overflow-x-auto pb-1 sm:gap-4">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = i < step;
          const active = i === step;
          return (
            <li key={s.key} className="flex shrink-0 items-center gap-2 sm:gap-3">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold transition-colors ${
                  done
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : active
                      ? 'border-brand-600 bg-white text-brand-600'
                      : 'border-slate-200 bg-white text-slate-400'
                }`}
              >
                {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <span
                className={`text-sm font-semibold ${
                  i <= step ? 'text-slate-900' : 'text-slate-400'
                }`}
              >
                {s.label}
              </span>
              {i < STEPS.length - 1 && <ChevronRight className="h-4 w-4 text-slate-300" />}
            </li>
          );
        })}
      </ol>

      <form onSubmit={handleSubmit} className="grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-slate-900">{STEPS[step].label} information</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {step === 0 && 'Who should we contact about this order?'}
            {step === 1 && 'Where should we deliver your order?'}
            {step === 2 && 'Choose how you would like to pay.'}
            {step === 3 && 'Review your details before placing the order.'}
          </p>

          <div className="mt-6">
            {step === 0 && <CustomerInfo form={form} setForm={setForm} />}
            {step === 1 && <DeliveryInfo form={form} setForm={setForm} />}
            {step === 2 && <PaymentInfo form={form} setForm={setForm} />}
            {step === 3 && <ReviewInfo form={form} cart={cart} />}
          </div>

          <div className="mt-7 flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className={step === 0 ? 'invisible' : ''}
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>

            {step < STEPS.length - 1 ? (
              <Button type="submit" size="lg">
                Continue <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="lg"
                loading={loading}
                disabled={!isAuthenticated || cart.items.length === 0}
              >
                <Lock className="h-4 w-4" /> Place order
              </Button>
            )}
          </div>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-24">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Order summary</h2>
            {cart.items.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">
                Your cart is empty.{' '}
                <Link to="/products" className="font-semibold text-brand-600 hover:text-brand-700">
                  Add products
                </Link>
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {cart.items.map((item) => {
                  const product = item.product || {};
                  const price = item.unit_price ?? product.price ?? 0;
                  return (
                    <li key={item.id} className="flex items-center gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                        <ImageFallback src={product.image_url || null} alt={product.name || ''} className="h-full w-full" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm font-medium text-slate-900">
                          {product.name || 'Product'}
                        </p>
                        <p className="text-xs text-slate-400">Qty {item.quantity}</p>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">
                        {formatMoney(price * item.quantity)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="mt-4 flex items-baseline justify-between border-t border-slate-100 pt-4">
              <span className="font-semibold text-slate-900">Total</span>
              <span className="text-2xl font-extrabold tracking-tight text-slate-900">
                {formatMoney(cart.total)}
              </span>
            </div>

            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
              <p className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-brand-600" /> Secure checkout
              </p>
              <p className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-brand-600" /> Delivery arranged after confirmation
              </p>
            </div>
          </div>
          <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-400">
            Payment is processed by the backend. No payment secrets are stored in the frontend.
          </p>
        </aside>
      </form>
    </div>
  );
}

function CustomerInfo({ form, setForm }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Input
        label="Full name"
        value={form.recipient_name}
        onChange={(e) => setForm({ ...form, recipient_name: e.target.value })}
        required
      />
      <Input
        label="Phone number"
        type="tel"
        value={form.recipient_phone}
        onChange={(e) => setForm({ ...form, recipient_phone: e.target.value })}
        required
      />
      <div className="sm:col-span-2">
        <Input
          label="Email address"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
      </div>
    </div>
  );
}

function DeliveryInfo({ form, setForm }) {
  return (
    <div className="space-y-4">
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

      <fieldset className="pt-2">
        <legend className="mb-2 text-sm font-medium text-slate-700">Delivery method</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            { value: 'standard', label: 'Standard', hint: '2–4 business days' },
            { value: 'express', label: 'Express', hint: 'Same day in Phnom Penh' },
          ].map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${
                form.delivery_method === option.value
                  ? 'border-brand-500 bg-brand-50/60 ring-1 ring-brand-500/20'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="delivery"
                checked={form.delivery_method === option.value}
                onChange={() => setForm({ ...form, delivery_method: option.value })}
                className="h-4 w-4 text-brand-600 focus:ring-brand-500"
              />
              <span>
                <span className="block text-sm font-semibold text-slate-900">{option.label}</span>
                <span className="block text-xs text-slate-500">{option.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

function PaymentInfo({ form, setForm }) {
  const options = [
    { value: 'cash_on_delivery', label: 'Cash on Delivery', hint: 'Pay when you receive your order' },
    { value: 'aba_payway', label: 'ABA PayWay', hint: 'Cambodian mobile payment' },
    { value: 'bakong', label: 'Bakong', hint: 'Cambodian digital payment' },
  ];

  return (
    <div className="space-y-2">
      {options.map((option) => (
        <label
          key={option.value}
          className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors ${
            form.payment_method === option.value
              ? 'border-brand-500 bg-brand-50/60 ring-1 ring-brand-500/20'
              : 'border-slate-200 hover:bg-slate-50'
          }`}
        >
          <input
            type="radio"
            name="payment"
            checked={form.payment_method === option.value}
            onChange={() => setForm({ ...form, payment_method: option.value })}
            className="h-4 w-4 text-brand-600 focus:ring-brand-500"
          />
          <div>
            <div className="text-sm font-semibold text-slate-900">{option.label}</div>
            <div className="text-xs text-slate-500">{option.hint}</div>
          </div>
        </label>
      ))}
    </div>
  );
}

function ReviewInfo({ form, cart }) {
  const address = [form.address_line, form.village, form.commune, form.district, form.province]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <ReviewBlock label="Contact" value={form.recipient_name} sub={form.recipient_phone} />
        <ReviewBlock label="Email" value={form.email} />
        <div className="sm:col-span-2">
          <ReviewBlock label="Delivery address" value={address || '—'} sub={`${form.delivery_method} delivery`} />
        </div>
        <ReviewBlock label="Payment" value={form.payment_method.replace(/_/g, ' ')} />
        <ReviewBlock label="Items" value={`${cart.items.length} item${cart.items.length === 1 ? '' : 's'}`} />
      </div>

      <p className="rounded-xl bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-500">
        Review your details carefully. Placing the order submits it to the backend for processing.
      </p>
    </div>
  );
}

function ReviewBlock({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium capitalize text-slate-900">{value || '—'}</p>
      {sub && <p className="text-xs capitalize text-slate-500">{sub}</p>}
    </div>
  );
}
