import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { P, icons, icStar, GlassPanel } from '../components/componentTheme';
import '../components/componentTheme.css';

const CATEGORIES = [
  { key: 'experience',   label: 'Overall Experience', icon: icons.sparkles,  color: P.amber,  glow: P.amberGlow  },
  { key: 'food',         label: 'Food & Drinks',       icon: icons.utensils,  color: P.orange, glow: P.orangeGlow },
  { key: 'venue',        label: 'Venue & Space',       icon: icons.building2, color: P.teal,   glow: P.tealGlow   },
  { key: 'organisation', label: 'Organisation',        icon: icons.clipboard, color: P.indigo, glow: P.indigoGlow },
];

// ─── Star rating row ──────────────────────────────────────────────────────────
function StarRating({ value, onChange, color }) {
  const [hover, setHover] = useState(0);
  const active = hover || value;
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '2px 3px',
            color: n <= active ? color : 'rgba(255,255,255,0.15)',
            transition: 'color 0.1s, transform 0.15s cubic-bezier(0.34,1.56,0.64,1)',
            transform: n <= active ? 'scale(1.2)' : 'scale(1)',
            display: 'flex',
            filter: n <= active ? `drop-shadow(0 0 6px ${color}88)` : 'none',
          }}
        >
          {icStar(26, n <= active)}
        </button>
      ))}
    </div>
  );
}

