import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEvent } from '../services/serviceEvent';

import TabGuests        from './tabs/TabGuests';
import TabOverview      from './tabs/TabOverview';
import TabDayOf         from './tabs/TabDayOf';
import TabMessages      from './tabs/TabMessages';
import TabFeedback      from './tabs/TabFeedback';
import BudgetManagement from './pageBudgetManagement';
import SettingsModal    from '../components/SettingsModal';

import { P, icons, STATUS_COLORS } from '../utils/theme';

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

// Dock groups with separators between them
const DOCK_GROUPS = [
  ['overview', 'guests', 'day-of'],
  ['messages', 'feedback'],
  ['venue', 'vendors', 'budget', 'team'],
];

// ─── Single dock button ───────────────────────────────────────────────────────
function DockBtn({ tab, isActive, onClick }) {
  const [hov, setHov] = useState(false);

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Tooltip */}
      <div
        aria-hidden="true"
        style={{
          position:    'absolute',
          bottom:      'calc(100% + 14px)',
          left:        '50%',
          transform:   `translateX(-50%) translateY(${hov ? '0' : '6px'})`,
          pointerEvents: 'none',
          opacity:     hov ? 1 : 0,
          transition:  'opacity 0.18s ease, transform 0.18s ease',
          // Card
          background:  P.panel,
          border:      `1px solid ${P.border}`,
          borderRadius: 8,
          padding:     '5px 10px',
          fontSize:    12,
          fontWeight:  600,
          color:       P.text,
          letterSpacing: '0.01em',
          whiteSpace:  'nowrap',
          boxShadow:   '0 8px 24px rgba(0,0,0,0.5)',
          zIndex:      20,
        }}
      >
        {tab.label}
        {/* Arrow */}
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft:  '5px solid transparent',
          borderRight: '5px solid transparent',
          borderTop:   `5px solid ${P.border}`,
        }} />
      </div>

      {/* Icon button */}
      <button
        onClick={onClick}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        title={tab.label}
        aria-label={tab.label}
        aria-pressed={isActive}
        style={{
          width:      52,
          height:     52,
          borderRadius: 14,
          border:     'none',
          cursor:     'pointer',
          display:    'flex',
          alignItems: 'center',
          justifyContent: 'center',
          // Color & depth
          background: isActive
            ? `rgba(91,156,246,0.14)`
            : hov
              ? 'rgba(255,255,255,0.07)'
              : 'transparent',
          color: isActive ? P.blue : hov ? P.text : P.sub,
          // Motion
          transition: 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
          transform:  hov ? 'scale(1.18) translateY(-5px)' : isActive ? 'scale(1.06) translateY(-2px)' : 'scale(1)',
          // Glow ring on active
          boxShadow: isActive
            ? `0 0 0 1px rgba(91,156,246,0.35), 0 0 18px rgba(91,156,246,0.18)`
            : hov
              ? '0 6px 18px rgba(0,0,0,0.3)'
              : 'none',
          outline: 'none',
        }}
      >
        <div style={{ transform: 'scale(1.1)', display: 'flex' }}>
          {tab.icon}
        </div>
      </button>

      {/* Active dot */}
      <div style={{
        position:   'absolute',
        bottom:     -9,
        width:      4,
        height:     4,
        borderRadius: '50%',
        background: P.blue,
        opacity:    isActive ? 1 : 0,
        transform:  isActive ? 'scale(1)' : 'scale(0)',
        transition: 'all 0.2s ease',
      }} />
    </div>
  );
}

