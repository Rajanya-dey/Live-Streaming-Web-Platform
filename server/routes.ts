import { Router, Request, Response } from 'express';
import { store, ChatMessage } from './store.js';

export const apiRouter = Router();

// Store active SSE connections per stream ID
type SSEClient = {
  id: string;
  res: Response;
};
const streamClients = new Map<string, Set<SSEClient>>();

function broadcastToStream(streamId: string, event: string, data: any) {
  const clients = streamClients.get(streamId);
  if (!clients) return;
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  clients.forEach(client => {
    try {
      client.res.write(payload);
    } catch {
      // client disconnected
    }
  });
}

function updateViewerCount(streamId: string) {
  const clients = streamClients.get(streamId);
  const stream = store.getStream(streamId);
  if (!stream) return;
  const activeCount = Math.max(1, (clients ? clients.size : 0) + (stream.viewerCount || 0));
  const formatted = activeCount >= 1000 ? `${(activeCount / 1000).toFixed(1)}k` : `${activeCount}`;
  broadcastToStream(streamId, 'viewers', { viewers: formatted, count: activeCount });
}

// -------------------------------------------------------------
// USER & PROFILE
// -------------------------------------------------------------
apiRouter.get('/me', (_req: Request, res: Response) => {
  const user = store.getUser();
  const follows = store.getFollows();
  res.json({ ...user, follows });
});

apiRouter.patch('/me', (req: Request, res: Response) => {
  const { displayName, handle, bio, avatarColor } = req.body;
  const updated = store.updateUser({ displayName, handle, bio, avatarColor });
  res.json(updated);
});

// -------------------------------------------------------------
// FOLLOWING
// -------------------------------------------------------------
apiRouter.get('/following', (_req: Request, res: Response) => {
  res.json({ following: store.getFollows() });
});

apiRouter.post('/creators/:id/follow', (req: Request, res: Response) => {
  const { id } = req.params;
  store.follow(id);
  res.json({ success: true, id, isFollowing: true });
});

apiRouter.delete('/creators/:id/follow', (req: Request, res: Response) => {
  const { id } = req.params;
  store.unfollow(id);
  res.json({ success: true, id, isFollowing: false });
});

// -------------------------------------------------------------
// STREAMS
// -------------------------------------------------------------
apiRouter.get('/streams', (_req: Request, res: Response) => {
  const streams = store.getAllStreams();
  res.json(streams);
});

apiRouter.get('/streams/:id', (req: Request, res: Response) => {
  const stream = store.getStream(req.params.id);
  if (!stream) {
    res.status(404).json({ error: 'Stream not found' });
    return;
  }
  res.json(stream);
});

apiRouter.post('/streams', (req: Request, res: Response) => {
  const { title, description, category, subtitle, embedUrl, videoMode, art } = req.body;
  if (!title || !title.trim()) {
    res.status(400).json({ error: 'Title is required' });
    return;
  }

  const stream = store.createStream({
    title: title.trim(),
    description,
    category,
    subtitle,
    embedUrl,
    videoMode,
    art,
  });

  res.status(201).json(stream);
});

apiRouter.post('/streams/:id/stop', (req: Request, res: Response) => {
  const { id } = req.params;
  const stopped = store.stopStream(id);
  if (!stopped) {
    res.status(404).json({ error: 'Stream not found' });
    return;
  }
  broadcastToStream(id, 'stream_status', { status: 'ended' });
  res.json({ success: true, status: 'ended' });
});

