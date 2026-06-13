// pageVenueReports.jsx
import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import { getBookingSummary, getBookingHistory } from '../services/serviceVenueReports';

const C = {
    surface: '#22252D',
    border:  'rgba(255,255,255,0.07)',
    green:   '#30D158',
    red:     '#FF453A',
    amber:   '#F5A623',
    text:    '#F2F2F7',
    sub:     'rgba(242,242,247,0.45)',
    muted:   'rgba(242,242,247,0.22)',
    blue:    '#4F8EF7',
};

const fmtDate = d => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const fmtMoney = (amount, currency = 'EGP') => `${currency} ${Number(amount || 0).toLocaleString()}`;

const proratedAmount = h => {
    const total = h.requestedDates?.length || 1;
    const inside = h.filteredDates?.length ?? total;
    return Math.round((h.proposedPrice?.amount || 0) * (inside / total));
};

const statusColor = status => {
    if (status === 'approved')  return { bg: '#30D15820', color: '#30D158' };
    if (status === 'declined')  return { bg: '#FF453A20', color: '#FF453A' };
    if (status === 'countered') return { bg: '#F5A62320', color: '#F5A623' };
    return { bg: '#4F8EF720', color: '#4F8EF7' };
};

export default function PageVenueReports() {
    const [summary, setSummary] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({ startDate: '', endDate: '' });

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

    const page = { minHeight: '100vh', background: '#15171C', color: C.text, fontFamily: 'system-ui, -apple-system, sans-serif', padding: 32 };
    const panel = { background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: '18px 20px' };
    const label = { margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 0.8, textTransform: 'uppercase' };
    const select = { background: '#1A1C22', border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit' };

    return (
        <div style={page}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 800 }}>Performance & Reporting</h1>
                    <p style={{ margin: 0, fontSize: 14, color: C.sub }}>Booking activity and revenue across your listings.</p>
                </div>
                <button onClick={exportPDF} disabled={loading || !!error} style={{
                    background: C.blue, border: 'none', borderRadius: 8, color: '#fff',
                    padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    opacity: (loading || error) ? 0.5 : 1,
                }}>Export as PDF</button>
            </div>

            <div style={{ ...panel, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 20 }}>
                <div>
                    <p style={label}>From</p>
                    <input type="date" style={select} value={filters.startDate} onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))} />
                </div>
                <div>
                    <p style={label}>To</p>
                    <input type="date" style={select} value={filters.endDate} onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))} />
                </div>
                {(filters.startDate || filters.endDate) && (
                    <button onClick={() => setFilters({ startDate: '', endDate: '' })} style={{
                        background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, color: C.sub,
                        padding: '8px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                    }}>Clear filters</button>
                )}
                {summary?.period && (
                    <span style={{ fontSize: 12, color: C.muted, marginLeft: 'auto' }}>
                        Showing {fmtDate(summary.period.startDate)} – {fmtDate(summary.period.endDate)}
                    </span>
                )}
            </div>

            {error && <p style={{ color: C.red, fontSize: 13 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
                <div style={{ ...panel, flex: '1 1 160px' }}>
                    <p style={label}>Total Bookings</p>
                    <p style={{ margin: 0, fontSize: 26, fontWeight: 800 }}>{summary?.totals?.totalBookings ?? '—'}</p>
                </div>
                <div style={{ ...panel, flex: '1 1 160px' }}>
                    <p style={label}>Total Revenue</p>
                    <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: C.green }}>{fmtMoney(summary?.totals?.totalRevenue)}</p>
                </div>
                {(summary?.venues || []).map(v => (
                    <div key={v.venueId} style={{ ...panel, flex: '1 1 200px' }}>
                        <p style={label}>{v.venueName}</p>
                        <p style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 800 }}>{v.occupancyRate}% occupied</p>
                        <p style={{ margin: 0, fontSize: 12, color: C.sub }}>{v.totalBookings} bookings · {fmtMoney(v.revenue)}</p>
                    </div>
                ))}
            </div>

            <div style={panel}>
                <p style={label}>Booking History</p>
                {loading && <p style={{ margin: 0, fontSize: 13, color: C.muted }}>Loading…</p>}
                {!loading && history.length === 0 && (
                    <p style={{ margin: 0, fontSize: 13, color: C.muted }}>No bookings in this period.</p>
                )}
                {history.length > 0 && (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                                {['Dates', 'Venue', 'Organizer', 'Status', 'Amount'].map(h => (
                                    <th key={h} style={{ textAlign: 'left', padding: '8px 6px', fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.6 }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {history.map(h => {
                                const sc = statusColor(h.status);
                                const dates = (h.filteredDates || h.requestedDates || []).map(d => fmtDate(d)).join(', ');
                                return (
                                    <tr key={h._id} style={{ borderBottom: `1px solid ${C.border}` }}>
                                        <td style={{ padding: '8px 6px' }}>{dates}</td>
                                        <td style={{ padding: '8px 6px' }}>{h.venueId?.name}</td>
                                        <td style={{ padding: '8px 6px', color: C.sub }}>{h.organizerId?.fullname}</td>
                                        <td style={{ padding: '8px 6px' }}>
                                            <span style={{
                                                padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                                                background: sc.bg, color: sc.color,
                                            }}>{h.status}</span>
                                        </td>
                                        <td style={{ padding: '8px 6px', fontWeight: 600 }}>
                                            {fmtMoney(proratedAmount(h), h.proposedPrice?.currency)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}