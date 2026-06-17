import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { P, icons, icStar } from '../utils/theme';

const CATEGORIES = [
  { key: 'experience',   label: 'Overall Experience', icon: icons.sparkles  },
  { key: 'food',         label: 'Food & Drinks',       icon: icons.utensils  },
  { key: 'venue',        label: 'Venue & Space',       icon: icons.building2 },
  { key: 'organisation', label: 'Organisation',        icon: icons.clipboard },
];

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  const active = hover || value;
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
            background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
            color: n <= active ? P.amber : P.muted,
            transition: 'color 0.1s, transform 0.15s cubic-bezier(0.34,1.56,0.64,1)',
            transform: n <= active ? 'scale(1.18)' : 'scale(1)',
            display: 'flex',
          }}
        >
          {icStar(28, n <= active)}
        </button>
      ))}
    </div>
  );
}

export default function FeedbackPage() {
  const { token } = useParams();
  const [loading, setLoading]       = useState(true);
  const [info, setInfo]             = useState(null);
  const [error, setError]           = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);

  const [ratings, setRatings]   = useState({ experience: 0, food: 0, venue: 0, organisation: 0 });
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

  const inp = {
    width: '100%', padding: '11px 14px', borderRadius: 9,
    border: `1px solid ${P.border}`, background: P.hover,
    color: P.text, fontSize: 14, outline: 'none',
    boxSizing: 'border-box', fontFamily: 'inherit',
    transition: 'border-color 0.15s', resize: 'vertical',
  };

  if (loading) return (
    <div style={s.page}>
      <style>{anims}</style>
      <div style={s.card}>
        <div style={{ width: 36, height: 36, border: `3px solid ${P.border}`, borderTopColor: P.blue, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
      </div>
    </div>
  );

  if (submitted) return (
    <div style={s.page}>
      <style>{anims}</style>
      <div style={{ ...s.card, animation: 'cardIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both' }}>
        <div style={{ color: P.amber, display: 'flex', justifyContent: 'center', transform: 'scale(2.4)', marginBottom: 28, animation: 'sparkle 0.6s ease both 0.15s' }}>
          {icons.sparkles}
        </div>
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
      <style>{anims}</style>
      <div style={{ ...s.card, animation: 'cardIn 0.35s ease both' }}>
        <div style={{ color: P.red, display: 'flex', justifyContent: 'center', transform: 'scale(2)', marginBottom: 20 }}>{icons.xCircle}</div>
        <h1 style={{ ...s.title, color: P.red }}>Invalid Link</h1>
        <p style={s.sub}>{error}</p>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <style>{anims}</style>
      <div style={{ ...s.card, animation: 'cardIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both' }}>
        <div style={{ color: P.amber, display: 'flex', justifyContent: 'center', transform: 'scale(2.2)', marginBottom: 20 }}>
          {icons.star}
        </div>
        <h1 style={s.title}>Share Your Feedback</h1>
        {info?.eventTitle && <p style={{ ...s.sub, fontWeight: 700, color: P.text }}>{info.eventTitle}</p>}
        {info?.guestName  && <p style={s.sub}>Hi {info.guestName.split(' ')[0]}, how was the event?</p>}

        {error && (
          <div style={{ background: P.redGlow, color: P.red, padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16, border: `1px solid ${P.red}33`, textAlign: 'left', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            {icons.warning} {error}
          </div>
        )}

        <div style={{ marginTop: 20, textAlign: 'left' }}>
          {CATEGORIES.map((cat, i) => (
            <div
              key={cat.key}
              style={{
                marginBottom: 20, background: P.surface, border: `1px solid ${P.border}`,
                borderRadius: 12, padding: '16px 18px',
                animation: `cardIn 0.3s ease ${i * 0.07}s both`,
              }}
            >
              <p style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: P.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: P.sub }}>{cat.icon}</span> {cat.label}
              </p>
              <StarRating
                value={ratings[cat.key]}
                onChange={v => setRatings(prev => ({ ...prev, [cat.key]: v }))}
              />
            </div>
          ))}

          <div style={{ marginBottom: 20, animation: `cardIn 0.3s ease ${CATEGORIES.length * 0.07}s both` }}>
            <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: P.text, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: P.sub }}>{icons.messages}</span> Additional Comments (optional)
            </p>
            <textarea
              value={comments}
              onChange={e => setComments(e.target.value)}
              rows={4}
              placeholder="Tell us more about your experience…"
              style={inp}
              onFocus={e => e.target.style.borderColor = P.blue}
              onBlur={e => e.target.style.borderColor = P.border}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              width: '100%', padding: '14px 0', borderRadius: 10, border: 'none',
              background: submitting ? P.muted : P.blue,
              color: '#fff', fontSize: 15, fontWeight: 700,
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background 0.15s',
              animation: `cardIn 0.3s ease ${(CATEGORIES.length + 1) * 0.07}s both`,
            }}
            onMouseEnter={e => { if (!submitting) e.currentTarget.style.opacity = '0.88'; }}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            {submitting
              ? <><span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Submitting…</>
              : <>{icons.send} Submit Feedback</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

const anims = `
  @keyframes cardIn  { from { opacity:0; transform:scale(0.96) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }
  @keyframes sparkle { from { opacity:0; transform:scale(1.6) rotate(-20deg); } to { opacity:1; transform:scale(2.4) rotate(0deg); } }
  @keyframes spin    { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
`;

const s = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: P.bg, padding: 24,
    fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif",
    color: P.text,
  },
  card: {
    background: P.panel, borderRadius: 20, padding: '40px 36px',
    width: '100%', maxWidth: 480, textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)', border: `1px solid ${P.border}`,
  },
  title: { fontSize: 26, fontWeight: 800, color: P.text, margin: '0 0 8px', letterSpacing: '-0.02em' },
  sub:   { fontSize: 15, color: P.sub, margin: '0 0 12px', lineHeight: 1.6 },
};
