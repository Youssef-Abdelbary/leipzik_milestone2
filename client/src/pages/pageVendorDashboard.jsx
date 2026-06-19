import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    fetchMyVendorOrders,
    updateDeliveryStatus,
    fetchMyVendorProfile,
    updateMyVendorProfile,
    fetchMyVendorInbox,
    respondToVendorRequest,
    sendVendorClarificationMessage,
} from '../services/serviceBrowseVendors';
import TabVendorInvoicesSelf from './tabs/TabVendorInvoicesSelf';
import AppHeader from '../components/componentAppHeader';
import Dock from '../components/componentDock';
import { P, icons, GlassPanel } from '../components/componentTheme';
import { OpalSelect } from '../components/componentMenus';
import '../components/componentTheme.css';
import { fetchNotifications, markNotificationAsRead } from '../services/serviceNotifications';

const DELIVERY_ORDER = ['preparing', 'out_for_delivery', 'delivered'];

const DELIVERY_META = {
    preparing:        { label: 'Preparing',        accent: P.amber,  glow: P.amberGlow  },
    out_for_delivery: { label: 'Out for Delivery',  accent: P.indigo, glow: P.indigoGlow },
    delivered:        { label: 'Delivered',          accent: P.teal,   glow: P.tealGlow   },
};

const NEXT_ACTION = {
    null:             { label: 'Start Preparing',   nextStatus: 'preparing'        },
    preparing:        { label: 'Mark as Dispatched', nextStatus: 'out_for_delivery' },
    out_for_delivery: { label: 'Confirm Delivered',  nextStatus: 'delivered'        },
};

function DeliveryBadge({ status }) {
    const m = DELIVERY_META[status] || { label: 'Pending Start', accent: P.muted, glow: 'rgba(237,233,255,0.05)' };
    return (
        <span style={{
            display: 'inline-block', padding: '3px 10px', borderRadius: 99,
            fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
            background: m.glow, color: m.accent, border: `1px solid ${m.accent}33`,
        }}>
            {m.label}
        </span>
    );
}

