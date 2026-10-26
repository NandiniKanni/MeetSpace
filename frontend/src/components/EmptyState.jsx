import Icon from './Icon';

// Friendly placeholder shown when a list has nothing in it yet.
export default function EmptyState({ icon = 'clock', title, description, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon name={icon} size={26} />
      </div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}
