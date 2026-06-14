import { useState, useEffect } from 'react';
import { getEventFeedbackSummary } from '../../services/serviceFeedback';

const CATS = [
  { key: 'experience',   label: 'Overall Experience', icon: '⭐' },
  { key: 'food',         label: 'Food & Drinks',       icon: '🍽' },
  { key: 'venue',        label: 'Venue & Space',       icon: '🏛' },
  { key: 'organisation', label: 'Organisation',        icon: '📋' },
];

function Stars({ value, size = 18 }) {
  if (!value) return <span style={{ fontSize: size - 4, color: '#94A3B8' }}>No data</span>;
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          style={{ fontSize: size, color: n <= Math.round(value) ? '#F59E0B' : '#E2E8F0' }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function DistributionBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <span style={{ fontSize: 13, color: '#64748B', width: 20, textAlign: 'right', flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, background: '#F1F5F9', borderRadius: 99, height: 10, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.4s ease' }} />
      </div>
      <span style={{ fontSize: 12, color: '#94A3B8', width: 36, flexShrink: 0 }}>{count} ({pct}%)</span>
    </div>
  );
}

export default function TabFeedback({ eventId, event }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    getEventFeedbackSummary(eventId)
      .then(setData)
      .catch(err => setError(err.message || 'Failed to load feedback'))
      .finally(() => setLoading(false));
  }, [eventId]);

  const s = {
    page:  { maxWidth: 860, margin: '0 auto', padding: '28px 24px', fontFamily: 'system-ui, -apple-system, sans-serif' },
    card:  { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '20px 24px', marginBottom: 16, boxShadow: '0 1px 4px rgba(15,23,42,0.04)' },
    h2:    { margin: '0 0 4px', fontSize: 22, fontWeight: 800, color: '#0F172A' },
    sub:   { margin: 0, fontSize: 14, color: '#64748B' },
    lbl:   { margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em' },
  };

  if (loading) return <div style={s.page}><p style={{ color: '#94A3B8' }}>Loading feedback…</p></div>;

  if (error) return (
    <div style={s.page}>
      <div style={{ background: '#FEF2F2', color: '#991B1B', borderRadius: 8, padding: 14, fontSize: 13 }}>{error}</div>
    </div>
  );

  if (!data || data.count === 0) return (
    <div style={s.page}>
      <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0' }}>
        <p style={{ fontSize: 40, margin: '0 0 16px' }}>⭐</p>
        <p style={{ fontWeight: 700, fontSize: 16, color: '#0F172A', margin: '0 0 8px' }}>No feedback yet</p>
        <p style={{ color: '#64748B', fontSize: 14 }}>
          {event?.status !== 'completed'
            ? 'Feedback is collected after the event is marked as completed.'
            : 'Feedback requests have been sent — responses will appear here.'}
        </p>
      </div>
    </div>
  );

  const responseRate = data.total > 0 ? Math.round((data.count / data.total) * 100) : 0;
  const distColors   = { 5: '#22C55E', 4: '#84CC16', 3: '#F59E0B', 2: '#F97316', 1: '#EF4444' };

  return (
    <div style={s.page}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={s.h2}>📊 Event Feedback</h2>
        <p style={s.sub}>{data.count} response{data.count !== 1 ? 's' : ''} from {data.total} attending guests ({responseRate}% response rate)</p>
      </div>

      {/* Overall score + response rate */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ ...s.card, flex: '0 0 auto', textAlign: 'center', minWidth: 160 }}>
          <p style={s.lbl}>Overall Score</p>
          <p style={{ margin: '8px 0 6px', fontSize: 48, fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>
            {data.averages?.overall ?? '—'}
          </p>
          <Stars value={data.averages?.overall} size={20} />
          <p style={{ margin: '8px 0 0', fontSize: 12, color: '#94A3B8' }}>out of 5</p>
        </div>

        <div style={{ ...s.card, flex: 1, minWidth: 200 }}>
          <p style={{ ...s.lbl, marginBottom: 12 }}>Rating Distribution (Overall Experience)</p>
          {[5, 4, 3, 2, 1].map(n => (
            <DistributionBar
              key={n}
              label={`${n}★`}
              count={data.distribution?.[n] || 0}
              total={data.count}
              color={distColors[n]}
            />
          ))}
        </div>
      </div>

      {/* Per-category averages */}
      <div style={{ ...s.card, marginBottom: 16 }}>
        <p style={{ ...s.lbl, marginBottom: 16 }}>Category Breakdown</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
          {CATS.map(cat => (
            <div key={cat.key} style={{ textAlign: 'center', padding: '14px 10px', background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0' }}>
              <p style={{ margin: '0 0 6px', fontSize: 22 }}>{cat.icon}</p>
              <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#374151' }}>{cat.label}</p>
              <p style={{ margin: '0 0 6px', fontSize: 28, fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>
                {data.averages?.[cat.key] ?? '—'}
              </p>
              <Stars value={data.averages?.[cat.key]} size={14} />
            </div>
          ))}
        </div>
      </div>

      {/* Comments */}
      {data.comments?.length > 0 && (
        <div style={s.card}>
          <p style={{ ...s.lbl, marginBottom: 16 }}>Guest Comments ({data.comments.length})</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.comments.map((c, i) => (
              <div key={i} style={{ background: '#F8FAFC', borderRadius: 8, padding: '12px 16px', borderLeft: '3px solid #F59E0B' }}>
                <p style={{ margin: '0 0 6px', fontSize: 14, color: '#374151', lineHeight: 1.6 }}>{c.comment}</p>
                <p style={{ margin: 0, fontSize: 11, color: '#94A3B8' }}>
                  {new Date(c.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}