import { useState, useEffect } from 'react';

function toUTCKey(value) {
    if (typeof value === 'string') {
        const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (m) return `${Number(m[1])}-${Number(m[2]) - 1}-${Number(m[3])}`;
    }
    const dt = new Date(value);
    return `${dt.getUTCFullYear()}-${dt.getUTCMonth()}-${dt.getUTCDate()}`;
}

function cellKey(year, month0, day) {
    return `${year}-${month0}-${day}`;
}

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

const navBtnStyle = {
    width: 22, height: 22, borderRadius: 6,
    border: '1px solid var(--opal-border)',
    background: 'var(--opal-bg)',
    color: 'var(--opal-sub)',
    fontSize: 13, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-body)', lineHeight: 1, padding: 0,
};

const labelStyle = {
    margin: 0, fontSize: 11, fontWeight: 700,
    color: 'var(--opal-muted)', letterSpacing: 0.8, textTransform: 'uppercase',
};

const DAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function CalendarAvailability({ venueId, requestedDates = [], fetchAvailability }) {
    const [bookedDates, setBookedDates] = useState([]);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState(null);
    const [monthOffset, setMonthOffset] = useState(0);

    useEffect(() => {
        if (!venueId || !fetchAvailability) {
            setLoading(false);
            return;
        }
        let cancelled = false;
        setLoading(true);
        setError(null);
        setMonthOffset(0);

        fetchAvailability(venueId)
            .then(res => { if (!cancelled) setBookedDates(res.bookedDates ?? []); })
            .catch(err => { if (!cancelled) setError(err.message ?? 'Failed to load availability'); })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, [venueId, fetchAvailability]);

    const anchorDate  = requestedDates?.[0] ? new Date(requestedDates[0]) : new Date();
    const anchorYear  = anchorDate.getUTCFullYear();
    const anchorMonth = anchorDate.getUTCMonth();

    const totalMonths  = anchorYear * 12 + anchorMonth + monthOffset;
    const displayYear  = Math.floor(totalMonths / 12);
    const displayMonth = totalMonths % 12;

    const monthLabel = new Date(Date.UTC(displayYear, displayMonth, 1))
        .toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });

    // ── Build lookup maps ────────────────────────────────────────────────────
    // bookedMap:  key → 'booking' | 'manual'
    // requestedSet: keys for THIS booking's requested dates (amber, highest priority)
    const bookedMap    = new Map(bookedDates.map(b => [toUTCKey(b.date), b.source ?? 'booking']));
    const requestedSet = new Set(requestedDates.map(toUTCKey));

    const firstDayOfWeek = new Date(Date.UTC(displayYear, displayMonth, 1)).getUTCDay();
    const daysInMonth    = new Date(Date.UTC(displayYear, displayMonth + 1, 0)).getUTCDate();
    const cells = [
        ...Array(firstDayOfWeek).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

    const shell = (children) => (
        <GlassCard style={{ padding: '16px 20px', maxWidth: 340 }}>
            <p style={labelStyle}>Availability</p>
            {children}
        </GlassCard>
    );

    if (!venueId) return null;
    if (loading)  return shell(<p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--opal-muted)' }}>Loading…</p>);
    if (error)    return shell(<p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--opal-red)' }}>{error}</p>);

    return (
        <GlassCard style={{ padding: '16px 20px', maxWidth: 340 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <p style={labelStyle}>Availability</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => setMonthOffset(o => o - 1)} style={navBtnStyle} aria-label="Previous month">‹</button>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--opal-text)', minWidth: 96, textAlign: 'center' }}>
                        {monthLabel}
                    </span>
                    <button onClick={() => setMonthOffset(o => o + 1)} style={navBtnStyle} aria-label="Next month">›</button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
                {DAY_HEADERS.map((d, i) => (
                    <div key={i} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--opal-muted)' }}>{d}</div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                {cells.map((day, i) => {
                    if (day === null) return <div key={`blank-${i}`} />;

                    const key         = cellKey(displayYear, displayMonth, day);
                    const isRequested = requestedSet.has(key);
                    const bookedSrc   = bookedMap.get(key);   // 'booking' | 'manual' | undefined
                    const isBooked    = !!bookedSrc && !isRequested;  // requested wins
                    const isManual    = isBooked && bookedSrc === 'manual';

                    // Priority: requested (amber) > manual (green) > booking (red) > default
                    let bg     = 'transparent';
                    let color  = 'var(--opal-sub)';
                    let border = '1px solid transparent';
                    let title;

                    if (isRequested) {
                        bg     = 'rgba(245,179,74,0.12)';
                        color  = 'var(--opal-amber)';
                        border = '1px solid rgba(245,179,74,0.28)';
                        title  = 'Requested';
                    } else if (isManual) {
                        bg     = 'rgba(72,199,142,0.12)';
                        color  = '#48c78e';
                        border = '1px solid rgba(72,199,142,0.28)';
                        title  = 'Manually selected';
                    } else if (isBooked) {
                        bg     = 'rgba(255,92,102,0.12)';
                        color  = 'var(--opal-red)';
                        border = '1px solid rgba(255,92,102,0.28)';
                        title  = 'Booked';
                    }

                    return (
                        <div
                            key={key}
                            title={title}
                            style={{
                                aspectRatio: '1',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                borderRadius: 8, fontSize: 13, fontWeight: 600,
                                background: bg, color, border,
                            }}
                        >
                            {day}
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: 11, color: 'var(--opal-sub)', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 7, height: 7, borderRadius: 2, background: 'var(--opal-red)', flexShrink: 0 }} />
                    Booked
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 7, height: 7, borderRadius: 2, background: '#48c78e', flexShrink: 0 }} />
                    Manually booked
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 7, height: 7, borderRadius: 2, background: 'var(--opal-amber)', flexShrink: 0 }} />
                    This request
                </span>
            </div>
        </GlassCard>
    );
}