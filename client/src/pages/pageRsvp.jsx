import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const DIETARY_PRESETS = [
  'None', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Halal', 'Kosher', 'Nut Allergy', 'Dairy-Free',
];

function fmtDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

export default function RsvpPage() {
  const { token } = useParams();
  const [loading, setLoading]       = useState(true);
  const [eventInfo, setEventInfo]   = useState(null);
  const [error, setError]           = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]         = useState(null);

  // Form state
  const [dietary, setDietary]         = useState('None');
  const [specialReqs, setSpecialReqs] = useState('');

  useEffect(() => {
    fetch(`http://localhost:5001/api/feedback/rsvp-info/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setEventInfo(data);
      })
      .catch(err => setError(err.message || 'Invalid or expired RSVP link'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (status) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:5001/api/guest/rsvp/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rsvpStatus: status,
          dietaryPreferences: dietary !== 'None' ? dietary : '',
          specialRequirements: specialReqs,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'RSVP failed');
      setResult({ ...data, chosen: status });
    } catch (err) {
      setError(err.message || 'Invalid or expired RSVP link');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div style={s.page}>
      <div style={s.card}><p style={{ color: '#94A3B8' }}>Loading…</p></div>
    </div>
  );

  if (result) return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>
          {result.chosen === 'attending' ? '🎉' : '😢'}
        </div>
        <h1 style={s.title}>
          {result.chosen === 'attending' ? "You're going!" : "See you next time!"}
        </h1>
        <p style={s.sub}>
          {result.chosen === 'attending'
            ? `Thanks for confirming${result.fullname ? `, ${result.fullname}` : ''}! We look forward to seeing you.`
            : `We're sorry you can't make it${result.fullname ? `, ${result.fullname}` : ''}. Thanks for letting us know.`}
        </p>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🎟</div>
        <h1 style={s.title}>You're Invited!</h1>

        {eventInfo && (
          <div style={s.eventBox}>
            <p style={s.eventTitle}>{eventInfo.eventTitle}</p>
            {eventInfo.date && (
              <div style={s.detailRow}>
                <span style={s.detailIcon}>📅</span>
                <div>
                  <p style={s.detailLabel}>Date & Time</p>
                  <p style={s.detailVal}>{fmtDate(eventInfo.date)}{eventInfo.startTime ? ` at ${eventInfo.startTime}` : ''}{eventInfo.endTime ? ` – ${eventInfo.endTime}` : ''}</p>
                </div>
              </div>
            )}
            {eventInfo.venueName && eventInfo.venueName !== 'TBD' && (
              <div style={s.detailRow}>
                <span style={s.detailIcon}>📍</span>
                <div>
                  <p style={s.detailLabel}>Venue</p>
                  <p style={s.detailVal}>{eventInfo.venueName}</p>
                </div>
              </div>
            )}
            {eventInfo.dressCode && (
              <div style={s.detailRow}>
                <span style={s.detailIcon}>👔</span>
                <div>
                  <p style={s.detailLabel}>Dress Code</p>
                  <p style={s.detailVal}>{eventInfo.dressCode}</p>
                </div>
              </div>
            )}
            {Array.isArray(eventInfo.agenda) && eventInfo.agenda.length > 0 && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #E2E8F0' }}>
                <p style={{ ...s.detailLabel, marginBottom: 8 }}>Agenda</p>
                {eventInfo.agenda.map((a, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: '#4338CA', fontWeight: 600, minWidth: 48 }}>{a.time}</span>
                    <div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{a.title}</p>
                      {a.description && <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>{a.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {error && (
          <div style={{ background: '#FEF2F2', color: '#991B1B', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 20, border: '1px solid #FECACA' }}>
            {error}
          </div>
        )}

        <div style={s.section}>
          <p style={s.sectionLabel}>Will you be attending?</p>
          <button
            onClick={() => handleSubmit('attending')}
            disabled={submitting}
            style={{ ...s.btn, background: '#166534', color: '#fff', marginBottom: 10 }}
            onMouseEnter={e => e.currentTarget.style.background = '#14532D'}
            onMouseLeave={e => e.currentTarget.style.background = '#166534'}
          >
            ✓ Yes, I'll be there!
          </button>
          <button
            onClick={() => handleSubmit('declined')}
            disabled={submitting}
            style={{ ...s.btn, background: '#fff', color: '#374151', border: '1px solid #E2E8F0' }}
            onMouseEnter={e => e.currentTarget.style.background = '#F1F5F9'}
            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
          >
            ✗ Sorry, I can't make it
          </button>
        </div>

        <div style={{ ...s.section, borderTop: '1px solid #F1F5F9', paddingTop: 20, marginTop: 8 }}>
          <p style={s.sectionLabel}>Dietary Preferences (optional)</p>
          <input
            list="dietary-options"
            value={dietary}
            onChange={e => setDietary(e.target.value)}
            placeholder="e.g. Vegetarian, Vegan, Halal…"
            style={s.input}
          />
          <datalist id="dietary-options">
            {DIETARY_PRESETS.map(d => <option key={d} value={d} />)}
          </datalist>
        </div>

        <div style={s.section}>
          <p style={s.sectionLabel}>Special Requirements (optional)</p>
          <textarea
            value={specialReqs}
            onChange={e => setSpecialReqs(e.target.value)}
            placeholder="Wheelchair access, allergies, etc."
            rows={3}
            style={{ ...s.input, resize: 'vertical' }}
          />
        </div>

        {submitting && <p style={{ color: '#94A3B8', fontSize: 13, marginTop: 12 }}>Submitting…</p>}
      </div>
    </div>
  );
}

const s = {
  page:        { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', padding: 24, fontFamily: 'system-ui, -apple-system, sans-serif' },
  card:        { background: '#fff', borderRadius: 16, padding: '40px 36px', width: '100%', maxWidth: 500, textAlign: 'center', boxShadow: '0 8px 32px rgba(15,23,42,0.10)', border: '1px solid #E2E8F0' },
  title:       { fontSize: 26, fontWeight: 800, color: '#0F172A', margin: '0 0 8px', letterSpacing: '-0.02em' },
  sub:         { fontSize: 15, color: '#64748B', margin: '0 0 20px', lineHeight: 1.6 },
  eventBox:    { background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px 20px', marginBottom: 24, textAlign: 'left' },
  eventTitle:  { margin: '0 0 12px', fontSize: 18, fontWeight: 700, color: '#0F172A' },
  detailRow:   { display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' },
  detailIcon:  { fontSize: 16, marginTop: 2 },
  detailLabel: { margin: '0 0 2px', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em' },
  detailVal:   { margin: 0, fontSize: 14, fontWeight: 600, color: '#0F172A' },
  section:     { marginTop: 16 },
  sectionLabel:{ fontSize: 14, fontWeight: 700, color: '#374151', margin: '0 0 10px', textAlign: 'left' },
  btn:         { display: 'block', width: '100%', padding: '14px 24px', borderRadius: 10, border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'background 0.12s', fontFamily: 'inherit' },
  input:       { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
};