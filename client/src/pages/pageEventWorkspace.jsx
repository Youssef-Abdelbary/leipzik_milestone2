import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEvent } from '../services/serviceEvent';
import TabGuests from './tabs/TabGuests';

const TABS = [
  { id: 'overview', label: '📋 Overview' },
  { id: 'venue',    label: '🏛 Venue'    },
  { id: 'vendors',  label: '🛒 Vendors'  },
  { id: 'budget',   label: '💰 Budget'   },
  { id: 'team',     label: '👥 Team'     },
  { id: 'guests',   label: '🎟 Guests'   },
  { id: 'day-of',   label: '📅 Day-of'   },
];

const STATUS_TEXT_COLORS = {
  draft: '#94A3B8', planning: '#818CF8', confirmed: '#4ADE80',
  completed: '#64748B', cancelled: '#F87171',
};

export default function EventWorkspace() {
  const { eventId } = useParams();
  const navigate    = useNavigate();
  const [event, setEvent]       = useState(null);
  const [activeTab, setActiveTab] = useState('guests');
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    getEvent(eventId)
      .then(setEvent)
      .catch(() => setError('Event not found or access denied.'))
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', fontFamily: 'system-ui, sans-serif' }}>
      <p style={{ color: '#94A3B8' }}>Loading workspace...</p>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#991B1B', fontSize: 15, marginBottom: 16 }}>{error}</p>
        <button onClick={() => navigate('/events')} style={{ padding: '8px 20px', background: '#0F172A', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
          ← Back to Events
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Top nav */}
      <div style={{ background: '#0F172A', padding: '0 32px', display: 'flex', alignItems: 'center', height: 60, gap: 8 }}>
        <button
          onClick={() => navigate('/events')}
          style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: 13, padding: '4px 8px', borderRadius: 4, fontFamily: 'inherit' }}
        >
          ← Events
        </button>
        <span style={{ color: '#334155', fontSize: 13 }}>/</span>
        <span style={{ color: '#F8FAFC', fontSize: 14, fontWeight: 600 }}>{event.title}</span>
        <span style={{
          marginLeft: 8, padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
          background: '#1E293B', color: STATUS_TEXT_COLORS[event.status] || '#94A3B8',
          letterSpacing: '0.05em',
        }}>
          {event.status?.toUpperCase()}
        </span>
        {event.date && (
          <span style={{ marginLeft: 'auto', color: '#64748B', fontSize: 12 }}>
            📅 {new Date(event.date).toDateString()}
          </span>
        )}
      </div>

      {/* Tab bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '0 32px', display: 'flex', overflowX: 'auto' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '14px 18px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', fontFamily: 'inherit',
              color: activeTab === tab.id ? '#0F172A' : '#64748B',
              borderBottom: activeTab === tab.id ? '2px solid #0F172A' : '2px solid transparent',
              transition: 'all 0.12s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'guests' ? (
        <TabGuests eventId={eventId} />
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>🚧</p>
            <p style={{ color: '#94A3B8', fontSize: 15 }}>
              {TABS.find(t => t.id === activeTab)?.label.replace(/^\S+\s/, '')} — coming soon
            </p>
          </div>
        </div>
      )}
    </div>
  );
}