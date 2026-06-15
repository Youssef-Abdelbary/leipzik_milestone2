import { useState, useEffect } from 'react';
import { getEventFeedbackSummary } from '../../services/serviceFeedback';
import { P } from '../../utils/theme.jsx'; // Assuming theme is in utils

const CATS = [
  { key: 'experience',   label: 'Overall Experience', icon: '✨' },
  { key: 'food',         label: 'Food & Drinks',       icon: '🍕' },
  { key: 'venue',        label: 'Venue & Space',       icon: '🏰' },
  { key: 'organisation', label: 'Organisation',        icon: '🎈' },
];

function Stars({ value, size = 18 }) {
  if (!value) return <span style={{ fontSize: 12, color: P.muted }}>N/A</span>;
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} style={{ fontSize: size, color: n <= Math.round(value) ? P.amber : P.muted, transition: 'color 0.2s' }}>
          ★
        </span>
      ))}
    </div>
  );
}

function DistributionBar({ label, count, total }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: P.sub, width: 24 }}>{label}</span>
      <div style={{ flex: 1, background: P.bg, borderRadius: 99, height: 8, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: P.blue, borderRadius: 99, transition: 'width 0.8s ease' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 500, color: P.muted, width: 45 }}>{pct}%</span>
    </div>
  );
}

export default function TabFeedback({ eventId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getEventFeedbackSummary(eventId)
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [eventId]);

  const s = {
    page: { maxWidth: 900, margin: '0 auto', padding: '32px 24px', color: P.text },
    card: { 
      background: P.surface, 
      borderRadius: 16, 
      padding: '24px', 
      border: `1px solid ${P.border}`,
      marginBottom: 20
    },
    lbl: { margin: '0 0 12px', fontSize: 11, fontWeight: 800, color: P.sub, textTransform: 'uppercase', letterSpacing: '0.1em' },
  };

  if (loading) return <div style={s.page}>Loading feedback...</div>;
  if (error) return <div style={s.page}><div style={{...s.card, color: P.red}}>Oops! {error}</div></div>;

  if (!data || data.count === 0) return (
    <div style={s.page}>
      <div style={{...s.card, textAlign: 'center', padding: '60px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎈</div>
        <h3 style={{ margin: '0 0 8px', color: P.text }}>Feedback is still cooking!</h3>
        <p style={{ color: P.sub, fontSize: 14 }}>Responses will pop up here once guests share their thoughts.</p>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: P.text, marginBottom: 8 }}>Feedback Pulse ⚡</h2>
        <p style={{ color: P.sub }}>{data.count} responses collected ({Math.round((data.count / data.total) * 100)}% engagement)</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 20 }}>
        <div style={s.card}>
          <p style={s.lbl}>Overall Score</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 48, fontWeight: 800, color: P.text }}>{data.averages?.overall ?? '—'}</span>
            <span style={{ color: P.sub }}>/ 5.0</span>
          </div>
          <Stars value={data.averages?.overall} size={24} />
        </div>

        <div style={s.card}>
          <p style={s.lbl}>Rating Distribution</p>
          {[5, 4, 3, 2, 1].map(n => (
            <DistributionBar key={n} label={`${n}★`} count={data.distribution?.[n] || 0} total={data.count} />
          ))}
        </div>
      </div>

      <div style={s.card}>
        <p style={s.lbl}>Category Breakdown</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
          {CATS.map(cat => (
            <div key={cat.key} style={{ background: P.panel, padding: '16px', borderRadius: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{cat.icon}</div>
              <p style={{ fontSize: 11, fontWeight: 700, color: P.sub, marginBottom: 4 }}>{cat.label}</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: P.text }}>{data.averages?.[cat.key] ?? '—'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}