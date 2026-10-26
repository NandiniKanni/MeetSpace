import { APP_NAME } from '../config';

// The product logo + name. `light` makes the text white for dark backgrounds.
export default function Logo({ light = false }) {
  return (
    <div className={`logo ${light ? 'logo-light' : ''}`}>
      <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="#4f46e5" />
        <rect x="6" y="10" width="13" height="12" rx="3" fill="#fff" />
        <path d="M21 14.2l5-3v9.6l-5-3z" fill="#fff" />
      </svg>
      <span className="logo-text">{APP_NAME}</span>
    </div>
  );
}
