import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Only logged-in people may see the children. Others are sent to /login.
// We remember where they wanted to go so we can send them back after login.
export function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth();
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}

// Login/Register pages: logged-in people are sent to the dashboard instead.
export function PublicOnlyRoute({ children }) {
  const { isLoggedIn } = useAuth();

  if (isLoggedIn) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
