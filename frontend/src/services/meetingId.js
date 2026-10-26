// Helpers for meeting IDs and meeting links.
//
// Your backend has no "create meeting" endpoint: a room is created automatically
// the first time someone emits "join-call" with a room name. So a new meeting is
// simply a new random ID, and the ID is the room name we send to the server.

// Example valid IDs: "abc-defg-hij", "team-standup"
const MEETING_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{2,63}$/;

function randomLetters(count) {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const randomNumbers = new Uint32Array(count);
  crypto.getRandomValues(randomNumbers); // secure random numbers
  let result = '';
  for (let i = 0; i < count; i++) {
    result += letters[randomNumbers[i] % letters.length];
  }
  return result;
}

// Creates something like "kdm-qwzx-pea"
export function createMeetingId() {
  return `${randomLetters(3)}-${randomLetters(4)}-${randomLetters(3)}`;
}

export function isValidMeetingId(id) {
  return MEETING_ID_PATTERN.test(id || '');
}

// The full link people can share
export function buildMeetingLink(meetingId) {
  return `${window.location.origin}/meeting/${meetingId}`;
}

// Accepts either a bare ID ("abc-defg-hij") or a full link
// ("http://localhost:5173/meeting/abc-defg-hij") and returns a clean ID,
// or null when the text is not a valid meeting ID/link.
export function parseMeetingInput(input) {
  const text = (input || '').trim();
  if (!text) return null;

  let candidate = text;
  const linkMatch = text.match(/\/meeting\/([^/?#\s]+)/i);
  if (linkMatch) {
    candidate = linkMatch[1];
  }

  candidate = candidate.toLowerCase();
  return isValidMeetingId(candidate) ? candidate : null;
}
