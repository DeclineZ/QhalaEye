import { ProgressRing } from '../components/ProgressRing';
import { useSessionStore } from '../store/sessionStore';
import { historicalChartData } from '../data/mockHistoricalData';

// Last 7 days for streak dots
const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const COMPLETED_DAYS = [true, true, true, true, true, false, false]; // Today is Sat

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

export default function DashboardView() {
  const { setView, resetSession, startSingleGame, userName } = useSessionStore();

  const handleStart = () => {
    resetSession();
    setView('game');
  };

  return (
    <div className="view-root" style={{ background: 'var(--bg-base)' }}>
      <style>{`
        .dashboard-main {
          display: grid;
          grid-template-columns: 1fr 360px;
        }
        .mission-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        }
        .stats-grid {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        @media (max-width: 1024px) {
          .dashboard-main { grid-template-columns: 1fr; }
          .stats-grid { flex-direction: row; }
        }
        @media (max-width: 640px) {
          .stats-grid { flex-direction: column; }
        }
      `}</style>

      {/* ── Header Bar ────────────────────────────────────── */}
      <header style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        padding: '0 1.25rem',
        height: 68,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
        boxShadow: 'var(--shadow-sm)',
      }}>
        {/* Logo + Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src="/QhalaEye.png" alt="QhalaEye Logo" style={{
            width: 44, height: 44,
            objectFit: 'contain',
            transform: 'scale(2.2)'
          }} />
          <div>
            <div style={{ fontSize: '.7rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '.06em', textTransform: 'uppercase' }}>QhalaEye</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
              Welcome back, {userName || 'Player'}!
            </div>
          </div>
        </div>

        {/* Right: clinical button + avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <button
            id="clinical-view-btn"
            className="btn-ghost"
            onClick={() => setView('clinical')}
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Clinical View
          </button>

          <button
            id="profile-view-btn"
            className="btn-ghost"
            onClick={() => setView('profile')}
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              <circle cx={12} cy={7} r={4} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Profile
          </button>
        </div>
      </header>

      {/* ── Main Content ──────────────────────────────────── */}
      <main className="dashboard-main" style={{
        flex: 1, overflow: 'auto',
        gap: '1.25rem',
        padding: '1.25rem',
      }}>
        {/* ── Left Column: Active Quest ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Streak Calendar */}
          <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '1.25rem',
                background: 'linear-gradient(135deg, #FF9800, #F97316)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(249, 115, 22, 0.3)',
                color: '#fff'
              }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>5</div>
                <div style={{ fontSize: '.85rem', fontWeight: 800, color: '#F97316', textTransform: 'uppercase', letterSpacing: '.05em', marginTop: '.35rem' }}>Day Streak</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flex: 1, justifyContent: 'flex-end' }}>
              {WEEK_DAYS.map((day, i) => {
                const done = COMPLETED_DAYS[i];
                const isToday = i === 5;
                return (
                  <div key={day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.5rem' }}>
                    <span style={{ fontSize: '.7rem', fontWeight: 800, color: isToday ? '#F97316' : done ? 'var(--text-primary)' : 'var(--text-muted)', textTransform: 'uppercase' }}>{day[0]}</span>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: done ? '#F97316' : isToday ? '#FFF7ED' : 'transparent',
                      border: done ? '2px solid #F97316' : isToday ? '2px dashed #F97316' : '2px solid var(--border)',
                      color: done ? '#fff' : isToday ? '#F97316' : 'var(--border)',
                      transition: 'all .2s'
                    }}>
                      {done ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill={isToday ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                        </svg>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Today's Mission (Centered & Huge) */}
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '2rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <p style={{ fontSize: '.8rem', fontWeight: 700, color: 'var(--blue-600)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '.5rem' }}>Today's Training</p>
              <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--text-primary)' }}>Daily Vision Quest</h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: '.5rem' }}>Complete all 3 exercises to maintain your streak.</p>
            </div>

            <div className="mission-grid" style={{
              gap: '1.5rem',
              marginBottom: '3rem'
            }}>
              {[
                {
                  label: 'Saccadic', sublabel: 'Agility', color: '#2563EB', bg: '#EFF6FF', desc: 'Rapid eye movement jumps',
                  icon: <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                },
                {
                  label: 'Smooth Pursuit', sublabel: 'Endurance', color: '#14B8A6', bg: '#F0FDFA', desc: 'Fluid object tracking',
                  icon: <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M18.2 6.8c-2.4 0-4.6 2.6-6.2 5.2-1.6-2.6-3.8-5.2-6.2-5.2-2.7 0-4.8 2.2-4.8 5s2.1 5 4.8 5c2.4 0 4.6-2.6 6.2-5.2 1.6 2.6 3.8 5.2 6.2 5.2 2.7 0 4.8-2.2 4.8-5s-2.1-5-4.8-5z" /></svg>
                },
                {
                  label: 'Convergence', sublabel: 'Strength', color: '#7C3AED', bg: '#F5F3FF', desc: 'Near-point focus training',
                  icon: <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>
                },
              ].map((g, i) => (
                <div
                  key={i}
                  onClick={() => startSingleGame(i)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                    padding: '2rem 1.5rem', borderRadius: '1.5rem',
                    background: 'var(--bg-surface)',
                    border: `2px solid ${g.color}15`,
                    cursor: 'pointer',
                    transition: 'all .3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.08)';
                    e.currentTarget.style.borderColor = g.color;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                    e.currentTarget.style.borderColor = `${g.color}15`;
                  }}
                >
                  <div style={{
                    width: 64, height: 64, borderRadius: '1.25rem',
                    background: g.color, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '2rem', marginBottom: '1.25rem',
                    boxShadow: `0 8px 20px ${g.color}40`,
                  }}>{g.icon}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{g.label}</div>
                  <div style={{ fontSize: '.8rem', fontWeight: 600, color: g.color, textTransform: 'uppercase', marginTop: '.25rem' }}>{g.sublabel}</div>
                  <p style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginTop: '.75rem', lineHeight: 1.4 }}>{g.desc}</p>

                  <div style={{
                    marginTop: '1.5rem', width: '100%', height: 4, background: 'var(--bg-muted)', borderRadius: 2,
                    overflow: 'hidden'
                  }}>
                    <div style={{ width: '0%', height: '100%', background: g.color }} />
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                id="start-mission-btn"
                className="btn-primary"
                style={{ fontSize: '1.25rem', padding: '1.25rem 2rem', borderRadius: '1.25rem', width: '100%', maxWidth: 400 }}
                onClick={handleStart}
              >
                <svg width={24} height={24} viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
                  <path d="M5 3L19 12L5 21V3Z" fill="white" />
                </svg>
                Start Today's 15-Min Mission
              </button>
            </div>
          </div>
        </div>

        {/* ── Right Column: Analytics & Stats ── */}
        <div className="stats-grid">

          {/* Overall Progress Rings */}
          <div className="card" style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <p style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '1rem' }}>Overall Progress</p>
            <div style={{
              display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1, justifyContent: 'center'
            }}>
              <ProgressRing label="Agility (Saccades)" value={saccadicImprovement} color="#2563EB" size={100} stroke={8} />
              <div style={{ height: 1, background: 'var(--border)' }} />
              <ProgressRing label="Endurance (Pursuits)" value={pursuitImprovement} color="#14B8A6" size={100} stroke={8} />
              <div style={{ height: 1, background: 'var(--border)' }} />
              <ProgressRing label="Strength (Convergence)" value={convergenceImprovement} color="#7C3AED" size={100} stroke={8} />
            </div>
          </div>

          {/* Last session stats */}
          <div className="card" style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <p style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.75rem' }}>Last Session Performance</p>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {[
                { label: 'Saccadic Latency', value: `${lastSaccadic} ms`, delta: `↓${saccadicImprovement}%`, good: true },
                { label: 'Pursuit Accuracy', value: `${lastPursuit}%`, delta: `↑${pursuitImprovement}%`, good: true },
                { label: 'Convergence Break', value: `${lastConvergence} px`, delta: `↑${convergenceImprovement}%`, good: true },
              ].map((stat, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '.5rem 0',
                  borderBottom: i < 2 ? '1px solid var(--border)' : 'none',
                }}>
                  <span style={{ fontSize: '.82rem', color: 'var(--text-secondary)' }}>{stat.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                    <span style={{ fontSize: '.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{stat.value}</span>
                    <span style={{
                      fontSize: '.7rem', fontWeight: 600,
                      color: stat.good ? '#059669' : '#DC2626',
                      background: stat.good ? '#ECFDF5' : '#FEF2F2',
                      padding: '.1rem .4rem', borderRadius: 999,
                    }}>{stat.delta}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
