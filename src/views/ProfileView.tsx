import { useState } from 'react';
import { useSessionStore } from '../store/sessionStore';
import { ProgressRing } from '../components/ProgressRing';
import { historicalChartData } from '../data/mockHistoricalData';

// Progress values from historical data
const lastSaccadic = historicalChartData[historicalChartData.length - 1].saccadic;
const prevSaccadic = historicalChartData[0].saccadic;
const saccadicImprovement = Math.round(((prevSaccadic - lastSaccadic) / prevSaccadic) * 100);

const lastConvergence = historicalChartData[historicalChartData.length - 1].convergence;
const prevConvergence = historicalChartData[0].convergence;
const convergenceImprovement = Math.round(((lastConvergence - prevConvergence) / prevConvergence) * 100);

const lastPursuit = historicalChartData[historicalChartData.length - 1].pursuit;
const prevPursuit = historicalChartData[0].pursuit;
const pursuitImprovement = Math.round(((lastPursuit - prevPursuit) / prevPursuit) * 100);



const SESSION_HISTORY = [
  { 
    id: 1, date: 'Today', time: '10:30 AM', game: 'Saccadic Therapy', result: '205 ms', trend: '↓ 13 ms', color: '#2563EB', bg: '#EFF6FF', 
    icon: <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg> 
  },
  { 
    id: 2, date: 'Yesterday', time: '4:15 PM', game: 'Smooth Pursuit', result: '92%', trend: '↑ 2%', color: '#14B8A6', bg: '#F0FDFA', 
    icon: <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M18.2 6.8c-2.4 0-4.6 2.6-6.2 5.2-1.6-2.6-3.8-5.2-6.2-5.2-2.7 0-4.8 2.2-4.8 5s2.1 5 4.8 5c2.4 0 4.6-2.6 6.2-5.2 1.6 2.6 3.8 5.2 6.2 5.2 2.7 0 4.8-2.2 4.8-5s-2.1-5-4.8-5z" /></svg> 
  },
  { 
    id: 3, date: 'Yesterday', time: '4:20 PM', game: 'Convergence', result: '148 px', trend: '↑ 10 px', color: '#7C3AED', bg: '#F5F3FF', 
    icon: <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg> 
  },
  { 
    id: 4, date: 'Mar 25, 2026', time: '9:00 AM', game: 'Saccadic Therapy', result: '218 ms', trend: '↓ 5 ms', color: '#2563EB', bg: '#EFF6FF', 
    icon: <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg> 
  },
  { 
    id: 5, date: 'Mar 24, 2026', time: '2:45 PM', game: 'Convergence', result: '138 px', trend: '↑ 15 px', color: '#7C3AED', bg: '#F5F3FF', 
    icon: <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg> 
  },
];

const BADGES_DATA = [
  { 
    name: '7-Day Streak', desc: 'Played 7 days in a row', 
    unlocked: true, color: '#F97316', bg: '#FFF7ED',
    icon: (
      <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2c0 0-5 6-5 12a5 5 0 0 0 10 0c0-6-5-12-5-12z" />
      </svg>
    )
  },
  { 
    name: 'Agility Master', desc: 'Sub-200ms Saccadic Latency', 
    unlocked: true, color: '#2563EB', bg: '#EFF6FF',
    icon: (
      <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    )
  },
  { 
    name: 'Endurance Pro', desc: '90%+ Smooth Pursuit Accuracy', 
    unlocked: true, color: '#14B8A6', bg: '#F0FDFA',
    icon: (
      <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M18.2 6.8c-2.4 0-4.6 2.6-6.2 5.2-1.6-2.6-3.8-5.2-6.2-5.2-2.7 0-4.8 2.2-4.8 5s2.1 5 4.8 5c2.4 0 4.6-2.6 6.2-5.2 1.6 2.6 3.8 5.2 6.2 5.2 2.7 0 4.8-2.2 4.8-5s-2.1-5-4.8-5z" />
      </svg>
    )
  },
  { 
    name: 'Iron Focus', desc: 'Reach 150px Convergence Break', 
    unlocked: false, color: '#94A3B8', bg: '#F1F5F9',
    icon: (
      <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    )
  },
];

