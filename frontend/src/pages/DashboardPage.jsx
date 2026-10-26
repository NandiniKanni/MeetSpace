import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import JoinMeetingForm from '../components/dashboard/JoinMeetingForm';
import MeetingList from '../components/dashboard/MeetingList';
import { useAuth } from '../context/AuthContext';
import { createMeetingId } from '../services/meetingId';
import { getRecentMeetings } from '../services/recentMeetings';

export default function DashboardPage() {
  const { username } = useAuth();
  const navigate = useNavigate();

  // Read the saved meetings once when the page opens
  const [recentMeetings] = useState(() => getRecentMeetings().slice(0, 5));

  // Your backend has no "create meeting" route. A meeting room is created automatically
  // when the first person joins, so we only need a new random ID.
  function startNewMeeting() {
    navigate(`/meeting/${createMeetingId()}`);
  }

  const today = new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="dashboard">
      <header className="page-header">
        <p className="page-eyebrow">{today}</p>
        <h1>Welcome back, {username}</h1>
        <p className="page-subtitle">Start an instant meeting or join one with an ID or link.</p>
      </header>

      <section className="card action-card">
        <div className="action-card-main">
          <h2>Start a meeting</h2>
          <p>Create a private room, then share the link with the people you want to invite.</p>
          <Button size="lg" icon="video" onClick={startNewMeeting}>
            New meeting
          </Button>
        </div>
        <div className="action-card-divider" />
        <JoinMeetingForm />
      </section>

      <section className="card">
        <div className="card-header">
          <h2>Recent meetings</h2>
          {recentMeetings.length > 0 && <Link to="/history">View all</Link>}
        </div>

        {recentMeetings.length === 0 ? (
          <EmptyState
            icon="clock"
            title="No meetings yet"
            description="Meetings you join will show up here so you can jump back in quickly."
          />
        ) : (
          <MeetingList meetings={recentMeetings} />
        )}
        <p className="card-footnote">Recent meetings are saved in this browser only.</p>
      </section>
    </div>
  );
}
