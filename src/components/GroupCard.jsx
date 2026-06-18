import React from 'react';

function getGroupVisuals(groupName) {
  const name = groupName || '';
  
  // Set fallback style
  let style = {
    color: '#38bdf8', // Default cyan/blue
    glowClass: 'default-glow',
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
    )
  };

  if (name.includes('TechGeeks')) {
    style = {
      color: '#c084fc', // Purple/blue lightning/brain/cpu
      glowClass: 'tech-glow',
      icon: (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="16" height="16" x="4" y="4" rx="2" />
          <rect width="6" height="6" x="9" y="9" rx="1" />
          <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3" />
        </svg>
      )
    };
  } else if (name.includes('Photo Geeks')) {
    style = {
      color: '#38bdf8', // Blue camera
      glowClass: 'photo-glow',
      icon: (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
          <circle cx="12" cy="13" r="3" />
        </svg>
      )
    };
  } else if (name.includes('Chess Geeks')) {
    style = {
      color: '#22c55e', // Green trophy/chess
      glowClass: 'chess-glow',
      icon: (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
          <path d="M12 2a6 6 0 0 1 6 6v5a6 6 0 0 1-6 6 6 6 0 0 1-6-6V8a6 6 0 0 1 6-6z" />
        </svg>
      )
    };
  } else if (name.includes('Broken Geeks')) {
    style = {
      color: '#f43f5e', // Pink/red broken heart
      glowClass: 'broken-glow',
      icon: (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          <path d="m12 5-1 2.5h2L12 10l-1.5 2 2.5 1-1 2" />
        </svg>
      )
    };
  } else if (name.includes('Irony Geeks')) {
    style = {
      color: '#f97316', // Orange smile/spark
      glowClass: 'irony-glow',
      icon: (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2" />
          <line x1="9" x2="9.01" y1="9" y2="9" />
          <line x1="15" x2="15.01" y1="9" y2="9" />
        </svg>
      )
    };
  } else if (name.includes('Maths & Physics Geeks')) {
    style = {
      color: '#06b6d4', // Cyan atom/calculator
      glowClass: 'maths-glow',
      icon: (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="12" rx="3" ry="10" transform="rotate(45 12 12)" />
          <ellipse cx="12" cy="12" rx="3" ry="10" transform="rotate(-45 12 12)" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      )
    };
  } else if (name.includes('Literature & Philosophy')) {
    style = {
      color: '#8b5cf6', // Violet book/pen
      glowClass: 'literature-glow',
      icon: (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
          <path d="M6 6h10M6 10h10" />
        </svg>
      )
    };
  } else if (name.includes('Anime Geeks')) {
    style = {
      color: '#ec4899', // Pink star/spark
      glowClass: 'anime-glow',
      icon: (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      )
    };
  } else if (name.includes('Cinema Geeks')) {
    style = {
      color: '#ef4444', // Red film
      glowClass: 'cinema-glow',
      icon: (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="15" x="2" y="3" rx="2" />
          <path d="M12 18h.01M17 18h.01M7 18h.01" />
          <path d="M2 8h20M2 14h20" />
        </svg>
      )
    };
  } else if (name.includes('Geopolitics')) {
    style = {
      color: '#3b82f6', // Blue globe
      glowClass: 'geopolitics-glow',
      icon: (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20" />
        </svg>
      )
    };
  } else if (name.includes('FactGeeks')) {
    style = {
      color: '#14b8a6', // Teal bulb/info
      glowClass: 'fact-glow',
      icon: (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1 .3 2.5 1.5 3.5.7.8 1.3 1.5 1.5 2.5" />
          <path d="M9 18h6M10 22h4" />
        </svg>
      )
    };
  } else if (name.includes('EventGeeks')) {
    style = {
      color: '#eab308', // Yellow megaphone/calendar
      glowClass: 'event-glow',
      icon: (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m4 11 12-7-2 9 7-1-12 11 2-9-7 1Z" />
        </svg>
      )
    };
  } else if (name.includes('Cyber Geeks')) {
    style = {
      color: '#10b981', // Green shield/terminal
      glowClass: 'cyber-glow',
      icon: (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      )
    };
  }

  return style;
}

export default function GroupCard({ group, zone, onPreselectGroup }) {
  const hasRealLink =
    group.whatsapp_link &&
    group.whatsapp_link !== 'Add WhatsApp Link Later' &&
    group.whatsapp_link.trim() !== '';

  function handleJoinGroup() {
    if (hasRealLink) {
      window.open(group.whatsapp_link, '_blank');
    } else {
      window.showToast('WhatsApp link not available yet', 'warning');
    }
  }

  const { color, glowClass, icon } = getGroupVisuals(group.name);

  return (
    <article className={`group-card glass-card ${glowClass}`}>
      <div className="group-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="zone-badge">{zone}</span>
        <div className="group-card-icon" style={{ color: color, filter: `drop-shadow(0 0 8px ${color})`, opacity: 0.9 }}>
          {icon}
        </div>
      </div>
      <h3 style={{ marginTop: '12px' }}>{group.name}</h3>
      <p>{group.description}</p>
      
      {hasRealLink ? (
        <a 
          className="whatsapp-link-btn" 
          href={group.whatsapp_link} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ display: 'inline-block', margin: '10px 0', color: '#00e676', textDecoration: 'none', fontWeight: 'bold' }}
        >
          🔗 Open WhatsApp Group
        </a>
      ) : (
        <div className="link-placeholder">🔗 WhatsApp link not available yet</div>
      )}

      <div className="card-actions">
        <button 
          className="primary-btn small-btn" 
          onClick={handleJoinGroup}
        >
          Join Group
        </button>
        <button 
          className="secondary-btn small-btn" 
          onClick={() => onPreselectGroup && onPreselectGroup(group.id)}
        >
          Post in this Group
        </button>
      </div>
    </article>
  );
}
