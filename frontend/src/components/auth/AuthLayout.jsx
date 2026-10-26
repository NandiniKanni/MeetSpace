import Icon from '../Icon';
import Logo from '../Logo';

// Shared frame for the login and sign-up pages:
// a dark brand panel on the left (hidden on phones) and the form on the right.
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="auth-page">
      <aside className="auth-brand">
        <Logo light />
        <div className="auth-brand-body">
          <h2>Video meetings that just work.</h2>
          <ul className="auth-features">
            <li>
              <Icon name="video" size={18} /> Group video calls in your browser
            </li>
            <li>
              <Icon name="chat" size={18} /> Real-time chat inside every meeting
            </li>
            <li>
              <Icon name="monitor" size={18} /> Screen sharing
            </li>
          </ul>
        </div>
      </aside>

      <main className="auth-form-area">
        <div className="auth-card">
          <div className="auth-mobile-logo">
            <Logo />
          </div>
          <h1>{title}</h1>
          <p className="auth-subtitle">{subtitle}</p>
          {children}
          <p className="auth-footer">{footer}</p>
        </div>
      </main>
    </div>
  );
}
