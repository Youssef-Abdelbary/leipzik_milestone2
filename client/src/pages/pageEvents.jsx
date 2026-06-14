import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { listEvents, createEvent, deleteEvent } from '../services/serviceEvent';
import { EVENT_TYPES, STATUS_OPTIONS, STATUS_COLORS} from '../utils/constants';

const EMPTY_FORM = {
  title: '', description: '', date: '', startTime: '09:00',
  endTime: '', eventType: '', expectedAttendees: '', location: '', dressCode: '',
};

function fmtDate(d) {
  if (!d) return 'No date set';
  return new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtType(val) {
  return EVENT_TYPES.find(t => t.value === val)?.label || val?.replace('_', ' ') || '—';
}

function isPast(d) {
  return d && new Date(d) < new Date(new Date().setHours(0, 0, 0, 0));
}

function EventModal({ initialForm = EMPTY_FORM, title, submitLabel, onSubmit, onClose, loading, error }) {
  const [form, setForm] = useState(initialForm);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const s = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(2px)', padding: '20px', overflowY: 'auto' },
    modal:   { background: '#fff', borderRadius: 14, padding: '32px 36px', width: '100%', maxWidth: 520, boxShadow: '0 24px 64px rgba(15,23,42,0.18)', maxHeight: '90vh', overflowY: 'auto' },
    heading: { margin: '0 0 24px', fontSize: 20, fontWeight: 700, color: '#0F172A' },
    field:   { marginBottom: 16 },
    label:   { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 },
    input:   { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', color: '#a9abb3' },
    row:     { display: 'flex', gap: 12 },
    half:    { flex: 1 },
    actions: { display: 'flex', gap: 10, marginTop: 8 },
    cancel:  { flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', color: '#374151', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' },
    submit:  { flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: loading ? '#94A3B8' : '#0F172A', color: '#fff', fontWeight: 600, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' },
    errBox:  { background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 },
  };

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <h2 style={s.heading}>{title}</h2>
        {error && <div style={s.errBox}>{error}</div>}

        <div style={s.field}><label style={s.label}>Event Title *</label><input style={s.input} value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Summer Pop-Up Café" /></div>

        <div style={s.row}>
          <div style={{ ...s.field, ...s.half }}>
            <label style={s.label}>Event Type *</label>
            <select style={s.input} value={form.eventType} onChange={e => set('eventType', e.target.value)}>
              <option value="">Select type…</option>
              {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div style={{ ...s.field, ...s.half }}>
            <label style={s.label}>Status</label>
            <select style={s.input} value={form.status || 'planning'} onChange={e => set('status', e.target.value)}>
              {STATUS_OPTIONS.map(st => <option key={st} value={st}>{st.charAt(0).toUpperCase() + st.slice(1)}</option>)}
            </select>
          </div>
        </div>

        <div style={s.row}>
          <div style={{ ...s.field, ...s.half }}><label style={s.label}>Date *</label><input style={s.input} type="date" value={form.date} onChange={e => set('date', e.target.value)} /></div>
          <div style={{ ...s.field, ...s.half }}><label style={s.label}>Expected Attendees</label><input style={s.input} type="number" min="0" value={form.expectedAttendees} onChange={e => set('expectedAttendees', e.target.value)} placeholder="e.g. 150" /></div>
        </div>

        <div style={s.row}>
          <div style={{ ...s.field, ...s.half }}><label style={s.label}>Start Time *</label><input style={s.input} type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)} /></div>
          <div style={{ ...s.field, ...s.half }}><label style={s.label}>End Time</label><input style={s.input} type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)} /></div>
        </div>

        <div style={s.row}>
          <div style={{ ...s.field, ...s.half }}><label style={s.label}>Venue / Location</label><input style={s.input} value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. The Garden Hall" /></div>
          <div style={{ ...s.field, ...s.half }}><label style={s.label}>Dress Code</label><input style={s.input} value={form.dressCode} onChange={e => set('dressCode', e.target.value)} placeholder="e.g. Smart casual" /></div>
        </div>

        <div style={s.field}><label style={s.label}>Description</label><textarea style={{ ...s.input, minHeight: 80, resize: 'vertical' }} value={form.description} onChange={e => set('description', e.target.value)} placeholder="What's this event about?" /></div>

        <div style={s.actions}>
          <button style={s.cancel} onClick={onClose}>Cancel</button>
          <button style={s.submit} disabled={loading} onClick={() => onSubmit(form)}>{loading ? 'Saving…' : submitLabel}</button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({ event, onConfirm, onCancel, loading }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(2px)' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: '32px 36px', maxWidth: 420, width: '90%', boxShadow: '0 24px 64px rgba(15,23,42,0.18)' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, fontSize: 20 }}>⚠️</div>
        <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#0F172A' }}>Delete event?</h2>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: '#475569', lineHeight: 1.6 }}>
          <strong style={{ color: '#0F172A' }}>{event.title}</strong> will be permanently deleted. This cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', color: '#374151', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: loading ? '#94A3B8' : '#DC2626', color: '#fff', fontWeight: 600, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Deleting…' : 'Delete Event'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Events() {
  const navigate = useNavigate();
  const [events, setEvents]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [search, setSearch]               = useState('');
  const [statusFilter, setStatusFilter]   = useState('all');
  const [typeFilter, setTypeFilter]       = useState('all');
  const [showCreate, setShowCreate]       = useState(false);
  const [creating, setCreating]           = useState(false);
  const [createError, setCreateError]     = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting]           = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await listEvents();
      setEvents(Array.isArray(data) ? data : []);
    } catch {
      setError('Failed to load events. Make sure you are logged in as an organizer.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    const init = async () => {
      if (!ignore) await load();
    };
    init();
    return () => { ignore = true; };
  }, [load]);

  const filtered = useMemo(() => {
  let list = [...events];
  
  if (search.trim()) {
    const q = search.toLowerCase();
    list = list.filter(ev =>
      ev.title?.toLowerCase().includes(q) ||
      ev.description?.toLowerCase().includes(q) ||
      ev.locationSnapshot?.venueName?.toLowerCase().includes(q) ||
      ev.eventType?.toLowerCase().includes(q)
    );
  }
  
  if (statusFilter !== 'all') list = list.filter(ev => ev.status === statusFilter);
  if (typeFilter   !== 'all') list = list.filter(ev => ev.eventType === typeFilter);
  
  list.sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(a.date) - new Date(b.date);
  });
  
  return list;
}, [events, search, statusFilter, typeFilter]); // <-- Dependency array is crucial!

  const handleCreate = async (form) => {
    setCreateError(null);
    if (!form.title.trim())  { setCreateError('Title is required');      return; }
    if (!form.eventType)     { setCreateError('Event type is required'); return; }
    if (!form.date)          { setCreateError('Date is required');       return; }
    if (!form.startTime)     { setCreateError('Start time is required'); return; }
    setCreating(true);
    try {
      const ev = await createEvent(form);
      setEvents(prev => [ev, ...prev]);
      setShowCreate(false);
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deleteEvent(confirmDelete._id);
      setEvents(prev => prev.filter(e => e._id !== confirmDelete._id));
      setConfirmDelete(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const hasFilters = search || statusFilter !== 'all' || typeFilter !== 'all';

  const s = {
    page:     { minHeight: '100vh', background: '#F8FAFC', fontFamily: 'system-ui, -apple-system, sans-serif' },
    nav:      { background: '#0F172A', padding: '0 32px', display: 'flex', alignItems: 'center', height: 60, gap: 16 },
    navDot:   { width: 28, height: 28, borderRadius: 6, background: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    inner:    { maxWidth: 960, margin: '0 auto', padding: '36px 24px' },
    hdr:      { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16 },
    h1:       { margin: 0, fontSize: 26, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em' },
    subtitle: { margin: '4px 0 0', fontSize: 14, color: '#64748B' },
    newBtn:   { padding: '10px 20px', background: '#0F172A', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' },
    toolbar:  { display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' },
    search:   { flex: '1 1 220px', padding: '10px 14px', borderRadius: 9, border: '1px solid #E2E8F0', background: '#fff', fontSize: 14, color: '#0F172A', outline: 'none', boxShadow: '0 1px 3px rgba(15,23,42,0.05)' },
    sel:      { padding: '10px 12px', borderRadius: 9, border: '1px solid #E2E8F0', background: '#fff', fontSize: 13, fontWeight: 500, color: '#0F172A', outline: 'none', cursor: 'pointer' },
    clearBtn: { padding: '10px 14px', borderRadius: 9, border: '1px solid #E2E8F0', background: '#fff', fontSize: 13, color: '#64748B', cursor: 'pointer' },
    card:     { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10, boxShadow: '0 1px 4px rgba(15,23,42,0.04)' },
    cardInfo: { flex: 1, cursor: 'pointer', minWidth: 0 },
    cardTitle:{ margin: '0 0 6px', fontSize: 17, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    cardMeta: { display: 'flex', gap: 14, fontSize: 13, color: '#64748B', flexWrap: 'wrap' },
    actions:  { display: 'flex', gap: 8, flexShrink: 0 },
    openBtn:  { padding: '8px 16px', borderRadius: 7, border: 'none', background: '#0F172A', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
    delBtn:   { padding: '8px 14px', borderRadius: 7, border: '1px solid #FECACA', background: '#FFF5F5', color: '#DC2626', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
    empty:    { textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0' },
    errBox:   { background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 16px', fontSize: 13, marginBottom: 20 },
    statRow:  { display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' },
  };

  const badge = (status) => {
    const sc = STATUS_COLORS[status] || STATUS_COLORS.planning;
    return { padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.text };
  };

  return (
    <div style={s.page}>
      <div style={s.nav}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={s.navDot}><span style={{ color: '#fff', fontSize: 14 }}>⚙</span></div>
          <span style={{ color: '#F8FAFC', fontSize: 15, fontWeight: 700 }}>PopEyez</span>
        </div>
        <span style={{ color: '#475569', fontSize: 13, marginLeft: 4 }}>/ Events</span>
      </div>

      <div style={s.inner}>
        <div style={s.hdr}>
          <div>
            <h1 style={s.h1}>My Events</h1>
            <p style={s.subtitle}>Plan and manage your pop-up events.</p>
          </div>
          <button style={s.newBtn} onClick={() => { setShowCreate(true); setCreateError(null); }}>+ New Event</button>
        </div>

        {error && <div style={s.errBox}>{error}</div>}

        {!loading && events.length > 0 && (
          <div style={s.statRow}>
            {[
              { label: 'Total',     value: events.length,                                        color: '#0F172A' },
              { label: 'Planning',  value: events.filter(e => e.status === 'planning').length,   color: '#4338CA' },
              { label: 'Confirmed', value: events.filter(e => e.status === 'confirmed').length,  color: '#166534' },
              { label: 'Upcoming',  value: events.filter(e => e.date && !isPast(e.date)).length, color: '#0EA5E9' },
              { label: 'Past',      value: events.filter(e => e.date &&  isPast(e.date)).length, color: '#94A3B8' },
            ].map(st => (
              <div key={st.label} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, padding: '12px 20px', textAlign: 'center', minWidth: 72 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: st.color, lineHeight: 1 }}>{st.value}</div>
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 3, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{st.label}</div>
              </div>
            ))}
          </div>
        )}

        <div style={s.toolbar}>
          <input style={s.search} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title, location, or type…" />
          <select style={s.sel} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            {STATUS_OPTIONS.map(st => <option key={st} value={st}>{st.charAt(0).toUpperCase() + st.slice(1)}</option>)}
          </select>
          <select style={s.sel} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="all">All Types</option>
            {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          {hasFilters && <button style={s.clearBtn} onClick={() => { setSearch(''); setStatusFilter('all'); setTypeFilter('all'); }}>Clear filters</button>}
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#94A3B8', padding: 60 }}>Loading events…</p>
        ) : events.length === 0 ? (
          <div style={s.empty}>
            <p style={{ fontSize: 36, margin: '0 0 12px' }}>📋</p>
            <p style={{ fontWeight: 600, color: '#0F172A', fontSize: 16, margin: '0 0 8px' }}>No events yet</p>
            <p style={{ color: '#64748B', fontSize: 14, marginBottom: 20 }}>Create your first event to get started.</p>
            <button style={s.newBtn} onClick={() => setShowCreate(true)}>+ New Event</button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={s.empty}>
            <p style={{ fontWeight: 600, color: '#0F172A', fontSize: 16, margin: '0 0 8px' }}>No events match your filters</p>
            <p style={{ color: '#64748B', fontSize: 14 }}>Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div>
            {filtered.map(ev => {
              const past = isPast(ev.date);
              return (
                <div key={ev._id} style={{ ...s.card, opacity: past ? 0.8 : 1 }}>
                  <div style={s.cardInfo} onClick={() => navigate(`/organizer/events/${ev._id}/workspace`)}>
                    <div style={s.cardTitle}>
                      {ev.title}
                      <span style={badge(ev.status)}>{ev.status || 'planning'}</span>
                      {past && <span style={{ padding: '3px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: '#F8FAFC', color: '#94A3B8', border: '1px solid #E2E8F0' }}>Past</span>}
                    </div>
                    <div style={s.cardMeta}>
                      <span>📅 {fmtDate(ev.date)}</span>
                      {ev.startTime && <span>⏰ {ev.startTime}{ev.endTime ? `–${ev.endTime}` : ''}</span>}
                      {ev.locationSnapshot?.venueName && ev.locationSnapshot.venueName !== 'TBD' && <span>📍 {ev.locationSnapshot.venueName}</span>}
                      {ev.eventType && <span>🏷 {fmtType(ev.eventType)}</span>}
                      {ev.expectedAttendees > 0 && <span>👥 {ev.expectedAttendees.toLocaleString()} expected</span>}
                    </div>
                  </div>
                  <div style={s.actions}>
                    <button style={s.openBtn} onClick={() => navigate(`/organizer/events/${ev._id}/workspace`)}>Open →</button>
                    <button style={s.delBtn} onClick={e => { e.stopPropagation(); setConfirmDelete(ev); }}
                      onMouseEnter={e => Object.assign(e.currentTarget.style, { background: '#DC2626', color: '#fff' })}
                      onMouseLeave={e => Object.assign(e.currentTarget.style, { background: '#FFF5F5', color: '#DC2626' })}>
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
            <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 8 }}>Showing {filtered.length} of {events.length} events</p>
          </div>
        )}
      </div>

      {showCreate && <EventModal title="Create New Event" submitLabel="Create Event" initialForm={EMPTY_FORM} onSubmit={handleCreate} onClose={() => { setShowCreate(false); setCreateError(null); }} loading={creating} error={createError} />}
      {confirmDelete && <DeleteModal event={confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={deleting} />}
    </div>
  );
}