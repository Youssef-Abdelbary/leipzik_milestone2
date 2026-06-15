import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEvent, updateEvent } from '../services/serviceEvent';
import TabGuests   from './tabs/TabGuests';
import TabOverview from './tabs/TabOverview';
import TabDayOf    from './tabs/TabDayOf';
import TabMessages from './tabs/TabMessages';
import TabVendors from './tabs/TabVendors';
import { EVENT_TYPES } from '../utils/constants';
import BudgetManagement from "./pageBudgetManagement";
import TabFeedback from './tabs/TabFeedback';

const TABS = [
  { id: 'overview',  label: '📋 Overview'  },
  { id: 'guests',    label: '🎟 Guests'    },
  { id: 'day-of',   label: '📅 Day-of'    },
  { id: 'messages',  label: '💬 Messages'  },
  { id: 'feedback',  label: '⭐ Feedback'  },  // ← NEW
  { id: 'venue',     label: '🏛 Venue'     },
  { id: 'vendors',   label: '🛒 Vendors'   },
  { id: 'budget',    label: '💰 Budget'    },
  { id: 'team',      label: '👥 Team'      },
];

const STATUS_COLORS = {
  draft:     '#94A3B8',
  planning:  '#818CF8',
  confirmed: '#4ADE80',
  completed: '#64748B',
  cancelled: '#F87171',
};

const STATUS_OPTIONS = ['planning', 'confirmed', 'completed', 'cancelled'];

