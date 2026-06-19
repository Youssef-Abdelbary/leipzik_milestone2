import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { listGuests } from '../../services/serviceGuest';
import { P, icons, GlassPanel } from '../../components/componentTheme';

// ─── Stat Card (clickable filter tile) ───────────────────────────────────────
function StatCard({ label, value, color, sub, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '18px 20px',
        flex: '1 1 140px',
        background: isActive
          ? `linear-gradient(135deg, ${color}22 0%, ${color}10 100%)`
          : 'rgba(19,19,30,0.72)',
        backdropFilter: 'blur(18px) saturate(140%)',
        WebkitBackdropFilter: 'blur(18px) saturate(140%)',
        border: `1px solid ${isActive ? color + '55' : 'rgba(255,255,255,0.08)'}`,
        borderBottom: isActive ? `2px solid ${color}` : '2px solid transparent',
        borderRadius: 14,
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'inherit',
        transition: 'all 0.2s cubic-bezier(0.34,1.2,0.64,1)',
        transform: isActive ? 'translateY(-3px)' : 'none',
        boxShadow: isActive
          ? `0 0 0 1px ${color}22, 0 8px 24px ${color}22, inset 0 1px 0 rgba(255,255,255,0.06)`
          : 'inset 0 1px 0 rgba(255,255,255,0.04)',
        outline: 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        if (!isActive) {
          e.currentTarget.style.background = `linear-gradient(135deg, ${color}16 0%, ${color}08 100%)`;
          e.currentTarget.style.borderColor = `${color}33`;
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={e => {
        if (!isActive) {
          e.currentTarget.style.background = 'rgba(19,19,30,0.72)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
          e.currentTarget.style.transform = 'none';
        }
      }}
    >
      <p style={{ margin: 0, fontSize: 34, fontWeight: 900, color, letterSpacing: '-0.04em', lineHeight: 1, fontFamily: 'var(--font-display)' }}>{value}</p>
      <p style={{ margin: '8px 0 0', fontSize: 12, fontWeight: 700, color: isActive ? color : P.text, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
      {sub && <p style={{ margin: '4px 0 0', fontSize: 11, color: isActive ? color : P.sub }}>{sub}</p>}
    </button>
  );
}

const RSVP_STYLES = {
  attending: { bg: `${P.teal}22`,   text: P.teal,   dot: P.teal   },
  declined:  { bg: `${P.rose}22`,   text: P.rose,   dot: P.rose   },
  pending:   { bg: `${P.indigo}22`, text: P.indigo, dot: P.indigo },
};

export default function TabDayOf({ eventId }) {
  const navigate = useNavigate();
  const [guests, setGuests]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [query, setQuery]         = useState('');
  const [tileFilter, setTileFilter] = useState('all'); // 'all' | 'attending' | 'arrived' | 'expected' | 'declined'

  const load = useCallback(async () => {
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

  const tileFilteredGuests = guests.filter(g => {
    switch (tileFilter) {
      case 'attending':  return g.rsvp?.status === 'attending';
      case 'arrived':    return g.checkIn?.status === 'Arrived';
      case 'expected':   return g.rsvp?.status !== 'declined' && g.checkIn?.status !== 'Arrived';
      case 'declined':   return g.rsvp?.status === 'declined';
      default:           return true;
    }
  });

  const displayGuests = tileFilteredGuests.filter(g => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (g.fullName || '').toLowerCase().includes(q) || (g.email || '').toLowerCase().includes(q);
  });

  const TILE_FILTER_LABELS = {
    all:       'All Guests',
    attending: 'RSVP Attending',
    arrived:   'Checked In',
    expected:  'Still Expected',
    declined:  'Declined',
  };

  const toggleTile = (key) => setTileFilter(prev => prev === key ? 'all' : key);

  const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—';

  const getInitials = (g) => {
    const init = (g.fullName || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const isArrived  = g.checkIn?.status === 'Arrived';
    const isDeclined = g.rsvp?.status === 'declined';
    return {
      initials: init,
      bg:    isArrived ? P.tealGlow : isDeclined ? P.roseGlow : 'rgba(139,109,255,0.12)',
      color: isArrived ? P.teal    : isDeclined ? P.rose     : P.blue,
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

  if (loading) return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: '32px 24px' }}>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
      <div style={{ height: 60, background: P.surface, borderRadius: 12, animation: 'pulse 1.5s infinite', marginBottom: 24, border: `1px solid ${P.border}` }} />
      <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
        {[1,2,3,4,5].map(i => <div key={i} style={{ flex: '1 1 140px', height: 110, background: P.surface, borderRadius: 12, animation: `pulse 1.5s infinite ${i * 0.1}s`, border: `1px solid ${P.border}` }} />)}
      </div>
      <div style={{ height: 400, background: P.surface, borderRadius: 16, animation: 'pulse 1.5s infinite 0.4s', border: `1px solid ${P.border}` }} />
    </div>
  );

  if (error) return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ background: P.redGlow, color: P.red, border: `1px solid ${P.red}44`, borderRadius: 10, padding: '12px 16px', fontSize: 13 }}>{error}</div>
    </div>
  );

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: '32px 24px', fontFamily: 'var(--font-body)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: P.text, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-display)' }}>
            <span style={{ color: P.teal, background: P.tealGlow, padding: 7, borderRadius: 9, display: 'flex' }}>{icons.dayof}</span> Day-of Dashboard
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: P.sub }}>Live check-in tracking · auto-refreshes every 30s</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() =>
              navigate("/staff/qr-scanner", {
                state: {
                  returnTo: `/organizer/events/${eventId}/workspace`,
                  returnLabel: "Workspace",
                },
              })
            }
            style={{ padding: '8px 16px', borderRadius: 9, border: 'none', background: `linear-gradient(135deg, ${P.blue} 0%, ${P.teal} 100%)`, fontSize: 13, fontWeight: 700, cursor: 'pointer', color: '#0a0a0f', transition: 'opacity 0.15s', display: 'flex', alignItems: 'center', gap: 6 }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            {icons.qr} QR Scanner
          </button>
          <button
            onClick={load}
            style={{ padding: '8px 16px', borderRadius: 9, border: `1px solid ${P.border}`, background: 'transparent', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: P.text, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6 }}
            onMouseEnter={e => { e.currentTarget.style.background = P.blueGlow; e.currentTarget.style.borderColor = `${P.blue}44`; e.currentTarget.style.color = P.blue; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = P.border; e.currentTarget.style.color = P.text; }}
          >
            {icons.refresh} Refresh
          </button>
        </div>
      </div>

      {/* Stat cards — click to filter */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 10, flexWrap: 'wrap' }}>
        <StatCard label="Total Guests"   value={totalAll}      color={P.blue}   sub={declined > 0 ? `${declined} declined` : 'all guests'} isActive={tileFilter === 'all'}      onClick={() => toggleTile('all')} />
        <StatCard label="RSVP Attending" value={attending}     color={P.indigo} sub="confirmed"         isActive={tileFilter === 'attending'} onClick={() => toggleTile('attending')} />
        <StatCard label="Checked In"     value={arrived}       color={P.teal}   sub={`${arrivalPct}% of expected`} isActive={tileFilter === 'arrived'}  onClick={() => toggleTile('arrived')} />
        <StatCard label="Still Expected" value={stillExpected} color={P.amber}  sub="not arrived yet"  isActive={tileFilter === 'expected'}  onClick={() => toggleTile('expected')} />
        <StatCard label="Declined"       value={declined}      color={P.rose}   sub="will not attend"  isActive={tileFilter === 'declined'}  onClick={() => toggleTile('declined')} />
      </div>
      {tileFilter !== 'all' && (
        <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: P.sub }}>Filtering by</span>
          <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: 'rgba(255,255,255,0.06)', color: P.text, border: `1px solid ${P.border}` }}>
            {TILE_FILTER_LABELS[tileFilter]} · {tileFilteredGuests.length} guest{tileFilteredGuests.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={() => setTileFilter('all')}
            style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: 'transparent', border: `1px solid ${P.border}`, color: P.sub, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = P.rose; e.currentTarget.style.borderColor = P.rose; }}
            onMouseLeave={e => { e.currentTarget.style.color = P.sub; e.currentTarget.style.borderColor = P.border; }}
          >
            ✕ Clear
          </button>
        </div>
      )}

      {/* Info note */}
      {declined > 0 && (
        <div style={{ background: P.blueGlow, border: `1px solid ${P.blue}33`, borderRadius: 10, padding: '12px 16px', fontSize: 13, color: P.text, marginBottom: 20, lineHeight: 1.5, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ color: P.blue, flexShrink: 0, display: 'flex' }}>{icons.info}</span>
          <div>
            <strong>{declined} guest{declined !== 1 ? 's' : ''} declined</strong> the invitation — they are excluded from the arrival percentage and "Still Expected" count.
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600 }}>
        <span style={{ color: P.text }}>Arrival Progress <span style={{ color: P.sub, fontWeight: 400 }}>(of {expectedTotal} expected)</span></span>
        <span style={{ color: P.teal, fontWeight: 700 }}>{arrived} / {expectedTotal} checked in</span>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 99, height: 10, overflow: 'hidden', marginBottom: 32, border: `1px solid ${P.border}` }}>
        <div style={{ height: '100%', borderRadius: 99, background: `linear-gradient(90deg, ${P.teal} 0%, ${P.cyan} 100%)`, width: `${arrivalPct}%`, transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)', boxShadow: `0 0 12px ${P.teal}55` }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>

        {/* All Guests List */}
        <GlassPanel style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: P.text, fontFamily: 'var(--font-display)' }}>
              {TILE_FILTER_LABELS[tileFilter]}
              <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 600, color: P.sub }}>({displayGuests.length})</span>
            </p>
            {tileFilter !== 'all' && (
              <button
                onClick={() => setTileFilter('all')}
                style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: 'transparent', border: `1px solid ${P.border}`, color: P.sub, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.color = P.rose; e.currentTarget.style.borderColor = P.rose; }}
                onMouseLeave={e => { e.currentTarget.style.color = P.sub; e.currentTarget.style.borderColor = P.border; }}
              >
                ✕ All
              </button>
            )}
          </div>
          <input
            style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: `1px solid ${P.border}`, background: 'rgba(13,13,19,0.6)', color: P.text, fontSize: 13, outline: 'none', boxSizing: 'border-box', marginBottom: 16, transition: 'border-color 0.2s', fontFamily: 'inherit' }}
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
                <div
                  key={g._id}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 10px', borderBottom: `1px solid ${P.border}`, transition: 'background 0.2s', borderRadius: 8 }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,92,252,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, background: bg, color }}>{initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 4px 0', fontSize: 14, fontWeight: 600, color: isDeclined ? P.muted : P.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: isDeclined ? 'line-through' : 'none' }}>
                      {g.fullName}
                    </p>
                    <span style={tagStyle(rsvp)}>
                      <span style={dotStyle(rsvp)} />
                      {rsvp}
                    </span>
                  </div>
                  {isDeclined ? (
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: `${P.red}22`, color: P.red }}>Declined</span>
                  ) : (
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: isArrived ? `${P.green}22` : P.surface, color: isArrived ? P.green : P.sub, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {isArrived ? <>{icons.check} In</> : 'Pending'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </GlassPanel>

        {/* Recent Check-ins & RSVP Breakdown */}
        <GlassPanel style={{ padding: '24px' }}>
          <p style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: P.text, fontFamily: 'var(--font-display)' }}>Recent Check-ins</p>
          {recentArrivals.length === 0 ? (
            <p style={{ fontSize: 13, color: P.sub, textAlign: 'center', padding: '30px 0' }}>No check-ins yet</p>
          ) : (
            <div style={{ maxHeight: 220, overflowY: 'auto' }}>
              {recentArrivals.map(g => {
                const { initials } = getInitials(g);
                return (
                  <div key={g._id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '8px 0' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, background: `${P.green}22`, color: P.green }}>{initials}</div>
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

          <div style={{ marginTop: 32, paddingTop: 24, borderTop: `1px solid ${P.border}` }}>
            <p style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: P.text }}>RSVP Breakdown</p>
            {[
              { label: 'Attending', value: attending, color: P.green,  total: totalAll },
              { label: 'Pending',   value: pending,   color: P.amber,  total: totalAll },
              { label: 'Declined',  value: declined,  color: P.red,    total: totalAll },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: P.sub, width: 70 }}>{item.label}</span>
                <div style={{ flex: 1, background: P.surface, borderRadius: 6, height: 10, overflow: 'hidden' }}>
                  <div style={{ width: item.total > 0 ? `${Math.round((item.value / item.total) * 100)}%` : '0%', height: '100%', background: item.color, borderRadius: 6, transition: 'width 0.5s ease' }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: P.text, minWidth: 28, textAlign: 'right' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </GlassPanel>

      </div>
    </div>
  );
}
