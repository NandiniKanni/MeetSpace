// All settings that might change between machines live here.
// The values come from the ".env" file (see ".env.example").
// If a value is missing we fall back to a sensible default.

// The product name. Change it in .env (VITE_APP_NAME) or right here.
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'MeetSpace';

// Helper: remove a trailing "/" so we can safely write `${API_URL}/something`
function removeTrailingSlash(text) {
  return text.replace(/\/+$/, '');
}

// Helper: make sure a path starts with exactly one "/"
function ensureLeadingSlash(text) {
  return text.startsWith('/') ? text : `/${text}`;
}

// Where your Express backend runs.
export const API_URL = removeTrailingSlash(import.meta.env.VITE_API_URL || 'http://localhost:8000');

// The path where users.routes.js is mounted in app.js.
// NOTE: this was NOT visible in the code shared so far, so check it in your app.js.
export const API_USERS_PATH = ensureLeadingSlash(import.meta.env.VITE_API_USERS_PATH || '/api/v1/users');

// Where Socket.IO lives (normally the same server as the API).
export const SOCKET_URL = removeTrailingSlash(import.meta.env.VITE_SOCKET_URL || API_URL);

// STUN server used by WebRTC to discover the public address of each browser.
// A free Google STUN server works for most home/office networks.
// Strict corporate networks may also need a TURN server (not included).
export const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];
