import fs from 'node:fs';
import path from 'node:path';

export interface UserProfile {
  id: string;
  displayName: string;
  handle: string;
  bio: string;
  avatarColor: string;
  initials: string;
  youtubeConnected: boolean;
  channelTitle?: string;
}

export interface StreamItem {
  id: string;
  title: string;
  creator: string;
  creatorId?: string;
  handle: string;
  initials: string;
  category: string;
  viewers: string;
  viewerCount?: number;
  color: string;
  art: string;
  subtitle: string;
  description: string;
  embedUrl: string | null;
  videoMode?: 'art' | 'camera' | 'youtube';
  status: 'starting' | 'waiting_for_media' | 'live' | 'ending' | 'ended';
  createdAt: number;
}

export interface ChatMessage {
  id: number | string;
  streamId: string;
  name: string;
  text: string;
  color: string;
  system?: boolean;
  host?: boolean;
  isEdited?: boolean;
  editedAt?: number;
  timestamp: number;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  streamId: string;
  question: string;
  options: PollOption[];
  createdBy: string;
  createdAt: number;
  isActive: boolean;
  totalVotes: number;
  votedUserIds?: Record<string, string>; // userHandle -> optionId
}

export interface StreamClip {
  id: string;
  streamId: string;
  title: string;
  duration: string;
  clippedBy: string;
  createdAt: number;
  views: number;
  likes: number;
  art: string;
  embedUrl?: string | null;
  timestampOffset?: string;
}

const defaultClips: StreamClip[] = [
  {
    id: 'clip-1',
    streamId: 'build-with-us',
    title: 'Live WebSocket Handshake Architecture Explained',
    duration: '0:48',
    clippedBy: 'riyadesigns',
    createdAt: Date.now() - 1800000,
    views: 1240,
    likes: 89,
    art: 'studio',
    timestampOffset: '14:20',
  },
  {
    id: 'clip-2',
    streamId: 'build-with-us',
    title: 'Solving CSS Glassmorphism & Particle Explosions',
    duration: '1:15',
    clippedBy: 'devexplores',
    createdAt: Date.now() - 900000,
    views: 890,
    likes: 64,
    art: 'design',
    timestampOffset: '28:45',
  },
  {
    id: 'clip-3',
    streamId: 'build-with-us',
    title: 'Viewer Q&A: Optimizing React State vs WebSocket Events',
    duration: '2:04',
    clippedBy: 'snehacodes',
    createdAt: Date.now() - 300000,
    views: 615,
    likes: 47,
    art: 'code',
    timestampOffset: '41:10',
  },
  {
    id: 'clip-4',
    streamId: 'design-details',
    title: 'Finding the Perfect Typography Hierarchy in Seconds',
    duration: '0:55',
    clippedBy: 'aman.dev',
    createdAt: Date.now() - 3600000,
    views: 1450,
    likes: 112,
    art: 'design',
    timestampOffset: '08:30',
  },
  {
    id: 'clip-5',
    streamId: 'ai-playground',
    title: 'Live Prompt Chaining & Realtime Grounding Demo',
    duration: '1:32',
    clippedBy: 'pixel.panda',
    createdAt: Date.now() - 7200000,
    views: 2180,
    likes: 184,
    art: 'ai',
    timestampOffset: '19:15',
  },
];

const defaultPolls: Poll[] = [
  {
    id: 'poll-1',
    streamId: 'build-with-us',
    question: 'Which feature should we build in next week’s live session?',
    options: [
      { id: 'opt-1', text: 'Real-time Collaborative Canvas', votes: 46 },
      { id: 'opt-2', text: 'WebRTC P2P Video/Audio Mesh', votes: 38 },
      { id: 'opt-3', text: 'AI Agent Live Copilot Dashboard', votes: 29 },
    ],
    createdBy: 'arjunbuilds',
    createdAt: Date.now() - 1200000,
    isActive: true,
    totalVotes: 113,
    votedUserIds: {},
  },
];

