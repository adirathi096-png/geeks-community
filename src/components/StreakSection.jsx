import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

// Helper to render responsive and highly styled badge icons
function renderBadgeIcon(iconName, status) {
  const isUnlocked = status === 'unlocked';
  const isNextUp = status === 'next-up';
  const primaryColor = isUnlocked ? '#a855f7' : isNextUp ? '#06b6d4' : '#64748b';
  
  return (
    <svg 
      viewBox="0 0 24 24" 
      width="34" 
      height="34" 
      fill="none" 
      stroke={primaryColor} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      style={{ filter: isUnlocked ? 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.5))' : 'none' }}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill={isUnlocked ? 'rgba(168, 85, 247, 0.15)' : 'transparent'} />
      {isUnlocked ? (
        <path d="M12 7l1.82 3.69 4.07.59-2.95 2.87.7 4.06-3.64-1.91-3.64 1.91.7-4.06-2.95-2.87 4.07-.59z" fill="#a855f7" />
      ) : isNextUp ? (
        <circle cx="12" cy="12" r="3" fill="#06b6d4" />
      ) : (
        <rect width="8" height="6" x="8" y="11" rx="1" fill="#64748b" />
      )}
    </svg>
  );
}

export default function StreakSection({ streak, posts = [] }) {
  const currentStreak = streak.current_streak !== undefined ? streak.current_streak : (streak.current || 0);
  const totalPosts = streak.total_posts !== undefined ? streak.total_posts : (streak.totalPosts || 0);
  
  let lastActiveDayRaw = streak.last_post_at !== undefined ? streak.last_post_at : streak.lastActiveDay;
  let lastActiveDay = 'Not active yet';
  if (lastActiveDayRaw && lastActiveDayRaw !== 'Not active yet') {
    try {
      const d = new Date(lastActiveDayRaw);
      if (!isNaN(d.getTime())) {
        lastActiveDay = d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
      } else {
        lastActiveDay = lastActiveDayRaw;
      }
    } catch {
      lastActiveDay = lastActiveDayRaw;
    }
  }

  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data, error } = await supabase
          .from('streaks')
          .select('*')
          .gt('current_streak', 0)
          .not('last_post_at', 'is', null)
          .gte('last_post_at', twentyFourHoursAgo);

        if (error) {
          console.error('Error fetching leaderboard:', error);
        } else if (data) {
          const sorted = [...data].map(streakItem => {
            const count = posts.filter(post =>
              (post.user_id && post.user_id === streakItem.user_id) ||
              (post.user_email && post.user_email === streakItem.user_email) ||
              (post.author_email && post.author_email === streakItem.user_email)
            ).length;
            return {
              ...streakItem,
              visiblePostsCount: count
            };
          }).sort((a, b) => {
            if (b.current_streak !== a.current_streak) {
              return b.current_streak - a.current_streak;
            }
            if (b.visiblePostsCount !== a.visiblePostsCount) {
              return b.visiblePostsCount - a.visiblePostsCount;
            }
            const dateA = a.last_post_at ? new Date(a.last_post_at).getTime() : 0;
            const dateB = b.last_post_at ? new Date(b.last_post_at).getTime() : 0;
            return dateB - dateA;
          });
          setLeaderboard(sorted);
        }
      } catch (err) {
        console.error('fetchLeaderboard error:', err);
      } finally {
        setLoadingLeaderboard(false);
      }
    }

    fetchLeaderboard();
  }, [streak, posts]);

  // Define Badge Milestones
  const badgesList = [
    { name: 'Started', days: 1, label: '1 Day', icon: 'medal' },
    { name: 'Consistent', days: 3, label: '3 Days', icon: 'trophy' },
    { name: 'Weekly Warrior', days: 7, label: '7 Days', icon: 'shield' },
    { name: 'Community Star', days: 15, label: '15 Days', icon: 'star' },
    { name: 'Legend', days: 30, label: '30 Days', icon: 'legend' }
  ];

  // Dynamic next milestone calculation
  let nextMilestone = 1;
  let nextBadgeName = "Started";
  
  if (currentStreak >= 30) {
    nextMilestone = 30;
    nextBadgeName = "Legend";
  } else if (currentStreak >= 15) {
    nextMilestone = 30;
    nextBadgeName = "Legend";
  } else if (currentStreak >= 7) {
    nextMilestone = 15;
    nextBadgeName = "Community Star";
  } else if (currentStreak >= 3) {
    nextMilestone = 7;
    nextBadgeName = "Weekly Warrior";
  } else if (currentStreak >= 1) {
    nextMilestone = 3;
    nextBadgeName = "Consistent";
  } else {
    nextMilestone = 1;
    nextBadgeName = "Started";
  }

  const isLegendUnlocked = currentStreak >= 30;
  const remainingDays = nextMilestone - currentStreak;
  const progressPercentage = Math.min((currentStreak / nextMilestone) * 100, 100);
  const nextUpIndex = badgesList.findIndex(b => currentStreak < b.days);

  return (
    <section id="streak" className="section-shell">
      {/* 1. Pill above title, Title, Subtitle */}
      <div className="section-heading" style={{ marginBottom: '30px' }}>
        <span className="activity-pill" style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          borderRadius: '999px', 
          padding: '6px 16px', 
          background: 'rgba(99, 102, 241, 0.12)', 
          border: '1px solid rgba(99, 102, 241, 0.22)', 
          fontSize: '0.8rem', 
          fontWeight: 'bold', 
          color: '#818cf8', 
          marginBottom: '12px' 
        }}>
          Activity Tracker
        </span>
        <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontWeight: '800', letterSpacing: '-0.04em' }}>Your Posting Streak 🔥</h2>
        <p style={{ color: 'var(--muted)', fontSize: '1.05rem', marginTop: '8px' }}>
          Keep posting daily to grow your streak and unlock amazing badges! 🚀
        </p>
      </div>

      {/* 2. Hero Streak Card */}
      <div className="streak-hero-card glass-card">
        {/* Left side: Active day streak count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '30px', flexWrap: 'wrap' }}>
          <div className="flame-container">
            {/* Spark circles */}
            <div className="flame-spark" style={{ top: '15%', left: '25%' }} />
            <div className="flame-spark" style={{ top: '25%', right: '20%' }} />
            <div className="flame-spark" style={{ bottom: '20%', left: '30%' }} />
            <div className="flame-spark" style={{ bottom: '15%', right: '25%' }} />
            
            {/* High-fidelity Vector Flame SVG */}
            <svg viewBox="0 0 24 24" width="70" height="70" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="flameGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#ea580c" />
                  <stop offset="40%" stopColor="#f97316" />
                  <stop offset="80%" stopColor="#facc15" />
                  <stop offset="100%" stopColor="#fff" />
                </linearGradient>
              </defs>
              <path d="M17.5 10.5C17.5 14.6421 14.1421 18 10 18C5.85786 18 2.5 14.6421 2.5 10.5C2.5 7.64969 4.16562 5.10931 6.5 3.5C6.5 6.5 8 8.5 10 8.5C12 8.5 13 6.5 13 3C16 4.5 17.5 7.5 17.5 10.5Z" fill="url(#flameGrad)" style={{ filter: 'drop-shadow(0 0 12px rgba(249, 115, 22, 0.6))' }} />
              <path d="M13.5 13.5C13.5 15.433 11.933 17 10 17C8.067 17 6.5 15.433 6.5 13.5C6.5 12.0628 7.37894 10.8407 8.5 10C8.5 11.5 9 12.5 10 12.5C11 12.5 11.5 11.5 11.5 10C12.7211 10.8407 13.5 12.0628 13.5 13.5Z" fill="#ffedd5" />
            </svg>
          </div>
          <div>
            <p style={{ textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.1em', opacity: 0.6, margin: 0 }}>You are on a</p>
            <h3 style={{ fontSize: '2.2rem', fontWeight: '800', margin: '4px 0 12px 0', background: 'linear-gradient(90deg, #f97316, #facc15)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {currentStreak} Day Streak!
            </h3>
            <span style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              padding: '6px 14px', 
              borderRadius: '999px', 
              background: 'rgba(139, 92, 246, 0.15)', 
              border: '1px solid rgba(139, 92, 246, 0.25)', 
              fontSize: '0.85rem', 
              color: '#c084fc', 
              fontWeight: '600' 
            }}>
              ⭐ Great Start! Keep it up!
            </span>
          </div>
        </div>

        {/* Right side: Milestone metrics and progress bar */}
        <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.08)', paddingLeft: '30px', display: 'flex', flexDirection: 'column', gap: '12px' }} className="hero-right">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                width: '44px', 
                height: '44px', 
                borderRadius: '50%', 
                background: 'rgba(139, 92, 246, 0.15)', 
                border: '1px solid rgba(139, 92, 246, 0.3)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#c084fc'
              }}>
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                  <path d="M4 22h16" />
                  <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
                  <path d="M12 2a6 6 0 0 1 6 6v5a6 6 0 0 1-6 6 6 6 0 0 1-6-6V8a6 6 0 0 1 6-6z" />
                </svg>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6, margin: 0 }}>Next Milestone</p>
                <h4 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0, color: 'var(--text)' }}>{nextBadgeName}</h4>
              </div>
            </div>
            <span style={{ fontSize: '0.9rem', color: '#c084fc', fontWeight: 'bold' }}>at {nextMilestone} Days</span>
          </div>

          <div style={{ marginTop: '5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
              <span style={{ opacity: 0.7 }}>Progress to next badge</span>
              <strong style={{ color: 'var(--text)' }}>{currentStreak} / {nextMilestone} Days</strong>
            </div>
            <div style={{ width: '100%', height: '10px', borderRadius: '999px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <div style={{ 
                width: `${progressPercentage}%`, 
                height: '100%', 
                background: 'linear-gradient(90deg, #7c3aed, #06b6d4)', 
                borderRadius: '999px',
                transition: 'width 0.5s ease' 
              }} />
            </div>
          </div>

          <p style={{ margin: 0, fontSize: '0.85rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '500' }}>
            ✨ {isLegendUnlocked ? 'Legend unlocked! 🎉' : `${remainingDays} more active day${remainingDays > 1 ? 's' : ''} to unlock`}
          </p>
        </div>
      </div>

      {/* 3. Stat Cards */}
      <div className="streak-grid" style={{ marginBottom: '25px' }}>
        {/* Card 1: Total Posts */}
        <div className="stat-card glass-card gamified-stat-card purple" style={{ display: 'flex', alignItems: 'center', gap: '20px', textAlign: 'left', position: 'relative' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '16px', background: 'rgba(168, 85, 247, 0.15)', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', color: '#c084fc', flexShrink: 0 }}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          </div>
          <div style={{ zIndex: 1 }}>
            <p style={{ margin: 0, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6 }}>Total Posts</p>
            <h3 style={{ margin: '4px 0', fontSize: '1.8rem', fontWeight: '800' }}>{totalPosts}</h3>
            <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.5 }}>All time posts in community</p>
          </div>
          <svg viewBox="0 0 100 25" width="100%" height="25" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 10, left: 0, opacity: 0.2, color: '#a855f7' }}>
            <path d="M0 10 Q25 20, 50 10 T100 10 L100 25 L0 25 Z" fill="currentColor" />
          </svg>
        </div>

        {/* Card 2: Last Active Day */}
        <div className="stat-card glass-card gamified-stat-card blue" style={{ display: 'flex', alignItems: 'center', gap: '20px', textAlign: 'left', position: 'relative' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '16px', background: 'rgba(14, 165, 233, 0.15)', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', color: '#38bdf8', flexShrink: 0 }}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" x2="16" y1="2" y2="6" />
              <line x1="8" x2="8" y1="2" y2="6" />
              <line x1="3" x2="21" y1="10" y2="10" />
            </svg>
          </div>
          <div style={{ zIndex: 1 }}>
            <p style={{ margin: 0, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6 }}>Last Active Day</p>
            <h3 style={{ margin: '4px 0', fontSize: '1.25rem', fontWeight: '800', color: 'var(--text)' }}>{lastActiveDay}</h3>
            <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.5 }}>Keep posting every day!</p>
          </div>
          <svg viewBox="0 0 100 25" width="100%" height="25" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 10, left: 0, opacity: 0.2, color: '#3b82f6' }}>
            <path d="M0 15 Q25 5, 50 15 T100 15 L100 25 L0 25 Z" fill="currentColor" />
          </svg>
        </div>

        {/* Card 3: Next Milestone */}
        <div className="stat-card glass-card gamified-stat-card green" style={{ display: 'flex', alignItems: 'center', gap: '20px', textAlign: 'left', position: 'relative' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.15)', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', color: '#34d399', flexShrink: 0 }}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
          </div>
          <div style={{ zIndex: 1 }}>
            <p style={{ margin: 0, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6 }}>Next Milestone</p>
            <h3 style={{ margin: '4px 0', fontSize: '1.8rem', fontWeight: '800' }}>{isLegendUnlocked ? 'Legend' : `${nextMilestone} Days`}</h3>
            <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.5 }}>Consistency is the key!</p>
          </div>
          <svg viewBox="0 0 100 25" width="100%" height="25" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 10, left: 0, opacity: 0.2, color: '#10b981' }}>
            <path d="M0 8 Q25 18, 50 8 T100 8 L100 25 L0 25 Z" fill="currentColor" />
          </svg>
        </div>
      </div>

      {/* 4. Split Layout for Badges and Tips */}
      <div className="split-layout streak-split" style={{ alignItems: 'stretch' }}>
        
        {/* Left Side: Achievement Badges */}
        <div className="glass-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '25px', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              🏅 Your Achievement Badges
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', opacity: 0.6 }}>
              Unlock badges by maintaining your posting streak
            </p>
          </div>

          <div className="badges-scroll-row">
            <div className="badges-connector-line" />
            
            {badgesList.map((badge, idx) => {
              const isUnlocked = currentStreak >= badge.days;
              const isNextUp = !isUnlocked && idx === nextUpIndex;
              
              let status = 'locked';
              if (isUnlocked) status = 'unlocked';
              else if (isNextUp) status = 'next-up';

              return (
                <div key={badge.name} className="badge-item-container">
                  <div className={`badge-medal-wrapper ${status}`} style={{ position: 'relative' }}>
                    {renderBadgeIcon(badge.icon, status)}
                    {isUnlocked && (
                      <div style={{
                        position: 'absolute',
                        bottom: '-2px',
                        right: '-2px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: '#00e676',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        border: '2px solid #0a1020',
                        fontSize: '10px',
                        fontWeight: 'bold'
                      }}>
                        ✓
                      </div>
                    )}
                    {isNextUp && (
                      <div style={{
                        position: 'absolute',
                        bottom: '-2px',
                        right: '-2px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: '#06b6d4',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        border: '2px solid #0a1020',
                        fontSize: '10px',
                        fontWeight: 'bold'
                      }}>
                        ★
                      </div>
                    )}
                  </div>
                  <div style={{ marginTop: '10px', textAlign: 'center' }} className="badge-labels">
                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: isUnlocked ? 'var(--text)' : 'var(--muted)' }}>{badge.name}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '2px' }}>{badge.label}</div>
                    <span style={{ 
                      marginTop: '6px', 
                      display: 'inline-flex', 
                      fontSize: '0.7rem', 
                      padding: '2px 8px', 
                      borderRadius: '4px',
                      fontWeight: 'bold',
                      backgroundColor: isUnlocked ? 'rgba(0,230,118,0.15)' : isNextUp ? 'rgba(6,182,212,0.15)' : 'rgba(255,255,255,0.05)',
                      color: isUnlocked ? '#00e676' : isNextUp ? '#06b6d4' : '#64748b'
                    }}>
                      {isUnlocked ? 'Unlocked' : isNextUp ? 'Next Up' : 'Locked'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Streak Tips */}
        <div className="glass-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            💡 Streak Tips
          </h3>

          <div style={{ display: 'grid', gap: '16px', marginTop: '10px' }}>
            {/* Tip 1 */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ color: '#c084fc', marginTop: '3px' }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text)', opacity: 0.9 }}>Post daily to maintain your streak</p>
            </div>

            {/* Tip 2 */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ color: '#c084fc', marginTop: '3px' }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
                  <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
                </svg>
              </div>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text)', opacity: 0.9 }}>Share useful content with others</p>
            </div>

            {/* Tip 3 */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ color: '#c084fc', marginTop: '3px' }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text)', opacity: 0.9 }}>Engage with the community</p>
            </div>

            {/* Tip 4 */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ color: '#c084fc', marginTop: '3px' }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" x2="12" y1="8" y2="12" />
                  <line x1="12" x2="12.01" y1="16" y2="16" />
                </svg>
              </div>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text)', opacity: 0.9 }}>Don't break your streak!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Streak Leaderboard Section */}
      <div className="leaderboard-section glass-card" style={{ marginTop: '40px', padding: '30px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            🏆 Streak Leaderboard
          </h3>
          <p style={{ color: 'var(--muted)', fontSize: '1rem', marginTop: '6px', margin: 0 }}>
            Top active students keeping their posting streak alive
          </p>
        </div>

        {loadingLeaderboard ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>
            <div className="spinner" style={{ width: '30px', height: '30px', margin: '0 auto 10px' }}></div>
            Loading Leaderboard...
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="leaderboard-empty" style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)', fontSize: '1.1rem' }}>
            No active streaks yet. Be the first to start!
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="leaderboard-desktop-view">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--muted)', fontSize: '0.9rem' }}>
                    <th style={{ padding: '12px 16px' }}>Rank</th>
                    <th style={{ padding: '12px 16px' }}>Student</th>
                    <th style={{ padding: '12px 16px' }}>Streak</th>
                    <th style={{ padding: '12px 16px' }}>Total Posts</th>
                    <th style={{ padding: '12px 16px' }}>Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((item, index) => {
                    const rank = index + 1;
                    const isTop3 = rank <= 3;
                    const glowClass = rank === 1 ? 'gold-glow' : rank === 2 ? 'silver-glow' : rank === 3 ? 'bronze-glow' : '';
                    const medalSymbol = rank === 1 ? '👑' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
                    
                    let dateStr = 'Never';
                    if (item.last_post_at) {
                      try {
                        const d = new Date(item.last_post_at);
                        if (!isNaN(d.getTime())) {
                          dateStr = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
                        }
                      } catch {}
                    }

                    return (
                      <tr 
                        key={item.id} 
                        className={`leaderboard-row ${isTop3 ? `top-rank ${glowClass}` : ''}`}
                        style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}
                      >
                        <td style={{ padding: '16px', fontWeight: 'bold' }}>
                          <span className={`rank-badge rank-${rank}`}>{medalSymbol}</span>
                        </td>
                        <td style={{ padding: '16px', fontWeight: '600' }}>
                          {item.full_name || item.user_email}
                        </td>
                        <td style={{ padding: '16px', fontWeight: 'bold' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#f97316' }}>
                            🔥 {item.current_streak} days
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>{item.visiblePostsCount}</td>
                        <td style={{ padding: '16px', color: 'var(--muted)', fontSize: '0.9rem' }}>{dateStr}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="leaderboard-mobile-view">
              <div style={{ display: 'grid', gap: '14px' }}>
                {leaderboard.map((item, index) => {
                  const rank = index + 1;
                  const isTop3 = rank <= 3;
                  const glowClass = rank === 1 ? 'gold-glow' : rank === 2 ? 'silver-glow' : rank === 3 ? 'bronze-glow' : '';
                  const medalSymbol = rank === 1 ? '👑' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
                  
                  let dateStr = 'Never';
                  if (item.last_post_at) {
                    try {
                      const d = new Date(item.last_post_at);
                      if (!isNaN(d.getTime())) {
                        dateStr = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
                      }
                    } catch {}
                  }

                  return (
                    <div 
                      key={item.id} 
                      className={`leaderboard-card glass-card ${isTop3 ? `top-rank-card ${glowClass}` : ''}`}
                      style={{ padding: '16px', position: 'relative' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span className={`rank-badge rank-${rank}`} style={{ fontWeight: 'bold' }}>{medalSymbol}</span>
                        <span style={{ fontWeight: 'bold', color: '#f97316', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          🔥 {item.current_streak} days
                        </span>
                      </div>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: '700' }}>
                        {item.full_name || item.user_email}
                      </h4>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--muted)' }}>
                        <span>Total Posts: <strong>{item.visiblePostsCount}</strong></span>
                        <span>Active: <strong>{dateStr}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* 6. Bottom Motivational Banner */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '35px' }}>
        <div className="motivational-banner" style={{ padding: '12px 28px', textAlign: 'center', fontSize: '0.92rem', color: '#c084fc', fontWeight: '600' }}>
          Consistency today, recognition tomorrow! Keep building, keep sharing! 🚀
        </div>
      </div>
    </section>
  );
}
