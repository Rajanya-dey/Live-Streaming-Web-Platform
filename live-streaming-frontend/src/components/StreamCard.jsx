import { Eye, ArrowUpRight } from 'lucide-react';
import Artwork from './Artwork';

export default function StreamCard({ stream, onSelect }) {
  return <button className="stream-card" onClick={() => onSelect(stream)} aria-label={`Watch ${stream.title}`}>
    <div className="card-cover"><Artwork variant={stream.art}/><span className="live-badge"><i/>LIVE</span><span className="viewer-badge"><Eye size={12}/>{stream.viewers}</span><span className="card-open"><ArrowUpRight size={20}/></span></div>
    <div className="card-content"><span className={`avatar avatar-${stream.color}`}>{stream.initials}</span><div><h3>{stream.title}</h3><p>{stream.creator}<span className="verified">✦</span></p><span className="category-label">{stream.category}</span></div></div>
  </button>;
}
