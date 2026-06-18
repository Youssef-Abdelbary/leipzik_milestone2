import { useState, useEffect, useRef, useCallback } from 'react';
import {
    fetchMyVenueReplies,
    fetchBookingMessages,
    fetchVenueAvailability,
    sendBookingMessage,
    sendCounterProposal,
    matchCounterProposal,
} from '../../services/serviceReplyVenue.js';
import CalendarAvailability from '../../components/componentCalendar.jsx';
import MiniCalendar from '../../components/componentMiniCalendar.jsx';
import { P, icons, GlassPanel } from '../../components/componentTheme';
import '../../components/componentTheme.css';
import { useNavigate, useParams } from 'react-router-dom';

// ─── Decode user_id from stored JWT ──────────────────────────────────────────
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

// ─── Status map ───────────────────────────────────────────────────────────────
const STATUS = {
    pending: { bg: 'var(--opal-amber-dim)', border: 'rgba(245,179,74,0.3)', text: 'var(--opal-amber)', label: 'Pending' },
    approved: { bg: 'var(--opal-teal-dim)', border: 'rgba(79,209,197,0.28)', text: 'var(--opal-teal)', label: 'Approved' },
    declined: { bg: 'var(--opal-red-dim)', border: 'rgba(255,92,102,0.28)', text: 'var(--opal-red)', label: 'Declined' },
    countered: { bg: 'var(--opal-amber-dim)', border: 'rgba(245,179,74,0.3)', text: 'var(--opal-amber)', label: 'Countered' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Avatar({ name = '?', size = 36 }) {
    const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
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
    const s = STATUS[status] ?? STATUS.pending;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 9px', borderRadius: 20,
            background: s.bg, border: `1px solid ${s.border}`,
            color: s.text, fontSize: 11, fontWeight: 600, letterSpacing: 0.3,
        }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.text }} />
            {s.label}
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
                opacity: hov && !disabled ? 0.85 : disabled ? 0.35 : 1,
                color: textColor, fontSize: 13, fontWeight: 600,
                cursor: disabled ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-body)', transition: 'all 0.15s', ...style,
            }}
        >
            {label}
        </button>
    );
}

// ─── Stat tile — matches TabDayOf StatCard ────────────────────────────────────
function StatCard({ label, value, color, sub, isActive, onClick }) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: '18px 20px',
                flex: '1 1 130px',
                background: isActive
                    ? `linear-gradient(135deg, ${color}22 0%, ${color}10 100%)`
                    : 'rgba(19,19,30,0.72)',
                backdropFilter: 'blur(18px) saturate(140%)',
                WebkitBackdropFilter: 'blur(18px) saturate(140%)',
                border: `1px solid ${isActive ? color + '55' : 'rgba(255,255,255,0.08)'}`,
                borderBottom: isActive ? `2px solid ${color}` : '2px solid transparent',
                borderRadius: 14,
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
                transition: 'all 0.2s cubic-bezier(0.34,1.2,0.64,1)',
                transform: isActive ? 'translateY(-3px)' : 'none',
                boxShadow: isActive
                    ? `0 0 0 1px ${color}22, 0 8px 24px ${color}22, inset 0 1px 0 rgba(255,255,255,0.06)`
                    : 'inset 0 1px 0 rgba(255,255,255,0.04)',
                outline: 'none',
            }}
            onMouseEnter={e => {
                if (!isActive) {
                    e.currentTarget.style.background = `linear-gradient(135deg, ${color}16 0%, ${color}08 100%)`;
                    e.currentTarget.style.borderColor = `${color}33`;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                }
            }}
            onMouseLeave={e => {
                if (!isActive) {
                    e.currentTarget.style.background = 'rgba(19,19,30,0.72)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.transform = 'none';
                }
            }}
        >
            <p style={{ margin: 0, fontSize: 30, fontWeight: 900, color, letterSpacing: '-0.04em', lineHeight: 1, fontFamily: 'var(--font-display)' }}>{value}</p>
            <p style={{ margin: '7px 0 0', fontSize: 11, fontWeight: 700, color: isActive ? color : P.text, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
            {sub && <p style={{ margin: '3px 0 0', fontSize: 11, color: isActive ? color : P.sub }}>{sub}</p>}
        </button>
    );
}

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtTime = d => new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

