import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sendOtp as sendOtpApi } from '../../services/authService';
import { useToast } from '../../components/common';
import { Button, Input } from '../../components/common';
import { ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { show } = useToast();
  const [form, setForm] = useState({ email: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      await sendOtpApi({ destination: form.email, purpose: 'password_reset' });
      show({
        title: 'Check your email',
        description: 'If an account exists for that address, a reset code has been sent.',
        type: 'success',
      });
      navigate(`/otp/verify?email=${encodeURIComponent(form.email)}&purpose=password_reset`);
    } catch (err) {
      if (err.response && err.response.status === 422) {
        setErrors(err.response.data.errors || {});
      } else {
        show({
          title: 'Request failed',
          description: err.response?.data?.message || err.message || 'Unable to send reset link.',
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
        Enter your email and we'll send you a six-digit code to reset your password.
      </p>

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
          Send reset code
        </Button>
        <Link
          to="/login"
          className="flex items-center justify-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
      </form>
    </div>
  );
}
