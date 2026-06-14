import { useState, useEffect, useCallback, useRef } from 'react';
import {
  listGuests, addGuest, updateGuest, deleteGuest, sendInvitation,
} from '../../services/serviceGuest';

// ─── Constants ──────────────────────────────────────────────────────────────

const DIETARY_PRESETS = [
  'None', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Halal', 'Kosher', 'Nut Allergy', 'Dairy-Free',
];

const RSVP_STYLES = {
  pending:   { bg: '#FFF7ED', text: '#C2410C', dot: '#F59E0B' },
  attending: { bg: '#F0FDF4', text: '#166534', dot: '#22C55E' },
  declined:  { bg: '#FEF2F2', text: '#991B1B', dot: '#EF4444' },
};

const EMPTY_FORM = { fullname: '', email: '', phone: '', dietaryPreferences: 'None', notes: '' };

// ─── Sub-components ──────────────────────────────────────────────────────────

function Toast({ message, type }) {
  return (
    <div style={{
      position: 'fixed', bottom: 28, right: 28, zIndex: 200,
      background: type === 'success' ? '#0F172A' : '#DC2626',
      color: '#fff', padding: '12px 20px', borderRadius: 10,
      fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 10,
      boxShadow: '0 8px 32px rgba(15,23,42,0.22)',
    }}>
      {type === 'success' ? '✓' : '✗'} {message}
    </div>
  );
}

