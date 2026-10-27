
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'MeetSpace';

function removeTrailingSlash(text) {
  return text.replace(/\/+$/, '');
}

function ensureLeadingSlash(text) {
  return text.startsWith('/') ? text : `/${text}`;
}

// Local development uses localhost; production uses the same origin as the frontend.
const isDevelopment = import.meta.env.DEV;

export const API_URL = removeTrailingSlash(
  isDevelopment
    ? (import.meta.env.VITE_API_URL || 'http://localhost:8000')
    : ''
);

export const API_USERS_PATH = ensureLeadingSlash(
  import.meta.env.VITE_API_USERS_PATH || '/api/v1/users'
);

// In production, connect Socket.IO to this deployed website.
export const SOCKET_URL = isDevelopment
  ? removeTrailingSlash(import.meta.env.VITE_SOCKET_URL || API_URL)
  : window.location.origin;

export const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' }
];
