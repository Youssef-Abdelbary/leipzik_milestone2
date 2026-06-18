import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { listEvents, deleteEvent } from '../services/serviceEvent';
import { EVENT_TYPES } from '../utils/constants';
import { P, icons, STATUS_COLORS, STATUS_OPTIONS, GlassPanel } from '../components/componentTheme';
import { OpalSelect } from '../components/componentMenus';
import AppHeader from '../components/componentAppHeader';
import SettingsModal from '../components/SettingsModal';
import '../components/componentTheme.css';
import Dock from "../components/componentDock";
import { VscHome, VscCalendar, VscPerson, VscAccount, VscPersonAdd, VscTrash} from "react-icons/vsc";
import './pageEvents.css';


const BLANK_EVENT = {
  title: '', description: '', date: '', startTime: '09:00',
  endTime: '', eventType: '', expectedAttendees: '', location: '', dressCode: '',
};

function DockTabIcon({ icon }) {
  return (
    <div style={{ transform: "scale(1.25)", display: "flex" }}>
      {icon}
    </div>
  );
}

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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
      <style>{`@keyframes modalIn{from{opacity:0;transform:scale(0.96) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
      <GlassPanel style={{ padding: '32px 36px', maxWidth: 420, width: '90%', boxShadow: '0 24px 56px rgba(0,0,0,0.8)', animation: 'modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1) both' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: P.redGlow, border: `1px solid ${P.red}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, color: P.red }}>
          {icons.warning}
        </div>
        <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: P.text, fontFamily: 'var(--font-display)' }}>Delete event?</h2>
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
      </GlassPanel>
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

  const dockItems = [
    {
      icon: <VscHome size={26} />,
      label: "Home",
      active: false,
      onClick: () => navigate("/organizer/workflow"),
    },
    {
      icon: <VscCalendar size={26} />,
      label: "Events",
      active: true,
      onClick: () => navigate("/organizer/events"),
    },
    {
      icon: <VscTrash size={26} />,
      label: "Users",
      active: false,
      onClick: () => navigate("/organizer/deactivate"),
    },
    {
      icon: <VscPersonAdd size={26} />,
      label: "Create",
      active: false,
      onClick: () => navigate("/organizer/registerothers"),
    },
    {
      icon: <VscPerson size={26} />,
      label: "Profile",
      active: false,
      onClick: () => navigate("/profile"),
    },
  ];

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

  const statItems = [
    { label: 'Total',     value: events.length,                                         color: P.blue,   filterType: 'all'    },
    { label: 'Planning',  value: events.filter(e => e.status === 'planning').length,    color: P.indigo, filterType: 'status', filterKey: 'planning'  },
    { label: 'Confirmed', value: events.filter(e => e.status === 'confirmed').length,   color: P.teal,   filterType: 'status', filterKey: 'confirmed' },
    { label: 'Upcoming',  value: events.filter(e => e.date && !isPast(e.date)).length,  color: P.cyan,   filterType: 'date',   filterKey: 'upcoming'  },
    { label: 'Past',      value: events.filter(e => e.date &&  isPast(e.date)).length,  color: P.purple, filterType: 'date',   filterKey: 'past'      },
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

  const statusOptions = [{ value: 'all', label: 'All Status' }, ...STATUS_OPTIONS.map(st => ({ value: st, label: st.charAt(0).toUpperCase() + st.slice(1) }))];
  const typeOptions   = [{ value: 'all', label: 'All Types'  }, ...EVENT_TYPES.map(t => ({ value: t.value, label: t.label }))];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--opal-bg)', fontFamily: 'var(--font-body)', color: 'var(--opal-text)' }}>
      <style>{`
        @keyframes pageIn   { from { opacity:0 } to { opacity:1 } }
        @keyframes cardIn   { from { opacity:0; transform:translateY(18px) } to { opacity:1; transform:translateY(0) } }
        @keyframes skpulse  { 0%,100%{opacity:1} 50%{opacity:.3} }
        .ev-card { transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease; }
        .ev-card:hover {
          transform: translateY(-3px);
          border-color: rgba(139,109,255,0.40) !important;
          box-shadow: 0 0 0 1px rgba(139,109,255,0.14), 0 8px 32px 4px rgba(139,109,255,0.20), 0 2px 8px rgba(0,0,0,0.5) !important;
        }
        .open-btn:hover { background: ${P.blue} !important; border-color: ${P.blue} !important; color: #0a0a12 !important; }
        .del-btn:hover  { background: ${P.red} !important; color: #fff !important; border-color: ${P.red} !important; }
        .stat-tile:hover { transform: translateY(-3px) !important; }
        .nav-back-btn { background:none;border:none;color:var(--opal-sub);cursor:pointer;font-size:13px;padding:6px 10px;border-radius:8px;font-family:inherit;display:flex;align-items:center;gap:5px;transition:all 0.15s; }
        .nav-back-btn:hover { background:rgba(255,255,255,0.06);color:var(--opal-text); }
        .new-event-btn { display:flex;align-items:center;gap:7px;padding:9px 18px;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;transition:opacity 0.15s;white-space:nowrap; }
        .new-event-btn:hover { opacity:0.85; }
      `}</style>

      <AppHeader
        crumb="My Events"
        right={
          <div className="events-header-actions">
            <button
              className="new-event-btn"
              onClick={() => setShowCreate(true)}
              style={{
                background: `linear-gradient(135deg, ${P.blue} 0%, ${P.teal} 100%)`,
                color: "#0a0a12",
              }}
            >
              {icons.plus} New Event
            </button>

            <div className="organizer-dashboard-pill">
              Organizer Dashboard
            </div>
          </div>
        }
      />

      <div style={{ maxWidth: 980, margin: '0 auto', padding: '32px 24px', animation: 'pageIn 0.3s ease' }}>

        {/* Page heading */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 900, color: P.text, letterSpacing: '-0.04em', fontFamily: 'var(--font-display)', lineHeight: 1.1 }}>My Events</h1>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: P.sub, lineHeight: 1.5 }}>Plan and manage your pop-up events.</p>
        </div>

        {error && (
          <div style={{ background: P.redGlow, color: P.red, border: `1px solid ${P.red}44`, borderRadius: 10, padding: '12px 16px', fontSize: 13, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            {icons.warning} {error}
          </div>
        )}

        {/* Stat tiles */}
        {!loading && events.length > 0 && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
            {statItems.map((st, i) => {
              const active = getTileActive(st);
              return (
                <button
                  key={st.label}
                  onClick={() => handleTileClick(st)}
                  className="stat-tile"
                  style={{
                    flex: '1 1 80px',
                    background: active
                      ? `linear-gradient(135deg, ${st.color}22 0%, ${st.color}10 100%)`
                      : 'rgba(19,19,30,0.72)',
                    backdropFilter: 'blur(16px) saturate(140%)',
                    WebkitBackdropFilter: 'blur(16px) saturate(140%)',
                    border: `1px solid ${active ? st.color + '55' : P.border}`,
                    borderRadius: 14, padding: '18px 20px', textAlign: 'center',
                    cursor: 'pointer', fontFamily: 'inherit',
                    animation: `cardIn 0.3s ease ${i * 0.05}s both`,
                    transition: 'all 0.2s cubic-bezier(0.34,1.2,0.64,1)',
                    transform: active ? 'translateY(-3px)' : 'translateY(0)',
                    boxShadow: active
                      ? `0 0 0 1px ${st.color}33, 0 8px 24px ${st.color}22, inset 0 1px 0 rgba(255,255,255,0.06)`
                      : 'inset 0 1px 0 rgba(255,255,255,0.04)',
                    outline: 'none',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      e.currentTarget.style.background = `linear-gradient(135deg, ${st.color}18 0%, ${st.color}08 100%)`;
                      e.currentTarget.style.borderColor = `${st.color}44`;
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      e.currentTarget.style.background = 'rgba(19,19,30,0.72)';
                      e.currentTarget.style.borderColor = P.border;
                    }
                  }}
                >
                  <div style={{ fontSize: 28, fontWeight: 900, color: st.color, lineHeight: 1, fontFamily: 'var(--font-display)', letterSpacing: '-0.04em' }}>{st.value}</div>
                  <div style={{ fontSize: 10, color: active ? st.color : P.muted, marginTop: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em' }}>{st.label}</div>
                  {active && (
                    <div style={{ position: 'absolute', bottom: 0, left: '20%', right: '20%', height: 2, background: st.color, borderRadius: '2px 2px 0 0', opacity: 0.7 }} />
                  )}
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
              style={{ width: '100%', height: 42, padding: '0 14px 0 42px', boxSizing: 'border-box', borderRadius: 10, border: `1px solid ${P.border}`, background: 'rgba(30,30,41,0.55)', backdropFilter: 'blur(12px)', color: P.text, fontSize: 13, outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title, location, or type…"
              onFocus={e => e.target.style.borderColor = P.blue}
              onBlur={e => e.target.style.borderColor = P.border}
            />
          </div>
          <OpalSelect
            value={statusFilter}
            onChange={v => { setStatusFilter(v); setDateFilter('all'); }}
            options={statusOptions}
            accent="violet"
            style={{ minWidth: 140 }}
          />
          <OpalSelect
            value={typeFilter}
            onChange={v => setTypeFilter(v)}
            options={typeOptions}
            accent="teal"
            style={{ minWidth: 140 }}
          />
          {hasFilters && (
            <button
              onClick={() => { setSearch(''); setStatusFilter('all'); setTypeFilter('all'); setDateFilter('all'); }}
              style={{ height: 42, padding: '0 14px', borderRadius: 10, border: `1px solid ${P.red}44`, background: P.redGlow, color: P.red, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.15s' }}
            >
              {icons.x} Clear
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ background: 'rgba(30,30,41,0.55)', border: `1px solid ${P.border}`, borderRadius: 14, padding: '20px 24px', marginBottom: 10, height: 80, animation: `skpulse 1.4s infinite ${i * 0.12}s` }} />
            ))}
          </div>
        ) : events.length === 0 ? (
          <GlassPanel style={{ textAlign: 'center', padding: '64px 20px', animation: 'cardIn 0.35s ease both' }}>
            <div style={{ color: P.muted, marginBottom: 16, display: 'flex', justifyContent: 'center', transform: 'scale(2)' }}>{icons.clipboard}</div>
            <p style={{ fontWeight: 700, color: P.text, fontSize: 17, margin: '0 0 8px', fontFamily: 'var(--font-display)' }}>No events yet</p>
            <p style={{ color: P.sub, fontSize: 14, marginBottom: 28 }}>Create your first event to get started.</p>
            <button
              onClick={() => setShowCreate(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 22px', background: `linear-gradient(135deg, ${P.blue} 0%, ${P.teal} 100%)`, color: '#0a0a0f', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {icons.plus} New Event
            </button>
          </GlassPanel>
        ) : filtered.length === 0 ? (
          <GlassPanel style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ fontWeight: 700, color: P.text, fontSize: 16, margin: '0 0 8px', fontFamily: 'var(--font-display)' }}>No events match your filters</p>
            <p style={{ color: P.sub, fontSize: 14 }}>Try adjusting your search or filters.</p>
          </GlassPanel>
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
                    background: past ? 'rgba(19,19,30,0.55)' : 'rgba(19,19,30,0.72)',
                    backdropFilter: 'blur(18px) saturate(140%)',
                    WebkitBackdropFilter: 'blur(18px) saturate(140%)',
                    border: `1px solid ${P.border}`,
                    borderLeft: `3px solid ${past ? P.muted : statusColor}`,
                    borderRadius: 14,
                    padding: '18px 20px 18px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    marginBottom: 10,
                    opacity: past ? 0.65 : 1,
                    animation: `cardIn 0.32s ease ${i * 0.06}s both`,
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                  }}
                >
                  <div
                    style={{ flex: 1, cursor: 'pointer', minWidth: 0 }}
                    onClick={() => navigate(`/organizer/events/${ev._id}/workspace`)}
                  >
                    <div style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: P.text, fontFamily: 'var(--font-display)', lineHeight: 1.2 }}>{ev.title}</span>
                      <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 800, background: statusColor + '22', color: statusColor, border: `1px solid ${statusColor}44`, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                        {ev.status || 'planning'}
                      </span>
                      {past && <span style={{ padding: '3px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: 'rgba(255,255,255,0.06)', color: P.sub, border: `1px solid ${P.border}`, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Past</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 12, color: P.sub, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ color: P.indigo, display:'flex' }}>{icons.calendar}</span>{fmtDate(ev.date)}</span>
                      {ev.startTime && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ color: P.cyan, display:'flex' }}>{icons.clock}</span>
                          {ev.startTime}{ev.endTime ? `–${ev.endTime}` : ''}
                        </span>
                      )}
                      {ev.locationSnapshot?.venueName && ev.locationSnapshot.venueName !== 'TBD' && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ color: P.teal, display:'flex' }}>{icons.mapPin}</span>{ev.locationSnapshot.venueName}</span>
                      )}
                      {ev.eventType && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ color: P.orange, display:'flex' }}>{icons.tag}</span>{fmtType(ev.eventType)}</span>
                      )}
                      {ev.expectedAttendees > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ color: P.purple, display:'flex' }}>{icons.users}</span>{ev.expectedAttendees.toLocaleString()} expected</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button
                      className="open-btn"
                      onClick={() => navigate(`/organizer/events/${ev._id}/workspace`)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 9, border: `1px solid ${P.blue}55`, background: P.blueGlow, color: P.blue, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
                    >
                      Open {icons.arrowRight}
                    </button>
                    <button
                      className="del-btn"
                      onClick={e => { e.stopPropagation(); setConfirmDelete(ev); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, border: `1px solid ${P.red}44`, background: P.redGlow, color: P.red, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
                    >
                      {icons.trash}
                    </button>
                  </div>
                </div>
              );
            })}
            <p style={{ fontSize: 13, color: P.muted, marginTop: 12 }}>Showing {filtered.length} of {events.length} events</p>
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
      <Dock items={dockItems} />
    </div>
  );
}
