import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  listGuests, addGuest, updateGuest, deleteGuest,
  sendInvitation,
} from '../../services/serviceGuest';
import { P, icons } from '../../utils/theme';

const DIETARY_PRESETS = [
  'None','Vegetarian','Vegan','Gluten-Free','Halal','Kosher','Nut Allergy','Dairy-Free',
];

// ─── Filter tile ──────────────────────────────────────────────────────────────
function FilterTile({ label, value, isActive, accentColor, glowColor, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flex:       '1 1 0',
        minWidth:   72,
        padding:    '14px 10px',
        borderRadius: 12,
        border:     `1px solid ${isActive ? accentColor + '55' : hov ? accentColor + '33' : P.border}`,
        background: isActive ? glowColor : hov ? `${glowColor}80` : P.surface,
        cursor:     'pointer',
        textAlign:  'center',
        transition: 'all 0.18s ease',
        transform:  hov && !isActive ? 'translateY(-1px)' : 'none',
        boxShadow:  isActive ? `0 0 18px ${glowColor}, 0 0 0 1px ${accentColor}22` : 'none',
        outline:    'none',
        fontFamily: 'inherit',
      }}
    >
      <p style={{ margin:'0 0 3px', fontSize:22, fontWeight:800, color: isActive ? accentColor : hov ? accentColor : P.text, letterSpacing:'-0.02em', lineHeight:1 }}>{value}</p>
      <p style={{ margin:0, fontSize:10, fontWeight:700, color: isActive ? accentColor : P.muted, textTransform:'uppercase', letterSpacing:'0.08em' }}>{label}</p>
    </button>
  );
}

// ─── Tiny toast ───────────────────────────────────────────────────────────────
function Toast({ message, type }) {
  return (
    <div style={{
      position:'fixed', bottom:100, right:28, zIndex:300,
      background: type === 'success' ? P.panel : P.redGlow,
      border: `1px solid ${type === 'success' ? P.border : P.red + '44'}`,
      color: P.text,
      padding:'11px 18px', borderRadius:10, fontSize:13, fontWeight:500,
      display:'flex', alignItems:'center', gap:10,
      boxShadow:'0 8px 32px rgba(0,0,0,0.5)',
    }}>
      <span style={{ color: type === 'success' ? P.green : P.red, fontWeight:700 }}>{type === 'success' ? '✓' : '✗'}</span>
      {message}
    </div>
  );
}

