import { useState, useEffect, useRef } from 'react';
import { Video, Camera, Mic, Radio, Square, Eye, Sparkles, ExternalLink, RefreshCw, CheckCircle2 } from 'lucide-react';
import { createStream, stopStream } from '../services/api';
import Artwork from '../components/Artwork';

const categories = ['Development', 'Design', 'AI & ML', 'Just chatting'];

export default function StreamerDashboard({ onBack, onStreamCreated, currentUser }) {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [category, setCategory] = useState('Development');
  const [description, setDescription] = useState('');
  const [videoMode, setVideoMode] = useState('camera'); // 'camera' | 'youtube' | 'art'
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [artVariant, setArtVariant] = useState('studio');
  
  // Media devices
  const [videoDevices, setVideoDevices] = useState([]);
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState('');
  const [selectedAudioDevice, setSelectedAudioDevice] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [mediaError, setMediaError] = useState('');

  // Live state
  const [isStarting, setIsStarting] = useState(false);
  const [activeStream, setActiveStream] = useState(null);
  const [relaySession, setRelaySession] = useState(null);
  const [errorNotice, setErrorNotice] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // Enumerate media devices
  useEffect(() => {
    async function getDevices() {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const vDevs = devices.filter(d => d.kind === 'videoinput');
        const aDevs = devices.filter(d => d.kind === 'audioinput');
        setVideoDevices(vDevs);
        setAudioDevices(aDevs);
        if (vDevs.length > 0 && !selectedVideoDevice) setSelectedVideoDevice(vDevs[0].deviceId);
        if (aDevs.length > 0 && !selectedAudioDevice) setSelectedAudioDevice(aDevs[0].deviceId);
      } catch (err) {
        console.warn('Could not enumerate media devices:', err);
      }
    }
    getDevices();
  }, [selectedVideoDevice, selectedAudioDevice]);

  // Handle local camera preview
  useEffect(() => {
    if (videoMode !== 'camera') {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [videoMode, selectedVideoDevice, selectedAudioDevice]);

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMediaError('Camera API is not supported in this browser environment.');
      return;
    }
    stopCamera();
    try {
      setMediaError('');
      const constraints = {
        video: selectedVideoDevice ? { deviceId: { exact: selectedVideoDevice } } : true,
        audio: selectedAudioDevice ? { deviceId: { exact: selectedAudioDevice } } : true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);
    } catch (err) {
      console.warn('Camera preview not available:', err);
      setCameraActive(false);
      setMediaError('Camera permission not granted or device unavailable. Studio will run with animated art relay.');
    }
  }

  function stopCamera() {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }

  function normalizeYoutubeEmbed(url) {
    if (!url) return null;
    const trimmed = url.trim();
    if (trimmed.includes('youtube.com/embed/')) return trimmed;
    const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|(?:embed|v)\/))([a-zA-Z0-9_-]{11})/);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
    return trimmed;
  }

  async function handleGoLive(e) {
    e.preventDefault();
    if (!title.trim()) {
      setErrorNotice('Please provide a stream title to go live.');
      return;
    }

    setIsStarting(true);
    setErrorNotice('');
    setSuccessNotice('');

    try {
      const embed = videoMode === 'youtube' ? normalizeYoutubeEmbed(youtubeUrl) : null;
      const created = await createStream({
        title: title.trim(),
        subtitle: subtitle.trim() || 'Broadcasting live from Streamspace Creator Studio',
        category,
        description: description.trim() || 'Welcome to my live stream on Streamspace! Join the chat and build along.',
        embedUrl: embed,
        videoMode,
        art: artVariant,
      });

      setActiveStream(created);
      setRelaySession(`relay-${Date.now().toString(36)}`);
      setSuccessNotice(`🎉 You are LIVE! Stream is registered with backend ID: ${created.id}`);

      if (onStreamCreated) {
        onStreamCreated(created);
      }
    } catch (err) {
      setErrorNotice(err.message || 'Failed to start stream on backend');
    } finally {
      setIsStarting(false);
    }
  }

  async function handleStopStream() {
    if (!activeStream) return;
    try {
      await stopStream(activeStream.id);
      setActiveStream(null);
      setRelaySession(null);
      setSuccessNotice('Stream ended successfully and media relay released.');
      if (onStreamCreated) {
        onStreamCreated(null);
      }
    } catch (err) {
      setErrorNotice('Failed to stop stream: ' + err.message);
    }
  }

  return (
    <div className="studio-container" style={{ padding: '0 0 50px' }}>
      <div className="page-heading" style={{ marginBottom: 24 }}>
        <div>
          <span className="eyebrow">
            <span className="tiny-dot" />
            CREATOR STUDIO
          </span>
          <h1>{activeStream ? 'You’re live on Streamspace' : 'Set up your live stream'}</h1>
          <p>
            {activeStream
              ? 'Broadcasting to viewers across the platform. Chat and audience are connected in real-time.'
              : 'Configure your broadcast, test your camera or media feed, and connect with the community.'}
          </p>
        </div>
        <button className="primary-button" style={{ background: '#191c2b', color: '#c4c8d8', border: '1px solid #2d3246' }} onClick={onBack}>
          ← Back to explore
        </button>
      </div>

      {errorNotice && (
        <div style={{ background: '#38161c', border: '1px solid #ff4b6b66', padding: '12px 16px', borderRadius: 8, color: '#ffb0be', marginBottom: 20, fontSize: 13 }}>
          {errorNotice}
        </div>
      )}

      {successNotice && (
        <div style={{ background: '#112922', border: '1px solid #33c2cc66', padding: '12px 16px', borderRadius: 8, color: '#7be3d3', marginBottom: 20, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={16} />
          {successNotice}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(300px, 1fr)', gap: 24, alignItems: 'start' }}>
        {/* Left Column: Form & Settings */}
        <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 10, padding: 24 }}>
          {activeStream ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <span className="live-badge" style={{ fontSize: 11, padding: '6px 12px' }}>
                  <i /> LIVE BROADCAST
                </span>
                <span style={{ fontSize: 11, color: 'var(--cyan)' }}>
                  Session: {relaySession}
                </span>
              </div>
              <h2 style={{ fontSize: 20, margin: '0 0 10px', color: '#fff' }}>{activeStream.title}</h2>
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 20px' }}>{activeStream.description}</p>
              
              <div style={{ background: '#070914', border: '1px solid #1e2235', borderRadius: 8, padding: 16, marginBottom: 24, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <div>
                  <small style={{ color: '#6d7287', fontSize: 10 }}>CATEGORY</small>
                  <div style={{ fontWeight: 600, fontSize: 13, marginTop: 4 }}>{activeStream.category}</div>
                </div>
                <div>
                  <small style={{ color: '#6d7287', fontSize: 10 }}>BACKEND ID</small>
                  <div style={{ fontWeight: 600, fontSize: 13, marginTop: 4, fontFamily: 'monospace' }}>{activeStream.id}</div>
                </div>
                <div>
                  <small style={{ color: '#6d7287', fontSize: 10 }}>STATUS</small>
                  <div style={{ fontWeight: 600, fontSize: 13, marginTop: 4, color: 'var(--cyan)' }}>Broadcasting</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <a
                  href={`#watch/${activeStream.id}`}
                  className="primary-button"
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                  <ExternalLink size={15} /> Open viewer page
                </a>
                <button
                  type="button"
                  onClick={handleStopStream}
                  className="primary-button"
                  style={{ background: '#ff4d4f', color: '#fff' }}
                >
                  <Square size={15} fill="currentColor" /> End live stream
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleGoLive}>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 18px', color: '#fff' }}>
                Stream Details
              </h2>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#9ea3b5', marginBottom: 6 }}>
                  STREAM TITLE *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Building a fullstack real-time live platform with React"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  style={{ width: '100%', background: '#111424', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px', color: '#fff', fontSize: 12, outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#9ea3b5', marginBottom: 6 }}>
                    CATEGORY
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    style={{ width: '100%', background: '#111424', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px', color: '#fff', fontSize: 12, outline: 'none' }}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#9ea3b5', marginBottom: 6 }}>
                    SUBTITLE / TAGLINE
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Interactive UI coding session"
                    value={subtitle}
                    onChange={e => setSubtitle(e.target.value)}
                    style={{ width: '100%', background: '#111424', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px', color: '#fff', fontSize: 12, outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#9ea3b5', marginBottom: 6 }}>
                  DESCRIPTION
                </label>
                <textarea
                  rows={3}
                  placeholder="Tell viewers what you're working on and how they can participate..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  style={{ width: '100%', background: '#111424', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px', color: '#fff', fontSize: 12, outline: 'none', resize: 'vertical' }}
                />
              </div>

              <div style={{ marginBottom: 18, borderTop: '1px solid var(--border)', paddingTop: 18 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#9ea3b5', marginBottom: 8 }}>
                  BROADCAST MEDIA SOURCE
                </label>
                <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                  <button
                    type="button"
                    onClick={() => setVideoMode('camera')}
                    style={{
                      flex: 1,
                      padding: '10px 8px',
                      borderRadius: 6,
                      border: `1px solid ${videoMode === 'camera' ? 'var(--cyan)' : 'var(--border)'}`,
                      background: videoMode === 'camera' ? '#33c2cc15' : '#0e1120',
                      color: videoMode === 'camera' ? 'var(--cyan)' : '#8b91a3',
                      fontSize: 11,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <Camera size={14} /> Web Camera & Mic
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoMode('youtube')}
                    style={{
                      flex: 1,
                      padding: '10px 8px',
                      borderRadius: 6,
                      border: `1px solid ${videoMode === 'youtube' ? 'var(--cyan)' : 'var(--border)'}`,
                      background: videoMode === 'youtube' ? '#33c2cc15' : '#0e1120',
                      color: videoMode === 'youtube' ? 'var(--cyan)' : '#8b91a3',
                      fontSize: 11,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <Radio size={14} /> YouTube Live Embed
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoMode('art')}
                    style={{
                      flex: 1,
                      padding: '10px 8px',
                      borderRadius: 6,
                      border: `1px solid ${videoMode === 'art' ? 'var(--cyan)' : 'var(--border)'}`,
                      background: videoMode === 'art' ? '#33c2cc15' : '#0e1120',
                      color: videoMode === 'art' ? 'var(--cyan)' : '#8b91a3',
                      fontSize: 11,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <Sparkles size={14} /> Studio Artwork
                  </button>
                </div>

                {videoMode === 'camera' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 10, color: '#7c8196', marginBottom: 4 }}>
                        CAMERA DEVICE
                      </label>
                      <select
                        value={selectedVideoDevice}
                        onChange={e => setSelectedVideoDevice(e.target.value)}
                        style={{ width: '100%', background: '#0e1120', border: '1px solid var(--border)', borderRadius: 5, padding: '7px 9px', color: '#c7cbd9', fontSize: 11 }}
                      >
                        {videoDevices.length ? (
                          videoDevices.map((d, i) => (
                            <option key={d.deviceId || i} value={d.deviceId}>
                              {d.label || `Camera ${i + 1}`}
                            </option>
                          ))
                        ) : (
                          <option value="">Default Web Camera</option>
                        )}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 10, color: '#7c8196', marginBottom: 4 }}>
                        MICROPHONE DEVICE
                      </label>
                      <select
                        value={selectedAudioDevice}
                        onChange={e => setSelectedAudioDevice(e.target.value)}
                        style={{ width: '100%', background: '#0e1120', border: '1px solid var(--border)', borderRadius: 5, padding: '7px 9px', color: '#c7cbd9', fontSize: 11 }}
                      >
                        {audioDevices.length ? (
                          audioDevices.map((d, i) => (
                            <option key={d.deviceId || i} value={d.deviceId}>
                              {d.label || `Microphone ${i + 1}`}
                            </option>
                          ))
                        ) : (
                          <option value="">Default Audio Input</option>
                        )}
                      </select>
                    </div>
                  </div>
                )}

                {videoMode === 'youtube' && (
                  <div>
                    <label style={{ display: 'block', fontSize: 10, color: '#7c8196', marginBottom: 4 }}>
                      YOUTUBE VIDEO ID OR EMBED URL
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ or embed URL"
                      value={youtubeUrl}
                      onChange={e => setYoutubeUrl(e.target.value)}
                      style={{ width: '100%', background: '#0e1120', border: '1px solid var(--border)', borderRadius: 5, padding: '8px 10px', color: '#c7cbd9', fontSize: 11 }}
                    />
                    <small style={{ color: '#686e82', fontSize: 10, marginTop: 4, display: 'block' }}>
                      Provides a trusted YouTube video embed for viewers when joined.
                    </small>
                  </div>
                )}

                {videoMode === 'art' && (
                  <div>
                    <label style={{ display: 'block', fontSize: 10, color: '#7c8196', marginBottom: 4 }}>
                      ARTWORK THEME
                    </label>
                    <select
                      value={artVariant}
                      onChange={e => setArtVariant(e.target.value)}
                      style={{ width: '100%', background: '#0e1120', border: '1px solid var(--border)', borderRadius: 5, padding: '8px 10px', color: '#c7cbd9', fontSize: 11 }}
                    >
                      <option value="studio">Cozy Developer Studio</option>
                      <option value="design">Geometric Interface Design</option>
                      <option value="ai">AI Playground Nebula</option>
                      <option value="code">Late Night Terminal</option>
                    </select>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 18 }}>
                <span style={{ fontSize: 11, color: '#7e8396' }}>
                  Creator: <strong>{currentUser?.displayName || 'You'}</strong> (@{currentUser?.handle || 'you.creator'})
                </span>
                <button
                  type="submit"
                  disabled={isStarting}
                  className="primary-button"
                  style={{ padding: '12px 24px', fontSize: 13 }}
                >
                  {isStarting ? (
                    <>
                      <RefreshCw size={14} className="spin" /> Connecting...
                    </>
                  ) : (
                    <>
                      <Radio size={16} /> Go live now
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right Column: Preview Box */}
        <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 10, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: 13, margin: 0, fontWeight: 600, color: '#d3d7e5' }}>
              Broadcast Monitor
            </h3>
            <span style={{ fontSize: 10, color: cameraActive ? 'var(--cyan)' : '#8b91a3' }}>
              {videoMode === 'camera' ? (cameraActive ? '● Camera Online' : '○ Standby') : '● Ready'}
            </span>
          </div>

          <div
            style={{
              position: 'relative',
              aspectRatio: '16/9',
              background: '#070913',
              borderRadius: 8,
              overflow: 'hidden',
              border: '1px solid #1f2334',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {videoMode === 'camera' && (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                />
                {!cameraActive && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16, textAlign: 'center', background: '#0b0e1b' }}>
                    <Camera size={28} color="#636a83" style={{ marginBottom: 8 }} />
                    <span style={{ fontSize: 11, color: '#979db1' }}>Waiting for camera input</span>
                    {mediaError && <small style={{ fontSize: 9, color: '#e89494', marginTop: 6 }}>{mediaError}</small>}
                  </div>
                )}
              </>
            )}

            {videoMode === 'youtube' && (
              youtubeUrl ? (
                <iframe
                  title="YouTube Preview"
                  src={normalizeYoutubeEmbed(youtubeUrl)}
                  style={{ width: '100%', height: '100%', border: 0 }}
                  allow="autoplay; encrypted-media; picture-in-picture"
                />
              ) : (
                <div style={{ padding: 16, textAlign: 'center', color: '#6d738a', fontSize: 11 }}>
                  Enter a YouTube link to preview player
                </div>
              )
            )}

            {videoMode === 'art' && (
              <Artwork variant={artVariant} className="studio-art" />
            )}

            <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 5 }}>
              <span className="live-badge" style={{ fontSize: 9, padding: '3px 6px' }}>
                <i /> {activeStream ? 'LIVE' : 'PREVIEW'}
              </span>
            </div>
          </div>

          <div style={{ marginTop: 14, fontSize: 11, color: '#82879c', lineHeight: 1.6 }}>
            <p style={{ margin: '0 0 6px' }}>
              <strong>Title preview:</strong> {title || 'Untitled Stream'}
            </p>
            <p style={{ margin: 0 }}>
              <strong>Category:</strong> {category}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
