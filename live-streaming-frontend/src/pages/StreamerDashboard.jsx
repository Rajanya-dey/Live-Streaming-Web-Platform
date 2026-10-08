import { Video } from 'lucide-react';

// TEAMMATE TODO: Replace this starter with a stream title input, category select,
// camera/microphone dropdowns, preview box, and Start / Stop buttons.
// Keep it frontend-only for now. See TEAMMATE.md for a step-by-step plan.
export default function StreamerDashboard({ onBack }) {
  return <section className="starter-page"><span className="starter-icon"><Video size={30}/></span><span className="eyebrow">CREATOR STUDIO</span><h1>Your next great stream<br/>starts here.</h1><p>The creator dashboard is coming soon.<br/>For now, explore what the community is building.</p><button className="primary-button" onClick={onBack}>Explore streams</button></section>;
}
