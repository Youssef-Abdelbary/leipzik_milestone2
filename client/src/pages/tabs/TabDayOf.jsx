import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { listGuests } from '../../services/serviceGuest';
import { P, icons } from '../../utils/theme';

// ─── Stat Card Component ──────────────────────────────────────────────────────
function StatCard({ label, value, color, sub }) {
  return (
    <div style={{
      background: P.panel,
      border: `1px solid ${P.border}`,
      borderRadius: 12,
      padding: '20px 24px',
      flex: '1 1 140px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
    }}
    >
      <p style={{ margin: 0, fontSize: 32, fontWeight: 800, color, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</p>
      <p style={{ margin: '8px 0 0', fontSize: 13, fontWeight: 600, color: P.text }}>{label}</p>
      {sub && <p style={{ margin: '4px 0 0', fontSize: 12, color: P.sub }}>{sub}</p>}
    </div>
  );
}

// ─── Theme Mappings for RSVP Status ───────────────────────────────────────────
const RSVP_STYLES = {
  attending: { bg: 'rgba(63, 185, 80, 0.15)', text: P.green, dot: P.green },
  declined:  { bg: 'rgba(248, 81, 73, 0.15)', text: P.red,   dot: P.red },
  pending:   { bg: 'rgba(227, 179, 65, 0.15)', text: P.amber, dot: P.amber },
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TabDayOf({ eventId }) {
  const navigate = useNavigate();
  const [guests, setGuests]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [query, setQuery]     = useState('');

  const load = useCallback(async () => {
    // Only show full loading state on initial mount to prevent flashing
    if (guests.length === 0) setLoading(true);
    try {
      const data = await listGuests(eventId);
      setGuests(Array.isArray(data) ? data : []);
    } catch {
      setError('Failed to load guest data');
    } finally {
      setLoading(false);
    }
  }, [eventId, guests.length]);

  useEffect(() => {
    const init = async () => { await load(); };
    init();
  }, [load]);

  useEffect(() => {
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  // ─── Derived stats ──────────────────────────────────────────────────────────
  const totalAll   = guests.length;
  const declined   = guests.filter(g => g.rsvp?.status === 'declined').length;
  const attending  = guests.filter(g => g.rsvp?.status === 'attending').length;
  const pending    = guests.filter(g => !g.rsvp?.status || g.rsvp.status === 'pending').length;
  const arrived    = guests.filter(g => g.checkIn?.status === 'Arrived').length;

  const expectedTotal = guests.filter(g => g.rsvp?.status !== 'declined').length;
  const arrivalPct    = expectedTotal > 0 ? Math.round((arrived / expectedTotal) * 100) : 0;
  const stillExpected = expectedTotal - arrived;

  const recentArrivals = guests
    .filter(g => g.checkIn?.status === 'Arrived' && g.checkIn?.checkedInAt)
    .sort((a, b) => new Date(b.checkIn.checkedInAt) - new Date(a.checkIn.checkedInAt))
    .slice(0, 10);

  const displayGuests = guests.filter(g => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (g.fullName || '').toLowerCase().includes(q) || (g.email || '').toLowerCase().includes(q);
  });

  const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—';

  // ─── Styles ─────────────────────────────────────────────────────────────────
  const s = {
    page:       { maxWidth: 1040, margin: '0 auto', padding: '32px 24px', fontFamily: 'system-ui, -apple-system, sans-serif' },
    hdr:        { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
    h1:         { margin: 0, fontSize: 24, fontWeight: 800, color: P.text, letterSpacing: '-0.02em' },
    sub:        { margin: '6px 0 0', fontSize: 14, color: P.sub },
    refreshBtn: { 
      padding: '8px 16px', borderRadius: 8, border: `1px solid ${P.border}`, background: 'transparent', 
      fontSize: 13, fontWeight: 600, cursor: 'pointer', color: P.text, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6
    },
    statsRow:   { display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' },
    note:       { background: 'rgba(68,147,248,0.1)', border: `1px solid rgba(68,147,248,0.2)`, borderRadius: 10, padding: '12px 16px', fontSize: 13, color: P.text, marginBottom: 20, lineHeight: 1.5, display: 'flex', gap: 10, alignItems: 'flex-start' },
    progress:   { background: P.surface, borderRadius: 99, height: 10, overflow: 'hidden', marginBottom: 32, border: `1px solid ${P.border}` },
    progBar:    { height: '100%', borderRadius: 99, background: P.green, transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' },
    cols:       { display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }, // Slightly wider guest list
    card:       { background: P.panel, border: `1px solid ${P.border}`, borderRadius: 16, padding: '24px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' },
    cardH:      { margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: P.text },
    inp:        { width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${P.border}`, background: P.bg, color: P.text, fontSize: 13, outline: 'none', boxSizing: 'border-box', marginBottom: 16, transition: 'border-color 0.2s' },
    row:        { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 10px', borderBottom: `1px solid ${P.border}`, transition: 'background 0.2s', borderRadius: 8 },
    avatar:     { width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 },
    errBox:     { background: 'rgba(248, 81, 73, 0.1)', border: `1px solid rgba(248, 81, 73, 0.3)`, color: P.red, borderRadius: 8, padding: '12px 16px', fontSize: 13, marginBottom: 20 },
  };

  const getInitials = (g) => {
    const init = (g.fullName || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const isArrived  = g.checkIn?.status === 'Arrived';
    const isDeclined = g.rsvp?.status === 'declined';
    return {
      initials: init,
      bg:    isArrived ? 'rgba(63, 185, 80, 0.15)' : isDeclined ? 'rgba(248, 81, 73, 0.15)' : P.surface,
      color: isArrived ? P.green : isDeclined ? P.red : P.text,
    };
  };

  const tagStyle = (status) => {
    const rs = RSVP_STYLES[status] || RSVP_STYLES.pending;
    return { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: rs.bg, color: rs.text, letterSpacing: '0.02em', textTransform: 'uppercase' };
  };

  const dotStyle = (status) => {
    const rs = RSVP_STYLES[status] || RSVP_STYLES.pending;
    return { width: 6, height: 6, borderRadius: '50%', background: rs.dot, display: 'inline-block' };
  };

  // ─── Loading Skeleton ───────────────────────────────────────────────────────
  if (loading) return (
    <div style={s.page}>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
      <div style={{ height: 60, background: P.panel, borderRadius: 12, animation: 'pulse 1.5s infinite', marginBottom: 24, border: `1px solid ${P.border}` }} />
      <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
        {[1,2,3,4,5].map(i => <div key={i} style={{ flex: '1 1 140px', height: 110, background: P.panel, borderRadius: 12, animation: `pulse 1.5s infinite ${i * 0.1}s`, border: `1px solid ${P.border}` }} />)}
      </div>
      <div style={{ height: 400, background: P.panel, borderRadius: 16, animation: 'pulse 1.5s infinite 0.4s', border: `1px solid ${P.border}` }} />
    </div>
  );

  if (error) return <div style={s.page}><div style={s.errBox}>{error}</div></div>;

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.hdr}>
        <div>
          <h2 style={{ ...s.h1, display:'flex', alignItems:'center', gap:10 }}><span style={{color:P.blue}}>{icons.dayof}</span> Day-of Dashboard</h2>
          <p style={s.sub}>Live check-in tracking — auto-refreshes every 30s</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => navigate('/staff/qr-scanner')}
            style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: P.blue, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#fff', transition: 'opacity 0.15s', display: 'flex', alignItems: 'center', gap: 6 }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            {icons.qr} QR Scanner
          </button>
          <button 
            style={s.refreshBtn} 
            onClick={load}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = P.sub; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = P.border; }}
          >
            {icons.refresh} Refresh
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div style={s.statsRow}>
        <StatCard label="Total Guests"   value={totalAll}      color={P.text}  sub={declined > 0 ? `${declined} declined` : undefined} />
        <StatCard label="Expected"       value={expectedTotal} color={P.blue}  sub="excl. declined" />
        <StatCard label="Checked In"     value={arrived}       color={P.green} sub={`${arrivalPct}% of expected`} />
        <StatCard label="Still Expected" value={stillExpected} color={P.amber} sub="not arrived yet" />
        <StatCard label="RSVP Attending" value={attending}     color={P.blue} />
      </div>

      {/* Info Note */}
      {declined > 0 && (
        <div style={s.note}>
          <span style={{ color: P.blue, flexShrink: 0, display:'flex' }}>{icons.info}</span>
          <div>
            <strong>{declined} guest{declined !== 1 ? 's' : ''} declined</strong> the invitation — they are excluded from the arrival percentage and "Still Expected" count. The progress bar tracks exactly <strong>{expectedTotal} expected guest{expectedTotal !== 1 ? 's' : ''}</strong>.
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', fontSize: 13, color: P.sub, fontWeight: 500 }}>
        <span>Arrival Progress (of {expectedTotal} expected)</span>
        <span style={{ color: P.text }}>{arrived} / {expectedTotal} checked in</span>
      </div>
      <div style={s.progress}>
        <div style={{ ...s.progBar, width: `${arrivalPct}%` }} />
      </div>

      <div style={s.cols}>
        
        {/* All Guests List Area */}
        <div style={s.card}>
          <p style={s.cardH}>All Guests ({totalAll})</p>
          <input
            style={s.inp}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search guest by name or email…"
            onFocus={e => e.target.style.borderColor = P.blue}
            onBlur={e => e.target.style.borderColor = P.border}
          />
          <div style={{ maxHeight: 380, overflowY: 'auto', paddingRight: 4 }}>
            {displayGuests.length === 0 && (
              <p style={{ fontSize: 13, color: P.sub, textAlign: 'center', padding: '30px 0' }}>No guests found</p>
            )}
            {displayGuests.map(g => {
              const { initials, bg, color } = getInitials(g);
              const isArrived  = g.checkIn?.status === 'Arrived';
              const isDeclined = g.rsvp?.status === 'declined';
              const rsvp       = g.rsvp?.status || 'pending';
              
              return (
                <div key={g._id} style={s.row} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ ...s.avatar, background: bg, color }}>{initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      margin: '0 0 4px 0', fontSize: 14, fontWeight: 600,
                      color: isDeclined ? P.muted : P.text,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      textDecoration: isDeclined ? 'line-through' : 'none',
                    }}>
                      {g.fullName}
                    </p>
                    <span style={tagStyle(rsvp)}>
                      <span style={dotStyle(rsvp)} />
                      {rsvp}
                    </span>
                  </div>
                  {isDeclined ? (
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: 'rgba(248, 81, 73, 0.1)', color: P.red }}>
                      Declined
                    </span>
                  ) : (
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8,
                      background: isArrived ? 'rgba(63, 185, 80, 0.15)' : P.surface,
                      color:      isArrived ? P.green : P.sub,
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                    }}>
                      {isArrived ? <>{icons.check} In</> : 'Pending'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Check-ins & Breakdown Area */}
        <div style={s.card}>
          <p style={s.cardH}>Recent Check-ins</p>
          {recentArrivals.length === 0 ? (
            <p style={{ fontSize: 13, color: P.sub, textAlign: 'center', padding: '30px 0' }}>No check-ins yet</p>
          ) : (
            <div style={{ maxHeight: 220, overflowY: 'auto' }}>
              {recentArrivals.map(g => {
                const { initials } = getInitials(g);
                return (
                  <div key={g._id} style={{ ...s.row, alignItems: 'flex-start', borderBottom: 'none', padding: '8px 0' }}>
                    <div style={{ ...s.avatar, background: 'rgba(63, 185, 80, 0.15)', color: P.green }}>{initials}</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: P.text }}>{g.fullName}</p>
                      <p style={{ margin: '4px 0 0', fontSize: 12, color: P.sub }}>
                        Arrived at {fmtTime(g.checkIn?.checkedInAt)} · {g.checkIn?.method || 'manual'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Graphical RSVP Breakdown */}
          <div style={{ marginTop: 32, paddingTop: 24, borderTop: `1px solid ${P.border}` }}>
            <p style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: P.text }}>RSVP Breakdown</p>
            {[
              { label: 'Attending', value: attending, color: P.green, total: totalAll },
              { label: 'Pending',   value: pending,   color: P.amber, total: totalAll },
              { label: 'Declined',  value: declined,  color: P.red,   total: totalAll },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: P.sub, width: 70 }}>{item.label}</span>
                <div style={{ flex: 1, background: P.surface, borderRadius: 6, height: 10, overflow: 'hidden' }}>
                  <div style={{
                    width: item.total > 0 ? `${Math.round((item.value / item.total) * 100)}%` : '0%',
                    height: '100%',
                    background: item.color,
                    borderRadius: 6,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: P.text, minWidth: 28, textAlign: 'right' }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}