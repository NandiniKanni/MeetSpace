// Your backend has no endpoint that returns meeting history (usercontroller.js only
// exports login and register). So "recent meetings" are remembered in this browser
// using localStorage. They are NOT stored in MongoDB and are not shared across devices.

const STORAGE_KEY = 'meetspace_recent_meetings';
const MAX_MEETINGS = 20;

export function getRecentMeetings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    return [];
  }
}

// Adds a meeting to the top of the list (or moves it to the top if it exists).
export function rememberMeeting(meetingId) {
  try {
    const others = getRecentMeetings().filter((meeting) => meeting.id !== meetingId);
    const updated = [{ id: meetingId, joinedAt: new Date().toISOString() }, ...others].slice(0, MAX_MEETINGS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    // Storage can be blocked (private mode). The app still works without history.
  }
}

export function clearRecentMeetings() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    // ignore
  }
}
