// The heart of the app: connects to the meeting room.
//
// Two technologies work together here:
//   1. Socket.IO  - sends small messages through YOUR server (who joined, chat, WebRTC "signals").
//   2. WebRTC     - sends the actual audio/video directly between browsers (peer to peer).
//
// Socket.IO events used (all verified in your socket manager file):
//   client -> server  "join-call"  (roomName)
//   server -> client  "user-joined" (joinedSocketId, allSocketIdsInRoom)
//   server -> client  "user-left"   (leftSocketId)
//   client -> server  "signal"      (toSocketId, message)
//   server -> client  "signal"      (fromSocketId, message)
//   client -> server  "chat-message" (text, senderName)
//   server -> client  "chat-message" (text, senderName, senderSocketId)
//
// How two people get connected (the "offer / answer" dance):
//   - When I join, the server tells everybody "user-joined" and sends the full list.
//   - I (the newcomer) send an OFFER to every person already in the room.
//   - Each of them replies with an ANSWER. Both sides also swap ICE candidates
//     (possible network routes). Once that works, video flows directly.
//   - The server only passes these messages along; it never sees the video.
//
// Your server has no "leave" event. Leaving = closing the socket, and the server
// then tells the others with "user-left".

import { useCallback, useEffect, useRef, useState } from 'react';
import { createSocket } from '../services/socket';
import { ICE_SERVERS, SOCKET_URL } from '../config';
import { useToast } from '../context/ToastContext';

// The shape of one remote participant in our state
function makeEmptyPeer(id) {
  return { id, name: '', stream: null, micOn: true, videoOn: true, connectionState: 'new' };
}

