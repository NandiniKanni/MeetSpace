import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from './ConfirmDialog';
import Icon from './Icon';
import Logo from './Logo';
import Sidebar from './Sidebar';

// The frame around the logged-in pages: sidebar on the left, page content on the right.
// <Outlet /> is where React Router puts the current page (Dashboard, History, ...).
export default function AppLayout() {
  const { username, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false); // sidebar on phones
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  function handleSignOut() {
    logout();
    setConfirmSignOut(false);
    showToast('You have been signed out.', 'info');
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-shell">
      <Sidebar
        username={username}
        open={menuOpen}
        onNavigate={() => setMenuOpen(false)}
        onSignOut={() => setConfirmSignOut(true)}
      />
      {menuOpen && <div className="sidebar-backdrop" onClick={() => setMenuOpen(false)} />}

      <div className="app-main">
        {/* This top bar only appears on phones/tablets */}
        <header className="mobile-topbar">
          <button type="button" className="icon-button dark" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Icon name="menu" size={22} />
          </button>
          <Logo />
        </header>

        <main className="page">
          <Outlet />
        </main>
      </div>

      <ConfirmDialog
        open={confirmSignOut}
        title="Sign out?"
        message="You will need to log in again to use your dashboard."
        confirmLabel="Sign out"
        danger
        onConfirm={handleSignOut}
        onCancel={() => setConfirmSignOut(false)}
      />
    </div>
  );
}
