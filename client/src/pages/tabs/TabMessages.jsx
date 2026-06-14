import { useState, useEffect, useCallback } from 'react';
import { getBroadcasts, sendBroadcast } from '../../services/serviceBroadcast';

const MESSAGE_TYPES = [
  { value: 'announcement', label: '📢 Announcement' },
  { value: 'reminder',     label: '🔔 Reminder'     },
  { value: 'update',       label: '📝 Update'        },
  { value: 'followup',     label: '↩ Follow-up'     },
];

// KAN-278: Target guests by what they've done (or not done)
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

// ─── Delivery breakdown bar (KAN-277) ─────────────────────────────────────────

function DeliveryBar({ broadcast }) {
  const total     = broadcast.totalSent      || 0;
  const delivered = broadcast.totalDelivered || 0;
  const read      = broadcast.totalRead      || 0;

  if (total === 0) return null;

  const deliveredPct = Math.round((delivered / total) * 100);
  const readPct      = Math.round((read      / total) * 100);

  return (
    <div style={{ marginTop: 14, padding: '14px 16px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
      <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Delivery Stats</p>

      <div style={{ display: 'flex', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'center', minWidth: 64 }}>
          <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0F172A' }}>{total}</p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sent to</p>
        </div>
        <div style={{ textAlign: 'center', minWidth: 64 }}>
          <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0EA5E9' }}>{delivered}</p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Delivered</p>
        </div>
        <div style={{ textAlign: 'center', minWidth: 64 }}>
          <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#16A34A' }}>{read}</p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Seen</p>
        </div>
        <div style={{ textAlign: 'center', minWidth: 64 }}>
          <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#DC2626' }}>{delivered - read}</p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Not seen</p>
        </div>
      </div>

      {/* Stacked progress bar */}
      <div style={{ height: 8, borderRadius: 99, background: '#E2E8F0', overflow: 'hidden', position: 'relative' }}>
        {/* Seen (green) */}
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${readPct}%`, background: '#16A34A', borderRadius: 99 }} />
        {/* Delivered but not seen (blue) — starts after green */}
        <div style={{ position: 'absolute', left: `${readPct}%`, top: 0, height: '100%', width: `${deliveredPct - readPct}%`, background: '#0EA5E9' }} />
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: 11, color: '#94A3B8' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: '#16A34A', display: 'inline-block' }} /> Seen ({readPct}%)
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: '#0EA5E9', display: 'inline-block' }} /> Delivered, not seen ({deliveredPct - readPct}%)
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: '#E2E8F0', display: 'inline-block' }} /> Not reached ({100 - deliveredPct}%)
        </span>
      </div>
    </div>
  );
}

// ─── Per-recipient table (KAN-277) ────────────────────────────────────────────

function RecipientTable({ recipients }) {
  if (!recipients?.length) return null;

  return (
    <div style={{ maxHeight: 280, overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: 8, marginTop: 12 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#F8FAFC', position: 'sticky', top: 0 }}>
            <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #E2E8F0' }}>Guest</th>
            <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #E2E8F0' }}>RSVP</th>
            <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #E2E8F0' }}>Sent via</th>
            <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #E2E8F0' }}>Sent at</th>
            <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #E2E8F0' }}>Seen</th>
          </tr>
        </thead>
        <tbody>
          {recipients.map((r, i) => (
            <tr key={i} style={{ borderBottom: i < recipients.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
              <td style={{ padding: '9px 12px' }}>
                <div style={{ fontWeight: 600, color: '#0F172A' }}>{r.fullName || '—'}</div>
                <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'monospace' }}>{r.email || '—'}</div>
              </td>
              <td style={{ padding: '9px 12px', fontSize: 12, color: '#64748B', textTransform: 'capitalize' }}>{r.rsvpStatus}</td>
              <td style={{ padding: '9px 12px' }}>
                {r.deliveryMethod === 'email'   && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: '#EFF6FF', color: '#1D4ED8', fontWeight: 600 }}>📧 Email</span>}
                {r.deliveryMethod === 'in_app'  && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: '#F0FDF4', color: '#166534', fontWeight: 600 }}>🔔 In-app</span>}
                {r.deliveryMethod === 'none'    && <span style={{ fontSize: 11, color: '#94A3B8' }}>—</span>}
              </td>
              <td style={{ padding: '9px 12px', fontSize: 12, color: '#64748B' }}>
                {r.sentAt ? fmtDate(r.sentAt) : <span style={{ color: '#94A3B8' }}>Not sent</span>}
              </td>
              <td style={{ padding: '9px 12px' }}>
                {r.readAt
                  ? <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: '#F0FDF4', color: '#166534', fontWeight: 600 }}>✓ {fmtDate(r.readAt)}</span>
                  : r.sentAt
                    ? <span style={{ fontSize: 12, color: '#94A3B8' }}>Not yet</span>
                    : <span style={{ fontSize: 12, color: '#94A3B8' }}>—</span>
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TabMessages({ eventId }) {
  const [broadcasts, setBroadcasts]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [showCompose, setShowCompose]   = useState(false);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [sending, setSending]           = useState(false);
  const [sendError, setSendError]       = useState(null);
  const [sendResult, setSendResult]     = useState(null);
  const [expanded, setExpanded]         = useState(null);
  const [showRecipients, setShowRecipients] = useState(null); // broadcast._id

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

  // Poll every 30 seconds to update read receipts in real time
  useEffect(() => {
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  const handleSend = async () => {
    setSendError(null);
    if (!form.title.trim())   { setSendError('Title is required');   return; }
    if (!form.message.trim()) { setSendError('Message is required'); return; }

    setSending(true);
    try {
      const result = await sendBroadcast(eventId, form);
      setSendResult(result);
      setBroadcasts(prev => [result.broadcast, ...prev]);
      setForm(EMPTY_FORM);

      // Show result for a moment then close
      setTimeout(() => {
        setShowCompose(false);
        setSendResult(null);
      }, 3000);
    } catch (err) {
      setSendError(err.message);
    } finally {
      setSending(false);
    }
  };

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const inp  = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', color: '#0F172A' };
  const lbl  = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0F172A' }}>💬 Guest Messages</h2>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#64748B' }}>
            Broadcast announcements to guests via email and in-app notifications.
          </p>
        </div>
        {!showCompose && (
          <button
            onClick={() => { setShowCompose(true); setSendError(null); setSendResult(null); }}
            style={{ padding: '10px 20px', background: '#0F172A', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            + New Message
          </button>
        )}
      </div>

      {error && <div style={{ background: '#FEF2F2', color: '#991B1B', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 20 }}>{error}</div>}

      {/* Compose panel */}
      {showCompose && (
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: 24, marginBottom: 20, boxShadow: '0 2px 8px rgba(15,23,42,0.06)' }}>
          <p style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: '#0F172A' }}>Compose Broadcast</p>

          {sendError && (
            <div style={{ background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 14 }}>
              {sendError}
            </div>
          )}

          {/* Success state — shows delivery summary */}
          {sendResult && (
            <div style={{ background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0', borderRadius: 8, padding: '14px', fontSize: 13, marginBottom: 14 }}>
              <p style={{ margin: '0 0 4px', fontWeight: 700 }}>✓ Broadcast sent!</p>
              <p style={{ margin: 0 }}>
                Sent to {sendResult.recipientCount} guest{sendResult.recipientCount !== 1 ? 's' : ''} ·
                Delivered to {sendResult.deliveredCount}
                {!sendResult.emailEnabled && (
                  <span style={{ color: '#C2410C' }}> (email not configured — only in-app notifications sent)</span>
                )}
              </p>
            </div>
          )}

          {!sendResult && (
            <>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Subject / Title *</label>
                <input style={inp} value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Doors open at 6 PM — see you soon!" />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Message *</label>
                <textarea
                  style={{ ...inp, minHeight: 100, resize: 'vertical' }}
                  value={form.message}
                  onChange={e => set('message', e.target.value)}
                  placeholder="Write your message to guests…"
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Message Type</label>
                  <select style={inp} value={form.type} onChange={e => set('type', e.target.value)}>
                    {MESSAGE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  {/* KAN-278: Targeting filter */}
                  <label style={lbl}>Send To</label>
                  <select style={inp} value={form.rsvpFilter} onChange={e => set('rsvpFilter', e.target.value)}>
                    {RSVP_TARGETS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Contextual hint based on selection */}
              <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 16px', background: '#F8FAFC', padding: '8px 12px', borderRadius: 6 }}>
                {form.rsvpFilter === 'all'       && '📨 Will be sent to all guests. Messages go via email (if configured) and in-app for guests with accounts.'}
                {form.rsvpFilter === 'attending' && '✅ Only guests who confirmed attendance. Good for logistics updates like venue directions.'}
                {form.rsvpFilter === 'pending'   && '⏳ Guests who haven"t responded yet. Good for RSVP deadline reminders.'}
                {form.rsvpFilter === 'declined'  && '↩ Guests who declined. Use sparingly — e.g. date change or last-minute re-invitation.'}
              </p>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => { setShowCompose(false); setSendError(null); }}
                  style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', color: '#374151', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={sending}
                  style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: sending ? '#94A3B8' : '#0F172A', color: '#fff', fontWeight: 600, fontSize: 14, cursor: sending ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
                >
                  {sending ? 'Sending…' : '📤 Send Broadcast'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Broadcast history */}
      {loading ? (
        <p style={{ color: '#94A3B8', fontSize: 14 }}>Loading messages…</p>
      ) : broadcasts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0' }}>
          <p style={{ fontSize: 36, margin: '0 0 12px' }}>💬</p>
          <p style={{ fontWeight: 600, color: '#0F172A', fontSize: 16, margin: '0 0 8px' }}>No messages sent yet</p>
          <p style={{ color: '#64748B', fontSize: 14 }}>Use broadcasts to communicate with your guests on the day of the event.</p>
        </div>
      ) : (
        <div>
          <p style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>
            {broadcasts.length} broadcast{broadcasts.length !== 1 ? 's' : ''} sent · auto-refreshes every 30s
          </p>

          {broadcasts.map(bc => {
            const isOpen      = expanded === bc._id;
            const showRecips  = showRecipients === bc._id;
            const tc = TYPE_COLORS[bc.type] || TYPE_COLORS.announcement;
            const unseenCount = (bc.totalDelivered || 0) - (bc.totalRead || 0);

            return (
              <div key={bc._id} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, marginBottom: 10, overflow: 'hidden' }}>

                {/* Card header */}
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', cursor: 'pointer' }}
                  onClick={() => setExpanded(isOpen ? null : bc._id)}
                >
                  <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: tc.bg, color: tc.text, flexShrink: 0 }}>
                    {MESSAGE_TYPES.find(t => t.value === bc.type)?.label || bc.type}
                  </span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {bc.title}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94A3B8' }}>
                      {fmtDate(bc.createdAt)}
                      {' · '}
                      {bc.totalSent || 0} sent
                      {' · '}
                      <span style={{ color: '#16A34A' }}>{bc.totalRead || 0} seen</span>
                      {unseenCount > 0 && <span style={{ color: '#DC2626' }}> · {unseenCount} not seen</span>}
                    </p>
                  </div>

                  {/* KAN-278 quick action: follow-up button if anyone hasn't seen it */}
                  {unseenCount > 0 && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        // Pre-fill compose form as a follow-up targeting the right guests
                        setForm({
                          title:      `Follow-up: ${bc.title}`,
                          message:    bc.message,
                          type:       'followup',
                          rsvpFilter: 'all',  // Organizer can refine — we don't have "unseen" as a filter since it's per-broadcast not per-RSVP
                        });
                        setSendResult(null);
                        setSendError(null);
                        setShowCompose(true);
                      }}
                      style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid #FECACA', background: '#FFF5F5', color: '#DC2626', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
                    >
                      ↩ Follow-up ({unseenCount})
                    </button>
                  )}

                  <span style={{ fontSize: 16, color: '#94A3B8', flexShrink: 0 }}>{isOpen ? '▲' : '▼'}</span>
                </div>

                {/* Expanded content */}
                {isOpen && (
                  <div style={{ padding: '0 20px 20px', borderTop: '1px solid #F1F5F9' }}>
                    {/* Message body */}
                    <p style={{ margin: '14px 0', fontSize: 13, background: '#F8FAFC', padding: '12px 16px', borderRadius: 8, color: '#374151', lineHeight: 1.7, borderLeft: `3px solid ${tc.text}`, whiteSpace: 'pre-wrap' }}>
                      {bc.message}
                    </p>

                    {/* Delivery stats bar (KAN-277) */}
                    <DeliveryBar broadcast={bc} />

                    {/* Per-recipient detail toggle (KAN-277) */}
                    <div style={{ marginTop: 14 }}>
                      <button
                        onClick={() => setShowRecipients(showRecips ? null : bc._id)}
                        style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                      >
                        {showRecips ? '▲ Hide recipients' : `▼ Show all recipients (${bc.recipients?.length || 0})`}
                      </button>
                    </div>

                    {showRecips && <RecipientTable recipients={bc.recipients} />}
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