import { useState, useEffect } from 'react';
import { updateEvent } from '../../services/serviceEvent';
import { listGuests } from '../../services/serviceGuest';
import { getBroadcasts } from '../../services/serviceBroadcast';
import { getEventFeedbackSummary } from '../../services/serviceFeedback';
import { EVENT_TYPES } from '../../utils/constants';

const STATUS_OPTIONS = ['planning', 'confirmed', 'completed', 'cancelled'];

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function fmtType(val) {
  return EVENT_TYPES.find(t => t.value === val)?.label || val?.replace(/_/g, ' ') || '—';
}

function navigateTo(tab) {
  window.dispatchEvent(new CustomEvent('workspace-tab', { detail: tab }));
}

function SummaryTile({ icon, label, value, sub, color, onClick, loading }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: '#fff',
        border: `1px solid ${hov ? color + '66' : '#E2E8F0'}`,
        borderRadius: 12,
        padding: '18px 20px',
        cursor: 'pointer',
        flex: '1 1 150px',
        boxShadow: hov ? `0 4px 16px ${color}22` : '0 1px 4px rgba(15,23,42,0.04)',
        transition: 'all 0.15s',
        transform: hov ? 'translateY(-2px)' : 'none',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <span style={{ fontSize: 11, color: color, fontWeight: 700, background: color + '15', padding: '2px 8px', borderRadius: 99 }}>View →</span>
      </div>
      {loading ? (
        <div style={{ height: 32, background: '#F1F5F9', borderRadius: 6, marginBottom: 4 }} />
      ) : (
        <p style={{ margin: '0 0 4px', fontSize: 28, fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{value}</p>
      )}
      <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 600, color: '#374151' }}>{label}</p>
      {sub && <p style={{ margin: 0, fontSize: 12, color: '#94A3B8' }}>{sub}</p>}
    </div>
  );
}

