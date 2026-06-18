// pageBookingsCalendar.jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { VscHome, VscMail, VscCalendar, VscBell, VscPerson } from 'react-icons/vsc';
import Dock from '../components/componentDock.jsx';
import AppHeader from '../components/componentAppHeader.jsx';
import { getConfirmedBookings } from '../services/serviceBookingCalendar';

const C = {
    surface: '#22252D',
    border: 'rgba(255,255,255,0.07)',
    green: '#30D158',
    red: '#FF453A',
    amber: '#F5A623',
    text: '#F2F2F7',
    sub: 'rgba(242,242,247,0.45)',
    muted: 'rgba(242,242,247,0.22)',
    blue: '#4F8EF7',
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const pad = n => String(n).padStart(2, '0');

const dateKey = d => {
    const date = new Date(d);
    return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
};

const fmtDate = d => new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'
});

const fmtMonthYear = d => d.toLocaleDateString('en-GB', {
    month: 'long', year: 'numeric', timeZone: 'UTC'
});

function buildMonthGrid(year, month) {
    const startWeekday = new Date(Date.UTC(year, month, 1)).getDay();
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getDate();
    const cells = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(Date.UTC(year, month, d)));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
}

export default function PageBookingsCalendar() {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({ venueId: '', status: 'approved', startDate: '', endDate: '' });
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedBooking, setSelectedBooking] = useState(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        getConfirmedBookings(filters)
            .then(res => { if (!cancelled) setBookings(res.data || []); })
            .catch(err => { if (!cancelled) setError(err.message || 'Failed to load bookings'); })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, [filters]);

    const venueOptions = useMemo(() => {
        const map = new Map();
        bookings.forEach(b => { if (b.venueId?._id) map.set(b.venueId._id, b.venueId.name); });
        return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    }, [bookings]);

    const bookingsByDate = useMemo(() => {
        const map = new Map();
        bookings.forEach(b => {
            (b.requestedDates || []).forEach(d => {
                const key = dateKey(d);
                if (!map.has(key)) map.set(key, []);
                map.get(key).push(b);
            });
        });
        return map;
    }, [bookings]);

    const selectedKeys = useMemo(() => {
        if (!selectedBooking) return new Set();
        return new Set((selectedBooking.requestedDates || []).map(d => dateKey(d)));
    }, [selectedBooking]);

    const grid = useMemo(
        () => buildMonthGrid(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth()),
        [currentMonth]
    );

    const changeMonth = delta => setCurrentMonth(prev =>
        new Date(Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth() + delta, 1))
    );

    const handleSelectBooking = booking => {
        setSelectedBooking(booking);
        const d = new Date(booking.requestedDates[0]);
        setCurrentMonth(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)));
    };

    const dockItems = [
        { icon: <VscMail size={26} />, label: 'Requests', onClick: () => navigate('/venueowner/venueresponse') },
        { icon: <VscHome size={26} />, label: 'Home', onClick: () => navigate('/venueowner/venues') },
        { icon: <VscCalendar size={26} />, label: 'Reports', onClick: () => navigate('/venueowner/venuereports') },
        { icon: <VscPerson size={26} />, label: 'Owner Profile', onClick: () => navigate('/pageProfile') },
    ];

    const page = { minHeight: '100vh', background: '#15171C', color: C.text, fontFamily: 'system-ui, -apple-system, sans-serif', padding: 32, paddingBottom: 150 };
    const panel = { background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: '18px 20px' };
    const label = { margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 0.8, textTransform: 'uppercase' };
    const select = { background: '#1A1C22', border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit' };
    const navBtn = { background: '#1A1C22', border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, width: 32, height: 32, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit' };

    return (
        <div style={page}>
            <AppHeader
                crumb="Booking Calendar"
                right={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: 'rgba(62,207,184,0.14)', color: '#3ecfb8', border: '1px solid rgba(62,207,184,0.27)' }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#3ecfb8', display: 'inline-block', boxShadow: '0 0 6px rgba(62,207,184,0.4)' }} />
                        Venue Owner Portal
                    </div>
                }
            />
            <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 800 }}>Confirmed Bookings</h1>
            <p style={{ margin: '0 0 24px', fontSize: 14, color: C.sub }}>Calendar overview of confirmed bookings across your listings.</p>

            <div style={{ ...panel, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 20 }}>
                <div>
                    <p style={label}>Venue</p>
                    <select style={select} value={filters.venueId} onChange={e => setFilters(f => ({ ...f, venueId: e.target.value }))}>
                        <option value="">All venues</option>
                        {venueOptions.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                </div>
                <div>
                    <p style={label}>Status</p>
                    <select style={select} value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
                        <option value="approved">Approved</option>
                        <option value="pending">Pending</option>
                        <option value="declined">Declined</option>
                        <option value="countered">Countered</option>
                    </select>
                </div>
                <div>
                    <p style={label}>From</p>
                    <input type="date" style={select} value={filters.startDate} onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))} />
                </div>
                <div>
                    <p style={label}>To</p>
                    <input type="date" style={select} value={filters.endDate} onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))} />
                </div>
                {(filters.venueId || filters.startDate || filters.endDate || filters.status !== 'approved') && (
                    <button onClick={() => setFilters({ venueId: '', status: 'approved', startDate: '', endDate: '' })} style={{
                        background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, color: C.sub,
                        padding: '8px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                    }}>Clear filters</button>
                )}
            </div>

            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div style={{ ...panel, flex: '2 1 480px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <button onClick={() => changeMonth(-1)} style={navBtn}>‹</button>
                        <span style={{ fontSize: 15, fontWeight: 700 }}>{fmtMonthYear(currentMonth)}</span>
                        <button onClick={() => changeMonth(1)} style={navBtn}>›</button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
                        {WEEKDAYS.map(d => (
                            <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: C.muted, padding: '4px 0' }}>{d}</div>
                        ))}
                        {grid.map((date, i) => {
                            if (!date) return <div key={i} />;
                            const key = dateKey(date);
                            const dayBookings = bookingsByDate.get(key) || [];
                            const isBooked = dayBookings.length > 0;
                            const isSelected = selectedKeys.has(key);

                            let bg = 'transparent';
                            let border = `1px solid ${C.border}`;
                            if (isBooked) {
                                bg = isSelected ? `${C.green}26` : `${C.red}1F`;
                                border = `1px solid ${isSelected ? C.green : C.red}66`;
                            }

                            return (
                                <div key={i} onClick={() => isBooked && handleSelectBooking(dayBookings[0])} style={{
                                    borderRadius: 8, padding: '8px 6px', minHeight: 52,
                                    background: bg, border, fontSize: 12,
                                    display: 'flex', flexDirection: 'column', gap: 4,
                                    cursor: isBooked ? 'pointer' : 'default',
                                }}>
                                    <span style={{ fontWeight: 600 }}>{date.getUTCDate()}</span>
                                    {isBooked && (
                                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: isSelected ? C.green : C.red, display: 'inline-block' }} />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ display: 'flex', gap: 16, marginTop: 16, fontSize: 12, color: C.sub }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.red, display: 'inline-block' }} /> Booked
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.green, display: 'inline-block' }} /> Selected booking
                        </span>
                    </div>
                </div>

                <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={panel}>
                        <p style={label}>Bookings {bookings.length > 0 && `(${bookings.length})`}</p>
                        {loading && <p style={{ margin: 0, fontSize: 13, color: C.muted }}>Loading…</p>}
                        {error && <p style={{ margin: 0, fontSize: 13, color: C.red }}>{error}</p>}
                        {!loading && !error && bookings.length === 0 && (
                            <p style={{ margin: 0, fontSize: 13, color: C.muted }}>No bookings match these filters.</p>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 360, overflowY: 'auto' }}>
                            {bookings.map(b => {
                                const isSelected = selectedBooking?._id === b._id;
                                return (
                                    <button key={b._id} onClick={() => handleSelectBooking(b)} style={{
                                        textAlign: 'left', background: isSelected ? `${C.green}1A` : '#1A1C22',
                                        border: `1px solid ${isSelected ? C.green + '66' : C.border}`,
                                        borderRadius: 8, padding: '10px 12px', cursor: 'pointer', fontFamily: 'inherit', color: C.text,
                                    }}>
                                        <div style={{ fontSize: 13, fontWeight: 600 }}>{b.venueId?.name || 'Venue'}</div>
                                        <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>
                                            {fmtDate(b.requestedDates?.[0])} · {b.organizerId?.fullname || 'Organizer'}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div style={panel}>
                        <p style={label}>Organizer Contact</p>
                        {!selectedBooking ? (
                            <p style={{ margin: 0, fontSize: 13, color: C.muted }}>Select a booking to view organizer details.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                                <div><strong>{selectedBooking.organizerId?.fullname}</strong></div>
                                <div style={{ color: C.sub }}>{selectedBooking.organizerId?.email}</div>
                                <div style={{ color: C.sub }}>{selectedBooking.organizerId?.phone}</div>
                                <div style={{ marginTop: 4 }}>
                                    <span style={{ color: C.amber, fontWeight: 600 }}>{selectedBooking.eventType}</span>
                                </div>
                                <div style={{ color: C.sub }}>
                                    {selectedBooking.expectedAttendees && `${selectedBooking.expectedAttendees} attendees`}
                                </div>
                                {selectedBooking.specialRequirements && (
                                    <div style={{ color: C.sub, fontStyle: 'italic' }}>"{selectedBooking.specialRequirements}"</div>
                                )}
                                <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}`, color: C.sub }}>
                                    {selectedBooking.venueId?.name} · {selectedBooking.requestedDates.map(d => fmtDate(d)).join(', ')} · {selectedBooking.proposedPrice?.amount} {selectedBooking.proposedPrice?.currency}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Dock items={dockItems} />
        </div>
    );
}