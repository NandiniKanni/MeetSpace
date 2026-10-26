import Icon from './Icon';
import Spinner from './Spinner';

// One button used everywhere, so all buttons look the same.
//   variant: 'primary' | 'secondary' | 'danger' | 'ghost'
//   size:    'sm' | 'md' | 'lg'
//   loading: shows a spinner and disables the button
//   icon:    optional icon name (see Icon.jsx)
export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className = '',
  disabled = false,
  type = 'button',
  ...otherProps
}) {
  return (
    <button
      type={type}
      className={`btn btn-${variant} btn-${size} ${className}`}
      disabled={disabled || loading}
      {...otherProps}
    >
      {loading ? <Spinner size={16} /> : icon ? <Icon name={icon} size={18} /> : null}
      {children}
    </button>
  );
}
