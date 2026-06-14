import { useState, useEffect, useRef, useCallback } from 'react';
import {
    fetchBookingRequests,
    approveBooking,
    declineBooking,
    fetchMessages,
    sendMessage,
    fetchVenueAvailability,
} from '../services/serviceResponseVenue.js';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
    bg:          '#111214',
    sidebar:     '#16181C',
    panel:       '#1C1E24',
    surface:     '#22252D',
    border:      'rgba(255,255,255,0.07)',
    borderHover: 'rgba(255,255,255,0.13)',
    blue:        '#4F8EF7',
    green:       '#30D158',
    red:         '#FF453A',
    amber:       '#F5A623',
    text:        '#F2F2F7',
    sub:         'rgba(242,242,247,0.45)',
    muted:       'rgba(242,242,247,0.22)',
};

const STATUS = {
    Pending:  { bg: 'rgba(245,166,35,0.13)',  border: 'rgba(245,166,35,0.3)',  text: C.amber },
    Approved: { bg: 'rgba(48,209,88,0.1)',    border: 'rgba(48,209,88,0.28)', text: C.green },
    Declined: { bg: 'rgba(255,69,58,0.1)',    border: 'rgba(255,69,58,0.28)', text: C.red   },
    Countered:{ bg: 'rgba(79,142,247,0.1)',   border: 'rgba(79,142,247,0.28)',text: C.blue  },
};

// ─── Tiny helpers ─────────────────────────────────────────────────────────────

