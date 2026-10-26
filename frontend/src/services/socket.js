// Creates a Socket.IO connection to the backend (the server code is in your socket manager file).
// Socket.IO only carries small messages (signals + chat). The video itself travels over WebRTC.

import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config';

export function createSocket() {
  // The socket connects automatically. Socket.IO also reconnects by itself if the network drops.
  return io(SOCKET_URL);
}
