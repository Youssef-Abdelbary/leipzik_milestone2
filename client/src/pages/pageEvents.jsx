import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { listEvents, deleteEvent } from '../services/serviceEvent';
import { EVENT_TYPES } from '../utils/constants';
import { P, icons, STATUS_COLORS, STATUS_OPTIONS } from '../utils/theme';
import SettingsModal from '../components/SettingsModal';

const BLANK_EVENT = {
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

function DeleteModal({ event, onConfirm, onCancel, loading }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.80)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
      <style>{`@keyframes modalIn{from{opacity:0;transform:scale(0.96) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
      <div style={{ background: P.panel, borderRadius: 16, padding: '32px 36px', maxWidth: 420, width: '90%', border: `1px solid ${P.border}`, boxShadow: '0 20px 48px rgba(0,0,0,0.8)', animation: 'modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1) both' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: P.redGlow, border: `1px solid ${P.red}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, color: P.red }}>
          {icons.warning}
        </div>
        <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: P.text }}>Delete event?</h2>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: P.sub, lineHeight: 1.6 }}>
          <strong style={{ color: P.text }}>{event.title}</strong> will be permanently deleted. This cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            style={{ flex: 1, padding: '11px 0', borderRadius: 9, border: `1px solid ${P.border}`, background: 'transparent', color: P.sub, fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = P.text; e.currentTarget.style.borderColor = P.sub; }}
            onMouseLeave={e => { e.currentTarget.style.color = P.sub; e.currentTarget.style.borderColor = P.border; }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{ flex: 1, padding: '11px 0', borderRadius: 9, border: 'none', background: loading ? P.muted : P.red, color: '#fff', fontWeight: 600, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'background 0.15s' }}
          >
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
  const [dateFilter, setDateFilter]       = useState('all');
  const [showCreate, setShowCreate]       = useState(false);
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
    const init = async () => { if (!ignore) await load(); };
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
    if (dateFilter === 'upcoming') list = list.filter(ev => ev.date && !isPast(ev.date));
    if (dateFilter === 'past')     list = list.filter(ev => ev.date &&  isPast(ev.date));
    list.sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(a.date) - new Date(b.date);
    });
    return list;
  }, [events, search, statusFilter, typeFilter, dateFilter]);

  const handleCreated = (ev) => {
    setEvents(prev => [ev, ...prev]);
    setShowCreate(false);
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

  const hasFilters = search || statusFilter !== 'all' || typeFilter !== 'all' || dateFilter !== 'all';

  const inp = {
    height: '42px', padding: '0 14px', boxSizing: 'border-box',
    borderRadius: 9, border: `1px solid ${P.border}`,
    background: P.hover, color: P.text, fontSize: 13, outline: 'none',
    fontFamily: 'inherit', transition: 'border-color 0.15s',
  };

  const statItems = [
    { label: 'Total',     value: events.length,                                         color: P.blue,   filterType: 'all'    },
    { label: 'Planning',  value: events.filter(e => e.status === 'planning').length,    color: P.purple, filterType: 'status', filterKey: 'planning'  },
    { label: 'Confirmed', value: events.filter(e => e.status === 'confirmed').length,   color: P.green,  filterType: 'status', filterKey: 'confirmed' },
    { label: 'Upcoming',  value: events.filter(e => e.date && !isPast(e.date)).length,  color: P.teal,   filterType: 'date',   filterKey: 'upcoming'  },
    { label: 'Past',      value: events.filter(e => e.date &&  isPast(e.date)).length,  color: P.muted,  filterType: 'date',   filterKey: 'past'      },
  ];

  const getTileActive = (st) => {
    if (st.filterType === 'all')    return statusFilter === 'all' && dateFilter === 'all';
    if (st.filterType === 'status') return statusFilter === st.filterKey;
    return dateFilter === st.filterKey;
  };

  const handleTileClick = (st) => {
    if (st.filterType === 'all') {
      setStatusFilter('all');
      setDateFilter('all');
    } else if (st.filterType === 'status') {
      setStatusFilter(prev => prev === st.filterKey ? 'all' : st.filterKey);
      setDateFilter('all');
    } else {
      setDateFilter(prev => prev === st.filterKey ? 'all' : st.filterKey);
      setStatusFilter('all');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: P.bg, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif", color: P.text }}>
      <style>{`
        @keyframes pageIn   { from { opacity:0 } to { opacity:1 } }
        @keyframes cardIn   { from { opacity:0; transform:translateY(18px) } to { opacity:1; transform:translateY(0) } }
        @keyframes modalIn  { from { opacity:0; transform:scale(0.96) translateY(10px) } to { opacity:1; transform:scale(1) translateY(0) } }
        @keyframes skpulse  { 0%,100%{opacity:1} 50%{opacity:.3} }
        .ev-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .ev-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.4) !important; }
        .open-btn { transition: all 0.15s ease; }
        .open-btn:hover { background: ${P.blue} !important; }
        .del-btn  { transition: all 0.15s ease; }
        .del-btn:hover  { background: ${P.red} !important; color: #fff !important; border-color: ${P.red} !important; }
        select option { background: ${P.panel}; color: ${P.text}; }
      `}</style>

      {/* Nav */}
      <div style={{ background: 'rgba(17,17,17,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: `1px solid ${P.border}`, padding: '0 28px', height: 54, display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 50 }}>
        <button
          onClick={() => navigate('/organizer/workflow')}
          style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: P.sub, cursor: 'pointer', fontSize: 13, padding: '4px 8px', borderRadius: 6, fontFamily: 'inherit', transition: 'color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.color = P.text}
          onMouseLeave={e => e.currentTarget.style.color = P.sub}
        >
          {icons.back} Workflow
        </button>
        <span style={{ color: P.muted, fontSize: 14, userSelect: 'none' }}>/</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: P.text }}>Events</span>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '36px 24px', animation: 'pageIn 0.3s ease' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 16 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: P.text, letterSpacing: '-0.03em' }}>My Events</h1>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: P.sub }}>Plan and manage your pop-up events.</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: P.blue, color: '#fff', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', whiteSpace: 'nowrap', flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            {icons.plus} New Event
          </button>
        </div>

        {error && (
          <div style={{ background: P.redGlow, color: P.red, border: `1px solid ${P.red}33`, borderRadius: 8, padding: '12px 16px', fontSize: 13, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            {icons.warning} {error}
          </div>
        )}

        {/* Stats row — each tile is a filter toggle */}
        {!loading && events.length > 0 && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
            {statItems.map((st, i) => {
              const active = getTileActive(st);
              return (
                <button
                  key={st.label}
                  onClick={() => handleTileClick(st)}
                  style={{
                    flex: '1 1 80px',
                    background: active ? `${st.color}18` : P.surface,
                    border: `1px solid ${active ? st.color + '55' : P.border}`,
                    borderRadius: 12, padding: '14px 20px', textAlign: 'center',
                    cursor: 'pointer', fontFamily: 'inherit',
                    animation: `cardIn 0.3s ease ${i * 0.05}s both`,
                    transition: 'background 0.15s, border-color 0.15s, transform 0.15s',
                    transform: active ? 'translateY(-2px)' : 'translateY(0)',
                    boxShadow: active ? `0 4px 16px ${st.color}22` : 'none',
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = `${st.color}0d`; e.currentTarget.style.borderColor = `${st.color}33`; } e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = P.surface; e.currentTarget.style.borderColor = P.border; } e.currentTarget.style.transform = active ? 'translateY(-2px)' : 'translateY(0)'; }}
                >
                  <div style={{ fontSize: 22, fontWeight: 800, color: st.color, lineHeight: 1 }}>{st.value}</div>
                  <div style={{ fontSize: 11, color: active ? st.color : P.muted, marginTop: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', transition: 'color 0.15s' }}>{st.label}</div>
                </button>
              );
            })}
          </div>
        )}

        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 220px', position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: 12, color: P.muted, display: 'flex', pointerEvents: 'none' }}>{icons.search}</span>
            <input
              style={{ ...inp, width: '100%', paddingLeft: 40 }}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title, location, or type…"
              onFocus={e => e.target.style.borderColor = P.blue}
              onBlur={e => e.target.style.borderColor = P.border}
            />
          </div>
          <select style={{ ...inp, cursor: 'pointer' }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setDateFilter('all'); }}>
            <option value="all">All Status</option>
            {STATUS_OPTIONS.map(st => <option key={st} value={st}>{st.charAt(0).toUpperCase() + st.slice(1)}</option>)}
          </select>
          <select style={{ ...inp, cursor: 'pointer' }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="all">All Types</option>
            {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          {hasFilters && (
            <button
              onClick={() => { setSearch(''); setStatusFilter('all'); setTypeFilter('all'); setDateFilter('all'); }}
              style={{ ...inp, cursor: 'pointer', color: P.sub, display: 'flex', alignItems: 'center', gap: 6 }}
              onMouseEnter={e => e.currentTarget.style.color = P.text}
              onMouseLeave={e => e.currentTarget.style.color = P.sub}
            >
              {icons.x} Clear
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ background: P.surface, border: `1px solid ${P.border}`, borderRadius: 12, padding: '20px 24px', marginBottom: 10, height: 80, animation: `skpulse 1.4s infinite ${i * 0.12}s` }} />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: P.surface, borderRadius: 16, border: `1px solid ${P.border}`, animation: 'cardIn 0.35s ease both' }}>
            <div style={{ color: P.muted, marginBottom: 12, display: 'flex', justifyContent: 'center', transform: 'scale(1.8)' }}>{icons.clipboard}</div>
            <p style={{ fontWeight: 700, color: P.text, fontSize: 16, margin: '0 0 8px' }}>No events yet</p>
            <p style={{ color: P.sub, fontSize: 14, marginBottom: 24 }}>Create your first event to get started.</p>
            <button
              onClick={() => setShowCreate(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 20px', background: P.blue, color: '#fff', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {icons.plus} New Event
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: P.surface, borderRadius: 16, border: `1px solid ${P.border}` }}>
            <p style={{ fontWeight: 700, color: P.text, fontSize: 16, margin: '0 0 8px' }}>No events match your filters</p>
            <p style={{ color: P.sub, fontSize: 14 }}>Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div>
            {filtered.map((ev, i) => {
              const statusColor = STATUS_COLORS[ev.status] || P.muted;
              const past = isPast(ev.date);
              return (
                <div
                  key={ev._id}
                  className="ev-card"
                  style={{
                    background: P.surface,
                    border: `1px solid ${P.border}`,
                    borderRadius: 12,
                    padding: '18px 22px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    marginBottom: 10,
                    opacity: past ? 0.75 : 1,
                    animation: `cardIn 0.32s ease ${i * 0.06}s both`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  }}
                >
                  <div
                    style={{ flex: 1, cursor: 'pointer', minWidth: 0 }}
                    onClick={() => navigate(`/organizer/events/${ev._id}/workspace`)}
                  >
                    <div style={{ margin: '0 0 7px', fontSize: 16, fontWeight: 700, color: P.text, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {ev.title}
                      <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: statusColor + '1a', color: statusColor, border: `1px solid ${statusColor}33`, letterSpacing: '0.05em' }}>
                        {(ev.status || 'planning').toUpperCase()}
                      </span>
                      {past && <span style={{ padding: '3px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: P.hover, color: P.muted, border: `1px solid ${P.border}` }}>PAST</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 14, fontSize: 13, color: P.sub, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ color: P.muted }}>{icons.calendar}</span>{fmtDate(ev.date)}</span>
                      {ev.startTime && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ color: P.muted }}>{icons.clock}</span>
                          {ev.startTime}{ev.endTime ? `–${ev.endTime}` : ''}
                        </span>
                      )}
                      {ev.locationSnapshot?.venueName && ev.locationSnapshot.venueName !== 'TBD' && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ color: P.muted }}>{icons.mapPin}</span>{ev.locationSnapshot.venueName}</span>
                      )}
                      {ev.eventType && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ color: P.muted }}>{icons.tag}</span>{fmtType(ev.eventType)}</span>
                      )}
                      {ev.expectedAttendees > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ color: P.muted }}>{icons.users}</span>{ev.expectedAttendees.toLocaleString()} expected</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button
                      className="open-btn"
                      onClick={() => navigate(`/organizer/events/${ev._id}/workspace`)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: P.blue, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      Open {icons.arrowRight}
                    </button>
                    <button
                      className="del-btn"
                      onClick={e => { e.stopPropagation(); setConfirmDelete(ev); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: `1px solid ${P.red}44`, background: P.redGlow, color: P.red, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      {icons.trash}
                    </button>
                  </div>
                </div>
              );
            })}
            <p style={{ fontSize: 13, color: P.muted, marginTop: 10 }}>Showing {filtered.length} of {events.length} events</p>
          </div>
        )}
      </div>

      {showCreate && (
        <SettingsModal
          createMode
          event={BLANK_EVENT}
          onSave={handleCreated}
          onClose={() => setShowCreate(false)}
        />
      )}
      {confirmDelete && (
        <DeleteModal
          event={confirmDelete}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
