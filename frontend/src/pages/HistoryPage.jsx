import { useState } from 'react';
import Button from '../components/Button';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import MeetingList from '../components/dashboard/MeetingList';
import { useToast } from '../context/ToastContext';
import { clearRecentMeetings, getRecentMeetings } from '../services/recentMeetings';

export default function HistoryPage() {
  const { showToast } = useToast();
  const [meetings, setMeetings] = useState(() => getRecentMeetings());
  const [confirmClear, setConfirmClear] = useState(false);

  function handleClear() {
    clearRecentMeetings();
    setMeetings([]);
    setConfirmClear(false);
    showToast('Meeting history cleared.', 'info');
  }

  return (
    <div className="dashboard">
      <header className="page-header page-header-row">
        <div>
          <h1>Recent meetings</h1>
          <p className="page-subtitle">Meetings you joined on this browser.</p>
        </div>
        {meetings.length > 0 && (
          <Button variant="secondary" icon="trash" onClick={() => setConfirmClear(true)}>
            Clear history
          </Button>
        )}
      </header>

      <section className="card">
        {meetings.length === 0 ? (
          <EmptyState
            icon="clock"
            title="Nothing here yet"
            description="When you join a meeting it will be listed here."
          />
        ) : (
          <MeetingList meetings={meetings} />
        )}
        <p className="card-footnote">
          This list is stored in your browser (not in the database), so it is not shared between devices.
        </p>
      </section>

      <ConfirmDialog
        open={confirmClear}
        title="Clear meeting history?"
        message="This removes the list from this browser. It does not affect any meeting."
        confirmLabel="Clear"
        danger
        onConfirm={handleClear}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  );
}
