import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import Logo from '../components/Logo';
import MeetingRoom from '../components/meeting/MeetingRoom';
import PreMeeting from '../components/meeting/PreMeeting';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useLocalMedia from '../hooks/useLocalMedia';
import { isValidMeetingId } from '../services/meetingId';
import { rememberMeeting } from '../services/recentMeetings';

const NAME_KEY = 'meetspace_display_name';

function readSavedName() {
  try {
    return localStorage.getItem(NAME_KEY) || '';
  } catch (error) {
    return '';
  }
}

// This inner component only exists for VALID meeting ids, so we never ask for the
// camera on a broken link.
function MeetingSession({ meetingId }) {
  const navigate = useNavigate();
  const { username, isLoggedIn } = useAuth();
  const { showToast } = useToast();

  const media = useLocalMedia(); // camera + microphone (kept alive across lobby -> room)
  const [displayName, setDisplayName] = useState(() => username || readSavedName());
  const [joined, setJoined] = useState(false);

  function handleJoin(cleanName) {
    setDisplayName(cleanName);
    try {
      localStorage.setItem(NAME_KEY, cleanName);
    } catch (error) {
      // not important
    }
    rememberMeeting(meetingId);
    setJoined(true);
  }

  function handleLeft() {
    showToast('You left the meeting.', 'info');
    navigate(isLoggedIn ? '/dashboard' : '/', { replace: true });
  }

  if (joined) {
    return <MeetingRoom meetingId={meetingId} displayName={displayName} media={media} onLeave={handleLeft} />;
  }

  return (
    <div className="lobby-page">
      <header className="lobby-header">
        <Logo />
        {isLoggedIn && <Link to="/dashboard">Back to dashboard</Link>}
      </header>
      <PreMeeting
        meetingId={meetingId}
        media={media}
        displayName={displayName}
        onNameChange={setDisplayName}
        onJoin={handleJoin}
      />
    </div>
  );
}

export default function MeetingPage() {
  const { meetingId } = useParams(); // the ":meetingId" part of /meeting/:meetingId
  const navigate = useNavigate();

  if (!isValidMeetingId(meetingId)) {
    return (
      <div className="center-page">
        <EmptyState
          icon="alert"
          title="This meeting link is not valid"
          description="Meeting IDs use letters, numbers and dashes, like abc-defg-hij."
          action={<Button onClick={() => navigate('/')}>Go to home</Button>}
        />
      </div>
    );
  }

  // key={meetingId} makes React start fresh if the ID in the address bar changes
  return <MeetingSession key={meetingId} meetingId={meetingId} />;
}
