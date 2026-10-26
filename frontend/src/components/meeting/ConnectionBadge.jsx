const LABELS = {
  connecting: 'Connecting...',
  connected: 'Connected',
  reconnecting: 'Reconnecting...',
  error: 'Server unreachable',
};

// A small coloured pill showing the Socket.IO connection status.
export default function ConnectionBadge({ status }) {
  return (
    <span className={`connection-badge connection-${status}`}>
      <span className="connection-dot" />
      {LABELS[status] || status}
    </span>
  );
}