function Avatar({ name = '?', size = 36 }) {
    const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    return (
        <div style={{
            width: size, height: size, borderRadius: size / 2.8,
            background: 'linear-gradient(135deg, #4F8EF7 0%, #7B5FFF 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: size * 0.33, fontWeight: 700, color: '#fff', flexShrink: 0,
            letterSpacing: -0.3,
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

function Btn({ label, color, textColor = '#fff', onClick, disabled, style = {} }) {
    const [hov, setHov] = useState(false);
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
                padding: '8px 18px', borderRadius: 10, border: 'none',
                background: hov ? color : color + 'cc',
                color: textColor, fontSize: 13, fontWeight: 600,
                cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                opacity: disabled ? 0.4 : 1,
                transition: 'all 0.15s', ...style,
            }}
        >
            {label}
        </button>
    );
}

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtTime = d => new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

// ─── Availability calendar ─────────────────────────────────────────────────────
// Shows a single-month calendar grid: dates already locked out for this venue
// (approved bookings, shown in red) and the dates requested by THIS booking
// (shown in amber). Styled with the same surface/border tokens as the rest of
// the panel so it reads as part of the existing card layout, not a bolted-on
// widget. Prev/next buttons let the owner check neighbouring months.

const navBtnStyle = {
    width: 22, height: 22, borderRadius: 6, border: `1px solid ${C.border}`,
    background: C.bg, color: C.sub, fontSize: 13, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit',
    lineHeight: 1, padding: 0,
};

function AvailabilityCalendar({ venueId, requestedDates = [] }) {
    const [bookedDates, setBookedDates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [monthOffset, setMonthOffset] = useState(0);

    useEffect(() => {
        if (!venueId) return;
        let cancelled = false;
        setLoading(true);
        setError(null);
        setMonthOffset(0);

        fetchVenueAvailability(venueId)
            .then(res => { if (!cancelled) setBookedDates(res.bookedDates || []); })
            .catch(err => { if (!cancelled) setError(err.message || 'Failed to load availability'); })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, [venueId]);

    if (!venueId) return null;

    const wrap = {
        background: C.surface, borderRadius: 14,
        border: `1px solid ${C.border}`, padding: '10px 14px',
        maxWidth: 240,
    };
    const labelStyle = {
        margin: 0, fontSize: 9, fontWeight: 700, color: C.muted,
        letterSpacing: 0.8, textTransform: 'uppercase',
    };

    if (loading) {
        return <div style={wrap}><p style={labelStyle}>Availability</p><p style={{ margin: '6px 0 0', fontSize: 12, color: C.muted }}>Loading…</p></div>;
    }
    if (error) {
        return <div style={wrap}><p style={labelStyle}>Availability</p><p style={{ margin: '6px 0 0', fontSize: 12, color: C.red }}>{error}</p></div>;
    }

    // Default the visible month to this booking's (first) requested date.
    const baseDate = requestedDates?.[0] ? new Date(requestedDates[0]) : new Date();
    const viewDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + monthOffset, 1);
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const monthLabel = viewDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });

    const bookedSet = new Set(bookedDates.map(b => new Date(b.date).toDateString()));
    const requestedSet = new Set((requestedDates || []).map(d => new Date(d).toDateString()));

    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    return (
        <div style={wrap}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <p style={labelStyle}>Availability</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <button onClick={() => setMonthOffset(o => o - 1)} style={navBtnStyle}>‹</button>
                    <span style={{ fontSize: 10, fontWeight: 600, color: C.text, minWidth: 64, textAlign: 'center' }}>{monthLabel}</span>
                    <button onClick={() => setMonthOffset(o => o + 1)} style={navBtnStyle}>›</button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 2 }}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <div key={i} style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, color: C.muted }}>{d}</div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
                {cells.map((d, i) => {
                    if (d === null) return <div key={i} />;
                    const dateKey = new Date(year, month, d).toDateString();
                    const isBooked = bookedSet.has(dateKey);
                    const isRequested = requestedSet.has(dateKey);

                    let bg = 'transparent', color = C.sub, border = '1px solid transparent';
                    if (isBooked) { bg = `${C.red}1F`; color = C.red; border = `1px solid ${C.red}44`; }
                    else if (isRequested) { bg = `${C.amber}1F`; color = C.amber; border = `1px solid ${C.amber}44`; }

                    return (
                        <div key={i} title={isBooked ? 'Booked' : isRequested ? 'Requested in this booking' : undefined} style={{
                            aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            borderRadius: 5, fontSize: 10, fontWeight: 600,
                            background: bg, color, border,
                        }}>
                            {d}
                        </div>
                    );
                })}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 6, fontSize: 9, color: C.sub }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: 2, background: C.red }} /> Booked
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: 2, background: C.amber }} /> This request
                </span>
            </div>
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
                    color: C.amber, marginBottom: 4, paddingLeft: isMine ? 0 : 4,
                }}>
                    ↩ Counter-proposal
                </span>
            )}
            <div style={{
                maxWidth: '72%', padding: '10px 14px', borderRadius: 14,
                borderBottomRightRadius: isMine ? 4 : 14,
                borderBottomLeftRadius: isMine ? 14 : 4,
                background: isMine ? C.blue : C.surface,
                border: isCP ? `1px solid ${C.amber}44` : 'none',
                color: C.text, fontSize: 14, lineHeight: 1.55,
            }}>
                {msg.text}
                {isCP && msg.counterProposal && (
                    <div style={{
                        marginTop: 8, paddingTop: 8,
                        borderTop: `1px solid rgba(255,255,255,0.12)`,
                        fontSize: 12, color: isMine ? 'rgba(255,255,255,0.8)' : C.sub,
                        display: 'flex', flexDirection: 'column', gap: 3,
                    }}>
                        {msg.counterProposal.adjustedPrice != null && (
                            <span>💰 Adjusted price: <strong>${msg.counterProposal.adjustedPrice.toLocaleString()}</strong></span>
                        )}
                        {msg.counterProposal.alternativeDate && (
                            <span>📅 Alternative date: <strong>{fmtDate(msg.counterProposal.alternativeDate)}</strong></span>
                        )}
                    </div>
                )}
            </div>
            <span style={{ fontSize: 10, color: C.muted, marginTop: 3, paddingLeft: 4, paddingRight: 4 }}>
                {fmtTime(msg.createdAt)}
                {msg.readAt && isMine && <span style={{ marginLeft: 6, color: C.blue }}>✓ Read</span>}
            </span>
        </div>
    );
}

// ─── Message thread panel ─────────────────────────────────────────────────────