// ─── Dock separator ───────────────────────────────────────────────────────────
function DockSep() {
  return (
    <div style={{
      width:      1,
      height:     28,
      background: P.border,
      borderRadius: 1,
      flexShrink: 0,
      margin:     '0 2px',
      alignSelf:  'center',
    }} />
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
    setActiveTab(tabId);
    setVisitedTabs(prev => new Set([...prev, tabId]));
  };

  useEffect(() => {
    getEvent(eventId)
      .then(ev => setEvent(ev))
      .catch(() => setError('Event not found or access denied.'))
      .finally(() => setLoading(false));
  }, [eventId]);

  // Let child tabs navigate the dock (e.g. Overview tile clicks)
  useEffect(() => {
    const h = e => switchTab(e.detail);
    window.addEventListener('workspace-tab', h);
    return () => window.removeEventListener('workspace-tab', h);
  }, []);

  // ─── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', background: P.bg, padding: 24, fontFamily: 'system-ui,sans-serif' }}>
      <style>{`@keyframes skpulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
      <div style={{ height: 56, background: P.surface, borderRadius: 10, marginBottom: 24, border:`1px solid ${P.border}`, animation:'skpulse 1.4s infinite' }}/>
      <div style={{ display:'flex', gap:20 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ flex:1, height:420, background:P.surface, borderRadius:14, border:`1px solid ${P.border}`, animation:`skpulse 1.4s infinite ${i*0.12}s` }}/>
        ))}
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:P.bg, fontFamily:'system-ui,sans-serif' }}>
      <div style={{ textAlign:'center', padding: 40 }}>
        <p style={{ color:P.red, fontSize:14, marginBottom:20 }}>{error}</p>
        <button
          onClick={() => navigate('/organizer/events')}
          style={{ padding:'10px 24px', background:P.blue, color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontFamily:'inherit', fontSize:14 }}
        >
          ← Back to Events
        </button>
      </div>
    </div>
  );

  const statusColor = STATUS_COLORS[event.status] || P.muted;

  return (
    <div style={{
      minHeight:  '100vh',
      display:    'flex',
      flexDirection: 'column',
      background: P.bg,
      fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif",
      color:      P.text,
      overflow:   'hidden',
    }}>
      <style>{`
        @keyframes tabIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .tab-panel { animation: tabIn 0.28s ease forwards; }
        /* Mobile: dock scrolls horizontally */
        @media (max-width: 720px) {
          .dock-row { overflow-x: auto; justify-content: flex-start !important; border-radius: 16px !important; padding: 10px 14px !important; }
          .dock-tooltip { display: none !important; }
        }
        .dock-row::-webkit-scrollbar { display: none; }
        .dock-row { -ms-overflow-style:none; scrollbar-width:none; }
      `}</style>

      {/* Scrollable content sits behind sticky header */}
      <div style={{ flex:1, overflowY:'auto', position:'relative', paddingBottom:130 }}>

        {/* ── Topbar ──────────────────────────────────────────────────────────── */}
        <div style={{
          position:   'sticky', top:0, zIndex:50,
          background: 'rgba(17,17,17,0.82)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${P.border}`,
          padding:    '0 20px',
          height:     54,
          display:    'flex',
          alignItems: 'center',
          gap:        10,
        }}>
          {/* Back */}
          <button
            onClick={() => navigate('/organizer/events')}
            style={{ display:'flex', alignItems:'center', gap:4, background:'none', border:'none', color:P.sub, cursor:'pointer', fontSize:13, padding:'4px 8px', borderRadius:6, fontFamily:'inherit', transition:'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = P.text}
            onMouseLeave={e => e.currentTarget.style.color = P.sub}
          >
            {icons.back}
            Events
          </button>
          <span style={{ color:P.muted, fontSize:14, userSelect:'none' }}>/</span>

          {/* Event title */}
          <span style={{ fontSize:14, fontWeight:600, color:P.text, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', minWidth:0 }}>
            {event.title}
          </span>

          {/* Status badge */}
          <span style={{
            padding:    '3px 10px',
            borderRadius: 99,
            fontSize:   11, fontWeight:700,
            background: statusColor + '1a',
            color:      statusColor,
            border:     `1px solid ${statusColor}33`,
            letterSpacing: '0.05em',
            flexShrink: 0,
          }}>
            {(event.status || 'planning').toUpperCase()}
          </span>

          {/* Date */}
          {event.date && (
            <span style={{ display:'flex', alignItems:'center', gap:5, color:P.muted, fontSize:12, flexShrink:0, marginLeft:4 }}>
              {icons.calendar}
              {new Date(event.date).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
            </span>
          )}

          {/* Settings */}
          <button
            onClick={() => setShowSettings(true)}
            style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.05)', border:`1px solid ${P.border}`, borderRadius:8, color:P.sub, fontSize:12, fontWeight:600, cursor:'pointer', padding:'6px 12px', fontFamily:'inherit', transition:'all 0.15s', marginLeft:8, flexShrink:0 }}
            onMouseEnter={e => { e.currentTarget.style.color = P.text; e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = P.sub;  e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
          >
            {icons.settings}
            Settings
          </button>
        </div>

        {/* ── Tab panels — keep-alive: mount on first visit, hide with CSS ─── */}
        <div style={{ minHeight: 'calc(100vh - 54px - 130px)' }}>
          {visitedTabs.has('overview') && (
            <div className={activeTab === 'overview' ? 'tab-panel' : ''} style={{ display: activeTab === 'overview' ? 'block' : 'none' }}>
              <TabOverview event={event} onEventUpdate={setEvent} />
            </div>
          )}
          {visitedTabs.has('guests') && (
            <div style={{ display: activeTab === 'guests' ? 'block' : 'none' }}>
              <TabGuests eventId={eventId} />
            </div>
          )}
          {visitedTabs.has('day-of') && (
            <div style={{ display: activeTab === 'day-of' ? 'block' : 'none' }}>
              <TabDayOf eventId={eventId} event={event} />
            </div>
          )}
          {visitedTabs.has('messages') && (
            <div style={{ display: activeTab === 'messages' ? 'block' : 'none' }}>
              <TabMessages eventId={eventId} />
            </div>
          )}
          {visitedTabs.has('feedback') && (
            <div style={{ display: activeTab === 'feedback' ? 'block' : 'none' }}>
              <TabFeedback eventId={eventId} event={event} />
            </div>
          )}
          {visitedTabs.has('budget') && (
            <div style={{ display: activeTab === 'budget' ? 'block' : 'none' }}>
              <BudgetManagement />
            </div>
          )}
          {!['overview','guests','day-of','messages','feedback','budget'].includes(activeTab) && (
            <div className="tab-panel" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:400, flexDirection:'column', gap:12 }}>
              <div style={{ color:P.muted, display:'flex', transform:'scale(1.8)', marginBottom:4 }}>{icons.wrench}</div>
              <p style={{ color:P.sub, fontSize:14, margin:0 }}>
                {TABS.find(t => t.id === activeTab)?.label} — coming soon
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── macOS-style floating dock ────────────────────────────────────────── */}
      <div style={{
        position:  'fixed',
        bottom:    22,
        left:      '50%',
        transform: 'translateX(-50%)',
        zIndex:    100,
        maxWidth:  '95vw',
      }}>
        <div
          className="dock-row"
          style={{
            display:    'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            gap:        6,
            background: 'rgba(17,17,17,0.78)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border:     `1px solid ${P.border}`,
            borderRadius: 22,
            padding:    '10px 16px',
            boxShadow:  '0 16px 48px rgba(0,0,0,0.55), 0 0 0 0.5px rgba(255,255,255,0.04) inset',
          }}
        >
          {DOCK_GROUPS.map((group, gi) => (
            <div key={gi} style={{ display:'flex', alignItems:'flex-end', gap:6 }}>
              {gi > 0 && <DockSep />}
              {group.map(tabId => {
                const tab = TABS.find(t => t.id === tabId);
                if (!tab) return null;
                return (
                  <DockBtn
                    key={tabId}
                    tab={tab}
                    isActive={activeTab === tabId}
                    onClick={() => switchTab(tabId)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ── Settings modal ───────────────────────────────────────────────────── */}
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