export default function useMeetingRoom({ meetingId, displayName, localStream, micOn, cameraOn }) {
  const { showToast } = useToast();

  // ---- State: changing these re-draws the screen ----
  const [status, setStatus] = useState('connecting'); // connecting | connected | reconnecting | error
  const [statusMessage, setStatusMessage] = useState('');
  const [myId, setMyId] = useState(null);
  const [remotePeers, setRemotePeers] = useState({}); // { socketId: peerInfo }
  const [messages, setMessages] = useState([]);
  const [screenStream, setScreenStream] = useState(null);

  // ---- Refs: values we need to read/write WITHOUT re-drawing ----
  const socketRef = useRef(null);
  const peersRef = useRef({}); // { socketId: RTCPeerConnection }
  const remoteStreamsRef = useRef({}); // { socketId: MediaStream }
  const pendingCandidatesRef = useRef({}); // ICE candidates that arrived too early
  const peerNamesRef = useRef({}); // { socketId: name } for "X left" notices
  const announceJoinRef = useRef({}); // people we should announce with a "joined" notice
  const screenStreamRef = useRef(null);

  // Socket callbacks are created once, so they read the newest values from refs.
  const nameRef = useRef(displayName);
  const localStreamRef = useRef(localStream);
  const micOnRef = useRef(micOn);
  const videoOnRef = useRef(cameraOn);

  const videoOn = cameraOn || Boolean(screenStream); // sharing the screen counts as "video on"

  useEffect(() => {
    nameRef.current = displayName;
    localStreamRef.current = localStream;
  }, [displayName, localStream]);

  // ---------------------------------------------------------------
  // Small helpers
  // ---------------------------------------------------------------

  const sendSignal = useCallback((toId, message) => {
    if (socketRef.current) socketRef.current.emit('signal', toId, message);
  }, []);

  // Tell one person my name and whether my mic/camera are on.
  // (The server only knows socket ids, so names travel inside "signal" messages.)
  const sendProfile = useCallback(
    (toId) => {
      sendSignal(toId, {
        kind: 'profile',
        name: nameRef.current,
        micOn: micOnRef.current,
        videoOn: videoOnRef.current,
      });
    },
    [sendSignal]
  );

  // Change some fields of one remote participant (ignored if they already left).
  const updatePeer = useCallback((peerId, changes) => {
    setRemotePeers((previous) => {
      if (!previous[peerId]) return previous;
      return { ...previous, [peerId]: { ...previous[peerId], ...changes } };
    });
  }, []);

  // The video track we should be sending right now (screen if sharing, otherwise camera)
  const getOutgoingVideoTrack = useCallback(() => {
    if (screenStreamRef.current) return screenStreamRef.current.getVideoTracks()[0] || null;
    return localStreamRef.current ? localStreamRef.current.getVideoTracks()[0] || null : null;
  }, []);

  // ---------------------------------------------------------------
  // WebRTC peer connections (one per remote person)
  // ---------------------------------------------------------------

  const closePeer = useCallback((peerId) => {
    const connection = peersRef.current[peerId];
    if (connection) {
      connection.onicecandidate = null;
      connection.ontrack = null;
      connection.onconnectionstatechange = null;
      connection.close();
    }
    delete peersRef.current[peerId];
    delete remoteStreamsRef.current[peerId];
    delete pendingCandidatesRef.current[peerId];
    setRemotePeers((previous) => {
      if (!previous[peerId]) return previous;
      const copy = { ...previous };
      delete copy[peerId];
      return copy;
    });
  }, []);

  const closeAllPeers = useCallback(() => {
    Object.keys(peersRef.current).forEach(closePeer);
  }, [closePeer]);

  // Returns the connection for a person, creating it the first time.
  const ensurePeer = useCallback(
    (peerId) => {
      if (peersRef.current[peerId]) return peersRef.current[peerId];

      const connection = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      peersRef.current[peerId] = connection;

      // Add my microphone + camera. If I have no mic/camera, add an empty "slot" so that
      // (a) I can still RECEIVE their media and (b) screen sharing can use the slot later.
      const audioTrack = localStreamRef.current ? localStreamRef.current.getAudioTracks()[0] : null;
      const videoTrack = getOutgoingVideoTrack();
      if (audioTrack) connection.addTrack(audioTrack);
      else connection.addTransceiver('audio', { direction: 'sendrecv' });
      if (videoTrack) connection.addTrack(videoTrack);
      else connection.addTransceiver('video', { direction: 'sendrecv' });

      // Found a possible network route -> send it to the other person.
      connection.onicecandidate = (event) => {
        if (event.candidate) sendSignal(peerId, { kind: 'ice', candidate: event.candidate.toJSON() });
      };

      // Their audio/video arrived -> put it into a MediaStream so a <video> can play it.
      connection.ontrack = (event) => {
        let remoteStream = remoteStreamsRef.current[peerId];
        if (!remoteStream) {
          remoteStream = new MediaStream();
          remoteStreamsRef.current[peerId] = remoteStream;
        }
        if (!remoteStream.getTracks().includes(event.track)) remoteStream.addTrack(event.track);
        updatePeer(peerId, { stream: remoteStream });
      };

      connection.onconnectionstatechange = () => {
        updatePeer(peerId, { connectionState: connection.connectionState });
      };

      // Show them in the participants list right away (video appears once connected)
      setRemotePeers((previous) => (previous[peerId] ? previous : { ...previous, [peerId]: makeEmptyPeer(peerId) }));

      return connection;
    },
    [getOutgoingVideoTrack, sendSignal, updatePeer]
  );

  // I am the newcomer: create an OFFER and send it to someone already in the room.
  const callPeer = useCallback(
    async (peerId) => {
      try {
        const connection = ensurePeer(peerId);
        const offer = await connection.createOffer();
        await connection.setLocalDescription(offer);
        sendSignal(peerId, {
          kind: 'sdp',
          description: { type: connection.localDescription.type, sdp: connection.localDescription.sdp },
        });
        sendProfile(peerId);
      } catch (error) {
        console.error('Could not call participant', error);
        showToast('Could not connect to one of the participants.', 'error');
      }
    },
    [ensurePeer, sendProfile, sendSignal, showToast]
  );

  // ICE candidates that arrived before the other side's description are queued,
  // then added once the description is set.
  const addQueuedCandidates = useCallback(async (peerId, connection) => {
    const queued = pendingCandidatesRef.current[peerId] || [];
    pendingCandidatesRef.current[peerId] = [];
    for (const candidate of queued) {
      try {
        await connection.addIceCandidate(candidate);
      } catch (error) {
        console.warn('Could not add ICE candidate', error);
      }
    }
  }, []);

  // ---------------------------------------------------------------
  // Socket.IO event handlers
  // ---------------------------------------------------------------

  const handleUserJoined = useCallback(
    (joinedId, allIdsInRoom) => {
      const socket = socketRef.current;
      if (!socket) return;

      if (joinedId === socket.id) {
        // That is ME. Call everyone who was already here.
        allIdsInRoom.filter((id) => id !== socket.id).forEach((id) => callPeer(id));
      } else {
        // Someone else arrived. They will send me an offer, so I just get ready.
        ensurePeer(joinedId);
        announceJoinRef.current[joinedId] = true; // announce once we learn their name
      }
    },
    [callPeer, ensurePeer]
  );

  const handleUserLeft = useCallback(
    (leftId) => {
      const hadConnection = Boolean(peersRef.current[leftId]);
      const name = peerNamesRef.current[leftId];
      closePeer(leftId);
      delete announceJoinRef.current[leftId];
      delete peerNamesRef.current[leftId];
      if (hadConnection) showToast(`${name || 'A participant'} left the meeting`, 'info');
    },
    [closePeer, showToast]
  );

  const handleSignal = useCallback(
    async (fromId, message) => {
      if (!message || typeof message !== 'object') return;

      // --- Our own small messages (name + mic/camera state) ---
      if (message.kind === 'profile') {
        const name = String(message.name || 'Guest').slice(0, 40);
        peerNamesRef.current[fromId] = name;
        updatePeer(fromId, { name, micOn: message.micOn !== false, videoOn: message.videoOn !== false });
        if (announceJoinRef.current[fromId]) {
          delete announceJoinRef.current[fromId];
          showToast(`${name} joined the meeting`, 'success');
        }
        return;
      }
      if (message.kind === 'media-state') {
        updatePeer(fromId, { micOn: message.micOn !== false, videoOn: message.videoOn !== false });
        return;
      }

      // --- WebRTC negotiation messages ---
      try {
        if (message.kind === 'sdp' && message.description) {
          const connection = ensurePeer(fromId);
          await connection.setRemoteDescription(message.description);
          await addQueuedCandidates(fromId, connection);

          if (message.description.type === 'offer') {
            // Someone is calling me: reply with an ANSWER.
            const answer = await connection.createAnswer();
            await connection.setLocalDescription(answer);
            sendSignal(fromId, {
              kind: 'sdp',
              description: { type: connection.localDescription.type, sdp: connection.localDescription.sdp },
            });
            sendProfile(fromId);
          }
        } else if (message.kind === 'ice' && message.candidate) {
          const connection = peersRef.current[fromId];
          if (!connection) return; // that person already left
          if (connection.remoteDescription) {
            await connection.addIceCandidate(message.candidate);
          } else {
            const queue = pendingCandidatesRef.current[fromId] || [];
            queue.push(message.candidate);
            pendingCandidatesRef.current[fromId] = queue;
          }
        }
      } catch (error) {
        console.error('Signal handling failed', error);
        showToast('Could not connect to one of the participants.', 'error');
      }
    },
    [addQueuedCandidates, ensurePeer, sendProfile, sendSignal, showToast, updatePeer]
  );

  const handleChatMessage = useCallback((text, senderName, senderSocketId) => {
    setMessages((previous) => [
      ...previous,
      {
        id: `${previous.length}-${Math.random().toString(36).slice(2, 8)}`,
        text,
        sender: senderName,
        senderId: senderSocketId,
      },
    ]);
  }, []);

  // ---------------------------------------------------------------
  // Connect when the room opens, disconnect when it closes
  // ---------------------------------------------------------------

  const stopScreenTracks = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => {
        track.onended = null;
        track.stop();
      });
      screenStreamRef.current = null;
    }
  }, []);

  useEffect(() => {
    const socket = createSocket();
    socketRef.current = socket;

    socket.on('connect', () => {
      setMyId(socket.id);
      setStatus('connected');
      setStatusMessage('');
      setMessages([]); // the server re-sends the chat history after "join-call"
      socket.emit('join-call', meetingId);
    });

    socket.on('connect_error', () => {
      setStatus('error');
      setStatusMessage(`Cannot reach the meeting server at ${SOCKET_URL}. Is the backend running?`);
    });

    socket.on('disconnect', (reason) => {
      closeAllPeers(); // old connections are useless once our socket id changes
      if (reason === 'io client disconnect') return; // we left on purpose
      setStatus('reconnecting');
      setStatusMessage('Connection lost. Trying to reconnect...');
      showToast('Connection to the server was lost. Reconnecting...', 'error');
      if (reason === 'io server disconnect') socket.connect(); // server kicked us: try again manually
    });

    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    socket.on('signal', handleSignal);
    socket.on('chat-message', handleChatMessage);

    // Cleanup: runs when leaving the room (or when meetingId changes)
    return () => {
      closeAllPeers();
      stopScreenTracks();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [
    meetingId,
    closeAllPeers,
    handleChatMessage,
    handleSignal,
    handleUserJoined,
    handleUserLeft,
    showToast,
    stopScreenTracks,
  ]);

  // Whenever my mic/camera/share state changes, tell everyone so their screen can show it.
  useEffect(() => {
    micOnRef.current = micOn;
    videoOnRef.current = videoOn;
    Object.keys(peersRef.current).forEach((peerId) => {
      sendSignal(peerId, { kind: 'media-state', micOn, videoOn });
    });
  }, [micOn, videoOn, sendSignal]);

  // ---------------------------------------------------------------
  // Actions the buttons use
  // ---------------------------------------------------------------

  const sendMessage = useCallback(
    (text) => {
      const cleanText = text.trim();
      if (!cleanText) return false;
      if (!socketRef.current || !socketRef.current.connected) {
        showToast('You are not connected, so the message was not sent.', 'error');
        return false;
      }
      socketRef.current.emit('chat-message', cleanText, nameRef.current);
      return true;
    },
    [showToast]
  );

  // Swap the video we send to everyone without renegotiating the connection.
  const replaceVideoTrackForEveryone = useCallback(async (newTrack) => {
    const connections = Object.values(peersRef.current);
    await Promise.all(
      connections.map(async (connection) => {
        const videoTransceiver = connection
          .getTransceivers()
          .find((transceiver) => transceiver.receiver.track && transceiver.receiver.track.kind === 'video');
        if (!videoTransceiver) return;
        try {
          await videoTransceiver.sender.replaceTrack(newTrack);
        } catch (error) {
          console.warn('Could not switch video track', error);
        }
      })
    );
  }, []);

  const stopScreenShare = useCallback(async () => {
    if (!screenStreamRef.current) return;
    stopScreenTracks();
    setScreenStream(null);
    const cameraTrack = localStreamRef.current ? localStreamRef.current.getVideoTracks()[0] || null : null;
    await replaceVideoTrackForEveryone(cameraTrack);
  }, [replaceVideoTrackForEveryone, stopScreenTracks]);

  const startScreenShare = useCallback(async () => {
    if (screenStreamRef.current) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      showToast('Screen sharing is not supported in this browser.', 'error');
      return;
    }
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = displayStream.getVideoTracks()[0];
      screenStreamRef.current = displayStream;
      // The browser has its own "Stop sharing" button - react to it too.
      screenTrack.onended = () => stopScreenShare();
      setScreenStream(displayStream);
      await replaceVideoTrackForEveryone(screenTrack);
    } catch (error) {
      // NotAllowedError just means the person pressed Cancel, which is not an error.
      if (error.name !== 'NotAllowedError') {
        showToast('Could not start screen sharing.', 'error');
      }
    }
  }, [replaceVideoTrackForEveryone, showToast, stopScreenShare]);

  // Leaving = closing everything. (The unmount cleanup above does the same, so it is safe to call twice.)
  const leave = useCallback(() => {
    closeAllPeers();
    stopScreenTracks();
    if (socketRef.current) socketRef.current.disconnect();
  }, [closeAllPeers, stopScreenTracks]);

  return {
    status,
    statusMessage,
    myId,
    remotePeers: Object.values(remotePeers),
    messages,
    screenStream,
    isScreenSharing: Boolean(screenStream),
    sendMessage,
    startScreenShare,
    stopScreenShare,
    leave,
  };
}
