import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { Button, EmptyState, ImageFallback, Input } from '../../components/common';
import { formatMoney, errorMessage, firstError } from '../../utils/format';
import { fetchAllPages } from '../../utils/apiResponse';
import { getAddresses } from '../../services/userService';
import { createOrder } from '../../services/orderService';
import { createAbaPayWayPayment } from '../../services/abaPayWayService';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Truck,
} from 'lucide-react';

const EMPTY_ADDRESS = {
  recipient_name: '',
  recipient_phone: '',
  shipping_address: '',
};

export default function Checkout() {
  const { cart, loading } = useCart();
  const { user } = useAuth();
  const items = cart.items || [];
  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [addressError, setAddressError] = useState('');
  const [addressMode, setAddressMode] = useState('new');
  const [addressId, setAddressId] = useState('');
  const [address, setAddress] = useState({
    ...EMPTY_ADDRESS,
    recipient_name: user?.name || '',
    recipient_phone: user?.phone || '',
  });
  const [addressErrors, setAddressErrors] = useState({});
  const [customerNote, setCustomerNote] = useState('');
  const [activeOrder, setActiveOrder] = useState(null);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchAllPages(getAddresses)
      .then((rows) => {
        if (cancelled) return;
        setAddresses(rows);
        if (rows.length > 0) {
          const selected = rows.find((row) => row.is_default) || rows[0];
          setAddressId(String(selected.id));
          setAddressMode('saved');
        }
      })
      .catch((err) => {
        if (!cancelled) setAddressError(errorMessage(err, 'Saved addresses could not be loaded.'));
      })
      .finally(() => {
        if (!cancelled) setAddressesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const summary = {
    subtotal: cart.subtotal ?? 0,
    discount: cart.discount ?? 0,
    delivery_fee: cart.delivery_fee ?? 0,
    total: cart.total ?? 0,
  };

  function updateAddress(field, value) {
    setAddress((current) => ({ ...current, [field]: value }));
    setAddressErrors((current) => ({ ...current, [field]: undefined }));
  }

  function useCurrentLocation() {
    if (!window.isSecureContext) {
      setLocationError('Location sharing requires HTTPS, except on localhost.');
      return;
    }

    if (!navigator.geolocation) {
      setLocationError('This browser does not support location sharing.');
      return;
    }

    setLocating(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setDeliveryLocation({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
        });
        setLocating(false);
      },
      (error) => {
        const message = error.code === error.PERMISSION_DENIED
          ? 'Allow location access in your browser to share a delivery pin.'
          : error.code === error.TIMEOUT
            ? 'Finding your location took too long. Please try again.'
            : 'Your location is unavailable. Check your device location settings.';
        setLocationError(message);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }

  async function handlePay(e) {
    e.preventDefault();
    if (saving || addressesLoading) return;

    setSaving(true);
    setSubmitError('');
    setAddressErrors({});

    try {
      let order = activeOrder;

      if (!order) {
        const payload = {
          customer_note: customerNote.trim() || null,
          ...(deliveryLocation
            ? {
                delivery_latitude: deliveryLocation.latitude,
                delivery_longitude: deliveryLocation.longitude,
              }
            : {}),
          ...(addressMode === 'saved'
            ? { address_id: Number(addressId) }
            : {
                recipient_name: address.recipient_name.trim(),
                recipient_phone: address.recipient_phone.trim(),
                shipping_address: address.shipping_address.trim(),
              }),
        };
        const response = await createOrder(payload);
        order = response.data.data || response.data;
        setActiveOrder(order);
      }

      const response = await createAbaPayWayPayment(order.id);
      const data = response.data.data || response.data;

      if (!data.checkout_url) {
        throw new Error('The payment service did not return a checkout link.');
      }

      window.location.assign(data.checkout_url);
    } catch (err) {
      const existingPaymentId = err.response?.data?.data?.payment?.id;
      if (existingPaymentId && err.response?.status === 409) {
        window.location.assign(`/payment/result?payment_id=${existingPaymentId}`);
        return;
      }
      if (err.response?.status === 422) {
        setAddressErrors(err.response.data.errors || {});
      }
      setSubmitError(
        activeOrder
          ? `Order #${activeOrder.order_number || activeOrder.id} is saved. ${errorMessage(err, 'ABA checkout could not start. You can retry below.')}`
          : errorMessage(err, 'Unable to place your order. Please try again.')
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="h-24 animate-pulse rounded-2xl bg-slate-200/70" />
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="h-80 animate-pulse rounded-2xl bg-slate-200/70" />
          <div className="h-80 animate-pulse rounded-2xl bg-slate-200/70" />
        </div>
      </div>
    );
  }

  if (items.length === 0 && !activeOrder) {
    return (
      <div className="mx-auto max-w-lg">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Add products to your cart before starting checkout."
          action={
            <Link to="/products" className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700">
              Browse products <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <form onSubmit={handlePay} className="space-y-8">
      <div className="border-b border-slate-200 pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Checkout</p>
        <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-slate-900">Complete your order</h1>
        <p className="mt-1 text-sm text-slate-500">Confirm delivery details, then pay securely through ABA PayWay.</p>
      </div>

      {activeOrder && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900" role="status">
          <Check className="mt-0.5 h-5 w-5 shrink-0" />
          <p>Order #{activeOrder.order_number || activeOrder.id} has been saved. Retry checkout to continue payment.</p>
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          <section className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <MapPin className="h-4 w-4 text-brand-600" /> Delivery address
                </h2>
                <p className="mt-1 text-sm text-slate-500">Choose a saved address or enter delivery details for this order.</p>
              </div>
              <Link to="/addresses" className="shrink-0 text-sm font-semibold text-brand-600 hover:text-brand-700">Manage</Link>
            </div>

            {addressesLoading ? (
              <div className="h-11 animate-pulse rounded-xl bg-slate-100" />
            ) : addresses.length > 0 ? (
              <>
                <label className="block text-sm font-medium text-slate-700" htmlFor="checkout-address">Saved address</label>
                <select
                  id="checkout-address"
                  value={addressMode === 'saved' ? addressId : 'new'}
                  onChange={(event) => {
                    if (event.target.value === 'new') setAddressMode('new');
                    else {
                      setAddressId(event.target.value);
                      setAddressMode('saved');
                    }
                  }}
                  disabled={Boolean(activeOrder)}
                  className="block h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15 disabled:bg-slate-50"
                >
                  {addresses.map((item) => (
                    <option key={item.id} value={String(item.id)}>
                      {item.recipient_name} · {item.phone} · {[item.address_line, item.province].filter(Boolean).join(', ')}
                    </option>
                  ))}
                  <option value="new">Enter a different address</option>
                </select>
              </>
            ) : null}

            {addressError && (
              <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800" role="status">{addressError} You can still enter an address below.</p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800">Delivery GPS pin <span className="font-normal text-slate-400">(optional)</span></p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">Share your current position to help the courier find the delivery point. Your written address is still needed.</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={useCurrentLocation} loading={locating} disabled={Boolean(activeOrder)}>
                <MapPin className="h-4 w-4" /> {deliveryLocation ? 'Update location' : 'Use my location'}
              </Button>
              {deliveryLocation && (
                <div className="w-full rounded-lg bg-white px-3 py-2 text-xs text-emerald-800" role="status">
                  GPS pin added ({deliveryLocation.latitude.toFixed(6)}, {deliveryLocation.longitude.toFixed(6)}). Accuracy about {Math.round(deliveryLocation.accuracy)} m.
                  {!activeOrder && <button type="button" onClick={() => setDeliveryLocation(null)} className="ml-2 font-semibold underline">Remove pin</button>}
                </div>
              )}
              {locationError && <p className="w-full text-xs text-rose-700" role="alert">{locationError}</p>}
            </div>

            {(addressMode === 'new' || addresses.length === 0) && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Recipient name"
                  value={address.recipient_name}
                  onChange={(event) => updateAddress('recipient_name', event.target.value)}
                  error={firstError(addressErrors, 'recipient_name')}
                  required
                  disabled={Boolean(activeOrder)}
                  autoComplete="name"
                />
                <Input
                  label="Phone number"
                  value={address.recipient_phone}
                  onChange={(event) => updateAddress('recipient_phone', event.target.value)}
                  error={firstError(addressErrors, 'recipient_phone')}
                  required
                  disabled={Boolean(activeOrder)}
                  autoComplete="tel"
                />
                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="shipping-address" className="block text-sm font-medium text-slate-700">Full delivery address</label>
                  <textarea
                    id="shipping-address"
                    value={address.shipping_address}
                    onChange={(event) => updateAddress('shipping_address', event.target.value)}
                    disabled={Boolean(activeOrder)}
                    required
                    rows={3}
                    autoComplete="street-address"
                    aria-invalid={Boolean(firstError(addressErrors, 'shipping_address'))}
                    className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15 disabled:bg-slate-50"
                    placeholder="House number, street, district, province"
                  />
                  {firstError(addressErrors, 'shipping_address') && <p className="text-xs font-medium text-rose-600" role="alert">{firstError(addressErrors, 'shipping_address')}</p>}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="customer-note" className="block text-sm font-medium text-slate-700">Delivery note <span className="font-normal text-slate-400">(optional)</span></label>
              <textarea
                id="customer-note"
                value={customerNote}
                onChange={(event) => setCustomerNote(event.target.value)}
                disabled={Boolean(activeOrder)}
                rows={2}
                maxLength={1000}
                className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15 disabled:bg-slate-50"
                placeholder="Anything the courier should know?"
              />
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-base font-bold text-slate-900">Your items</h2>
              <span className="text-xs text-slate-400">{items.length} line item{items.length === 1 ? '' : 's'}</span>
            </div>
            <ul className="divide-y divide-slate-100">
              {items.map((item) => {
                const product = item.product || {};
                const price = item.unit_price ?? product.price ?? 0;
                return (
                  <li key={item.id} className="flex items-center gap-4 p-4 sm:px-5">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                      <ImageFallback src={product.image_url || null} alt={product.name || ''} className="h-full w-full" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link to={product.id ? `/products/${product.id}` : '/products'} className="line-clamp-1 text-sm font-semibold text-slate-900 transition-colors hover:text-brand-600">
                        {product.name || 'Product'}
                      </Link>
                      <p className="text-xs text-slate-400">Qty {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{formatMoney(price * item.quantity)}</p>
                  </li>
                );
              })}
            </ul>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4">
              <Link to="/cart" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900">
                <ArrowLeft className="h-4 w-4" /> Back to cart
              </Link>
              <Link to="/products" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700">
                Continue shopping <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Order summary</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd className="font-medium text-slate-900">{formatMoney(summary.subtotal)}</dd></div>
              {summary.discount > 0 && <div className="flex justify-between"><dt className="text-slate-500">Discount</dt><dd className="font-medium text-emerald-600">-{formatMoney(summary.discount)}</dd></div>}
              <div className="flex justify-between"><dt className="text-slate-500">Delivery fee</dt><dd className="font-medium text-slate-900">{formatMoney(summary.delivery_fee)}</dd></div>
              <div className="flex items-baseline justify-between border-t border-slate-100 pt-3">
                <dt className="font-semibold text-slate-900">Total</dt>
                <dd className="text-2xl font-extrabold tracking-tight text-slate-900">{formatMoney(activeOrder?.total_amount ?? summary.total, activeOrder?.currency || 'USD')}</dd>
              </div>
            </dl>

            {submitError && <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800" role="alert">{submitError}</p>}

            <Button type="submit" size="lg" className="mt-5 w-full" loading={saving} disabled={addressesLoading || (!activeOrder && addressMode === 'saved' && !addressId)}>
              <CreditCard className="h-4 w-4" /> {activeOrder ? 'Retry ABA checkout' : 'Place order and pay'}
            </Button>

            <p className="mt-3 text-center text-xs leading-relaxed text-slate-500">The server confirms your order total before opening ABA PayWay.</p>
            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
              <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand-600" /> Payment details are entered on ABA PayWay</p>
              <p className="flex items-center gap-2"><Truck className="h-4 w-4 text-brand-600" /> Delivery details are saved with your order</p>
              <p className="flex items-center gap-2"><ShoppingCart className="h-4 w-4 text-brand-600" /> Cart prices are recalculated by the server</p>
            </div>
          </div>
        </aside>
      </div>
    </form>
  );
}
