// A "hook" is a reusable function that holds state and logic for a component.
// This one asks the browser for the camera + microphone and remembers the on/off switches.

import { useCallback, useEffect, useRef, useState } from 'react';

// Turn the browser's technical error into a sentence a person can act on.
function describeMediaError(error) {
  switch (error && error.name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Camera/microphone access was blocked. Click the lock icon in the address bar, allow access, then press "Try again".';
    case 'NotFoundError':
      return 'No camera or microphone was found on this device.';
    case 'NotReadableError':
      return 'Your camera or microphone is being used by another app. Close it and press "Try again".';
    default:
      return 'Could not start your camera or microphone.';
  }
}

export default function useLocalMedia() {
  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);

  const streamRef = useRef(null); // lets us stop the tracks when the page closes
  const isMountedRef = useRef(true);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Ask the browser for devices. Falls back to audio-only / video-only when one is missing.
  const startMedia = useCallback(async () => {
    setLoading(true);
    setError('');
    stopStream();
    setStream(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('This browser cannot use the camera. Open the app on http://localhost or https:// in an up-to-date browser.');
      setLoading(false);
      return;
    }

    const attempts = [{ audio: true, video: true }, { audio: true }, { video: true }];
    let firstError = null;

    for (const constraints of attempts) {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!isMountedRef.current) {
          newStream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = newStream;
        setStream(newStream);
        setLoading(false);
        return;
      } catch (mediaError) {
        if (!firstError) firstError = mediaError;
        // If the person said "Block", asking again with other options is pointless.
        if (mediaError.name === 'NotAllowedError' || mediaError.name === 'SecurityError') break;
      }
    }

    if (isMountedRef.current) {
      setError(describeMediaError(firstError));
      setLoading(false);
    }
  }, [stopStream]);

  // Start once when the page opens, and release the camera when it closes.
  useEffect(() => {
    isMountedRef.current = true;
    startMedia();
    return () => {
      isMountedRef.current = false;
      stopStream();
    };
  }, [startMedia, stopStream]);

  // Muting = disabling the track (the device stays open, so un-muting is instant).
  useEffect(() => {
    if (stream) stream.getAudioTracks().forEach((track) => (track.enabled = micOn));
  }, [stream, micOn]);

  useEffect(() => {
    if (stream) stream.getVideoTracks().forEach((track) => (track.enabled = cameraOn));
  }, [stream, cameraOn]);

  const hasAudio = Boolean(stream && stream.getAudioTracks().length > 0);
  const hasVideo = Boolean(stream && stream.getVideoTracks().length > 0);

  return {
    stream,
    loading,
    error,
    hasAudio,
    hasVideo,
    micOn: hasAudio && micOn,
    cameraOn: hasVideo && cameraOn,
    toggleMic: () => setMicOn((current) => !current),
    toggleCamera: () => setCameraOn((current) => !current),
    retry: startMedia,
  };
}
