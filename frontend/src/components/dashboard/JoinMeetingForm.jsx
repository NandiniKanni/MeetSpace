import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseMeetingInput } from '../../services/meetingId';
import Button from '../Button';

// "Join a meeting": accepts a meeting ID or a full meeting link.
export default function JoinMeetingForm() {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(event) {
    event.preventDefault(); // stop the browser from reloading the page
    const meetingId = parseMeetingInput(input);

    if (!meetingId) {
      setError('Enter a valid meeting ID (like abc-defg-hij) or paste a meeting link.');
      return;
    }
    navigate(`/meeting/${meetingId}`);
  }

  return (
    <form className="join-form" onSubmit={handleSubmit} noValidate>
      <label htmlFor="join-input">Join with a meeting ID or link</label>
      <div className="join-row">
        <input
          id="join-input"
          type="text"
          placeholder="e.g. abc-defg-hij"
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            setError('');
          }}
          aria-invalid={Boolean(error)}
          autoComplete="off"
        />
        <Button type="submit" variant="secondary">
          Join
        </Button>
      </div>
      {error && <p className="field-error">{error}</p>}
    </form>
  );
}
