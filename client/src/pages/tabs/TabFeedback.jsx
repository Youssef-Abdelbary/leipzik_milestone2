import { useState, useEffect } from 'react';
import { getEventFeedbackSummary } from '../../services/serviceFeedback';
import { P } from '../../utils/theme';

const CATS = [
  { key:'experience',   label:'Overall Experience', icon:'✨' },
  { key:'food',         label:'Food & Drinks',       icon:'🍕' },
  { key:'venue',        label:'Venue & Space',       icon:'🏛'  },
  { key:'organisation', label:'Organisation',        icon:'📋' },
];

function Stars({ value, size = 18 }) {
  if (value == null) return <span style={{ fontSize:12, color:P.muted }}>N/A</span>;
  return (
    <div style={{ display:'flex', gap:3 }}>
      {[1,2,3,4,5].map(n => (
        <span key={n} style={{ fontSize:size, color: n<=Math.round(value) ? P.amber : P.muted, transition:'color 0.15s', lineHeight:1 }}>★</span>
      ))}
    </div>
  );
}

function DistributionBar({ label, count, total }) {
  const pct = total > 0 ? Math.round((count/total)*100) : 0;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
      <span style={{ fontSize:13, fontWeight:600, color:P.sub, width:28, flexShrink:0 }}>{label}</span>
      <div style={{ flex:1, background:P.hover, borderRadius:99, height:8, overflow:'hidden' }}>
        <div style={{ width:`${pct}%`, height:'100%', background:P.amber, borderRadius:99, transition:'width 0.8s ease' }}/>
      </div>
      <span style={{ fontSize:12, fontWeight:500, color:P.muted, width:42, textAlign:'right', flexShrink:0 }}>{pct}%</span>
    </div>
  );
}

export default function TabFeedback({ eventId, event }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    getEventFeedbackSummary(eventId)
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [eventId]);

  const card = { background:P.surface, borderRadius:14, padding:'22px', border:`1px solid ${P.border}`, marginBottom:18, boxShadow:'0 4px 16px rgba(0,0,0,0.2)' };
  const sectionLabel = { margin:'0 0 14px', fontSize:11, fontWeight:700, color:P.muted, textTransform:'uppercase', letterSpacing:'0.08em' };

  if (loading) return (
    <div style={{ maxWidth:900, margin:'0 auto', padding:'32px 24px' }}>
      <style>{`@keyframes skel{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
      {[260,180,280].map((h,i) => <div key={i} style={{ height:h, background:P.surface, borderRadius:14, animation:`skel 1.4s infinite ${i*0.15}s`, marginBottom:18, border:`1px solid ${P.border}` }}/>)}
    </div>
  );

  if (error) return (
    <div style={{ maxWidth:900, margin:'0 auto', padding:'32px 24px' }}>
      <div style={{ ...card, color:P.red, background:P.redGlow, border:`1px solid ${P.red}33` }}>Error: {error}</div>
    </div>
  );

  if (!data || data.count === 0) return (
    <div style={{ maxWidth:900, margin:'0 auto', padding:'32px 24px' }}>
      <div style={{ ...card, textAlign:'center', padding:'64px' }}>
        <div style={{ fontSize:48, marginBottom:16 }}>⭐</div>
        <h3 style={{ margin:'0 0 8px', color:P.text, fontWeight:700 }}>No feedback yet</h3>
        <p style={{ color:P.sub, fontSize:14, margin:0 }}>
          {event?.status === 'completed'
            ? 'Feedback emails were sent — responses will appear here as guests submit them.'
            : 'Feedback is collected automatically when the event is marked as completed.'}
        </p>
      </div>
    </div>
  );

  const responseRate = data.total > 0 ? Math.round((data.count/data.total)*100) : 0;

  return (
    <div style={{ maxWidth:900, margin:'0 auto', padding:'32px 24px', color:P.text, fontFamily:'system-ui,-apple-system,sans-serif' }}>

      <div style={{ marginBottom:28 }}>
        <h2 style={{ margin:'0 0 6px', fontSize:22, fontWeight:800, color:P.text, letterSpacing:'-0.02em' }}>⭐ Guest Feedback</h2>
        <p style={{ margin:0, color:P.sub, fontSize:13 }}>
          {data.count} response{data.count!==1?'s':''} · {responseRate}% response rate ({data.count} of {data.total} attending guests)
        </p>
      </div>

      {/* Top two cards */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:18 }}>

        {/* Overall score */}
        <div style={card}>
          <p style={sectionLabel}>Overall Score</p>
          <div style={{ display:'flex', alignItems:'baseline', gap:10, marginBottom:12 }}>
            <span style={{ fontSize:52, fontWeight:800, color:P.text, lineHeight:1 }}>{data.averages?.overall ?? '—'}</span>
            <span style={{ color:P.muted, fontSize:16 }}>/ 5.0</span>
          </div>
          <Stars value={data.averages?.overall} size={28} />
          <p style={{ margin:'12px 0 0', fontSize:12, color:P.muted }}>
            {data.count} submitted · avg across all categories
          </p>
        </div>

        {/* Rating distribution */}
        <div style={card}>
          <p style={sectionLabel}>Experience Rating Distribution</p>
          {[5,4,3,2,1].map(n => (
            <DistributionBar key={n} label={`${n}★`} count={data.distribution?.[n]||0} total={data.count} />
          ))}
        </div>
      </div>

      {/* Category breakdown */}
      <div style={card}>
        <p style={sectionLabel}>Category Breakdown</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:14 }}>
          {CATS.map(cat => (
            <div key={cat.key} style={{ background:P.panel, padding:'18px', borderRadius:12, textAlign:'center', border:`1px solid ${P.border}` }}>
              <div style={{ fontSize:24, marginBottom:10 }}>{cat.icon}</div>
              <p style={{ fontSize:10, fontWeight:700, color:P.muted, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.08em' }}>{cat.label}</p>
              <p style={{ fontSize:24, fontWeight:800, color:P.text, margin:'0 0 8px' }}>{data.averages?.[cat.key] ?? '—'}</p>
              <Stars value={data.averages?.[cat.key]} size={14} />
            </div>
          ))}
        </div>
      </div>

      {/* Comments */}
      {data.comments?.length > 0 && (
        <div style={card}>
          <p style={sectionLabel}>Guest Comments ({data.comments.length})</p>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {data.comments.map((c,i) => (
              <div key={i} style={{ background:P.panel, borderRadius:10, padding:'14px 16px', border:`1px solid ${P.border}`, borderLeft:`3px solid ${P.amber}` }}>
                <p style={{ margin:'0 0 8px', fontSize:14, color:P.text, lineHeight:1.65, fontStyle:'italic' }}>"{c.comment}"</p>
                <p style={{ margin:0, fontSize:11, color:P.muted }}>
                  {new Date(c.submittedAt).toLocaleDateString('en-GB',{ day:'numeric', month:'short', year:'numeric' })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}