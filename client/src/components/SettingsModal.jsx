import { useState } from 'react';
import { updateEvent } from '../services/serviceEvent';
import { EVENT_TYPES } from '../utils/constants'; 
import { P, icons, STATUS_OPTIONS } from '../utils/theme.jsx';

// Move static label style config outside to clear component scoping issues
const flbl = { 
  display: 'block', 
  fontSize: 11, 
  fontWeight: 600, 
  color: P.sub, 
  marginBottom: 6, 
  textTransform: 'uppercase', 
  letterSpacing: '0.06em' 
};

// Clean reusable field container component outside of render
const Field = ({ label, children }) => (
  <div style={{ marginBottom: 16, flex: 1, minWidth: 0 }}>
    <label style={flbl}>{label}</label>
    {children}
  </div>
);

export default function SettingsModal({ event, onSave, onClose }) {
  const [form, setForm] = useState({
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
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaveError(null);
    if (!form.title?.trim()) { setSaveError('Title is required'); return; }
    setSaving(true);
    try {
      const updated = await updateEvent(event._id, form);
      onSave(updated);
      onClose();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Modern input focus design baseline
  const inp = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 8,
    border: `1px solid ${P.border}`,
    background: P.surface, 
    color: P.text,
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    transition: 'all 0.2s ease',
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(8px)', padding: 20, overflowY: 'auto' }}
      onClick={onClose}
    >
      <div
        style={{ background: P.panel, borderRadius: 16, padding: '32px', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', border: `1px solid ${P.border}`, boxShadow: '0 20px 40px rgba(0,0,0,0.8)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{ color: P.blue, background: 'rgba(68,147,248,0.1)', padding: 8, borderRadius: 10 }}>{icons.settings}</div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: P.text }}>Event Settings</h2>
        </div>

        {saveError && (
          <div style={{ background: 'rgba(248,81,73,0.1)', color: P.red, border: `1px solid rgba(248,81,73,0.3)`, borderRadius: 8, padding: '12px 16px', fontSize: 13, marginBottom: 20 }}>
            {saveError}
          </div>
        )}

        <Field label="Event Title *">
          <input style={inp} value={form.title} onChange={e => set('title', e.target.value)} />
        </Field>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Field label="Event Type">
            <select style={{ ...inp, cursor: 'pointer' }} value={form.eventType} onChange={e => set('eventType', e.target.value)}>
              <option value="">Select type…</option>
              {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select style={{ ...inp, cursor: 'pointer' }} value={form.status} onChange={e => set('status', e.target.value)}>
              {STATUS_OPTIONS.map(st => <option key={st} value={st}>{st.charAt(0).toUpperCase() + st.slice(1)}</option>)}
            </select>
          </Field>
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Field label="Date">
            <input style={inp} type="date" value={form.date} onChange={e => set('date', e.target.value)} />
          </Field>
          <Field label="Attendees">
            <input style={inp} type="number" min="0" value={form.expectedAttendees} onChange={e => set('expectedAttendees', e.target.value)} />
          </Field>
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Field label="Start Time">
            <input style={inp} type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)} />
          </Field>
          <Field label="End Time">
            <input style={inp} type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)} />
          </Field>
        </div>

        <Field label="Venue / Location">
          <input style={inp} value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. The Garden Hall" />
        </Field>

        <Field label="Description">
          <textarea style={{ ...inp, minHeight: 100, resize: 'vertical' }} value={form.description} onChange={e => set('description', e.target.value)} />
        </Field>

        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px 0', borderRadius: 8, border: `1px solid ${P.border}`, background: 'transparent', color: P.sub, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '12px 0', borderRadius: 8, border: 'none', background: saving ? P.muted : P.blue, color: '#fff', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}