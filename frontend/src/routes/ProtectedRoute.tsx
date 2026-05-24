import { Navigate } from 'react-router-dom';
import useAuthStore from '@/store/authStore';

interface Props {
  children: React.ReactNode;
}

// Redirects to /login if no token is present. The token check here is
// intentionally shallow - the API will reject stale or invalid tokens with
// a 401, which the Axios interceptor handles by clearing auth and hard
// redirecting to /login.
export default function ProtectedRoute({ children }: Props) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}