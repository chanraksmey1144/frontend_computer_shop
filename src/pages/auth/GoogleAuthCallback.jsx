import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader, useToast } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../components/layout/AuthLayout';

export default function GoogleAuthCallback() {
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();
  const { show } = useToast();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const params = new URLSearchParams(window.location.hash.slice(1));
    const token = params.get('token');
    const errorCode = params.get('error');

    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);

    if (!token || errorCode) {
      const errorMessages = {
        google_auth_unavailable: 'Google sign-in is not configured on the server yet.',
        google_email_unverified: 'Google did not return a verified email address.',
        account_inactive: 'This account is inactive. Contact support for help.',
        google_auth_failed: 'Google sign-in could not be completed. Please try again.',
      };
      show({
        title: 'Google sign-in failed',
        description: errorCode
          ? errorMessages[errorCode] || 'Google sign-in could not be completed. Please try again.'
          : 'No sign-in token was returned. Please try again.',
        type: 'error',
      });
      navigate('/login', { replace: true });
      return;
    }

    loginWithToken(token)
      .then(() => {
        show({ title: 'Welcome', description: 'You have signed in with Google.', type: 'success' });
        navigate('/', { replace: true });
      })
      .catch(() => {
        show({
          title: 'Google sign-in failed',
          description: 'We could not load your account. Please try again.',
          type: 'error',
        });
        navigate('/login', { replace: true });
      });
  }, [loginWithToken, navigate, show]);

  return (
    <AuthLayout>
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <Loader />
        <p className="text-sm font-medium text-slate-600">Finishing Google sign-in...</p>
      </div>
    </AuthLayout>
  );
}
