import { useEffect, useRef } from 'react';
import Icon from '../Icon';

// One person's video square.
//
// Important: the <video> element is ALWAYS rendered (just hidden when the camera is off),
// because that same element also plays the person's audio.
export default function VideoTile({
  name,
  stream,
  isLocal = false,
  micOn = true,
  videoOn = true,
  mirrored = false,
  connectionState = 'connected',
}) {
  const videoRef = useRef(null);

  // Connect the MediaStream to the <video> element (React can't do this with a normal prop)
  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream || null;
  }, [stream]);

  const showVideo = Boolean(stream) && videoOn;
  const displayName = name || 'Guest';
  const initial = displayName.charAt(0).toUpperCase();

  // A short status line for people who are not connected yet
  let overlayText = '';
  if (!isLocal) {
    if (connectionState === 'failed') overlayText = 'Connection failed';
    else if (connectionState === 'disconnected') overlayText = 'Connection interrupted';
    else if (!stream) overlayText = 'Connecting...';
  }

  return (
    <div className={`tile ${isLocal ? 'tile-local' : ''}`}>
      <video
        ref={videoRef}
        className={`tile-video ${mirrored ? 'mirrored' : ''} ${showVideo ? '' : 'tile-video-hidden'}`}
        autoPlay
        playsInline
        muted={isLocal} // never play my own microphone back to me
      />

      {!showVideo && (
        <div className="tile-avatar">
          <span>{initial}</span>
        </div>
      )}

      {overlayText && <div className="tile-overlay">{overlayText}</div>}

      <div className="tile-label">
        {!micOn && <Icon name="micOff" size={14} />}
        <span>
          {displayName}
          {isLocal ? ' (You)' : ''}
        </span>
      </div>
    </div>
  );
}
