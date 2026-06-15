import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEvent } from '../services/serviceEvent';

// Sub-components & Tabs
import TabGuests        from './tabs/TabGuests';
import TabOverview      from './tabs/TabOverview';
import TabDayOf         from './tabs/TabDayOf';
import TabMessages      from './tabs/TabMessages';
import TabFeedback      from './tabs/TabFeedback';
import BudgetManagement from "./pageBudgetManagement";
import SettingsModal    from '../components/SettingsModal';

// Shared Theme & Assets
import { P, icons, STATUS_COLORS } from '../utils/theme';

const TABS = [
  { id: 'overview',  label: 'Overview',  icon: icons.overview  },
  { id: 'guests',    label: 'Guests',    icon: icons.guests    },
  { id: 'day-of',    label: 'Day-of',    icon: icons.dayof     },
  { id: 'messages',  label: 'Messages',  icon: icons.messages  },
  { id: 'feedback',  label: 'Feedback',  icon: icons.feedback  },
  { id: 'venue',     label: 'Venue',     icon: icons.venue     },
  { id: 'vendors',   label: 'Vendors',   icon: icons.vendors   },
  { id: 'budget',    label: 'Budget',    icon: icons.budget    },
  { id: 'team',      label: 'Team',      icon: icons.team      },
];

// ─── Dock Tab Button ──────────────────────────────────────────────────────────
function DockTab({ tab, isActive, onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Tooltip (Hidden on mobile via CSS) */}
      <div className="dock-tooltip" style={{
        position: 'absolute',
        bottom: '100%',
        left: '50%',
        transform: `translateX(-50%) translateY(${hovered ? '-12px' : '0px'})`,
        background: '#21262d',
        color: P.text,
        fontSize: 12,
        fontWeight: 600,
        padding: '6px 12px',
        borderRadius: 8,
        border: `1px solid ${P.border}`,
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        opacity: hovered ? 1 : 0,
        transition: 'opacity 0.2s ease, transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        marginBottom: 8,
        letterSpacing: '0.02em',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        zIndex: 10,
      }}>
        {tab.label}
      </div>

      <button
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        title={tab.label}
        style={{
          width: 56, 
          height: 56, 
          borderRadius: 16,
          border: 'none',
          background: isActive
            ? 'rgba(68,147,248,0.15)'
            : hovered
              ? 'rgba(255,255,255,0.08)'
              : 'transparent',
          color: isActive ? P.blue : hovered ? P.text : P.sub,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
          transform: hovered ? 'scale(1.15) translateY(-6px)' : isActive ? 'scale(1.05) translateY(-2px)' : 'scale(1)',
          boxShadow: isActive ? `0 0 0 1px rgba(68,147,248,0.3), 0 0 16px rgba(68,147,248,0.15)` : hovered ? '0 8px 16px rgba(0,0,0,0.2)' : 'none',
          outline: 'none',
        }}
      >
        <div style={{ transform: 'scale(1.15)', display: 'flex' }}>
          {tab.icon}
        </div>
      </button>

      {/* Active dot */}
      <div style={{
        position: 'absolute',
        bottom: -10,
        width: 5,
        height: 5,
        borderRadius: '50%',
        background: isActive ? P.blue : 'transparent',
        transition: 'background 0.3s ease, transform 0.3s ease',
        transform: isActive ? 'scale(1)' : 'scale(0)',
      }} />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function EventWorkspace() {
  const { eventId }  = useParams();
  const navigate     = useNavigate();
  const [event, setEvent]               = useState(null);
  const [activeTab, setActiveTab]       = useState('overview');
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    getEvent(eventId)
      .then(ev => setEvent(ev))
      .catch(() => setError('Event not found or access denied.'))
      .finally(() => setLoading(false));
  }, [eventId]);

  useEffect(() => {
    const handler = (e) => setActiveTab(e.detail);
    window.addEventListener('workspace-tab', handler);
    return () => window.removeEventListener('workspace-tab', handler);
  }, []);

  // Skeleton Loader Implementation (Much faster perceived performance)
  if (loading) return (
    <div style={{ minHeight: '100vh', background: P.bg, padding: 24 }}>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
      <div style={{ height: 60, background: P.surface, borderRadius: 12, animation: 'pulse 1.5s infinite', marginBottom: 32 }} />
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 60%', height: 400, background: P.surface, borderRadius: 16, animation: 'pulse 1.5s infinite 0.2s' }} />
        <div style={{ flex: '1 1 30%', height: 400, background: P.surface, borderRadius: 16, animation: 'pulse 1.5s infinite 0.4s' }} />
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: P.bg, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: P.red, fontSize: 14, marginBottom: 16 }}>{error}</p>
        <button onClick={() => navigate('/organizer/events')} style={{ padding: '8px 20px', background: P.blue, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>
          ← Back to Events
        </button>
      </div>
    </div>
  );

  const statusColor = STATUS_COLORS[event.status] || P.sub;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: P.bg, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif", color: P.text, overflow: 'hidden' }}>
      
      {/* Universal Component Styles */}
      <style>{`
        @keyframes tabFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        /* Mobile Scrollable Dock Configuration */
        @media (max-width: 768px) {
          .dock-container {
            overflow-x: auto;
            justify-content: flex-start !important;
            padding-bottom: 8px; 
            border-radius: 12px !important;
          }
          .dock-tooltip { display: none !important; }
        }
        
        /* Scrollbar Hiding for sleek dock */
        .dock-container::-webkit-scrollbar { display: none; }
        .dock-container { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Main Content Area (Scrolls UNDER the Top Bar to activate Glassmorphism) */}
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', paddingBottom: 140 }}>
        
        {/* Top Bar with Glassmorphism (Positioned Sticky inside scroll area) */}
        <div style={{ 
          position: 'sticky', top: 0, zIndex: 50, 
          background: 'rgba(22, 27, 34, 0.75)', 
          backdropFilter: 'blur(16px)', 
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: `1px solid ${P.border}`, 
          padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10 
        }}>
          <button
            onClick={() => navigate('/organizer/events')}
            style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: P.sub, cursor: 'pointer', fontSize: 13, padding: '4px 8px', borderRadius: 6, fontFamily: 'inherit', transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = P.text}
            onMouseLeave={e => e.currentTarget.style.color = P.sub}
          >
            {icons.back}
            Events
          </button>
          <span style={{ color: P.muted, fontSize: 13 }}>/</span>
          <span style={{ color: P.text, fontSize: 15, fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {event.title}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: statusColor + '20', color: statusColor, border: `1px solid ${statusColor}40`, letterSpacing: '0.05em' }}>
              {event.status?.toUpperCase() || 'PLANNING'}
            </span>
            {event.date && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: P.sub, fontSize: 12, marginLeft: 8 }}>
                {icons.calendar} {new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            )}
            <button
              onClick={() => setShowSettings(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.06)', border: `1px solid ${P.border}`, borderRadius: 8, color: P.sub, fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '6px 12px', fontFamily: 'inherit', transition: 'all 0.15s', marginLeft: 8 }}
              onMouseEnter={e => { e.currentTarget.style.color = P.text; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = P.sub; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            >
              {icons.settings} Settings
            </button>
          </div>
        </div>

        {/* Tab content wrapped with Fade In transition */}
        <div>
          <div style={{ display: activeTab === 'overview' ? 'block' : 'none', animation: 'tabFadeIn 0.35s ease forwards' }}>
            <TabOverview event={event} onEventUpdate={setEvent} />
          </div>
          <div style={{ display: activeTab === 'guests' ? 'block' : 'none', animation: 'tabFadeIn 0.35s ease forwards' }}>
            <TabGuests eventId={eventId} />
          </div>
          <div style={{ display: activeTab === 'day-of' ? 'block' : 'none', animation: 'tabFadeIn 0.35s ease forwards' }}>
            <TabDayOf eventId={eventId} event={event} />
          </div>
          <div style={{ display: activeTab === 'messages' ? 'block' : 'none', animation: 'tabFadeIn 0.35s ease forwards' }}>
            <TabMessages eventId={eventId} />
          </div>
          <div style={{ display: activeTab === 'feedback' ? 'block' : 'none', animation: 'tabFadeIn 0.35s ease forwards' }}>
            <TabFeedback eventId={eventId} event={event} />
          </div>
          {activeTab === 'budget' && (
            <div style={{ animation: 'tabFadeIn 0.35s ease forwards' }}>
               <BudgetManagement />
            </div>
          )}
          {!['overview', 'guests', 'day-of', 'messages', 'budget', 'feedback'].includes(activeTab) && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, flexDirection: 'column', gap: 12, animation: 'tabFadeIn 0.3s ease' }}>
              <p style={{ fontSize: 36, margin: 0 }}>🚧</p>
              <p style={{ color: P.sub, fontSize: 14 }}>{TABS.find(t => t.id === activeTab)?.label} — coming soon</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating macOS Dock Nav with class "dock-container" for mobile queries */}
      <div style={{ 
        position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 100,
        maxWidth: '95vw' // Ensures dock never breaks viewport width on mobile
      }}>
        <div className="dock-container" style={{ 
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 12, 
          background: 'rgba(22, 27, 34, 0.75)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          border: `1px solid ${P.border}`, borderRadius: 24, padding: '12px 20px', 
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)' 
        }}>
          {TABS.map(tab => (
            <DockTab
              key={tab.id}
              tab={tab}
              isActive={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </div>
      </div>

      {/* Settings Modal Extracted Component */}
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