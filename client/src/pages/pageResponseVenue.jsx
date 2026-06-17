import { useState, useEffect, useRef, useCallback } from 'react';
import {
    VscHome, VscMail, VscCalendar, VscBell, VscPerson,
} from 'react-icons/vsc';
import {
    fetchBookingRequests,
    approveBooking,
    declineBooking,
    fetchMessages,
    sendMessage,
    fetchVenueAvailability,
} from '../services/serviceResponseVenue.js';
import Dock from '../components/componentDock.jsx';
import AppHeader from '../components/componentAppHeader.jsx';
import CalendarAvailability from '../components/componentCalendar.jsx';
import MiniCalendar from '../components/componentMiniCalendar.jsx';
import '../components/componentTheme.css';
import { useNavigate } from 'react-router-dom';

// ─── Decode user_id from stored JWT (reads payload only — auth is server-side) ──
function getUserIdFromToken() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return null;
        const payload = JSON.parse(
            atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
        );
        return payload.user_id ?? null;
    } catch {
        return null;
    }
}

// ─── Status tokens (mapped onto the Opal palette) ─────────────────────────
const STATUS = {
    Pending: { bg: 'var(--opal-amber-dim)', border: 'rgba(245,179,74,0.3)', text: 'var(--opal-amber)' },
    Approved: { bg: 'var(--opal-teal-dim)', border: 'rgba(79,209,197,0.28)', text: 'var(--opal-teal)' },
    Declined: { bg: 'var(--opal-red-dim)', border: 'rgba(255,92,102,0.28)', text: 'var(--opal-red)' },
    Countered: { bg: 'var(--opal-violet-dim)', border: 'rgba(124,92,252,0.28)', text: 'var(--opal-violet)' },
};

// ─── Tiny helpers ───────────────────────────────────────────────────────────

function Avatar({ name = '?', size = 36 }) {
    const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    return (
        <div style={{
            width: size, height: size, borderRadius: size / 2.8,
            background: 'linear-gradient(135deg, var(--opal-violet) 0%, var(--opal-teal) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: size * 0.33, fontWeight: 700, color: '#0a0a0f', flexShrink: 0,
            letterSpacing: -0.3, fontFamily: 'var(--font-display)',
        }}>
            {initials}
        </div>
    );
}

function Badge({ status }) {
    const s = STATUS[status] ?? STATUS.Pending;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 9px', borderRadius: 20,
            background: s.bg, border: `1px solid ${s.border}`,
            color: s.text, fontSize: 11, fontWeight: 600, letterSpacing: 0.3,
        }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.text }} />
            {status}
        </span>
    );
}

function Btn({ label, color, textColor = '#0a0a0f', onClick, disabled, style = {} }) {
    const [hov, setHov] = useState(false);
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
                padding: '8px 18px', borderRadius: 10, border: 'none',
                background: color,
                opacity: hov && !disabled ? 0.85 : 1,
                color: textColor, fontSize: 13, fontWeight: 600,
                cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)',
                transition: 'all 0.15s', ...style,
                ...(disabled ? { opacity: 0.35 } : {}),
            }}
        >
            {label}
        </button>
    );
}

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtTime = d => new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

// ─── Glass card wrapper ─────────────────────────────────────────────────────

function GlassCard({ children, style = {}, ...rest }) {
    return (
        <div
            {...rest}
            style={{
                background: 'rgba(30,30,41,0.55)',
                backdropFilter: 'blur(18px) saturate(140%)',
                WebkitBackdropFilter: 'blur(18px) saturate(140%)',
                border: '1px solid var(--opal-border)',
                borderRadius: 16,
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                ...style,
            }}
        >
            {children}
        </div>
    );
}

// ─── Chat bubble ─────────────────────────────────────────────────────────────

