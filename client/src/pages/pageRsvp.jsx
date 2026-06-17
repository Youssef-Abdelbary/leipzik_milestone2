import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { P, icons, GlassPanel } from '../components/componentTheme';
import AppHeader from '../components/componentAppHeader';
import '../components/componentTheme.css';

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
  const [result, setResult]           = useState(null);
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

  const inp = {
    width: '100%', padding: '11px 14px', borderRadius: 10,
    border: `1px solid ${P.border}`, background: 'rgba(30,30,41,0.7)',
    color: P.text, fontSize: 14, outline: 'none',
    boxSizing: 'border-box', fontFamily: 'inherit',
    transition: 'border-color 0.15s',
  };

  if (loading) return (
    <div style={s.page}>
      <style>{animations}</style>
      <AppHeader crumb="RSVP" />
      <div style={s.pageInner}>
        <GlassPanel style={{ ...s.card, textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: `3px solid ${P.border}`, borderTopColor: P.blue, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
        </GlassPanel>
      </div>
    </div>
  );

  // ─── Success: Attending with QR ──────────────────────────────────────────────
  if (result && result.chosen === 'attending') return (
    <div style={s.page}>
      <style>{animations}</style>
      <AppHeader crumb="RSVP" right={
        <span style={{ padding:'4px 12px', borderRadius:99, fontSize:11, fontWeight:700, background:P.tealGlow, color:P.teal, border:`1px solid ${P.teal}44` }}>Confirmed ✓</span>
      }/>
      <div style={s.pageInner}>
      <GlassPanel style={{ ...s.card, maxWidth: 520, animation: 'cardIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both' }}>
        <div style={{ color: P.amber, display: 'flex', justifyContent: 'center', transform: 'scale(2.4)', marginBottom: 28, animation: 'sparkle 0.6s ease both 0.2s' }}>
          {icons.sparkles}
        </div>
        <h1 style={s.title}>You&apos;re going!</h1>
        <p style={s.sub}>
          {result.fullname ? `Thanks for confirming, ${result.fullname.split(' ')[0]}!` : 'Thanks for confirming!'}
          {' '}See you at <strong style={{ color: P.text }}>{eventInfo?.eventTitle || 'the event'}</strong>.
        </p>

        {result.qrDataURL && (
          <GlassPanel style={{
            padding: '28px 24px',
            margin: '24px 0 20px',
            textAlign: 'center',
            animation: 'cardIn 0.4s ease both 0.15s',
          }}>
            <p style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 700, color: P.text, fontFamily: 'var(--font-display)' }}>
              Your Check-in QR Code
            </p>
            <div style={{
              display: 'inline-block',
              padding: 12,
              background: '#ffffff',
              borderRadius: 14,
              boxShadow: `0 4px 28px rgba(0,0,0,0.45), 0 0 0 1px ${P.border}`,
              marginBottom: 16,
              animation: 'cardIn 0.5s ease both 0.3s',
            }}>
              <img
                src={result.qrDataURL}
                alt="Your QR code"
                style={{ width: 220, height: 220, display: 'block', borderRadius: 8 }}
              />
            </div>
            <p style={{ margin: '0 0 8px', fontSize: 13, color: P.sub, lineHeight: 1.6 }}>
              Show this QR code at the entrance for instant check-in.
            </p>
            <p style={{ margin: 0, fontSize: 11, color: P.muted, fontFamily: 'monospace', letterSpacing: '0.05em' }}>
              {result.qrCode}
            </p>
            <div style={{ margin: '14px 0 0', padding: '10px 14px', background: P.blueGlow, border: `1px solid ${P.blue}33`, borderRadius: 9, fontSize: 12, color: P.blue, display: 'flex', alignItems: 'center', gap: 8 }}>
              {icons.mail} A copy with this QR code has been sent to your email.
            </div>
          </GlassPanel>
        )}

        <button
          onClick={() => window.print()}
          style={{ ...s.btn, background: 'rgba(19,19,30,0.7)', color: P.text, border: `1px solid ${P.border}`, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          onMouseEnter={e => e.currentTarget.style.borderColor = P.sub}
          onMouseLeave={e => e.currentTarget.style.borderColor = P.border}
        >
          {icons.printer} Save / Print QR Code
        </button>
      </GlassPanel>
      </div>
    </div>
  );

  // ─── Success: Declined ────────────────────────────────────────────────────────
  if (result && result.chosen === 'declined') return (
    <div style={s.page}>
      <style>{animations}</style>
      <AppHeader crumb="RSVP" right={
        <span style={{ padding:'4px 12px', borderRadius:99, fontSize:11, fontWeight:700, background:P.roseGlow, color:P.rose, border:`1px solid ${P.rose}44` }}>Declined</span>
      }/>
      <div style={s.pageInner}>
      <GlassPanel style={{ ...s.card, animation: 'cardIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both' }}>
        <div style={{ color: P.rose, display: 'flex', justifyContent: 'center', transform: 'scale(2.4)', marginBottom: 28 }}>
          {icons.frown}
        </div>
        <h1 style={s.title}>See you next time!</h1>
        <p style={s.sub}>
          {result.fullname ? `We're sorry you can't make it, ${result.fullname.split(' ')[0]}.` : "We're sorry you can't make it."}
          {' '}Thanks for letting us know.
        </p>
      </GlassPanel>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <style>{animations}</style>
      <AppHeader crumb="RSVP" right={
        eventInfo?.eventTitle
          ? <span style={{ fontSize:13, fontWeight:600, color:P.sub, maxWidth:240, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{eventInfo.eventTitle}</span>
          : null
      }/>
      <div style={s.pageInner}>
      <GlassPanel style={{ ...s.card, animation: 'cardIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both' }}>
        <div style={{ color: P.blue, display: 'flex', justifyContent: 'center', transform: 'scale(2.2)', marginBottom: 20 }}>
          {icons.ticket}
        </div>
        <h1 style={s.title}>You&apos;re Invited!</h1>

        {eventInfo && (
          <GlassPanel style={{ padding: '16px 20px', marginBottom: 24, textAlign: 'left' }}>
            <p style={{ margin: '0 0 14px', fontSize: 18, fontWeight: 700, color: P.text, fontFamily: 'var(--font-display)' }}>{eventInfo.eventTitle}</p>
            {eventInfo.date && (
              <div style={s.detailRow}>
                <span style={{ color: P.blue, display: 'flex', flexShrink: 0 }}>{icons.calendar}</span>
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
                <span style={{ color: P.teal, display: 'flex', flexShrink: 0 }}>{icons.mapPin}</span>
                <div>
                  <p style={s.detailLabel}>Venue</p>
                  <p style={s.detailVal}>{eventInfo.venueName}</p>
                </div>
              </div>
            )}
            {eventInfo.dressCode && (
              <div style={s.detailRow}>
                <span style={{ color: P.purple, display: 'flex', flexShrink: 0 }}>{icons.tag}</span>
                <div>
                  <p style={s.detailLabel}>Dress Code</p>
                  <p style={s.detailVal}>{eventInfo.dressCode}</p>
                </div>
              </div>
            )}
            {Array.isArray(eventInfo.agenda) && eventInfo.agenda.length > 0 && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${P.border}` }}>
                <p style={{ ...s.detailLabel, marginBottom: 8 }}>Agenda</p>
                {eventInfo.agenda.map((a, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: P.blue, fontWeight: 600, minWidth: 48 }}>{a.time}</span>
                    <div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: P.text }}>{a.title}</p>
                      {a.description && <p style={{ margin: '2px 0 0', fontSize: 12, color: P.sub }}>{a.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassPanel>
        )}

        {error && (
          <div style={{ background: P.redGlow, color: P.red, padding: '10px 14px', borderRadius: 9, fontSize: 13, marginBottom: 20, border: `1px solid ${P.red}33`, display: 'flex', alignItems: 'center', gap: 8 }}>
            {icons.warning} {error}
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <p style={s.sectionLabel}>Will you be attending?</p>
          <button
            onClick={() => handleSubmit('attending')}
            disabled={submitting}
            style={{ ...s.btn, background: `linear-gradient(135deg, ${P.green} 0%, ${P.teal} 100%)`, color: '#0a0a0f', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 700 }}
            onMouseEnter={e => { if (!submitting) e.currentTarget.style.opacity = '0.88'; }}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            {icons.check} Yes, I&apos;ll be there!
          </button>
          <button
            onClick={() => handleSubmit('declined')}
            disabled={submitting}
            style={{ ...s.btn, background: 'transparent', color: P.sub, border: `1px solid ${P.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            onMouseEnter={e => { if (!submitting) { e.currentTarget.style.borderColor = P.red + '66'; e.currentTarget.style.color = P.red; } }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = P.border; e.currentTarget.style.color = P.sub; }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            {icons.x} Sorry, I can&apos;t make it
          </button>
        </div>

        <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${P.borderSub}` }}>
          <p style={s.sectionLabel}>Dietary Preferences (optional)</p>
          <input
            list="dietary-options"
            value={dietary}
            onChange={e => setDietary(e.target.value)}
            placeholder="e.g. Vegetarian, Vegan, Halal…"
            style={inp}
            onFocus={e => e.target.style.borderColor = P.blue}
            onBlur={e => e.target.style.borderColor = P.border}
          />
          <datalist id="dietary-options">
            {DIETARY_PRESETS.map(d => <option key={d} value={d} />)}
          </datalist>
        </div>

        <div style={{ marginTop: 16 }}>
          <p style={s.sectionLabel}>Special Requirements (optional)</p>
          <textarea
            value={specialReqs}
            onChange={e => setSpecialReqs(e.target.value)}
            placeholder="Wheelchair access, allergies, etc."
            rows={3}
            style={{ ...inp, resize: 'vertical' }}
            onFocus={e => e.target.style.borderColor = P.blue}
            onBlur={e => e.target.style.borderColor = P.border}
          />
        </div>

        {submitting && (
          <p style={{ color: P.muted, fontSize: 13, marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ display: 'inline-block', width: 14, height: 14, border: `2px solid ${P.border}`, borderTopColor: P.blue, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Submitting…
          </p>
        )}
      </GlassPanel>
      </div>
    </div>
  );
}

const animations = `
  @keyframes pageIn  { from { opacity:0 } to { opacity:1 } }
  @keyframes cardIn  { from { opacity:0; transform:scale(0.96) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }
  @keyframes sparkle { from { opacity:0; transform:scale(1.6) rotate(-20deg); } to { opacity:1; transform:scale(2.4) rotate(0deg); } }
  @keyframes spin    { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
`;

const s = {
  page: {
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    background: 'var(--opal-bg)',
    fontFamily: 'var(--font-body)',
    color: 'var(--opal-text)',
    animation: 'pageIn 0.3s ease',
  },
  pageInner: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  card: {
    padding: '40px 36px', width: '100%', maxWidth: 500,
    textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.55)',
  },
  title:       { fontSize: 26, fontWeight: 800, color: 'var(--opal-text)', margin: '0 0 8px', letterSpacing: '-0.02em', fontFamily: 'var(--font-display)' },
  sub:         { fontSize: 15, color: 'var(--opal-sub)', margin: '0 0 20px', lineHeight: 1.6 },
  detailRow:   { display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' },
  detailLabel: { margin: '0 0 2px', fontSize: 11, fontWeight: 700, color: 'var(--opal-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' },
  detailVal:   { margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--opal-text)' },
  sectionLabel:{ fontSize: 13, fontWeight: 700, color: 'var(--opal-sub)', margin: '0 0 10px', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.06em' },
  btn:         { width: '100%', padding: '14px 24px', borderRadius: 12, border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.18s cubic-bezier(0.34,1.56,0.64,1)' },
};
