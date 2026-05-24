import { useEffect } from 'react';
import useAuthStore from '@/store/authStore';
import api from '@/lib/api';
import type { AuthUser } from '@/store/authStore';

interface Props {
  onSignOut?: () => void;
}

export default function Header({ onSignOut }: Props) {
  const { user, token, setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    if (token && !user) {
      api
        .get<AuthUser>('/auth/me')
        .then((res) => setAuth(token, res.data))
        .catch(() => clearAuth());
    }
  }, [token, user, setAuth, clearAuth]);

  function handleSignOut() {
    onSignOut?.();
    // Small delay so the toast renders before the redirect clears the DOM.
    setTimeout(() => clearAuth(), 150);
  }

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-6">
      <div />
      <div className="flex items-center gap-3">
        {user && (
          <>
            <span className="text-sm text-muted-foreground">{user.name}</span>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium capitalize">
              {user.role}
            </span>
          </>
        )}
        <button
          onClick={handleSignOut}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}