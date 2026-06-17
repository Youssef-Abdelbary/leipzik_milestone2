import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEvent } from '../services/serviceEvent';

import TabGuests        from './tabs/TabGuests';
import TabOverview      from './tabs/TabOverview';
import TabDayOf         from './tabs/TabDayOf';
import TabMessages      from './tabs/TabMessages';
import TabFeedback      from './tabs/TabFeedback';
import TabVendors       from './tabs/TabVendors';
import TabTeam          from './tabs/TabTeam';
import BudgetManagement from './pageBudgetManagement';
import SettingsModal    from '../components/SettingsModal';
import Dock             from '../components/componentDock';
import AppHeader        from '../components/componentAppHeader';

import { P, icons, STATUS_COLORS, GlassPanel } from '../components/componentTheme';
import '../components/componentTheme.css';

// ─── Tab registry ─────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',  label: 'Overview',  icon: icons.overview  },
  { id: 'guests',    label: 'Guests',    icon: icons.guests    },
  { id: 'day-of',    label: 'Day-of',    icon: icons.dayof     },
  { id: 'messages',  label: 'Messages',  icon: icons.messages  },
  { id: 'feedback',  label: 'Feedback',  icon: icons.feedback  },
  { id: 'venue',     label: 'Venue',     icon: icons.building2 },
  { id: 'vendors',   label: 'Vendors',   icon: icons.vendors   },
  { id: 'budget',    label: 'Budget',    icon: icons.budget    },
  { id: 'team',      label: 'Team',      icon: icons.team      },
];

// ─── Scaled icon wrapper for the dock ────────────────────────────────────────
function DockTabIcon({ icon }) {
  return (
    <div style={{ transform: 'scale(1.25)', display: 'flex' }}>
      {icon}
    </div>
  );
}