function MessageThread({ booking, currentUserId }) {
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [isCP, setIsCP] = useState(false);
    const [cpPrice, setCpPrice] = useState('');
    const [cpDate, setCpDate] = useState('');
    const [sending, setSending] = useState(false);
    const bottomRef = useRef(null);
    const pollRef = useRef(null);

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
        setIsCP(false);
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
                alternativeDate: cpDate || null,
            } : null;
            const msg = await sendMessage(booking._id, {
                text,
                type: isCP ? 'counter_proposal' : 'message',
                counterProposal: cp,
            });
            setMessages(prev => [...prev, msg]);
            setText('');
            setCpPrice('');
            setCpDate('');
            setIsCP(false);
        } finally {
            setSending(false);
        }
    };

    const input = {
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 10, color: C.text, fontSize: 13,
        padding: '9px 12px', fontFamily: 'inherit', outline: 'none',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            {/* Thread */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
                {messages.length === 0 && (
                    <p style={{ textAlign: 'center', color: C.muted, fontSize: 13, marginTop: 32 }}>
                        No messages yet — start the conversation.
                    </p>
                )}
                {messages.map(m => (
                    <Bubble key={m._id} msg={m} isMine={m.sender._id === currentUserId} />
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Compose */}
            <div style={{
                padding: '14px 20px', borderTop: `1px solid ${C.border}`,
                background: C.panel, display: 'flex', flexDirection: 'column', gap: 10,
            }}>
                {/* Counter-proposal toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => setIsCP(p => !p)} style={{
                        fontSize: 11, fontWeight: 600, color: isCP ? C.amber : C.muted,
                        background: isCP ? 'rgba(245,166,35,0.1)' : 'transparent',
                        border: `1px solid ${isCP ? C.amber + '55' : C.border}`,
                        borderRadius: 8, padding: '4px 10px', cursor: 'pointer',
                        fontFamily: 'inherit', transition: 'all 0.15s', letterSpacing: 0.3,
                    }}>
                        ↩ Counter-proposal
                    </button>
                    {isCP && <span style={{ fontSize: 11, color: C.muted }}>Fill in optional fields below</span>}
                </div>

                {isCP && (
                    <div style={{ display: 'flex', gap: 10 }}>
                        <input
                            type="number"
                            placeholder="Adjusted price ($)"
                            value={cpPrice}
                            onChange={e => setCpPrice(e.target.value)}
                            style={{ ...input, flex: 1 }}
                        />
                        <input
                            type="date"
                            value={cpDate}
                            onChange={e => setCpDate(e.target.value)}
                            style={{ ...input, flex: 1, colorScheme: 'dark' }}
                        />
                    </div>
                )}

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
                            background: text.trim() ? C.blue : C.surface,
                            cursor: text.trim() ? 'pointer' : 'not-allowed',
                            color: '#fff', fontSize: 16, transition: 'background 0.15s', flexShrink: 0,
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

function DetailPanel({ booking, onApprove, onDecline, currentUserId }) {
    const [tab, setTab] = useState('details'); // 'details' | 'messages'
    const [declining, setDeclining] = useState(false);
    const [declineReason, setDeclineReason] = useState('');

    useEffect(() => { setTab('details'); setDeclining(false); setDeclineReason(''); }, [booking?._id]);

    if (!booking) return (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
            <span style={{ fontSize: 36 }}>📋</span>
            <p style={{ color: C.muted, fontSize: 14, margin: 0 }}>Select a booking to review</p>
        </div>
    );

    const isPending = booking.status === 'Pending';

    // eventDate is injected by normaliseBooking in the service (first entry of requestedDates)
    const fields = [
        { label: 'Venue',       value: booking.venueName ?? booking.venueId?.name },
        { label: 'Event Type',  value: booking.eventType },
        { label: 'Date',        value: fmtDate(booking.eventDate) },
        { label: 'Attendees',   value: booking.expectedAttendees?.toLocaleString() },
        { label: 'Budget',      value: booking.proposedPrice?.amount
            ? `${booking.proposedPrice.amount.toLocaleString()} ${booking.proposedPrice.currency ?? ''}`
            : '—' },
    ];

    const venueId = booking.venueId?._id ?? booking.venueId;

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {/* Header */}
            <div style={{ padding: '20px 24px 0', borderBottom: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar name={booking.organizerId?.name ?? 'User'} size={44} />
                        <div>
                            <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: C.text, letterSpacing: -0.3 }}>
                                {booking.organizerId?.name}
                            </p>
                            <p style={{ margin: '2px 0 0', fontSize: 12, color: C.sub }}>
                                {booking.organizerId?.email}
                            </p>
                        </div>
                    </div>
                    <Badge status={booking.status} />
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 0 }}>
                    {['details', 'messages'].map(t => (
                        <button key={t} onClick={() => setTab(t)} style={{
                            padding: '8px 16px', background: 'none', border: 'none',
                            borderBottom: tab === t ? `2px solid ${C.blue}` : '2px solid transparent',
                            color: tab === t ? C.blue : C.sub, fontSize: 13, fontWeight: 600,
                            cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize',
                            transition: 'all 0.15s',
                        }}>{t}</button>
                    ))}
                </div>
            </div>

            {/* Tab: Details */}
            {tab === 'details' && (
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Info grid */}
                    <div style={{
                        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2,
                        background: C.surface, borderRadius: 14,
                        border: `1px solid ${C.border}`, overflow: 'hidden',
                    }}>
                        {fields.map(({ label, value }, i) => (
                            <div key={label} style={{
                                padding: '14px 18px',
                                borderRight: i % 2 === 0 ? `1px solid ${C.border}` : 'none',
                                borderBottom: i < fields.length - (fields.length % 2 === 0 ? 2 : 1) ? `1px solid ${C.border}` : 'none',
                            }}>
                                <p style={{ margin: '0 0 3px', fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                                    {label}
                                </p>
                                <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: C.text }}>{value ?? '—'}</p>
                            </div>
                        ))}
                    </div>

                    {/* Venue availability — calendar view. Red days are already
                        locked out for this venue; amber days are the dates
                        requested by THIS booking. */}
                    <AvailabilityCalendar venueId={venueId} requestedDates={booking.requestedDates} />

                    {/* Requirements */}
                    {booking.specialRequirements && (
                        <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: '14px 18px' }}>
                            <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                                Special Requirements
                            </p>
                            <p style={{ margin: 0, fontSize: 14, color: 'rgba(242,242,247,0.75)', lineHeight: 1.65 }}>
                                {booking.specialRequirements}
                            </p>
                        </div>
                    )}

                    {/* Decline reason (if declined) — mapped from ownerResponseMessage by the service */}
                    {booking.status === 'Declined' && booking.declineReason && (
                        <div style={{ background: 'rgba(255,69,58,0.07)', borderRadius: 14, border: `1px solid rgba(255,69,58,0.2)`, padding: '14px 18px' }}>
                            <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 700, color: C.red, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                                Decline Reason
                            </p>
                            <p style={{ margin: 0, fontSize: 14, color: 'rgba(242,242,247,0.75)', lineHeight: 1.65 }}>
                                {booking.declineReason}
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    {isPending && !declining && (
                        <div style={{
                            display: 'flex', gap: 10, paddingTop: 4,
                            background: C.surface, borderRadius: 14,
                            border: `1px solid ${C.border}`, padding: '16px 18px',
                        }}>
                            <Btn label="✓ Approve" color={C.green} onClick={() => onApprove(booking._id)} style={{ flex: 1 }} />
                            <Btn label="✕ Decline" color={C.red} onClick={() => setDeclining(true)} style={{ flex: 1 }} />
                            <Btn label="↩ Counter" color={C.amber} textColor="#111"
                                onClick={() => setTab('messages')} style={{ flex: 1 }} />
                        </div>
                    )}

                    {isPending && declining && (
                        <div style={{ background: C.surface, borderRadius: 14, border: `1px solid rgba(255,69,58,0.25)`, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.text }}>Reason for declining (optional)</p>
                            <textarea
                                rows={3}
                                placeholder="e.g. Fully booked on that date, suggest Oct 12th instead…"
                                value={declineReason}
                                onChange={e => setDeclineReason(e.target.value)}
                                style={{
                                    background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10,
                                    color: C.text, fontSize: 13, padding: '10px 12px', resize: 'none',
                                    outline: 'none', fontFamily: 'inherit', lineHeight: 1.5,
                                }}
                            />
                            <div style={{ display: 'flex', gap: 8 }}>
                                <Btn label="Cancel" color={C.surface} textColor={C.sub}
                                    onClick={() => setDeclining(false)}
                                    style={{ flex: 1, border: `1px solid ${C.border}` }} />
                                <Btn label="Confirm Decline" color={C.red}
                                    onClick={() => { onDecline(booking._id, declineReason); setDeclining(false); }}
                                    style={{ flex: 1 }} />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Tab: Messages */}
            {tab === 'messages' && (
                <MessageThread booking={booking} currentUserId={currentUserId} />
            )}
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PageResponseVenue({ currentUserId }) {
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

    const handleDecline = async (id, reason) => {
        await declineBooking(id, reason);
        setBookings(prev => prev.map(b => b._id === id ? { ...b, status: 'Declined', declineReason: reason } : b));
        setSelected(prev => prev?._id === id ? { ...prev, status: 'Declined', declineReason: reason } : prev);
    };

    const tabs = ['All', 'Pending', 'Approved', 'Declined'];
    const counts = {
        All:      bookings.length,
        Pending:  bookings.filter(b => b.status === 'Pending').length,
        Approved: bookings.filter(b => b.status === 'Approved').length,
        Declined: bookings.filter(b => b.status === 'Declined').length,
    };
    const filtered = filter === 'All' ? bookings : bookings.filter(b => b.status === filter);

    const stats = [
        { label: 'Total',    value: counts.All,      color: C.blue  },
        { label: 'Pending',  value: counts.Pending,  color: C.amber },
        { label: 'Approved', value: counts.Approved, color: C.green },
        { label: 'Declined', value: counts.Declined, color: C.red   },
    ];

    return (
        <div style={{
            height: '100vh', display: 'flex', flexDirection: 'column',
            background: C.bg,
            fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif",
            color: C.text,
        }}>
            {/* Top bar */}
            <div style={{
                padding: '14px 24px', borderBottom: `1px solid ${C.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: C.sidebar, flexShrink: 0,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 30, height: 30, borderRadius: 8,
                        background: 'linear-gradient(135deg, #4F8EF7, #7B5FFF)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                    }}>🏛</div>
                    <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.3 }}>PopEyez</span>
                    <span style={{ fontSize: 12, color: C.muted, padding: '2px 8px', borderRadius: 6, background: C.surface }}>
                        Booking Requests
                    </span>
                </div>
                <Avatar name="Venue Manager" size={30} />
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Sidebar */}
                <div style={{ width: 300, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', background: C.sidebar, flexShrink: 0 }}>
                    {/* Stats */}
                    <div style={{ padding: '16px 14px 10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
                        {stats.map(s => (
                            <div key={s.label} style={{ padding: '11px 13px', borderRadius: 11, background: C.surface, border: `1px solid ${C.border}` }}>
                                <p style={{ margin: 0, fontSize: 21, fontWeight: 700, color: s.color, letterSpacing: -0.5, fontVariantNumeric: 'tabular-nums' }}>{s.value}</p>
                                <p style={{ margin: '2px 0 0', fontSize: 11, color: C.muted }}>{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Filter tabs */}
                    <div style={{ padding: '0 14px 10px', display: 'flex', gap: 3 }}>
                        {tabs.map(t => (
                            <button key={t} onClick={() => setFilter(t)} style={{
                                flex: 1, padding: '5px 0', borderRadius: 7, border: 'none', cursor: 'pointer',
                                background: filter === t ? 'rgba(79,142,247,0.18)' : 'transparent',
                                color: filter === t ? C.blue : C.muted,
                                fontSize: 10, fontWeight: 700, fontFamily: 'inherit',
                                letterSpacing: 0.3, transition: 'all 0.15s',
                            }}>{t}</button>
                        ))}
                    </div>

                    {/* List */}
                    <div style={{ overflowY: 'auto', flex: 1, padding: '0 8px 12px' }}>
                        {loading && <p style={{ textAlign: 'center', color: C.muted, fontSize: 13, marginTop: 24 }}>Loading…</p>}
                        {!loading && filtered.length === 0 && (
                            <p style={{ textAlign: 'center', color: C.muted, fontSize: 13, marginTop: 24 }}>No requests</p>
                        )}
                        {filtered.map(b => {
                            const isActive = selected?._id === b._id;
                            const s = STATUS[b.status] ?? STATUS.Pending;
                            return (
                                <button key={b._id} onClick={() => setSelected(b)} style={{
                                    width: '100%', textAlign: 'left',
                                    background: isActive ? 'rgba(79,142,247,0.1)' : 'transparent',
                                    border: isActive ? `1px solid rgba(79,142,247,0.22)` : '1px solid transparent',
                                    borderRadius: 11, padding: '11px 12px', cursor: 'pointer',
                                    marginBottom: 3, display: 'flex', alignItems: 'center', gap: 10,
                                    transition: 'all 0.15s',
                                }}>
                                    <Avatar name={b.organizerId?.name ?? 'U'} size={36} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                                            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {b.organizerId?.name}
                                            </p>
                                            <span style={{ fontSize: 10, color: C.muted, flexShrink: 0, marginLeft: 4 }}>
                                                {fmtDate(b.eventDate)}
                                            </span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: 12, color: C.sub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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

                {/* Detail */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.panel, minWidth: 0 }}>
                    <DetailPanel
                        booking={selected}
                        onApprove={handleApprove}
                        onDecline={handleDecline}
                        currentUserId={currentUserId}
                    />
                </div>
            </div>
        </div>
    );
}