const defaultStreams: StreamItem[] = [
  {
    id: 'build-with-us',
    title: 'From idea to interface. Let’s build something.',
    creator: 'Arjun Sharma',
    handle: 'arjunbuilds',
    initials: 'AS',
    category: 'Development',
    viewers: '1.2k',
    viewerCount: 1204,
    color: 'amber',
    art: 'studio',
    subtitle: 'Building a real-time app with React',
    description: 'An idea, a blank canvas, and a little curiosity. Join Arjun as we turn a concept into a working React interface, one component at a time. Ask questions, share ideas, and build along.',
    embedUrl: null,
    videoMode: 'art',
    status: 'live',
    createdAt: Date.now() - 3600000,
  },
  {
    id: 'design-details',
    title: 'Small details. Better interfaces.',
    creator: 'Riya Das',
    handle: 'riyadesigns',
    initials: 'RD',
    category: 'Design',
    viewers: '842',
    viewerCount: 842,
    color: 'violet',
    art: 'design',
    subtitle: 'A live UI design session',
    description: 'Exploring typography, layout, and all the little details that make an interface feel right. Bring your design questions and follow along.',
    embedUrl: null,
    videoMode: 'art',
    status: 'live',
    createdAt: Date.now() - 2400000,
  },
  {
    id: 'ai-playground',
    title: 'Inside the AI playground',
    creator: 'Dev Patel',
    handle: 'devexplores',
    initials: 'DP',
    category: 'AI & ML',
    viewers: '628',
    viewerCount: 628,
    color: 'cyan',
    art: 'ai',
    subtitle: 'Experiments, ideas, and a little machine learning',
    description: 'A friendly exploration of machine learning concepts with practical examples. Learn together and discuss what we can build next.',
    embedUrl: null,
    videoMode: 'art',
    status: 'live',
    createdAt: Date.now() - 1800000,
  },
  {
    id: 'late-night-code',
    title: 'Late night code & good company',
    creator: 'Sneha Roy',
    handle: 'snehacodes',
    initials: 'SR',
    category: 'Development',
    viewers: '356',
    viewerCount: 356,
    color: 'green',
    art: 'code',
    subtitle: 'A relaxed coding session',
    description: 'Settle in for a relaxed frontend coding session. Work on your own project, ask a question, or just enjoy the company.',
    embedUrl: null,
    videoMode: 'art',
    status: 'live',
    createdAt: Date.now() - 900000,
  },
];

const defaultMessages: ChatMessage[] = [
  { id: 1, streamId: 'build-with-us', name: 'Streamspace', text: 'Welcome in! Be kind, stay curious, and enjoy the session.', color: 'cyan', system: true, timestamp: Date.now() - 300000 },
  { id: 2, streamId: 'build-with-us', name: 'riya.designs', text: 'That setup is such a vibe ✨', color: 'violet', timestamp: Date.now() - 240000 },
  { id: 3, streamId: 'build-with-us', name: 'dev.exe', text: 'React + late night coffee = perfect combo', color: 'cyan', timestamp: Date.now() - 180000 },
  { id: 4, streamId: 'build-with-us', name: 'sneha.codes', text: 'Hey everyone! 👋', color: 'green', timestamp: Date.now() - 120000 },
  { id: 5, streamId: 'build-with-us', name: 'arjunbuilds', text: 'Glad you’re all here. Let’s make something cool!', color: 'amber', host: true, timestamp: Date.now() - 60000 },
  { id: 6, streamId: 'build-with-us', name: 'pixel.panda', text: 'Can you explain the component structure?', color: 'pink', timestamp: Date.now() - 30000 },
  { id: 7, streamId: 'build-with-us', name: 'aman.dev', text: 'Building along with you 🚀', color: 'cyan', timestamp: Date.now() - 10000 },
  { id: 8, streamId: 'build-with-us', name: 'you.creator', text: 'Loving the real-time chat setup! 💫', color: 'amber', timestamp: Date.now() - 5000 },
];

class BackendStore {
  private user: UserProfile = {
    id: 'user_current',
    displayName: 'You',
    handle: 'you.creator',
    bio: 'Curious creator and developer building with the Streamspace community.',
    avatarColor: 'amber',
    initials: 'YO',
    youtubeConnected: false,
    channelTitle: 'Your YouTube Channel',
  };

  private follows: Set<string> = new Set();
  private streams: Map<string, StreamItem> = new Map();
  private messages: ChatMessage[] = [];
  private polls: Map<string, Poll> = new Map();
  private clips: StreamClip[] = [];
  private dataFilePath: string;

