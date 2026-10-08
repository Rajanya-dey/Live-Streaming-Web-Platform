// TEAMMATE TODO: Build a simple profile form: display name, bio, and avatar.
export default function ProfilePage({ onBack }) {
  return <section className="starter-page"><span className="avatar avatar-amber profile-avatar">YO</span><span className="eyebrow">YOUR SPACE</span><h1>A little more you.</h1><p>Your community profile is coming soon.<br/>Grab a seat and join a live session while we build it.</p><button className="primary-button" onClick={onBack}>Back to explore</button></section>;
}
