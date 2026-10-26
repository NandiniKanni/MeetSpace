import { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import useMeetingRoom from '../../hooks/useMeetingRoom';
import { copyText } from '../../services/clipboard';
import { buildMeetingLink } from '../../services/meetingId';
import Alert from '../Alert';
import Button from '../Button';
import ConfirmDialog from '../ConfirmDialog';
import Icon from '../Icon';
import ChatPanel from './ChatPanel';
import ConnectionBadge from './ConnectionBadge';
import ControlBar from './ControlBar';
import ParticipantsPanel from './ParticipantsPanel';
import VideoGrid from './VideoGrid';

// The meeting screen. It puts together the pieces:
//   useMeetingRoom (socket + WebRTC)  ->  VideoGrid, ChatPanel, ParticipantsPanel, ControlBar
export default function MeetingRoom({ meetingId, displayName, media, onLeave }) {
  const { showToast } = useToast();

  const room = useMeetingRoom({
    meetingId,
    displayName,
    localStream: media.stream,
    micOn: media.micOn,
    cameraOn: media.cameraOn,
  });

  const [activePanel, setActivePanel] = useState(null); // null | 'chat' | 'participants'
  const [seenMessageCount, setSeenMessageCount] = useState(0);
  const [confirmLeave, setConfirmLeave] = useState(false);

  // Count chat messages the person has not looked at yet (shown as a red badge)
  useEffect(() => {
    if (activePanel === 'chat' || room.messages.length < seenMessageCount) {
      setSeenMessageCount(room.messages.length);
    }
  }, [activePanel, room.messages.length, seenMessageCount]);
  const unreadCount = activePanel === 'chat' ? 0 : room.messages.length - seenMessageCount;

  // Build one list with me first, then everybody else.
  const sharingScreen = room.isScreenSharing;
  const participants = [
    {
      id: 'local',
      name: displayName,
      stream: sharingScreen ? room.screenStream : media.stream,
      micOn: media.micOn,
      videoOn: media.cameraOn || sharingScreen,
      isLocal: true,
      mirrored: !sharingScreen, // mirror the camera like a mirror, but never mirror shared screens
      connectionState: 'connected',
    },
    ...room.remotePeers.map((peer) => ({ ...peer, isLocal: false, mirrored: false })),
  ];

  function togglePanel(panelName) {
    setActivePanel((current) => (current === panelName ? null : panelName));
  }

  async function handleCopyLink() {
    const worked = await copyText(buildMeetingLink(meetingId));
    showToast(worked ? 'Meeting link copied.' : 'Could not copy the link.', worked ? 'success' : 'error');
  }

  function handleLeave() {
    room.leave(); // close the socket and every WebRTC connection
    onLeave();
  }

  const showStatusBanner = room.status === 'error' || room.status === 'reconnecting';

  return (
    <div className="room">
      <header className="room-header">
        <div className="room-title">
          <span className="room-id">{meetingId}</span>
          <button type="button" className="room-copy" onClick={handleCopyLink}>
            <Icon name="copy" size={16} />
            <span>Copy link</span>
          </button>
        </div>
        <div className="room-status">
          <ConnectionBadge status={room.status} />
          <span className="room-count">
            <Icon name="users" size={16} />
            {participants.length}
          </span>
        </div>
      </header>

      <div className="room-body">
        <section className="room-stage">
          {showStatusBanner && (
            <Alert
              type="error"
              action={
                room.status === 'error' ? (
                  <Button size="sm" variant="secondary" onClick={handleLeave}>
                    Leave
                  </Button>
                ) : null
              }
            >
              {room.statusMessage}
            </Alert>
          )}

          {participants.length === 1 && room.status === 'connected' && (
            <p className="room-hint">You are the only one here. Copy the meeting link and share it to invite others.</p>
          )}

          <VideoGrid participants={participants} />
        </section>

        {activePanel && (
          <aside className="side-panel">
            {activePanel === 'chat' ? (
              <ChatPanel
                messages={room.messages}
                myId={room.myId}
                onSend={room.sendMessage}
                onClose={() => setActivePanel(null)}
              />
            ) : (
              <ParticipantsPanel participants={participants} onClose={() => setActivePanel(null)} />
            )}
          </aside>
        )}
      </div>

      <ControlBar
        micOn={media.micOn}
        cameraOn={media.cameraOn}
        canUseMic={media.hasAudio}
        canUseCamera={media.hasVideo}
        isScreenSharing={sharingScreen}
        activePanel={activePanel}
        unreadCount={unreadCount}
        participantCount={participants.length}
        onToggleMic={media.toggleMic}
        onToggleCamera={media.toggleCamera}
        onToggleScreenShare={sharingScreen ? room.stopScreenShare : room.startScreenShare}
        onTogglePanel={togglePanel}
        onLeave={() => setConfirmLeave(true)}
      />

      <ConfirmDialog
        open={confirmLeave}
        title="Leave meeting?"
        message="Your camera and microphone will be turned off. You can rejoin with the same link."
        confirmLabel="Leave"
        danger
        onConfirm={handleLeave}
        onCancel={() => setConfirmLeave(false)}
      />
    </div>
  );
}
