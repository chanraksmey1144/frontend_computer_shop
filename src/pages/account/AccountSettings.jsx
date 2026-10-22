import { useState } from 'react';
import { updateProfile as updateProfileApi, changePassword as changePasswordApi } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common';
import { Button, Input } from '../../components/common';
import AccountNav from '../../components/account/AccountNav';
import { User, KeyRound } from 'lucide-react';

export default function AccountSettings() {
  const { user } = useAuth();
  const { show } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });
  const [errors, setErrors] = useState({ profile: {}, password: {} });
  const [saving, setSaving] = useState({ profile: false, password: false });

  async function saveProfile(e) {
    e.preventDefault();
    setErrors((prev) => ({ ...prev, profile: {} }));
    setSaving((prev) => ({ ...prev, profile: true }));
    try {
      await updateProfileApi(profileForm);
      show({ title: 'Profile updated', description: 'Your changes have been saved.', type: 'success' });
    } catch (err) {
      if (err.response && err.response.status === 422) {
        setErrors((prev) => ({ ...prev, profile: err.response.data.errors || {} }));
      } else {
        show({
          title: 'Update failed',
          description: err.message || 'Unable to update profile.',
          type: 'error',
        });
      }
    } finally {
      setSaving((prev) => ({ ...prev, profile: false }));
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    setErrors((prev) => ({ ...prev, password: {} }));
    setSaving((prev) => ({ ...prev, password: true }));
    try {
      await changePasswordApi(passwordForm);
      setPasswordForm({ current_password: '', password: '', password_confirmation: '' });
      show({ title: 'Password changed', description: 'Use your new password next time you sign in.', type: 'success' });
    } catch (err) {
      if (err.response && err.response.status === 422) {
        setErrors((prev) => ({ ...prev, password: err.response.data.errors || {} }));
      } else {
        show({
          title: 'Password change failed',
          description: err.message || 'Unable to change password.',
          type: 'error',
        });
      }
    } finally {
      setSaving((prev) => ({ ...prev, password: false }));
    }
  }

  const tabs = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'password', label: 'Password', icon: KeyRound },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">My account</p>
        <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Update your profile and security preferences.</p>
      </div>

      <AccountNav />

      <div className="max-w-2xl rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                activeTab === key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'profile' && (
          <form onSubmit={saveProfile} className="mt-6 space-y-4">
            <Input
              label="Full name"
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              error={errors.profile.name}
              required
            />
            <Input
              label="Email address"
              type="email"
              value={profileForm.email}
              onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
              error={errors.profile.email}
              required
            />
            <Input
              label="Phone number"
              value={profileForm.phone}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              error={errors.profile.phone}
            />
            <div className="flex justify-end border-t border-slate-100 pt-4">
              <Button type="submit" loading={saving.profile}>
                Save changes
              </Button>
            </div>
          </form>
        )}

        {activeTab === 'password' && (
          <form onSubmit={changePassword} className="mt-6 space-y-4">
            <Input
              label="Current password"
              type="password"
              autoComplete="current-password"
              value={passwordForm.current_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
              error={errors.password.current_password}
              required
            />
            <Input
              label="New password"
              type="password"
              autoComplete="new-password"
              value={passwordForm.password}
              onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
              error={errors.password.password}
              required
            />
            <Input
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              value={passwordForm.password_confirmation}
              onChange={(e) => setPasswordForm({ ...passwordForm, password_confirmation: e.target.value })}
              error={errors.password.password_confirmation}
              required
            />
            <div className="flex justify-end border-t border-slate-100 pt-4">
              <Button type="submit" loading={saving.password}>
                Change password
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
