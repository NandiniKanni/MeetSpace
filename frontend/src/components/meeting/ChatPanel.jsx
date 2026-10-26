import { useEffect, useRef, useState } from 'react';
import Icon from '../Icon';
import PanelHeader from './PanelHeader';

// The chat sidebar: message history + a box to type a new message.
export default function ChatPanel({ messages, myId, onSend, onClose }) {
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  // Whenever a new message arrives, scroll to the bottom
  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  function handleSubmit(event) {
    event.preventDefault();
    if (onSend(text)) setText(''); // clear the box only if the message was sent
  }

  return (
    <div className="side-panel-inner">
      <PanelHeader title="Chat" onClose={onClose} />

      <div className="chat-messages">
        {messages.length === 0 ? (
          <p className="panel-empty">No messages yet. Say hello!</p>
        ) : (
          messages.map((message) => {
            const isMine = message.senderId === myId;
            return (
              <div key={message.id} className={`chat-message ${isMine ? 'chat-mine' : ''}`}>
                <span className="chat-sender">{isMine ? 'You' : message.sender || 'Guest'}</span>
                <p className="chat-bubble">{message.text}</p>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form className="chat-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Type a message..."
          maxLength={500}
          aria-label="Message"
        />
        <button type="submit" className="chat-send" disabled={!text.trim()} aria-label="Send message">
          <Icon name="send" size={18} />
        </button>
      </form>
    </div>
  );
}
