import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const CATEGORIES = [
  { key: 'experience',   label: 'Overall Experience', icon: '⭐' },
  { key: 'food',         label: 'Food & Drinks',       icon: '🍽' },
  { key: 'venue',        label: 'Venue & Space',       icon: '🏛' },
  { key: 'organisation', label: 'Organisation',        icon: '📋' },
];

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          style={{
            fontSize: 28,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: n <= (hover || value) ? '#F59E0B' : '#E2E8F0',
            padding: '2px 4px',
            transition: 'color 0.1s',
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function FeedbackPage() {
  const { token } = useParams();
  const [loading, setLoading]     = useState(true);
  const [info, setInfo]           = useState(null);
  const [error, setError]         = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [ratings, setRatings] = useState({ experience: 0, food: 0, venue: 0, organisation: 0 });
  const [comments, setComments] = useState('');

  useEffect(() => {
    fetch(`http://localhost:5001/api/feedback/form/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.alreadySubmitted) { setSubmitted(true); }
        setInfo(data);
      })
      .catch(() => setError('Invalid feedback link'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async () => {
    const unanswered = CATEGORIES.filter(c => !ratings[c.key]);
    if (unanswered.length) {
      setError(`Please rate all categories (missing: ${unanswered.map(c => c.label).join(', ')})`);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`http://localhost:5001/api/feedback/submit/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...ratings, comments }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit');
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div style={s.page}><div style={s.card}><p style={{ color: '#94A3B8' }}>Loading…</p></div></div>
  );

  if (submitted) return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🙏</div>
        <h1 style={s.title}>Thank You!</h1>
        <p style={s.sub}>
          {info?.alreadySubmitted
            ? 'You have already submitted your feedback. Thank you!'
            : `Your feedback for ${info?.eventTitle || 'the event'} has been recorded. We really appreciate it!`}
        </p>
      </div>
    </div>
  );

  if (error && !info) return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={{ ...s.title, color: '#991B1B' }}>Invalid Link</h1>
        <p style={s.sub}>{error}</p>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⭐</div>
        <h1 style={s.title}>Share Your Feedback</h1>
        {info?.eventTitle && <p style={{ ...s.sub, fontWeight: 600, color: '#0F172A' }}>{info.eventTitle}</p>}
        {info?.guestName  && <p style={s.sub}>Hi {info.guestName.split(' ')[0]}, how was the event?</p>}

        {error && (
          <div style={{ background: '#FEF2F2', color: '#991B1B', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16, border: '1px solid #FECACA', textAlign: 'left' }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: 20, textAlign: 'left' }}>
          {CATEGORIES.map(cat => (
            <div key={cat.key} style={{ marginBottom: 20 }}>
              <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: '#374151' }}>
                {cat.icon} {cat.label}
              </p>
              <StarRating
                value={ratings[cat.key]}
                onChange={v => setRatings(prev => ({ ...prev, [cat.key]: v }))}
              />
            </div>
          ))}

          <div style={{ marginBottom: 20 }}>
            <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: '#374151' }}>
              💬 Additional Comments (optional)
            </p>
            <textarea
              value={comments}
              onChange={e => setComments(e.target.value)}
              rows={4}
              placeholder="Tell us more about your experience…"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{ width: '100%', padding: '14px 0', borderRadius: 10, border: 'none', background: submitting ? '#94A3B8' : '#0F172A', color: '#fff', fontSize: 15, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
          >
            {submitting ? 'Submitting…' : 'Submit Feedback'}
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  page:  { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', padding: 24, fontFamily: 'system-ui, -apple-system, sans-serif' },
  card:  { background: '#fff', borderRadius: 16, padding: '40px 36px', width: '100%', maxWidth: 480, textAlign: 'center', boxShadow: '0 8px 32px rgba(15,23,42,0.10)', border: '1px solid #E2E8F0' },
  title: { fontSize: 26, fontWeight: 800, color: '#0F172A', margin: '0 0 8px', letterSpacing: '-0.02em' },
  sub:   { fontSize: 15, color: '#64748B', margin: '0 0 12px', lineHeight: 1.6 },
};