apiRouter.post('/streams/:id/relay-session', (req: Request, res: Response) => {
  const stream = store.getStream(req.params.id);
  if (!stream) {
    res.status(404).json({ error: 'Stream not found' });
    return;
  }
  // Issued owner relay session token for media upload / encoder feed
  res.json({
    sessionId: `relay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    streamId: stream.id,
    expiresAt: Date.now() + 3600000,
    ingestProtocol: 'WebRTC / WebSocket Ingest',
  });
});

// -------------------------------------------------------------
// CHAT & REAL-TIME
// -------------------------------------------------------------
apiRouter.get('/streams/:id/messages', (req: Request, res: Response) => {
  const messages = store.getMessages(req.params.id);
  res.json(messages);
});

apiRouter.post('/streams/:id/messages', (req: Request, res: Response) => {
  const { text, name, color } = req.body;
  if (!text || !text.trim()) {
    res.status(400).json({ error: 'Message text cannot be empty' });
    return;
  }

  const user = store.getUser();
  const stream = store.getStream(req.params.id);
  const isHost = stream ? stream.creatorId === user.id || stream.handle === user.handle : false;

  const message: ChatMessage = store.addMessage(
    req.params.id,
    text.trim(),
    name || user.handle || 'you',
    color || user.avatarColor || 'amber',
    isHost
  );

  broadcastToStream(req.params.id, 'message', message);
  res.status(201).json(message);
});

apiRouter.patch('/streams/:id/messages/:messageId', (req: Request, res: Response) => {
  const { id, messageId } = req.params;
  const { text } = req.body;
  if (!text || !text.trim()) {
    res.status(400).json({ error: 'Message text cannot be empty' });
    return;
  }

  const updated = store.updateMessage(id, messageId, text.trim());
  if (!updated) {
    res.status(404).json({ error: 'Message not found' });
    return;
  }

  broadcastToStream(id, 'message_edited', updated);
  res.json(updated);
});

// -------------------------------------------------------------
// LIVE POLLS
// -------------------------------------------------------------
apiRouter.get('/streams/:id/poll', (req: Request, res: Response) => {
  const poll = store.getPoll(req.params.id);
  res.json(poll);
});

apiRouter.post('/streams/:id/poll', (req: Request, res: Response) => {
  const { question, options, creatorHandle } = req.body;
  if (!question || !question.trim()) {
    res.status(400).json({ error: 'Question is required' });
    return;
  }
  if (!Array.isArray(options) || options.length < 2) {
    res.status(400).json({ error: 'At least 2 options are required' });
    return;
  }

  const user = store.getUser();
  const poll = store.createPoll(
    req.params.id,
    question,
    options,
    creatorHandle || user.handle || 'you.creator'
  );

  broadcastToStream(req.params.id, 'poll_updated', poll);
  res.status(201).json(poll);
});

apiRouter.post('/streams/:id/poll/vote', (req: Request, res: Response) => {
  const { pollId, optionId, userHandle } = req.body;
  if (!pollId || !optionId) {
    res.status(400).json({ error: 'pollId and optionId are required' });
    return;
  }

  const user = store.getUser();
  const updatedPoll = store.votePoll(
    req.params.id,
    pollId,
    optionId,
    userHandle || user.handle || 'you'
  );

  if (!updatedPoll) {
    res.status(404).json({ error: 'Active poll not found or voting ended' });
    return;
  }

  broadcastToStream(req.params.id, 'poll_updated', updatedPoll);
  res.json(updatedPoll);
});

apiRouter.post('/streams/:id/poll/end', (req: Request, res: Response) => {
  const { pollId } = req.body;
  const endedPoll = store.endPoll(req.params.id, pollId);
  if (!endedPoll) {
    res.status(404).json({ error: 'Poll not found' });
    return;
  }

  broadcastToStream(req.params.id, 'poll_updated', endedPoll);
  res.json(endedPoll);
});

// -------------------------------------------------------------
// STREAM HIGHLIGHTED CLIPS
// -------------------------------------------------------------
apiRouter.get('/streams/:id/clips', (req: Request, res: Response) => {
  const clips = store.getClips(req.params.id);
  res.json(clips);
});

apiRouter.post('/streams/:id/clips', (req: Request, res: Response) => {
  const { title, duration, clippedBy, art, timestampOffset } = req.body;
  if (!title || !title.trim()) {
    res.status(400).json({ error: 'Clip title is required' });
    return;
  }

  const user = store.getUser();
  const clip = store.createClip(req.params.id, {
    title,
    duration,
    clippedBy: clippedBy || user.displayName || user.handle || 'You',
    art,
    timestampOffset,
  });

  res.status(201).json(clip);
});

// SSE endpoint for live updates
apiRouter.get('/streams/:id/events', (req: Request, res: Response) => {
  const streamId = req.params.id;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const clientId = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const client: SSEClient = { id: clientId, res };

  if (!streamClients.has(streamId)) {
    streamClients.set(streamId, new Set());
  }
  streamClients.get(streamId)!.add(client);

  // Send initial connect handshake
  res.write(`event: connected\ndata: ${JSON.stringify({ clientId, streamId })}\n\n`);
  updateViewerCount(streamId);

  // Heartbeat ping every 25 seconds
  const pingInterval = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(pingInterval);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(pingInterval);
    const clients = streamClients.get(streamId);
    if (clients) {
      clients.delete(client);
      if (clients.size === 0) {
        streamClients.delete(streamId);
      }
    }
    updateViewerCount(streamId);
  });
});
