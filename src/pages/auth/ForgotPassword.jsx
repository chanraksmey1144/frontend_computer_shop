import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword as forgotPasswordApi } from '../../services/authService';
import { useToast } from '../../components/common';
import { Button, Input } from '../../components/common';
import { MailCheck, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
  const { show } = useToast();
  const [form, setForm] = useState({ email: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      await forgotPasswordApi({ email: form.email });
      setSent(true);
      show({
        title: 'Reset link sent',
        description: 'Check your email for reset instructions.',
        type: 'success',
      });
    } catch (err) {
      if (err.response && err.response.status === 422) {
        setErrors(err.response.data.errors || {});
      } else {
        show({
          title: 'Request failed',
          description: err.message || 'Unable to send reset link.',
          type: 'error',
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Account recovery</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Forgot password?</h1>
      <p className="mt-1.5 text-sm text-slate-500">
        Enter your email and we'll send you a link to reset it.
      </p>

      {sent ? (
        <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <MailCheck className="h-6 w-6" />
          </span>
          <h2 className="mt-3 text-base font-bold text-emerald-900">Check your inbox</h2>
          <p className="mt-1 text-sm text-emerald-700">
            We sent reset instructions to <span className="font-semibold">{form.email}</span>.
          </p>
          <Link
            to="/login"
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-800"
          >
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            error={errors.email}
            required
          />
          <Button type="submit" size="lg" className="w-full" loading={submitting}>
            Send reset link
          </Button>
          <Link
            to="/login"
            className="flex items-center justify-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </Link>
        </form>
      )}
    </div>
  );
}
