import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listEvents, createEvent } from '../services/serviceEvent';

const STATUS_COLORS = {
  draft:     { bg: '#F1F5F9', text: '#64748B' },
  planning:  { bg: '#EEF2FF', text: '#4338CA' },
  confirmed: { bg: '#F0FDF4', text: '#166534' },
  completed: { bg: '#F8FAFC', text: '#94A3B8' },
  cancelled: { bg: '#FEF2F2', text: '#991B1B' },
};

const emptyForm = { title: '', description: '', date: '', location: '' };

export default function Events() {
  const navigate = useNavigate();
  const [events, setEvents]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]         = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [error, setError]       = useState(null);

  useEffect(() => {
    listEvents()
      .then(setEvents)
      .catch(() => setError('Failed to load events. Make sure you are logged in as an organizer.'))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    setCreating(true);
    try {
      const event = await createEvent(form);
      setEvents(prev => [event, ...prev]);
      setShowModal(false);
      setForm(emptyForm);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Navbar */}
      <div style={{ background: '#0F172A', padding: '0 32px', display: 'flex', alignItems: 'center', height: 60, gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: 14 }}>⚙</span>
          </div>
          <span style={{ color: '#F8FAFC', fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>PopEyez</span>
        </div>
        <span style={{ color: '#475569', fontSize: 13 }}>/ Events</span>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '36px 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em' }}>My Events</h1>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: '#64748B' }}>Plan and manage your pop-up events.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{ padding: '10px 20px', background: '#0F172A', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            + New Event
          </button>
        </div>

        {error && (
          <div style={{ background: '#FEF2F2', color: '#991B1B', padding: '10px 16px', borderRadius: 8, marginBottom: 20, fontSize: 13, border: '1px solid #FECACA' }}>
            {error}
          </div>
        )}

        {loading ? (
          <p style={{ color: '#94A3B8', textAlign: 'center', padding: 60, fontSize: 14 }}>Loading events...</p>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80, background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0' }}>
            <p style={{ color: '#94A3B8', fontSize: 15 }}>No events yet. Create your first event to get started!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {events.map(ev => {
              const sc = STATUS_COLORS[ev.status] || STATUS_COLORS.draft;
              return (
                <div
                  key={ev._id}
                  onClick={() => navigate(`/events/${ev._id}/workspace`)}
                  style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '20px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'box-shadow 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(15,23,42,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                >
                  <div>
                    <h2 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700, color: '#0F172A' }}>{ev.title}</h2>
                    <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>
                      {ev.date ? new Date(ev.date).toDateString() : 'No date set'}
                      {ev.location ? ` · ${ev.location}` : ''}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: sc.bg, color: sc.text }}>
                      {ev.status}
                    </span>
                    <span style={{ color: '#94A3B8', fontSize: 20 }}>→</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(2px)' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '32px 36px', width: '90%', maxWidth: 460, boxShadow: '0 24px 64px rgba(15,23,42,0.18)' }}>
            <h2 style={{ margin: '0 0 24px', fontSize: 19, fontWeight: 700, color: '#0F172A' }}>Create New Event</h2>

            {[
              { label: 'Event Title *', key: 'title',    type: 'text', placeholder: 'e.g. Summer Pop-Up Café' },
              { label: 'Date',          key: 'date',     type: 'date', placeholder: '' },
              { label: 'Location',      key: 'location', type: 'text', placeholder: 'e.g. Downtown Amsterdam' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{f.label}</label>
                <input
                  type={f.type}
                  value={form[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            ))}

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Brief event description..."
                rows={3}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => { setShowModal(false); setForm(emptyForm); }}
                style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', color: '#374151', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !form.title.trim()}
                style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: creating ? '#94A3B8' : '#0F172A', color: '#fff', fontWeight: 600, fontSize: 14, cursor: creating ? 'not-allowed' : 'pointer' }}
              >
                {creating ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}