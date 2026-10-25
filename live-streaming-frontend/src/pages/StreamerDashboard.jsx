
import { useState } from 'react';
import { Video, VideoOff, Mic, MicOff, Radio } from 'lucide-react';

export default function StreamerDashboard({ onBack }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Development');
  const [camera, setCamera] = useState('Default camera');
  const [microphone, setMicrophone] = useState('Default microphone');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState('');

  function handleStart() {
    if (!title.trim()) {
      setError('Please enter a stream title first.');
      return;
    }

    setError('');
    setIsStreaming(true);
  }

  function handleStop() {
    setIsStreaming(false);
  }

  return (
    <section className="studio-form">
      <span className="eyebrow">CREATOR STUDIO</span>
      <h1>Set up your stream</h1>
      <p>Configure your stream before going live.</p>

      <div className="studio-layout">
        <div className="studio-fields">
          <label htmlFor="stream-title">Stream title *</label>
          <input
            id="stream-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What are you streaming today?"
            disabled={isStreaming}
          />

          <label htmlFor="stream-description">Description</label>
          <textarea
            id="stream-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell viewers about your stream..."
            rows={4}
            disabled={isStreaming}
          />

          <label htmlFor="stream-category">Category</label>
          <select
            id="stream-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={isStreaming}
          >
            <option>Development</option>
            <option>Design</option>
            <option>AI &amp; ML</option>
            <option>Just chatting</option>
          </select>

          <label htmlFor="stream-camera">Camera</label>
          <select
            id="stream-camera"
            value={camera}
            onChange={(e) => setCamera(e.target.value)}
            disabled={isStreaming}
          >
            <option>Default camera</option>
            <option>Built-in camera</option>
            <option>No camera</option>
          </select>

          <label htmlFor="stream-microphone">Microphone</label>
          <select
            id="stream-microphone"
            value={microphone}
            onChange={(e) => setMicrophone(e.target.value)}
            disabled={isStreaming}
          >
            <option>Default microphone</option>
            <option>Built-in microphone</option>
            <option>No microphone</option>
          </select>

          {error && <p className="studio-error" role="alert">{error}</p>}

          <div className="studio-actions">
            {!isStreaming ? (
              <button
                type="button"
                className="primary-button"
                onClick={handleStart}
              >
                <Radio size={17} /> Start stream
              </button>
            ) : (
              <button
                type="button"
                className="primary-button"
                onClick={handleStop}
              >
                <VideoOff size={17} /> Stop stream
              </button>
            )}

            <button
              type="button"
              className="studio-back"
              onClick={onBack}
            >
              Explore streams
            </button>
          </div>
        </div>

        <div className="studio-preview">
          <div className="studio-preview-screen">
            {isStreaming ? (
              <>
                <Video size={42} />
                <span>{title}</span>
                <small>Demo stream is live</small>
              </>
            ) : (
              <>
                <VideoOff size={42} />
                <span>Stream preview</span>
                <small>Your preview will appear here</small>
              </>
            )}
          </div>

          <div className="studio-status">
            <span className={isStreaming ? 'status-dot live' : 'status-dot'} />
            {isStreaming ? 'LIVE · DEMO MODE' : 'OFFLINE · DEMO MODE'}
          </div>

          <h3>{title || 'Untitled stream'}</h3>
          <p>{description || 'Your stream description will appear here.'}</p>
          <small>{category}</small>

          <div className="studio-devices">
            <span><Video size={15} /> {camera}</span>
            <span><Mic size={15} /> {microphone}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
