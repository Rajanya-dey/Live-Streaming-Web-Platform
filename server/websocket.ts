import { Server as HttpServer } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { store, ChatMessage } from './store.js';

interface ClientContext {
  ws: WebSocket;
  streamId?: string;
  isAlive: boolean;
}

const roomClients = new Map<string, Set<ClientContext>>();

export function setupWebSocketServer(server: HttpServer) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  function broadcastToRoom(streamId: string, payload: any, excludeWs?: WebSocket) {
    const clients = roomClients.get(streamId);
    if (!clients) return;
    const msg = JSON.stringify(payload);
    clients.forEach(client => {
      if (client.ws !== excludeWs && client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(msg);
        } catch {
          // ignore error
        }
      }
    });
  }

  function updateRoomPresence(streamId: string) {
    const clients = roomClients.get(streamId);
    const stream = store.getStream(streamId);
    if (!stream) return;
    const liveSockets = clients ? clients.size : 0;
    const totalCount = Math.max(1, liveSockets + (stream.viewerCount || 0));
    const formatted = totalCount >= 1000 ? `${(totalCount / 1000).toFixed(1)}k` : `${totalCount}`;

    broadcastToRoom(streamId, {
      type: 'presence.update',
      streamId,
      viewers: formatted,
      count: totalCount,
    });
  }

  wss.on('connection', (ws: WebSocket) => {
    const ctx: ClientContext = { ws, isAlive: true };

    ws.on('pong', () => {
      ctx.isAlive = true;
    });

    ws.on('message', (data: string | Buffer) => {
      try {
        const message = JSON.parse(data.toString());

        switch (message.type) {
          case 'room.join': {
            const { streamId } = message;
            if (!streamId) return;

            // Remove from old room if already in one
            if (ctx.streamId && ctx.streamId !== streamId) {
              const oldSet = roomClients.get(ctx.streamId);
              if (oldSet) {
                oldSet.delete(ctx);
                updateRoomPresence(ctx.streamId);
              }
            }

            ctx.streamId = streamId;
            if (!roomClients.has(streamId)) {
              roomClients.set(streamId, new Set());
            }
            roomClients.get(streamId)!.add(ctx);

            ws.send(JSON.stringify({
              type: 'room.joined',
              streamId,
            }));

            // Sync active poll if present
            const currentPoll = store.getPoll(streamId);
            if (currentPoll) {
              ws.send(JSON.stringify({
                type: 'poll.update',
                streamId,
                data: currentPoll,
              }));
            }

            updateRoomPresence(streamId);
            break;
          }

          case 'chat.send': {
            const { streamId, text, name, color } = message;
            if (!streamId || !text || !text.trim()) return;

            const user = store.getUser();
            const stream = store.getStream(streamId);
            const isHost = stream ? stream.creatorId === user.id || stream.handle === user.handle : false;

            const chatMsg: ChatMessage = store.addMessage(
              streamId,
              text.trim(),
              name || user.handle || 'you',
              color || user.avatarColor || 'amber',
              isHost
            );

            broadcastToRoom(streamId, {
              type: 'chat.message',
              streamId,
              data: chatMsg,
            });
            break;
          }

          case 'chat.edit': {
            const { streamId, messageId, text } = message;
            if (!streamId || !messageId || !text || !text.trim()) return;

            const updated = store.updateMessage(streamId, messageId, text.trim());
            if (updated) {
              broadcastToRoom(streamId, {
                type: 'chat.edited',
                streamId,
                data: updated,
              });
            }
            break;
          }

          case 'poll.create': {
            const { streamId, question, options, creatorHandle } = message;
            if (!streamId || !question || !Array.isArray(options) || options.length < 2) return;

            const poll = store.createPoll(streamId, question, options, creatorHandle || 'arjunbuilds');
            broadcastToRoom(streamId, {
              type: 'poll.update',
              streamId,
              data: poll,
            });
            break;
          }

          case 'poll.vote': {
            const { streamId, pollId, optionId, userHandle } = message;
            if (!streamId || !pollId || !optionId) return;

            const updatedPoll = store.votePoll(streamId, pollId, optionId, userHandle || 'you');
            if (updatedPoll) {
              broadcastToRoom(streamId, {
                type: 'poll.update',
                streamId,
                data: updatedPoll,
              });
            }
            break;
          }

          case 'poll.end': {
            const { streamId, pollId } = message;
            if (!streamId) return;

            const endedPoll = store.endPoll(streamId, pollId);
            if (endedPoll) {
              broadcastToRoom(streamId, {
                type: 'poll.update',
                streamId,
                data: endedPoll,
              });
            }
            break;
          }

          case 'reaction.send': {
            const { streamId, emoji, name } = message;
            if (!streamId || !emoji) return;

            broadcastToRoom(streamId, {
              type: 'reaction.broadcast',
              streamId,
              emoji,
              name: name || 'A viewer',
              id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            });
            break;
          }

          case 'typing.start': {
            const { streamId, name, handle } = message;
            if (!streamId) return;

            broadcastToRoom(streamId, {
              type: 'typing.update',
              streamId,
              name: name || handle || 'A viewer',
              handle: handle || name || 'viewer',
              isTyping: true,
            }, ws);
            break;
          }

          case 'typing.stop': {
            const { streamId, name, handle } = message;
            if (!streamId) return;

            broadcastToRoom(streamId, {
              type: 'typing.update',
              streamId,
              name: name || handle || 'A viewer',
              handle: handle || name || 'viewer',
              isTyping: false,
            }, ws);
            break;
          }

          case 'ping': {
            ws.send(JSON.stringify({ type: 'pong' }));
            break;
          }
        }
      } catch (err) {
        console.error('[WebSocket] Message handling error:', err);
      }
    });

    ws.on('close', () => {
      if (ctx.streamId) {
        const clients = roomClients.get(ctx.streamId);
        if (clients) {
          clients.delete(ctx);
          if (clients.size === 0) {
            roomClients.delete(ctx.streamId);
          }
          updateRoomPresence(ctx.streamId);
        }
      }
    });

    ws.on('error', () => {
      if (ctx.streamId) {
        const clients = roomClients.get(ctx.streamId);
        if (clients) {
          clients.delete(ctx);
          updateRoomPresence(ctx.streamId);
        }
      }
    });
  });

  // Keep-alive heartbeat interval
  const pingInterval = setInterval(() => {
    wss.clients.forEach(ws => {
      const socket = ws as WebSocket;
      if (socket.readyState === WebSocket.OPEN) {
        socket.ping();
      }
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(pingInterval);
  });

  return {
    broadcastStreamStatus: (streamId: string, status: string) => {
      broadcastToRoom(streamId, {
        type: 'stream.status',
        streamId,
        status,
      });
    },
    broadcastChatMessage: (streamId: string, chatMsg: ChatMessage) => {
      broadcastToRoom(streamId, {
        type: 'chat.message',
        streamId,
        data: chatMsg,
      });
    },
  };
}
