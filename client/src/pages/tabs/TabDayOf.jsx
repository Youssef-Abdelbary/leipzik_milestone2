import { useState, useEffect, useCallback } from 'react';
import { getBroadcasts, sendBroadcast, getUnseenRecipients } from '../../services/serviceBroadcast';
import { P, icons } from '../../utils/theme';

const MESSAGE_TYPES = [
  { value:'announcement', label:'📢 Announcement' },
  { value:'reminder',     label:'🔔 Reminder'     },
  { value:'update',       label:'📝 Update'        },
  { value:'followup',     label:'↩ Follow-up'     },
];

const RSVP_TARGETS = [
  { value:'all',       label:'All Guests',               desc:'Every guest regardless of RSVP status' },
  { value:'attending', label:'Attending only',            desc:'Guests who confirmed they\'re coming' },
  { value:'pending',   label:'No response yet',          desc:'Guests who haven\'t replied' },
  { value:'declined',  label:'Declined (follow-up)',     desc:'Guests who can\'t make it' },
];

const TYPE_COLORS = {
  announcement: { bg:'rgba(91,156,246,0.15)', text:P.blue   },
  reminder:     { bg:'rgba(251,191,36,0.15)', text:P.amber  },
  update:       { bg:'rgba(74,222,128,0.15)', text:P.green  },
  followup:     { bg:'rgba(192,132,252,0.15)',text:P.purple },
};