export default function TabOverview({ event, onEventUpdate }) {
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm]         = useState({});
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Live summary stats
  const [guestStats, setGuestStats]       = useState(null);
  const [broadcastCount, setBroadcastCount] = useState(null);
  const [feedbackSummary, setFeedbackSummary] = useState(null);
  const [statsLoading, setStatsLoading]   = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadStats = async () => {
      setStatsLoading(true);
      try {
        const [guests, broadcasts] = await Promise.allSettled([
          listGuests(event._id),
          getBroadcasts(event._id),
        ]);

        if (cancelled) return;

        if (guests.status === 'fulfilled') {
          const g = guests.value;
          setGuestStats({
            total:    g.length,
            attending: g.filter(x => x.rsvp?.status === 'attending').length,
            arrived:   g.filter(x => x.checkIn?.status === 'Arrived').length,
          });
        }

        if (broadcasts.status === 'fulfilled') {
          setBroadcastCount(broadcasts.value.length);
        }

        // Only fetch feedback for completed events
        if (event.status === 'completed') {
          try {
            const fb = await getEventFeedbackSummary(event._id);
            if (!cancelled) setFeedbackSummary(fb);
          } catch (err) {
            console.error('Failed to load feedback summary:', err);
          }
        }
      } catch (err) {
        console.error('Failed to load event stats:', err);
      }
      if (!cancelled) setStatsLoading(false);
    };

    loadStats();
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

  const STATUS_COLORS = {
    planning:  { bg: '#EEF2FF', text: '#4338CA' },
    confirmed: { bg: '#F0FDF4', text: '#166534' },
    completed: { bg: '#F8FAFC', text: '#94A3B8' },
    cancelled: { bg: '#FEF2F2', text: '#991B1B' },
  };
  const sc = STATUS_COLORS[event.status] || STATUS_COLORS.planning;

  const s = {
    page:    { maxWidth: 860, margin: '0 auto', padding: '28px 24px', fontFamily: 'system-ui, -apple-system, sans-serif' },
    card:    { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '24px', marginBottom: 16, boxShadow: '0 1px 4px rgba(15,23,42,0.04)' },
    hdr:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    title:   { margin: 0, fontSize: 24, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' },
    badge:   { padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: sc.bg, color: sc.text },
    editBtn: { padding: '9px 18px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', color: '#0F172A', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
    grid:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
    lbl:     { fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 4px' },
    val:     { fontSize: 15, fontWeight: 600, color: '#0F172A', margin: 0 },
    desc:    { fontSize: 14, color: '#475569', lineHeight: 1.65, margin: 0 },
    overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(2px)', padding: 20, overflowY: 'auto' },
    modal:   { background: '#fff', borderRadius: 14, padding: '32px 36px', width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(15,23,42,0.18)' },
    inp:     { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', color: '#0F172A' },
    flbl:    { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 },
  };

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Feedback tile content
  const feedbackTileValue = feedbackSummary?.averages?.overall
    ? `${feedbackSummary.averages.overall} ★`
    : event.status === 'completed' ? (feedbackSummary?.count === 0 ? '0' : '—') : 'N/A';
  const feedbackTileSub = feedbackSummary?.count != null
    ? `${feedbackSummary.count} response${feedbackSummary.count !== 1 ? 's' : ''}`
    : event.status !== 'completed' ? 'Available after event ends' : 'No responses yet';

  return (
    <div style={s.page}>

      {/* ── Summary Tiles ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <SummaryTile
          icon="🎟"
          label="Total Guests"
          value={guestStats?.total ?? '—'}
          sub={guestStats ? `${guestStats.attending} attending` : ''}
          color="#4338CA"
          loading={statsLoading}
          onClick={() => navigateTo('guests')}
        />
        <SummaryTile
          icon="✅"
          label="Arrivals"
          value={guestStats?.arrived ?? '—'}
          sub={guestStats ? `of ${guestStats.attending} expected` : ''}
          color="#166534"
          loading={statsLoading}
          onClick={() => navigateTo('day-of')}
        />
        <SummaryTile
          icon="💬"
          label="Broadcasts"
          value={broadcastCount ?? '—'}
          sub="messages sent"
          color="#0EA5E9"
          loading={statsLoading}
          onClick={() => navigateTo('messages')}
        />
        <SummaryTile
          icon="⭐"
          label="Feedback"
          value={feedbackTileValue}
          sub={feedbackTileSub}
          color="#F59E0B"
          loading={statsLoading}
          onClick={() => navigateTo('feedback')}
        />
      </div>

      {/* ── Event Details Card ─────────────────────────────────────────── */}
      <div style={s.card}>
        <div style={s.hdr}>
          <div>
            <h2 style={s.title}>{event.title}</h2>
            <span style={s.badge}>{event.status || 'planning'}</span>
          </div>
          <button style={s.editBtn} onClick={openEdit}>✏️ Edit Details</button>
        </div>

        <div style={s.grid}>
          <div><p style={s.lbl}>Date</p><p style={s.val}>{fmtDate(event.date)}</p></div>
          <div><p style={s.lbl}>Time</p><p style={s.val}>{event.startTime || '—'}{event.endTime ? ` — ${event.endTime}` : ''}</p></div>
          <div><p style={s.lbl}>Event Type</p><p style={s.val}>{fmtType(event.eventType)}</p></div>
          <div><p style={s.lbl}>Expected Attendees</p><p style={s.val}>{event.expectedAttendees > 0 ? event.expectedAttendees.toLocaleString() : '—'}</p></div>
          <div><p style={s.lbl}>Venue / Location</p><p style={s.val}>{event.locationSnapshot?.venueName && event.locationSnapshot.venueName !== 'TBD' ? event.locationSnapshot.venueName : '—'}</p></div>
          <div><p style={s.lbl}>Dress Code</p><p style={s.val}>{event.dressCode || '—'}</p></div>
        </div>

        {event.description && (
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #F1F5F9' }}>
            <p style={s.lbl}>Description</p>
            <p style={s.desc}>{event.description}</p>
          </div>
        )}
      </div>

      {/* ── Edit Modal ─────────────────────────────────────────────────── */}
      {showEdit && (
        <div style={s.overlay} onClick={() => setShowEdit(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 24px', fontSize: 19, fontWeight: 700, color: '#0F172A' }}>Edit Event Details</h2>
            {saveError && <div style={{ background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 14 }}>{saveError}</div>}

            <div style={{ marginBottom: 14 }}><label style={s.flbl}>Event Title *</label><input style={s.inp} value={form.title} onChange={e => set('title', e.target.value)} /></div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
              <div style={{ flex: 1 }}><label style={s.flbl}>Event Type</label><select style={s.inp} value={form.eventType} onChange={e => set('eventType', e.target.value)}><option value="">Select…</option>{EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
              <div style={{ flex: 1 }}><label style={s.flbl}>Status</label><select style={s.inp} value={form.status} onChange={e => set('status', e.target.value)}>{STATUS_OPTIONS.map(st => <option key={st} value={st}>{st.charAt(0).toUpperCase() + st.slice(1)}</option>)}</select></div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
              <div style={{ flex: 1 }}><label style={s.flbl}>Date</label><input style={s.inp} type="date" value={form.date} onChange={e => set('date', e.target.value)} /></div>
              <div style={{ flex: 1 }}><label style={s.flbl}>Expected Attendees</label><input style={s.inp} type="number" min="0" value={form.expectedAttendees} onChange={e => set('expectedAttendees', e.target.value)} /></div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
              <div style={{ flex: 1 }}><label style={s.flbl}>Start Time</label><input style={s.inp} type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)} /></div>
              <div style={{ flex: 1 }}><label style={s.flbl}>End Time</label><input style={s.inp} type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)} /></div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
              <div style={{ flex: 1 }}><label style={s.flbl}>Venue / Location</label><input style={s.inp} value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. The Garden Hall" /></div>
              <div style={{ flex: 1 }}><label style={s.flbl}>Dress Code</label><input style={s.inp} value={form.dressCode} onChange={e => set('dressCode', e.target.value)} /></div>
            </div>

            <div style={{ marginBottom: 14 }}><label style={s.flbl}>Description</label><textarea style={{ ...s.inp, minHeight: 80, resize: 'vertical' }} value={form.description} onChange={e => set('description', e.target.value)} /></div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowEdit(false)} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', color: '#374151', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: saving ? '#94A3B8' : '#0F172A', color: '#fff', fontWeight: 600, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{saving ? 'Saving…' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}