function Bubble({ msg, isMine }) {
    const isCP = msg.type === 'counter_proposal';
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
            {isCP && (
                <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase',
                    color: 'var(--opal-amber)', marginBottom: 4, paddingLeft: isMine ? 0 : 4,
                }}>
                    ↩ Counter-proposal
                </span>
            )}
            <div style={{
                maxWidth: '72%', padding: '10px 14px', borderRadius: 14,
                borderBottomRightRadius: isMine ? 4 : 14,
                borderBottomLeftRadius: isMine ? 14 : 4,
                background: isMine ? 'var(--opal-violet)' : 'var(--opal-surface)',
                border: isCP ? '1px solid rgba(245,179,74,0.28)' : '1px solid var(--opal-border)',
                color: isMine ? '#0a0a0f' : 'var(--opal-text)', fontSize: 15, lineHeight: 1.55,
            }}>
                {msg.text}
                {isCP && msg.counterProposal && (
                    <div style={{
                        marginTop: 8, paddingTop: 8,
                        borderTop: `1px solid ${isMine ? 'rgba(10,10,15,0.18)' : 'rgba(255,255,255,0.1)'}`,
                        fontSize: 12, color: isMine ? 'rgba(10,10,15,0.7)' : 'var(--opal-sub)',
                        display: 'flex', flexDirection: 'column', gap: 3,
                    }}>
                        {msg.counterProposal.adjustedPrice != null && (
                            <span>💰 Adjusted price: <strong>${msg.counterProposal.adjustedPrice.toLocaleString()}</strong></span>
                        )}
                        {msg.counterProposal.proposedDates?.length > 0 && (
                            <span>📅 Proposed dates: <strong>
                                {msg.counterProposal.proposedDates
                                    .map(d => new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }))
                                    .join(', ')}
                            </strong></span>
                        )}
                    </div>
                )}
            </div>
            <span style={{ fontSize: 10, color: 'var(--opal-muted)', marginTop: 3, paddingLeft: 4, paddingRight: 4 }}>
                {fmtTime(msg.createdAt)}
                {msg.readAt && isMine && <span style={{ marginLeft: 6, color: 'var(--opal-teal)' }}>✓ Read</span>}
            </span>
        </div>
    );
}

// ─── Message thread panel ─────────────────────────────────────────────────────

