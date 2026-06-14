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
  const [loading, setLoading]         = useState(true);
  const [eventInfo, setEventInfo]     = useState(null);
  const [error, setError]             = useState(null);
  const [submitting, setSubmitting]   = useState(false);
  const [result, setResult]           = useState(null); // { chosen, fullname, qrDataURL, qrCode }
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
          rsvpStatus:          status,
          dietaryPreferences:  dietary !== 'None' ? dietary : '',
          specialRequirements: specialReqs,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'RSVP failed');
      setResult({ ...data, chosen: status });
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div style={s.page}><div style={s.card}><p style={{ color: '#94A3B8' }}>Loading…</p></div></div>
  );

  // ─── Success: Attending with QR ──────────────────────────────────────────
  if (result && result.chosen === 'attending') return (
    <div style={s.page}>
      <div style={{ ...s.card, maxWidth: 520 }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
        <h1 style={s.title}>You're going!</h1>
        <p style={s.sub}>
          {result.fullname ? `Thanks for confirming, ${result.fullname.split(' ')[0]}!` : 'Thanks for confirming!'}
          {' '}See you at <strong>{eventInfo?.eventTitle || 'the event'}</strong>.
        </p>

        {result.qrDataURL && (
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 16,
            padding: '28px 24px',
            margin: '24px 0 20px',
            textAlign: 'center',
          }}>
            <p style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
              Your Check-in QR Code
            </p>

            {/* QR code displayed prominently in the center */}
            <div style={{
              display: 'inline-block',
              padding: 12,
              background: '#fff',
              borderRadius: 12,
              boxShadow: '0 4px 20px rgba(15,23,42,0.1)',
              marginBottom: 16,
            }}>
              <img
                src={result.qrDataURL}
                alt="Your QR code"
                style={{ width: 220, height: 220, display: 'block', borderRadius: 6 }}
              />
            </div>

            <p style={{ margin: '0 0 8px', fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>
              Show this QR code at the entrance for instant check-in.
            </p>
            <p style={{ margin: 0, fontSize: 11, color: '#94A3B8', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
              {result.qrCode}
            </p>
            <div style={{
              margin: '14px 0 0',
              padding: '10px 14px',
              background: '#EFF6FF',
              borderRadius: 8,
              fontSize: 12,
              color: '#1D4ED8',
            }}>
              📧 A copy with this QR code has been sent to your email.
            </div>
          </div>
        )}

        <button
          onClick={() => window.print()}
          style={{ ...s.btn, background: '#F8FAFC', color: '#374151', border: '1px solid #E2E8F0', marginBottom: 10 }}
        >
          🖨 Save / Print QR Code
        </button>
      </div>
    </div>
  );

  // ─── Success: Declined ───────────────────────────────────────────────────
  if (result && result.chosen === 'declined') return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>😢</div>
        <h1 style={s.title}>See you next time!</h1>
        <p style={s.sub}>
          {result.fullname ? `We're sorry you can't make it, ${result.fullname.split(' ')[0]}.` : "We're sorry you can't make it."}
          {' '}Thanks for letting us know.
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
                  <p style={s.detailLabel}>Date &amp; Time</p>
                  <p style={s.detailVal}>
                    {fmtDate(eventInfo.date)}
                    {eventInfo.startTime ? ` at ${eventInfo.startTime}` : ''}
                    {eventInfo.endTime   ? ` – ${eventInfo.endTime}`   : ''}
                  </p>
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
          >
            ✓ Yes, I'll be there!
          </button>
          <button
            onClick={() => handleSubmit('declined')}
            disabled={submitting}
            style={{ ...s.btn, background: '#fff', color: '#374151', border: '1px solid #E2E8F0' }}
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
  btn:         { display: 'block', width: '100%', padding: '14px 24px', borderRadius: 10, border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 0 },
  input:       { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
};