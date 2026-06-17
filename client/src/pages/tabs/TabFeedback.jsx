import { useState, useEffect } from 'react';
import { getEventFeedbackSummary } from '../../services/serviceFeedback';
import { P, icons, icStar, GlassPanel } from '../../components/componentTheme';

const CATS = [
  { key:'experience',   label:'Overall Experience', icon: icons.sparkles  },
  { key:'food',         label:'Food & Drinks',       icon: icons.utensils  },
  { key:'venue',        label:'Venue & Space',       icon: icons.building2 },
  { key:'organisation', label:'Organisation',        icon: icons.clipboard },
];

function Stars({ value, size = 18 }) {
  if (value == null) return <span style={{ fontSize:12, color:P.muted }}>N/A</span>;
  return (
    <div style={{ display:'flex', gap:3 }}>
      {[1,2,3,4,5].map(n => (
        <span key={n} style={{ color: n<=Math.round(value) ? P.amber : P.muted, transition:'color 0.15s', lineHeight:1, display:'flex' }}>
          {icStar(size, n <= Math.round(value))}
        </span>
      ))}
    </div>
  );
}

function DistributionBar({ label, count, total }) {
  const pct = total > 0 ? Math.round((count/total)*100) : 0;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
      <span style={{ fontSize:13, fontWeight:700, color:P.text, width:36, flexShrink:0, display:'flex', alignItems:'center', gap:3 }}>
        {label}<span style={{ color:P.amber, display:'flex' }}>{icStar(11, true)}</span>
      </span>
      <div style={{ flex:1, background:'rgba(255,255,255,0.07)', borderRadius:99, height:9, overflow:'hidden', border:`1px solid ${P.borderSub}` }}>
        <div style={{ width:`${pct}%`, height:'100%', background: `linear-gradient(90deg, ${P.amber} 0%, ${P.orange} 100%)`, borderRadius:99, transition:'width 0.8s ease', boxShadow:`0 0 8px ${P.amber}44` }}/>
      </div>
      <span style={{ fontSize:12, fontWeight:700, color:P.sub, width:42, textAlign:'right', flexShrink:0 }}>{pct}%</span>
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

  if (loading) return (
    <div style={{ maxWidth:900, margin:'0 auto', padding:'32px 24px' }}>
      <style>{`@keyframes skel{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
      {[260,180,280].map((h,i) => <div key={i} style={{ height:h, background:P.surface, borderRadius:14, animation:`skel 1.4s infinite ${i*0.15}s`, marginBottom:18, border:`1px solid ${P.border}` }}/>)}
    </div>
  );

  if (error) return (
    <div style={{ maxWidth:900, margin:'0 auto', padding:'32px 24px' }}>
      <GlassPanel style={{ padding: '16px 20px', color:P.red, background:P.redGlow, border:`1px solid ${P.red}44` }}>Error: {error}</GlassPanel>
    </div>
  );

  if (!data || data.count === 0) {
    const isCompleted = event?.status === 'completed';
    return (
      <div style={{ maxWidth:900, margin:'0 auto', padding:'40px 24px', fontFamily:'var(--font-body)' }}>
        {/* Page header — consistent with other tabs */}
        <div style={{ marginBottom:32 }}>
          <h2 style={{ margin:0, fontSize:22, fontWeight:800, color:P.text, letterSpacing:'-0.02em', display:'flex', alignItems:'center', gap:10, fontFamily:'var(--font-display)' }}>
            <span style={{ color:P.amber, background:P.amberGlow, padding:7, borderRadius:9, display:'flex' }}>{icons.star}</span>
            Guest Feedback
          </h2>
        </div>

        <GlassPanel style={{ padding:'56px 40px', textAlign:'center', background:'rgba(245,166,35,0.04)', border:`1px solid ${P.amber}22` }}>
          {/* Large icon */}
          <div style={{
            width:72, height:72, borderRadius:'50%',
            background:`linear-gradient(135deg, ${P.amberGlow} 0%, rgba(251,146,60,0.10) 100%)`,
            border:`1.5px solid ${P.amber}44`,
            display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 24px',
            color:P.amber,
            boxShadow:`0 0 40px ${P.amber}22`,
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>

          <h3 style={{ margin:'0 0 10px', fontSize:20, fontWeight:800, color:P.text, fontFamily:'var(--font-display)', letterSpacing:'-0.02em' }}>
            No feedback yet
          </h3>
          <p style={{ color:P.sub, fontSize:14, margin:'0 0 28px', lineHeight:1.7, maxWidth:400, marginLeft:'auto', marginRight:'auto' }}>
            {isCompleted
              ? 'Feedback emails were sent to your guests. Responses will appear here as they submit them.'
              : 'Feedback is collected automatically once the event is marked as completed.'}
          </p>

          {/* Status chips for the four categories */}
          <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
            {CATS.map((cat, i) => {
              const colors = [P.amber, P.orange, P.teal, P.indigo];
              const glows  = [P.amberGlow, P.orangeGlow, P.tealGlow, P.indigoGlow];
              return (
                <span key={cat.key} style={{
                  display:'inline-flex', alignItems:'center', gap:6,
                  padding:'6px 14px', borderRadius:99,
                  background:glows[i], border:`1px solid ${colors[i]}33`,
                  fontSize:12, fontWeight:600, color:colors[i],
                }}>
                  {cat.icon} {cat.label}
                </span>
              );
            })}
          </div>

          {!isCompleted && (
            <p style={{ margin:'28px 0 0', fontSize:12, color:P.muted, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
              <span style={{ color:P.indigo, display:'flex' }}>{icons.info}</span>
              Change the event status to <strong style={{ color:P.teal, margin:'0 4px' }}>Completed</strong> to trigger feedback collection.
            </p>
          )}
        </GlassPanel>
      </div>
    );
  }

  const responseRate = data.total > 0 ? Math.round((data.count/data.total)*100) : 0;

  // Per-category accent colors for variety
  const CAT_COLORS = {
    experience:   { color: P.amber,  glow: P.amberGlow  },
    food:         { color: P.orange, glow: P.orangeGlow },
    venue:        { color: P.teal,   glow: P.tealGlow   },
    organisation: { color: P.indigo, glow: P.indigoGlow },
  };

  return (
    <div style={{ maxWidth:900, margin:'0 auto', padding:'32px 24px', color:P.text, fontFamily:'var(--font-body)' }}>

      <div style={{ marginBottom:28 }}>
        <h2 style={{ margin:'0 0 6px', fontSize:22, fontWeight:800, color:P.text, letterSpacing:'-0.02em', display:'flex', alignItems:'center', gap:10, fontFamily:'var(--font-display)' }}>
          <span style={{ color:P.amber, background:P.amberGlow, padding:7, borderRadius:9, display:'flex' }}>{icons.star}</span> Guest Feedback
        </h2>
        <p style={{ margin:'5px 0 0 46px', fontSize:13, color:P.sub }}>
          <strong style={{ color:P.text }}>{data.count}</strong> response{data.count!==1?'s':''} ·{' '}
          <strong style={{ color:P.teal, fontWeight:700 }}>{responseRate}%</strong> response rate
          <span style={{ color:P.muted }}> · {data.count} of {data.total} attending guests</span>
        </p>
      </div>

      {/* Top two cards */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:18 }}>

        <GlassPanel style={{ padding:'22px', background:'rgba(245,166,35,0.05)', border:`1px solid ${P.amber}22` }}>
          <p style={{ margin:'0 0 14px', fontSize:11, fontWeight:700, color:P.amber, textTransform:'uppercase', letterSpacing:'0.09em' }}>Overall Score</p>
          <div style={{ display:'flex', alignItems:'baseline', gap:10, marginBottom:12 }}>
            <span style={{ fontSize:60, fontWeight:900, color:P.amber, lineHeight:1, fontFamily:'var(--font-display)', letterSpacing:'-0.04em', textShadow:`0 0 32px ${P.amber}66` }}>{data.averages?.overall ?? '—'}</span>
            <span style={{ color:P.muted, fontSize:15, fontWeight:600 }}>/ 5.0</span>
          </div>
          <Stars value={data.averages?.overall} size={26} />
          <p style={{ margin:'12px 0 0', fontSize:12, color:P.sub }}>
            {data.count} submitted · avg across all categories
          </p>
        </GlassPanel>

        <GlassPanel style={{ padding:'22px' }}>
          <p style={{ margin:'0 0 16px', fontSize:11, fontWeight:700, color:P.sub, textTransform:'uppercase', letterSpacing:'0.09em' }}>Rating Distribution</p>
          {[5,4,3,2,1].map(n => (
            <DistributionBar key={n} label={n} count={data.distribution?.[n]||0} total={data.count} />
          ))}
        </GlassPanel>
      </div>

      {/* Category breakdown */}
      <GlassPanel style={{ padding:'22px', marginBottom:18 }}>
        <p style={{ margin:'0 0 16px', fontSize:11, fontWeight:700, color:P.sub, textTransform:'uppercase', letterSpacing:'0.09em' }}>Category Breakdown</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))', gap:14 }}>
          {CATS.map(cat => {
            const cc = CAT_COLORS[cat.key] || { color: P.blue, glow: P.blueGlow };
            return (
              <div key={cat.key}
                style={{ background:`linear-gradient(160deg, ${cc.glow} 0%, rgba(19,19,30,0.8) 100%)`, padding:'20px 16px', borderRadius:14, textAlign:'center', border:`1px solid ${cc.color}22`, transition:'all 0.18s ease' }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.borderColor=`${cc.color}55`; e.currentTarget.style.boxShadow=`0 8px 24px ${cc.glow}, 0 0 0 1px ${cc.color}22`; }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.borderColor=`${cc.color}22`; e.currentTarget.style.boxShadow='none'; }}
              >
                <div style={{ color:cc.color, background:cc.glow, display:'inline-flex', padding:8, borderRadius:10, marginBottom:12, border:`1px solid ${cc.color}33` }}>{cat.icon}</div>
                <p style={{ fontSize:11, fontWeight:700, color:P.sub, marginBottom:8, textTransform:'uppercase', letterSpacing:'0.07em' }}>{cat.label}</p>
                <p style={{ fontSize:30, fontWeight:900, color:cc.color, margin:'0 0 8px', fontFamily:'var(--font-display)', letterSpacing:'-0.03em', lineHeight:1, textShadow:`0 0 20px ${cc.color}55` }}>{data.averages?.[cat.key] ?? '—'}</p>
                <Stars value={data.averages?.[cat.key]} size={14} />
              </div>
            );
          })}
        </div>
      </GlassPanel>

      {/* Comments */}
      {data.comments?.length > 0 && (
        <GlassPanel style={{ padding:'22px' }}>
          <p style={{ margin:'0 0 16px', fontSize:11, fontWeight:700, color:P.sub, textTransform:'uppercase', letterSpacing:'0.09em' }}>
            Guest Comments <span style={{ color:P.text, fontWeight:800 }}>({data.comments.length})</span>
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {data.comments.map((c,i) => {
              const accent = [P.amber, P.indigo, P.teal, P.orange, P.purple][i % 5];
              return (
                <div key={i} style={{ background:'rgba(19,19,30,0.7)', borderRadius:12, padding:'16px 18px', border:`1px solid ${P.border}`, borderLeft:`3px solid ${accent}`, transition:'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(25,25,38,0.9)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(19,19,30,0.7)'}
                >
                  <p style={{ margin:'0 0 10px', fontSize:14, color:P.text, lineHeight:1.75, fontStyle:'italic' }}>
                    <span style={{ color:accent, fontSize:18, lineHeight:0, verticalAlign:'middle', marginRight:6 }}>"</span>{c.comment}<span style={{ color:accent, fontSize:18, lineHeight:0, verticalAlign:'middle', marginLeft:4 }}>"</span>
                  </p>
                  <p style={{ margin:0, fontSize:11, color:P.muted, display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ color:accent, display:'flex', opacity:0.7 }}>{icons.calendar}</span>
                    {new Date(c.submittedAt).toLocaleDateString('en-GB',{ day:'numeric', month:'short', year:'numeric' })}
                  </p>
                </div>
              );
            })}
          </div>
        </GlassPanel>
      )}
    </div>
  );
}