function ProgressSteps({ status }) {
    const idx = DELIVERY_ORDER.indexOf(status);
    return (
        <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
            {DELIVERY_ORDER.map((step, i) => {
                const reached = idx >= i;
                const m = DELIVERY_META[step];
                return (
                    <div key={step} style={{ flex: 1 }}>
                        <div style={{
                            height: 4, borderRadius: 99,
                            background: reached ? m.accent : 'rgba(255,255,255,0.07)',
                            transition: 'background 0.35s ease',
                            boxShadow: reached ? `0 0 6px ${m.accent}55` : 'none',
                        }} />
                        <div style={{
                            fontSize: 9, marginTop: 4, textAlign: 'center', fontWeight: 700,
                            letterSpacing: '0.04em', textTransform: 'uppercase',
                            color: reached ? m.accent : P.muted,
                            transition: 'color 0.35s ease',
                        }}>
                            {step === 'out_for_delivery' ? 'In Transit' : step.replace(/_/g, ' ')}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function MessageComposer({ orderId }) {
    const [open, setOpen]       = useState(false);
    const [text, setText]       = useState('');
    const [sending, setSending] = useState(false);
    const [sent, setSent]       = useState(false);
    const [err, setErr]         = useState(null);

    async function handleSend() {
        if (!text.trim()) return;
        setSending(true);
        setErr(null);
        try {
            await sendVendorClarificationMessage(orderId, text.trim());
            setText('');
            setSent(true);
            setTimeout(() => { setSent(false); setOpen(false); }, 2000);
        } catch (e) {
            setErr(e.message || 'Failed to send.');
        } finally {
            setSending(false);
        }
    }

    function handleCancel() {
        setOpen(false);
        setText('');
        setErr(null);
    }

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                style={{
                    width: '100%', padding: '8px 0', borderRadius: 9, marginTop: 10,
                    border: `1px solid ${P.border}`, background: 'transparent',
                    color: P.sub, fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    transition: 'border-color 0.15s, color 0.15s',
                }}
            >
                {icons.mail}
                Send Message to Organizer
            </button>
        );
    }

    return (
        <div style={{
            marginTop: 10, border: `1px solid ${P.border}`, borderRadius: 9,
            background: 'rgba(255,255,255,0.03)', padding: 12,
            animation: 'cardIn 0.2s ease both',
        }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                Message to Organizer
            </div>
            <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Type a clarification message…"
                rows={3}
                style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${P.border}`, borderRadius: 7,
                    padding: '8px 10px', color: P.text, fontSize: 13,
                    fontFamily: 'inherit', resize: 'vertical', outline: 'none',
                    marginBottom: 8,
                }}
            />
            {err  && <p style={{ color: P.red,  fontSize: 12, margin: '0 0 8px', fontWeight: 600 }}>{err}</p>}
            {sent && <p style={{ color: P.teal, fontSize: 12, margin: '0 0 8px', fontWeight: 600 }}>✓ Message sent</p>}
            <div style={{ display: 'flex', gap: 8 }}>
                <button
                    onClick={handleCancel}
                    style={{
                        flex: 1, padding: '8px 0', borderRadius: 7,
                        border: `1px solid ${P.border}`, background: 'transparent',
                        color: P.sub, fontSize: 12, fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'inherit',
                    }}
                >
                    Cancel
                </button>
                <button
                    onClick={handleSend}
                    disabled={sending || !text.trim()}
                    style={{
                        flex: 2, padding: '8px 0', borderRadius: 7, border: 'none',
                        background: sending || !text.trim()
                            ? P.hover
                            : `linear-gradient(135deg, ${P.blue} 0%, ${P.teal} 100%)`,
                        color: sending || !text.trim() ? P.muted : '#0a0a12',
                        fontSize: 12, fontWeight: 700,
                        cursor: sending || !text.trim() ? 'not-allowed' : 'pointer',
                        fontFamily: 'inherit',
                    }}
                >
                    {sending ? 'Sending…' : 'Send'}
                </button>
            </div>
        </div>
    );
}

const FILTERS = [
    { id: 'all',         label: 'All Orders'  },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'delivered',   label: 'Delivered'   },
];

const EMPTY_PROFILE = {
    companyName: '',
    suppliesOffered: [],
    mainLocation: { city: '', area: '', address: '' },
    pricingList: [],
    contactInfo: { contactPerson: '', phone: '', email: '' },
};

const PRICE_CATEGORIES = ['Catering', 'Décor', 'Audio/Visual', 'Furniture', 'Floral', 'Photography', 'Staffing', 'Other'];

const TAB_META = {
    requests: { title: 'Incoming Requests', subtitle: 'Review and accept or decline sourcing requests from organizers.' },
    orders:   { title: 'Accepted Orders',   subtitle: 'Manage delivery phases for your confirmed sourcing requests.'  },
    invoices: { title: 'Invoices',          subtitle: 'Submit invoices linked to accepted orders for organizer review.' },
    profile:  { title: 'Business Profile',  subtitle: 'Set up your business details so organizers can find and evaluate you.' },
};

const VENDOR_TABS = [
    { id: 'requests', label: 'Incoming Requests', icon: icons.mail      },
    { id: 'orders',   label: 'My Orders',         icon: icons.vendors   },
    { id: 'invoices', label: 'Invoices',           icon: icons.clipboard },
    { id: 'profile',  label: 'Business Profile',  icon: icons.building2 },
];

function DockTabIcon({ icon }) {
    return <div style={{ transform: 'scale(1.25)', display: 'flex' }}>{icon}</div>;
}

// ─── IncomingRequests ─────────────────────────────────────────────────────────

function IncomingRequests({ onAccepted }) {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState(null);
    const [responding, setResponding] = useState(null);

    useEffect(() => { load(); }, []);

    async function load() {
        try {
            setLoading(true);
            setError(null);
            const res = await fetchMyVendorInbox();
            setRequests(res.data || []);
        } catch (err) {
            setError(err.message || 'Failed to load requests.');
        } finally {
            setLoading(false);
        }
    }

    async function handleRespond(requestId, status) {
        setResponding(requestId + status);
        try {
            await respondToVendorRequest(requestId, { status });
            setRequests(prev => prev.filter(r => r._id !== requestId));
            if (status === 'accepted' && onAccepted) onAccepted();
        } catch (err) {
            alert(err.message || 'Failed to respond.');
        } finally {
            setResponding(null);
        }
    }

    if (loading) {
        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                {[1, 2].map(i => (
                    <div key={i} style={{ height: 220, background: P.surface, borderRadius: 14, border: `1px solid ${P.border}`, animation: `skpulse 1.4s infinite ${i * 0.12}s` }} />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <GlassPanel style={{ padding: 32, textAlign: 'center' }}>
                <p style={{ color: P.red, marginBottom: 16 }}>{error}</p>
                <button onClick={load} style={{ padding: '9px 22px', background: P.blueGlow, border: `1px solid ${P.blue}55`, color: P.blue, borderRadius: 9, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', fontSize: 13 }}>Retry</button>
            </GlassPanel>
        );
    }

    if (!requests.length) {
        return (
            <GlassPanel style={{ padding: '56px 20px', textAlign: 'center', animation: 'cardIn 0.35s ease both' }}>
                <div style={{ color: P.muted, display: 'flex', justifyContent: 'center', transform: 'scale(1.8)', marginBottom: 18 }}>{icons.mail}</div>
                <p style={{ color: P.text, fontSize: 16, fontWeight: 700, margin: '0 0 8px', fontFamily: 'var(--font-display)' }}>No pending requests</p>
                <p style={{ color: P.sub, fontSize: 13, margin: 0 }}>When an organizer sends you a sourcing request, it will appear here for review.</p>
            </GlassPanel>
        );
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {requests.map((req, i) => {
                const event = req.eventId;
                const isAccepting = responding === req._id + 'accepted';
                const isRejecting = responding === req._id + 'rejected';
                return (
                    <div
                        key={req._id}
                        className="vd-card"
                        style={{
                            background: 'rgba(19,19,30,0.72)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
                            border: `1px solid ${P.border}`, borderRadius: 14, padding: 20,
                            animation: `cardIn 0.32s ease ${i * 0.07}s both`,
                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: P.text, fontFamily: 'var(--font-display)' }}>
                                    {event?.title || 'Event'}
                                </h3>
                                {event?.date && (
                                    <div style={{ fontSize: 12, color: P.sub, marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <span style={{ color: P.indigo, display: 'flex' }}>{icons.calendar}</span>
                                        {new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </div>
                                )}
                            </div>
                            <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: P.amberGlow, color: P.amber, border: `1px solid ${P.amber}33` }}>
                                Pending
                            </span>
                        </div>

                        {req.deliveryLocation?.venueName && (
                            <div style={{ fontSize: 12, color: P.sub, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ color: P.muted, display: 'flex' }}>{icons.mapPin}</span>
                                {req.deliveryLocation.venueName}
                            </div>
                        )}

                        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 9, padding: '10px 12px', marginBottom: 12, border: `1px solid ${P.borderSub}` }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Requested Items</div>
                            {(req.requestedItems || []).map((item, idx) => (
                                <div key={idx} style={{ fontSize: 13, color: P.sub, marginBottom: 3, display: 'flex', justifyContent: 'space-between' }}>
                                    <span>• {item.itemName}</span>
                                    <span style={{ fontWeight: 600, color: P.text }}>×{item.quantity} {item.unit}</span>
                                </div>
                            ))}
                        </div>

                        <div style={{ fontSize: 12, color: P.sub, marginBottom: 14 }}>
                            <span style={{ color: P.muted }}>Delivery:</span>{' '}
                            <span style={{ fontWeight: 600, color: P.text }}>
                                {req.deliveryDate ? new Date(req.deliveryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                            </span>
                        </div>

                        <div style={{ display: 'flex', gap: 10, borderTop: `1px solid ${P.borderSub}`, paddingTop: 14 }}>
                            <button
                                onClick={() => handleRespond(req._id, 'rejected')}
                                disabled={!!responding}
                                style={{ flex: 1, padding: '10px 0', borderRadius: 9, border: `1px solid ${P.border}`, background: 'transparent', color: P.sub, fontSize: 13, fontWeight: 600, cursor: responding ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
                            >
                                {isRejecting ? 'Declining…' : 'Decline'}
                            </button>
                            <button
                                onClick={() => handleRespond(req._id, 'accepted')}
                                disabled={!!responding}
                                style={{ flex: 2, padding: '10px 0', borderRadius: 9, border: 'none', background: isAccepting ? P.hover : `linear-gradient(135deg, ${P.blue} 0%, ${P.teal} 100%)`, color: isAccepting ? P.muted : '#0a0a12', fontSize: 13, fontWeight: 700, cursor: responding ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
                            >
                                {isAccepting ? 'Accepting…' : 'Accept Request'}
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ─── ProfileEditor ────────────────────────────────────────────────────────────

function ProfileEditor({ onSaved, onLogout }) {
    const [profile, setProfile]       = useState(null);
    const [loading, setLoading]       = useState(true);
    const [saving, setSaving]         = useState(false);
    const [error, setError]           = useState(null);
    const [saved, setSaved]           = useState(false);
    const [supplyInput, setSupplyInput] = useState('');
    const [form, setForm]             = useState(EMPTY_PROFILE);

    useEffect(() => { loadProfile(); }, []);

    async function loadProfile(attempt = 0) {  setLoading(true);
        setError(null);
      try {
            
            const res = await fetchMyVendorProfile();
            const p = res.data || EMPTY_PROFILE;
            setProfile(p);
            setForm({
                companyName: p.companyName || '',
                suppliesOffered: p.suppliesOffered || [],
                mainLocation: { city: p.mainLocation?.city || '', area: p.mainLocation?.area || '', address: p.mainLocation?.address || '' },
                pricingList: (p.pricingList || []).map(r => ({ ...r })),
                contactInfo: { contactPerson: p.contactInfo?.contactPerson || '', phone: p.contactInfo?.phone || '', email: p.contactInfo?.email || '' },
            });
                        setLoading(false);
        } catch (err) {
                if (attempt < 1 && /not found/i.test(err.message || '')) {
                await new Promise(resolve => setTimeout(resolve, 300));
                return loadProfile(attempt + 1);
            }
            setError(err.message || 'Could not load profile.');
            setLoading(false);
        }
    }

    function setField(path, value) {
        setForm(prev => {
            const parts = path.split('.');
            if (parts.length === 1) return { ...prev, [path]: value };
            const [top, sub] = parts;
            return { ...prev, [top]: { ...prev[top], [sub]: value } };
        });
    }

    function addSupply() {
        const t = supplyInput.trim();
        if (!t || form.suppliesOffered.includes(t)) return;
        setForm(prev => ({ ...prev, suppliesOffered: [...prev.suppliesOffered, t] }));
        setSupplyInput('');
    }

    function removeSupply(s) {
        setForm(prev => ({ ...prev, suppliesOffered: prev.suppliesOffered.filter(x => x !== s) }));
    }

    function addPricingRow() {
        setForm(prev => ({ ...prev, pricingList: [...prev.pricingList, { itemName: '', category: 'Other', unit: '', price: '', currency: 'EGP' }] }));
    }

    function updatePricingRow(idx, key, value) {
        setForm(prev => {
            const list = prev.pricingList.map((r, i) => i === idx ? { ...r, [key]: value } : r);
            return { ...prev, pricingList: list };
        });
    }

    function removePricingRow(idx) {
        setForm(prev => ({ ...prev, pricingList: prev.pricingList.filter((_, i) => i !== idx) }));
    }

    async function handleSave() {
        try {
            setSaving(true);
            setError(null);
            const payload = {
                ...form,
                pricingList: form.pricingList.map(r => ({ ...r, price: parseFloat(r.price) || 0 })),
            };
            await updateMyVendorProfile(payload);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
            if (onSaved) onSaved(payload);
        } catch (err) {
            setError(err.message || 'Failed to save profile.');
        } finally {
            setSaving(false);
        }
    }

    const inp = (val, onChange, placeholder, extraStyle = {}) => (
        <input
            value={val}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            style={{
                background: 'rgba(255,255,255,0.06)', border: `1px solid ${P.border}`, borderRadius: 8,
                padding: '9px 12px', color: P.text, fontSize: 13, fontFamily: 'inherit', width: '100%',
                outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s', ...extraStyle,
            }}
        />
    );

    if (loading) return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ height: 120, background: P.surface, borderRadius: 14, border: `1px solid ${P.border}`, animation: `skpulse 1.4s infinite ${i * 0.12}s` }} />
            ))}
        </div>
    );

    if (error && !profile) return (
        <div style={{ textAlign: 'center', padding: 48 }}>
            <p style={{ color: P.red, marginBottom: 16 }}>{error}</p>
            <button onClick={loadProfile} style={{ padding: '9px 22px', background: P.blueGlow, border: `1px solid ${P.blue}55`, color: P.blue, borderRadius: 9, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', fontSize: 13 }}>Retry</button>
        </div>
    );

    const section = (title, children) => (
        <div style={{ background: 'rgba(19,19,30,0.72)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', border: `1px solid ${P.border}`, borderRadius: 14, padding: 22, marginBottom: 16, animation: 'cardIn 0.32s ease both' }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: P.muted, marginBottom: 16 }}>{title}</div>
            {children}
        </div>
    );

    const label = txt => <div style={{ fontSize: 12, color: P.sub, fontWeight: 600, marginBottom: 5 }}>{txt}</div>;

    return (
        <div>
            {section('Company Identity', (
                <div>
                    {label('Company / Business Name')}
                    {inp(form.companyName, v => setField('companyName', v), 'e.g. Bright Blooms Events')}
                </div>
            ))}

            {section('Contact Information', (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
                    <div>{label('Contact Person')}{inp(form.contactInfo.contactPerson, v => setField('contactInfo.contactPerson', v), 'Full name')}</div>
                    <div>{label('Phone')}{inp(form.contactInfo.phone, v => setField('contactInfo.phone', v), '+20 10...')}</div>
                    <div>{label('Email')}{inp(form.contactInfo.email, v => setField('contactInfo.email', v), 'hello@company.com')}</div>
                </div>
            ))}

            {section('Main Location', (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
                    <div>{label('City')}{inp(form.mainLocation.city, v => setField('mainLocation.city', v), 'e.g. Cairo')}</div>
                    <div>{label('Area / District')}{inp(form.mainLocation.area, v => setField('mainLocation.area', v), 'e.g. Maadi')}</div>
                    <div style={{ gridColumn: '1 / -1' }}>{label('Street Address')}{inp(form.mainLocation.address, v => setField('mainLocation.address', v), 'Full address...')}</div>
                </div>
            ))}

            {section('Supplies & Services Offered', (
                <div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                        {inp(supplyInput, setSupplyInput, 'e.g. Floral Arrangements', { flex: 1 })}
                        <button
                            onClick={addSupply}
                            style={{ padding: '9px 16px', background: P.blueGlow, border: `1px solid ${P.blue}55`, color: P.blue, borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                        >
                            + Add
                        </button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {form.suppliesOffered.length === 0 && <span style={{ fontSize: 12, color: P.muted }}>No supplies added yet.</span>}
                        {form.suppliesOffered.map(s => (
                            <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: P.indigoGlow, color: P.indigo, border: `1px solid ${P.indigo}44` }}>
                                {s}
                                <button onClick={() => removeSupply(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.muted, padding: 0, fontSize: 13, lineHeight: 1 }}>×</button>
                            </span>
                        ))}
                    </div>
                </div>
            ))}

            {section('Pricing List', (
                <div>
                    {form.pricingList.length > 0 && (
                        <div style={{ overflowX: 'auto', marginBottom: 12 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                    <tr>
                                        {['Item Name', 'Category', 'Unit', 'Price', 'Currency', ''].map(h => (
                                            <th key={h} style={{ textAlign: 'left', padding: '6px 8px', fontSize: 10, fontWeight: 700, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: `1px solid ${P.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {form.pricingList.map((row, idx) => (
                                        <tr key={idx}>
                                            <td style={{ padding: '6px 8px' }}><input value={row.itemName} onChange={e => updatePricingRow(idx, 'itemName', e.target.value)} placeholder="Item name" style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${P.border}`, borderRadius: 6, padding: '6px 10px', color: P.text, fontSize: 12, fontFamily: 'inherit', width: 130, outline: 'none' }} /></td>
                                            <td style={{ padding: '6px 8px' }}>
                                                <OpalSelect
                                                    value={row.category}
                                                    onChange={(v) => updatePricingRow(idx, 'category', v)}
                                                    options={PRICE_CATEGORIES}
                                                    accent="violet"
                                                    style={{ minWidth: 130 }}
                                                />
                                            </td>
                                            <td style={{ padding: '6px 8px' }}><input value={row.unit} onChange={e => updatePricingRow(idx, 'unit', e.target.value)} placeholder="per piece" style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${P.border}`, borderRadius: 6, padding: '6px 10px', color: P.text, fontSize: 12, fontFamily: 'inherit', width: 90, outline: 'none' }} /></td>
                                            <td style={{ padding: '6px 8px' }}><input type="number" value={row.price} onChange={e => updatePricingRow(idx, 'price', e.target.value)} placeholder="0" style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${P.border}`, borderRadius: 6, padding: '6px 10px', color: P.text, fontSize: 12, fontFamily: 'inherit', width: 80, outline: 'none' }} /></td>
                                            <td style={{ padding: '6px 8px' }}><input value={row.currency} onChange={e => updatePricingRow(idx, 'currency', e.target.value)} placeholder="EGP" style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${P.border}`, borderRadius: 6, padding: '6px 10px', color: P.text, fontSize: 12, fontFamily: 'inherit', width: 60, outline: 'none' }} /></td>
                                            <td style={{ padding: '6px 8px' }}><button onClick={() => removePricingRow(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.muted, fontSize: 16, padding: '2px 4px' }}>×</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <button onClick={addPricingRow} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${P.border}`, color: P.sub, borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12, fontFamily: 'inherit' }}>
                        + Add pricing row
                    </button>
                </div>
            ))}

            {error && <p style={{ color: P.red, fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                        padding: '11px 28px',
                        background: `linear-gradient(135deg, ${P.blue} 0%, ${P.teal} 100%)`,
                        border: 'none', borderRadius: 10, color: '#0a0a12',
                        fontWeight: 700, fontSize: 14,
                        cursor: saving ? 'not-allowed' : 'pointer',
                        fontFamily: 'inherit', opacity: saving ? 0.7 : 1,
                    }}
                >
                    {saving ? 'Saving…' : 'Save Profile'}
                </button>

                <button
                    onClick={onLogout}
                    style={{
                        padding: '11px 28px',
                        background: 'rgba(220,38,38,0.16)',
                        border: '1px solid rgba(248,113,113,0.35)',
                        borderRadius: 10, color: '#f87171',
                        fontWeight: 800, fontSize: 14,
                        cursor: 'pointer', fontFamily: 'inherit',
                    }}
                >
                    Logout
                </button>

                {saved && (
                    <span style={{ fontSize: 13, color: P.teal, fontWeight: 600 }}>✓ Saved successfully</span>
                )}
            </div>
        </div>
    );
}

// ─── PageVendorDashboard ──────────────────────────────────────────────────────

export default function PageVendorDashboard() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    function handleLogout() {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('loggedInUser');
        navigate('/login');
    }

    const [vendorId, setVendorId]   = useState('');
    const [orders, setOrders]       = useState([]);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState(null);
    const [updating, setUpdating]   = useState(null);
    const [filter, setFilter]       = useState('all');
    const [activeTab, setActiveTab]       = useState('requests');
    const [visitedTabs, setVisitedTabs]   = useState(() => new Set(['requests']));
    const [notifications, setNotifications] = useState([]);

    // Resolve vendor ID from localStorage on mount
    useEffect(() => {
        const loggedInUser =
            JSON.parse(localStorage.getItem('loggedInUser')) ||
            JSON.parse(localStorage.getItem('user'));

        if (!loggedInUser?._id && !loggedInUser?.id) {
            console.warn('No logged-in vendor found in localStorage.');
            return;
        }

        setVendorId(loggedInUser._id || loggedInUser.id);
    }, []);

    // Fetch notifications once vendor ID is known
    useEffect(() => {
        if (!vendorId) return;
        fetchNotifications(vendorId).then((data) =>
            setNotifications(data.data || data || [])
        );
    }, [vendorId]);

    const handleMarkAsRead = (id) => {
        setNotifications((prev) =>
            prev.map((n) => (n._id === id ? { ...n, status: 'read' } : n))
        );
        markNotificationAsRead(id).catch(() => {});
    };

    const switchTab = (tabId) => {
        setActiveTab(tabId);
        setVisitedTabs(prev => new Set([...prev, tabId]));
    };

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && VENDOR_TABS.some(t => t.id === tab)) switchTab(tab);
    }, [searchParams]);

    useEffect(() => { load(); }, []);

    async function load() {
        try {
            setLoading(true);
            setError(null);
            const res = await fetchMyVendorOrders();
            setOrders(res.data || []);
        } catch (err) {
            setError(err.message || 'Failed to load orders.');
        } finally {
            setLoading(false);
        }
    }

    async function advanceStatus(order) {
        const currentStatus = order.delivery?.status ?? null;
        const action = NEXT_ACTION[currentStatus];
        if (!action) return;

        setUpdating(order._id);
        try {
            const extra = action.nextStatus === 'delivered'
                ? { estimatedArrivalTime: new Date().toISOString() }
                : {};
            await updateDeliveryStatus(order._id, { status: action.nextStatus, ...extra });
            setOrders(prev => prev.map(o =>
                o._id === order._id
                    ? { ...o, delivery: { ...o.delivery, status: action.nextStatus, ...extra } }
                    : o
            ));
        } catch (err) {
            alert(err.message || 'Failed to update delivery status.');
        } finally {
            setUpdating(null);
        }
    }

    const filtered = orders.filter(o => {
        if (filter === 'all') return true;
        if (filter === 'in_progress') {
            const s = o.delivery?.status;
            return s === 'preparing' || s === 'out_for_delivery' || s == null;
        }
        return o.delivery?.status === filter;
    });

    const stats = [
        { label: 'Total',       value: orders.length, accent: P.blue },
        { label: 'In Progress', value: orders.filter(o => ['preparing', 'out_for_delivery'].includes(o.delivery?.status)).length, accent: P.amber },
        { label: 'Delivered',   value: orders.filter(o => o.delivery?.status === 'delivered').length, accent: P.teal },
    ];

    const dockItems = VENDOR_TABS.map(tab => ({
        icon:   <DockTabIcon icon={tab.icon} />,
        label:  tab.label,
        active: activeTab === tab.id,
        onClick: () => switchTab(tab.id),
    }));

    return (
        <div style={{
            height: '100vh', display: 'flex', flexDirection: 'column',
            background: 'var(--opal-bg)', fontFamily: 'var(--font-body)',
            color: 'var(--opal-text)', overflow: 'hidden',
        }}>
            <style>{`
                @keyframes pageIn  { from { opacity:0 }                              to { opacity:1 } }
                @keyframes cardIn  { from { opacity:0; transform:translateY(18px) }  to { opacity:1; transform:translateY(0) } }
                @keyframes tabIn   { from { opacity:0; transform:translateY(14px) scale(0.994); } to { opacity:1; transform:translateY(0) scale(1); } }
                @keyframes skpulse { 0%,100%{opacity:1} 50%{opacity:.3} }
                .tab-panel { animation: tabIn 0.3s cubic-bezier(0.22,1,0.36,1) forwards; }
                .vd-card { transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease; }
                .vd-card:hover { transform:translateY(-3px); border-color:rgba(139,109,255,0.35) !important; box-shadow:0 0 0 1px rgba(139,109,255,0.12), 0 8px 28px rgba(139,109,255,0.16) !important; }
                .vd-btn-advance { transition:opacity 0.15s, transform 0.12s; }
                .vd-btn-advance:hover:not(:disabled) { opacity:0.85; transform:translateY(-1px); }
                .vd-btn-advance:active:not(:disabled) { transform:scale(0.97); }
                .stat-tile { transition:transform 0.2s ease, box-shadow 0.2s ease; cursor:pointer; }
                .stat-tile:hover { transform:translateY(-3px); }
            `}</style>

            <AppHeader
                crumb={TAB_META[activeTab]?.title || 'Vendor Dashboard'}
                right={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: P.tealGlow, color: P.teal, border: `1px solid ${P.teal}44` }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: P.teal, display: 'inline-block', boxShadow: `0 0 6px ${P.teal}` }} />
                        Vendor Portal
                    </div>
                }
            />

            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 130 }}>
                <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px 0', animation: 'pageIn 0.3s ease' }}>

                    <div style={{ marginBottom: 24 }}>
                        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: P.text, letterSpacing: '-0.03em', fontFamily: 'var(--font-display)' }}>
                            {TAB_META[activeTab]?.title}
                        </h1>
                        <p style={{ margin: '5px 0 0', fontSize: 14, color: P.sub }}>
                            {TAB_META[activeTab]?.subtitle}
                        </p>
                    </div>

                    {/* Incoming Requests */}
                    {visitedTabs.has('requests') && (
                        <div className="tab-panel" style={{ display: activeTab === 'requests' ? 'block' : 'none' }}>
                            <IncomingRequests onAccepted={load} />

                            {/* Notifications */}
                            <div style={{ marginTop: 32 }}>
                                <div style={{ marginBottom: 16 }}>
                                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: P.text, fontFamily: 'var(--font-display)' }}>
                                        🔔 Notifications
                                    </h2>
                                    <p style={{ margin: '4px 0 0', fontSize: 13, color: P.sub }}>
                                        {notifications.filter((n) => n.status === 'unread').length > 0
                                            ? `${notifications.filter((n) => n.status === 'unread').length} unread`
                                            : "You're all caught up."}
                                    </p>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {notifications.length === 0 ? (
                                        <div style={{ padding: '32px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.03)', border: `1px solid ${P.border}`, borderRadius: 14, color: P.muted, fontSize: 13 }}>
                                            No notifications to show yet.
                                        </div>
                                    ) : (
                                        notifications.map((n) => {
                                            const isUnread = n.status === 'unread';
                                            return (
                                                <div
                                                    key={n._id || n.id}
                                                    onClick={() => isUnread && handleMarkAsRead(n._id)}
                                                    style={{
                                                        background: 'rgba(255,255,255,0.04)',
                                                        border: `1px solid ${P.border}`,
                                                        borderLeft: isUnread ? '4px solid #7C5CFC' : `4px solid ${P.border}`,
                                                        borderRadius: 16,
                                                        padding: '18px 20px',
                                                        boxShadow: '0 14px 40px rgba(0,0,0,0.18)',
                                                        cursor: isUnread ? 'pointer' : 'default',
                                                        opacity: isUnread ? 1 : 0.75,
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                                                        <div style={{ fontSize: 15, fontWeight: 700, color: '#F8FAFC' }}>{n.title}</div>
                                                        {isUnread && (
                                                            <span style={{ fontSize: 11, fontWeight: 700, color: '#A78BFA', background: 'rgba(167,139,250,0.18)', padding: '4px 10px', borderRadius: 999, whiteSpace: 'nowrap' }}>
                                                                NEW
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div style={{ fontSize: 13, color: 'rgba(232,230,240,0.7)', marginTop: 8 }}>{n.message}</div>
                                                    <div style={{ fontSize: 11, color: 'rgba(232,230,240,0.45)', marginTop: 10 }}>
                                                        {n.scheduledFor
                                                            ? new Date(n.scheduledFor).toLocaleString()
                                                            : new Date(n.createdAt).toLocaleString()}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Business Profile */}
                    {visitedTabs.has('profile') && (
                        <div className="tab-panel" style={{ display: activeTab === 'profile' ? 'block' : 'none' }}>
                            <ProfileEditor onLogout={handleLogout} />
                        </div>
                    )}

                    {/* Invoices */}
                    {visitedTabs.has('invoices') && (
                        <div className="tab-panel" style={{ display: activeTab === 'invoices' ? 'block' : 'none' }}>
                            <TabVendorInvoicesSelf />
                        </div>
                    )}

                    {/* Orders */}
                    {visitedTabs.has('orders') && (
                        <div className="tab-panel" style={{ display: activeTab === 'orders' ? 'block' : 'none' }}>

                            {/* Stat tiles */}
                            {!loading && orders.length > 0 && (
                                <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
                                    {stats.map((st, i) => (
                                        <div
                                            key={st.label}
                                            className="stat-tile"
                                            onClick={() => setFilter(st.label === 'Total' ? 'all' : st.label === 'In Progress' ? 'in_progress' : 'delivered')}
                                            style={{
                                                flex: '1 1 100px', background: 'rgba(19,19,30,0.72)',
                                                backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                                                border: `1px solid ${P.border}`, borderRadius: 14, padding: '16px 20px', textAlign: 'center',
                                                animation: `cardIn 0.3s ease ${i * 0.06}s both`,
                                                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                                            }}
                                        >
                                            <div style={{ fontSize: 26, fontWeight: 900, color: st.accent, lineHeight: 1, fontFamily: 'var(--font-display)', letterSpacing: '-0.04em' }}>{st.value}</div>
                                            <div style={{ fontSize: 10, color: P.muted, marginTop: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em' }}>{st.label}</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Filter pills */}
                            <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.05)', padding: 4, borderRadius: 10, marginBottom: 24, width: 'fit-content' }}>
                                {FILTERS.map(f => (
                                    <button
                                        key={f.id}
                                        onClick={() => setFilter(f.id)}
                                        style={{
                                            padding: '7px 16px', border: 'none', borderRadius: 7, fontSize: 13,
                                            fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                                            background: filter === f.id ? P.surface : 'transparent',
                                            color: filter === f.id ? P.text : P.sub,
                                            boxShadow: filter === f.id ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
                                            transition: 'all 0.15s',
                                        }}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>

                            {/* Loading skeleton */}
                            {loading && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 16 }}>
                                    {[1, 2, 3].map(i => (
                                        <div key={i} style={{ height: 280, background: P.surface, borderRadius: 14, border: `1px solid ${P.border}`, animation: `skpulse 1.4s infinite ${i * 0.12}s` }} />
                                    ))}
                                </div>
                            )}

                            {/* Error state */}
                            {!loading && error && (
                                <GlassPanel style={{ padding: 32, textAlign: 'center' }}>
                                    <div style={{ color: P.red, display: 'flex', justifyContent: 'center', transform: 'scale(1.5)', marginBottom: 16 }}>{icons.warning}</div>
                                    <p style={{ color: P.red, fontSize: 14, margin: '0 0 16px' }}>{error}</p>
                                    <button onClick={load} style={{ padding: '9px 22px', background: P.blueGlow, border: `1px solid ${P.blue}55`, color: P.blue, borderRadius: 9, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', fontSize: 13 }}>Retry</button>
                                </GlassPanel>
                            )}

                            {/* Empty state */}
                            {!loading && !error && filtered.length === 0 && (
                                <GlassPanel style={{ padding: '56px 20px', textAlign: 'center', animation: 'cardIn 0.35s ease both' }}>
                                    <div style={{ color: P.muted, display: 'flex', justifyContent: 'center', transform: 'scale(1.8)', marginBottom: 18 }}>{icons.vendors}</div>
                                    <p style={{ color: P.text, fontSize: 16, fontWeight: 700, margin: '0 0 8px', fontFamily: 'var(--font-display)' }}>
                                        {filter === 'all' ? 'No accepted orders yet' : 'No orders match this filter'}
                                    </p>
                                    <p style={{ color: P.sub, fontSize: 13 }}>
                                        {filter === 'all' ? 'Orders will appear here once an organizer accepts your response.' : 'Try switching to a different filter.'}
                                    </p>
                                </GlassPanel>
                            )}

                            {/* Order cards */}
                            {!loading && !error && filtered.length > 0 && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 16 }}>
                                    {filtered.map((order, i) => {
                                        const deliveryStatus = order.delivery?.status ?? null;
                                        const action      = NEXT_ACTION[deliveryStatus];
                                        const isDelivered = deliveryStatus === 'delivered';
                                        const event       = order.eventId;
                                        const isUpdating  = updating === order._id;

                                        return (
                                            <div
                                                key={order._id}
                                                className="vd-card"
                                                style={{
                                                    background: 'rgba(19,19,30,0.72)',
                                                    backdropFilter: 'blur(18px) saturate(140%)',
                                                    WebkitBackdropFilter: 'blur(18px) saturate(140%)',
                                                    border: `1px solid ${P.border}`,
                                                    borderRadius: 14, padding: 20,
                                                    display: 'flex', flexDirection: 'column',
                                                    animation: `cardIn 0.32s ease ${i * 0.07}s both`,
                                                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: P.text, fontFamily: 'var(--font-display)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {event?.title || 'Event'}
                                                        </h3>
                                                        {event?.date && (
                                                            <div style={{ fontSize: 12, color: P.sub, marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                <span style={{ color: P.indigo, display: 'flex' }}>{icons.calendar}</span>
                                                                {new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <DeliveryBadge status={deliveryStatus} />
                                                </div>

                                                {order.deliveryLocation?.venueName && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: P.sub, marginBottom: 10 }}>
                                                        <span style={{ color: P.muted, display: 'flex', flexShrink: 0 }}>{icons.mapPin}</span>
                                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {order.deliveryLocation.venueName}
                                                        </span>
                                                    </div>
                                                )}

                                                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 9, padding: '10px 12px', marginBottom: 12, border: `1px solid ${P.borderSub}` }}>
                                                    <div style={{ fontSize: 10, fontWeight: 700, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Ordered Items</div>
                                                    {(order.requestedItems || []).map((item, idx) => (
                                                        <div key={idx} style={{ fontSize: 13, color: P.sub, marginBottom: 3, display: 'flex', justifyContent: 'space-between' }}>
                                                            <span>• {item.itemName}</span>
                                                            <span style={{ fontWeight: 600, color: P.text }}>×{item.quantity} {item.unit}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div style={{ fontSize: 12, color: P.sub, marginBottom: isDelivered ? 8 : 14, display: 'flex', gap: 6 }}>
                                                    <span style={{ color: P.muted }}>Delivery window:</span>
                                                    <span style={{ fontWeight: 600, color: P.text }}>
                                                        {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                                                    </span>
                                                </div>

                                                {isDelivered && order.delivery?.estimatedArrivalTime && (
                                                    <div style={{ fontSize: 12, color: P.teal, marginBottom: 14, display: 'flex', gap: 6, alignItems: 'center' }}>
                                                        <span style={{ color: P.teal, display: 'flex' }}>{icons.checkCircle}</span>
                                                        <span style={{ fontWeight: 600 }}>
                                                            Confirmed {new Date(order.delivery.estimatedArrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            {' · '}{new Date(order.delivery.estimatedArrivalTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                                        </span>
                                                    </div>
                                                )}

                                                <ProgressSteps status={deliveryStatus} />

                                                <div style={{ borderTop: `1px solid ${P.borderSub}`, paddingTop: 14, marginTop: 14 }}>
                                                    {isDelivered ? (
                                                        <div style={{ width: '100%', padding: '9px 0', borderRadius: 9, background: P.tealGlow, color: P.teal, fontSize: 13, fontWeight: 700, textAlign: 'center', border: `1px solid ${P.teal}33` }}>
                                                            ✓ Delivery Confirmed
                                                        </div>
                                                    ) : action ? (
                                                        <button
                                                            className="vd-btn-advance"
                                                            onClick={() => advanceStatus(order)}
                                                            disabled={isUpdating}
                                                            style={{
                                                                width: '100%', padding: '10px 0', borderRadius: 9, border: 'none',
                                                                background: isUpdating ? P.hover : `linear-gradient(135deg, ${P.blue} 0%, ${P.teal} 100%)`,
                                                                color: isUpdating ? P.muted : '#0a0a12',
                                                                fontSize: 13, fontWeight: 700, cursor: isUpdating ? 'not-allowed' : 'pointer',
                                                                fontFamily: 'inherit',
                                                            }}
                                                        >
                                                            {isUpdating ? 'Updating…' : action.label}
                                                        </button>
                                                    ) : null}
                                                </div>

                                                <MessageComposer orderId={order._id} />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <Dock items={dockItems} />
        </div>
    );
}