// ─── Add / Edit guest modal ───────────────────────────────────────────────────
function GuestModal({ guest, onSave, onClose }) {
  const isEdit = Boolean(guest?._id);
  const [form, setForm] = useState(
    isEdit
      ? { fullname:guest.fullName, email:guest.email, phone:guest.phone||'', dietaryPreferences:guest.rsvp?.dietaryPreferences?.[0]||'None', notes:guest.rsvp?.specialRequirements||'' }
      : { fullname:'', email:'', phone:'', dietaryPreferences:'None', notes:'' }
  );
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleSubmit = async () => {
    setError(null);
    const errs = {};
    if (!form.fullname.trim()) errs.fullname = 'Name is required';
    if (!form.email.trim())    errs.email    = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = 'Enter a valid email';
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
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

  const inp = (key) => ({
    width:'100%', padding:'11px 14px', borderRadius:8, boxSizing:'border-box',
    border: `1px solid ${fieldErrors[key] ? P.red + '66' : P.border}`,
    background:P.hover, color:P.text, fontSize:14, outline:'none', fontFamily:'inherit',
    transition:'border-color 0.15s',
  });
  const lbl = (key) => ({ display:'block', fontSize:12, fontWeight:600, color:fieldErrors[key] ? P.red : P.sub, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' });

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.78)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, backdropFilter:'blur(8px)' }}
      onClick={onClose}
    >
      <div
        style={{ background:P.panel, borderRadius:14, padding:'32px 36px', width:'90%', maxWidth:460, border:`1px solid ${P.border}`, boxShadow:'0 20px 48px rgba(0,0,0,0.7)' }}
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{ margin:'0 0 24px', fontSize:19, fontWeight:700, color:P.text }}>{isEdit ? 'Edit Guest' : 'Add Guest'}</h2>

        {error && <div style={{ background:P.redGlow, color:P.red, padding:'10px 14px', borderRadius:8, fontSize:13, marginBottom:16, border:`1px solid ${P.red}33` }}>{error}</div>}

        {[
          { label:'Full Name *', key:'fullname', type:'text', ph:'Jane Doe' },
          { label:'Email *',     key:'email',    type:'email', ph:'jane@example.com' },
          { label:'Phone',       key:'phone',    type:'tel',   ph:'+20 100 000 0000' },
        ].map(f => (
          <div key={f.key} style={{ marginBottom:14 }}>
            <label style={lbl(f.key)}>{f.label}</label>
            <input
              type={f.type} placeholder={f.ph}
              value={form[f.key]}
              onChange={e => { setForm(p => ({...p,[f.key]:e.target.value})); if(fieldErrors[f.key]) setFieldErrors(p=>({...p,[f.key]:undefined})); }}
              style={inp(f.key)}
            />
            {fieldErrors[f.key] && <p style={{ margin:'4px 0 0', fontSize:12, color:P.red }}>{fieldErrors[f.key]}</p>}
          </div>
        ))}

        <div style={{ marginBottom:14 }}>
          <label style={lbl('dietary')}>Dietary Preferences</label>
          <input
            list="dp-presets"
            value={form.dietaryPreferences}
            onChange={e => setForm(p => ({...p, dietaryPreferences:e.target.value}))}
            placeholder="None"
            style={inp('dietary')}
          />
          <datalist id="dp-presets">{DIETARY_PRESETS.map(d => <option key={d} value={d}/>)}</datalist>
        </div>

        <div style={{ marginBottom:24 }}>
          <label style={lbl('notes')}>Notes</label>
          <textarea
            value={form.notes}
            onChange={e => setForm(p => ({...p, notes:e.target.value}))}
            placeholder="Any additional notes…"
            rows={3}
            style={{ ...inp('notes'), resize:'vertical' }}
          />
        </div>

        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:'11px 0', borderRadius:8, border:`1px solid ${P.border}`, background:'transparent', color:P.sub, fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={saving} style={{ flex:1, padding:'11px 0', borderRadius:8, border:'none', background:saving?P.muted:P.blue, color:'#fff', fontWeight:600, fontSize:14, cursor:saving?'not-allowed':'pointer', fontFamily:'inherit' }}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Guest'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Invite result modal ──────────────────────────────────────────────────────
function InviteResultModal({ result, onClose }) {
  const { rsvpUrl, emailSent, guestEmail } = result;
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(rsvpUrl); setCopied(true); setTimeout(() => setCopied(false), 2200); };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.78)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, backdropFilter:'blur(8px)' }} onClick={onClose}>
      <div style={{ background:P.panel, borderRadius:14, padding:'32px 36px', width:'90%', maxWidth:460, border:`1px solid ${P.border}`, boxShadow:'0 20px 48px rgba(0,0,0,0.7)' }} onClick={e => e.stopPropagation()}>

        {emailSent ? (
          <div style={{ background:P.greenGlow, border:`1px solid ${P.green}33`, borderRadius:8, padding:'12px 14px', marginBottom:20, display:'flex', gap:10 }}>
            <span style={{ fontSize:18 }}>✉️</span>
            <div>
              <p style={{ margin:'0 0 2px', fontSize:13, fontWeight:700, color:P.green }}>Invitation email sent!</p>
              <p style={{ margin:0, fontSize:12, color:P.sub }}>Sent to <strong style={{color:P.text}}>{guestEmail}</strong>. Copy the link below as backup.</p>
            </div>
          </div>
        ) : (
          <div style={{ background:P.amberGlow, border:`1px solid ${P.amber}33`, borderRadius:8, padding:'12px 14px', marginBottom:20, display:'flex', gap:10 }}>
            <span style={{ fontSize:18 }}>⚠️</span>
            <div>
              <p style={{ margin:'0 0 2px', fontSize:13, fontWeight:700, color:P.amber }}>Email not configured</p>
              <p style={{ margin:0, fontSize:12, color:P.sub }}>SMTP not set up — share this link manually.</p>
            </div>
          </div>
        )}

        <h2 style={{ margin:'0 0 8px', fontSize:18, fontWeight:700, color:P.text }}>RSVP Link 🎟</h2>
        <p style={{ margin:'0 0 16px', fontSize:14, color:P.sub }}>Share with the guest:</p>

        <div style={{ display:'flex', gap:8 }}>
          <input readOnly value={rsvpUrl} style={{ flex:1, padding:'10px 14px', borderRadius:8, border:`1px solid ${P.border}`, fontSize:12, color:P.blue, background:P.hover, outline:'none', fontFamily:'monospace' }}/>
          <button onClick={copy} style={{ padding:'10px 14px', borderRadius:8, border:`1px solid ${P.border}`, background: copied?P.green:P.surface, color: copied?'#111':P.text, fontWeight:600, fontSize:13, cursor:'pointer', transition:'all 0.15s', whiteSpace:'nowrap' }}>
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>

        <button onClick={onClose} style={{ width:'100%', marginTop:18, padding:'11px 0', borderRadius:8, border:'none', background:P.blue, color:'#fff', fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>
          Done
        </button>
      </div>
    </div>
  );
}

