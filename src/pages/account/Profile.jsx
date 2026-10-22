import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProfile as getProfileApi, updateProfile as updateProfileApi } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common';
import { Avatar, Badge, Button, Input } from '../../components/common';
import AccountNav from '../../components/account/AccountNav';
import { LogOut, Package, ShieldCheck } from 'lucide-react';

export default function Profile() {
  const { logout } = useAuth();
  const { show } = useToast();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getProfileApi()
      .then((res) => {
        if (cancelled) return;
        const data = res.data.data || res.data;
        setProfile(data);
        setForm({ name: data.name || '', email: data.email || '', phone: data.phone || '' });
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    setSaving(true);
    try {
      await updateProfileApi(form);
      setProfile((prev) => ({ ...prev, ...form }));
      show({ title: 'Profile updated', description: 'Your changes have been saved.', type: 'success' });
    } catch (err) {
      if (err.response && err.response.status === 422) {
        setErrors(err.response.data.errors || {});
      } else {
        show({
          title: 'Update failed',
          description: err.message || 'Unable to update profile.',
          type: 'error',
        });
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-24 animate-pulse rounded-2xl bg-slate-200/70" />
        <div className="h-64 animate-pulse rounded-2xl bg-slate-200/70" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">My account</p>
        <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-slate-900">Profile</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your personal details and preferences.</p>
      </div>

      <AccountNav />

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_1.6fr]">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <Avatar src={profile?.avatar_url || null} alt={profile?.name || 'User'} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-slate-900">{profile?.name || form.name}</p>
              <p className="truncate text-sm text-slate-500">{profile?.email || form.email}</p>
            </div>
          </div>

          <dl className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">Role</dt>
              <dd className="font-semibold capitalize text-slate-900">{profile?.role?.name || 'customer'}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">Status</dt>
              <dd>
                <Badge variant={profile?.status === 'active' ? 'success' : 'neutral'}>
                  {profile?.status || 'unknown'}
                </Badge>
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">Member since</dt>
              <dd className="font-semibold text-slate-900">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}
              </dd>
            </div>
          </dl>

          <div className="mt-6 space-y-2 border-t border-slate-100 pt-5">
            <Link
              to="/my-orders"
              className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              <Package className="h-4 w-4 text-brand-600" /> View my orders
            </Link>
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-brand-600" />
            <h2 className="text-lg font-bold text-slate-900">Account information</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">Keep your contact details up to date.</p>

          <form id="profile-form" onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input
                label="Full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                error={errors.name}
                required
              />
            </div>
            <Input
              label="Email address"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={errors.email}
              required
            />
            <Input
              label="Phone number"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              error={errors.phone}
            />

            <div className="mt-2 flex justify-end sm:col-span-2">
              <Button type="submit" loading={saving}>
                Save changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
