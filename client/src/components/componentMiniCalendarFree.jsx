import { useState } from 'react';

// ─── Shared helpers ───────────────────────────────────────────────────────────

function toUTCKey(value) {
    if (typeof value === 'string') {
        const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (m) return `${m[1]}-${String(m[2]).padStart(2, '0')}-${String(m[3]).padStart(2, '0')}`;
    }
    const dt = new Date(value);
    return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}

const todayKey = toUTCKey(new Date());

const NAV_BTN = {
    width: 24, height: 24, borderRadius: 6,
    border: '1px solid var(--opal-border)',
    background: 'rgba(30,30,41,0.8)', color: 'var(--opal-sub)',
    fontSize: 14, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-body)', lineHeight: 1, padding: 0,
    flexShrink: 0,
};

// ─── MiniCalendarFree ─────────────────────────────────────────────────────────
//
// Identical to MiniCalendar but allows selecting past dates.
// Use this wherever organizers need to set historical or flexible dates
// (e.g. creating an event with a past start date).
//
// Props:
//   selectedDates  string[]   Array of "YYYY-MM-DD" strings (controlled)
//   onChange       fn         Called with the new sorted array whenever a date is toggled

export default function MiniCalendarFree({ selectedDates = [], onChange }) {
    const now = new Date();
    const [offset, setOffset] = useState(0);

    const totalMonths  = now.getFullYear() * 12 + now.getMonth() + offset;
    const displayYear  = Math.floor(totalMonths / 12);
    const displayMonth = totalMonths % 12;

    const monthLabel = new Date(Date.UTC(displayYear, displayMonth, 1))
        .toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });

    const firstDow    = new Date(Date.UTC(displayYear, displayMonth, 1)).getUTCDay();
    const daysInMonth = new Date(Date.UTC(displayYear, displayMonth + 1, 0)).getUTCDate();
    const cells = [
        ...Array(firstDow).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

    const selectedSet = new Set(selectedDates);

    const toggle = (day) => {
        const key = `${displayYear}-${String(displayMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const next = new Set(selectedSet);
        if (next.has(key)) next.delete(key); else next.add(key);
        onChange([...next].sort());
    };

    const removeChip = (key) => {
        const next = new Set(selectedSet);
        next.delete(key);
        onChange([...next].sort());
    };

    return (
        <div style={{
            background: 'rgba(15,15,25,0.97)',
            backdropFilter: 'blur(24px) saturate(160%)',
            WebkitBackdropFilter: 'blur(24px) saturate(160%)',
            border: '1px solid var(--opal-border)',
            borderRadius: 16,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
            padding: '14px 16px',
            width: 260,
            userSelect: 'none',
        }}>
            {/* ── Month nav ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: 0.9,
                    textTransform: 'uppercase', color: 'var(--opal-muted)',
                }}>
                    Date
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                        onClick={() => setOffset(o => o - 1)}
                        style={NAV_BTN}
                        aria-label="Previous month"
                    >‹</button>
                    <span style={{
                        fontSize: 11, fontWeight: 600, color: 'var(--opal-text)',
                        minWidth: 82, textAlign: 'center',
                    }}>
                        {monthLabel}
                    </span>
                    <button
                        onClick={() => setOffset(o => o + 1)}
                        style={NAV_BTN}
                        aria-label="Next month"
                    >›</button>
                </div>
            </div>

            {/* ── Day-of-week headers ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 2 }}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <div key={i} style={{
                        textAlign: 'center', fontSize: 9, fontWeight: 700,
                        color: 'var(--opal-muted)', letterSpacing: 0.4,
                    }}>{d}</div>
                ))}
            </div>

            {/* ── Day cells — all dates are selectable (incl. past) ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
                {cells.map((day, i) => {
                    if (day === null) return <div key={`b-${i}`} />;

                    const key        = `${displayYear}-${String(displayMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const isToday    = key === todayKey;
                    const isSelected = selectedSet.has(key);
                    const isPast     = key < todayKey;

                    return (
                        <button
                            key={key}
                            onClick={() => toggle(day)}
                            title={isSelected ? 'Click to deselect' : 'Click to select'}
                            style={{
                                aspectRatio: '1',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                borderRadius: 7, fontSize: 11, fontWeight: 600,
                                border: isSelected
                                    ? '1px solid rgba(139,109,255,0.55)'
                                    : isToday
                                        ? '1px solid rgba(139,109,255,0.28)'
                                        : '1px solid transparent',
                                cursor: 'pointer',
                                background: isSelected
                                    ? 'var(--opal-violet, #8b6dff)'
                                    : isToday
                                        ? 'rgba(139,109,255,0.1)'
                                        : 'transparent',
                                color: isSelected
                                    ? '#0a0a12'
                                    : isPast
                                        ? 'rgba(237,233,255,0.32)'
                                        : isToday
                                            ? '#8b6dff'
                                            : 'var(--opal-sub)',
                                transition: 'background 0.1s, color 0.1s',
                                fontFamily: 'var(--font-body)',
                            }}
                        >
                            {day}
                        </button>
                    );
                })}
            </div>

            {/* ── Selected chips ── */}
            {selectedDates.length > 0 && (
                <div style={{
                    marginTop: 10,
                    paddingTop: 10,
                    borderTop: '1px solid var(--opal-border)',
                    display: 'flex', flexWrap: 'wrap', gap: 4,
                }}>
                    {selectedDates.map(d => (
                        <span
                            key={d}
                            onClick={() => removeChip(d)}
                            title="Remove"
                            style={{
                                fontSize: 10, fontWeight: 600,
                                padding: '2px 8px', borderRadius: 6,
                                background: 'rgba(139,109,255,0.14)',
                                color: '#8b6dff',
                                border: '1px solid rgba(139,109,255,0.3)',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 4,
                            }}
                        >
                            {new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', {
                                day: 'numeric', month: 'short', timeZone: 'UTC',
                            })}
                            <span style={{ opacity: 0.55, fontSize: 11, lineHeight: 1 }}>×</span>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