  constructor() {
    this.dataFilePath = path.join(process.cwd(), '.data', 'store.json');
    this.initData();
  }

  private initData() {
    try {
      if (fs.existsSync(this.dataFilePath)) {
        const raw = fs.readFileSync(this.dataFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.user) this.user = parsed.user;
        if (Array.isArray(parsed.follows)) this.follows = new Set(parsed.follows);
        if (Array.isArray(parsed.streams)) {
          parsed.streams.forEach((s: StreamItem) => this.streams.set(s.id, s));
        }
        if (Array.isArray(parsed.messages)) {
          this.messages = parsed.messages;
        }
        if (Array.isArray(parsed.clips)) {
          this.clips = parsed.clips;
        } else {
          this.clips = [...defaultClips];
        }
        if (Array.isArray(parsed.polls)) {
          parsed.polls.forEach((p: Poll) => this.polls.set(p.streamId, p));
        } else {
          defaultPolls.forEach(p => this.polls.set(p.streamId, { ...p }));
        }
        return;
      }
    } catch {
      // Fallback to defaults
    }

    // Default initialization
    defaultStreams.forEach(s => this.streams.set(s.id, { ...s }));
    this.messages = [...defaultMessages];
    this.clips = [...defaultClips];
    defaultPolls.forEach(p => this.polls.set(p.streamId, { ...p }));
    this.saveData();
  }

