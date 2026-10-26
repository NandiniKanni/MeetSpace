import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import { ProtectedRoute, PublicOnlyRoute } from './components/RouteGuards';
import { APP_NAME } from './config';
import { useAuth } from './context/AuthContext';
import DashboardPage from './pages/DashboardPage';
import HistoryPage from './pages/HistoryPage';
import LoginPage from './pages/LoginPage';
import MeetingPage from './pages/MeetingPage';
import NotFoundPage from './pages/NotFoundPage';
import RegisterPage from './pages/RegisterPage';

// "Routing" = showing a different page for each address in the browser bar.
export default function App() {
  const { isLoggedIn } = useAuth();

  // Show the product name in the browser tab
  useEffect(() => {
    document.title = APP_NAME;
  }, []);

  return (
    <Routes>
      {/* "/" sends people to the right place */}
      <Route path="/" element={<Navigate to={isLoggedIn ? '/dashboard' : '/login'} replace />} />

      {/* Pages for people who are NOT logged in */}
      <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />

      {/* Logged-in pages share the sidebar layout */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/history" element={<HistoryPage />} />
      </Route>

      {/* Meeting links also work for guests: the backend does not check logins on sockets */}
      <Route path="/meeting/:meetingId" element={<MeetingPage />} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
