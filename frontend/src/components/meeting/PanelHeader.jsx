import Icon from '../Icon';

// The title row at the top of the chat / participants side panels.
export default function PanelHeader({ title, onClose }) {
  return (
    <div className="panel-header">
      <h2>{title}</h2>
      <button type="button" className="icon-button dark" onClick={onClose} aria-label="Close panel">
        <Icon name="x" size={18} />
      </button>
    </div>
  );
}
