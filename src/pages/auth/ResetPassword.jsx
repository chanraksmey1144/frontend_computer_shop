import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword as resetPasswordApi } from '../../services/authService';
import { useToast } from '../../components/common';
import { Button, Input } from '../../components/common';
import { ArrowLeft, KeyRound } from 'lucide-react';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';
  const navigate = useNavigate();
  const { show } = useToast();
  const [form, setForm] = useState({ email, token, password: '', password_confirmation: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      await resetPasswordApi(form);
      show({ title: 'Password reset', description: 'Your password has been reset.', type: 'success' });
      navigate('/login');
    } catch (err) {
      if (err.response && err.response.status === 422) {
        setErrors(err.response.data.errors || {});
      } else {
        show({
          title: 'Reset failed',
          description: err.message || 'Unable to reset password.',
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
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Set a new password</h1>
      <p className="mt-1.5 text-sm text-slate-500">
        Choose a strong password you haven't used before.
      </p>

      {!token && (
        <div className="mt-6 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <KeyRound className="mt-0.5 h-4 w-4 shrink-0" />
          This reset link is missing a token. Request a new link from the forgot password page.
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {email && (
          <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Resetting password for <span className="font-semibold text-slate-900">{email}</span>
          </div>
        )}
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          error={errors.password}
          required
        />
        <Input
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          value={form.password_confirmation}
          onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
          error={errors.password_confirmation}
          required
        />
        <Button type="submit" size="lg" className="w-full" loading={submitting}>
          Reset password
        </Button>
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