const EMPTY_FORM = {
  title:'', message:'', type:'announcement', rsvpFilter:'all', specificGuestIds:null,
};

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleString('en-GB',{ day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' });
}

// ─── Delivery progress bar ────────────────────────────────────────────────────
function DeliveryBar({ broadcast }) {
  const total     = broadcast.totalSent      || 0;
  const delivered = broadcast.totalDelivered || 0;
  const read      = broadcast.totalRead      || 0;
  if (total === 0) return null;

  const deliveredPct = Math.round((delivered/total)*100);
  const readPct      = Math.round((read/total)*100);

  return (
    <div style={{ marginTop:14, padding:'14px 16px', background:P.panel, borderRadius:10, border:`1px solid ${P.border}` }}>
      <p style={{ margin:'0 0 12px', fontSize:13, fontWeight:600, color:P.text }}>Delivery Stats</p>
      <div style={{ display:'flex', gap:20, marginBottom:14, flexWrap:'wrap' }}>
        {[
          { label:'Sent to',  value:total,            color:P.text  },
          { label:'Delivered',value:delivered,         color:P.blue  },
          { label:'Seen',     value:read,             color:P.green },
          { label:'Not seen', value:delivered-read,   color:P.red   },
        ].map(s => (
          <div key={s.label} style={{ textAlign:'center', minWidth:54 }}>
            <p style={{ margin:0, fontSize:22, fontWeight:800, color:s.color, lineHeight:1 }}>{s.value}</p>
            <p style={{ margin:'3px 0 0', fontSize:10, color:P.muted, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.label}</p>
          </div>
        ))}
      </div>
      <div style={{ height:8, borderRadius:99, background:P.hover, overflow:'hidden', position:'relative' }}>
        <div style={{ position:'absolute', left:0, top:0, height:'100%', width:`${readPct}%`, background:P.green, borderRadius:99 }}/>
        <div style={{ position:'absolute', left:`${readPct}%`, top:0, height:'100%', width:`${Math.max(0,deliveredPct-readPct)}%`, background:P.blue }}/>
      </div>
      <div style={{ display:'flex', gap:16, marginTop:8, fontSize:11, color:P.muted }}>
        {[{c:P.green,l:`Seen (${readPct}%)`},{c:P.blue,l:`Delivered, unread (${Math.max(0,deliveredPct-readPct)}%)`},{c:P.muted,l:`Not reached`}].map(x=>(
          <span key={x.l} style={{ display:'flex', alignItems:'center', gap:4 }}>
            <span style={{ width:8, height:8, borderRadius:2, background:x.c, display:'inline-block' }}/>
            {x.l}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Recipient table ──────────────────────────────────────────────────────────
function RecipientTable({ recipients }) {
  if (!recipients?.length) return null;
  return (
    <div style={{ maxHeight:280, overflowY:'auto', border:`1px solid ${P.border}`, borderRadius:10, marginTop:12 }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
        <thead>
          <tr style={{ background:P.panel, position:'sticky', top:0 }}>
            {['Guest','RSVP','Sent via','Sent at','Seen'].map(h => (
              <th key={h} style={{ textAlign:'left', padding:'9px 12px', fontSize:10, fontWeight:700, color:P.muted, textTransform:'uppercase', letterSpacing:'0.07em', borderBottom:`1px solid ${P.border}` }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {recipients.map((r,i) => (
            <tr key={i} style={{ borderBottom: i < recipients.length-1 ? `1px solid ${P.borderSub}` : 'none' }}>
              <td style={{ padding:'9px 12px' }}>
                <div style={{ fontWeight:600, color:P.text }}>{r.fullName||'—'}</div>
                <div style={{ fontSize:11, color:P.muted, fontFamily:'monospace' }}>{r.email||'—'}</div>
              </td>
              <td style={{ padding:'9px 12px', fontSize:12, color:P.sub, textTransform:'capitalize' }}>{r.rsvpStatus}</td>
              <td style={{ padding:'9px 12px' }}>
                {r.deliveryMethod==='email' && <span style={{ fontSize:11, padding:'2px 8px', borderRadius:99, background:P.blueGlow, color:P.blue, fontWeight:600 }}>📧 Email</span>}
                {r.deliveryMethod==='in_app'&& <span style={{ fontSize:11, padding:'2px 8px', borderRadius:99, background:P.greenGlow, color:P.green, fontWeight:600 }}>🔔 In-app</span>}
                {r.deliveryMethod==='none'  && <span style={{ fontSize:11, color:P.muted }}>—</span>}
              </td>
              <td style={{ padding:'9px 12px', fontSize:12, color:P.sub }}>{r.sentAt ? fmtDate(r.sentAt) : <span style={{color:P.muted}}>Not sent</span>}</td>
              <td style={{ padding:'9px 12px' }}>
                {r.readAt
                  ? <span style={{ fontSize:11, padding:'2px 8px', borderRadius:99, background:P.greenGlow, color:P.green, fontWeight:600 }}>✓ {fmtDate(r.readAt)}</span>
                  : r.sentAt ? <span style={{ fontSize:12, color:P.muted }}>Not yet</span> : <span style={{ fontSize:12, color:P.muted }}>—</span>
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function TabMessages({ eventId }) {
  const [broadcasts,    setBroadcasts]    = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [showCompose,   setShowCompose]   = useState(false);
  const [form,          setForm]          = useState(EMPTY_FORM);
  const [sending,       setSending]       = useState(false);
  const [sendError,     setSendError]     = useState(null);
  const [sendResult,    setSendResult]    = useState(null);
  const [expanded,      setExpanded]      = useState(null);
  const [showRecipients,setShowRecipients]= useState(null);
  const [fetchingUnseen,setFetchingUnseen]= useState(null);

  const load = useCallback(async () => {
    try {
      const data = await getBroadcasts(eventId);
      setBroadcasts(Array.isArray(data) ? data : []);
    } catch {
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    const timer = setTimeout(() => { load(); }, 0);
    return () => clearTimeout(timer);
  }, [load]);
  useEffect(() => {
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  const handleFollowUp = async (broadcast) => {
    setFetchingUnseen(broadcast._id);
    try {
      const result = await getUnseenRecipients(eventId, broadcast._id);
      setForm({ title:`Follow-up: ${broadcast.title}`, message:broadcast.message, type:'followup', rsvpFilter:'all', specificGuestIds:result.unseen.map(r=>r.guestId) });
      setSendResult(null); setSendError(null); setShowCompose(true);
    } catch {
      setForm({ title:`Follow-up: ${broadcast.title}`, message:broadcast.message, type:'followup', rsvpFilter:'all', specificGuestIds:null });
      setSendResult(null); setSendError(null); setShowCompose(true);
    } finally {
      setFetchingUnseen(null);
    }
  };

  const handleSend = async () => {
    setSendError(null);
    if (!form.title.trim())   { setSendError('Title is required');   return; }
    if (!form.message.trim()) { setSendError('Message is required'); return; }
    setSending(true);
    try {
      const payload = { title:form.title, message:form.message, type:form.type };
      if (form.specificGuestIds?.length) payload.specificGuestIds = form.specificGuestIds;
      else payload.rsvpFilter = form.rsvpFilter;
      const result = await sendBroadcast(eventId, payload);
      setSendResult(result);
      setBroadcasts(prev => [result.broadcast, ...prev]);
      setForm(EMPTY_FORM);
      setTimeout(() => { setShowCompose(false); setSendResult(null); }, 3000);
    } catch (err) {
      setSendError(err.message);
    } finally {
      setSending(false);
    }
  };

  const set = (k,v) => setForm(p => ({...p,[k]:v}));
  const isTargeted = form.specificGuestIds?.length > 0;

  // ── Shared input style ────────────────────────────────────────────────────
  const inp = {
    width:'100%', padding:'11px 14px', borderRadius:9,
    border:`1px solid ${P.border}`, background:P.hover,
    color:P.text, fontSize:14, outline:'none',
    boxSizing:'border-box', fontFamily:'inherit',
    transition:'border-color 0.15s',
  };
  const fieldLabel = (text) => (
    <label style={{ display:'block', fontSize:12, fontWeight:600, color:P.sub, marginBottom:7, textTransform:'uppercase', letterSpacing:'0.06em' }}>{text}</label>
  );

  const contextHint = isTargeted
    ? `📎 Sending to ${form.specificGuestIds.length} guest${form.specificGuestIds.length!==1?'s':''} who haven't read the original.`
    : form.rsvpFilter==='all'       ? '📨 Goes to all guests via email (if configured) and in-app for those with accounts.'
    : form.rsvpFilter==='attending' ? '✅ Only confirmed attendees — good for logistics like venue directions.'
    : form.rsvpFilter==='pending'   ? '⏳ Guests who haven\'t responded — good for RSVP deadline nudges.'
    : '↩ Guests who declined — use sparingly (e.g. date change or re-invitation).';

  return (
    <div style={{ maxWidth:900, margin:'0 auto', padding:'28px 24px', fontFamily:'system-ui,-apple-system,sans-serif', color:P.text }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <h2 style={{ margin:0, fontSize:22, fontWeight:800, color:P.text }}>💬 Guest Messages</h2>
          <p style={{ margin:'5px 0 0', fontSize:13, color:P.sub }}>Broadcast announcements via email and in-app notifications.</p>
        </div>
        {!showCompose && (
          <button
            onClick={() => { setForm(EMPTY_FORM); setShowCompose(true); setSendError(null); setSendResult(null); }}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 20px', background:P.blue, color:'#fff', border:'none', borderRadius:9, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit', flexShrink:0, transition:'opacity 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.opacity='0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity='1'}
          >
            {icons.send} New Message
          </button>
        )}
      </div>

      {error && <div style={{ background:P.redGlow, color:P.red, borderRadius:9, padding:'10px 14px', fontSize:13, marginBottom:20, border:`1px solid ${P.red}33` }}>{error}</div>}

      {/* ── Compose panel ────────────────────────────────────────────────── */}
      {showCompose && (
        <div style={{ background:P.surface, border:`1px solid ${P.border}`, borderRadius:14, padding:'24px', marginBottom:22, boxShadow:'0 4px 20px rgba(0,0,0,0.25)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <p style={{ margin:0, fontSize:15, fontWeight:700, color:P.text }}>Compose Broadcast</p>
            <button onClick={() => { setShowCompose(false); setSendError(null); setForm(EMPTY_FORM); }} style={{ background:'none', border:'none', color:P.muted, cursor:'pointer', display:'flex', padding:4 }}>{icons.x}</button>
          </div>

          {sendError && (
            <div style={{ background:P.redGlow, color:P.red, border:`1px solid ${P.red}33`, borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:16 }}>{sendError}</div>
          )}

          {/* Success */}
          {sendResult && (
            <div style={{ background:P.greenGlow, color:P.green, border:`1px solid ${P.green}33`, borderRadius:8, padding:'14px', fontSize:13, marginBottom:14 }}>
              <p style={{ margin:'0 0 4px', fontWeight:700 }}>✓ Broadcast sent!</p>
              <p style={{ margin:0 }}>
                Sent to {sendResult.recipientCount} guest(s) · Delivered to {sendResult.deliveredCount}
                {!sendResult.emailEnabled && <span style={{ color:P.amber }}> (email not configured — in-app only)</span>}
              </p>
            </div>
          )}

          {!sendResult && (
            <>
              {/* Subject */}
              <div style={{ marginBottom:16 }}>
                {fieldLabel('Subject / Title *')}
                <input
                  style={inp}
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                  placeholder="e.g. Doors open at 6 PM — see you soon!"
                  onFocus={e => e.target.style.borderColor=P.blue}
                  onBlur={e => e.target.style.borderColor=P.border}
                />
              </div>

              {/* Message body */}
              <div style={{ marginBottom:16 }}>
                {fieldLabel('Message *')}
                <textarea
                  style={{ ...inp, minHeight:110, resize:'vertical', lineHeight:1.6 }}
                  value={form.message}
                  onChange={e => set('message', e.target.value)}
                  placeholder="Write your message to guests…"
                  onFocus={e => e.target.style.borderColor=P.blue}
                  onBlur={e => e.target.style.borderColor=P.border}
                />
              </div>

              {/* Message type — FULL WIDTH */}
              <div style={{ marginBottom:16 }}>
                {fieldLabel('Message Type')}
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {MESSAGE_TYPES.map(t => {
                    const tc = TYPE_COLORS[t.value] || TYPE_COLORS.announcement;
                    const isSelected = form.type === t.value;
                    return (
                      <button
                        key={t.value}
                        onClick={() => set('type', t.value)}
                        style={{
                          flex:       '1 1 auto',
                          padding:    '10px 14px',
                          borderRadius: 9,
                          border:     `1px solid ${isSelected ? tc.text+'55' : P.border}`,
                          background: isSelected ? tc.bg : P.hover,
                          color:      isSelected ? tc.text : P.sub,
                          fontSize:   13,
                          fontWeight: 600,
                          cursor:     'pointer',
                          fontFamily: 'inherit',
                          transition: 'all 0.15s',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Send to — FULL WIDTH */}
              <div style={{ marginBottom:16 }}>
                {fieldLabel('Send To')}
                {isTargeted ? (
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ flex:1, padding:'11px 14px', borderRadius:9, border:`1px solid ${P.purple}44`, background:P.purpleGlow, fontSize:14, color:P.purple, fontWeight:600 }}>
                      📎 {form.specificGuestIds.length} specific guest{form.specificGuestIds.length!==1?'s':''} (unseen recipients)
                    </div>
                    <button
                      onClick={() => set('specificGuestIds', null)}
                      title="Remove targeting — use RSVP filter instead"
                      style={{ padding:'11px 14px', borderRadius:9, border:`1px solid ${P.border}`, background:P.hover, fontSize:13, color:P.sub, cursor:'pointer', flexShrink:0, fontFamily:'inherit', transition:'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.color=P.text; e.currentTarget.style.borderColor=P.sub; }}
                      onMouseLeave={e => { e.currentTarget.style.color=P.sub;  e.currentTarget.style.borderColor=P.border; }}
                    >
                      ✕ Remove
                    </button>
                  </div>
                ) : (
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    {RSVP_TARGETS.map(t => {
                      const isSel = form.rsvpFilter === t.value;
                      return (
                        <button
                          key={t.value}
                          onClick={() => set('rsvpFilter', t.value)}
                          style={{
                            padding:    '12px 14px',
                            borderRadius: 9,
                            border:     `1px solid ${isSel ? P.blue+'55' : P.border}`,
                            background: isSel ? P.blueGlow : P.hover,
                            color:      isSel ? P.blue : P.sub,
                            fontSize:   13,
                            fontWeight: 600,
                            cursor:     'pointer',
                            textAlign:  'left',
                            fontFamily: 'inherit',
                            transition: 'all 0.15s',
                          }}
                        >
                          <div style={{ marginBottom:3 }}>{t.label}</div>
                          <div style={{ fontSize:11, color:isSel?P.blue+'99':P.muted, fontWeight:400 }}>{t.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Context hint */}
              <div style={{ padding:'10px 14px', background:P.panel, borderRadius:8, fontSize:12, color:P.sub, marginBottom:18, lineHeight:1.5 }}>
                {contextHint}
              </div>

              {/* Actions */}
              <div style={{ display:'flex', gap:10 }}>
                <button
                  onClick={() => { setShowCompose(false); setSendError(null); setForm(EMPTY_FORM); }}
                  style={{ padding:'11px 20px', borderRadius:9, border:`1px solid ${P.border}`, background:'transparent', color:P.sub, fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={sending}
                  style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'11px 24px', borderRadius:9, border:'none', background: sending?P.muted:P.blue, color:'#fff', fontWeight:600, fontSize:14, cursor:sending?'not-allowed':'pointer', fontFamily:'inherit', transition:'opacity 0.15s' }}
                >
                  {icons.send}
                  {sending ? 'Sending…' : isTargeted ? `Send to ${form.specificGuestIds.length} guests` : 'Send Broadcast'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Broadcast history ────────────────────────────────────────────── */}
      {loading ? (
        <p style={{ color:P.muted, fontSize:14 }}>Loading messages…</p>
      ) : broadcasts.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px', background:P.surface, borderRadius:14, border:`1px solid ${P.border}` }}>
          <p style={{ fontSize:36, margin:'0 0 12px' }}>💬</p>
          <p style={{ fontWeight:600, color:P.text, fontSize:16, margin:'0 0 8px' }}>No messages sent yet</p>
          <p style={{ color:P.sub, fontSize:14 }}>Use broadcasts to communicate with guests on the day of the event.</p>
        </div>
      ) : (
        <div>
          <p style={{ fontSize:12, color:P.muted, marginBottom:12 }}>
            {broadcasts.length} broadcast{broadcasts.length!==1?'s':''} sent · auto-refreshes every 30s
          </p>

          {broadcasts.map(bc => {
            const isOpen      = expanded === bc._id;
            const showRecips  = showRecipients === bc._id;
            const tc          = TYPE_COLORS[bc.type] || TYPE_COLORS.announcement;
            const unseenCount = (bc.totalDelivered||0) - (bc.totalRead||0);
            const isFetching  = fetchingUnseen === bc._id;

            return (
              <div key={bc._id} style={{ background:P.surface, border:`1px solid ${P.border}`, borderRadius:12, marginBottom:10, overflow:'hidden', transition:'border-color 0.15s' }}>
                {/* Card header */}
                <div
                  style={{ display:'flex', alignItems:'center', gap:12, padding:'15px 18px', cursor:'pointer' }}
                  onClick={() => setExpanded(isOpen ? null : bc._id)}
                >
                  <span style={{ padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:700, background:tc.bg, color:tc.text, flexShrink:0, whiteSpace:'nowrap' }}>
                    {MESSAGE_TYPES.find(t=>t.value===bc.type)?.label || bc.type}
                  </span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ margin:0, fontSize:14, fontWeight:700, color:P.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{bc.title}</p>
                    <p style={{ margin:'3px 0 0', fontSize:11, color:P.muted }}>
                      {fmtDate(bc.createdAt)} · {bc.totalSent||0} sent ·{' '}
                      <span style={{color:P.green}}>{bc.totalRead||0} seen</span>
                      {unseenCount>0 && <span style={{color:P.red}}> · {unseenCount} not seen</span>}
                    </p>
                  </div>

                  {/* Follow-up button */}
                  {unseenCount > 0 && (
                    <button
                      onClick={e => { e.stopPropagation(); handleFollowUp(bc); }}
                      disabled={isFetching}
                      style={{ padding:'5px 12px', borderRadius:7, border:`1px solid ${P.red}44`, background:P.redGlow, color: isFetching?P.muted:P.red, fontSize:12, fontWeight:600, cursor:isFetching?'not-allowed':'pointer', whiteSpace:'nowrap', flexShrink:0, fontFamily:'inherit', transition:'all 0.15s' }}
                    >
                      {isFetching ? '⟳ Loading…' : `↩ Follow-up (${unseenCount})`}
                    </button>
                  )}

                  <span style={{ color:P.muted, fontSize:14, flexShrink:0 }}>{isOpen ? '▲' : '▼'}</span>
                </div>

                {/* Expanded */}
                {isOpen && (
                  <div style={{ padding:'0 18px 18px', borderTop:`1px solid ${P.borderSub}` }}>
                    <p style={{ margin:'14px 0', fontSize:13, background:P.panel, padding:'12px 16px', borderRadius:8, color:P.sub, lineHeight:1.7, borderLeft:`3px solid ${tc.text}`, whiteSpace:'pre-wrap' }}>
                      {bc.message}
                    </p>
                    <DeliveryBar broadcast={bc} />
                    <div style={{ marginTop:14 }}>
                      <button
                        onClick={() => setShowRecipients(showRecips ? null : bc._id)}
                        style={{ padding:'7px 14px', borderRadius:7, border:`1px solid ${P.border}`, background:P.hover, color:P.sub, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.color=P.text; e.currentTarget.style.borderColor=P.sub; }}
                        onMouseLeave={e => { e.currentTarget.style.color=P.sub;  e.currentTarget.style.borderColor=P.border; }}
                      >
                        {showRecips ? '▲ Hide recipients' : `▼ Show recipients (${bc.recipients?.length||0})`}
                      </button>
                    </div>
                    {showRecips && <RecipientTable recipients={bc.recipients}/>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}