function MessageThread({ booking, currentUserId, defaultIsCP = false }) {
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [isCP, setIsCP] = useState(defaultIsCP);
    const [cpPrice, setCpPrice] = useState('');
    const [cpDates, setCpDates] = useState([]);
    const [calOpen, setCalOpen] = useState(false);   // popover open/close
    const [sending, setSending] = useState(false);
    const bottomRef = useRef(null);
    const pollRef = useRef(null);
    const calBtnRef = useRef(null);                   // anchor for popover position

    // Re-seed isCP whenever the prop changes
    useEffect(() => {
        setIsCP(defaultIsCP);
        if (!defaultIsCP) { setCpPrice(''); setCpDates([]); setCalOpen(false); }
    }, [defaultIsCP, booking?._id]);

    // Close calendar popover when CP mode is toggled off
    useEffect(() => { if (!isCP) setCalOpen(false); }, [isCP]);

    const load = useCallback(async () => {
        if (!booking?._id) return;
        try {
            const msgs = await fetchMessages(booking._id);
            setMessages(msgs);
        } catch { /* silent */ }
    }, [booking?._id]);

    useEffect(() => {
        setMessages([]);
        setText('');
        setIsCP(defaultIsCP);
        load();
        pollRef.current = setInterval(load, 6000);
        return () => clearInterval(pollRef.current);
    }, [load]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!text.trim() || sending) return;
        setSending(true);
        try {
            const cp = isCP ? {
                adjustedPrice: cpPrice ? Number(cpPrice) : null,
                proposedDates: cpDates.length ? cpDates : null,
            } : null;
            const msg = await sendMessage(booking._id, {
                text,
                type: isCP ? 'counter_proposal' : 'message',
                counterProposal: cp,
            });
            setMessages(prev => [...prev, msg]);
            setText('');
            setCpPrice('');
            setCpDates([]);
            setCalOpen(false);
            setIsCP(false);
        } finally {
            setSending(false);
        }
    };

    const input = {
        background: 'var(--opal-surface)', border: '1px solid var(--opal-border)',
        borderRadius: 10, color: 'var(--opal-text)', fontSize: 13,
        padding: '9px 12px', fontFamily: 'var(--font-body)', outline: 'none',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            {/* Scrollable message list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 24px' }}>
                {messages.length === 0 && (
                    <p style={{ textAlign: 'center', color: 'var(--opal-muted)', fontSize: 13, marginTop: 32 }}>
                        No messages yet — start the conversation.
                    </p>
                )}
                {messages.map(m => (
                    <Bubble key={m._id} msg={m} isMine={m.sender._id === currentUserId} />
                ))}
                <div ref={bottomRef} />
            </div>

            {/* ── Composer ── */}
            <div style={{
                padding: '14px 20px', borderTop: '1px solid var(--opal-border)',
                background: 'rgba(21,21,29,0.6)', display: 'flex', flexDirection: 'column', gap: 10,
                // Relative so the calendar popover can be positioned absolutely inside
                position: 'relative',
            }}>
                {/* MiniCalendar popover — floats upward above the composer */}
                {isCP && calOpen && (
                    <div style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: 20,
                        marginBottom: 8,
                        zIndex: 50,
                    }}>
                        <MiniCalendar selectedDates={cpDates} onChange={setCpDates} />
                    </div>
                )}

                {/* Counter toggle + optional price + calendar button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => setIsCP(p => !p)} style={{
                        fontSize: 11, fontWeight: 600,
                        color: isCP ? 'var(--opal-amber)' : 'var(--opal-muted)',
                        background: isCP ? 'var(--opal-amber-dim)' : 'transparent',
                        border: `1px solid ${isCP ? 'rgba(245,179,74,0.4)' : 'var(--opal-border)'}`,
                        borderRadius: 8, padding: '4px 10px', cursor: 'pointer',
                        fontFamily: 'var(--font-body)', transition: 'all 0.15s', letterSpacing: 0.3,
                    }}>
                        ↩ Counter-proposal
                    </button>

                    {isCP && (
                        <>
                            <input
                                type="number"
                                placeholder="💵 Price"
                                value={cpPrice}
                                onChange={e => setCpPrice(e.target.value)}
                                style={{
                                    fontSize: 11, fontWeight: 600,
                                    color: cpPrice ? 'var(--opal-amber)' : 'var(--opal-muted)',
                                    background: cpPrice ? 'var(--opal-amber-dim)' : 'transparent',
                                    border: `1px solid ${cpPrice ? 'rgba(245,179,74,0.4)' : 'var(--opal-border)'}`,
                                    borderRadius: 8, padding: '4px 10px', cursor: 'text',
                                    fontFamily: 'var(--font-body)', transition: 'all 0.15s', letterSpacing: 0.3,
                                    width: 110, outline: 'none',
                                }}
                            />

                            {/* Calendar toggle button */}
                            <button
                                ref={calBtnRef}
                                onClick={() => setCalOpen(o => !o)}
                                style={{
                                    fontSize: 11, fontWeight: 600,
                                    color: isCP || cpDates.length > 0 ? 'var(--opal-amber)' : 'var(--opal-muted)',
                                    background: calOpen || cpDates.length > 0 ? 'var(--opal-amber-dim)' : 'transparent',
                                    border: `1px solid ${calOpen || cpDates.length > 0 ? 'rgba(245,179,74,0.4)' : 'var(--opal-border)'}`,
                                    borderRadius: 8, padding: '4px 10px', cursor: 'pointer',
                                    fontFamily: 'var(--font-body)', transition: 'all 0.15s', letterSpacing: 0.3,
                                    display: 'flex', alignItems: 'center', gap: 5,
                                }}
                            >
                                📅 {cpDates.length > 0 ? `${cpDates.length} date${cpDates.length > 1 ? 's' : ''}` : 'Dates'}
                            </button>
                        </>
                    )}
                </div>

                {/* Text + send */}
                <div style={{ display: 'flex', gap: 8 }}>
                    <textarea
                        rows={2}
                        placeholder={isCP ? 'Explain your counter-proposal…' : 'Type a message…'}
                        value={text}
                        onChange={e => setText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        style={{ ...input, flex: 1, resize: 'none', lineHeight: 1.5 }}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!text.trim() || sending}
                        style={{
                            width: 42, height: 42, borderRadius: 10, border: 'none', alignSelf: 'flex-end',
                            background: text.trim() ? 'var(--opal-violet)' : 'var(--opal-surface)',
                            cursor: text.trim() ? 'pointer' : 'not-allowed',
                            color: '#0a0a0f', fontSize: 16, transition: 'background 0.15s', flexShrink: 0,
                        }}
                    >
                        ↑
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

