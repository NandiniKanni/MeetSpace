import Icon from './Icon';

// A coloured message box. type: 'error' | 'success' | 'info'
export default function Alert({ type = 'error', children, action }) {
  return (
    <div className={`alert alert-${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <Icon name={type === 'success' ? 'check' : type === 'info' ? 'info' : 'alert'} size={18} />
      <span className="alert-text">{children}</span>
      {action}
    </div>
  );
}