export default function ProfileView() {
  const { setView, userName } = useSessionStore();
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [leaderboardTab, setLeaderboardTab] = useState<'saccadic' | 'pursuit' | 'convergence'>('saccadic');

  const defaultName = userName || 'Player';
  const initial = defaultName.charAt(0).toUpperCase();

  const LEADERBOARD_SACCADIC = [
    { rank: 1, name: 'Sarah Jenkins', score: '190 ms', isMe: false, avatar: 'S', color: '#10B981' },
    { rank: 2, name: defaultName, score: '205 ms', isMe: true, avatar: initial, color: '#2563EB' },
    { rank: 3, name: 'Mike Torres', score: '220 ms', isMe: false, avatar: 'M', color: '#F59E0B' },
    { rank: 4, name: 'Emma Watson', score: '245 ms', isMe: false, avatar: 'E', color: '#8B5CF6' },
  ];

  const LEADERBOARD_PURSUIT = [
    { rank: 1, name: defaultName, score: '92%', isMe: true, avatar: initial, color: '#2563EB' },
    { rank: 2, name: 'Emma Watson', score: '88%', isMe: false, avatar: 'E', color: '#8B5CF6' },
    { rank: 3, name: 'Sarah Jenkins', score: '85%', isMe: false, avatar: 'S', color: '#10B981' },
    { rank: 4, name: 'Mike Torres', score: '80%', isMe: false, avatar: 'M', color: '#F59E0B' },
  ];

  const LEADERBOARD_CONVERGENCE = [
    { rank: 1, name: 'Mike Torres', score: '160 px', isMe: false, avatar: 'M', color: '#F59E0B' },
    { rank: 2, name: defaultName, score: '148 px', isMe: true, avatar: initial, color: '#2563EB' },
    { rank: 3, name: 'Sarah Jenkins', score: '130 px', isMe: false, avatar: 'S', color: '#10B981' },
    { rank: 4, name: 'Emma Watson', score: '115 px', isMe: false, avatar: 'E', color: '#8B5CF6' },
  ];

  return (
    <div className="view-root animate-fade-in" style={{ background: 'var(--bg-base)', overflow: 'auto', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .badge-card:hover { transform: translateY(-4px); }
        .badge-card:hover .badge-icon-container { transform: scale(1.15) rotate(5deg); }
        .leaderboard-row:hover { transform: translateX(8px); }
      `}</style>

      {/* ── Header Bar ── */}
      <header style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        padding: '0 2rem',
        height: 68,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            className="btn-ghost no-print"
            onClick={() => setView('dashboard')}
            style={{ fontSize: '.8rem' }}
          >
            ← Dashboard
          </button>
          <div style={{ width: 1, height: 28, background: 'var(--border)' }} className="no-print" />
          <div>
            <div style={{ fontSize: '.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Player Profile</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, #60A5FA, #2563EB)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '.9rem', fontWeight: 700, color: '#fff',
            boxShadow: '0 4px 10px rgba(37,99,235,.2)',
          }}>{initial}</div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main style={{
        flex: 1, padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        maxWidth: 1000,
        margin: '0 auto',
        width: '100%',
      }}>
        
        {/* ── 1. Profile Card ── */}
        <div className="card" style={{ padding: '2rem', display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{
            width: 100, height: 100, borderRadius: '50%',
            background: 'linear-gradient(135deg, #60A5FA, #2563EB)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '3rem', fontWeight: 800, color: '#fff',
            boxShadow: '0 8px 24px rgba(37,99,235,.25)',
            flexShrink: 0
          }}>{initial}</div>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.1 }}>{defaultName}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginTop: '.75rem', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '.4rem', color: 'var(--text-secondary)', fontSize: '.9rem', fontWeight: 600 }}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Joined March 24, 2026
              </span>
              <span style={{ padding: '0 .5rem', color: 'var(--border)' }}>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '.3rem', color: '#EA580C', background: '#FFF7ED', padding: '.2rem .6rem', borderRadius: 999, fontSize: '.8rem', fontWeight: 700, border: '1px solid #FFEDD5' }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
                </svg>
                5 Day Streak
              </span>
            </div>
          </div>
        </div>

        {/* ── 2. Overall Progress ── */}
        <div className="card" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Overall Progress</h2>
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
            <ProgressRing label="Agility (Saccades)" value={saccadicImprovement} color="#2563EB" size={120} stroke={10} />
            <ProgressRing label="Endurance (Pursuits)" value={pursuitImprovement} color="#14B8A6" size={120} stroke={10} />
            <ProgressRing label="Strength (Convergence)" value={convergenceImprovement} color="#7C3AED" size={120} stroke={10} />
          </div>
        </div>

        {/* ── 3. Session History ── */}
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>Session History</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {(showAllHistory ? SESSION_HISTORY : SESSION_HISTORY.slice(0, 3)).map((session) => (
              <div key={session.id} style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.25rem', borderRadius: '1rem', border: '1px solid var(--border)' }}>
                <div style={{ width: 48, height: 48, borderRadius: '1rem', background: session.bg, color: session.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                  {session.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>{session.game}</div>
                  <div style={{ fontSize: '.85rem', color: 'var(--text-secondary)', marginTop: '.15rem', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    {session.date} <span style={{ color: 'var(--border)' }}>•</span> {session.time}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{session.result}</div>
                  <div style={{ fontSize: '.85rem', fontWeight: 700, color: session.trend.includes('↓') && session.game.includes('Saccadic') ? '#059669' : session.trend.includes('↑') ? '#059669' : '#DC2626', marginTop: '.15rem' }}>
                    {session.trend}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {!showAllHistory && SESSION_HISTORY.length > 3 && (
            <button 
              className="btn-ghost" 
              style={{ width: '100%', marginTop: '1rem', padding: '.75rem', fontSize: '.9rem', fontWeight: 700, border: '1px solid var(--border)' }}
              onClick={() => setShowAllHistory(true)}
            >
              View More Sessions
            </button>
          )}
        </div>

        {/* ── 4. Leaderboards ── */}
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>Leaderboards</h2>
            <div style={{ display: 'flex', background: 'var(--bg-muted)', padding: '.25rem', borderRadius: '.75rem', gap: '.25rem' }}>
              {[
                { id: 'saccadic', label: 'Agility' },
                { id: 'pursuit', label: 'Endurance' },
                { id: 'convergence', label: 'Strength' },
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setLeaderboardTab(tab.id as any)}
                  style={{ 
                    padding: '.4rem 1rem', borderRadius: '.5rem', fontSize: '.8rem', fontWeight: 700, 
                    background: leaderboardTab === tab.id ? '#fff' : 'transparent', 
                    color: leaderboardTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)', 
                    boxShadow: leaderboardTab === tab.id ? 'var(--shadow-sm)' : 'none', 
                    border: 'none', cursor: 'pointer', transition: 'all .2s' 
                  }}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            {(leaderboardTab === 'saccadic' ? LEADERBOARD_SACCADIC : leaderboardTab === 'pursuit' ? LEADERBOARD_PURSUIT : LEADERBOARD_CONVERGENCE).map((user, index) => (
              <div key={user.name} className="leaderboard-row" style={{ 
                display: 'flex', alignItems: 'center', gap: '1rem', 
                padding: '1rem 1.5rem', 
                borderRadius: '1rem',
                background: user.isMe ? 'var(--blue-50)' : index === 0 ? '#FFFBEB' : index === 1 ? '#F8FAFC' : index === 2 ? '#FEF2F2' : '#fff',
                border: user.isMe ? '2px solid var(--blue-200)' : index === 0 ? '1px solid #FDE68A' : index === 1 ? '1px solid #E2E8F0' : index === 2 ? '1px solid #FECACA' : '1px solid var(--border)',
                transition: 'transform .2s',
              }}>
                <div style={{ 
                  width: 40, fontSize: '1.25rem', fontWeight: 900, 
                  color: index === 0 ? '#F59E0B' : index === 1 ? '#94A3B8' : index === 2 ? '#B45309' : 'var(--text-muted)' 
                }}>
                  #{user.rank}
                </div>
                <div style={{ 
                  width: 48, height: 48, borderRadius: '50%', 
                  background: user.color, color: '#fff', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  fontSize: '1.25rem', fontWeight: 800, 
                  boxShadow: `0 4px 12px ${user.color}40`
                }}>
                  {user.avatar}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {user.name} {user.isMe && <span style={{ color: 'var(--blue-600)', fontSize: '.8rem', marginLeft: '.5rem' }}>(You)</span>}
                  </div>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                  {user.score}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 5. Badges & Achievements ── */}
        <div className="card" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Badges & Achievements</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            {BADGES_DATA.map((badge) => (
              <div key={badge.name} className="badge-card" style={{ 
                display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', 
                padding: '2rem 1.5rem', borderRadius: '1.25rem', 
                background: badge.unlocked ? badge.bg : 'var(--bg-muted)',
                border: badge.unlocked ? `1px solid ${badge.color}30` : '1px solid var(--border)',
                opacity: badge.unlocked ? 1 : 0.5, 
                filter: badge.unlocked ? 'none' : 'grayscale(1)',
                position: 'relative',
                transition: 'all .2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              }}>
                <div className="badge-icon-container" style={{ 
                  width: 64, height: 64, borderRadius: '50%', 
                  background: badge.unlocked ? '#fff' : '#E2E8F0', 
                  color: badge.unlocked ? badge.color : '#94A3B8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  marginBottom: '1rem', 
                  boxShadow: badge.unlocked ? `0 8px 16px ${badge.color}30` : 'none',
                  transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                }}>
                  {badge.icon}
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>{badge.name}</h3>
                <p style={{ fontSize: '.85rem', color: 'var(--text-secondary)', marginTop: '.5rem', lineHeight: 1.4 }}>{badge.desc}</p>
                {!badge.unlocked && (
                  <div style={{ position: 'absolute', top: 12, right: 12 }}>
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={2}>
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}