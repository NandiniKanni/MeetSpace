import Icon from '../Icon';
import PanelHeader from './PanelHeader';

const STATE_LABELS = {
  new: 'Connecting...',
  connecting: 'Connecting...',
  connected: 'Connected',
  disconnected: 'Interrupted',
  failed: 'Connection failed',
  closed: 'Closed',
};

// The participants sidebar: everyone in the meeting with their mic/camera status.
export default function ParticipantsPanel({ participants, onClose }) {
  return (
    <div className="side-panel-inner">
      <PanelHeader title={`Participants (${participants.length})`} onClose={onClose} />

      <ul className="participant-list">
        {participants.map((person) => {
          const displayName = person.name || 'Guest';
          return (
            <li key={person.id} className="participant-item">
              <div className="avatar">{displayName.charAt(0).toUpperCase()}</div>
              <div className="participant-info">
                <span className="participant-name">
                  {displayName}
                  {person.isLocal ? ' (You)' : ''}
                </span>
                {!person.isLocal && (
                  <span className="participant-state">{STATE_LABELS[person.connectionState] || ''}</span>
                )}
              </div>
              <div className="participant-icons">
                <Icon name={person.micOn ? 'mic' : 'micOff'} size={16} className={person.micOn ? '' : 'icon-muted'} />
                <Icon name={person.videoOn ? 'video' : 'videoOff'} size={16} className={person.videoOn ? '' : 'icon-muted'} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
