import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { submitRsvp } from '../services/serviceGuest';

export default function RsvpPage() {
  const { token } = useParams();
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]         = useState(null);   // { rsvpStatus, fullname }
  const [error, setError]           = useState(null);

  const handleRsvp = async (rsvpStatus) => {
    setSubmitting(true);
    setError(null);
    try {
      const data = await submitRsvp(token, rsvpStatus);
      setResult({ ...data, chosen: rsvpStatus });
    } catch (err) {
      setError(err.message || 'Invalid or expired RSVP link');
    } finally {
      setSubmitting(false);
    }
  };

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
  : `We're sorry you can't make it${result.fullname ? `, ${result.fullname}` : ''}. Thanks for letting us know.`}        </p>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🎟</div>
        <h1 style={s.title}>You're Invited!</h1>
        <p style={s.sub}>Please let us know if you'll be attending.</p>

        {error && (
          <div style={{ background: '#FEF2F2', color: '#991B1B', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 20, border: '1px solid #FECACA' }}>
            {error}
          </div>
        )}

        <button
        onClick={() => handleRsvp('attending')}
          disabled={submitting}
          style={{ ...s.btn, background: '#166534', color: '#fff', marginBottom: 10 }}
          onMouseEnter={e => e.currentTarget.style.background = '#14532D'}
          onMouseLeave={e => e.currentTarget.style.background = '#166534'}
        >
          ✓ Yes, I'll be there!
        </button>
        <button
          onClick={() => handleRsvp('declined')}
          disabled={submitting}
          style={{ ...s.btn, background: '#fff', color: '#374151', border: '1px solid #E2E8F0' }}
          onMouseEnter={e => e.currentTarget.style.background = '#F1F5F9'}
          onMouseLeave={e => e.currentTarget.style.background = '#fff'}
        >
          ✗ Sorry, I can't make it
        </button>

        {submitting && <p style={{ color: '#94A3B8', fontSize: 13, marginTop: 12 }}>Submitting...</p>}
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', padding: 24, fontFamily: 'system-ui, -apple-system, sans-serif' },
  card: { background: '#fff', borderRadius: 16, padding: '48px 40px', width: '100%', maxWidth: 400, textAlign: 'center', boxShadow: '0 8px 32px rgba(15,23,42,0.10)', border: '1px solid #E2E8F0' },
  title: { fontSize: 26, fontWeight: 800, color: '#0F172A', margin: '0 0 8px', letterSpacing: '-0.02em' },
  sub: { fontSize: 15, color: '#64748B', margin: '0 0 28px', lineHeight: 1.6 },
  btn: { display: 'block', width: '100%', padding: '14px 24px', borderRadius: 10, border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'background 0.12s', fontFamily: 'inherit' },
};