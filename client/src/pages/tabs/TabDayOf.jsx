import { useState, useEffect, useCallback } from 'react';
import { listGuests } from '../../services/serviceGuest';

function StatCard({ label, value, color, sub }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '20px 24px', flex: '1 1 140px', boxShadow: '0 1px 4px rgba(15,23,42,0.04)' }}>
      <p style={{ margin: 0, fontSize: 32, fontWeight: 800, color, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</p>
      <p style={{ margin: '6px 0 0', fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{label}</p>
      {sub && <p style={{ margin: '3px 0 0', fontSize: 12, color: '#94A3B8' }}>{sub}</p>}
    </div>
  );
}

const RSVP_STYLES = {
  attending: { bg: '#F0FDF4', text: '#166534', dot: '#22C55E' },
  declined:  { bg: '#FEF2F2', text: '#991B1B', dot: '#EF4444' },
  pending:   { bg: '#FFF7ED', text: '#C2410C', dot: '#F59E0B' },
};

export default function TabDayOf({ eventId }) {
  const [guests, setGuests]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [query, setQuery]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listGuests(eventId);
      setGuests(Array.isArray(data) ? data : []);
    } catch {
      setError('Failed to load guest data');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    const init = async () => { await load(); };
    init();
  }, [load]);

  useEffect(() => {
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  const total      = guests.length;
  const arrived    = guests.filter(g => g.checkIn?.status === 'Arrived').length;
  const attending  = guests.filter(g => g.rsvp?.status === 'attending').length;
  const declined   = guests.filter(g => g.rsvp?.status === 'declined').length;
  const pending    = guests.filter(g => !g.rsvp?.status || g.rsvp.status === 'pending').length;
  const arrivalPct = total > 0 ? Math.round((arrived / total) * 100) : 0;

  const displayGuests = guests.filter(g => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (g.fullName || '').toLowerCase().includes(q) || (g.email || '').toLowerCase().includes(q);
  });

  const recentArrivals = guests
    .filter(g => g.checkIn?.status === 'Arrived' && g.checkIn?.checkedInAt)
    .sort((a, b) => new Date(b.checkIn.checkedInAt) - new Date(a.checkIn.checkedInAt))
    .slice(0, 10);

  const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—';

  const s = {
    page:    { maxWidth: 1000, margin: '0 auto', padding: '28px 24px', fontFamily: 'system-ui, -apple-system, sans-serif' },
    hdr:     { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
    h1:      { margin: 0, fontSize: 22, fontWeight: 800, color: '#0F172A' },
    sub:     { margin: '4px 0 0', fontSize: 14, color: '#64748B' },
    refreshBtn: { padding: '8px 16px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#374151' },
    statsRow:{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' },
    progress:{ background: '#F1F5F9', borderRadius: 99, height: 10, overflow: 'hidden', marginBottom: 24 },
    progBar: { height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, #22C55E 0%, #16A34A 100%)', transition: 'width 0.5s ease' },
    cols:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
    card:    { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '20px', boxShadow: '0 1px 4px rgba(15,23,42,0.04)' },
    cardH:   { margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: '#0F172A' },
    inp:     { width: '100%', padding: '9px 14px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13, outline: 'none', boxSizing: 'border-box', marginBottom: 12 },
    row:     { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid #F1F5F9' },
    avatar:  { width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 },
    getInitials: (g) => {
      const init = (g.fullName || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
      const isArrived = g.checkIn?.status === 'Arrived';
      return { initials: init, bg: isArrived ? '#DBEAFE' : '#F1F5F9', color: isArrived ? '#1D4ED8' : '#94A3B8' };
    },
    tag:     (status) => {
      const rs = RSVP_STYLES[status] || RSVP_STYLES.pending;
      return { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: rs.bg, color: rs.text };
    },
    dot:     (status) => {
      const rs = RSVP_STYLES[status] || RSVP_STYLES.pending;
      return { width: 6, height: 6, borderRadius: '50%', background: rs.dot, display: 'inline-block' };
    },
    errBox:  { background: '#FEF2F2', color: '#991B1B', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 20 },
  };

  if (loading) return <div style={s.page}><p style={{ color: '#94A3B8' }}>Loading day-of dashboard…</p></div>;
  if (error)   return <div style={s.page}><div style={s.errBox}>{error}</div></div>;

  return (
    <div style={s.page}>
      <div style={s.hdr}>
        <div>
          <h2 style={s.h1}>📅 Day-of Dashboard</h2>
          <p style={s.sub}>Live check-in tracking — refreshes every 30 seconds</p>
        </div>
        <button style={s.refreshBtn} onClick={load}>↺ Refresh</button>
      </div>

      <div style={s.statsRow}>
        <StatCard label="Total Guests"   value={total}         color="#0F172A" />
        <StatCard label="Checked In"     value={arrived}       color="#16A34A" sub={`${arrivalPct}% of total`} />
        <StatCard label="Still Expected" value={total-arrived} color="#0EA5E9" sub="not checked in yet" />
        <StatCard label="RSVP Attending" value={attending}     color="#4338CA" />
        <StatCard label="RSVP Pending"   value={pending}       color="#C2410C" />
      </div>

      <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748B' }}>
        <span>Arrival Progress</span>
        <span>{arrived} / {total} checked in</span>
      </div>
      <div style={s.progress}>
        <div style={{ ...s.progBar, width: `${arrivalPct}%` }} />
      </div>

      <div style={s.cols}>
        <div style={s.card}>
          <p style={s.cardH}>All Guests ({total})</p>
          <input style={s.inp} value={query} onChange={e => setQuery(e.target.value)} placeholder="Search guest…" />
          <div style={{ maxHeight: 340, overflowY: 'auto' }}>
            {displayGuests.length === 0 && (
              <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '20px 0' }}>No guests yet</p>
            )}
            {displayGuests.map(g => {
              const { initials, bg, color } = s.getInitials(g);
              const isArrived = g.checkIn?.status === 'Arrived';
              const rsvp = g.rsvp?.status || 'pending';
              return (
                <div key={g._id} style={s.row}>
                  <div style={{ ...s.avatar, background: bg, color }}>{initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.fullName}</p>
                    <span style={s.tag(rsvp)}><span style={s.dot(rsvp)} />{rsvp}</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: isArrived ? '#F0FDF4' : '#F8FAFC', color: isArrived ? '#166534' : '#94A3B8' }}>
                    {isArrived ? '✓ In' : 'Pending'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={s.card}>
          <p style={s.cardH}>Recent Check-ins ({recentArrivals.length})</p>
          {recentArrivals.length === 0 ? (
            <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '40px 0' }}>No check-ins yet</p>
          ) : (
            <div>
              {recentArrivals.map(g => {
                const { initials } = s.getInitials(g);
                return (
                  <div key={g._id} style={{ ...s.row, alignItems: 'flex-start' }}>
                    <div style={{ ...s.avatar, background: '#DBEAFE', color: '#1D4ED8' }}>{initials}</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{g.fullName}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748B' }}>
                        Arrived at {fmtTime(g.checkIn?.checkedInAt)} · {g.checkIn?.method || 'manual'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #F1F5F9' }}>
            <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#0F172A' }}>RSVP Breakdown</p>
            {[
              { label: 'Attending', value: attending, color: '#22C55E' },
              { label: 'Declined',  value: declined,  color: '#EF4444' },
              { label: 'Pending',   value: pending,   color: '#F59E0B' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: '#64748B', width: 64 }}>{item.label}</span>
                <div style={{ flex: 1, background: '#F1F5F9', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                  <div style={{ width: total > 0 ? `${Math.round((item.value / total) * 100)}%` : '0%', height: '100%', background: item.color, borderRadius: 4 }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', minWidth: 24, textAlign: 'right' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}