// ─── Initials avatar ──────────────────────────────────────────────────────────
function Avatar({ name, isActive }) {
  const init = (name || '?').split(' ').filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase();
  return (
    <div style={{
      width:34, height:34, borderRadius:'50%', flexShrink:0,
      background: isActive ? P.blueGlow : P.hover,
      color:      isActive ? P.blue     : P.sub,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:12, fontWeight:700,
    }}>{init}</div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function TabGuests({ eventId }) {
  const [guests,       setGuests]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [activeFilter, setActiveFilter] = useState('all');   // tile filter (client-side)
  const [dietaryFilter,setDietaryFilter]= useState('');
  const [showModal,    setShowModal]    = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);
  const [confirmDelete,setConfirmDelete]= useState(null);
  const [sendingInvites,setSendingInvites]= useState(new Set());
  const [sendingAll,   setSendingAll]   = useState(false);
  const [inviteProgress,setInviteProgress]=useState('');
  const [inviteResult, setInviteResult] = useState(null);
  const [toast,        setToast]        = useState(null);
  const debounceRef = useRef(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  }, []);

  // ── Fetch (search-only — rsvp filter is client-side via tiles) ────────────
  const load = useCallback(async (searchVal) => {
    setLoading(true);
    try {
      const data = await listGuests(eventId, { search: searchVal });
      setGuests(Array.isArray(data) ? data : []);
    } catch {
      showToast('Failed to load guests', 'error');
    } finally {
      setLoading(false);
    }
  }, [eventId, showToast]);
  

  // Re-fetch on page visibility
  useEffect(() => {
    const h = () => { if (document.visibilityState === 'visible') load(search); };
    document.addEventListener('visibilitychange', h);
    return () => document.removeEventListener('visibilitychange', h);
  }, [load, search]);

  // Debounced search
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(search), 600);
    return () => clearTimeout(debounceRef.current);
  }, [search, load]);

  // ── Stats (from full fetched list, before client filter) ──────────────────
  const stats = useMemo(() => ({
    total:     guests.length,
    attending: guests.filter(g => g.rsvp?.status === 'attending').length,
    declined:  guests.filter(g => g.rsvp?.status === 'declined').length,
    pending:   guests.filter(g => !g.rsvp?.status || g.rsvp.status === 'pending').length,
    invited:   guests.filter(g => g.invitationStatus === 'sent').length,
  }), [guests]);

  // ── Client-side filter based on active tile ───────────────────────────────
  const filtered = useMemo(() => {
    let list = guests;
    if (activeFilter === 'attending') list = list.filter(g => g.rsvp?.status === 'attending');
    else if (activeFilter === 'declined') list = list.filter(g => g.rsvp?.status === 'declined');
    else if (activeFilter === 'pending')  list = list.filter(g => !g.rsvp?.status || g.rsvp.status === 'pending');
    else if (activeFilter === 'invited')  list = list.filter(g => g.invitationStatus === 'sent');

    if (dietaryFilter.trim()) {
      const q = dietaryFilter.toLowerCase();
      list = list.filter(g => (g.rsvp?.dietaryPreferences?.join(', ') || '').toLowerCase().includes(q));
    }
    return list;
  }, [guests, activeFilter, dietaryFilter]);

  // ── Tile config ───────────────────────────────────────────────────────────
  const tiles = [
    { id:'all',       label:'Total',     value:stats.total,     accent:P.text,  glow:`rgba(232,232,232,0.1)` },
    { id:'attending', label:'Attending', value:stats.attending, accent:P.green, glow:P.greenGlow },
    { id:'declined',  label:'Declined',  value:stats.declined,  accent:P.red,   glow:P.redGlow   },
    { id:'pending',   label:'Pending',   value:stats.pending,   accent:P.amber, glow:P.amberGlow },
    { id:'invited',   label:'Invited',   value:stats.invited,   accent:P.blue,  glow:P.blueGlow  },
  ];

  // ── CRUD ──────────────────────────────────────────────────────────────────
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
  };

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

  const handleInvite = async (guest) => {
    setSendingInvites(prev => new Set([...prev, guest._id]));
    try {
      const result = await sendInvitation(eventId, guest._id);
      setGuests(prev => prev.map(g => g._id === guest._id ? { ...g, invitationStatus:'sent', invitationSentAt:new Date().toISOString() } : g));
      setInviteResult({ rsvpUrl:result.rsvpUrl, emailSent:result.emailSent, guestEmail:result.guestEmail || guest.email });
      showToast(result.emailSent ? `Invite sent to ${result.guestEmail}` : 'RSVP link ready');
    } catch {
      showToast('Failed to send invitation', 'error');
    } finally {
      setSendingInvites(prev => { const s = new Set(prev); s.delete(guest._id); return s; });
    }
  };

  const handleInviteAll = async () => {
    const uninvited = guests.filter(g => g.invitationStatus !== 'sent');
    if (!uninvited.length) { showToast('All guests already invited', 'error'); return; }
    setSendingAll(true);
    let sent = 0;
    for (const g of uninvited) {
      setInviteProgress(`${sent+1}/${uninvited.length}`);
      try {
        await sendInvitation(eventId, g._id);
        setGuests(prev => prev.map(x => x._id === g._id ? { ...x, invitationStatus:'sent', invitationSentAt:new Date().toISOString() } : x));
        sent++;
      } catch { /* continue */ }
    }
    setSendingAll(false);
    setInviteProgress('');
    showToast(`Invitations sent to ${sent} guest(s)`);
  };

  // ── RSVP badge ────────────────────────────────────────────────────────────
  const rsvpBadge = (status) => {
    const map = { attending:{ bg:P.greenGlow, text:P.green, dot:P.green }, declined:{ bg:P.redGlow, text:P.red, dot:P.red } };
    const s = map[status] || { bg:P.amberGlow, text:P.amber, dot:P.amber };
    return (
      <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:700, background:s.bg, color:s.text, textTransform:'capitalize' }}>
        <span style={{ width:5, height:5, borderRadius:'50%', background:s.dot, flexShrink:0 }}/>
        {status || 'pending'}
      </span>
    );
  };

  return (
    <div style={{ maxWidth:1100, margin:'0 auto', padding:'28px 24px', fontFamily:'system-ui,-apple-system,sans-serif', color:P.text }}>

      {/* ── Filter tiles ─────────────────────────────────────────────────── */}
      <div style={{ display:'flex', gap:10, marginBottom:24, flexWrap:'wrap' }}>
        {tiles.map(t => (
          <FilterTile
            key={t.id}
            label={t.label}
            value={t.value}
            isActive={activeFilter === t.id}
            accentColor={t.accent}
            glowColor={t.glow}
            onClick={() => setActiveFilter(t.id)}
          />
        ))}
      </div>

      {/* ── Controls row ─────────────────────────────────────────────────── */}
      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        {/* Search */}
        <div style={{ flex:'1 1 220px', position:'relative' }}>
          <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:P.muted, pointerEvents:'none', display:'flex' }}>
            {icons.search}
          </span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            style={{ width:'100%', padding:'10px 14px 10px 40px', borderRadius:9, border:`1px solid ${P.border}`, background:P.surface, fontSize:14, color:P.text, outline:'none', boxSizing:'border-box', fontFamily:'inherit', transition:'border-color 0.15s' }}
            onFocus={e => e.target.style.borderColor = P.blue}
            onBlur={e => e.target.style.borderColor = P.border}
          />
        </div>

        {/* Dietary filter */}
        <input
          value={dietaryFilter}
          onChange={e => setDietaryFilter(e.target.value)}
          placeholder="Filter dietary…"
          style={{ padding:'10px 14px', borderRadius:9, border:`1px solid ${P.border}`, background:P.surface, fontSize:14, color:P.text, outline:'none', minWidth:150, fontFamily:'inherit' }}
          onFocus={e => e.target.style.borderColor = P.blue}
          onBlur={e => e.target.style.borderColor = P.border}
        />

        {/* Add guest */}
        <button
          onClick={() => { setEditingGuest(null); setShowModal(true); }}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 18px', background:P.blue, color:'#fff', border:'none', borderRadius:9, fontSize:13, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap', fontFamily:'inherit', transition:'opacity 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          {icons.plus} Add Guest
        </button>

        {/* Invite all */}
        <button
          onClick={handleInviteAll}
          disabled={sendingAll}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 18px', background:P.surface, color:P.text, border:`1px solid ${P.border}`, borderRadius:9, fontSize:13, fontWeight:600, cursor:sendingAll?'not-allowed':'pointer', whiteSpace:'nowrap', fontFamily:'inherit', opacity:sendingAll?0.6:1, transition:'all 0.15s' }}
          onMouseEnter={e => { if(!sendingAll) e.currentTarget.style.borderColor = P.sub; }}
          onMouseLeave={e => e.currentTarget.style.borderColor = P.border}
        >
          {icons.mail} {sendingAll ? `Sending… ${inviteProgress}` : 'Invite All'}
        </button>
      </div>

      {/* ── Guest table ───────────────────────────────────────────────────── */}
      <div style={{ background:P.surface, border:`1px solid ${P.border}`, borderRadius:14, overflow:'hidden', boxShadow:'0 4px 20px rgba(0,0,0,0.25)' }}>
        {/* Table header */}
        <div style={{ display:'grid', gridTemplateColumns:'2fr 2fr 1.2fr 1fr 1.4fr 120px', gap:0, background:P.panel, borderBottom:`1px solid ${P.border}`, padding:'10px 18px' }}>
          {['Guest','Email','Dietary','RSVP','Invited','Actions'].map(h => (
            <span key={h} style={{ fontSize:10, fontWeight:700, color:P.muted, textTransform:'uppercase', letterSpacing:'0.08em' }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding:'52px 18px', textAlign:'center', color:P.muted, fontSize:14 }}>Loading guests…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding:'52px 18px', textAlign:'center' }}>
            <p style={{ margin:0, fontSize:14, color:P.muted }}>
              {guests.length === 0 ? 'No guests yet — add your first one!' : `No guests match "${activeFilter !== 'all' ? activeFilter : search || 'your filters'}".`}
            </p>
          </div>
        ) : (
          filtered.map((guest, i) => {
            const isSending = sendingInvites.has(guest._id);
            const isInvited = guest.invitationStatus === 'sent';
            return (
              <div
                key={guest._id}
                style={{
                  display:'grid', gridTemplateColumns:'2fr 2fr 1.2fr 1fr 1.4fr 120px',
                  alignItems:'center', gap:0,
                  padding:'13px 18px',
                  borderBottom: i < filtered.length - 1 ? `1px solid ${P.borderSub}` : 'none',
                  transition:'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = P.hover}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Guest */}
                <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
                  <Avatar name={guest.fullName} isActive={guest.checkIn?.status==='Arrived'} />
                  <div style={{ minWidth:0 }}>
                    <p style={{ margin:0, fontSize:14, fontWeight:600, color:P.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{guest.fullName}</p>
                    {guest.phone && <p style={{ margin:'2px 0 0', fontSize:11, color:P.muted }}>{guest.phone}</p>}
                  </div>
                </div>

                {/* Email */}
                <span style={{ fontSize:12, color:P.sub, fontFamily:'monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', paddingRight:8 }}>{guest.email}</span>

                {/* Dietary */}
                <span style={{ fontSize:13, color: guest.rsvp?.dietaryPreferences?.length ? P.text : P.muted }}>
                  {guest.rsvp?.dietaryPreferences?.join(', ') || 'None'}
                </span>

                {/* RSVP */}
                <div>{rsvpBadge(guest.rsvp?.status)}</div>

                {/* Invited */}
                <div>
                  {isInvited ? (
                    <div>
                      <span style={{ fontSize:12, color:P.green, fontWeight:600 }}>✓ Sent</span>
                      {guest.invitationSentAt && (
                        <p style={{ margin:'2px 0 0', fontSize:10, color:P.muted }}>
                          {new Date(guest.invitationSentAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}
                        </p>
                      )}
                      <button
                        onClick={() => handleInvite(guest)}
                        disabled={isSending}
                        style={{ marginTop:3, fontSize:11, color:P.blue, background:'none', border:'none', cursor:isSending?'not-allowed':'pointer', padding:0, fontWeight:600, fontFamily:'inherit' }}
                      >
                        {isSending ? 'Sending…' : 'Resend'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleInvite(guest)}
                      disabled={isSending}
                      style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:7, border:`1px solid ${P.blue}44`, background:P.blueGlow, color:P.blue, fontWeight:600, fontSize:12, cursor:isSending?'not-allowed':'pointer', fontFamily:'inherit', transition:'all 0.15s', opacity:isSending?0.6:1 }}
                    >
                      {icons.mail} {isSending ? '…' : 'Send'}
                    </button>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display:'flex', gap:6 }}>
                  <button
                    onClick={() => { setEditingGuest(guest); setShowModal(true); }}
                    title="Edit"
                    style={{ width:32, height:32, borderRadius:7, border:`1px solid ${P.border}`, background:'transparent', color:P.sub, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.color=P.text; e.currentTarget.style.borderColor=P.sub; }}
                    onMouseLeave={e => { e.currentTarget.style.color=P.sub;  e.currentTarget.style.borderColor=P.border; }}
                  >
                    {icons.edit}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(guest)}
                    title="Remove"
                    style={{ width:32, height:32, borderRadius:7, border:`1px solid ${P.border}`, background:'transparent', color:P.muted, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.color=P.red; e.currentTarget.style.borderColor=P.red+'55'; e.currentTarget.style.background=P.redGlow; }}
                    onMouseLeave={e => { e.currentTarget.style.color=P.muted; e.currentTarget.style.borderColor=P.border; e.currentTarget.style.background='transparent'; }}
                  >
                    {icons.trash}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <p style={{ marginTop:10, fontSize:12, color:P.muted }}>
        Showing {filtered.length} of {guests.length} guest{guests.length !== 1 ? 's' : ''}
        {activeFilter !== 'all' && <span> — filtered by <strong style={{color:P.text}}>{activeFilter}</strong></span>}
      </p>

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      {showModal && (
        <GuestModal
          guest={editingGuest}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingGuest(null); }}
        />
      )}

      {confirmDelete && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.78)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, backdropFilter:'blur(8px)' }} onClick={() => setConfirmDelete(null)}>
          <div style={{ background:P.panel, borderRadius:14, padding:'32px 36px', maxWidth:400, width:'90%', border:`1px solid ${P.border}`, boxShadow:'0 20px 48px rgba(0,0,0,0.7)' }} onClick={e => e.stopPropagation()}>
            <div style={{ width:44, height:44, borderRadius:'50%', background:P.redGlow, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16, fontSize:20 }}>⚠️</div>
            <h2 style={{ margin:'0 0 8px', fontSize:18, fontWeight:700, color:P.text }}>Remove guest?</h2>
            <p style={{ margin:'0 0 24px', fontSize:14, color:P.sub, lineHeight:1.6 }}>
              <strong style={{color:P.text}}>{confirmDelete.fullName}</strong> will be removed from the guest list. This cannot be undone.
            </p>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setConfirmDelete(null)} style={{ flex:1, padding:'11px 0', borderRadius:8, border:`1px solid ${P.border}`, background:'transparent', color:P.sub, fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
              <button onClick={handleDelete} style={{ flex:1, padding:'11px 0', borderRadius:8, border:'none', background:P.red, color:'#fff', fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>Remove</button>
            </div>
          </div>
        </div>
      )}

      {inviteResult && <InviteResultModal result={inviteResult} onClose={() => setInviteResult(null)} />}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}