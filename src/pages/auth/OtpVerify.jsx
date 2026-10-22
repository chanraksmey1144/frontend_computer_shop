import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { verifyOtp as verifyOtpApi, sendOtp as sendOtpApi } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common';
import { Button, Input } from '../../components/common';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export default function OtpVerify() {
  const [searchParams] = useSearchParams();
  const defaultDestination = searchParams.get('email') || '';
  const defaultPurpose = searchParams.get('purpose') || 'registration';
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { show } = useToast();
  const [form, setForm] = useState({
    destination: defaultDestination,
    purpose: defaultPurpose,
    otp: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  if (isAuthenticated) return <Navigate to="/" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      await verifyOtpApi(form);
      show({ title: 'Verified', description: 'Your email has been verified.', type: 'success' });
      navigate('/login');
    } catch (err) {
      if (err.response && err.response.status === 422) {
        setErrors(err.response.data.errors || {});
      } else {
        show({
          title: 'Verification failed',
          description: err.message || 'Invalid OTP.',
          type: 'error',
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    setResendLoading(true);
    try {
      await sendOtpApi({ destination: form.destination, purpose: form.purpose });
      setCountdown(60);
      show({ title: 'OTP sent', description: 'A new code has been sent.', type: 'success' });
    } catch (err) {
      show({
        title: 'Resend failed',
        description: err.message || 'Unable to send OTP.',
        type: 'error',
      });
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Verification</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Verify your email</h1>
      <p className="mt-1.5 text-sm text-slate-500">
        Enter the 6-digit code sent to{' '}
        <span className="font-semibold text-slate-700">{form.destination || 'your email'}</span>.
      </p>

      <div className="mt-6 flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-3 text-xs text-brand-800">
        <ShieldCheck className="h-4 w-4 shrink-0" />
        Codes expire after a short time for your security.
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <Input
          label="Verification code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          value={form.otp}
          onChange={(e) => setForm({ ...form, otp: e.target.value.replace(/\D/g, '') })}
          error={errors.otp}
          className="text-center text-lg font-bold tracking-[0.5em]"
          required
        />
        <Button type="submit" size="lg" className="w-full" loading={submitting}>
          Verify code
        </Button>

        <p className="text-center text-sm text-slate-500">
          Didn't receive a code?{' '}
          {countdown > 0 ? (
            <span className="font-semibold text-slate-400">Resend in {countdown}s</span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading || !form.destination}
              className="font-semibold text-brand-600 transition-colors hover:text-brand-700 disabled:opacity-50"
            >
              {resendLoading ? 'Sending…' : 'Resend code'}
            </button>
          )}
        </p>
      </form>

      <Link
        to="/login"
        className="mt-5 flex items-center justify-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back to sign in
      </Link>
    </div>
  );
}
