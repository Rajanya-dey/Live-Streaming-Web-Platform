import { useEffect, useState, useCallback, useRef } from 'react';
import { ArrowRight, AudioLines, Bell, Check, ChevronDown, Compass, Copy, Eye, Heart, Menu, Play, Radio, Search, Share2, Sparkles, Users, Video, X, Maximize, Minimize } from 'lucide-react';
import { streams as initialMockStreams } from './data/streams';
import Artwork from './components/Artwork';
import ChatPanel from './components/ChatPanel';
import StreamCard from './components/StreamCard';
import StreamClips from './components/StreamClips';
import StreamerDashboard from './pages/StreamerDashboard';
import ProfilePage from './pages/ProfilePage';
import { fetchStreams, fetchProfile, followCreator, unfollowCreator } from './services/api';

const categories = ['All streams', 'Development', 'Design', 'AI & ML', 'Just chatting'];
const readRoute = () => window.location.hash.slice(1) || 'explore';

export default function App() {
  const [route, setRoute] = useState(readRoute);
  const [category, setCategory] = useState('All streams');
  const [search, setSearch] = useState('');
  const [streamList, setStreamList] = useState(initialMockStreams);
  const [followed, setFollowed] = useState([]);
  const [currentUser, setCurrentUser] = useState({
    displayName: 'You',
    handle: 'you.creator',
    initials: 'YO',
    avatarColor: 'amber',
  });
  const [tab, setTab] = useState('About the stream');
  const [preview, setPreview] = useState(false);
  const [notice, setNotice] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  // Load backend data
  const loadData = useCallback(async () => {
    try {
      const [streamsRes, profileRes] = await Promise.all([
        fetchStreams().catch(() => null),
        fetchProfile().catch(() => null),
      ]);
      if (streamsRes && Array.isArray(streamsRes) && streamsRes.length > 0) {
        setStreamList(streamsRes);
      }
      if (profileRes) {
        setCurrentUser(profileRes);
        if (Array.isArray(profileRes.follows)) {
          setFollowed(profileRes.follows);
        }
      }
    } catch {
      // Fallback in-memory
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const onRoute = () => {
      setRoute(readRoute());
      setPreview(false);
      setTab('About the stream');
      setMenuOpen(false);
    };
    window.addEventListener('hashchange', onRoute);
    return () => window.removeEventListener('hashchange', onRoute);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  // Video player fullscreen state and ref
  const videoPlayerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    const el = videoPlayerRef.current;
    if (!el) return;

    const isCurrentFs = Boolean(document.fullscreenElement) || isFullscreen;
    if (isCurrentFs) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    } else {
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => {
          setIsFullscreen(true);
        });
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      } else {
        setIsFullscreen(true);
      }
    }
  }, [isFullscreen]);

  // Sync fullscreen state with browser events
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  // Global Keyboard Shortcuts:
  // - Esc: Toggle chat focus (focus chat input if blurred, blur if focused)
  // - F / f: Toggle full-screen for video player (when not typing in editable fields)
  useEffect(() => {
    function handleGlobalKeyDown(event) {
      // 1. Full-screen toggle: F or f (only when not typing in editable elements)
      if ((event.key === 'f' || event.key === 'F') && !event.ctrlKey && !event.metaKey && !event.altKey) {
        const activeEl = document.activeElement;
        const tag = activeEl?.tagName?.toLowerCase();
        const isEditable = activeEl?.isContentEditable || tag === 'input' || tag === 'textarea' || tag === 'select';
        if (!isEditable) {
          event.preventDefault();
          toggleFullscreen();
          return;
        }
      }

      // 2. Chat focus toggle: Esc
      if (event.key === 'Escape') {
        // If in CSS fallback full-screen, exit full-screen first
        if (isFullscreen && !document.fullscreenElement) {
          setIsFullscreen(false);
          return;
        }

        // If an overlay modal is open (like clip modal or poll modal), let the modal's close handler run
        const activeModal = document.querySelector('.poll-modal-backdrop, .clip-modal-backdrop');
        if (activeModal) {
          return;
        }

        const chatInput = document.querySelector('.chat-input input');
        if (chatInput) {
          if (document.activeElement === chatInput) {
            chatInput.blur();
          } else {
            event.preventDefault();
            chatInput.focus();
          }
        }
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isFullscreen, toggleFullscreen]);

  const selected = streamList.find(stream => route === `watch/${stream.id}`) || streamList[0] || initialMockStreams[0];
  const isFollowing = followed.includes(selected?.id);

  const navigate = value => {
    window.location.hash = value;
  };

  const selectStream = stream => {
    navigate(`watch/${stream.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filtered = streamList.filter(
    stream =>
      (category === 'All streams' || stream.category === category) &&
      (route !== 'following' || followed.includes(stream.id)) &&
      `${stream.title} ${stream.creator} ${stream.category}`.toLowerCase().includes(search.toLowerCase())
  );

  const isExplore = route === 'explore' || route.startsWith('watch/') || route === 'following';

  async function toggleFollow() {
    if (!selected) return;
    const targetId = selected.id;
    const currentlyFollowing = followed.includes(targetId);

    // Optimistic UI update
    setFollowed(prev => (currentlyFollowing ? prev.filter(id => id !== targetId) : [...prev, targetId]));

    try {
      if (currentlyFollowing) {
        await unfollowCreator(targetId);
      } else {
        await followCreator(targetId);
      }
    } catch {
      // Keep optimistic state
    }
  }

  async function share() {
    if (!selected) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}#watch/${selected.id}`);
      setNotice('Stream link copied to clipboard.');
    } catch {
      setNotice(`Share this stream: ${window.location.origin}${window.location.pathname}#watch/${selected.id}`);
    }
  }

  function handleStreamCreated(newStream) {
    loadData();
    if (newStream?.id) {
      navigate(`watch/${newStream.id}`);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#explore">
          <span className="brand-mark">
            <AudioLines size={23} />
          </span>
          stream<span>space</span>
          <span className="brand-period">.</span>
        </a>
        <nav className="top-nav" aria-label="Main navigation">
          <a href="#explore" className={route !== 'following' && isExplore ? 'active' : ''}>
            Explore
          </a>
          <a href="#following" className={route === 'following' ? 'active' : ''}>
            Following {followed.length > 0 && `(${followed.length})`}
          </a>
        </nav>
        <label className="search-box">
          <Search size={17} />
          <input
            aria-label="Search streams or creators"
            placeholder="Search streams, creators..."
            value={search}
            onChange={event => {
              setSearch(event.target.value);
              if (!isExplore) navigate('explore');
            }}
          />
          <span>/</span>
        </label>
        <div className="top-actions">
          <button className="primary-button go-live" onClick={() => navigate('studio')}>
            <Radio size={16} />
            Go live
          </button>
          <button
            className="icon-button notification-button"
            aria-label="Notifications"
            onClick={() => setNotice('You’re all caught up. Backend real-time messaging is connected.')}
          >
            <Bell size={19} />
            <i />
          </button>
          <button
            className={`avatar avatar-${currentUser?.avatarColor || 'amber'} account-button`}
            onClick={() => navigate('profile')}
            aria-label="Open your profile"
          >
            {currentUser?.initials || 'YO'}
          </button>
          <button
            className="icon-button mobile-menu-button"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-scroll">
          <span className="nav-label">YOUR SPACE</span>
          <nav aria-label="Sidebar">
            <a href="#explore" className={isExplore && route !== 'following' ? 'selected' : ''}>
              <Compass size={19} />
              Explore<span className="nav-spark">✦</span>
            </a>
            <a href="#following" className={route === 'following' ? 'selected' : ''}>
              <Heart size={19} />
              Following
            </a>
            <a href="#studio" className={route === 'studio' ? 'selected' : ''}>
              <Video size={19} />
              Creator studio
            </a>
          </nav>
          <div className="sidebar-divider" />
          <div className="sidebar-label-row">
            <span className="nav-label">LIVE CREATORS</span>
            <span className="creator-count">
              {streamList.length < 10 ? `0${streamList.length}` : streamList.length}
            </span>
          </div>
          <div className="creator-list">
            {streamList.map(stream => (
              <button key={stream.id} onClick={() => selectStream(stream)}>
                <span className={`avatar avatar-${stream.color || 'amber'}`}>{stream.initials}</span>
                <span className="creator-text">
                  <strong>{stream.handle}</strong>
                  <small>{stream.category}</small>
                </span>
                <span className="creator-live-dot" />
              </button>
            ))}
          </div>
        </div>
        <div className="sidebar-invite">
          <div className="invite-icon">
            <Sparkles size={20} />
          </div>
          <h3>
            Your ideas.
            <br />
            Your audience.
          </h3>
          <p>
            Great things start with
            <br />a little “Go live”.
          </p>
          <button onClick={() => navigate('studio')}>
            Start creating
            <ArrowUpRightIcon />
          </button>
        </div>
        <div className="sidebar-footer">
          <span className="tiny-dot" />
          A space for the curious.
          <small>Made to connect. Built together.</small>
        </div>
      </aside>

      <main>
        {!isExplore ? (
          route === 'studio' ? (
            <StreamerDashboard
              onBack={() => navigate('explore')}
              onStreamCreated={handleStreamCreated}
              currentUser={currentUser}
            />
          ) : (
            <ProfilePage
              onBack={() => navigate('explore')}
              currentUser={currentUser}
              onProfileUpdated={updated => setCurrentUser(updated)}
            />
          )
        ) : selected ? (
          <>
            <div className="page-heading">
              <div>
                <span className="eyebrow">
                  <span className="tiny-dot" />
                  THE COMMUNITY IS LIVE
                </span>
                <h1>{route === 'following' ? 'Your kind of people.' : 'Good ideas happen live.'}</h1>
                <p>
                  {route === 'following'
                    ? 'Catch up with the creators you follow.'
                    : 'Find your people. Learn something new. Be part of the moment.'}
                </p>
              </div>
              <span className="online-pill">
                <span className="tiny-dot" />
                {streamList.length} creators streaming
              </span>
            </div>

            {route !== 'following' && (
              <>
                <div className="section-heading featured-heading">
                  <h2>
                    <span className="accent-star">✦</span> In the spotlight
                  </h2>
                  <span>GOOD COMPANY, GREAT IDEAS</span>
                </div>
                <section className="watch-layout" aria-label="Featured stream">
                  <div className="stream-main">
                    <div
                      ref={videoPlayerRef}
                      className={`video-preview ${preview ? 'preview-active' : ''} ${isFullscreen ? 'is-fullscreen' : ''}`}
                    >
                      {selected.embedUrl && preview ? (
                        <iframe
                          title={selected.title}
                          src={selected.embedUrl}
                          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                          allowFullScreen
                        />
                      ) : (
                        <Artwork variant={selected.art || 'studio'} />
                      )}
                      <div className="video-top">
                        <span className="live-badge">
                          <i />
                          LIVE
                          <span className="badge-separator" />
                          BACKEND
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'auto' }}>
                          <span className="video-quality">
                            1080p <span>HD</span>
                          </span>
                          <button
                            type="button"
                            className="video-fs-btn"
                            onClick={toggleFullscreen}
                            title={isFullscreen ? 'Exit full-screen (F)' : 'Full-screen (F)'}
                            aria-label={isFullscreen ? 'Exit full-screen (F)' : 'Full-screen (F)'}
                          >
                            {isFullscreen ? <Minimize size={13} /> : <Maximize size={13} />}
                          </button>
                        </div>
                      </div>
                      {!(selected.embedUrl && preview) && (
                        <div className="video-overlay">
                          <span className="preview-kicker">
                            {preview ? 'YOU’RE IN GOOD COMPANY' : 'PULL UP A CHAIR'}
                          </span>
                          <h2>
                            {preview ? 'Your next idea starts here.' : selected.title}
                          </h2>
                          <button className="watch-button" onClick={() => setPreview(!preview)}>
                            <Play size={15} fill="currentColor" />
                            {preview ? 'Close preview' : (selected.embedUrl ? 'Join the stream' : 'Interactive preview')}
                          </button>
                          <span className="preview-caption">
                            {preview
                              ? 'Connected to live media relay'
                              : 'Live broadcast · real-time chat & presence active'}
                          </span>
                        </div>
                      )}
                      <div className="video-bottom">
                        <span>
                          <Eye size={14} />
                          {selected.viewers} watching
                        </span>
                        <span>
                          <AudioLines size={14} /> {selected.subtitle}
                        </span>
                        <button
                          type="button"
                          className="video-fs-bottom-btn"
                          onClick={toggleFullscreen}
                          title={isFullscreen ? 'Exit full-screen (F)' : 'Full-screen (F)'}
                          aria-label={isFullscreen ? 'Exit full-screen (F)' : 'Full-screen (F)'}
                          style={{ pointerEvents: 'auto' }}
                        >
                          {isFullscreen ? <Minimize size={12} /> : <Maximize size={12} />}
                          <span className="shortcut-key-badge">F</span>
                        </button>
                      </div>
                    </div>
                    <div className="stream-info">
                      <div className="stream-title-row">
                        <span className={`avatar avatar-${selected.color || 'amber'}`}>
                          {selected.initials}
                        </span>
                        <div>
                          <h2>{selected.title}</h2>
                          <p>
                            {selected.creator}
                            <span className="verified">✦</span>
                            <span className="info-dot">·</span>
                            {selected.category}
                          </p>
                        </div>
                      </div>
                      <div className="stream-actions">
                        <button
                          className={`follow-button ${isFollowing ? 'following' : ''}`}
                          onClick={toggleFollow}
                        >
                          {isFollowing ? <Check size={15} /> : <Heart size={15} />}{' '}
                          {isFollowing ? 'Following' : 'Follow'}
                        </button>
                        <button className="share-button" onClick={share} aria-label="Share stream">
                          <Share2 size={17} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <ChatPanel
                    key={selected.id}
                    streamId={selected.id}
                    viewers={selected.viewers}
                    currentUser={currentUser}
                  />
                </section>
                <section className="about-stream">
                  <div className="stream-tabs" role="tablist" aria-label="Stream details">
                    {['About the stream', 'Highlighted clips', 'Community guidelines'].map(name => (
                      <button
                        key={name}
                        role="tab"
                        aria-selected={tab === name}
                        onClick={() => setTab(name)}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                  <div role="tabpanel">
                    {tab === 'Highlighted clips' ? (
                      <StreamClips
                        streamId={selected.id}
                        streamTitle={selected.title}
                        streamArt={selected.art}
                        currentUser={currentUser}
                      />
                    ) : (
                      <>
                        <p>
                          {tab === 'About the stream'
                            ? selected.description
                            : 'Be kind and respectful. Stay on topic, welcome new people, and keep personal information private. No harassment, hate, or spam. We’re here to learn and build together.'}
                        </p>
                        {tab === 'About the stream' && (
                          <>
                            <div className="stream-tags">
                              <span>{selected.category}</span>
                              <span>Build together</span>
                              <span>English</span>
                            </div>
                            <div style={{ marginTop: 20 }}>
                              <StreamClips
                                streamId={selected.id}
                                streamTitle={selected.title}
                                streamArt={selected.art}
                                currentUser={currentUser}
                              />
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </section>
              </>
            )}

            <section className="browse-section">
              <div className="section-heading">
                <h2>
                  {route === 'following' ? <Heart size={19} /> : <Radio size={19} />}{' '}
                  {route === 'following' ? 'Your followed streams' : 'More moments to join'}
                </h2>
                <span className="stream-total">
                  {filtered.length} streams <ArrowRight size={14} />
                </span>
              </div>
              <div className="filters-row">
                <div className="category-filters" aria-label="Filter streams">
                  {categories.map(name => (
                    <button
                      key={name}
                      className={category === name ? 'active' : ''}
                      aria-pressed={category === name}
                      onClick={() => setCategory(name)}
                    >
                      {name === 'All streams' && <Compass size={14} />} {name}
                    </button>
                  ))}
                </div>
                <span className="sort-label">
                  Live now <ChevronDown size={13} />
                </span>
              </div>
              <div className="stream-grid">
                {filtered.map(stream => (
                  <StreamCard key={stream.id} stream={stream} onSelect={selectStream} />
                ))}
              </div>
              {!filtered.length && (
                <div className="empty-state">
                  <Search size={25} />
                  <h3>
                    {route === 'following' && !followed.length
                      ? 'Your community starts here.'
                      : 'No streams here just yet.'}
                  </h3>
                  <p>
                    {route === 'following' && !followed.length
                      ? 'Follow a creator from their stream to find them here.'
                      : 'Try another category or a different search.'}
                  </p>
                  <button
                    onClick={() => {
                      setSearch('');
                      setCategory('All streams');
                      if (route === 'following') navigate('explore');
                    }}
                  >
                    Explore all streams
                    <ArrowRight size={15} />
                  </button>
                </div>
              )}
            </section>
            <footer className="page-footer">
              <span>Not just a stream. A shared moment.</span>
              <span>
                streamspace<span className="brand-period">.</span>{' '}
                <small>© {new Date().getFullYear()}</small>
              </span>
            </footer>
          </>
        ) : null}
      </main>
      {notice && (
        <div className="toast" role="status">
          <Copy size={16} />
          {notice}
          <button aria-label="Dismiss notification" onClick={() => setNotice('')}>
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

function ArrowUpRightIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M7 17 17 7M7 7h10v10" />
    </svg>
  );
}
