import { useState, useEffect } from 'react';
import { updateEvent }              from '../../services/serviceEvent';
import { listGuests }               from '../../services/serviceGuest';
import { getBroadcasts }            from '../../services/serviceBroadcast';
import { getEventFeedbackSummary }  from '../../services/serviceFeedback';
import { EVENT_TYPES }              from '../../utils/constants';
import { P, STATUS_COLORS, STATUS_OPTIONS, icons } from '../../utils/theme';

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
  const [showEdit,  setShowEdit]  = useState(false);
  const [form,      setForm]      = useState({});
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState(null);

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

  const openEdit = () => {
    setForm({
      title:             event.title || '',
      description:       event.description || '',
      date:              event.date ? new Date(event.date).toISOString().split('T')[0] : '',
      startTime:         event.startTime || '',
      endTime:           event.endTime || '',
      eventType:         event.eventType || '',
      expectedAttendees: event.expectedAttendees || '',
      location:          event.locationSnapshot?.venueName !== 'TBD' ? (event.locationSnapshot?.venueName || '') : '',
      dressCode:         event.dressCode || '',
      status:            event.status || 'planning',
    });
    setSaveError(null);
    setShowEdit(true);
  };

  const handleSave = async () => {
    setSaveError(null);
    if (!form.title.trim()) { setSaveError('Title is required'); return; }
    setSaving(true);
    try {
      const updated = await updateEvent(event._id, form);
      onEventUpdate(updated);
      setShowEdit(false);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const set   = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const sc    = STATUS_COLORS[event.status] || P.muted;

  // Feedback tile copy
  const fbValue = feedbackSummary?.averages?.overall
    ? `${feedbackSummary.averages.overall}★`
    : event.status === 'completed' ? '0' : 'N/A';
  const fbSub = feedbackSummary?.count != null
    ? `${feedbackSummary.count} response${feedbackSummary.count !== 1 ? 's' : ''}`
    : event.status !== 'completed' ? 'After event ends' : 'No responses';

  const inp = {
    width:'100%', padding:'11px 14px', borderRadius:8,
    border:`1px solid ${P.border}`, background:P.hover,
    color:P.text, fontSize:14, outline:'none',
    boxSizing:'border-box', fontFamily:'inherit',
    transition:'border-color 0.15s',
  };

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
            onClick={openEdit}
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

      {/* ── Edit modal ───────────────────────────────────────────────────────── */}
      {showEdit && (
        <div
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, backdropFilter:'blur(8px)', padding:20, overflowY:'auto' }}
          onClick={() => setShowEdit(false)}
        >
          <div
            style={{ background:P.panel, borderRadius:16, padding:'32px 36px', width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto', border:`1px solid ${P.border}`, boxShadow:'0 20px 48px rgba(0,0,0,0.7)' }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ margin:'0 0 24px', fontSize:19, fontWeight:700, color:P.text }}>Edit Event Details</h2>
            {saveError && <div style={{ background:P.redGlow, color:P.red, border:`1px solid ${P.red}33`, borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:14 }}>{saveError}</div>}

            {[
              { label:'Event Title *', key:'title', type:'text' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:P.sub, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>{f.label}</label>
                <input style={inp} type={f.type} value={form[f.key] || ''} onChange={e => set(f.key, e.target.value)} />
              </div>
            ))}

            <div style={{ display:'flex', gap:12, marginBottom:14 }}>
              {[{ label:'Event Type', key:'eventType', el:'select' }, { label:'Status', key:'status', el:'select' }].map(f => (
                <div key={f.key} style={{ flex:1 }}>
                  <label style={{ display:'block', fontSize:12, fontWeight:600, color:P.sub, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>{f.label}</label>
                  <select style={{ ...inp, cursor:'pointer' }} value={form[f.key] || ''} onChange={e => set(f.key, e.target.value)}>
                    {f.key === 'eventType' ? (
                      <><option value="">Select…</option>{EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</>
                    ) : (
                      STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)
                    )}
                  </select>
                </div>
              ))}
            </div>

            <div style={{ display:'flex', gap:12, marginBottom:14 }}>
              {[{ label:'Date', key:'date', type:'date' }, { label:'Expected Attendees', key:'expectedAttendees', type:'number' }].map(f => (
                <div key={f.key} style={{ flex:1 }}>
                  <label style={{ display:'block', fontSize:12, fontWeight:600, color:P.sub, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>{f.label}</label>
                  <input style={inp} type={f.type} min={f.type==='number'?'0':undefined} value={form[f.key] || ''} onChange={e => set(f.key, e.target.value)} />
                </div>
              ))}
            </div>

            <div style={{ display:'flex', gap:12, marginBottom:14 }}>
              {[{ label:'Start Time', key:'startTime', type:'time' }, { label:'End Time', key:'endTime', type:'time' }].map(f => (
                <div key={f.key} style={{ flex:1 }}>
                  <label style={{ display:'block', fontSize:12, fontWeight:600, color:P.sub, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>{f.label}</label>
                  <input style={inp} type={f.type} value={form[f.key] || ''} onChange={e => set(f.key, e.target.value)} />
                </div>
              ))}
            </div>

            <div style={{ display:'flex', gap:12, marginBottom:14 }}>
              {[{ label:'Venue / Location', key:'location' }, { label:'Dress Code', key:'dressCode' }].map(f => (
                <div key={f.key} style={{ flex:1 }}>
                  <label style={{ display:'block', fontSize:12, fontWeight:600, color:P.sub, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>{f.label}</label>
                  <input style={inp} value={form[f.key] || ''} onChange={e => set(f.key, e.target.value)} />
                </div>
              ))}
            </div>

            <div style={{ marginBottom:20 }}>
              <label style={{ display:'block', fontSize:12, fontWeight:600, color:P.sub, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>Description</label>
              <textarea style={{ ...inp, minHeight:88, resize:'vertical' }} value={form.description || ''} onChange={e => set('description', e.target.value)} />
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setShowEdit(false)} style={{ flex:1, padding:'11px 0', borderRadius:8, border:`1px solid ${P.border}`, background:'transparent', color:P.sub, fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ flex:1, padding:'11px 0', borderRadius:8, border:'none', background:saving?P.muted:P.blue, color:'#fff', fontWeight:600, fontSize:14, cursor:saving?'not-allowed':'pointer', fontFamily:'inherit' }}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}