export default function EventWorkspace() {
  const { eventId }  = useParams();
  const navigate     = useNavigate();
  const [event, setEvent]         = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({});
  const [saving, setSaving]             = useState(false);
  const [saveError, setSaveError]       = useState(null);

  useEffect(() => {
    getEvent(eventId)
      .then(ev => { setEvent(ev); })
      .catch(() => setError('Event not found or access denied.'))
      .finally(() => setLoading(false));
  }, [eventId]);

  useEffect(() => {
    const handler = (e) => setActiveTab(e.detail);
    window.addEventListener('workspace-tab', handler);
    return () => window.removeEventListener('workspace-tab', handler);
  }, []);

  const openSettings = () => {
    setSettingsForm({
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
    setShowSettings(true);
  };

  const handleSettingsSave = async () => {
    setSaveError(null);
    if (!settingsForm.title?.trim()) { setSaveError('Title is required'); return; }
    setSaving(true);
    try {
      const updated = await updateEvent(eventId, settingsForm);
      setEvent(updated);
      setShowSettings(false);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const setF = (k, v) => setSettingsForm(p => ({ ...p, [k]: v }));

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', fontFamily: 'system-ui, sans-serif' }}>
      <p style={{ color: '#94A3B8' }}>Loading workspace…</p>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#991B1B', fontSize: 15, marginBottom: 16 }}>{error}</p>
        <button onClick={() => navigate('/organizer/events')} style={{ padding: '8px 20px', background: '#0F172A', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>← Back to Events</button>
      </div>
    </div>
  );

  const inp  = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', color: '#0F172A' };
  const flbl = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ background: '#0F172A', padding: '0 24px', display: 'flex', alignItems: 'center', height: 60, gap: 8 }}>
        <button onClick={() => navigate('/organizer/events')} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: 13, padding: '4px 8px', borderRadius: 4, fontFamily: 'inherit' }}>← Events</button>
        <span style={{ color: '#334155', fontSize: 13 }}>/</span>
        <span style={{ color: '#F8FAFC', fontSize: 14, fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.title}</span>
        <span style={{ padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: '#1E293B', color: STATUS_COLORS[event.status] || '#94A3B8', letterSpacing: '0.05em', flexShrink: 0 }}>
          {event.status?.toUpperCase() || 'PLANNING'}
        </span>
        {event.date && <span style={{ color: '#64748B', fontSize: 12, flexShrink: 0 }}>📅 {new Date(event.date).toDateString()}</span>}
        <button onClick={openSettings}
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#F8FAFC', fontSize: 14, cursor: 'pointer', padding: '6px 12px', fontFamily: 'inherit', fontWeight: 500, flexShrink: 0 }}
          onMouseEnter={e => Object.assign(e.currentTarget.style, { background: 'rgba(255,255,255,0.15)' })}
          onMouseLeave={e => Object.assign(e.currentTarget.style, { background: 'rgba(255,255,255,0.08)' })}>
          ⚙ Settings
        </button>
      </div>

      <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '0 24px', display: 'flex', overflowX: 'auto', flexShrink: 0 }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '14px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', fontFamily: 'inherit', color: activeTab === tab.id ? '#0F172A' : '#64748B', borderBottom: activeTab === tab.id ? '2px solid #0F172A' : '2px solid transparent', transition: 'all 0.12s' }}>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ display: activeTab === 'overview' ? 'block' : 'none' }}>
          <TabOverview event={event} onEventUpdate={setEvent} />
        </div>
        
        <div style={{ display: activeTab === 'guests' ? 'block' : 'none' }}>
          <TabGuests eventId={eventId} />
        </div>
        
        <div style={{ display: activeTab === 'day-of' ? 'block' : 'none' }}>
          <TabDayOf eventId={eventId} event={event} />
        </div>
        
        <div style={{ display: activeTab === 'messages' ? 'block' : 'none' }}>
          <TabMessages eventId={eventId} />
        </div>

        <div style={{ display: activeTab === 'vendors' ? 'block' : 'none' }}>
          <TabVendors eventId={eventId} organizerId={event.organizerId?._id || event.organizerId} />
        </div>

        {!['overview', 'guests', 'day-of', 'messages', 'vendors'].includes(activeTab) && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 36, marginBottom: 10 }}>🚧</p>
              <p style={{ color: '#94A3B8', fontSize: 15 }}>{TABS.find(t => t.id === activeTab)?.label?.replace(/^\S+\s/, '')} — coming soon</p>
              {TABS.find(t => t.id === activeTab)?.label?.replace(/^\S+\s/, '')} — coming soon            
            </div>
          </div>
        )}
      </div>

      {showSettings && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(2px)', padding: 20, overflowY: 'auto' }} onClick={() => setShowSettings(false)}>
          <div style={{ background: '#fff', borderRadius: 14, padding: '32px 36px', width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(15,23,42,0.18)' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 24px', fontSize: 19, fontWeight: 700, color: '#0F172A' }}>⚙ Event Settings</h2>
            {saveError && <div style={{ background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 14 }}>{saveError}</div>}

            <div style={{ marginBottom: 14 }}><label style={flbl}>Event Title *</label><input style={inp} value={settingsForm.title} onChange={e => setF('title', e.target.value)} /></div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
              <div style={{ flex: 1 }}><label style={flbl}>Event Type</label><select style={inp} value={settingsForm.eventType} onChange={e => setF('eventType', e.target.value)}><option value="">Select…</option>{EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
              <div style={{ flex: 1 }}><label style={flbl}>Status</label><select style={inp} value={settingsForm.status} onChange={e => setF('status', e.target.value)}>{STATUS_OPTIONS.map(st => <option key={st} value={st}>{st.charAt(0).toUpperCase() + st.slice(1)}</option>)}</select></div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
              <div style={{ flex: 1 }}><label style={flbl}>Date</label><input style={inp} type="date" value={settingsForm.date} onChange={e => setF('date', e.target.value)} /></div>
              <div style={{ flex: 1 }}><label style={flbl}>Expected Attendees</label><input style={inp} type="number" min="0" value={settingsForm.expectedAttendees} onChange={e => setF('expectedAttendees', e.target.value)} /></div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
              <div style={{ flex: 1 }}><label style={flbl}>Start Time</label><input style={inp} type="time" value={settingsForm.startTime} onChange={e => setF('startTime', e.target.value)} /></div>
              <div style={{ flex: 1 }}><label style={flbl}>End Time</label><input style={inp} type="time" value={settingsForm.endTime} onChange={e => setF('endTime', e.target.value)} /></div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
              <div style={{ flex: 1 }}><label style={flbl}>Venue / Location</label><input style={inp} value={settingsForm.location} onChange={e => setF('location', e.target.value)} placeholder="e.g. The Garden Hall" /></div>
              <div style={{ flex: 1 }}><label style={flbl}>Dress Code</label><input style={inp} value={settingsForm.dressCode} onChange={e => setF('dressCode', e.target.value)} placeholder="e.g. Smart casual" /></div>
            </div>

            <div style={{ marginBottom: 14 }}><label style={flbl}>Description</label><textarea style={{ ...inp, minHeight: 80, resize: 'vertical' }} value={settingsForm.description} onChange={e => setF('description', e.target.value)} /></div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowSettings(false)} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', color: '#374151', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={handleSettingsSave} disabled={saving} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: saving ? '#94A3B8' : '#0F172A', color: '#fff', fontWeight: 600, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{saving ? 'Saving…' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}