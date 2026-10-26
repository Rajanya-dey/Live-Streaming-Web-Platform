const API_BASE = '/api';

export async function fetchProfile() {
  const res = await fetch(`${API_BASE}/me`);
  if (!res.ok) throw new Error('Failed to fetch profile');
  return res.json();
}

export async function updateProfile(profileData) {
  const res = await fetch(`${API_BASE}/me`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profileData),
  });
  if (!res.ok) throw new Error('Failed to update profile');
  return res.json();
}

export async function fetchStreams() {
  const res = await fetch(`${API_BASE}/streams`);
  if (!res.ok) throw new Error('Failed to fetch streams');
  return res.json();
}

export async function fetchStream(id) {
  const res = await fetch(`${API_BASE}/streams/${id}`);
  if (!res.ok) throw new Error('Failed to fetch stream');
  return res.json();
}

export async function createStream(streamData) {
  const res = await fetch(`${API_BASE}/streams`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(streamData),
  });
  if (!res.ok) throw new Error('Failed to create stream');
  return res.json();
}

export async function stopStream(id) {
  const res = await fetch(`${API_BASE}/streams/${id}/stop`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to stop stream');
  return res.json();
}

export async function fetchMessages(streamId) {
  const res = await fetch(`${API_BASE}/streams/${streamId}/messages`);
  if (!res.ok) throw new Error('Failed to fetch messages');
  return res.json();
}

export async function postMessage(streamId, { text, name, color }) {
  const res = await fetch(`${API_BASE}/streams/${streamId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, name, color }),
  });
  if (!res.ok) throw new Error('Failed to post message');
  return res.json();
}

export async function editMessage(streamId, messageId, text) {
  const res = await fetch(`${API_BASE}/streams/${streamId}/messages/${messageId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error('Failed to edit message');
  return res.json();
}

export async function followCreator(id) {
  const res = await fetch(`${API_BASE}/creators/${id}/follow`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to follow creator');
  return res.json();
}

export async function unfollowCreator(id) {
  const res = await fetch(`${API_BASE}/creators/${id}/follow`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to unfollow creator');
  return res.json();
}

export async function fetchPoll(streamId) {
  const res = await fetch(`${API_BASE}/streams/${streamId}/poll`);
  if (!res.ok) throw new Error('Failed to fetch poll');
  return res.json();
}

export async function createPoll(streamId, { question, options, creatorHandle }) {
  const res = await fetch(`${API_BASE}/streams/${streamId}/poll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, options, creatorHandle }),
  });
  if (!res.ok) throw new Error('Failed to create poll');
  return res.json();
}

export async function votePoll(streamId, { pollId, optionId, userHandle }) {
  const res = await fetch(`${API_BASE}/streams/${streamId}/poll/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pollId, optionId, userHandle }),
  });
  if (!res.ok) throw new Error('Failed to vote in poll');
  return res.json();
}

export async function endPoll(streamId, pollId) {
  const res = await fetch(`${API_BASE}/streams/${streamId}/poll/end`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pollId }),
  });
  if (!res.ok) throw new Error('Failed to end poll');
  return res.json();
}

export async function fetchClips(streamId) {
  const url = streamId ? `${API_BASE}/streams/${streamId}/clips` : `${API_BASE}/clips`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch clips');
  return res.json();
}

export async function createClip(streamId, clipData) {
  const res = await fetch(`${API_BASE}/streams/${streamId}/clips`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(clipData),
  });
  if (!res.ok) throw new Error('Failed to create clip');
  return res.json();
}

