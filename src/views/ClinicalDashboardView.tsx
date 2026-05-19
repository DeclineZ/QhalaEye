import {
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart,
} from 'recharts';
import { useSessionStore } from '../store/sessionStore';
import { historicalChartData } from '../data/mockHistoricalData';

const CHART_DATA_SPARSE = historicalChartData.filter((_, i) => i % 3 === 0 || i === 29);

// Custom tooltip
function CustomTooltip({ active, payload, label, unit }: {
  active?: boolean; payload?: Array<{ value: number }>; label?: string; unit: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#fff', border: '1px solid #E2E8F0',
      borderRadius: '.75rem', padding: '.6rem 1rem',
      boxShadow: '0 4px 12px rgba(0,0,0,.08)',
      fontSize: '.82rem',
    }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: '.2rem' }}>{label}</p>
      <p style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
        {payload[0].value} {unit}
      </p>
    </div>
  );
}

export default function ClinicalDashboardView() {
  const { setView, sessionMetrics, userName } = useSessionStore();

  // Append live session data to chart if available
  const liveChartData = (() => {
    const base = [...CHART_DATA_SPARSE];
    if (sessionMetrics.saccadicLatency !== null || sessionMetrics.convergenceBreakPoint !== null) {
      base.push({
        date: 'Today ★',
        saccadic: sessionMetrics.saccadicLatency ?? base[base.length - 1].saccadic,
        convergence: sessionMetrics.convergenceBreakPoint ?? base[base.length - 1].convergence,
        pursuit: sessionMetrics.gazeAccuracy ?? base[base.length - 1].pursuit,
      });
    }
    return base;
  })();

  const hasSession = sessionMetrics.saccadicLatency !== null
    || sessionMetrics.gazeAccuracy !== null
    || sessionMetrics.convergenceBreakPoint !== null;

  const handlePrint = () => window.print();

  return (
    <div className="view-root print-page" style={{ background: 'var(--bg-base)', overflow: 'auto' }}>
      <style>{`
        .clinical-main-grid {
          display: grid;
          grid-template-columns: 1fr 280px;
          gap: 1.25rem;
        }
        .clinical-sidebar {
          grid-column: 2;
          grid-row: 1 / 3;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .clinical-metrics-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }
        .hide-sm { display: inline; }
        @media (max-width: 1024px) {
          .clinical-main-grid { grid-template-columns: 1fr; }
          .clinical-sidebar { grid-column: 1; grid-row: auto; flex-direction: row; }
          .clinical-sidebar > * { flex: 1; }
        }
        @media (max-width: 768px) {
          .clinical-sidebar { flex-direction: column; }
          .clinical-metrics-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .hide-sm { display: none; }
          .clinical-header { padding: 0 1.25rem !important; }
        }
      `}</style>

      {/* ── Header ── */}
      <header className="clinical-header" style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        padding: '0 2rem',
        height: 68,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Back button */}
          <button
            id="back-to-dashboard"
            className="btn-ghost no-print"
            onClick={() => setView('dashboard')}
            style={{ fontSize: '.8rem' }}
          >
            ← Dashboard
          </button>
          <div style={{ width: 1, height: 28, background: 'var(--border)' }} className="no-print" />

          <div>
            <div style={{ fontSize: '.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
              Clinical Report · Session #12
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            id="generate-pdf-btn"
            className="btn-primary no-print"
            style={{ fontSize: '.85rem', padding: '.6rem 1.25rem' }}
            onClick={handlePrint}
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <path d="M17 17H20a2 2 0 002-2v-4a2 2 0 00-2-2H4a2 2 0 00-2 2v4a2 2 0 002 2h3" stroke="white" strokeWidth={2} strokeLinecap="round" />
              <rect x={7} y={13} width={10} height={8} rx={1} stroke="white" strokeWidth={2} />
              <path d="M7 3h10v4H7z" stroke="white" strokeWidth={2} />
            </svg>
            <span className="hide-sm"> Generate Clinical PDF</span>
          </button>
        </div>
      </header>

      {/* ── Main content ── */}
      <div className="clinical-main-grid" style={{
        flex: 1, padding: '1.25rem', overflow: 'auto',
      }}>

        {/* ── Chart A: Saccadic Latency ── */}
        <div className="card" style={{ padding: '1.25rem', gridColumn: 1 }}>
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                Chart A · Saccadic Therapy
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Reaction Latency (ms)</div>
              <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginTop: '.15rem' }}>
                Lower values indicate faster eye movement response
              </div>
            </div>
            <div style={{ display: 'flex', gap: '.5rem' }}>
              <span style={{
                fontSize: '.7rem', padding: '.2rem .6rem', borderRadius: 999,
                background: '#ECFDF5', color: '#059669', fontWeight: 600,
              }}>
                ↓{Math.round(((460 - 205) / 460) * 100)}% improvement
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={liveChartData} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="saccGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} unit=" ms" />
              <Tooltip content={<CustomTooltip unit="ms" />} />
              <Area type="monotone" dataKey="saccadic" stroke="#2563EB" strokeWidth={2.5}
                fill="url(#saccGrad)" dot={false}
                activeDot={{ r: 5, fill: '#2563EB', stroke: '#fff', strokeWidth: 2 }} />
              {sessionMetrics.saccadicLatency !== null && (
                <ReferenceLine
                  x="Today ★"
                  stroke="#2563EB"
                  strokeDasharray="4 4"
                  label={{ value: 'Live', fill: '#2563EB', fontSize: 10 }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ── Patient Info sidebar ── */}
        <div className="clinical-sidebar">
          <div className="card" style={{ padding: '1.25rem' }}>
            <p style={{ fontSize: '.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.75rem' }}>Patient Info</p>
            {[
              { label: 'Name', value: userName || 'Unknown Patient' },
              { label: 'DOB', value: 'March 14, 2018' },
              { label: 'Age', value: '8 years' },
              { label: 'Program Start', value: 'Mar 24, 2026' },
              { label: 'Session #', value: '12 / 30' },
            ].map(({ label, value }) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '.4rem 0', borderBottom: '1px solid var(--border)',
                fontSize: '.8rem',
              }}>
                <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right', maxWidth: '55%' }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Compliance score */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <p style={{ fontSize: '.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.75rem' }}>Compliance</p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ position: 'relative', width: 90, height: 90 }}>
                <svg width={90} height={90} style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx={45} cy={45} r={36} fill="none" stroke="#E2E8F0" strokeWidth={8} />
                  <circle cx={45} cy={45} r={36} fill="none" stroke="#2563EB" strokeWidth={8}
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 36}
                    strokeDashoffset={2 * Math.PI * 36 * (1 - 0.87)}
                  />
                </svg>
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#2563EB' }}>87%</span>
                  <span style={{ fontSize: '.6rem', color: 'var(--text-muted)' }}>12/30 days</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Chart B: Convergence Break Point ── */}
        <div className="card" style={{ padding: '1.25rem', gridColumn: 1 }}>
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                Chart B · Convergence Training
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Convergence Break Point (IPD px)</div>
              <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginTop: '.15rem' }}>
                Higher IPD at break = stronger convergence — patient can get closer before diplopia
              </div>
            </div>
            <span style={{
              fontSize: '.7rem', padding: '.2rem .6rem', borderRadius: 999,
              background: '#ECFDF5', color: '#059669', fontWeight: 600,
            }}>
              ↑{Math.round(((148 - 82) / 82) * 100)}% improvement
            </span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={liveChartData} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} unit=" px" />
              <Tooltip content={<CustomTooltip unit="px" />} />
              <Area type="monotone" dataKey="convergence" stroke="#7C3AED" strokeWidth={2.5}
                fill="url(#convGrad)" dot={false}
                activeDot={{ r: 5, fill: '#7C3AED', stroke: '#fff', strokeWidth: 2 }} />
              {sessionMetrics.convergenceBreakPoint !== null && (
                <ReferenceLine x="Today ★" stroke="#7C3AED" strokeDasharray="4 4"
                  label={{ value: 'Live', fill: '#7C3AED', fontSize: 10 }} />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ── Latest Session Data ── */}
        <div className="card" style={{ gridColumn: '1 / -1', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ fontSize: '.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                Latest Session Data
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {hasSession ? 'Session #12 Results — Just Completed' : 'No session played yet this view'}
              </div>
            </div>
            {hasSession && (
              <span style={{
                display: 'flex', alignItems: 'center', gap: '.4rem',
                background: '#ECFDF5', color: '#059669',
                borderRadius: 999, padding: '.3rem .85rem',
                fontSize: '.78rem', fontWeight: 600,
                border: '1px solid #BBF7D0',
              }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#059669', animation: 'pulse-dot 1s ease-in-out infinite' }} />
                Live Data
              </span>
            )}
          </div>

          <div className="clinical-metrics-grid">
            {/* Saccadic */}
            <MetricCard
              label="Saccadic Latency"
              game="Agility"
              icon="⚡"
              value={sessionMetrics.saccadicLatency !== null ? `${sessionMetrics.saccadicLatency} ms` : null}
              baseline="Last session: 218 ms"
              color="#2563EB"
              bg="#EFF6FF"
              delta={sessionMetrics.saccadicLatency !== null ? 218 - sessionMetrics.saccadicLatency : null}
              unit="ms"
              direction="down"
            />
            {/* Pursuit */}
            <MetricCard
              label="Gaze Accuracy"
              game="Endurance"
              icon="∞"
              value={sessionMetrics.gazeAccuracy !== null ? `${sessionMetrics.gazeAccuracy}%` : null}
              baseline="Last session: 81%"
              color="#14B8A6"
              bg="#F0FDFA"
              delta={sessionMetrics.gazeAccuracy !== null ? sessionMetrics.gazeAccuracy - 81 : null}
              unit="%"
              direction="up"
            />
            {/* Convergence */}
            <MetricCard
              label="Convergence Break Point"
              game="Strength"
              icon="◎"
              value={sessionMetrics.convergenceBreakPoint !== null ? `${sessionMetrics.convergenceBreakPoint} px IPD` : null}
              baseline="Last session: 138 px"
              color="#7C3AED"
              bg="#F5F3FF"
              delta={sessionMetrics.convergenceBreakPoint !== null ? sessionMetrics.convergenceBreakPoint - 138 : null}
              unit="px"
              direction="up"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label, game, icon, value, baseline, color, bg, delta, unit, direction,
}: {
  label: string; game: string; icon: string; value: string | null;
  baseline: string; color: string; bg: string;
  delta: number | null; unit: string; direction: 'up' | 'down';
}) {
  const isImprovement = delta !== null && (direction === 'down' ? delta > 0 : delta > 0);
  const deltaLabel = delta !== null ? `${delta > 0 ? '+' : ''}${delta} ${unit}` : null;

  return (
    <div style={{
      background: bg, borderRadius: '1rem',
      border: `1px solid ${color}20`,
      padding: '1.25rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.75rem' }}>
        <div>
          <div style={{ fontSize: '.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{game}</div>
          <div style={{ fontSize: '.85rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '.1rem' }}>{label}</div>
        </div>
        <div style={{
          width: 36, height: 36, borderRadius: '.6rem',
          background: color, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1rem', fontWeight: 700, flexShrink: 0,
        }}>{icon}</div>
      </div>

      {value ? (
        <>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: color, marginBottom: '.25rem' }}>
            {value}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>{baseline}</span>
            {deltaLabel && (
              <span style={{
                fontSize: '.72rem', fontWeight: 700,
                color: isImprovement ? '#059669' : '#DC2626',
                background: isImprovement ? '#ECFDF5' : '#FEF2F2',
                padding: '.15rem .5rem', borderRadius: 999,
              }}>
                {isImprovement ? '↑' : '↓'} {Math.abs(delta!)} {unit}
              </span>
            )}
          </div>
        </>
      ) : (
        <div style={{
          fontSize: '.85rem', color: 'var(--text-muted)',
          fontStyle: 'italic', marginTop: '.5rem',
        }}>
          No data — game not played
        </div>
      )}
    </div>
  );
}