  private saveData() {
    try {
      const dir = path.dirname(this.dataFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(
        this.dataFilePath,
        JSON.stringify(
          {
            user: this.user,
            follows: Array.from(this.follows),
            streams: Array.from(this.streams.values()),
            messages: this.messages,
            clips: this.clips,
            polls: Array.from(this.polls.values()),
          },
          null,
          2
        )
      );
    } catch {
      // Ignore disk persistence errors in read-only setups
    }
  }

  getUser(): UserProfile {
    return { ...this.user };
  }

  updateUser(updates: Partial<UserProfile>): UserProfile {
    this.user = { ...this.user, ...updates };
    if (updates.displayName) {
      const words = updates.displayName.trim().split(/\s+/);
      this.user.initials = words.length > 1
        ? (words[0][0] + words[1][0]).toUpperCase()
        : updates.displayName.slice(0, 2).toUpperCase();
    }
    this.saveData();
    return { ...this.user };
  }

  getFollows(): string[] {
    return Array.from(this.follows);
  }

  follow(streamOrCreatorId: string): boolean {
    this.follows.add(streamOrCreatorId);
    this.saveData();
    return true;
  }

  unfollow(streamOrCreatorId: string): boolean {
    const deleted = this.follows.delete(streamOrCreatorId);
    this.saveData();
    return deleted;
  }

  getAllStreams(): StreamItem[] {
    return Array.from(this.streams.values()).filter(s => s.status !== 'ended');
  }

  getStream(id: string): StreamItem | undefined {
    return this.streams.get(id);
  }

  createStream(streamData: {
    title: string;
    description: string;
    category: string;
    subtitle?: string;
    embedUrl?: string | null;
    videoMode?: 'art' | 'camera' | 'youtube';
    art?: string;
  }): StreamItem {
    const id = 'stream-' + Date.now().toString(36);
    const newStream: StreamItem = {
      id,
      title: streamData.title,
      description: streamData.description || 'Welcome to the live session! Grab a seat and say hello.',
      category: streamData.category || 'Development',
      subtitle: streamData.subtitle || 'Broadcasting live on Streamspace',
      creator: this.user.displayName,
      creatorId: this.user.id,
      handle: this.user.handle,
      initials: this.user.initials,
      color: this.user.avatarColor,
      viewers: '1',
      viewerCount: 1,
      art: streamData.art || 'studio',
      embedUrl: streamData.embedUrl || null,
      videoMode: streamData.videoMode || 'camera',
      status: 'live',
      createdAt: Date.now(),
    };

    this.streams.set(id, newStream);

    // Initial system chat message
    this.messages.push({
      id: Date.now(),
      streamId: id,
      name: 'Streamspace',
      text: `Stream started: "${newStream.title}". Be kind, stay curious, and enjoy the session!`,
      color: 'cyan',
      system: true,
      timestamp: Date.now(),
    });

    this.saveData();
    return newStream;
  }

  stopStream(id: string): boolean {
    const stream = this.streams.get(id);
    if (!stream) return false;
    stream.status = 'ended';
    this.saveData();
    return true;
  }

  getMessages(streamId: string): ChatMessage[] {
    return this.messages.filter(m => m.streamId === streamId);
  }

  addMessage(streamId: string, text: string, senderName?: string, senderColor?: string, isHost = false): ChatMessage {
    const msg: ChatMessage = {
      id: Date.now() + Math.random().toString(36).slice(2, 6),
      streamId,
      name: senderName || this.user.handle || 'you',
      text,
      color: senderColor || this.user.avatarColor || 'amber',
      host: isHost,
      timestamp: Date.now(),
    };
    this.messages.push(msg);

    // Keep message history within reasonable limits (e.g. 1000 messages)
    if (this.messages.length > 1000) {
      this.messages = this.messages.slice(-500);
    }

    this.saveData();
    return msg;
  }

  updateMessage(streamId: string, messageId: string | number, newText: string): ChatMessage | null {
    const msg = this.messages.find(m => String(m.id) === String(messageId) && m.streamId === streamId);
    if (!msg) return null;
    msg.text = newText;
    msg.isEdited = true;
    msg.editedAt = Date.now();
    this.saveData();
    return msg;
  }

  // Polls
  getPoll(streamId: string): Poll | null {
    const poll = this.polls.get(streamId);
    return poll || null;
  }

  createPoll(streamId: string, question: string, optionTexts: string[], creatorHandle = 'arjunbuilds'): Poll {
    const poll: Poll = {
      id: `poll_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      streamId,
      question: question.trim(),
      options: optionTexts.filter(t => t.trim().length > 0).map((text, idx) => ({
        id: `opt-${idx + 1}-${Date.now()}`,
        text: text.trim(),
        votes: 0,
      })),
      createdBy: creatorHandle,
      createdAt: Date.now(),
      isActive: true,
      totalVotes: 0,
      votedUserIds: {},
    };
    this.polls.set(streamId, poll);
    this.saveData();
    return poll;
  }

  votePoll(streamId: string, pollId: string, optionId: string, userHandle = 'you'): Poll | null {
    const poll = this.polls.get(streamId);
    if (!poll || poll.id !== pollId || !poll.isActive) return null;

    if (!poll.votedUserIds) poll.votedUserIds = {};
    const previousVoteOptionId = poll.votedUserIds[userHandle];

    // If user already voted for this option, no-op
    if (previousVoteOptionId === optionId) {
      return poll;
    }

    // If user previously voted for a different option, decrement previous
    if (previousVoteOptionId) {
      const prevOpt = poll.options.find(o => o.id === previousVoteOptionId);
      if (prevOpt && prevOpt.votes > 0) {
        prevOpt.votes -= 1;
      }
    } else {
      poll.totalVotes += 1;
    }

    const opt = poll.options.find(o => o.id === optionId);
    if (opt) {
      opt.votes += 1;
      poll.votedUserIds[userHandle] = optionId;
    }

    this.saveData();
    return poll;
  }

  endPoll(streamId: string, pollId?: string): Poll | null {
    const poll = this.polls.get(streamId);
    if (!poll) return null;
    if (pollId && poll.id !== pollId) return null;

    poll.isActive = false;
    this.saveData();
    return poll;
  }

  // Clips
  getClips(streamId?: string): StreamClip[] {
    if (streamId) {
      return this.clips.filter(c => c.streamId === streamId);
    }
    return this.clips;
  }

  createClip(streamId: string, clipData: { title: string; duration?: string; clippedBy?: string; art?: string; timestampOffset?: string }): StreamClip {
    const clip: StreamClip = {
      id: `clip-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      streamId,
      title: clipData.title.trim(),
      duration: clipData.duration || '0:45',
      clippedBy: clipData.clippedBy || this.user.displayName || 'You',
      createdAt: Date.now(),
      views: 1,
      likes: 1,
      art: clipData.art || 'studio',
      timestampOffset: clipData.timestampOffset || '00:00',
    };
    this.clips.unshift(clip);
    this.saveData();
    return clip;
  }
}

export const store = new BackendStore();
