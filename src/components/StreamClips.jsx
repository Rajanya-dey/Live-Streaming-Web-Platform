import { useState, useEffect, useMemo } from 'react';
import { Play, Scissors, Heart, Share2, Clock, Eye, Sparkles, X, Check, Flame, ArrowUpDown } from 'lucide-react';
import Artwork from './Artwork';
import { fetchClips, createClip } from '../services/api';

const DEFAULT_CLIPS = [
  {
    id: 'clip-1',
    streamId: 'build-with-us',
    title: 'Live WebSocket Handshake Architecture Explained',
    duration: '0:48',
    clippedBy: 'Riya Das',
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
    clippedBy: 'Dev Patel',
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
    clippedBy: 'Sneha Roy',
    createdAt: Date.now() - 300000,
    views: 615,
    likes: 47,
    art: 'code',
    timestampOffset: '41:10',
  },
  {
    id: 'clip-4',
    streamId: 'build-with-us',
    title: 'Real-time Mention Tagging & Auto-scroll Implementation',
    duration: '0:55',
    clippedBy: 'Aman Sharma',
    createdAt: Date.now() - 3600000,
    views: 1450,
    likes: 112,
    art: 'ai',
    timestampOffset: '52:18',
  },
];

export default function StreamClips({ streamId, streamTitle, streamArt = 'studio', currentUser }) {
  const [clips, setClips] = useState(DEFAULT_CLIPS);
  const [sortBy, setSortBy] = useState('recent'); // 'recent' | 'views' | 'likes'
  const [activeClip, setActiveClip] = useState(null);
  const [isCreatingClip, setIsCreatingClip] = useState(false);
  const [newClipTitle, setNewClipTitle] = useState('');
  const [newClipDuration, setNewClipDuration] = useState('0:45');
  const [likedClips, setLikedClips] = useState(new Set());
  const [copiedClipId, setCopiedClipId] = useState(null);

  // Compute sorted clips whenever clips or sortBy changes
  const sortedClips = useMemo(() => {
    return [...clips].sort((a, b) => {
      if (sortBy === 'recent') {
        const timeA = typeof a.createdAt === 'number' ? a.createdAt : new Date(a.createdAt || 0).getTime();
        const timeB = typeof b.createdAt === 'number' ? b.createdAt : new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      }
      if (sortBy === 'views') {
        return (Number(b.views) || 0) - (Number(a.views) || 0);
      }
      if (sortBy === 'likes') {
        return (Number(b.likes) || 0) - (Number(a.likes) || 0);
      }
      return 0;
    });
  }, [clips, sortBy]);

  useEffect(() => {
    let isMounted = true;
    fetchClips(streamId)
      .then(res => {
        if (isMounted && res && Array.isArray(res) && res.length > 0) {
          setClips(res);
        }
      })
      .catch(() => {
        // Fallback to default clips
      });

    return () => {
      isMounted = false;
    };
  }, [streamId]);

  const handleLike = (clipId, e) => {
    e.stopPropagation();
    setLikedClips(prev => {
      const next = new Set(prev);
      const isLiked = next.has(clipId);
      if (isLiked) {
        next.delete(clipId);
      } else {
        next.add(clipId);
      }
      return next;
    });

    setClips(prev =>
      prev.map(c => {
        if (c.id === clipId) {
          const isLiked = likedClips.has(clipId);
          return { ...c, likes: isLiked ? Math.max(0, c.likes - 1) : c.likes + 1 };
        }
        return c;
      })
    );
  };

  const handleShare = (clip, e) => {
    e.stopPropagation();
    const clipUrl = `${window.location.origin}${window.location.pathname}#clip-${clip.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(clipUrl).then(() => {
        setCopiedClipId(clip.id);
        setTimeout(() => setCopiedClipId(null), 2000);
      });
    }
  };

  const handleCreateClipSubmit = async (e) => {
    e.preventDefault();
    if (!newClipTitle.trim()) return;

    const clipData = {
      title: newClipTitle.trim(),
      duration: newClipDuration,
      clippedBy: currentUser?.displayName || currentUser?.handle || 'You',
      art: streamArt,
      timestampOffset: `${Math.floor(Math.random() * 45) + 10}:${Math.floor(Math.random() * 50) + 10}`,
    };

    try {
      const created = await createClip(streamId, clipData);
      setClips(prev => [created, ...prev]);
    } catch {
      const localClip = {
        id: `clip-${Date.now()}`,
        streamId,
        ...clipData,
        createdAt: Date.now(),
        views: 1,
        likes: 1,
      };
      setClips(prev => [localClip, ...prev]);
    }

    setNewClipTitle('');
    setIsCreatingClip(false);
  };

  return (
    <div className="stream-clips-section">
      <div className="clips-section-header">
        <div className="clips-header-title">
          <div className="clips-title-badge">
            <Flame size={13} color="var(--amber)" />
            <span>HIGHLIGHTED MOMENTS</span>
          </div>
          <h3>Stream Highlights & Clips</h3>
          <p>Key insights, code walkthroughs, and favorite community moments from this session.</p>
        </div>
        <button
          type="button"
          className="create-clip-button"
          onClick={() => setIsCreatingClip(true)}
          title="Clip the last 30-60 seconds of this live stream"
        >
          <Scissors size={14} />
          <span>Clip Highlight</span>
        </button>
      </div>

      {/* Filter and Sort Bar */}
      <div className="clips-toolbar">
        <div className="clips-filter-group">
          <div className="clips-sort-label">
            <ArrowUpDown size={12} />
            <span>Sort by:</span>
          </div>

          <div className="clips-filter-buttons" role="group" aria-label="Sort clips">
            <button
              type="button"
              className={`clip-filter-btn ${sortBy === 'recent' ? 'active' : ''}`}
              onClick={() => setSortBy('recent')}
            >
              <Clock size={11} />
              <span>Most Recent</span>
            </button>
            <button
              type="button"
              className={`clip-filter-btn ${sortBy === 'views' ? 'active' : ''}`}
              onClick={() => setSortBy('views')}
            >
              <Eye size={11} />
              <span>Most Viewed</span>
            </button>
            <button
              type="button"
              className={`clip-filter-btn ${sortBy === 'likes' ? 'active' : ''}`}
              onClick={() => setSortBy('likes')}
            >
              <Heart size={11} />
              <span>Most Liked</span>
            </button>
          </div>
        </div>

        <div className="clips-toolbar-right">
          <div className="clips-sort-select-wrapper">
            <select
              className="clips-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort clips dropdown"
            >
              <option value="recent">Most Recent</option>
              <option value="views">Most Viewed</option>
              <option value="likes">Most Liked</option>
            </select>
          </div>
          <span className="clips-count-pill">
            {sortedClips.length} {sortedClips.length === 1 ? 'clip' : 'clips'}
          </span>
        </div>
      </div>

      {/* Clips Grid */}
      {sortedClips.length === 0 ? (
        <div className="clips-empty-state">
          <p>No clips found. Be the first to clip a highlight moment!</p>
        </div>
      ) : (
        <div className="clips-grid">
          {sortedClips.map(clip => {
          const isLiked = likedClips.has(clip.id);
          const isCopied = copiedClipId === clip.id;

          return (
            <div
              key={clip.id}
              className="clip-card"
              onClick={() => setActiveClip(clip)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setActiveClip(clip);
              }}
            >
              <div className="clip-thumbnail-wrapper">
                <Artwork variant={clip.art || streamArt} />
                <div className="clip-thumb-overlay" />
                <div className="clip-play-badge">
                  <Play size={16} fill="currentColor" />
                </div>
                <span className="clip-duration-badge">
                  <Clock size={10} />
                  {clip.duration}
                </span>
                {clip.timestampOffset && (
                  <span className="clip-timestamp-badge">
                    @{clip.timestampOffset}
                  </span>
                )}
              </div>

              <div className="clip-card-details">
                <h4 className="clip-card-title">{clip.title}</h4>
                <div className="clip-card-meta">
                  <span>Clipped by {clip.clippedBy}</span>
                  <span className="clip-dot">·</span>
                  <span className="clip-views">
                    <Eye size={11} /> {(clip.views || 0).toLocaleString()}
                  </span>
                </div>

                <div className="clip-card-footer">
                  <button
                    type="button"
                    className={`clip-action-icon-btn ${isLiked ? 'liked' : ''}`}
                    onClick={(e) => handleLike(clip.id, e)}
                    title={isLiked ? 'Unlike clip' : 'Like clip'}
                  >
                    <Heart size={12} fill={isLiked ? 'currentColor' : 'none'} />
                    <span>{clip.likes ?? 0}</span>
                  </button>
                  <button
                    type="button"
                    className="clip-action-icon-btn"
                    onClick={(e) => handleShare(clip, e)}
                    title="Copy clip link"
                  >
                    {isCopied ? <Check size={12} color="var(--cyan)" /> : <Share2 size={12} />}
                    <span>{isCopied ? 'Copied' : 'Share'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )}

      {/* Clip Playback Modal */}
      {activeClip && (
        <div className="clip-modal-backdrop" onClick={() => setActiveClip(null)}>
          <div className="clip-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="clip-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={15} color="var(--amber)" />
                <span className="clip-modal-badge">HIGHLIGHT CLIP</span>
              </div>
              <button
                type="button"
                className="clip-modal-close"
                onClick={() => setActiveClip(null)}
                aria-label="Close clip preview"
              >
                <X size={18} />
              </button>
            </div>

            <div className="clip-player-frame">
              <Artwork variant={activeClip.art || streamArt} />
              <div className="clip-player-overlay">
                <div className="clip-player-play-btn">
                  <Play size={32} fill="currentColor" />
                </div>
                <div className="clip-player-timeline">
                  <div className="clip-timeline-progress" style={{ width: '42%' }} />
                </div>
                <div className="clip-player-controls-row">
                  <span>0:24 / {activeClip.duration}</span>
                  <span style={{ fontSize: 10, color: 'var(--cyan)' }}>High Definition 1080p · 60fps</span>
                </div>
              </div>
            </div>

            <div className="clip-modal-info">
              <h3>{activeClip.title}</h3>
              <p className="clip-modal-sub">
                From <strong>{streamTitle}</strong> · Clipped by <strong>{activeClip.clippedBy}</strong>
              </p>
              <div className="clip-modal-actions-bar">
                <button
                  type="button"
                  className={`clip-modal-action-btn ${likedClips.has(activeClip.id) ? 'active' : ''}`}
                  onClick={(e) => handleLike(activeClip.id, e)}
                >
                  <Heart size={14} fill={likedClips.has(activeClip.id) ? 'currentColor' : 'none'} />
                  <span>{activeClip.likes ?? 0} Likes</span>
                </button>
                <button
                  type="button"
                  className="clip-modal-action-btn"
                  onClick={(e) => handleShare(activeClip, e)}
                >
                  {copiedClipId === activeClip.id ? <Check size={14} color="var(--cyan)" /> : <Share2 size={14} />}
                  <span>{copiedClipId === activeClip.id ? 'Link Copied!' : 'Share Highlight'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Clip Modal */}
      {isCreatingClip && (
        <div className="clip-modal-backdrop" onClick={() => setIsCreatingClip(false)}>
          <div className="clip-modal-dialog create-clip-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="clip-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Scissors size={15} color="var(--cyan)" />
                <span className="clip-modal-badge" style={{ color: 'var(--cyan)', borderColor: 'var(--cyan)' }}>
                  CREATE CLIP
                </span>
              </div>
              <button
                type="button"
                className="clip-modal-close"
                onClick={() => setIsCreatingClip(false)}
                aria-label="Close clip creation"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateClipSubmit} className="create-clip-form">
              <label>
                <span>Clip Title</span>
                <input
                  type="text"
                  placeholder="Give this moment an engaging title..."
                  value={newClipTitle}
                  onChange={(e) => setNewClipTitle(e.target.value)}
                  maxLength={100}
                  autoFocus
                  required
                />
              </label>

              <label>
                <span>Clip Length</span>
                <div className="clip-duration-selector">
                  {['0:30', '0:45', '1:00', '1:30'].map(dur => (
                    <button
                      key={dur}
                      type="button"
                      className={`duration-opt-btn ${newClipDuration === dur ? 'active' : ''}`}
                      onClick={() => setNewClipDuration(dur)}
                    >
                      {dur}
                    </button>
                  ))}
                </div>
              </label>

              <div className="create-clip-preview-card">
                <Scissors size={16} color="var(--cyan)" />
                <div>
                  <strong>Capturing Live Buffer</strong>
                  <p>Clipping the previous {newClipDuration} from {streamTitle}.</p>
                </div>
              </div>

              <div className="create-clip-actions">
                <button
                  type="button"
                  className="clip-cancel-btn"
                  onClick={() => setIsCreatingClip(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="clip-submit-btn"
                  disabled={!newClipTitle.trim()}
                >
                  Publish Clip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