export function subscribeStreamEvents(streamId, onMessage, onViewers, onStatus, onMessageEdit, onPoll) {
  const eventSource = new EventSource(`${API_BASE}/streams/${streamId}/events`);

  eventSource.addEventListener('message', (e) => {
    try {
      const data = JSON.parse(e.data);
      if (onMessage) onMessage(data);
    } catch (err) {
      console.error('Failed to parse SSE chat message', err);
    }
  });

  eventSource.addEventListener('message_edited', (e) => {
    try {
      const data = JSON.parse(e.data);
      if (onMessageEdit) onMessageEdit(data);
    } catch (err) {
      console.error('Failed to parse SSE message edit', err);
    }
  });

  eventSource.addEventListener('poll_updated', (e) => {
    try {
      const data = JSON.parse(e.data);
      if (onPoll) onPoll(data);
    } catch (err) {
      console.error('Failed to parse SSE poll update', err);
    }
  });

  eventSource.addEventListener('viewers', (e) => {
    try {
      const data = JSON.parse(e.data);
      if (onViewers) onViewers(data);
    } catch (err) {
      console.error('Failed to parse SSE viewers count', err);
    }
  });

  eventSource.addEventListener('stream_status', (e) => {
    try {
      const data = JSON.parse(e.data);
      if (onStatus) onStatus(data);
    } catch (err) {
      console.error('Failed to parse SSE status', err);
    }
  });

  return () => {
    eventSource.close();
  };
}

export function connectWebSocket(streamId, { onMessage, onViewers, onStatus, onReaction, onTyping, onMessageEdit, onPoll, onOpen, onError }) {
  const isHttps = window.location.protocol === 'https:';
  const protocol = isHttps ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws`;

  let ws = null;
  let isClosed = false;

  function connect() {
    if (isClosed) return;
    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        if (onOpen) onOpen();
        ws.send(JSON.stringify({ type: 'room.join', streamId }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'chat.message' && onMessage) {
            onMessage(msg.data);
          } else if (msg.type === 'chat.edited' && onMessageEdit) {
            onMessageEdit(msg.data);
          } else if (msg.type === 'poll.update' && onPoll) {
            onPoll(msg.data);
          } else if (msg.type === 'presence.update' && onViewers) {
            onViewers(msg);
          } else if (msg.type === 'stream.status' && onStatus) {
            onStatus(msg);
          } else if (msg.type === 'reaction.broadcast' && onReaction) {
            onReaction(msg);
          } else if (msg.type === 'typing.update' && onTyping) {
            onTyping(msg);
          }
        } catch (e) {
          console.error('[WebSocket] Failed to parse incoming message:', e);
        }
      };

      ws.onerror = (err) => {
        if (onError) onError(err);
      };

      ws.onclose = () => {
        if (!isClosed) {
          // Reconnect after 3 seconds if not intentionally closed
          setTimeout(connect, 3000);
        }
      };
    } catch (e) {
      if (onError) onError(e);
    }
  }

  queueMicrotask(connect);

  return {
    sendChat: (text, name, color) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'chat.send',
          streamId,
          text,
          name,
          color,
        }));
        return true;
      }
      return false;
    },
    editChat: (messageId, text) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'chat.edit',
          streamId,
          messageId,
          text,
        }));
        return true;
      }
      return false;
    },
    sendPollCreate: (question, options, creatorHandle) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'poll.create',
          streamId,
          question,
          options,
          creatorHandle,
        }));
        return true;
      }
      return false;
    },
    sendPollVote: (pollId, optionId, userHandle) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'poll.vote',
          streamId,
          pollId,
          optionId,
          userHandle,
        }));
        return true;
      }
      return false;
    },
    sendPollEnd: (pollId) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'poll.end',
          streamId,
          pollId,
        }));
        return true;
      }
      return false;
    },
    sendReaction: (emoji, name) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'reaction.send',
          streamId,
          emoji,
          name,
        }));
        return true;
      }
      return false;
    },
    sendTyping: (isTyping, name, handle) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: isTyping ? 'typing.start' : 'typing.stop',
          streamId,
          name,
          handle,
        }));
        return true;
      }
      return false;
    },
    close: () => {
      isClosed = true;
      if (ws) {
        try {
          ws.close();
        } catch {
          // ignore
        }
      }
    },
  };
}

