import { useEffect, useRef, useState } from 'react';
import { ArrowUp, MessageCircle, Smile, Users } from 'lucide-react';
import { initialMessages } from '../data/streams';

export default function ChatPanel({ streamId, viewers }) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState('');
  const list = useRef(null);
  useEffect(() => { setMessages(initialMessages); setDraft(''); }, [streamId]);
  useEffect(() => { if (list.current) list.current.scrollTop = list.current.scrollHeight; }, [messages]);
  function sendMessage(event) {
    event.preventDefault();
    if (!draft.trim()) return;
    setMessages(previous => [...previous, { id: Date.now(), name: 'you', text: draft.trim(), color: 'amber' }]);
    setDraft('');
  }
  return <aside className="chat-panel" aria-label="Live chat demo">
    <div className="chat-heading"><h2><MessageCircle size={17} /> Live chat</h2><span><Users size={13}/>{viewers}</span></div>
    <div className="chat-demo-label"><span className="tiny-dot"/>Local chat preview</div>
    <div className="chat-messages" ref={list} role="log" aria-live="polite" aria-relevant="additions">
      {messages.map(message => <div className={`message ${message.system ? 'system-message' : ''}`} key={message.id}>
        {message.system ? <><span className="system-icon">✦</span><p>{message.text}</p></> : <><span className={`message-name text-${message.color}`}>{message.name}{message.host && <span className="host-label">HOST</span>}</span><p>{message.text}</p></>}
      </div>)}
    </div>
    <form className="chat-form" onSubmit={sendMessage}>
      <div className="chat-input"><input aria-label="Your chat message" placeholder="Say something nice..." value={draft} onChange={event => setDraft(event.target.value)} maxLength={500}/><button type="button" className="emoji-button" aria-label="Add a smile" onClick={() => setDraft(value => `${value} 🙂`.slice(0,500))}><Smile size={18}/></button></div>
      <div className="chat-form-bottom"><span>Make yourself at home.</span><button className="send-button" type="submit" disabled={!draft.trim()} aria-label="Send message"><ArrowUp size={17}/></button></div>
    </form>
  </aside>;
}
