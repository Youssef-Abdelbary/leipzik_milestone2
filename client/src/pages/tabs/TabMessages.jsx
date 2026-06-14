import { useState, useEffect, useCallback } from 'react';
import { getBroadcasts, sendBroadcast } from '../../services/serviceBroadcast';

const MESSAGE_TYPES = [
  { value: 'announcement', label: '📢 Announcement' },
  { value: 'reminder',     label: '🔔 Reminder'     },
  { value: 'update',       label: '📝 Update'        },
  { value: 'followup',     label: '↩ Follow-up'     },
];

const RSVP_TARGETS = [
  { value: 'all',       label: 'All Guests'           },
  { value: 'attending', label: 'Attending only'        },
  { value: 'pending',   label: 'No response yet'      },
  { value: 'declined',  label: 'Declined (follow-up)' },
];

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const TYPE_COLORS = {
  announcement: { bg: '#EFF6FF', text: '#1D4ED8' },
  reminder:     { bg: '#FFF7ED', text: '#C2410C' },
  update:       { bg: '#F0FDF4', text: '#166534' },
  followup:     { bg: '#FDF4FF', text: '#7E22CE' },
};

const EMPTY_FORM = { title: '', message: '', type: 'announcement', rsvpFilter: 'all' };

export default function TabMessages({ eventId }) {
  const [broadcasts, setBroadcasts]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [showCompose, setShowCompose] = useState(false);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [sending, setSending]         = useState(false);
  const [sendError, setSendError]     = useState(null);
  const [sendSuccess, setSendSuccess] = useState(null);
  const [expanded, setExpanded]       = useState(null);

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
    const init = async () => { await load(); };
    init();
  }, [load]);

  const handleSend = async () => {
    setSendError(null);
    if (!form.title.trim())   { setSendError('Title is required');   return; }
    if (!form.message.trim()) { setSendError('Message is required'); return; }
    setSending(true);
    try {
      const result = await sendBroadcast(eventId, form);
      setSendSuccess(result.message || `Sent to ${result.recipientCount} guest(s)`);
      setBroadcasts(prev => [result.broadcast, ...prev]);
      setForm(EMPTY_FORM);
      setTimeout(() => { setShowCompose(false); setSendSuccess(null); }, 2500);
    } catch (err) {
      setSendError(err.message);
    } finally {
      setSending(false);
    }
  };

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const s = {
    page:       { maxWidth: 860, margin: '0 auto', padding: '28px 24px', fontFamily: 'system-ui, -apple-system, sans-serif' },
    hdr:        { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
    h1:         { margin: 0, fontSize: 22, fontWeight: 800, color: '#0F172A' },
    sub:        { margin: '4px 0 0', fontSize: 14, color: '#64748B' },
    composeBtn: { padding: '10px 20px', background: '#0F172A', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
    composeBox: { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: 24, marginBottom: 20, boxShadow: '0 2px 8px rgba(15,23,42,0.06)' },
    composeH:   { margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: '#0F172A' },
    field:      { marginBottom: 14 },
    label:      { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 },
    inp:        { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', color: '#0F172A' },
    row:        { display: 'flex', gap: 12, marginBottom: 14 },
    half:       { flex: 1 },
    errBox:     { background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 14 },
    successBox: { background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 14 },
    hint:       { fontSize: 12, color: '#94A3B8', marginTop: 6 },
    sendRow:    { display: 'flex', gap: 10, marginTop: 4 },
    cancelBtn:  { padding: '10px 20px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', color: '#374151', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' },
    sendBtn:    { padding: '10px 24px', borderRadius: 8, border: 'none', background: sending ? '#94A3B8' : '#0F172A', color: '#fff', fontWeight: 600, fontSize: 14, cursor: sending ? 'not-allowed' : 'pointer', fontFamily: 'inherit' },
    bcard:      { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, marginBottom: 10, overflow: 'hidden' },
    bcardHdr:   { display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', cursor: 'pointer' },
    bcardBody:  { padding: '0 20px 16px', borderTop: '1px solid #F1F5F9' },
    rTable:     { width: '100%', borderCollapse: 'collapse', marginTop: 12, fontSize: 13 },
    th:         { textAlign: 'left', padding: '7px 8px', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '1px solid #F1F5F9' },
    td:         { padding: '8px 8px', borderBottom: '1px solid #F8FAFC', color: '#374151' },
    empty:      { textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0' },
    errPage:    { background: '#FEF2F2', color: '#991B1B', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 20 },
  };

  const typeBadge = (type) => {
    const c = TYPE_COLORS[type] || TYPE_COLORS.announcement;
    return { padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: c.bg, color: c.text };
  };

  return (
    <div style={s.page}>
      <div style={s.hdr}>
        <div>
          <h2 style={s.h1}>💬 Guest Messages</h2>
          <p style={s.sub}>Send announcements, reminders and follow-ups to your guests.</p>
        </div>
        {!showCompose && (
          <button style={s.composeBtn} onClick={() => { setShowCompose(true); setSendError(null); setSendSuccess(null); }}>
            + New Message
          </button>
        )}
      </div>

      {error && <div style={s.errPage}>{error}</div>}

      {showCompose && (
        <div style={s.composeBox}>
          <p style={s.composeH}>Compose Broadcast</p>
          {sendError   && <div style={s.errBox}>{sendError}</div>}
          {sendSuccess && <div style={s.successBox}>✓ {sendSuccess}</div>}

          <div style={s.field}>
            <label style={s.label}>Subject / Title *</label>
            <input style={s.inp} value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Doors open at 6 PM — see you soon!" />
          </div>

          <div style={s.field}>
            <label style={s.label}>Message *</label>
            <textarea style={{ ...s.inp, minHeight: 100, resize: 'vertical' }} value={form.message} onChange={e => set('message', e.target.value)} placeholder="Write your message to guests…" />
          </div>

          <div style={s.row}>
            <div style={s.half}>
              <label style={s.label}>Message Type</label>
              <select style={s.inp} value={form.type} onChange={e => set('type', e.target.value)}>
                {MESSAGE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div style={s.half}>
              <label style={s.label}>Send To</label>
              <select style={s.inp} value={form.rsvpFilter} onChange={e => set('rsvpFilter', e.target.value)}>
                {RSVP_TARGETS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <p style={s.hint}>
            {form.rsvpFilter === 'all'       && '📨 Will be sent to all guests on this event.'}
            {form.rsvpFilter === 'attending' && '✅ Will be sent only to guests who confirmed attendance.'}
            {form.rsvpFilter === 'pending'   && '⏳ Will be sent to guests who have not yet responded.'}
            {form.rsvpFilter === 'declined'  && '↩ Will be sent to guests who declined.'}
          </p>

          <div style={s.sendRow}>
            <button style={s.cancelBtn} onClick={() => { setShowCompose(false); setSendError(null); setSendSuccess(null); }}>Cancel</button>
            <button style={s.sendBtn} disabled={sending} onClick={handleSend}>
              {sending ? 'Sending…' : '📤 Send Broadcast'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ color: '#94A3B8', fontSize: 14 }}>Loading messages…</p>
      ) : broadcasts.length === 0 ? (
        <div style={s.empty}>
          <p style={{ fontSize: 36, margin: '0 0 12px' }}>💬</p>
          <p style={{ fontWeight: 600, color: '#0F172A', fontSize: 16, margin: '0 0 8px' }}>No messages sent yet</p>
          <p style={{ color: '#64748B', fontSize: 14 }}>Use broadcasts to communicate with your guests.</p>
        </div>
      ) : (
        <div>
          <p style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>{broadcasts.length} broadcast{broadcasts.length !== 1 ? 's' : ''} sent</p>
          {broadcasts.map(bc => {
            const isOpen = expanded === bc._id;
            const tc = TYPE_COLORS[bc.type] || TYPE_COLORS.announcement;
            return (
              <div key={bc._id} style={s.bcard}>
                <div style={s.bcardHdr} onClick={() => setExpanded(isOpen ? null : bc._id)}>
                  <span style={typeBadge(bc.type)}>
                    {MESSAGE_TYPES.find(t => t.value === bc.type)?.label || bc.type}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bc.title}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94A3B8' }}>
                      {fmtDate(bc.createdAt)} · Sent to {bc.totalSent} guest{bc.totalSent !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <span style={{ fontSize: 16, color: '#94A3B8' }}>{isOpen ? '▲' : '▼'}</span>
                </div>

                {isOpen && (
                  <div style={s.bcardBody}>
                    <p style={{ margin: '12px 0 8px', fontSize: 13, background: '#F8FAFC', padding: '12px 16px', borderRadius: 8, color: '#374151', lineHeight: 1.6, borderLeft: `3px solid ${tc.text}` }}>
                      {bc.message}
                    </p>
                    {bc.recipients && bc.recipients.length > 0 && (
                      <>
                        <p style={{ margin: '16px 0 4px', fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Recipients ({bc.recipients.length})</p>
                        <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: 8 }}>
                          <table style={s.rTable}>
                            <thead>
                              <tr>
                                <th style={s.th}>Name</th>
                                <th style={s.th}>Email</th>
                                <th style={s.th}>RSVP at send</th>
                              </tr>
                            </thead>
                            <tbody>
                              {bc.recipients.map((r, i) => (
                                <tr key={i}>
                                  <td style={s.td}>{r.fullName || '—'}</td>
                                  <td style={{ ...s.td, fontFamily: 'monospace', fontSize: 12, color: '#64748B' }}>{r.email || '—'}</td>
                                  <td style={s.td}>{r.rsvpStatus || 'pending'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
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