function GuestModal({ guest, onSave, onClose }) {
  const isEdit = Boolean(guest?._id);
  const [form, setForm] = useState(
    isEdit
? { fullname: guest.fullName, email: guest.email, phone: guest.phone || '', dietaryPreferences: guest.rsvp?.dietaryPreferences?.[0] || 'None', notes: guest.rsvp?.specialRequirements || '' }
      : EMPTY_FORM
  );
  const [saving, setSaving] = useState(false);
const [error, setError]   = useState(null);
const [fieldErrors, setFieldErrors] = useState({});

const handleSubmit = async () => {
  setError(null);
  const errs = {};
  if (!form.fullname.trim()) errs.fullname = 'Name is required';
  if (!form.email.trim()) {
    errs.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errs.email = 'Please enter a valid email address';
  }
  if (Object.keys(errs).length > 0) {
    setFieldErrors(errs);
    return;
  }
  setFieldErrors({});
  setSaving(true);
  try {
    await onSave(form);
    onClose();
  } catch (err) {
    setError(err.message);
  } finally {
    setSaving(false);
  }
};

 const field = (label, key, type = 'text', placeholder = '') => (
  <div key={key} style={{ marginBottom: 16 }}>
    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: fieldErrors[key] ? '#EF4444' : '#374151', marginBottom: 6 }}>{label}</label>
    <input
      type={type}
      value={form[key]}
      onChange={e => {
        setForm(p => ({ ...p, [key]: e.target.value }));
        if (fieldErrors[key]) setFieldErrors(p => ({ ...p, [key]: undefined }));
      }}
      placeholder={placeholder}
      style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${fieldErrors[key] ? '#EF4444' : '#E2E8F0'}`, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
    />
    {fieldErrors[key] && (
      <p style={{ margin: '4px 0 0', fontSize: 12, color: '#EF4444' }}>{fieldErrors[key]}</p>
    )}
  </div>
);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(2px)' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: '32px 36px', width: '90%', maxWidth: 460, boxShadow: '0 24px 64px rgba(15,23,42,0.18)' }}>
        <h2 style={{ margin: '0 0 24px', fontSize: 19, fontWeight: 700, color: '#0F172A' }}>
          {isEdit ? 'Edit Guest' : 'Add Guest'}
        </h2>

        {error && (
          <div style={{ background: '#FEF2F2', color: '#991B1B', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16, border: '1px solid #FECACA' }}>
            {error}
          </div>
        )}

        {field('Full Name *', 'fullname', 'text', 'Jane Doe')}
        {field('Email *',     'email',    'email', 'jane@example.com')}
        {field('Phone',       'phone',    'tel',   '+20 100 000 0000')}

        {/* Dietary with datalist for autocomplete — KAN-262 */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Dietary Preferences</label>
          <input
            list="dp-presets"
            value={form.dietaryPreferences}
            onChange={e => setForm(p => ({ ...p, dietaryPreferences: e.target.value }))}
            placeholder="None"
            style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
          />
          <datalist id="dp-presets">
            {DIETARY_PRESETS.map(d => <option key={d} value={d} />)}
          </datalist>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Notes</label>
          <textarea
            value={form.notes}
            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            placeholder="Any additional notes..."
            rows={3}
            style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', color: '#374151', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: saving ? '#94A3B8' : '#0F172A', color: '#fff', fontWeight: 600, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer' }}
          >
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Guest'}
          </button>
        </div>
      </div>
    </div>
  );
}

function InviteResultModal({ rsvpUrl, onClose }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(rsvpUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(2px)' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: '32px 36px', width: '90%', maxWidth: 460, boxShadow: '0 24px 64px rgba(15,23,42,0.18)' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 19, fontWeight: 700, color: '#0F172A' }}>Invitation Sent 🎉</h2>
        <p style={{ margin: '0 0 20px', fontSize: 14, color: '#64748B', lineHeight: 1.6 }}>Share this RSVP link manually if needed:</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            readOnly value={rsvpUrl}
            style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12, color: '#4338CA', background: '#F8FAFC', outline: 'none', fontFamily: 'monospace' }}
          />
          <button
            onClick={copy}
            style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #E2E8F0', background: copied ? '#166534' : '#fff', color: copied ? '#fff' : '#374151', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
        <button onClick={onClose} style={{ width: '100%', marginTop: 20, padding: '10px 0', borderRadius: 8, border: 'none', background: '#0F172A', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
          Done
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TabGuests({ eventId }) {
  const [guests, setGuests]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [rsvpFilter, setRsvpFilter]   = useState('all');
  const [dietaryFilter, setDietaryFilter] = useState('');
  const [showModal, setShowModal]     = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);   // null = add mode
  const [confirmDelete, setConfirmDelete] = useState(null); // guest object
  const [sendingInvites, setSendingInvites] = useState(new Set());
  const [inviteResult, setInviteResult] = useState(null);   // rsvpUrl string
  const [toast, setToast]             = useState(null);
  const debounceRef = useRef(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  }, []);

  const load = useCallback(async (searchVal, rsvpVal) => {
    setLoading(true);
    try {
      const data = await listGuests(eventId, { search: searchVal, rsvp: rsvpVal });
      setGuests(data);
    } catch {
      showToast('Failed to load guests', 'error');
    } finally {
      setLoading(false);
    }
  }, [eventId, showToast]);

  // Initial load
// Initial load
  useEffect(() => {
    const timer = setTimeout(() => load('', 'all'), 0);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => {
  const handleVisibility = () => {
    if (document.visibilityState === 'visible') {
      load(search, rsvpFilter);
    }
  };
  document.addEventListener('visibilitychange', handleVisibility);
  return () => document.removeEventListener('visibilitychange', handleVisibility);
}, [load, search, rsvpFilter]);
  
  // Debounced reload on search/rsvp change
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(search, rsvpFilter), 600);
    return () => clearTimeout(debounceRef.current);
  }, [search, rsvpFilter, load]);

  // KAN-258: Save (add or edit)
  const handleSave = async (form) => {
  if (editingGuest) {
    const updated = await updateGuest(eventId, editingGuest._id, form);
    setGuests(prev => prev.map(g => g._id === editingGuest._id ? updated : g));
    showToast('Guest updated');
  } else {
    const created = await addGuest(eventId, form);
    setGuests(prev => [created, ...prev]);
    showToast('Guest added');
  }
  // errors propagate up naturally — don't catch here
};

  // KAN-258: Delete
  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteGuest(eventId, confirmDelete._id);
      setGuests(prev => prev.filter(g => g._id !== confirmDelete._id));
showToast(`${confirmDelete.fullName} removed`);
    } catch {
      showToast('Failed to remove guest', 'error');
    }
    setConfirmDelete(null);
  };

  // KAN-260: Send invitation
  const handleInvite = async (guest) => {
    setSendingInvites(prev => new Set([...prev, guest._id]));
    try {
      const result = await sendInvitation(eventId, guest._id);
setGuests(prev => prev.map(g => g._id === guest._id ? { ...g, invitationStatus: 'sent', invitationSentAt: new Date().toISOString() } : g));
      setInviteResult(result.rsvpUrl);
      showToast(result.emailSent ? 'Invitation email sent!' : 'RSVP link ready to share');
    } catch {
      showToast('Failed to send invitation', 'error');
    } finally {
      setSendingInvites(prev => { const s = new Set(prev); s.delete(guest._id); return s; });
    }
  };

  // KAN-259: Client-side dietary filter (layered on top of backend search)
  const filtered = guests.filter(g =>
    !dietaryFilter.trim() ||
    (g.rsvp?.dietaryPreferences?.join(', ') || '').toLowerCase().includes(dietaryFilter.toLowerCase())
  );

  // Stats row
  const stats = [
    { label: 'Total',    value: guests.length,                                        color: '#0F172A' },
   { label: 'Attending', value: guests.filter(g => g.rsvp?.status === 'attending').length, color: '#166534' },
{ label: 'Declined',  value: guests.filter(g => g.rsvp?.status === 'declined').length,  color: '#991B1B' },
{ label: 'Pending',   value: guests.filter(g => g.rsvp?.status === 'pending').length,   color: '#C2410C' },
{ label: 'Invited',   value: guests.filter(g => g.invitationStatus === 'sent').length,  color: '#4338CA' },

  ];

  const initials = (name = '') =>
    name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Stats — KAN-261 (RSVP breakdown at a glance) */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px 20px', textAlign: 'center', minWidth: 76 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Controls — KAN-259 */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Name / email search */}
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            style={{ width: '100%', padding: '10px 14px 10px 36px', borderRadius: 9, border: '1px solid #E2E8F0', background: '#fff', fontSize: 14, color: '#0F172A', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
          />
        </div>

        {/* RSVP filter — KAN-261 */}
        <div style={{ display: 'flex', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 9, overflow: 'hidden' }}>
          {['all', 'pending', 'attending', 'declined'].map(r => (
              <button
              key={r}
              onClick={() => setRsvpFilter(r)}
              style={{ padding: '10px 14px', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: rsvpFilter === r ? '#0F172A' : 'transparent', color: rsvpFilter === r ? '#fff' : '#64748B', whiteSpace: 'nowrap', fontFamily: 'inherit' }}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>

        {/* Dietary filter — KAN-262 */}
        <input
          value={dietaryFilter}
          onChange={e => setDietaryFilter(e.target.value)}
          placeholder="Filter dietary..."
          style={{ padding: '10px 14px', borderRadius: 9, border: '1px solid #E2E8F0', background: '#fff', fontSize: 14, color: '#0F172A', outline: 'none', minWidth: 150, fontFamily: 'inherit' }}
        />

        {/* Add button — KAN-258 */}
        <button
          onClick={() => { setEditingGuest(null); setShowModal(true); }}
          style={{ padding: '10px 20px', background: '#0F172A', color: '#fff', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}
        >
          + Add Guest
        </button>
      </div>

      {/* Table — KAN-258, 261, 262 */}
      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 6px rgba(15,23,42,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              {['Guest', 'Email', 'Dietary', 'RSVP Status', 'Invited', 'Actions'].map(h => (
                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '48px 16px', textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>Loading guests...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '48px 16px', textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>No guests found. Add your first guest!</td></tr>
            ) : filtered.map((guest, i) => {
              const rs = RSVP_STYLES[guest.rsvp?.status] || RSVP_STYLES.pending;
              const isSending = sendingInvites.has(guest._id);

              return (
                <tr key={guest._id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #F1F5F9' : 'none' }}>

                  {/* Guest name + avatar — KAN-258 */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#DBEAFE', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
{initials(guest.fullName)}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{guest.fullName}</div>
                        {guest.phone && <div style={{ fontSize: 12, color: '#94A3B8' }}>{guest.phone}</div>}
                        {guest.notes && <div style={{ fontSize: 11, color: '#94A3B8', fontStyle: 'italic', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{guest.notes}</div>}
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: 12, color: '#64748B', fontFamily: "'SF Mono', 'Fira Code', monospace" }}>{guest.email}</span>
                  </td>

                  {/* Dietary — KAN-262 */}
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: 13, color: !guest.rsvp?.dietaryPreferences?.length ? '#94A3B8' : '#0F172A' }}>
                      {guest.rsvp?.dietaryPreferences?.join(', ') || 'None'}
                    </span>
                  </td>

                  {/* RSVP Status — KAN-261 */}
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: rs.bg, color: rs.text }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: rs.dot, display: 'inline-block' }} />
                      {(guest.rsvp?.status || 'pending').charAt(0).toUpperCase() + (guest.rsvp?.status || 'pending').slice(1)}           
                      </span>
                      {guest.rsvp?.respondedAt && (
                      <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                        {new Date(guest.rsvp?.respondedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </div>
                    )}
                  </td>

                  {/* Invitation — KAN-260 */}
                  <td style={{ padding: '14px 16px' }}>
                    {guest.invitationStatus === 'sent' ? (
                      <div>
                        <span style={{ fontSize: 12, color: '#166534', fontWeight: 600 }}>✓ Sent</span>
                        {guest.invitationSentAt && (
                          <div style={{ fontSize: 11, color: '#94A3B8' }}>
                            {new Date(guest.invitationSentAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                          </div>
                        )}
                        <button
                          onClick={() => handleInvite(guest)}
                          disabled={isSending}
                          style={{ marginTop: 4, fontSize: 11, color: '#4338CA', background: 'none', border: 'none', cursor: isSending ? 'not-allowed' : 'pointer', padding: 0, fontWeight: 600, fontFamily: 'inherit' }}
                        >
                          {isSending ? 'Sending...' : 'Resend'}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleInvite(guest)}
                        disabled={isSending}
                        style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#1D4ED8', fontWeight: 600, fontSize: 12, cursor: isSending ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
                        onMouseEnter={e => !isSending && Object.assign(e.currentTarget.style, { background: '#1D4ED8', color: '#fff' })}
                        onMouseLeave={e => Object.assign(e.currentTarget.style, { background: '#EFF6FF', color: '#1D4ED8' })}
                      >
                        {isSending ? 'Sending...' : '✉ Send Invite'}
                      </button>
                    )}
                  </td>

                  {/* Actions — KAN-258 */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => { setEditingGuest(guest); setShowModal(true); }}
                        style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid #E2E8F0', background: '#fff', color: '#374151', fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F1F5F9'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmDelete(guest)}
                        style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid #FECACA', background: '#FFF5F5', color: '#DC2626', fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
                        onMouseEnter={e => Object.assign(e.currentTarget.style, { background: '#DC2626', color: '#fff' })}
                        onMouseLeave={e => Object.assign(e.currentTarget.style, { background: '#FFF5F5', color: '#DC2626' })}
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 12, fontSize: 13, color: '#94A3B8' }}>
        Showing {filtered.length} of {guests.length} guest{guests.length !== 1 ? 's' : ''}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <GuestModal
          guest={editingGuest}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingGuest(null); }}
        />
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(2px)' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '32px 36px', maxWidth: 400, width: '90%', boxShadow: '0 24px 64px rgba(15,23,42,0.18)' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, fontSize: 20 }}>⚠️</div>
            <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#0F172A' }}>Remove guest?</h2>
            <p style={{ margin: '0 0 24px', fontSize: 14, color: '#475569', lineHeight: 1.6 }}>
              <strong>{confirmDelete.fullName}</strong> will be removed from the guest list. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', color: '#374151', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleDelete} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: '#DC2626', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Remove</button>
            </div>
          </div>
        </div>
      )}

      {/* Invite result — shows RSVP link to copy */}
      {inviteResult && (
        <InviteResultModal rsvpUrl={inviteResult} onClose={() => setInviteResult(null)} />
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}