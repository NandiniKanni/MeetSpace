import Icon from '../Icon';

// One round button in the bottom bar.
function ControlButton({ icon, label, onClick, off = false, active = false, badge = 0, danger = false, disabled = false }) {
  const classes = ['control-btn', off && 'control-off', active && 'control-active', danger && 'control-danger']
    .filter(Boolean)
    .join(' ');

  return (
    <button type="button" className={classes} onClick={onClick} disabled={disabled} aria-label={label} title={label}>
      <span className="control-circle">
        <Icon name={icon} size={22} />
        {badge > 0 && <span className="control-badge">{badge > 9 ? '9+' : badge}</span>}
      </span>
      <span className="control-label">{label}</span>
    </button>
  );
}

// The bar at the bottom of the meeting room.
export default function ControlBar({
  micOn,
  cameraOn,
  canUseMic,
  canUseCamera,
  isScreenSharing,
  activePanel,
  unreadCount,
  participantCount,
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
  onTogglePanel,
  onLeave,
}) {
  return (
    <div className="control-bar">
      <ControlButton
        icon={micOn ? 'mic' : 'micOff'}
        label={micOn ? 'Mute' : 'Unmute'}
        off={!micOn}
        disabled={!canUseMic}
        onClick={onToggleMic}
      />
      <ControlButton
        icon={cameraOn ? 'video' : 'videoOff'}
        label={cameraOn ? 'Stop video' : 'Start video'}
        off={!cameraOn}
        disabled={!canUseCamera}
        onClick={onToggleCamera}
      />
      <ControlButton
        icon="monitor"
        label={isScreenSharing ? 'Stop sharing' : 'Share screen'}
        active={isScreenSharing}
        onClick={onToggleScreenShare}
      />
      <ControlButton
        icon="users"
        label="Participants"
        active={activePanel === 'participants'}
        badge={0}
        onClick={() => onTogglePanel('participants')}
      />
      <ControlButton
        icon="chat"
        label="Chat"
        active={activePanel === 'chat'}
        badge={unreadCount}
        onClick={() => onTogglePanel('chat')}
      />
      <ControlButton icon="logout" label="Leave" danger onClick={onLeave} />
    </div>
  );
}
