// pageVenueReports.jsx
import { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import {
    VscHome, VscMail, VscCalendar,
} from 'react-icons/vsc';
import { getBookingSummary, getBookingHistory } from '../services/serviceVenueReports';
import AppHeader from '../components/componentAppHeader.jsx';
import Dock from '../components/componentDock.jsx';
import MiniCalendar from '../components/componentMiniCalendar.jsx';
import '../components/componentTheme.css';
import { useNavigate } from 'react-router-dom';

const fmtDate = d => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const fmtMoney = (amount, currency = 'EGP') => `${currency} ${Number(amount || 0).toLocaleString()}`;

const proratedAmount = h => {
    const total = h.requestedDates?.length || 1;
    const inside = h.filteredDates?.length ?? total;
    return Math.round((h.proposedPrice?.amount || 0) * (inside / total));
};

const STATUS_COLOR = {
    approved:  { bg: 'var(--opal-teal-dim)',   text: 'var(--opal-teal)'   },
    declined:  { bg: 'var(--opal-red-dim)',    text: 'var(--opal-red)'    },
    countered: { bg: 'var(--opal-amber-dim)',  text: 'var(--opal-amber)'  },
    pending:   { bg: 'var(--opal-violet-dim)', text: 'var(--opal-violet)' },
};
const statusColor = status => STATUS_COLOR[status] ?? STATUS_COLOR.pending;

// ─── Shared helpers ─────────────────────────────────────────────────────────

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

const labelStyle = {
    margin: '0 0 8px', fontSize: 10, fontWeight: 700,
    color: 'var(--opal-muted)', letterSpacing: 0.8, textTransform: 'uppercase',
};

const DOCK_HEIGHT = 120;

export default function PageVenueReports() {
    const [summary, setSummary] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({ startDate: '', endDate: '' });
    const [calOpen, setCalOpen] = useState(false);
    const calBtnRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        Promise.all([getBookingSummary(filters), getBookingHistory(filters)])
            .then(([summaryRes, historyRes]) => {
                if (cancelled) return;
                setSummary(summaryRes.data);
                setHistory(historyRes.data || []);
            })
            .catch(err => { if (!cancelled) setError(err.message || 'Failed to load reports'); })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, [filters]);

    // MiniCalendar drives both range endpoints via its selectedDates array.
    // We treat the earliest selected date as "from" and the latest as "to".
    const rangeDates = [filters.startDate, filters.endDate].filter(Boolean);

    const handleCalendarChange = (dates) => {
        if (dates.length === 0) {
            setFilters({ startDate: '', endDate: '' });
        } else if (dates.length === 1) {
            setFilters({ startDate: dates[0], endDate: '' });
        } else {
            const sorted = [...dates].sort();
            setFilters({ startDate: sorted[0], endDate: sorted[sorted.length - 1] });
        }
    };

    const exportPDF = () => {
        const doc = new jsPDF();
        const marginX = 14;
        let y = 18;

        const checkPage = (needed = 8) => {
            if (y + needed > 270) { doc.addPage(); y = 18; }
        };

        // title
        doc.setFontSize(16);
        doc.setTextColor(0);
        doc.text('Venue Performance Report', marginX, y);
        y += 8;

        if (summary?.period) {
            doc.setFontSize(10);
            doc.setTextColor(120);
            doc.text(`Period: ${fmtDate(summary.period.startDate)} - ${fmtDate(summary.period.endDate)}`, marginX, y);
            y += 10;
        }

        doc.setTextColor(0);
        doc.setFontSize(12);
        doc.text(`Total bookings: ${summary?.totals?.totalBookings ?? 0}`, marginX, y);
        y += 6;
        doc.text(`Total revenue: ${fmtMoney(summary?.totals?.totalRevenue)}`, marginX, y);
        y += 12;

        // per venue
        checkPage(20);
        doc.setFontSize(11);
        doc.setTextColor(0);
        doc.text('Per Venue', marginX, y);
        y += 8;
        doc.setFontSize(9);
        doc.setTextColor(120);
        doc.text('Venue',     marginX,        y);
        doc.text('Bookings',  marginX + 80,   y);
        doc.text('Revenue',   marginX + 115,  y);
        doc.text('Occupancy', marginX + 155,  y);
        y += 6;
        doc.setTextColor(0);

        (summary?.venues || []).forEach(v => {
            checkPage(8);
            doc.text(v.venueName,           marginX,       y);
            doc.text(String(v.totalBookings), marginX + 80,  y);
            doc.text(fmtMoney(v.revenue),   marginX + 115, y);
            doc.text(`${v.occupancyRate}%`, marginX + 155, y);
            y += 6;
        });

        // booking history
        y += 10;
        checkPage(20);
        doc.setFontSize(11);
        doc.setTextColor(0);
        doc.text('Booking History', marginX, y);
        y += 8;
        doc.setFontSize(9);
        doc.setTextColor(120);
        doc.text('Dates',     marginX,       y);
        doc.text('Venue',     marginX + 65,  y);
        doc.text('Organizer', marginX + 115, y);
        doc.text('Amount',    marginX + 165, y);
        y += 6;
        doc.setTextColor(0);

        const exportHistory = history.filter(h => h.status !== 'declined');

        exportHistory.forEach(h => {
            const dates = (h.filteredDates || h.requestedDates || []).map(d => fmtDate(d));
            const amount = proratedAmount(h);
            const currency = h.proposedPrice?.currency || 'EGP';
            const maxDateWidth = 55;

            // wrap dates into lines
            const dateLines = [];
            let currentLine = '';
            dates.forEach(d => {
                const candidate = currentLine ? `${currentLine}, ${d}` : d;
                if (doc.getTextWidth(candidate) > maxDateWidth && currentLine) {
                    dateLines.push(currentLine);
                    currentLine = d;
                } else {
                    currentLine = candidate;
                }
            });
            if (currentLine) dateLines.push(currentLine);

            const rowHeight = Math.max(dateLines.length * 5 + 3, 8);
            checkPage(rowHeight);

            dateLines.forEach((line, i) => {
                doc.text(line, marginX, y + i * 5);
            });

            doc.text(h.venueId?.name || '',         marginX + 65,  y);
            doc.text(h.organizerId?.fullname || '',  marginX + 115, y);
            doc.text(fmtMoney(amount, currency),     marginX + 165, y);

            y += rowHeight;
        });

        doc.save(`venue-report-${Date.now()}.pdf`);
    };

    const dockItems = [
        { icon: <VscMail size={26} />,     label: 'Requests', onClick: () => navigate('/venueowner/venueresponse') },
        { icon: <VscHome size={26} />,     label: 'Home',     onClick: () => navigate('/venueowner/venues') },
        { icon: <VscCalendar size={26} />, label: 'Reports',  active: true, onClick: () => navigate('/venueowner/venuereports') },
    ];

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-body)', color: 'var(--opal-text)' }}>
            <AppHeader crumb="Venue Reports" right={<Avatar name="Account" size={32} />} />

            <div style={{ flex: 1, overflowY: 'auto', padding: `24px 32px ${DOCK_HEIGHT + 16}px` }}>

                {/* ── Filters + export ── */}
                <GlassCard style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', padding: '16px 18px', marginBottom: 20, position: 'relative', zIndex: 100 }}>
                    <div style={{ position: 'relative' }}>
                        <button
                            ref={calBtnRef}
                            onClick={() => setCalOpen(o => !o)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '9px 14px', borderRadius: 10,
                                border: calOpen || rangeDates.length > 0 ? '1px solid rgba(124,92,252,0.35)' : '1px solid var(--opal-border)',
                                background: calOpen || rangeDates.length > 0 ? 'var(--opal-violet-dim)' : 'var(--opal-surface)',
                                color: calOpen || rangeDates.length > 0 ? 'var(--opal-violet)' : 'var(--opal-sub)',
                                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                fontFamily: 'var(--font-body)', transition: 'all 0.15s',
                            }}
                        >
                            📅 {filters.startDate
                                ? `${fmtDate(filters.startDate)}${filters.endDate ? ` – ${fmtDate(filters.endDate)}` : ''}`
                                : 'Filter by date range'}
                        </button>

                        {calOpen && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 8, zIndex: 200 }}>
                                <MiniCalendar selectedDates={rangeDates} onChange={handleCalendarChange} />
                            </div>
                        )}
                    </div>

                    {(filters.startDate || filters.endDate) && (
                        <button onClick={() => setFilters({ startDate: '', endDate: '' })} style={{
                            background: 'none', border: '1px solid var(--opal-border)', borderRadius: 10, color: 'var(--opal-sub)',
                            padding: '9px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)',
                        }}>Clear filters</button>
                    )}

                    {summary?.period && (
                        <span style={{ fontSize: 12, color: 'var(--opal-muted)' }}>
                            Showing {fmtDate(summary.period.startDate)} – {fmtDate(summary.period.endDate)}
                        </span>
                    )}

                    <button
                        onClick={exportPDF}
                        disabled={loading || !!error}
                        style={{
                            marginLeft: 'auto',
                            background: 'linear-gradient(135deg, var(--opal-violet) 0%, var(--opal-teal) 100%)',
                            border: 'none', borderRadius: 10, color: '#0a0a0f',
                            padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)',
                            opacity: (loading || error) ? 0.4 : 1,
                            transition: 'opacity 0.15s',
                        }}
                    >Export as PDF</button>
                </GlassCard>

                {error && <p style={{ color: 'var(--opal-red)', fontSize: 13 }}>{error}</p>}

                {/* ── Summary stats ── */}
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
                    <GlassCard style={{ flex: '1 1 160px', padding: '16px 18px' }}>
                        <p style={labelStyle}>Total Bookings</p>
                        <p style={{ margin: 0, fontSize: 26, fontWeight: 700, color: 'var(--opal-text)', fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums' }}>
                            {summary?.totals?.totalBookings ?? '—'}
                        </p>
                    </GlassCard>
                    <GlassCard style={{ flex: '1 1 160px', padding: '16px 18px' }}>
                        <p style={labelStyle}>Total Revenue</p>
                        <p style={{ margin: 0, fontSize: 26, fontWeight: 700, color: 'var(--opal-teal)', fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums' }}>
                            {fmtMoney(summary?.totals?.totalRevenue)}
                        </p>
                    </GlassCard>
                    {(summary?.venues || []).map(v => (
                        <GlassCard key={v.venueId} style={{ flex: '1 1 200px', padding: '16px 18px' }}>
                            <p style={labelStyle}>{v.venueName}</p>
                            <p style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: 'var(--opal-text)', fontFamily: 'var(--font-display)' }}>
                                {v.occupancyRate}% occupied
                            </p>
                            <p style={{ margin: 0, fontSize: 12, color: 'var(--opal-sub)' }}>
                                {v.totalBookings} bookings · {fmtMoney(v.revenue)}
                            </p>
                        </GlassCard>
                    ))}
                </div>

                {/* ── History table ── */}
                <GlassCard style={{ padding: '16px 18px' }}>
                    <p style={labelStyle}>Booking History</p>
                    {loading && <p style={{ margin: 0, fontSize: 13, color: 'var(--opal-muted)' }}>Loading…</p>}
                    {!loading && history.length === 0 && (
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--opal-muted)' }}>No bookings in this period.</p>
                    )}
                    {history.length > 0 && (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--opal-border)' }}>
                                        {['Dates', 'Venue', 'Organizer', 'Status', 'Amount'].map(h => (
                                            <th key={h} style={{ textAlign: 'left', padding: '8px 6px', fontSize: 11, color: 'var(--opal-muted)', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 700 }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map(h => {
                                        const sc = statusColor(h.status);
                                        const dates = (h.filteredDates || h.requestedDates || []).map(d => fmtDate(d)).join(', ');
                                        return (
                                            <tr key={h._id} style={{ borderBottom: '1px solid var(--opal-border)' }}>
                                                <td style={{ padding: '8px 6px', color: 'var(--opal-text)' }}>{dates}</td>
                                                <td style={{ padding: '8px 6px', color: 'var(--opal-text)' }}>{h.venueId?.name}</td>
                                                <td style={{ padding: '8px 6px', color: 'var(--opal-sub)' }}>{h.organizerId?.fullname}</td>
                                                <td style={{ padding: '8px 6px' }}>
                                                    <span style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: 5,
                                                        padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                                                        background: sc.bg, color: sc.text,
                                                    }}>
                                                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: sc.text }} />
                                                        {h.status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '8px 6px', fontWeight: 600, color: 'var(--opal-text)' }}>
                                                    {fmtMoney(proratedAmount(h), h.proposedPrice?.currency)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </GlassCard>
            </div>

            <Dock items={dockItems} />
        </div>
    );
}