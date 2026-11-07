import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button, EmptyState } from '../../components/common';
import { createAbaPayWayPayment, getAbaPayWayPaymentStatus } from '../../services/abaPayWayService';
import { errorMessage, formatMoney } from '../../utils/format';
import { CheckCircle2, CircleDashed, CreditCard, PackageSearch, XCircle } from 'lucide-react';

export default function PaymentResult() {
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('payment_id');
  const wasCancelled = searchParams.get('result') === 'cancelled';
  const [payment, setPayment] = useState(null);
  const [gatewayStatus, setGatewayStatus] = useState('');
  const [loading, setLoading] = useState(Boolean(paymentId));
  const [checking, setChecking] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState('');

  const checkStatus = useCallback(async () => {
    if (!paymentId) return null;
    setChecking(true);
    setError('');
    try {
      const response = await getAbaPayWayPaymentStatus(paymentId);
      const result = response.data.data || response.data;
      setPayment(result.payment || null);
      setGatewayStatus(result.gateway_status || '');
      return result.payment || null;
    } catch (err) {
      setError(errorMessage(err, 'Payment status could not be checked.'));
      return null;
    } finally {
      setChecking(false);
      setLoading(false);
    }
  }, [paymentId]);

  useEffect(() => {
    let cancelled = false;
    let timer;
    let attempts = 0;

    async function poll() {
      if (cancelled || !paymentId) return;
      try {
        const response = await getAbaPayWayPaymentStatus(paymentId);
        const result = response.data.data || response.data;
        const nextPayment = result.payment || null;
        if (cancelled) return;
        setPayment(nextPayment);
        setGatewayStatus(result.gateway_status || '');
        setError('');
        setLoading(false);
        attempts += 1;
        if (['pending', 'processing'].includes(nextPayment?.status) && attempts < 5) {
          timer = window.setTimeout(poll, 3000);
        }
      } catch (err) {
        if (!cancelled) {
          setError(errorMessage(err, 'Payment status could not be checked.'));
          setLoading(false);
        }
      }
    }

    poll();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [paymentId]);

  async function retryPayment() {
    if (!payment?.order_id || retrying) return;
    setRetrying(true);
    setError('');
    try {
      const response = await createAbaPayWayPayment(payment.order_id);
      const result = response.data.data || response.data;
      if (!result.checkout_url) throw new Error('The payment service did not return a checkout link.');
      window.location.assign(result.checkout_url);
    } catch (err) {
      setError(errorMessage(err, 'Could not restart ABA PayWay checkout.'));
    } finally {
      setRetrying(false);
    }
  }

  if (!paymentId) {
    return (
      <div className="mx-auto max-w-lg">
        <EmptyState
          icon={PackageSearch}
          title="Payment reference missing"
          description="Open this page from your ABA PayWay checkout return to check an order payment."
          action={<><Button variant="outline" onClick={checkStatus} loading={checking}>Try again</Button><Link to="/my-orders" className="inline-flex h-10 items-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white">View my orders</Link></>}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="h-28 animate-pulse rounded-2xl bg-slate-200/70" />
        <div className="h-48 animate-pulse rounded-2xl bg-slate-200/70" />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="mx-auto max-w-lg">
        <EmptyState
          icon={PackageSearch}
          title="Payment status unavailable"
          description={error || 'This payment could not be found for your account.'}
          action={<Link to="/my-orders" className="inline-flex h-10 items-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white">View my orders</Link>}
        />
      </div>
    );
  }

  const paid = payment.status === 'paid';
  const declined = ['failed', 'cancelled'].includes(payment.status);
  const Icon = paid ? CheckCircle2 : declined ? XCircle : CircleDashed;
  const tone = paid
    ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
    : declined
      ? 'border-rose-200 bg-rose-50 text-rose-900'
      : 'border-amber-200 bg-amber-50 text-amber-950';

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <section className={`rounded-2xl border p-6 sm:p-8 ${tone}`} aria-live="polite">
        <Icon className="h-10 w-10" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          {paid ? 'Payment confirmed' : declined ? 'Payment was not completed' : wasCancelled ? 'Checkout closed' : 'Payment is processing'}
        </h1>
        <p className="mt-2 text-sm leading-relaxed opacity-80">
          {paid
            ? 'ABA PayWay confirmed your payment. Your order is now marked as paid.'
            : declined
              ? 'The payment provider did not approve this transaction. You can try again securely.'
              : 'We are checking the payment directly with ABA PayWay. This page will update when the provider confirms the result.'}
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-slate-900">Payment details</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4"><dt className="text-slate-500">Transaction</dt><dd className="text-right font-medium text-slate-900">{payment.transaction_id}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-slate-500">Amount</dt><dd className="font-semibold text-slate-900">{formatMoney(payment.amount, payment.currency)}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-slate-500">Status</dt><dd className="font-medium capitalize text-slate-900">{payment.status}</dd></div>
          {gatewayStatus && <div className="flex justify-between gap-4"><dt className="text-slate-500">ABA status</dt><dd className="font-medium text-slate-900">{gatewayStatus}</dd></div>}
        </dl>
        {error && <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800" role="alert">{error}</p>}
        <div className="mt-5 flex flex-wrap gap-2">
          {declined && <Button onClick={retryPayment} loading={retrying}><CreditCard className="h-4 w-4" /> Retry ABA payment</Button>}
          {!paid && !declined && <Button variant="outline" onClick={checkStatus} loading={checking}>Check again</Button>}
          <Link to={`/my-orders/${payment.order_id}`} className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">View order</Link>
          <Link to="/my-orders" className="inline-flex h-10 items-center rounded-xl px-3 text-sm font-semibold text-slate-600 hover:text-slate-900">All orders</Link>
        </div>
      </section>
    </div>
  );
}
