import { useEffect, useState } from 'react';
import { ArrowRight, AudioLines, Bell, Check, ChevronDown, Compass, Copy, Eye, Heart, Menu, Play, Radio, Search, Share2, Sparkles, Users, Video, X } from 'lucide-react';
import { streams } from './data/streams';
import Artwork from './components/Artwork';
import ChatPanel from './components/ChatPanel';
import StreamCard from './components/StreamCard';
import StreamerDashboard from './pages/StreamerDashboard';
import ProfilePage from './pages/ProfilePage';

const categories = ['All streams', 'Development', 'Design', 'AI & ML', 'Just chatting'];
const readRoute = () => window.location.hash.slice(1) || 'explore';

export default function App() {
  const [route, setRoute] = useState(readRoute);
  const [category, setCategory] = useState('All streams');
  const [search, setSearch] = useState('');
  const [followed, setFollowed] = useState([]);
  const [tab, setTab] = useState('About the stream');
  const [preview, setPreview] = useState(false);
  const [notice, setNotice] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const onRoute = () => { setRoute(readRoute()); setPreview(false); setTab('About the stream'); setMenuOpen(false); };
    window.addEventListener('hashchange', onRoute);
    return () => window.removeEventListener('hashchange', onRoute);
  }, []);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 3500); return () => clearTimeout(timer); }, [notice]);
  const selected = streams.find(stream => route === `watch/${stream.id}`) || streams[0];
  const isFollowing = followed.includes(selected.id);
  const navigate = value => { window.location.hash = value; };
  const selectStream = stream => { navigate(`watch/${stream.id}`); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const filtered = streams.filter(stream => (category === 'All streams' || stream.category === category) && (route !== 'following' || followed.includes(stream.id)) && `${stream.title} ${stream.creator} ${stream.category}`.toLowerCase().includes(search.toLowerCase()));
  const isExplore = route === 'explore' || route.startsWith('watch/') || route === 'following';
  function toggleFollow() { setFollowed(previous => previous.includes(selected.id) ? previous.filter(id => id !== selected.id) : [...previous, selected.id]); }
  async function share() {
    try { await navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}#watch/${selected.id}`); setNotice('Stream link copied to clipboard.'); }
    catch { setNotice(`Share this stream: ${window.location.origin}${window.location.pathname}#watch/${selected.id}`); }
  }
  return <div className="app-shell">
    <header className="topbar"><a className="brand" href="#explore"><span className="brand-mark"><AudioLines size={23}/></span>stream<span>space</span><span className="brand-period">.</span></a>
      <nav className="top-nav" aria-label="Main navigation"><a href="#explore" className={route !== 'following' && isExplore ? 'active' : ''}>Explore</a><a href="#following" className={route === 'following' ? 'active' : ''}>Following</a></nav>
      <label className="search-box"><Search size={17}/><input aria-label="Search streams or creators" placeholder="Search streams, creators..." value={search} onChange={event => { setSearch(event.target.value); if (!isExplore) navigate('explore'); }}/><span>/</span></label>
      <div className="top-actions"><button className="primary-button go-live" onClick={() => navigate('studio')}><Radio size={16}/>Go live</button><button className="icon-button notification-button" aria-label="Notifications" onClick={() => setNotice('You’re all caught up. No new notifications.')}><Bell size={19}/><i/></button><button className="avatar avatar-amber account-button" onClick={() => navigate('profile')} aria-label="Open your profile">YO</button><button className="icon-button mobile-menu-button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X/> : <Menu/>}</button></div>
    </header>
    <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-scroll">
      <span className="nav-label">YOUR SPACE</span><nav aria-label="Sidebar"><a href="#explore" className={isExplore && route !== 'following' ? 'selected' : ''}><Compass size={19}/>Explore<span className="nav-spark">✦</span></a><a href="#following" className={route === 'following' ? 'selected' : ''}><Heart size={19}/>Following</a><a href="#studio" className={route === 'studio' ? 'selected' : ''}><Video size={19}/>Creator studio</a></nav>
      <div className="sidebar-divider"/><div className="sidebar-label-row"><span className="nav-label">LIVE CREATORS</span><span className="creator-count">04</span></div>
      <div className="creator-list">{streams.map(stream => <button key={stream.id} onClick={() => selectStream(stream)}><span className={`avatar avatar-${stream.color}`}>{stream.initials}</span><span className="creator-text"><strong>{stream.handle}</strong><small>{stream.category}</small></span><span className="creator-live-dot"/></button>)}</div>
      </div>
      <div className="sidebar-invite"><div className="invite-icon"><Sparkles size={20}/></div><h3>Your ideas.<br/>Your audience.</h3><p>Great things start with<br/>a little “Go live”.</p><button onClick={() => navigate('studio')}>Start creating<ArrowUpRightIcon/></button></div>
      <div className="sidebar-footer"><span className="tiny-dot"/>A space for the curious.<small>Made to connect. Built together.</small></div>
    </aside>
    <main>
      {!isExplore ? route === 'studio' ? <StreamerDashboard onBack={() => navigate('explore')}/> : <ProfilePage onBack={() => navigate('explore')}/> : <>
        <div className="page-heading"><div><span className="eyebrow"><span className="tiny-dot"/>THE COMMUNITY IS LIVE</span><h1>{route === 'following' ? 'Your kind of people.' : 'Good ideas happen live.'}</h1><p>{route === 'following' ? 'Catch up with the creators you follow.' : 'Find your people. Learn something new. Be part of the moment.'}</p></div><span className="online-pill"><span className="tiny-dot"/>4 creators streaming</span></div>
        {route !== 'following' && <>
          <div className="section-heading featured-heading"><h2><span className="accent-star">✦</span> In the spotlight</h2><span>GOOD COMPANY, GREAT IDEAS</span></div>
          <section className="watch-layout" aria-label="Featured stream">
            <div className="stream-main"><div className={`video-preview ${preview ? 'preview-active' : ''}`}>
              {selected.embedUrl && preview ? <iframe title={selected.title} src={selected.embedUrl} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen/> : <Artwork variant={selected.art}/>}
              <div className="video-top"><span className="live-badge"><i/>LIVE<span className="badge-separator"/>DEMO</span><span className="video-quality">1080p <span>HD</span></span></div>
              {!(selected.embedUrl && preview) && <div className="video-overlay"><span className="preview-kicker">{preview ? 'YOU’RE IN GOOD COMPANY' : 'PULL UP A CHAIR'}</span><h2>{preview ? 'Your next idea starts here.' : 'A little code. A lot of possibility.'}</h2><button className="watch-button" onClick={() => setPreview(!preview)}><Play size={15} fill="currentColor"/>{preview ? 'Close preview' : 'Join the stream'}</button><span className="preview-caption">{preview ? 'Visual preview · live video will connect here' : 'Frontend preview · no live broadcast connected'}</span></div>}
              <div className="video-bottom"><span><Eye size={14}/>{selected.viewers} watching</span><span><AudioLines size={14}/> {selected.subtitle}</span></div>
            </div>
            <div className="stream-info"><div className="stream-title-row"><span className={`avatar avatar-${selected.color}`}>{selected.initials}</span><div><h2>{selected.title}</h2><p>{selected.creator}<span className="verified">✦</span><span className="info-dot">·</span>{selected.category}</p></div></div><div className="stream-actions"><button className={`follow-button ${isFollowing ? 'following' : ''}`} onClick={toggleFollow}>{isFollowing ? <Check size={15}/> : <Heart size={15}/>} {isFollowing ? 'Following' : 'Follow'}</button><button className="share-button" onClick={share} aria-label="Share stream"><Share2 size={17}/></button></div></div>
            </div><ChatPanel key={selected.id} streamId={selected.id} viewers={selected.viewers}/>
          </section>
          <section className="about-stream"><div className="stream-tabs" role="tablist" aria-label="Stream details">{['About the stream','Community guidelines'].map(name => <button key={name} role="tab" aria-selected={tab === name} onClick={() => setTab(name)}>{name}</button>)}</div><div role="tabpanel"><p>{tab === 'About the stream' ? selected.description : 'Be kind and respectful. Stay on topic, welcome new people, and keep personal information private. No harassment, hate, or spam. We’re here to learn and build together.'}</p>{tab === 'About the stream' && <div className="stream-tags"><span>{selected.category}</span><span>Build together</span><span>English</span></div>}</div></section>
        </>}
        <section className="browse-section"><div className="section-heading"><h2>{route === 'following' ? <Heart size={19}/> : <Radio size={19}/>} {route === 'following' ? 'Your followed streams' : 'More moments to join'}</h2><span className="stream-total">{filtered.length} streams <ArrowRight size={14}/></span></div><div className="filters-row"><div className="category-filters" aria-label="Filter streams">{categories.map(name => <button key={name} className={category === name ? 'active' : ''} aria-pressed={category === name} onClick={() => setCategory(name)}>{name === 'All streams' && <Compass size={14}/>} {name}</button>)}</div><span className="sort-label">Live now <ChevronDown size={13}/></span></div>
          <div className="stream-grid">{filtered.map(stream => <StreamCard key={stream.id} stream={stream} onSelect={selectStream}/>)}</div>{!filtered.length && <div className="empty-state"><Search size={25}/><h3>{route === 'following' && !followed.length ? 'Your community starts here.' : 'No streams here just yet.'}</h3><p>{route === 'following' && !followed.length ? 'Follow a creator from their stream to find them here.' : 'Try another category or a different search.'}</p><button onClick={() => { setSearch(''); setCategory('All streams'); if (route === 'following') navigate('explore'); }}>Explore all streams<ArrowRight size={15}/></button></div>}
        </section>
        <footer className="page-footer"><span>Not just a stream. A shared moment.</span><span>streamspace<span className="brand-period">.</span> <small>© {new Date().getFullYear()}</small></span></footer>
      </>}
    </main>
    {notice && <div className="toast" role="status"><Copy size={16}/>{notice}<button aria-label="Dismiss notification" onClick={() => setNotice('')}><X size={15}/></button></div>}
  </div>;
}

function ArrowUpRightIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg>; }