// ─── Brand header strip ───────────────────────────────────────────────────────
function BrandHeader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '0 0 24px', marginBottom: 24,
      borderBottom: `1px solid ${P.border}`,
    }}>
      {/* Mini logo mark */}
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        background: 'linear-gradient(135deg,rgba(139,109,255,0.15) 0%,rgba(62,207,184,0.15) 100%)',
        border: '1.5px solid rgba(139,109,255,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <svg width="40" height="40" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="fbLg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b6dff"/>
              <stop offset="100%" stopColor="#3ecfb8"/>
            </linearGradient>
          </defs>
          <circle cx="22" cy="22" r="18" fill="none" stroke="url(#fbLg)" strokeWidth="1.5" strokeDasharray="4 3"/>
          <ellipse cx="22" cy="22" rx="6" ry="4.5" fill="none" stroke="#8b6dff" strokeWidth="1.5"/>
          <circle cx="22" cy="22" r="2.2" fill="#3ecfb8"/>
        </svg>
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 800, color: P.text, letterSpacing: '-0.02em', lineHeight: 1.1 }}>PopEyez</div>
        <div style={{ fontSize: 11, color: P.muted, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: 2 }}>Event Feedback</div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function FeedbackPage() {
  const { token } = useParams();
  const [loading,    setLoading]    = useState(true);
  const [info,       setInfo]       = useState(null);
  const [error,      setError]      = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [ratings,    setRatings]    = useState({ experience: 0, food: 0, venue: 0, organisation: 0 });
  const [comments,   setComments]   = useState('');

  useEffect(() => {
    fetch(`http://localhost:5001/api/feedback/form/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.alreadySubmitted) setSubmitted(true);
        setInfo(data);
      })
      .catch(() => setError('Invalid or expired feedback link'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async () => {
    const unanswered = CATEGORIES.filter(c => !ratings[c.key]);
    if (unanswered.length) {
      setError(`Please rate: ${unanswered.map(c => c.label).join(', ')}`);
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
      if (!res.ok) throw new Error(data.message || 'Submission failed');
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ──
  if (loading) return (
    <div style={s.page}>
      <style>{anims}</style>
      <GlassPanel style={s.card}>
        <BrandHeader />
        <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
          <div style={{ width: 36, height: 36, border: `3px solid ${P.border}`, borderTopColor: P.blue, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      </GlassPanel>
    </div>
  );

  // ── Invalid link ──
  if (error && !info) return (
    <div style={s.page}>
      <style>{anims}</style>
      <GlassPanel style={{ ...s.card, animation: 'cardIn 0.35s ease both', border: `1px solid ${P.rose}33`, background: 'rgba(251,113,133,0.04)' }}>
        <BrandHeader />
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: P.roseGlow, border: `1.5px solid ${P.rose}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: P.rose }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <h2 style={{ margin: '0 0 10px', fontSize: 22, fontWeight: 800, color: P.text, textAlign: 'center', fontFamily: 'var(--font-display)' }}>Invalid Link</h2>
        <p style={{ margin: 0, fontSize: 14, color: P.sub, textAlign: 'center', lineHeight: 1.6 }}>{error}</p>
      </GlassPanel>
    </div>
  );

  // ── Already submitted / success ──
  if (submitted) return (
    <div style={s.page}>
      <style>{anims}</style>
      <GlassPanel style={{ ...s.card, animation: 'cardIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both', border: `1px solid ${P.teal}33`, background: 'rgba(62,207,184,0.04)' }}>
        <BrandHeader />
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: `linear-gradient(135deg, ${P.tealGlow} 0%, rgba(34,211,238,0.10) 100%)`, border: `1.5px solid ${P.teal}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: P.teal, animation: 'sparkle 0.6s ease both 0.1s', boxShadow: `0 0 40px ${P.teal}22` }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2 style={{ margin: '0 0 10px', fontSize: 26, fontWeight: 900, color: P.text, textAlign: 'center', fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}>Thank You!</h2>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: P.sub, textAlign: 'center', lineHeight: 1.7 }}>
          {info?.alreadySubmitted
            ? "You've already submitted your feedback. We appreciate it!"
            : `Your feedback for ${info?.eventTitle || 'the event'} has been recorded. We really appreciate it!`}
        </p>
        {/* Category confirmation chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          {CATEGORIES.map(cat => (
            <span key={cat.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: cat.glow, color: cat.color, border: `1px solid ${cat.color}33` }}>
              {cat.icon} {cat.label}
            </span>
          ))}
        </div>
      </GlassPanel>
    </div>
  );

  // ── Form ──
  return (
    <div style={s.page}>
      <style>{anims}</style>
      <GlassPanel style={{ ...s.card, animation: 'cardIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both' }}>
        <BrandHeader />

        {/* Event / guest greeting */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          {info?.eventTitle && (
            <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700, color: P.blue, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{info.eventTitle}</p>
          )}
          <h2 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 900, color: P.text, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}>Share Your Feedback</h2>
          {info?.guestName && (
            <p style={{ margin: 0, fontSize: 14, color: P.sub }}>
              Hi <strong style={{ color: P.text }}>{info.guestName.split(' ')[0]}</strong>, how was your experience?
            </p>
          )}
        </div>

        {error && (
          <div style={{ background: P.roseGlow, color: P.rose, padding: '10px 14px', borderRadius: 9, fontSize: 13, marginBottom: 20, border: `1px solid ${P.rose}33`, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span style={{ flexShrink: 0, display: 'flex', marginTop: 1 }}>{icons.warning}</span> {error}
          </div>
        )}

        {/* Category rating cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          {CATEGORIES.map((cat, i) => (
            <div
              key={cat.key}
              style={{
                background: ratings[cat.key]
                  ? `linear-gradient(135deg, ${cat.glow} 0%, rgba(19,19,30,0.6) 100%)`
                  : 'rgba(19,19,30,0.6)',
                border: `1px solid ${ratings[cat.key] ? cat.color + '44' : P.border}`,
                borderRadius: 13, padding: '16px 18px',
                transition: 'all 0.2s ease',
                animation: `cardIn 0.3s ease ${i * 0.06}s both`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: ratings[cat.key] ? cat.color : P.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: cat.color, background: cat.glow, padding: 5, borderRadius: 7, display: 'flex', border: `1px solid ${cat.color}33` }}>{cat.icon}</span>
                  {cat.label}
                </p>
                <StarRating
                  value={ratings[cat.key]}
                  onChange={v => setRatings(prev => ({ ...prev, [cat.key]: v }))}
                  color={cat.color}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Comments */}
        <div style={{ marginBottom: 24, animation: `cardIn 0.3s ease ${CATEGORIES.length * 0.06}s both` }}>
          <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: P.sub, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: P.indigo, display: 'flex' }}>{icons.messages}</span> Additional Comments <span style={{ color: P.muted, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
          </p>
          <textarea
            value={comments}
            onChange={e => setComments(e.target.value)}
            rows={4}
            placeholder="Tell us more about your experience…"
            style={{
              width: '100%', padding: '12px 14px', borderRadius: 10,
              border: `1px solid ${P.border}`, background: 'rgba(13,13,19,0.6)',
              color: P.text, fontSize: 14, outline: 'none',
              boxSizing: 'border-box', fontFamily: 'inherit',
              transition: 'border-color 0.15s', resize: 'vertical',
            }}
            onFocus={e => e.target.style.borderColor = P.blue}
            onBlur={e => e.target.style.borderColor = P.border}
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            width: '100%', padding: '14px 0', borderRadius: 11, border: 'none',
            background: submitting
              ? P.hover
              : `linear-gradient(135deg, ${P.blue} 0%, ${P.teal} 100%)`,
            color: submitting ? P.muted : '#0a0a0f',
            fontSize: 15, fontWeight: 800,
            cursor: submitting ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'opacity 0.15s',
            animation: `cardIn 0.3s ease ${(CATEGORIES.length + 1) * 0.06}s both`,
            letterSpacing: '-0.01em',
          }}
          onMouseEnter={e => { if (!submitting) e.currentTarget.style.opacity = '0.88'; }}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          {submitting ? (
            <><span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Submitting…</>
          ) : (
            <>{icons.send} Submit Feedback</>
          )}
        </button>
      </GlassPanel>
    </div>
  );
}

const anims = `
  @keyframes cardIn  { from { opacity:0; transform:scale(0.96) translateY(14px); } to { opacity:1; transform:scale(1) translateY(0); } }
  @keyframes sparkle { from { opacity:0; transform:scale(0.7) rotate(-20deg); }   to { opacity:1; transform:scale(1) rotate(0deg); } }
  @keyframes spin    { from { transform:rotate(0deg); }                            to { transform:rotate(360deg); } }
`;

const s = {
  page: {
    minHeight: '100vh',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--opal-bg)',
    backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(139,109,255,0.18) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 90%, rgba(62,207,184,0.10) 0%, transparent 70%)',
    padding: 24,
    fontFamily: 'var(--font-body)',
    color: P.text,
  },
  card: {
    padding: '36px 32px',
    width: '100%', maxWidth: 500,
    boxShadow: '0 24px 64px rgba(0,0,0,0.55)',
  },
};
