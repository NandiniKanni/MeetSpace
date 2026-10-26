import { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { copyText } from '../../services/clipboard';
import { buildMeetingLink } from '../../services/meetingId';
import Alert from '../Alert';
import Button from '../Button';
import Icon from '../Icon';
import Spinner from '../Spinner';
import TextField from '../TextField';
import VideoTile from './VideoTile';

// The "check your camera before joining" screen.
// `media` comes from the useLocalMedia hook (stream, error, toggles...).
export default function PreMeeting({ meetingId, media, displayName, onNameChange, onJoin }) {
  const { showToast } = useToast();
  const [nameError, setNameError] = useState('');
  const meetingLink = buildMeetingLink(meetingId);

  async function handleCopy() {
    const worked = await copyText(meetingLink);
    showToast(worked ? 'Meeting link copied.' : 'Could not copy the link.', worked ? 'success' : 'error');
  }

  function handleSubmit(event) {
    event.preventDefault();
    const cleanName = displayName.trim();
    if (!cleanName) {
      setNameError('Enter the name others will see.');
      return;
    }
    onJoin(cleanName);
  }

  return (
    <div className="lobby">
      <div className="lobby-preview">
        <div className="lobby-video">
          {media.loading ? (
            <div className="lobby-loading">
              <Spinner size={28} />
              <span>Starting camera...</span>
            </div>
          ) : (
            <VideoTile
              name={displayName}
              stream={media.stream}
              isLocal
              micOn={media.micOn}
              videoOn={media.cameraOn}
              mirrored
            />
          )}

          <div className="lobby-toggles">
            <button
              type="button"
              className={`round-toggle ${media.micOn ? '' : 'round-toggle-off'}`}
              onClick={media.toggleMic}
              disabled={!media.hasAudio}
              aria-label={media.micOn ? 'Mute microphone' : 'Unmute microphone'}
              title={media.micOn ? 'Mute microphone' : 'Unmute microphone'}
            >
              <Icon name={media.micOn ? 'mic' : 'micOff'} size={20} />
            </button>
            <button
              type="button"
              className={`round-toggle ${media.cameraOn ? '' : 'round-toggle-off'}`}
              onClick={media.toggleCamera}
              disabled={!media.hasVideo}
              aria-label={media.cameraOn ? 'Turn camera off' : 'Turn camera on'}
              title={media.cameraOn ? 'Turn camera off' : 'Turn camera on'}
            >
              <Icon name={media.cameraOn ? 'video' : 'videoOff'} size={20} />
            </button>
          </div>
        </div>

        {media.error && (
          <Alert
            action={
              <Button size="sm" variant="secondary" onClick={media.retry}>
                Try again
              </Button>
            }
          >
            {media.error} You can still join without them.
          </Alert>
        )}
      </div>

      <form className="lobby-card" onSubmit={handleSubmit} noValidate>
        <h1>Ready to join?</h1>
        <p className="lobby-subtitle">Check how you look and sound, then join the meeting.</p>

        <div className="meeting-info">
          <span className="meeting-info-label">Meeting ID</span>
          <span className="meeting-info-id">{meetingId}</span>
          <div className="meeting-info-link">
            <Icon name="link" size={16} />
            <span>{meetingLink}</span>
          </div>
          <Button size="sm" variant="secondary" icon="copy" onClick={handleCopy}>
            Copy link
          </Button>
        </div>

        <TextField
          label="Your name"
          id="display-name"
          value={displayName}
          onChange={(event) => {
            onNameChange(event.target.value);
            setNameError('');
          }}
          error={nameError}
          maxLength={40}
          autoComplete="name"
        />

        <Button type="submit" size="lg" className="btn-block" disabled={media.loading}>
          Join meeting
        </Button>
      </form>
    </div>
  );
}
