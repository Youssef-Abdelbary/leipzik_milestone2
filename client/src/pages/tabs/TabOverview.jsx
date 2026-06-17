import { useState, useEffect } from 'react';
import { listGuests }               from '../../services/serviceGuest';
import { getBroadcasts }            from '../../services/serviceBroadcast';
import { getEventFeedbackSummary }  from '../../services/serviceFeedback';
import { EVENT_TYPES }              from '../../utils/constants';
import { P, STATUS_COLORS, icons }  from '../../utils/theme';
import SettingsModal                from '../../components/SettingsModal';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
}
function fmtType(val) {
  return EVENT_TYPES.find(t => t.value === val)?.label || val?.replace(/_/g,' ') || '—';
}
function navigateTo(tab) {
  window.dispatchEvent(new CustomEvent('workspace-tab', { detail: tab }));
}

// ─── Clickable summary tile with coloured glow ────────────────────────────────
function SummaryTile({ icon, label, value, sub, accentColor, glowColor, onClick, loading }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flex:       '1 1 150px',
        background: hov ? `${glowColor}` : P.surface,
        border:     `1px solid ${hov ? accentColor + '44' : P.border}`,
        borderRadius: 14,
        padding:    '20px 18px',
        cursor:     'pointer',
        textAlign:  'left',
        transition: 'all 0.22s cubic-bezier(0.34,1.2,0.64,1)',
        transform:  hov ? 'translateY(-3px)' : 'none',
        boxShadow:  hov ? `0 8px 28px ${glowColor}, 0 0 0 1px ${accentColor}22` : '0 1px 4px rgba(0,0,0,0.2)',
        outline:    'none',
        fontFamily: 'inherit',
      }}
    >
      {/* Top row: icon + "View →" */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <span style={{ color: accentColor, background: glowColor, padding:8, borderRadius:10, display:'flex' }}>
          {icon}
        </span>
        <span style={{ fontSize:11, color: hov ? accentColor : P.muted, fontWeight:600, letterSpacing:'0.04em', transition:'color 0.15s' }}>
          View →
        </span>
      </div>

      {loading ? (
        <div style={{ height:32, background:P.hover, borderRadius:6, marginBottom:6 }}/>
      ) : (
        <p style={{ margin:'0 0 4px', fontSize:30, fontWeight:800, color:P.text, lineHeight:1, letterSpacing:'-0.03em' }}>{value}</p>
      )}
      <p style={{ margin:'0 0 2px', fontSize:13, fontWeight:600, color:P.text }}>{label}</p>
      {sub && <p style={{ margin:0, fontSize:12, color:P.sub }}>{sub}</p>}
    </button>
  );
}

