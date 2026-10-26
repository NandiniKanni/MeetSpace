import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { copyText } from '../../services/clipboard';
import { buildMeetingLink } from '../../services/meetingId';
import Button from '../Button';
import Icon from '../Icon';

function formatTime(isoText) {
  const date = new Date(isoText);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

// A list of meetings with "Copy link" and "Join again" buttons.
export default function MeetingList({ meetings }) {
  const navigate = useNavigate();
  const { showToast } = useToast();

  async function handleCopy(meetingId) {
    const worked = await copyText(buildMeetingLink(meetingId));
    showToast(worked ? 'Meeting link copied.' : 'Could not copy the link.', worked ? 'success' : 'error');
  }

  return (
    <ul className="meeting-list">
      {meetings.map((meeting) => (
        <li key={meeting.id} className="meeting-item">
          <div className="meeting-item-icon">
            <Icon name="video" size={20} />
          </div>
          <div className="meeting-item-info">
            <span className="meeting-item-id">{meeting.id}</span>
            <span className="meeting-item-time">Last joined {formatTime(meeting.joinedAt)}</span>
          </div>
          <div className="meeting-item-actions">
            <button
              type="button"
              className="icon-button dark"
              onClick={() => handleCopy(meeting.id)}
              aria-label={`Copy link for ${meeting.id}`}
              title="Copy link"
            >
              <Icon name="copy" size={18} />
            </button>
            <Button size="sm" variant="secondary" onClick={() => navigate(`/meeting/${meeting.id}`)}>
              Join again
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