const DOCK_HEIGHT = 120;

function DetailPanel({ booking, onApprove, onDecline, currentUserId }) {
    const [tab, setTab] = useState('details');
    // ← When Counter is clicked we flip to messages AND pre-arm the CP toggle
    const [defaultIsCP, setDefaultIsCP] = useState(false);

    useEffect(() => { setTab('details'); setDefaultIsCP(false); }, [booking?._id]);

    if (!booking) return (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
            <span style={{ fontSize: 36 }}>📋</span>
            <p style={{ color: 'var(--opal-muted)', fontSize: 14, margin: 0 }}>Select a booking to review</p>
        </div>
    );

    const isPending = booking.status === 'Pending';

    const fields = [
        { label: 'Venue', value: booking.venueName ?? booking.venueId?.name },
        { label: 'Event Type', value: booking.eventType },
        { label: 'Date', value: fmtDate(booking.eventDate) },
        { label: 'Attendees', value: booking.expectedAttendees?.toLocaleString() },
        {
            label: 'Budget', value: booking.proposedPrice?.amount
                ? `${booking.proposedPrice.amount.toLocaleString()} ${booking.proposedPrice.currency ?? ''}`
                : '—'
        },
    ];

    const venueId = booking.venueId?._id ?? booking.venueId;

    // Navigates to messages tab with counter-proposal pre-selected
    const handleCounter = () => {
        setDefaultIsCP(true);
        setTab('messages');
    };

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {/* ── Header: organizer info + tab strip ── */}
            <div style={{ padding: '20px 24px 0', borderBottom: '1px solid var(--opal-border)', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar name={booking.organizerId?.name ?? 'User'} size={44} />
                        <div>
                            <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--opal-text)', letterSpacing: -0.3, fontFamily: 'var(--font-display)' }}>
                                {booking.organizerId?.name}
                            </p>
                            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--opal-sub)' }}>
                                {booking.organizerId?.email}
                            </p>
                        </div>
                    </div>
                    <Badge status={booking.status} />
                </div>

                <div style={{ display: 'flex', gap: 0 }}>
                    {['details', 'messages'].map(t => (
                        <button key={t} onClick={() => setTab(t)} style={{
                            padding: '8px 16px', background: 'none', border: 'none',
                            borderBottom: tab === t ? '2px solid var(--opal-violet)' : '2px solid transparent',
                            color: tab === t ? 'var(--opal-violet)' : 'var(--opal-sub)', fontSize: 13, fontWeight: 600,
                            cursor: 'pointer', fontFamily: 'var(--font-body)', textTransform: 'capitalize',
                            transition: 'all 0.15s',
                        }}>{t}</button>
                    ))}
                </div>
            </div>

            {/* ── Details tab ── */}
            {tab === 'details' && (
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: `20px 24px ${DOCK_HEIGHT + 16}px`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                }}>
                    {/* Field grid */}
                    <GlassCard style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, overflow: 'hidden' }}>
                        {fields.map(({ label, value }, i) => (
                            <div key={label} style={{
                                padding: '14px 18px',
                                borderRight: i % 2 === 0 ? '1px solid var(--opal-border)' : 'none',
                                borderBottom: i < fields.length - (fields.length % 2 === 0 ? 2 : 1) ? '1px solid var(--opal-border)' : 'none',
                            }}>
                                <p style={{ margin: '0 0 3px', fontSize: 10, fontWeight: 700, color: 'var(--opal-muted)', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                                    {label}
                                </p>
                                <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--opal-text)' }}>{value ?? '—'}</p>
                            </div>
                        ))}
                    </GlassCard>

                    {/* Calendar + Special Requirements */}
                    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                        <div style={{ flexShrink: 0 }}>
                            <CalendarAvailability
                                venueId={venueId}
                                requestedDates={booking.requestedDates}
                                fetchAvailability={fetchVenueAvailability}
                            />
                        </div>

                        {booking.specialRequirements ? (
                            <GlassCard style={{ flex: 1, padding: '16px 18px', display: 'flex', flexDirection: 'column', alignSelf: 'stretch' }}>
                                <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: 'var(--opal-muted)', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                                    Special Requirements
                                </p>
                                <p style={{ margin: 0, fontSize: 14, color: 'rgba(232,230,240,0.75)', lineHeight: 1.65, flex: 1 }}>
                                    {booking.specialRequirements}
                                </p>
                            </GlassCard>
                        ) : (
                            <GlassCard style={{ flex: 1, padding: '16px 18px', alignSelf: 'stretch', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <p style={{ margin: 0, fontSize: 13, color: 'var(--opal-muted)', fontStyle: 'italic' }}>
                                    No special requirements
                                </p>
                            </GlassCard>
                        )}
                    </div>

                    {/* Pending / Countered actions */}
                    {(booking.status === 'Pending' || booking.status === 'Countered') && (
                        <GlassCard style={{ display: 'flex', gap: 10, padding: '16px 18px' }}>
                            <Btn label="✓ Approve" color="var(--opal-teal)" onClick={() => onApprove(booking._id)} style={{ flex: 1 }} />
                            <Btn label="✕ Decline" color="var(--opal-red)" textColor="#0a0a0f" onClick={() => onDecline(booking._id)} style={{ flex: 1 }} />
                            {/* ← Now calls handleCounter instead of setTab directly */}
                            <Btn label="↩ Counter" color="var(--opal-amber)" textColor="#0a0a0f" onClick={handleCounter} style={{ flex: 1 }} />
                        </GlassCard>
                    )}
                </div>
            )}

            {/* Messages tab */}
            {tab === 'messages' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, paddingBottom: DOCK_HEIGHT }}>
                    <MessageThread
                        booking={booking}
                        currentUserId={currentUserId}
                        defaultIsCP={defaultIsCP}       // ← passed down
                    />
                </div>
            )}
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PageResponseVenue() {
    const currentUserId = getUserIdFromToken();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [selected, setSelected] = useState(null);
    const [filter, setFilter] = useState('All');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBookingRequests()
            .then(data => { setBookings(data); setSelected(data[0] ?? null); })
            .finally(() => setLoading(false));
    }, []);

    const handleApprove = async (id) => {
        await approveBooking(id);
        setBookings(prev => prev.map(b => b._id === id ? { ...b, status: 'Approved' } : b));
        setSelected(prev => prev?._id === id ? { ...prev, status: 'Approved' } : prev);
    };

    const handleDecline = async (id) => {
        await declineBooking(id);
        setBookings(prev => prev.map(b => b._id === id ? { ...b, status: 'Declined' } : b));
        setSelected(prev => prev?._id === id ? { ...prev, status: 'Declined' } : prev);
    };

    const tabs = ['All', 'Pending', 'Approved', 'Declined'];
    const counts = {
        All: bookings.length,
        Pending: bookings.filter(b => b.status === 'Pending').length,
        Approved: bookings.filter(b => b.status === 'Approved').length,
        Declined: bookings.filter(b => b.status === 'Declined').length,
    };
    const filtered = filter === 'All' ? bookings : bookings.filter(b => b.status === filter);

    const stats = [
        { label: 'Total', value: counts.All, color: 'var(--opal-violet)' },
        { label: 'Pending', value: counts.Pending, color: 'var(--opal-amber)' },
        { label: 'Approved', value: counts.Approved, color: 'var(--opal-teal)' },
        { label: 'Declined', value: counts.Declined, color: 'var(--opal-red)' },
    ];

    const dockItems = [
        { icon: <VscMail size={26} />, label: "Requests", onClick: () => navigate("/venueowner/venueresponse") },
        { icon: <VscBell size={26} />, label: "Notifications", onClick: () => navigate("/notificationsview") },
        { icon: <VscHome size={26} />, label: "Home", active: true, onClick: () => navigate("/venueowner/venues") },
        { icon: <VscCalendar size={26} />, label: "Reports", onClick: () => navigate("/venueowner/venuereports") },
        { icon: <VscPerson size={26} />, label: "Owner Profile", onClick: () => navigate("/pageProfile") },
    ];

    return (
        <div style={{
            height: '100vh', display: 'flex', flexDirection: 'column',
            fontFamily: 'var(--font-body)',
            color: 'var(--opal-text)',
        }}>
            <AppHeader
                crumb="Venue Responses"
                right={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: 'rgba(62,207,184,0.14)', color: '#3ecfb8', border: '1px solid rgba(62,207,184,0.27)' }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#3ecfb8', display: 'inline-block', boxShadow: '0 0 6px rgba(62,207,184,0.4)' }} />
                        Venue Owner Portal
                    </div>
                }
            />
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Sidebar */}
                <div style={{ width: 300, borderRight: '1px solid var(--opal-border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                    <div style={{ padding: '16px 14px 10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
                        {stats.map(s => (
                            <GlassCard key={s.label} style={{ padding: '11px 13px' }}>
                                <p style={{ margin: 0, fontSize: 21, fontWeight: 700, color: s.color, letterSpacing: -0.5, fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-display)' }}>{s.value}</p>
                                <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--opal-muted)' }}>{s.label}</p>
                            </GlassCard>
                        ))}
                    </div>

                    <div style={{ padding: '0 14px 10px', display: 'flex', gap: 3 }}>
                        {tabs.map(t => (
                            <button key={t} onClick={() => setFilter(t)} style={{
                                flex: 1, padding: '5px 0', borderRadius: 7, border: 'none', cursor: 'pointer',
                                background: filter === t ? 'var(--opal-violet-dim)' : 'transparent',
                                color: filter === t ? 'var(--opal-violet)' : 'var(--opal-muted)',
                                fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-body)',
                                letterSpacing: 0.3, transition: 'all 0.15s',
                            }}>{t}</button>
                        ))}
                    </div>

                    <div style={{ overflowY: 'auto', flex: 1, padding: '0 8px 112px' }}>
                        {loading && (
                            <p style={{ textAlign: 'center', color: 'var(--opal-muted)', fontSize: 13, marginTop: 24 }}>Loading…</p>
                        )}
                        {!loading && filtered.length === 0 && (
                            <p style={{ textAlign: 'center', color: 'var(--opal-muted)', fontSize: 13, marginTop: 24 }}>No requests</p>
                        )}
                        {filtered.map(b => {
                            const isActive = selected?._id === b._id;
                            const s = STATUS[b.status] ?? STATUS.Pending;
                            return (
                                <button key={b._id} onClick={() => setSelected(b)} style={{
                                    width: '100%', textAlign: 'left',
                                    background: isActive ? 'var(--opal-violet-dim)' : 'transparent',
                                    border: isActive ? '1px solid rgba(124,92,252,0.22)' : '1px solid transparent',
                                    borderRadius: 11, padding: '11px 12px', cursor: 'pointer',
                                    marginBottom: 3, display: 'flex', alignItems: 'center', gap: 10,
                                    transition: 'all 0.15s',
                                }}>
                                    <Avatar name={b.organizerId?.name ?? 'U'} size={36} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                                            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--opal-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {b.organizerId?.name}
                                            </p>
                                            <span style={{ fontSize: 10, color: 'var(--opal-muted)', flexShrink: 0, marginLeft: 4 }}>
                                                {fmtDate(b.eventDate)}
                                            </span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: 12, color: 'var(--opal-sub)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {b.eventType}
                                        </p>
                                        <span style={{ fontSize: 10, fontWeight: 600, color: s.text, marginTop: 4, display: 'block' }}>
                                            ● {b.status}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Detail panel */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <DetailPanel
                        booking={selected}
                        onApprove={handleApprove}
                        onDecline={handleDecline}
                        currentUserId={currentUserId}
                    />
                </div>
            </div>

            <Dock items={dockItems} />
        </div>
    );
}