// ─── Main workspace ───────────────────────────────────────────────────────────
export default function EventWorkspace() {
  const { eventId }  = useParams();
  const navigate     = useNavigate();
  const [event,        setEvent]       = useState(null);
  const [activeTab,    setActiveTab]   = useState('overview');
  const [visitedTabs,  setVisitedTabs] = useState(() => new Set(['overview']));
  const [loading,      setLoading]     = useState(true);
  const [error,        setError]       = useState(null);
  const [showSettings, setShowSettings]= useState(false);

  const switchTab = (tabId) => {
    if (tabId === activeTab) return;
    setActiveTab(tabId);
    setVisitedTabs(prev => new Set([...prev, tabId]));
  };

  useEffect(() => {
    getEvent(eventId)
      .then(ev => setEvent(ev))
      .catch(() => setError('Event not found or access denied.'))
      .finally(() => setLoading(false));
  }, [eventId]);

  useEffect(() => {
    const h = e => switchTab(e.detail);
    window.addEventListener('workspace-tab', h);
    return () => window.removeEventListener('workspace-tab', h);
  }, []);

  // ─── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--opal-bg)', padding: 24, fontFamily: 'var(--font-body)' }}>
      <style>{`@keyframes skpulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
      <div style={{ height: 56, background: P.surface, borderRadius: 12, marginBottom: 24, border: `1px solid ${P.border}`, animation: 'skpulse 1.4s infinite' }}/>
      <div style={{ display: 'flex', gap: 20 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ flex: 1, height: 420, background: P.surface, borderRadius: 16, border: `1px solid ${P.border}`, animation: `skpulse 1.4s infinite ${i*0.12}s` }}/>
        ))}
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--opal-bg)', fontFamily: 'var(--font-body)' }}>
      <GlassPanel style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ color: P.red, fontSize: 14, marginBottom: 20 }}>{error}</p>
        <button
          onClick={() => navigate('/organizer/events')}
          style={{ padding: '10px 24px', background: P.blue, color: '#fff', border: 'none', borderRadius: 9, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', fontSize: 14 }}
        >
          ← Back to Events
        </button>
      </GlassPanel>
    </div>
  );

  const statusColor = STATUS_COLORS[event.status] || P.muted;

  // Build dock items from TABS
  const dockItems = TABS.map(tab => ({
    icon:    <DockTabIcon icon={tab.icon} />,
    label:   tab.label,
    active:  activeTab === tab.id,
    onClick: () => switchTab(tab.id),
  }));

  return (
    <div style={{
      height:     '100vh',
      display:    'flex',
      flexDirection: 'column',
      background: 'var(--opal-bg)',
      fontFamily: 'var(--font-body)',
      color:      'var(--opal-text)',
      overflow:   'hidden',
    }}>
      <style>{`
        @keyframes tabIn   { from { opacity:0; transform:translateY(14px) scale(0.994); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes tabFade { from { opacity:0; } to { opacity:1; } }
        @keyframes skpulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        .tab-panel { animation: tabIn 0.3s cubic-bezier(0.22,1,0.36,1) forwards; }
      `}</style>

      {/* ── AppHeader — outside the scroll container so it's always visible ── */}
      <AppHeader
        back={{ label: 'Events', onClick: () => navigate('/organizer/events') }}
        crumb={event.title}
        right={
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{
              padding: '4px 12px', borderRadius: 99,
              fontSize: 11, fontWeight: 800,
              background: statusColor + '22',
              color: statusColor,
              border: `1px solid ${statusColor}44`,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
            }}>
              {event.status || 'planning'}
            </span>

            {event.date && (
              <span style={{ display:'flex', alignItems:'center', gap:5, color:P.sub, fontSize:12, whiteSpace:'nowrap' }}>
                <span style={{ color:P.indigo, display:'flex' }}>{icons.calendar}</span>
                {new Date(event.date).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
              </span>
            )}

            <button
              onClick={() => setShowSettings(true)}
              style={{ display:'flex', alignItems:'center', gap:6, background:P.blueGlow, border:`1px solid ${P.blue}55`, borderRadius:9, color:P.blue, fontSize:12, fontWeight:700, cursor:'pointer', padding:'7px 14px', fontFamily:'inherit', transition:'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = P.blue; e.currentTarget.style.color = '#0a0a12'; }}
              onMouseLeave={e => { e.currentTarget.style.background = P.blueGlow; e.currentTarget.style.color = P.blue; }}
            >
              {icons.settings} Settings
            </button>
          </div>
        }
      />

      {/* ── Tab panels — scrollable area between header and dock ──────────── */}
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', paddingBottom: 130 }}>
        <div style={{ minHeight: 'calc(100vh - 54px - 130px)' }}>
          {visitedTabs.has('overview') && (
            <div style={{ display: activeTab === 'overview' ? 'block' : 'none' }} className={activeTab === 'overview' ? 'tab-panel' : ''}>
              <TabOverview event={event} onEventUpdate={setEvent} />
            </div>
          )}
          {visitedTabs.has('guests') && (
            <div style={{ display: activeTab === 'guests' ? 'block' : 'none' }} className={activeTab === 'guests' ? 'tab-panel' : ''}>
              <TabGuests eventId={eventId} />
            </div>
          )}
          {visitedTabs.has('day-of') && (
            <div style={{ display: activeTab === 'day-of' ? 'block' : 'none' }} className={activeTab === 'day-of' ? 'tab-panel' : ''}>
              <TabDayOf eventId={eventId} event={event} />
            </div>
          )}
          {visitedTabs.has('messages') && (
            <div style={{ display: activeTab === 'messages' ? 'block' : 'none' }} className={activeTab === 'messages' ? 'tab-panel' : ''}>
              <TabMessages eventId={eventId} />
            </div>
          )}
          {visitedTabs.has('feedback') && (
            <div style={{ display: activeTab === 'feedback' ? 'block' : 'none' }} className={activeTab === 'feedback' ? 'tab-panel' : ''}>
              <TabFeedback eventId={eventId} event={event} />
            </div>
          )}
          {visitedTabs.has('budget') && (
            <div style={{ display: activeTab === 'budget' ? 'block' : 'none' }} className={activeTab === 'budget' ? 'tab-panel' : ''}>
              <BudgetManagement eventId={eventId} />
            </div>
          )}
          {visitedTabs.has('vendors') && (
            <div style={{ display: activeTab === 'vendors' ? 'block' : 'none' }} className={activeTab === 'vendors' ? 'tab-panel' : ''}>
              <TabVendors eventId={eventId} organizerId={event?.organizerId} />
            </div>
          )}
          {visitedTabs.has('team') && (
            <div style={{ display: activeTab === 'team' ? 'block' : 'none' }} className={activeTab === 'team' ? 'tab-panel' : ''}>
              <TabTeam eventId={eventId} />
            </div>
          )}
          {!['overview','guests','day-of','messages','feedback','budget','vendors','team'].includes(activeTab) && (
            <div className="tab-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, flexDirection: 'column', gap: 12 }}>
              <div style={{ color: P.muted, display: 'flex', transform: 'scale(1.8)', marginBottom: 4 }}>{icons.wrench}</div>
              <p style={{ color: P.sub, fontSize: 14, margin: 0 }}>
                {TABS.find(t => t.id === activeTab)?.label} — coming soon
              </p>
            </div>
          )}
        </div>
      </div>{/* end scrollable area */}

      {/* ── Dock (componentDock) ──────────────────────────────────────────── */}
      <Dock items={dockItems} />

      {/* ── Settings modal ────────────────────────────────────────────────── */}
      {showSettings && (
        <SettingsModal
          event={event}
          onSave={setEvent}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
