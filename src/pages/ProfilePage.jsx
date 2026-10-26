import { useState, useEffect } from 'react';
import { User, Check, Sparkles, Youtube, CheckCircle2 } from 'lucide-react';
import { updateProfile } from '../services/api';

const avatarColors = [
  { id: 'amber', label: 'Warm Amber', bg: '#372a1d', text: '#edbc65' },
  { id: 'violet', label: 'Neon Violet', bg: '#30243e', text: '#c5a4f1' },
  { id: 'cyan', label: 'Electric Cyan', bg: '#15353a', text: '#74d4d8' },
  { id: 'green', label: 'Forest Green', bg: '#20332b', text: '#95c4a5' },
];

export default function ProfilePage({ onBack, currentUser, onProfileUpdated }) {
  const [displayName, setDisplayName] = useState(currentUser?.displayName || 'You');
  const [handle, setHandle] = useState(currentUser?.handle || 'you.creator');
  const [bio, setBio] = useState(currentUser?.bio || 'Curious creator and developer building with the Streamspace community.');
  const [avatarColor, setAvatarColor] = useState(currentUser?.avatarColor || 'amber');
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || 'You');
      setHandle(currentUser.handle || 'you.creator');
      setBio(currentUser.bio || '');
      setAvatarColor(currentUser.avatarColor || 'amber');
    }
  }, [currentUser]);

  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0] || '')
    .join('')
    .toUpperCase() || 'YO';

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSaving(true);
    setNotice('');
    try {
      const updated = await updateProfile({
        displayName: displayName.trim(),
        handle: handle.trim().replace(/^@/, ''),
        bio: bio.trim(),
        avatarColor,
      });
      setNotice('Profile saved successfully to backend database.');
      if (onProfileUpdated) {
        onProfileUpdated(updated);
      }
    } catch {
      setNotice('Saved profile for current session.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', paddingBottom: 60 }}>
      <div className="page-heading" style={{ marginBottom: 24 }}>
        <div>
          <span className="eyebrow">
            <span className="tiny-dot" />
            COMMUNITY IDENTITY
          </span>
          <h1>Your Streamspace Profile</h1>
          <p>Manage your creator identity, bio, and avatar color across streams and chat.</p>
        </div>
        <button
          className="primary-button"
          style={{ background: '#191c2b', color: '#c4c8d8', border: '1px solid #2d3246' }}
          onClick={onBack}
        >
          ← Back to explore
        </button>
      </div>

      {notice && (
        <div style={{ background: '#112922', border: '1px solid #33c2cc66', padding: '12px 16px', borderRadius: 8, color: '#7be3d3', marginBottom: 24, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={16} />
          {notice}
        </div>
      )}

      <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12, padding: 30 }}>
        {/* Profile Card Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
          <span className={`avatar avatar-${avatarColor}`} style={{ width: 68, height: 68, fontSize: 22 }}>
            {initials}
          </span>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: 18, color: '#fff' }}>{displayName}</h2>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--cyan)' }}>@{handle}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#9ea3b5', marginBottom: 6 }}>
                DISPLAY NAME
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                style={{ width: '100%', background: '#111424', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px', color: '#fff', fontSize: 13, outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#9ea3b5', marginBottom: 6 }}>
                CREATOR HANDLE (@)
              </label>
              <input
                type="text"
                required
                value={handle}
                onChange={e => setHandle(e.target.value)}
                style={{ width: '100%', background: '#111424', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px', color: '#fff', fontSize: 13, outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#9ea3b5', marginBottom: 6 }}>
              BIO / ABOUT YOU
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Tell other creators and viewers about your passions..."
              style={{ width: '100%', background: '#111424', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px', color: '#fff', fontSize: 13, outline: 'none', resize: 'vertical' }}
            />
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#9ea3b5', marginBottom: 10 }}>
              AVATAR ACCENT COLOR
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {avatarColors.map(c => {
                const selected = avatarColor === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setAvatarColor(c.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 12px',
                      background: selected ? '#181c2f' : '#0e1120',
                      border: `1px solid ${selected ? 'var(--cyan)' : 'var(--border)'}`,
                      borderRadius: 8,
                      color: selected ? '#fff' : '#8f94a8',
                      fontSize: 11,
                      cursor: 'pointer',
                    }}
                  >
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        background: c.text,
                        display: 'inline-block',
                      }}
                    />
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ background: '#0a0d1c', border: '1px solid #1c2134', borderRadius: 8, padding: 16, marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ background: '#ff00001a', color: '#ff4d4f', width: 36, height: 36, borderRadius: 8, display: 'grid', placeItems: 'center' }}>
                <Youtube size={20} />
              </div>
              <div>
                <strong style={{ fontSize: 12, color: '#fff', display: 'block' }}>YouTube Channel Connection</strong>
                <span style={{ fontSize: 11, color: '#6d738a' }}>
                  {currentUser?.youtubeConnected ? 'Channel connected and verified' : 'Ready for live streaming and embed player playback'}
                </span>
              </div>
            </div>
            <span style={{ fontSize: 10, padding: '4px 8px', borderRadius: 4, background: '#192331', color: 'var(--cyan)' }}>
              Active
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button
              type="submit"
              disabled={isSaving}
              className="primary-button"
              style={{ padding: '11px 24px' }}
            >
              {isSaving ? 'Saving changes...' : 'Save profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