function GlassCard({ children, style = {}, ...rest }) {
    return (
        <div {...rest} style={{
            background: 'rgba(30,30,41,0.55)',
            backdropFilter: 'blur(18px) saturate(140%)',
            WebkitBackdropFilter: 'blur(18px) saturate(140%)',
            border: '1px solid var(--opal-border)',
            borderRadius: 16,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
            ...style,
        }}>
            {children}
        </div>
    );
}

// ─── Chat bubble ──────────────────────────────────────────────────────────────
function Bubble({ msg, isMine }) {
    const isCP = msg.type === 'counter_proposal';
    const cp = msg.counterProposal;
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
                {isCP && cp && (cp.adjustedPrice != null || cp.alternativeDates?.length > 0) && (
                    <div style={{
                        marginTop: 8, paddingTop: 8,
                        borderTop: `1px solid ${isMine ? 'rgba(10,10,15,0.18)' : 'rgba(255,255,255,0.1)'}`,
                        fontSize: 12, color: isMine ? 'rgba(10,10,15,0.7)' : 'var(--opal-sub)',
                        display: 'flex', flexDirection: 'column', gap: 3,
                    }}>
                        {cp.adjustedPrice != null && (
                            <span>💰 Price: <strong>{cp.adjustedPrice.toLocaleString()} {cp.currency ?? 'EGP'}</strong></span>
                        )}
                        {cp.alternativeDates?.length > 0 && (
                            <span>📅 Dates: <strong>{cp.alternativeDates.map(fmtDate).join(', ')}</strong></span>
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

// ─── Message thread ───────────────────────────────────────────────────────────
function MessageThread({ booking, currentUserId, onBookingUpdate }) {
    const [messages, setMessages] = useState(booking.messages ?? []);
    const [text, setText] = useState('');
    const [isCP, setIsCP] = useState(false);
    const [cpPrice, setCpPrice] = useState('');
    const [cpDates, setCpDates] = useState([]);
    const [calOpen, setCalOpen] = useState(false);
    const [sending, setSending] = useState(false);
    const [matchedIds, setMatchedIds] = useState(new Set());
    const bottomRef = useRef(null);
    const calBtnRef = useRef(null);

    useEffect(() => { if (!isCP) setCalOpen(false); }, [isCP]);

    const incomingCounters = booking.incomingCounterProposals ?? [];
    const latestCounter = incomingCounters[incomingCounters.length - 1];
    const latestIsMatched = latestCounter && matchedIds.has(latestCounter._id);

    const load = useCallback(async () => {
        if (!booking?._id) return;
        try {
            const data = await fetchBookingMessages(booking._id);
            setMessages(data.messages);
            onBookingUpdate(booking._id, { unreadCount: 0, incomingCounterProposals: data.incomingCounterProposals });
        } catch { /* silent */ }
    }, [booking?._id, onBookingUpdate]);

    useEffect(() => {
        setMessages(booking.messages ?? []);
        setText(''); setIsCP(false); setCpPrice(''); setCpDates([]); setCalOpen(false);
        setMatchedIds(new Set());
        load();
    }, [booking?._id]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!text.trim() || sending) return;
        setSending(true);
        try {
            let data;
            if (isCP) {
                data = await sendCounterProposal(booking._id, {
                    text: text.trim(),
                    counterProposal: {
                        adjustedPrice: cpPrice ? Number(cpPrice) : null,
                        alternativeDates: cpDates.length ? cpDates : [],
                        note: text.trim(),
                    },
                });
                onBookingUpdate(booking._id, {
                    status: 'countered',
                    proposedPrice: data.booking.proposedPrice,
                    requestedDates: data.booking.requestedDates,
                });
            } else {
                data = await sendBookingMessage(booking._id, text.trim());
            }
            setMessages(prev => [...prev, data.message]);
            setText(''); setCpPrice(''); setCpDates([]); setCalOpen(false); setIsCP(false);
        } finally {
            setSending(false);
        }
    };

    const handleMatch = async () => {
        if (!latestCounter || sending) return;
        setSending(true);
        try {
            const data = await matchCounterProposal(booking._id, { messageId: latestCounter._id });
            setMessages(prev => [...prev, data.message]);
            setMatchedIds(prev => new Set(prev).add(latestCounter._id));
            onBookingUpdate(booking._id, {
                status: 'countered',
                proposedPrice: data.booking.proposedPrice,
                requestedDates: data.booking.requestedDates,
            });
        } finally {
            setSending(false);
        }
    };

    const input = {
        background: 'var(--opal-surface)', border: '1px solid var(--opal-border)',
        borderRadius: 10, color: 'var(--opal-text)', fontSize: 13,
        padding: '9px 12px', fontFamily: 'var(--font-body)', outline: 'none',
        boxSizing: 'border-box',
    };
    const pillActive = {
        fontSize: 11, fontWeight: 600, letterSpacing: 0.3,
        borderRadius: 8, padding: '4px 10px',
        fontFamily: 'var(--font-body)', transition: 'all 0.15s',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            {latestCounter && (
                <div style={{ padding: '14px 20px 0' }}>
                    <GlassCard style={{
                        padding: '12px 16px',
                        border: '1px solid rgba(245,179,74,0.28)',
                        background: 'var(--opal-amber-dim)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
                    }}>
                        <div style={{ fontSize: 12, color: 'var(--opal-amber)' }}>
                            <strong style={{ fontWeight: 700 }}>Incoming counter-proposal</strong>
                            {latestCounter.counterProposal?.adjustedPrice != null && (
                                <span> · {latestCounter.counterProposal.adjustedPrice.toLocaleString()} {latestCounter.counterProposal.currency ?? 'EGP'}</span>
                            )}
                            {latestCounter.counterProposal?.alternativeDates?.length > 0 && (
                                <span> · {latestCounter.counterProposal.alternativeDates.map(fmtDate).join(', ')}</span>
                            )}
                        </div>
                        {latestIsMatched ? (
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                padding: '5px 12px', borderRadius: 8,
                                background: 'var(--opal-teal-dim)', border: '1px solid rgba(79,209,197,0.28)',
                                color: 'var(--opal-teal)', fontSize: 12, fontWeight: 700,
                            }}>✓ Matched</span>
                        ) : (
                            <Btn label="Match this offer" color="var(--opal-amber)" onClick={handleMatch} disabled={sending} style={{ padding: '6px 14px', fontSize: 12 }} />
                        )}
                    </GlassCard>
                </div>
            )}

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 24px' }}>
                {messages.length === 0 && (
                    <p style={{ textAlign: 'center', color: 'var(--opal-muted)', fontSize: 13, marginTop: 32 }}>
                        No messages yet — start the conversation.
                    </p>
                )}
                {messages.map(m => {
                    const senderId = m.sender?._id?.toString?.() ?? m.sender?.toString?.() ?? m.sender;
                    return <Bubble key={m._id} msg={m} isMine={senderId === currentUserId} />;
                })}
                <div ref={bottomRef} />
            </div>

            <div style={{
                padding: '14px 20px', borderTop: '1px solid var(--opal-border)',
                background: 'rgba(21,21,29,0.6)', display: 'flex', flexDirection: 'column', gap: 10,
                position: 'relative',
            }}>
                {isCP && calOpen && (
                    <div style={{ position: 'absolute', bottom: '100%', left: 20, marginBottom: 8, zIndex: 50 }}>
                        <MiniCalendar selectedDates={cpDates} onChange={setCpDates} />
                    </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => setIsCP(p => !p)} style={{
                        ...pillActive,
                        color: isCP ? 'var(--opal-amber)' : 'var(--opal-muted)',
                        background: isCP ? 'var(--opal-amber-dim)' : 'transparent',
                        border: `1px solid ${isCP ? 'rgba(245,179,74,0.4)' : 'var(--opal-border)'}`,
                        cursor: 'pointer',
                    }}>↩ Counter-proposal</button>
                    {isCP && (
                        <>
                            <input
                                type="number" placeholder="💵 Price" value={cpPrice}
                                onChange={e => setCpPrice(e.target.value)}
                                style={{
                                    ...pillActive,
                                    color: cpPrice ? 'var(--opal-amber)' : 'var(--opal-muted)',
                                    background: cpPrice ? 'var(--opal-amber-dim)' : 'transparent',
                                    border: `1px solid ${cpPrice ? 'rgba(245,179,74,0.4)' : 'var(--opal-border)'}`,
                                    cursor: 'text', width: 110, outline: 'none',
                                }}
                            />
                            <button ref={calBtnRef} onClick={() => setCalOpen(o => !o)} style={{
                                ...pillActive,
                                color: calOpen || cpDates.length > 0 ? 'var(--opal-amber)' : 'var(--opal-muted)',
                                background: calOpen || cpDates.length > 0 ? 'var(--opal-amber-dim)' : 'transparent',
                                border: `1px solid ${calOpen || cpDates.length > 0 ? 'rgba(245,179,74,0.4)' : 'var(--opal-border)'}`,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                            }}>
                                📅 {cpDates.length > 0 ? `${cpDates.length} date${cpDates.length > 1 ? 's' : ''}` : 'Dates'}
                            </button>
                        </>
                    )}
                </div>
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
                    >↑</button>
                </div>
            </div>
        </div>
    );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────
function DetailPanel({ booking, currentUserId, onBookingUpdate, eventId }) {
    const [tab, setTab] = useState('details');
    const [applying, setApplying] = useState(false);
    const [applyError, setApplyError] = useState(null);

    useEffect(() => {
        setTab('details');
        setApplying(false);
        setApplyError(null);
    }, [booking?._id]);

    if (!booking) return (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
            <span style={{ fontSize: 36 }}>📋</span>
            <p style={{ color: 'var(--opal-muted)', fontSize: 14, margin: 0 }}>Select a booking to review</p>
        </div>
    );

    const venue = booking.venueId;
    const venueId = venue?._id ?? venue;

    const fields = [
        { label: 'Venue', value: venue?.name },
        { label: 'Event Type', value: booking.eventType },
        { label: 'Dates', value: booking.requestedDates?.map(fmtDate).join(', ') },
        { label: 'Attendees', value: booking.expectedAttendees?.toLocaleString() },
        {
            label: 'Price', value: booking.proposedPrice?.amount
                ? `${booking.proposedPrice.amount.toLocaleString()} ${booking.proposedPrice.currency ?? ''}`
                : '—'
        },
    ];

    const handleApplyToEvent = async () => {
        if (!eventId || applying || booking.appliedToEvent) return;
        setApplying(true);
        setApplyError(null);
        try {
            onBookingUpdate(booking._id, { appliedToEvent: true });
        } catch (err) {
            setApplyError(err?.message || 'Failed to apply venue to event');
        } finally {
            setApplying(false);
        }
    };

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {/* Panel header */}
            <div style={{ padding: '20px 24px 0', borderBottom: '1px solid var(--opal-border)', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar name={venue?.name ?? 'Venue'} size={44} />
                        <div>
                            <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--opal-text)', letterSpacing: -0.3, fontFamily: 'var(--font-display)' }}>
                                {venue?.name}
                            </p>
                            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--opal-sub)' }}>{booking.eventType}</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <Badge status={booking.status} />
                    </div>
                </div>
                {applyError && <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--opal-red)' }}>{applyError}</p>}
                <div style={{ display: 'flex', gap: 0 }}>
                    {['details', 'messages'].map(t => (
                        <button key={t} onClick={() => setTab(t)} style={{
                            padding: '8px 16px', background: 'none', border: 'none',
                            borderBottom: tab === t ? '2px solid var(--opal-violet)' : '2px solid transparent',
                            color: tab === t ? 'var(--opal-violet)' : 'var(--opal-sub)',
                            fontSize: 13, fontWeight: 600, cursor: 'pointer',
                            fontFamily: 'var(--font-body)', textTransform: 'capitalize', transition: 'all 0.15s',
                        }}>
                            {t}
                            {t === 'messages' && booking.unreadCount > 0 && (
                                <span style={{
                                    marginLeft: 6, background: 'var(--opal-red)', color: '#0a0a0f',
                                    borderRadius: 20, fontSize: 10, fontWeight: 700, padding: '1px 6px',
                                }}>{booking.unreadCount}</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Details tab */}
            {tab === 'details' && (
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <GlassCard style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, overflow: 'hidden', flexShrink: 0 }}>
                        {fields.map(({ label, value }, i) => (
                            <div key={label} style={{
                                padding: '14px 18px',
                                borderRight: i % 2 === 0 ? '1px solid var(--opal-border)' : 'none',
                                borderBottom: i < fields.length - (fields.length % 2 === 0 ? 2 : 1) ? '1px solid var(--opal-border)' : 'none',
                            }}>
                                <p style={{ margin: '0 0 3px', fontSize: 10, fontWeight: 700, color: 'var(--opal-muted)', letterSpacing: 0.8, textTransform: 'uppercase' }}>{label}</p>
                                <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--opal-text)' }}>{value ?? '—'}</p>
                            </div>
                        ))}
                    </GlassCard>

                    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexShrink: 0 }}>
                        <div style={{ flexShrink: 0 }}>
                            <CalendarAvailability
                                venueId={venueId}
                                requestedDates={booking.requestedDates}
                                fetchAvailability={fetchVenueAvailability}
                            />
                        </div>
                        {booking.specialRequirements ? (
                            <GlassCard style={{ flex: 1, padding: '16px 18px', display: 'flex', flexDirection: 'column', alignSelf: 'stretch' }}>
                                <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: 'var(--opal-muted)', letterSpacing: 0.8, textTransform: 'uppercase' }}>Special Requirements</p>
                                <p style={{ margin: 0, fontSize: 14, color: 'rgba(232,230,240,0.75)', lineHeight: 1.65, flex: 1 }}>{booking.specialRequirements}</p>
                            </GlassCard>
                        ) : (
                            <GlassCard style={{ flex: 1, padding: '16px 18px', alignSelf: 'stretch', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <p style={{ margin: 0, fontSize: 13, color: 'var(--opal-muted)', fontStyle: 'italic' }}>No special requirements</p>
                            </GlassCard>
                        )}
                    </div>

                    <GlassCard style={{ display: 'flex', gap: 10, padding: '16px 18px', flexShrink: 0 }}>
                        <Btn label="↩ Open conversation" color="var(--opal-violet)" onClick={() => setTab('messages')} style={{ flex: 1 }} />
                    </GlassCard>
                </div>
            )}

            {/* Messages tab */}
            {tab === 'messages' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    <MessageThread booking={booking} currentUserId={currentUserId} onBookingUpdate={onBookingUpdate} />
                </div>
            )}
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function PageReplyVenue({ onNavigate }) {
    const currentUserId = getUserIdFromToken();
    const navigate = useNavigate();
    const { eventId } = useParams();

    const [bookings, setBookings] = useState([]);
    const [selected, setSelected] = useState(null);
    const [filter, setFilter] = useState('All');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMyVenueReplies(eventId)
            .then(data => { setBookings(data.replies); setSelected(data.replies[0] ?? null); })
            .finally(() => setLoading(false));
    }, [eventId]);

    const handleBookingUpdate = useCallback((bookingId, patch) => {
        setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, ...patch } : b));
        setSelected(prev => prev?._id === bookingId ? { ...prev, ...patch } : prev);
    }, []);

    const sidebarLabel = (b) => {
        if (b.status === 'countered') return 'Pending';
        return STATUS[b.status]?.label ?? 'Pending';
    };

    const tabs = ['All', 'Pending', 'Approved', 'Declined'];
    const counts = {
        All: bookings.length,
        Pending: bookings.filter(b => sidebarLabel(b) === 'Pending').length,
        Approved: bookings.filter(b => sidebarLabel(b) === 'Approved').length,
        Declined: bookings.filter(b => sidebarLabel(b) === 'Declined').length,
    };
    const filtered = filter === 'All' ? bookings : bookings.filter(b => sidebarLabel(b) === filter);

    const toggleFilter = (key) => setFilter(prev => prev === key ? 'All' : key);

    // Map filter keys → StatCard colors matching Opal palette
    const TILE_COLOR = {
        All: P.blue ?? 'var(--opal-violet)',
        Pending: P.amber ?? 'var(--opal-amber)',
        Approved: P.teal ?? 'var(--opal-teal)',
        Declined: P.rose ?? 'var(--opal-red)',
    };
    const TILE_SUB = {
        All: 'all requests',
        Pending: 'awaiting response',
        Approved: 'confirmed',
        Declined: 'rejected',
    };

    return (
        <div style={{ minHeight: '100vh', fontFamily: 'var(--font-body)', color: 'var(--opal-text)' }}>

            {/* ── Page header (matches TabDayOf header row) ── */}
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, gap: 12, flexWrap: 'wrap' }}>
                    <div>
                        <h2 style={{
                            margin: 0, fontSize: 24, fontWeight: 800,
                            color: 'var(--opal-text)', letterSpacing: '-0.02em',
                            display: 'flex', alignItems: 'center', gap: 10,
                            fontFamily: 'var(--font-display)',
                        }}>
                            <span style={{
                                color: P.violet ?? 'var(--opal-violet)',
                                background: 'rgba(124,92,252,0.12)',
                                padding: 7, borderRadius: 9, display: 'flex', fontSize: 18,
                            }}>
                                🏛️
                            </span>
                            Venue Bookings
                        </h2>
                        <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--opal-sub)' }}>
                            Manage your venue requests and negotiations
                        </p>
                    </div>

                    {/* Action buttons — same pattern as TabDayOf */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button
                            onClick={() => onNavigate?.('layout')}
                            style={{
                                padding: '8px 16px', borderRadius: 9, border: 'none',
                                background: `linear-gradient(135deg, var(--opal-amber) 0%, var(--opal-teal) 100%)`,
                                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                                color: '#0a0a0f', transition: 'opacity 0.15s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                        >
                            Venue Layout
                        </button>
                        <button
                            onClick={() => onNavigate?.('browse')}
                            style={{
                                padding: '8px 16px', borderRadius: 9,
                                border: '1px solid var(--opal-border)',
                                background: 'transparent',
                                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                color: 'var(--opal-text)', transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,92,252,0.1)'; e.currentTarget.style.borderColor = 'rgba(124,92,252,0.4)'; e.currentTarget.style.color = 'var(--opal-violet)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--opal-border)'; e.currentTarget.style.color = 'var(--opal-text)'; }}
                        >
                            Browse Venues
                        </button>
                    </div>
                </div>

                {/* ── Stat tiles (clickable filters) ── */}
                <div style={{ display: 'flex', gap: 14, marginBottom: 10, flexWrap: 'wrap' }}>
                    {tabs.map(t => (
                        <StatCard
                            key={t}
                            label={t === 'All' ? 'Total' : t}
                            value={counts[t]}
                            color={TILE_COLOR[t]}
                            sub={TILE_SUB[t]}
                            isActive={filter === t}
                            onClick={() => toggleFilter(t)}
                        />
                    ))}
                </div>

                {/* Active filter pill */}
                {filter !== 'All' && (
                    <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 12, color: 'var(--opal-sub)' }}>Filtering by</span>
                        <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: 'rgba(255,255,255,0.06)', color: 'var(--opal-text)', border: '1px solid var(--opal-border)' }}>
                            {filter} · {filtered.length} booking{filtered.length !== 1 ? 's' : ''}
                        </span>
                        <button
                            onClick={() => setFilter('All')}
                            style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: 'transparent', border: '1px solid var(--opal-border)', color: 'var(--opal-sub)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.color = 'var(--opal-red)'; e.currentTarget.style.borderColor = 'var(--opal-red)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--opal-sub)'; e.currentTarget.style.borderColor = 'var(--opal-border)'; }}
                        >
                            ✕ Clear
                        </button>
                    </div>
                )}
            </div>

            {/* ── Split panel (sidebar + detail) inside max-width container ── */}
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 32px' }}>
                <GlassPanel style={{
                    display: 'flex',
                    height: 'calc(100vh - 260px)',
                    minHeight: 500,
                    overflow: 'hidden',
                    padding: 0,
                }}>
                    {/* Sidebar list */}
                    <div style={{ width: 280, borderRight: '1px solid var(--opal-border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                        <div style={{ padding: '14px 12px 8px', borderBottom: '1px solid var(--opal-border)', flexShrink: 0 }}>
                            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'var(--opal-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                                {filter === 'All' ? 'All Venues' : filter} · {filtered.length}
                            </p>
                        </div>

                        <div style={{ overflowY: 'auto', flex: 1, padding: '8px' }}>
                            {loading && (
                                <p style={{ textAlign: 'center', color: 'var(--opal-muted)', fontSize: 13, marginTop: 24 }}>Loading…</p>
                            )}
                            {!loading && filtered.length === 0 && (
                                <p style={{ textAlign: 'center', color: 'var(--opal-muted)', fontSize: 13, marginTop: 24 }}>No conversations</p>
                            )}
                            {filtered.map(b => {
                                const isActive = selected?._id === b._id;
                                const s = STATUS[b.status] ?? STATUS.pending;
                                return (
                                    <button
                                        key={b._id}
                                        onClick={() => setSelected(b)}
                                        style={{
                                            width: '100%', textAlign: 'left',
                                            background: isActive ? 'var(--opal-violet-dim)' : 'transparent',
                                            border: isActive ? '1px solid rgba(124,92,252,0.22)' : '1px solid transparent',
                                            borderRadius: 11, padding: '11px 12px', cursor: 'pointer',
                                            marginBottom: 3, display: 'flex', alignItems: 'center', gap: 10,
                                            transition: 'all 0.15s',
                                        }}
                                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        <Avatar name={b.venueId?.name ?? 'V'} size={36} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                                                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--opal-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {b.venueId?.name}
                                                </p>
                                                {b.unreadCount > 0 && (
                                                    <span style={{ fontSize: 10, fontWeight: 700, color: '#0a0a0f', background: 'var(--opal-red)', borderRadius: 20, padding: '1px 6px', flexShrink: 0, marginLeft: 4 }}>
                                                        {b.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                            <p style={{ margin: 0, fontSize: 12, color: 'var(--opal-sub)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {b.eventType}
                                            </p>
                                            <span style={{ fontSize: 10, fontWeight: 600, color: s.text, marginTop: 4, display: 'block' }}>
                                                ● {s.label}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Detail panel */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
                        <DetailPanel
                            booking={selected}
                            currentUserId={currentUserId}
                            onBookingUpdate={handleBookingUpdate}
                            eventId={eventId}
                        />
                    </div>
                </GlassPanel>
            </div>
        </div>
    );
}