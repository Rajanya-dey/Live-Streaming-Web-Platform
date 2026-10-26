import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { ArrowUp, ArrowDown, MessageCircle, Smile, Users, Zap, AtSign, MoreHorizontal, Edit2, Check, X, BarChart2, Pin, ChevronUp, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { initialMessages } from '../data/streams';
import { fetchMessages, postMessage, editMessage, fetchPoll, createPoll, votePoll, endPoll, connectWebSocket, subscribeStreamEvents } from '../services/api';
import ReactionExplosionOverlay, { generateExplosionParticles } from './ReactionExplosionOverlay';

const REACTION_OPTIONS = [
  { emoji: '❤️', label: 'Heart', id: 'heart' },
  { emoji: '🔥', label: 'Fire', id: 'fire' },
  { emoji: '👏', label: 'Clap', id: 'clap' },
  { emoji: '🎉', label: 'Party', id: 'party' },
  { emoji: '🚀', label: 'Rocket', id: 'rocket' },
  { emoji: '💯', label: '100', id: 'hundred' },
];

const KNOWN_CREATORS = [
  { handle: 'arjunbuilds', name: 'Arjun Sharma', role: 'Stream Host', color: 'amber', initials: 'AS' },
  { handle: 'riyadesigns', name: 'Riya Das', role: 'Creator', color: 'violet', initials: 'RD' },
  { handle: 'devexplores', name: 'Dev Patel', role: 'Creator', color: 'cyan', initials: 'DP' },
  { handle: 'snehacodes', name: 'Sneha Roy', role: 'Creator', color: 'green', initials: 'SR' },
];

function renderHighlightedText(text, currentUser) {
  if (!text) return null;
  const parts = text.split(/(@[a-zA-Z0-9_.-]+)/g);
  const currentHandle = currentUser?.handle?.toLowerCase().replace(/^@/, '');

  return parts.map((part, index) => {
    if (part.startsWith('@') && part.length > 1) {
      const mentionTag = part.slice(1).toLowerCase();
      const isCurrentUser = currentHandle && (mentionTag === currentHandle || mentionTag === 'you');

      return (
        <span
          key={index}
          className={`chat-mention ${isCurrentUser ? 'chat-mention-me' : ''}`}
          title={isCurrentUser ? 'You were mentioned in this message' : `Mentioning @${part.slice(1)}`}
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

export default function ChatPanel({ streamId, viewers: defaultViewers, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [liveViewers, setLiveViewers] = useState(defaultViewers);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  // User mention system state
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(null);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);

  // Real-time "User is typing..." state
  const [typingUsers, setTypingUsers] = useState({});
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  // Auto-scroll state
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const list = useRef(null);
  const messagesEndRef = useRef(null);
  const prevMessagesLengthRef = useRef(0);

  // Message Context Menu & Inline Edit state
  const [contextMenuMsgId, setContextMenuMsgId] = useState(null);
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editingText, setEditingText] = useState('');

  // Real-Time Pinned Poll state
  const [poll, setPoll] = useState(null);
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);
  const [isPollCollapsed, setIsPollCollapsed] = useState(false);
  const [newPollQuestion, setNewPollQuestion] = useState('');
  const [newPollOptions, setNewPollOptions] = useState(['', '']);

  // Overlay container lifecycle state for floating particle elements
  const [particles, setParticles] = useState([]);
  const [rings, setRings] = useState([]);

  const [reactionCounts, setReactionCounts] = useState({
    '❤️': 14,
    '🔥': 9,
    '👏': 6,
    '🎉': 4,
    '🚀': 3,
    '💯': 2,
  });

  const wsRef = useRef(null);
  const inputRef = useRef(null);
  const reactionsBarRef = useRef(null);

  // Close context menu on outside click or escape
  useEffect(() => {
    if (!contextMenuMsgId) return;

    function handleGlobalClick(e) {
      if (!e.target.closest('.message-context-menu') && !e.target.closest('.message-action-btn')) {
        setContextMenuMsgId(null);
      }
    }

    function handleGlobalKeyDown(e) {
      if (e.key === 'Escape') {
        setContextMenuMsgId(null);
      }
    }

    document.addEventListener('click', handleGlobalClick);
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      document.removeEventListener('click', handleGlobalClick);
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [contextMenuMsgId]);

  // Determine if a chat message belongs to the current user
  const isOwnMessage = useCallback((message) => {
    if (!message || message.system) return false;
    const currentHandle = currentUser?.handle?.toLowerCase().replace(/^@/, '') || 'you.creator';
    const msgName = (message.name || '').toLowerCase().replace(/^@/, '');
    const currentDisplay = (currentUser?.displayName || '').toLowerCase();
    return (
      msgName === currentHandle ||
      msgName === 'you' ||
      (currentDisplay && msgName === currentDisplay) ||
      (message.sender && currentHandle && message.sender.toLowerCase().replace(/^@/, '') === currentHandle)
    );
  }, [currentUser]);

  // Handle message editing flows
  const handleStartEdit = useCallback((message) => {
    setContextMenuMsgId(null);
    setEditingMsgId(message.id);
    setEditingText(message.text || '');
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingMsgId(null);
    setEditingText('');
  }, []);

  const handleSaveEdit = useCallback((messageId) => {
    const textToSave = editingText.trim();
    if (!textToSave) return;

    setEditingMsgId(null);
    setEditingText('');

    // Optimistically update message in local state
    setMessages(prev =>
      prev.map(m =>
        String(m.id) === String(messageId)
          ? { ...m, text: textToSave, isEdited: true, editedAt: Date.now() }
          : m
      )
    );

    // Broadcast over WebSocket first, fallback to REST
    const sentViaWs = wsRef.current?.editChat(messageId, textToSave);
    if (!sentViaWs) {
      editMessage(streamId, messageId, textToSave).catch(err => {
        console.error('[Chat] Failed to edit message via REST:', err);
      });
    }
  }, [editingText, streamId]);

  // Host role detection
  const isHost = useMemo(() => {
    const handle = (currentUser?.handle || '').toLowerCase().replace(/^@/, '');
    const display = (currentUser?.displayName || '').toLowerCase();
    return (
      handle === 'arjunbuilds' ||
      handle === 'you.creator' ||
      display === 'you' ||
      currentUser?.role === 'Host' ||
      currentUser?.role === 'Stream Host'
    );
  }, [currentUser]);

  // Current user's option choice in active poll
  const userVoteOptionId = useMemo(() => {
    if (!poll || !poll.votedUserIds) return null;
    const currentHandle = currentUser?.handle || 'you.creator';
    return poll.votedUserIds[currentHandle] || null;
  }, [poll, currentUser]);

  // Real-time voting handler
  const handleVoteOption = useCallback((optionId) => {
    if (!poll || !poll.isActive) return;
    const currentHandle = currentUser?.handle || 'you.creator';

    // Optimistically update poll state
    setPoll(prev => {
      if (!prev || !prev.isActive) return prev;
      const prevOptionId = prev.votedUserIds?.[currentHandle];
      if (prevOptionId === optionId) return prev;

      let newTotal = prev.totalVotes;
      if (!prevOptionId) {
        newTotal += 1;
      }

      const updatedOptions = prev.options.map(opt => {
        if (opt.id === optionId) {
          return { ...opt, votes: opt.votes + 1 };
        }
        if (opt.id === prevOptionId && opt.votes > 0) {
          return { ...opt, votes: opt.votes - 1 };
        }
        return opt;
      });

      return {
        ...prev,
        totalVotes: newTotal,
        options: updatedOptions,
        votedUserIds: {
          ...(prev.votedUserIds || {}),
          [currentHandle]: optionId,
        },
      };
    });

    const sentViaWs = wsRef.current?.sendPollVote(poll.id, optionId, currentHandle);
    if (!sentViaWs) {
      votePoll(streamId, { pollId: poll.id, optionId, userHandle: currentHandle }).catch(err => {
        console.error('[Poll] Failed to vote via REST:', err);
      });
    }
  }, [poll, currentUser, streamId]);

  // Host quick poll launch
  const handleCreatePollSubmit = useCallback((e) => {
    e.preventDefault();
    const question = newPollQuestion.trim();
    if (!question) return;

    const filteredOptions = newPollOptions.map(o => o.trim()).filter(o => o.length > 0);
    if (filteredOptions.length < 2) return;

    const hostHandle = currentUser?.handle || 'arjunbuilds';

    const sentViaWs = wsRef.current?.sendPollCreate(question, filteredOptions, hostHandle);
    if (!sentViaWs) {
      createPoll(streamId, { question, options: filteredOptions, creatorHandle: hostHandle })
        .then(created => setPoll(created))
        .catch(err => console.error('[Poll] Failed to create poll via REST:', err));
    }

    setIsCreatingPoll(false);
    setIsPollCollapsed(false);
    setNewPollQuestion('');
    setNewPollOptions(['', '']);
  }, [newPollQuestion, newPollOptions, currentUser, streamId]);

  // Host end poll
  const handleEndPoll = useCallback(() => {
    if (!poll) return;
    const sentViaWs = wsRef.current?.sendPollEnd(poll.id);
    if (!sentViaWs) {
      endPoll(streamId, poll.id)
        .then(ended => setPoll(ended))
        .catch(err => console.error('[Poll] Failed to end poll via REST:', err));
    }
  }, [poll, streamId]);

  // Auto-scroll helper
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    if (list.current) {
      list.current.scrollTo({
        top: list.current.scrollHeight,
        behavior,
      });
      setIsAtBottom(true);
      setUnreadCount(0);
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (!list.current) return;
    const { scrollTop, scrollHeight, clientHeight } = list.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 50;
    setIsAtBottom(atBottom);
    if (atBottom) {
      setUnreadCount(0);
    }
  }, []);

  // Compute active typing participants list
  const activeTypingList = useMemo(() => {
    const now = Date.now();
    return Object.values(typingUsers).filter(u => u.expiresAt > now);
  }, [typingUsers]);

  const typingText = useMemo(() => {
    if (activeTypingList.length === 0) return '';
    if (activeTypingList.length === 1) return `${activeTypingList[0].name} is typing...`;
    if (activeTypingList.length === 2) return `${activeTypingList[0].name} and ${activeTypingList[1].name} are typing...`;
    return `${activeTypingList[0].name} and ${activeTypingList.length - 1} others are typing...`;
  }, [activeTypingList]);

  // Periodic garbage collection for expired typing users
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers(prev => {
        let hasExpired = false;
        const next = {};
        for (const [k, v] of Object.entries(prev)) {
          if (v.expiresAt > now) {
            next[k] = v;
          } else {
            hasExpired = true;
          }
        }
        return hasExpired ? next : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Dynamic room participants collection for @ mentions
  const roomUsers = useMemo(() => {
    const userMap = new Map();

    KNOWN_CREATORS.forEach(u => userMap.set(u.handle.toLowerCase(), u));

    messages.forEach(m => {
      if (m.name && !m.system) {
        const cleanHandle = m.name.replace(/^@/, '');
        const key = cleanHandle.toLowerCase();
        if (!userMap.has(key)) {
          userMap.set(key, {
            handle: cleanHandle,
            name: cleanHandle,
            role: m.host ? 'Host' : 'Viewer',
            color: m.color || 'cyan',
            initials: cleanHandle.slice(0, 2).toUpperCase(),
          });
        }
      }
    });

    if (currentUser?.handle) {
      const userKey = currentUser.handle.toLowerCase().replace(/^@/, '');
      if (!userMap.has(userKey)) {
        userMap.set(userKey, {
          handle: userKey,
          name: currentUser.displayName || userKey,
          role: 'You',
          color: currentUser.avatarColor || 'amber',
          initials: currentUser.initials || 'YO',
        });
      }
    }

    return Array.from(userMap.values());
  }, [messages, currentUser]);

  const filteredSuggestions = useMemo(() => {
    if (!showMentionSuggestions) return [];
    if (!mentionQuery) return roomUsers.slice(0, 6);
    return roomUsers
      .filter(
        u =>
          u.handle.toLowerCase().includes(mentionQuery) ||
          u.name.toLowerCase().includes(mentionQuery)
      )
      .slice(0, 6);
  }, [roomUsers, showMentionSuggestions, mentionQuery]);

  // Trigger particle explosion effect with multiple floating emoji elements
  const triggerParticleExplosion = useCallback((emoji, originX, originY) => {
    let x = originX;
    let y = originY;

    if (x == null || y == null) {
      if (reactionsBarRef.current) {
        const rect = reactionsBarRef.current.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
      } else {
        x = window.innerWidth - 180;
        y = window.innerHeight - 150;
      }
    }

    const { particles: newParticles, ring: newRing } = generateExplosionParticles(emoji, x, y, 16);

    setRings(prev => [...prev.slice(-5), newRing]);
    setParticles(prev => {
      const now = Date.now();
      const active = prev.filter(p => p.expiresAt > now);
      return [...active.slice(-74), ...newParticles];
    });
  }, []);

  // Lifecycle garbage collector for expired floating elements
  useEffect(() => {
    if (particles.length === 0 && rings.length === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      setParticles(prev => prev.filter(p => p.expiresAt > now));
      setRings(prev => prev.filter(r => r.expiresAt > now));
    }, 250);

    return () => clearInterval(interval);
  }, [particles.length, rings.length]);

  useEffect(() => {
    setLiveViewers(defaultViewers);
    let isCancelled = false;

    // 1. Load initial history and active poll from backend REST API
    fetchMessages(streamId)
      .then(msgs => {
        if (!isCancelled && msgs && msgs.length > 0) {
          setMessages(msgs);
        } else if (!isCancelled) {
          setMessages(initialMessages);
        }
      })
      .catch(() => {
        if (!isCancelled) setMessages(initialMessages);
      });

    fetchPoll(streamId)
      .then(activePoll => {
        if (!isCancelled && activePoll) {
          setPoll(activePoll);
        }
      })
      .catch(() => {});

    // 2. Connect primary WebSocket client
    const wsClient = connectWebSocket(streamId, {
      onOpen: () => {
        if (!isCancelled) setWsConnected(true);
      },
      onMessage: (newMsg) => {
        setMessages(prev => {
          if (prev.some(m => String(m.id) === String(newMsg.id))) return prev;
          return [...prev, newMsg];
        });
      },
      onMessageEdit: (editedMsg) => {
        setMessages(prev =>
          prev.map(m => (String(m.id) === String(editedMsg.id) ? { ...m, ...editedMsg } : m))
        );
      },
      onPoll: (updatedPoll) => {
        setPoll(updatedPoll);
      },
      onViewers: (viewerData) => {
        if (viewerData?.viewers) {
          setLiveViewers(viewerData.viewers);
        }
      },
      onReaction: (reactionData) => {
        if (reactionData?.emoji) {
          triggerParticleExplosion(reactionData.emoji);
          setReactionCounts(prev => ({
            ...prev,
            [reactionData.emoji]: (prev[reactionData.emoji] || 0) + 1,
          }));
        }
      },
      onTyping: (typingData) => {
        if (typingData?.handle) {
          setTypingUsers(prev => {
            const next = { ...prev };
            if (typingData.isTyping) {
              next[typingData.handle] = {
                name: typingData.name || typingData.handle,
                handle: typingData.handle,
                expiresAt: Date.now() + 3500,
              };
            } else {
              delete next[typingData.handle];
            }
            return next;
          });
        }
      },
      onError: () => {
        if (!isCancelled) setWsConnected(false);
      },
    });
    wsRef.current = wsClient;

    // 3. Fallback SSE
    const unsubscribeSSE = subscribeStreamEvents(
      streamId,
      (newMsg) => {
        setMessages(prev => {
          if (prev.some(m => String(m.id) === String(newMsg.id))) return prev;
          return [...prev, newMsg];
        });
      },
      (viewerData) => {
        if (viewerData?.viewers) {
          setLiveViewers(viewerData.viewers);
        }
      },
      null,
      (editedMsg) => {
        setMessages(prev =>
          prev.map(m => (String(m.id) === String(editedMsg.id) ? { ...m, ...editedMsg } : m))
        );
      },
      (updatedPoll) => {
        setPoll(updatedPoll);
      }
    );

    return () => {
      isCancelled = true;
      if (wsRef.current) wsRef.current.close();
      unsubscribeSSE();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [streamId, defaultViewers, triggerParticleExplosion]);

  // Chat auto-scroll trigger on messages arrival
  useEffect(() => {
    const isNewMessageArrival = messages.length > prevMessagesLengthRef.current;
    prevMessagesLengthRef.current = messages.length;

    if (isAtBottom) {
      scrollToBottom('smooth');
    } else if (isNewMessageArrival) {
      setUnreadCount(prev => prev + 1);
    }
  }, [messages, isAtBottom, scrollToBottom]);

  // Keep auto-scrolled if typing indicator appears while at bottom
  useEffect(() => {
    if (isAtBottom && activeTypingList.length > 0) {
      scrollToBottom('smooth');
    }
  }, [activeTypingList.length, isAtBottom, scrollToBottom]);

  function handleInputChange(event) {
    const value = event.target.value;
    setDraft(value);

    // Notify typing status over WebSocket
    const currentName = currentUser?.displayName || currentUser?.handle || 'You';
    const currentHandle = currentUser?.handle || 'you';

    if (!isTypingRef.current && value.trim().length > 0) {
      isTypingRef.current = true;
      wsRef.current?.sendTyping(true, currentName, currentHandle);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      wsRef.current?.sendTyping(false, currentName, currentHandle);
    }, 1800);

    const cursor = event.target.selectionStart;
    const textBeforeCursor = value.slice(0, cursor);
    const match = textBeforeCursor.match(/@([a-zA-Z0-9_.-]*)$/);

    if (match) {
      setMentionQuery(match[1].toLowerCase());
      setMentionStartIndex(match.index);
      setShowMentionSuggestions(true);
      setSelectedMentionIndex(0);
    } else {
      setShowMentionSuggestions(false);
      setMentionQuery('');
      setMentionStartIndex(null);
    }
  }

  function insertMention(user) {
    if (mentionStartIndex == null) return;
    const cursor = inputRef.current ? inputRef.current.selectionStart : draft.length;
    const before = draft.slice(0, mentionStartIndex);
    const after = draft.slice(cursor);
    const mentionText = `@${user.handle} `;
    const newDraft = before + mentionText + after;

    setDraft(newDraft);
    setShowMentionSuggestions(false);
    setMentionQuery('');
    setMentionStartIndex(null);

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const nextPos = before.length + mentionText.length;
        inputRef.current.setSelectionRange(nextPos, nextPos);
      }
    }, 10);
  }

  function handleInputKeyDown(event) {
    if (showMentionSuggestions && filteredSuggestions.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedMentionIndex(idx => (idx + 1) % filteredSuggestions.length);
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedMentionIndex(idx => (idx - 1 + filteredSuggestions.length) % filteredSuggestions.length);
        return;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        insertMention(filteredSuggestions[selectedMentionIndex]);
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        setShowMentionSuggestions(false);
        return;
      }
    }
  }

  function handleSendReaction(emoji, event) {
    const senderName = currentUser?.displayName || currentUser?.handle || 'You';

    let originX, originY;
    if (event?.currentTarget) {
      const rect = event.currentTarget.getBoundingClientRect();
      originX = rect.left + rect.width / 2;
      originY = rect.top + rect.height / 2;
    }

    triggerParticleExplosion(emoji, originX, originY);
    wsRef.current?.sendReaction(emoji, senderName);

    setReactionCounts(prev => ({
      ...prev,
      [emoji]: (prev[emoji] || 0) + 1,
    }));
  }

  async function sendMessage(event) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || isSending) return;

    // Immediately stop typing indicator on send
    if (isTypingRef.current) {
      isTypingRef.current = false;
      const currentName = currentUser?.displayName || currentUser?.handle || 'You';
      const currentHandle = currentUser?.handle || 'you';
      wsRef.current?.sendTyping(false, currentName, currentHandle);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }

    setShowMentionSuggestions(false);
    setIsSending(true);
    const senderName = currentUser?.handle || 'you';
    const senderColor = currentUser?.avatarColor || 'amber';

    const sentViaWs = wsRef.current?.sendChat(text, senderName, senderColor);

    if (sentViaWs) {
      setDraft('');
      setIsSending(false);
      scrollToBottom('smooth');
    } else {
      try {
        const created = await postMessage(streamId, {
          text,
          name: senderName,
          color: senderColor,
        });
        setMessages(prev => {
          if (prev.some(m => String(m.id) === String(created.id))) return prev;
          return [...prev, created];
        });
        setDraft('');
        scrollToBottom('smooth');
      } catch {
        setMessages(prev => [
          ...prev,
          { id: Date.now(), name: senderName, text, color: senderColor },
        ]);
        setDraft('');
        scrollToBottom('smooth');
      } finally {
        setIsSending(false);
      }
    }
  }

  return (
    <aside className="chat-panel" aria-label="Live chat" style={{ position: 'relative' }}>
      {/* Screen-Wide Particle Explosion Overlay Container */}
      <ReactionExplosionOverlay particles={particles} rings={rings} />

      <div className="chat-heading">
        <h2>
          <MessageCircle size={17} /> Live chat
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isHost && (
            <button
              type="button"
              className="chat-poll-badge-btn"
              onClick={() => {
                if (poll) {
                  setIsPollCollapsed(prev => !prev);
                } else {
                  setIsCreatingPoll(true);
                }
              }}
              title={poll ? (isPollCollapsed ? 'Expand pinned poll' : 'Minimize pinned poll') : 'Host: Create quick poll'}
            >
              <BarChart2 size={12} />
              <span>{poll ? (poll.isActive ? 'Poll' : 'Ended') : '+ Poll'}</span>
            </button>
          )}

          {/* WebSocket status pill - indicator dot only per screenshot specification */}
          <span
            className="ws-live-indicator"
            title={wsConnected ? 'WebSocket Live' : 'Connecting WebSocket...'}
            aria-label={wsConnected ? 'WebSocket Live' : 'Connecting WebSocket...'}
          >
            <span className="ws-pulse-dot" style={{ background: wsConnected ? '#33c2cc' : '#ffbd39' }} />
          </span>

          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#737b91', fontSize: 10 }}>
            <Users size={12} />
            {liveViewers}
          </span>
        </div>
      </div>

      <div className="chat-demo-label">
        <span className="tiny-dot" />
        <Zap size={11} style={{ color: wsConnected ? 'var(--cyan)' : 'var(--amber)' }} />
        <span>Live room session active</span>
      </div>

      {/* Pinned Real-time Quick Poll for Stream Viewers */}
      {poll && (
        <div className={`pinned-poll-card ${isPollCollapsed ? 'poll-collapsed' : ''}`} aria-label="Pinned stream poll">
          <div className="pinned-poll-header">
            <div className="pinned-poll-badge">
              <Pin size={11} className="poll-pin-icon" />
              <span>PINNED POLL</span>
              {poll.isActive ? (
                <span className="poll-status-live">LIVE</span>
              ) : (
                <span className="poll-status-ended">ENDED</span>
              )}
            </div>

            <div className="pinned-poll-actions">
              <button
                type="button"
                className="poll-collapse-toggle-btn"
                onClick={() => setIsPollCollapsed(prev => !prev)}
                title={isPollCollapsed ? 'Expand poll' : 'Collapse poll'}
                aria-label={isPollCollapsed ? 'Expand poll' : 'Collapse poll'}
              >
                {isPollCollapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
              </button>

              {isHost && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {poll.isActive && (
                    <button
                      type="button"
                      className="poll-end-action-btn"
                      onClick={handleEndPoll}
                      title="End this poll and close voting"
                    >
                      End
                    </button>
                  )}
                  <button
                    type="button"
                    className="poll-new-action-btn"
                    onClick={() => setIsCreatingPoll(true)}
                    title="Launch a new pinned poll"
                  >
                    + New
                  </button>
                </div>
              )}
            </div>
          </div>

          <h3 className="pinned-poll-question">{poll.question}</h3>

          {!isPollCollapsed && (
            <>
              <div className="pinned-poll-options" role="radiogroup" aria-label="Poll choices">
                {poll.options.map(option => {
                  const percent = poll.totalVotes > 0 ? Math.round((option.votes / poll.totalVotes) * 100) : 0;
                  const isVoted = userVoteOptionId === option.id;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="radio"
                      aria-checked={isVoted}
                      className={`poll-option-btn ${isVoted ? 'voted' : ''} ${!poll.isActive ? 'disabled' : ''}`}
                      disabled={!poll.isActive}
                      onClick={() => handleVoteOption(option.id)}
                    >
                      {/* Animated Real-time Progress Fill Bar */}
                      <div
                        className="poll-progress-fill"
                        style={{ width: `${percent}%` }}
                        aria-hidden="true"
                      />
                      <div className="poll-option-content">
                        <div className="poll-option-label">
                          {isVoted && <Check size={12} className="poll-check-icon" />}
                          <span>{option.text}</span>
                        </div>
                        <div className="poll-option-stats">
                          <span className="poll-percent">{percent}%</span>
                          <span className="poll-vote-count">({option.votes})</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pinned-poll-footer">
                <span>{poll.totalVotes.toLocaleString()} votes cast</span>
                <span className="poll-footer-dot">·</span>
                <span>{poll.isActive ? (userVoteOptionId ? 'Vote cast · Click to change' : 'Click option to vote') : 'Voting is closed'}</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Messages Scroll Area with auto-scroll and bottom detector */}
      <div
        className="chat-messages"
        ref={list}
        onScroll={handleScroll}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        style={{ position: 'relative' }}
      >
        {messages.map(message => {
          const isOwn = isOwnMessage(message);
          const isEditingThis = editingMsgId === message.id;
          const isMenuOpen = contextMenuMsgId === message.id;

          if (message.system) {
            return (
              <div className="message system-message" key={message.id}>
                <span className="system-icon">✦</span>
                <p>{renderHighlightedText(message.text, currentUser)}</p>
              </div>
            );
          }

          return (
            <div
              className={`message ${isMenuOpen ? 'has-active-menu' : ''}`}
              key={message.id}
              onContextMenu={(e) => {
                if (isOwn) {
                  e.preventDefault();
                  setContextMenuMsgId(prev => (prev === message.id ? null : message.id));
                }
              }}
            >
              <div className="message-header-row">
                <div className="message-header-meta">
                  <span className={`message-name text-${message.color || 'amber'}`}>
                    {message.name}
                    {message.host && <span className="host-label">HOST</span>}
                  </span>
                  {message.isEdited && (
                    <span
                      className="message-edited-badge"
                      title={
                        message.editedAt
                          ? `Edited at ${new Date(message.editedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}`
                          : 'Edited message'
                      }
                    >
                      (edited)
                    </span>
                  )}
                </div>

                {/* Context menu action trigger for user's own message */}
                {isOwn && (
                  <div className="message-actions">
                    <button
                      type="button"
                      className="message-action-btn"
                      title="Message options (Edit)"
                      aria-label="Message options"
                      aria-haspopup="true"
                      aria-expanded={isMenuOpen}
                      onClick={(e) => {
                        e.stopPropagation();
                        setContextMenuMsgId(prev => (prev === message.id ? null : message.id));
                      }}
                    >
                      <MoreHorizontal size={13} />
                    </button>
                  </div>
                )}
              </div>

              {/* Context Menu Popup with 'Edit' option */}
              {isOwn && isMenuOpen && (
                <div
                  className="message-context-menu"
                  role="menu"
                  aria-label="Message actions"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="context-menu-item edit-item"
                    role="menuitem"
                    onClick={() => handleStartEdit(message)}
                  >
                    <span className="context-menu-item-icon">
                      <Edit2 size={12} />
                    </span>
                    <span>Edit</span>
                    <span className="context-menu-item-shortcut">Esc</span>
                  </button>
                </div>
              )}

              {/* Message text or Inline Edit Form */}
              {isEditingThis ? (
                <div className="message-edit-box" onClick={(e) => e.stopPropagation()}>
                  <textarea
                    className="message-edit-input"
                    rows={2}
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSaveEdit(message.id);
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        e.stopPropagation();
                        handleCancelEdit();
                      }
                    }}
                    autoFocus
                    maxLength={500}
                    aria-label="Edit your message"
                  />
                  <div className="message-edit-actions">
                    <span className="message-edit-hint">Enter to save · Esc to cancel</span>
                    <button
                      type="button"
                      className="message-edit-cancel-btn"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="message-edit-save-btn"
                      disabled={!editingText.trim()}
                      onClick={() => handleSaveEdit(message.id)}
                    >
                      <Check size={11} /> Save
                    </button>
                  </div>
                </div>
              ) : (
                <p>{renderHighlightedText(message.text, currentUser)}</p>
              )}
            </div>
          );
        })}

        <div ref={messagesEndRef} />

        {/* Floating Auto-scroll To Bottom Pill (Only number badge + down arrow, no text) */}
        {!isAtBottom && unreadCount > 0 && (
          <button
            type="button"
            className="chat-scroll-bottom-btn"
            onClick={() => scrollToBottom('smooth')}
            aria-label={`Scroll to newest messages (${unreadCount} unread)`}
          >
            <span className="unread-badge">+{unreadCount}</span>
            <ArrowDown size={11} />
          </button>
        )}
      </div>

      {/* Real-Time "User is typing..." indicator */}
      {typingText && (
        <div className="chat-typing-bar">
          <div className="typing-dots" aria-hidden="true">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </div>
          <span className="typing-names">{typingText}</span>
        </div>
      )}

      <form className="chat-form" onSubmit={sendMessage}>
        {/* Chat Input Field with User Mention Suggestions */}
        <div className="mention-input-wrapper">
          {/* Autocomplete suggestions menu popup */}
          {showMentionSuggestions && filteredSuggestions.length > 0 && (
            <div className="mention-suggestions-menu" role="listbox" aria-label="User mention suggestions">
              <div className="mention-suggestions-header">
                <span>Mention user in room</span>
                <span>↑↓ navigate · Enter to select</span>
              </div>
              {filteredSuggestions.map((user, idx) => (
                <button
                  key={user.handle}
                  type="button"
                  role="option"
                  aria-selected={idx === selectedMentionIndex}
                  className={`mention-suggestion-item ${idx === selectedMentionIndex ? 'active' : ''}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insertMention(user);
                  }}
                  onMouseEnter={() => setSelectedMentionIndex(idx)}
                >
                  <span className={`avatar avatar-${user.color || 'cyan'}`}>{user.initials}</span>
                  <div className="mention-user-info">
                    <span className="mention-user-handle">@{user.handle}</span>
                    <span className="mention-user-role">
                      {user.name !== user.handle ? `${user.name} · ` : ''}
                      {user.role}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="chat-input">
            <input
              ref={inputRef}
              aria-label="Your chat message (type @ to mention a user)"
              placeholder="Say something nice... (type @ to mention)"
              value={draft}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              onBlur={() => {
                if (isTypingRef.current) {
                  isTypingRef.current = false;
                  const currentName = currentUser?.displayName || currentUser?.handle || 'You';
                  const currentHandle = currentUser?.handle || 'you';
                  wsRef.current?.sendTyping(false, currentName, currentHandle);
                }
              }}
              maxLength={500}
            />
            <button
              type="button"
              className="emoji-button"
              aria-label="Add a smile"
              onClick={() => setDraft(value => `${value} 🙂`.slice(0, 500))}
            >
              <Smile size={18} />
            </button>
          </div>
        </div>

        {/* Emoji Reaction Buttons Row Below Input */}
        <div className="chat-reactions-bar" ref={reactionsBarRef} aria-label="Stream emoji reactions">
          <span className="chat-reactions-label">React:</span>
          {REACTION_OPTIONS.map(({ emoji, label, id }) => (
            <button
              key={id}
              type="button"
              className="reaction-button"
              title={`React with ${label} (triggers particle explosion)`}
              onClick={(e) => handleSendReaction(emoji, e)}
            >
              <span>{emoji}</span>
              {reactionCounts[emoji] > 0 && (
                <span className="reaction-count">{reactionCounts[emoji]}</span>
              )}
            </button>
          ))}
        </div>

        {/* Bottom Bar with Status and Send */}
        <div className="chat-form-bottom">
          <span className="chat-shortcuts-indicator" title="Keyboard shortcuts: Press Esc to toggle chat focus, F for full-screen">
            <span className="chat-shortcut-tag"><kbd>Esc</kbd> chat focus</span>
            <span className="chat-shortcut-dot">·</span>
            <span className="chat-shortcut-tag"><kbd>F</kbd> full-screen</span>
          </span>
          <button
            className="send-button"
            type="submit"
            disabled={!draft.trim() || isSending}
            aria-label="Send message"
          >
            <ArrowUp size={17} />
          </button>
        </div>
      </form>

      {/* Host Quick Poll Creation Modal Dialog */}
      {isCreatingPoll && (
        <div className="poll-modal-backdrop" onClick={() => setIsCreatingPoll(false)}>
          <div className="poll-modal-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="poll-modal-title">
            <div className="poll-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChart2 size={16} color="var(--amber)" />
                <strong id="poll-modal-title" style={{ fontSize: 13, color: '#f1f1f6' }}>Create Quick Stream Poll</strong>
              </div>
              <button
                type="button"
                className="poll-modal-close"
                onClick={() => setIsCreatingPoll(false)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreatePollSubmit} className="poll-modal-form">
              <label className="poll-form-label">
                <span>Poll Question</span>
                <input
                  type="text"
                  placeholder="e.g. Which UI layout or feature should we build?"
                  value={newPollQuestion}
                  onChange={(e) => setNewPollQuestion(e.target.value)}
                  maxLength={120}
                  autoFocus
                  required
                />
              </label>

              <div className="poll-form-label">
                <span>Options (Minimum 2)</span>
                {newPollOptions.map((opt, idx) => (
                  <div key={idx} className="poll-option-input-row">
                    <input
                      type="text"
                      placeholder={`Option ${idx + 1}`}
                      value={opt}
                      onChange={(e) => {
                        const next = [...newPollOptions];
                        next[idx] = e.target.value;
                        setNewPollOptions(next);
                      }}
                      maxLength={60}
                      required
                    />
                    {newPollOptions.length > 2 && (
                      <button
                        type="button"
                        className="poll-remove-opt-btn"
                        onClick={() => setNewPollOptions(prev => prev.filter((_, i) => i !== idx))}
                        title="Remove option"
                        aria-label={`Remove option ${idx + 1}`}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}

                {newPollOptions.length < 5 && (
                  <button
                    type="button"
                    className="poll-add-opt-btn"
                    onClick={() => setNewPollOptions(prev => [...prev, ''])}
                  >
                    <Plus size={12} /> Add option
                  </button>
                )}
              </div>

              {/* Quick Preset Templates */}
              <div className="poll-templates-row">
                <span style={{ fontSize: 9, color: '#747c94' }}>Quick Templates:</span>
                <button
                  type="button"
                  className="poll-template-chip"
                  onClick={() => {
                    setNewPollQuestion('Which feature should we build next?');
                    setNewPollOptions(['Collaborative Canvas', 'WebRTC Mesh', 'AI Copilot']);
                  }}
                >
                  Feature ideas
                </button>
                <button
                  type="button"
                  className="poll-template-chip"
                  onClick={() => {
                    setNewPollQuestion('Which design style looks best?');
                    setNewPollOptions(['Dark Glassmorphism', 'Minimalist Clean', 'Neo-Brutalist']);
                  }}
                >
                  Design styling
                </button>
              </div>

              <div className="poll-modal-actions">
                <button
                  type="button"
                  className="poll-cancel-btn"
                  onClick={() => setIsCreatingPoll(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="poll-submit-btn"
                  disabled={!newPollQuestion.trim() || newPollOptions.filter(o => o.trim()).length < 2}
                >
                  <Pin size={12} /> Pin & Launch Poll
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}