// ─── Inline key-value row ─────────────────────────────────────────────────────
function DetailRow({ label, value }) {
  return (
    <div>
      <p style={{ margin:'0 0 4px', fontSize:11, fontWeight:700, color:P.muted, textTransform:'uppercase', letterSpacing:'0.08em' }}>{label}</p>
      <p style={{ margin:0, fontSize:15, fontWeight:600, color:P.text }}>{value || '—'}</p>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function TabOverview({ event, onEventUpdate }) {
  const [showEdit, setShowEdit] = useState(false);

  const [guestStats,     setGuestStats]     = useState(null);
  const [broadcastCount, setBroadcastCount] = useState(null);
  const [feedbackSummary,setFeedbackSummary]= useState(null);
  const [statsLoading,   setStatsLoading]   = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStatsLoading(true);
      try {
        const [g, b] = await Promise.allSettled([
          listGuests(event._id),
          getBroadcasts(event._id),
        ]);
        if (cancelled) return;
        if (g.status === 'fulfilled') {
          const gv = g.value;
          setGuestStats({
            total:    gv.length,
            attending:gv.filter(x => x.rsvp?.status === 'attending').length,
            arrived:  gv.filter(x => x.checkIn?.status === 'Arrived').length,
          });
        }
        if (b.status === 'fulfilled') setBroadcastCount(b.value.length);
        if (event.status === 'completed') {
          try {
            const fb = await getEventFeedbackSummary(event._id);
            if (!cancelled) setFeedbackSummary(fb);
          } catch { /* no feedback yet */ }
        }
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [event._id, event.status]);

  const sc = STATUS_COLORS[event.status] || P.muted;

  // Feedback tile copy
  const fbValue = feedbackSummary?.averages?.overall
    ? feedbackSummary.averages.overall
    : event.status === 'completed' ? '0' : 'N/A';
  const fbSub = feedbackSummary?.count != null
    ? `${feedbackSummary.count} response${feedbackSummary.count !== 1 ? 's' : ''}`
    : event.status !== 'completed' ? 'After event ends' : 'No responses';

  return (
    <div style={{ maxWidth:880, margin:'0 auto', padding:'32px 24px', fontFamily:'system-ui,sans-serif', color:P.text }}>

      {/* ── Summary tiles ───────────────────────────────────────────────────── */}
      <div style={{ display:'flex', gap:14, marginBottom:24, flexWrap:'wrap' }}>
        <SummaryTile
          icon={icons.guests}
          label="Total Guests"
          value={guestStats?.total ?? '—'}
          sub={guestStats ? `${guestStats.attending} confirmed attending` : ''}
          accentColor={P.blue}
          glowColor={P.blueGlow}
          loading={statsLoading}
          onClick={() => navigateTo('guests')}
        />
        <SummaryTile
          icon={icons.check}
          label="Arrivals"
          value={guestStats?.arrived ?? '—'}
          sub={guestStats ? `of ${guestStats.attending} expected` : ''}
          accentColor={P.green}
          glowColor={P.greenGlow}
          loading={statsLoading}
          onClick={() => navigateTo('day-of')}
        />
        <SummaryTile
          icon={icons.messages}
          label="Broadcasts"
          value={broadcastCount ?? '—'}
          sub="messages sent"
          accentColor={P.teal}
          glowColor={P.tealGlow}
          loading={statsLoading}
          onClick={() => navigateTo('messages')}
        />
        <SummaryTile
          icon={icons.star}
          label="Feedback"
          value={fbValue}
          sub={fbSub}
          accentColor={P.amber}
          glowColor={P.amberGlow}
          loading={statsLoading}
          onClick={() => navigateTo('feedback')}
        />
      </div>

      {/* ── Event details card ───────────────────────────────────────────────── */}
      <div style={{ background:P.surface, border:`1px solid ${P.border}`, borderRadius:16, padding:'24px', boxShadow:'0 4px 20px rgba(0,0,0,0.25)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, gap:12 }}>
          <div>
            <h2 style={{ margin:'0 0 8px', fontSize:22, fontWeight:800, color:P.text, letterSpacing:'-0.02em' }}>{event.title}</h2>
            <span style={{ padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:700, background:sc+'1a', color:sc, border:`1px solid ${sc}33` }}>
              {event.status || 'planning'}
            </span>
          </div>
          <button
            onClick={() => setShowEdit(true)}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:8, border:`1px solid ${P.border}`, background:'transparent', color:P.sub, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', flexShrink:0, transition:'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = P.text; e.currentTarget.style.borderColor = P.sub; }}
            onMouseLeave={e => { e.currentTarget.style.color = P.sub;  e.currentTarget.style.borderColor = P.border; }}
          >
            {icons.edit} Edit
          </button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(190px,1fr))', gap:'20px 24px' }}>
          <DetailRow label="Date"               value={fmtDate(event.date)} />
          <DetailRow label="Time"               value={`${event.startTime || '—'}${event.endTime ? ` – ${event.endTime}` : ''}`} />
          <DetailRow label="Event Type"         value={fmtType(event.eventType)} />
          <DetailRow label="Expected Attendees" value={event.expectedAttendees > 0 ? event.expectedAttendees.toLocaleString() : null} />
          <DetailRow label="Venue / Location"   value={event.locationSnapshot?.venueName !== 'TBD' ? event.locationSnapshot?.venueName : null} />
          <DetailRow label="Dress Code"         value={event.dressCode} />
        </div>

        {event.description && (
          <div style={{ marginTop:20, paddingTop:20, borderTop:`1px solid ${P.borderSub}` }}>
            <p style={{ margin:'0 0 8px', fontSize:11, fontWeight:700, color:P.muted, textTransform:'uppercase', letterSpacing:'0.08em' }}>Description</p>
            <p style={{ margin:0, fontSize:14, color:P.sub, lineHeight:1.7 }}>{event.description}</p>
          </div>
        )}
      </div>

      {showEdit && (
        <SettingsModal
          event={event}
          onSave={onEventUpdate}
          onClose={() => setShowEdit(false)}
        />
      )}
    </div>
  );
}