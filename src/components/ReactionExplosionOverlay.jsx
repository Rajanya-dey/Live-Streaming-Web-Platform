import React from 'react';

const SPARKLE_ACCENTS = ['✨', '🌟', '💥', '⚡️', '💫'];

export function generateExplosionParticles(emoji, originX, originY, count = 16) {
  const particles = [];
  const timestamp = Date.now();
  const ringId = `ring_${timestamp}_${Math.random().toString(36).slice(2, 6)}`;

  for (let i = 0; i < count; i++) {
    // 80% primary emoji, 20% sparkling accent
    const particleEmoji = Math.random() < 0.22 
      ? SPARKLE_ACCENTS[Math.floor(Math.random() * SPARKLE_ACCENTS.length)] 
      : emoji;

    // Angle distribution: upward fan with 360 degree scatter
    // Upward bias: -180deg to 0deg, with side/down bursts
    const angle = (Math.PI * 2 * (i / count)) + ((Math.random() - 0.5) * 0.4);
    const speed = 70 + Math.random() * 150; // 70px to 220px travel distance

    // Compute delta with an upward vertical draft
    const dx = Math.cos(angle) * speed;
    const dy = Math.sin(angle) * speed - (40 + Math.random() * 60);

    const scale = 0.75 + Math.random() * 0.9; // 0.75x to 1.65x
    const rot = Math.floor((Math.random() - 0.5) * 90); // -45deg to +45deg
    const duration = 1.3 + Math.random() * 0.6; // 1.3s to 1.9s
    const size = Math.floor(22 + Math.random() * 14); // 22px to 36px

    particles.push({
      id: `p_${timestamp}_${i}_${Math.random().toString(36).slice(2, 6)}`,
      emoji: particleEmoji,
      x: originX,
      y: originY,
      dx,
      dy,
      scale,
      rot,
      duration,
      size,
      expiresAt: timestamp + duration * 1000,
    });
  }

  const ring = {
    id: ringId,
    x: originX,
    y: originY,
    expiresAt: timestamp + 700,
  };

  return { particles, ring };
}

export default function ReactionExplosionOverlay({ particles = [], rings = [] }) {
  if (particles.length === 0 && rings.length === 0) return null;

  return (
    <div className="particle-explosion-overlay" aria-hidden="true">
      {/* Shockwave Rings */}
      {rings.map(ring => (
        <div
          key={ring.id}
          className="explosion-flash-ring"
          style={{
            '--x': `${ring.x}px`,
            '--y': `${ring.y}px`,
          }}
        />
      ))}

      {/* Floating Emoji Particle Elements */}
      {particles.map(p => (
        <span
          key={p.id}
          className="explosion-particle"
          style={{
            '--x': `${p.x}px`,
            '--y': `${p.y}px`,
            '--dx': `${p.dx}px`,
            '--dy': `${p.dy}px`,
            '--scale': p.scale,
            '--rot': `${p.rot}deg`,
            '--duration': `${p.duration}s`,
            '--size': `${p.size}px`,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}
