import { NavLink } from 'react-router-dom';
import Icon from './Icon';
import Logo from './Logo';

// The dark navy navigation on the left of the dashboard.
// `open` only matters on small screens, where the sidebar slides in over the page.
export default function Sidebar({ username, open, onNavigate, onSignOut }) {
  const initial = (username || '?').charAt(0).toUpperCase();

  return (
    <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
      <div className="sidebar-top">
        <Logo light />
      </div>

      <nav className="sidebar-nav" aria-label="Main">
        <NavLink to="/dashboard" className="nav-link" onClick={onNavigate}>
          <Icon name="home" size={18} />
          Dashboard
        </NavLink>
        <NavLink to="/history" className="nav-link" onClick={onNavigate}>
          <Icon name="clock" size={18} />
          Recent meetings
        </NavLink>
      </nav>

      <div className="sidebar-user">
        <div className="avatar">{initial}</div>
        <div className="sidebar-user-info">
          <span className="sidebar-user-name">{username}</span>
          <span className="sidebar-user-role">Signed in</span>
        </div>
        <button type="button" className="icon-button" onClick={onSignOut} aria-label="Sign out" title="Sign out">
          <Icon name="logout" size={18} />
        </button>
      </div>
    </aside>
  );
}
