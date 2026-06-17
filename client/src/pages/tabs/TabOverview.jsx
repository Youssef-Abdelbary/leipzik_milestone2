import { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { listGuests }              from '../../services/serviceGuest';
import { getBroadcasts }           from '../../services/serviceBroadcast';
import { apiFetch }                from '../../utils/apiFetch';
import { EVENT_TYPES }             from '../../utils/constants';
import { P, STATUS_COLORS, icons, GlassPanel } from '../../components/componentTheme';
import SettingsModal               from '../../components/SettingsModal';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
function fmtType(val) {
  return EVENT_TYPES.find(t => t.value === val)?.label || val?.replace(/_/g, ' ') || '—';
}
function navigateTo(tab) {
  window.dispatchEvent(new CustomEvent('workspace-tab', { detail: tab }));
}
const fmt   = (n, cur = 'EGP') => `${cur} ${Number(n || 0).toLocaleString()}`;
const pct   = (num, den)       => (den > 0 ? `${Math.round((num / den) * 100)}%` : '0%');
const score = (v)              => (v != null ? v.toFixed(1) : '—');

// ─── Summary tile (links to other tabs) ───────────────────────────────────────
function SummaryTile({ icon, label, value, sub, accentColor, glowColor, onClick, loading }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flex: '1 1 150px',
        background: hov ? glowColor : 'rgba(30,30,41,0.55)',
        backdropFilter: 'blur(18px) saturate(140%)',
        WebkitBackdropFilter: 'blur(18px) saturate(140%)',
        border: `1px solid ${hov ? accentColor + '44' : P.border}`,
        borderRadius: 16, padding: '20px 18px', cursor: 'pointer',
        textAlign: 'left', fontFamily: 'inherit', outline: 'none',
        transition: 'all 0.22s cubic-bezier(0.34,1.2,0.64,1)',
        transform: hov ? 'translateY(-3px)' : 'none',
        boxShadow: hov
          ? `0 8px 28px ${glowColor}, 0 0 0 1px ${accentColor}22, inset 0 1px 0 rgba(255,255,255,0.04)`
          : 'inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ color: accentColor, background: glowColor, padding: 8, borderRadius: 10, display: 'flex' }}>
          {icon}
        </span>
        <span style={{ fontSize: 11, color: hov ? accentColor : P.muted, fontWeight: 600, letterSpacing: '0.04em', transition: 'color 0.15s' }}>
          View →
        </span>
      </div>
      {loading ? (
        <div style={{ height: 32, background: P.hover, borderRadius: 6, marginBottom: 6 }} />
      ) : (
        <p style={{ margin: '0 0 4px', fontSize: 30, fontWeight: 800, color: P.text, lineHeight: 1, letterSpacing: '-0.03em', fontFamily: 'var(--font-display)' }}>{value}</p>
      )}
      <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 600, color: P.text }}>{label}</p>
      {sub && <p style={{ margin: 0, fontSize: 12, color: P.sub }}>{sub}</p>}
    </button>
  );
}

// ─── Detail row ───────────────────────────────────────────────────────────────
function DetailRow({ label, value }) {
  return (
    <div>
      <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: P.sub, textTransform: 'uppercase', letterSpacing: '0.09em' }}>{label}</p>
      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: P.text }}>{value || <span style={{ color: P.muted }}>—</span>}</p>
    </div>
  );
}

// ─── Section heading with rule ────────────────────────────────────────────────
function SectionHeading({ children, icon, style = {} }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '28px 0 14px', ...style }}>
      {icon && <span style={{ color: P.muted, display: 'flex' }}>{icon}</span>}
      <h2 style={{ margin: 0, fontSize: 11, fontWeight: 800, color: P.sub, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {children}
      </h2>
      <div style={{ flex: 1, height: 1, background: P.borderSub }} />
    </div>
  );
}

// ─── Score bar (feedback) ─────────────────────────────────────────────────────
function ScoreBar({ label, value, max = 5 }) {
  const fraction = max > 0 ? (value || 0) / max : 0;
  const accent = fraction >= 0.8 ? P.teal : fraction >= 0.6 ? P.blue : fraction >= 0.4 ? P.amber : P.rose;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
      <div style={{ width: 90, fontSize: 12, color: P.sub, textTransform: 'capitalize', fontWeight: 600 }}>{label}</div>
      <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${fraction * 100}%`,
          background: accent, borderRadius: 99,
          boxShadow: `0 0 6px ${accent}66`, transition: 'width 0.5s ease',
        }} />
      </div>
      <div style={{ width: 32, fontSize: 13, fontWeight: 800, color: accent, textAlign: 'right', letterSpacing: '-0.02em', fontFamily: 'var(--font-display)' }}>
        {score(value)}
      </div>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent, delay = 0 }) {
  return (
    <div style={{
      flex: '1 1 140px', minWidth: 0,
      background: 'rgba(19,19,30,0.72)',
      backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
      border: `1px solid ${P.border}`, borderRadius: 12, padding: '16px 18px',
      animation: `cardIn 0.3s ease ${delay}s both`,
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 900, color: accent || P.text, lineHeight: 1.1, letterSpacing: '-0.03em', fontFamily: 'var(--font-display)' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: P.sub, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function TabOverview({ event, onEventUpdate }) {
  const eventId = event._id;
  const [showEdit,       setShowEdit]       = useState(false);
  const [guestStats,     setGuestStats]     = useState(null);
  const [broadcastCount, setBroadcastCount] = useState(null);
  const [statsLoading,   setStatsLoading]   = useState(true);

  // Report data
  const [report,    setReport]    = useState(null);
  const [repLoading,setRepLoading]= useState(true);
  const [repError,  setRepError]  = useState(null);
  const [exporting, setExporting] = useState(false);

  // Fetch quick stats (tiles)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStatsLoading(true);
      try {
        const [g, b] = await Promise.allSettled([listGuests(eventId), getBroadcasts(eventId)]);
        if (cancelled) return;
        if (g.status === 'fulfilled') {
          const gv = g.value;
          setGuestStats({
            total:     gv.length,
            attending: gv.filter(x => x.rsvp?.status === 'attending').length,
            arrived:   gv.filter(x => x.checkIn?.status === 'Arrived').length,
          });
        }
        if (b.status === 'fulfilled') setBroadcastCount(b.value.length);
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [eventId]);

  // Fetch full report
  const loadReport = () => {
    setRepLoading(true);
    setRepError(null);
    apiFetch(`/events/${eventId}/report`)
      .then(data => setReport(data))
      .catch(err => setRepError(err.message || 'Failed to load report'))
      .finally(() => setRepLoading(false));
  };
  useEffect(() => { loadReport(); }, [eventId]);

  // PDF export
  function exportPDF() {
    if (!report) return;
    setExporting(true);
    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const W = doc.internal.pageSize.getWidth();
      const margin = 48;
      let y = 56;
      const currency = report.currency || 'EGP';
      const lineH = (h = 14) => { y += h; };
      const checkPage = (need = 40) => {
        if (y + need > doc.internal.pageSize.getHeight() - 48) { doc.addPage(); y = 48; }
      };

      doc.setFontSize(22); doc.setFont('helvetica', 'bold');
      doc.text(`Event Report: ${report.eventTitle || event.title}`, margin, y); lineH(24);
      doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(120);
      const dateStr = report.eventDate
        ? new Date(report.eventDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
        : fmtDate(event.date);
      doc.text(`${dateStr}  ·  Status: ${report.eventStatus || event.status || '—'}  ·  Generated: ${new Date().toLocaleDateString()}`, margin, y);
      doc.setTextColor(0); lineH(32);

      // Budget
      doc.setFontSize(13); doc.setFont('helvetica', 'bold');
      doc.text('Costs & Budget', margin, y); lineH(18);
      doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      const b = report.budget;
      doc.text(`Planned Total:  ${fmt(b.plannedTotal, currency)}`, margin, y); lineH(14);
      doc.text(`Actual Spend:   ${fmt(b.actualTotal, currency)}`, margin, y); lineH(14);
      const diff = b.difference;
      doc.text(`Difference:     ${diff >= 0 ? '+' : ''}${fmt(diff, currency)} (${diff >= 0 ? 'Under budget' : 'Over budget'})`, margin, y); lineH(20);

      if (b.categoryComparison?.length) {
        doc.setFont('helvetica', 'bold');
        doc.text('Category', margin, y); doc.text('Planned', margin + 200, y);
        doc.text('Actual', margin + 290, y); doc.text('Δ', margin + 375, y);
        lineH(4); doc.setDrawColor(200); doc.line(margin, y, W - margin, y); lineH(12);
        doc.setFont('helvetica', 'normal');
        b.categoryComparison.forEach(row => {
          checkPage();
          doc.text(row.category, margin, y);
          doc.text(fmt(row.planned, currency), margin + 200, y);
          doc.text(fmt(row.actual, currency), margin + 290, y);
          const d = row.difference;
          doc.setTextColor(d >= 0 ? 0 : 180, d >= 0 ? 120 : 0, 0);
          doc.text(`${d >= 0 ? '+' : ''}${fmt(d, currency)}`, margin + 375, y);
          doc.setTextColor(0); lineH(14);
        });
      }

      // Attendance
      checkPage(100); lineH(14);
      doc.setFontSize(13); doc.setFont('helvetica', 'bold');
      doc.text('Attendance', margin, y); lineH(18);
      doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      const a = report.attendance;
      doc.text(`Total Invited:   ${a.totalGuests}`, margin, y); lineH(14);
      doc.text(`RSVPd Attending: ${a.attendingGuests}`, margin, y); lineH(14);
      doc.text(`Checked In:      ${a.checkedIn} (${a.checkInRate}%)`, margin, y); lineH(14);
      doc.text(`RSVP Pending:    ${a.rsvpPending}`, margin, y); lineH(14);
      doc.text(`RSVP Declined:   ${a.rsvpDeclined}`, margin, y); lineH(22);

      // Feedback
      checkPage(80);
      doc.setFontSize(13); doc.setFont('helvetica', 'bold');
      doc.text('Outcomes & Feedback', margin, y); lineH(18);
      doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      const fb = report.feedback;
      doc.text(`Responses: ${fb.count} / ${a.attendingGuests} (${fb.responseRate}%)`, margin, y); lineH(14);
      if (fb.averages) {
        doc.text(`Overall Score: ${fb.averages.overall ?? '—'} / 5`, margin, y); lineH(14);
        ['experience', 'food', 'venue', 'organisation'].forEach(cat => {
          checkPage();
          doc.text(`  ${cat.charAt(0).toUpperCase() + cat.slice(1)}: ${fb.averages[cat] ?? '—'} / 5`, margin, y); lineH(13);
        });
      } else {
        doc.text('No feedback collected yet.', margin, y); lineH(14);
      }

      const pages = doc.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i); doc.setFontSize(8); doc.setTextColor(160);
        doc.text(`Page ${i} of ${pages}  ·  Generated ${new Date().toLocaleDateString()}`, margin, doc.internal.pageSize.getHeight() - 24);
        doc.setTextColor(0);
      }
      doc.save(`Report_${(event.title || 'event').replace(/\s+/g, '_')}.pdf`);
    } finally {
      setExporting(false);
    }
  }

  const sc = STATUS_COLORS[event.status] || P.muted;
  const fbValue = report?.feedback?.averages?.overall
    ? score(report.feedback.averages.overall)
    : event.status === 'completed' ? '0' : 'N/A';
  const fbSub = report?.feedback?.count != null
    ? `${report.feedback.count} response${report.feedback.count !== 1 ? 's' : ''}`
    : event.status !== 'completed' ? 'After event ends' : 'No responses';

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 60px', fontFamily: 'var(--font-body)', color: P.text }}>
      <style>{`
        @keyframes pageIn  { from{opacity:0} to{opacity:1} }
        @keyframes cardIn  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes skpulse { 0%,100%{opacity:1} 50%{opacity:.3} }
      `}</style>

      {/* ── Summary tiles ── */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap', animation: 'pageIn 0.3s ease both' }}>
        <SummaryTile
          icon={icons.guests} label="Total Guests"
          value={guestStats?.total ?? '—'}
          sub={guestStats ? `${guestStats.attending} confirmed attending` : ''}
          accentColor={P.blue} glowColor={P.blueGlow}
          loading={statsLoading} onClick={() => navigateTo('guests')}
        />
        <SummaryTile
          icon={icons.check} label="Arrivals"
          value={guestStats?.arrived ?? '—'}
          sub={guestStats ? `of ${guestStats.attending} expected` : ''}
          accentColor={P.teal} glowColor={P.tealGlow}
          loading={statsLoading} onClick={() => navigateTo('day-of')}
        />
        <SummaryTile
          icon={icons.messages} label="Broadcasts"
          value={broadcastCount ?? '—'} sub="messages sent"
          accentColor={P.indigo} glowColor={P.indigoGlow}
          loading={statsLoading} onClick={() => navigateTo('messages')}
        />
        <SummaryTile
          icon={icons.star} label="Feedback"
          value={fbValue} sub={fbSub}
          accentColor={P.amber} glowColor={P.amberGlow}
          loading={statsLoading || repLoading} onClick={() => navigateTo('feedback')}
        />
      </div>

      {/* ── Event details card ── */}
      <GlassPanel style={{ padding: 24, marginBottom: 8, animation: 'cardIn 0.32s ease 0.06s both' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 12 }}>
          <div>
            <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800, color: P.text, letterSpacing: '-0.02em', fontFamily: 'var(--font-display)' }}>{event.title}</h2>
            <span style={{ padding: '4px 12px', borderRadius: 99, fontSize: 10, fontWeight: 800, background: sc + '22', color: sc, border: `1px solid ${sc}44`, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              {event.status || 'planning'}
            </span>
          </div>
          <button
            onClick={() => setShowEdit(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: `1px solid ${P.blue}44`, background: P.blueGlow, color: P.blue, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = P.blue; e.currentTarget.style.color = '#0a0a12'; }}
            onMouseLeave={e => { e.currentTarget.style.background = P.blueGlow; e.currentTarget.style.color = P.blue; }}
          >
            {icons.edit} Edit
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px,1fr))', gap: '20px 24px' }}>
          <DetailRow label="Date"               value={fmtDate(event.date)} />
          <DetailRow label="Time"               value={`${event.startTime || '—'}${event.endTime ? ` – ${event.endTime}` : ''}`} />
          <DetailRow label="Event Type"         value={fmtType(event.eventType)} />
          <DetailRow label="Expected Attendees" value={event.expectedAttendees > 0 ? event.expectedAttendees.toLocaleString() : null} />
          <DetailRow label="Venue / Location"   value={event.locationSnapshot?.venueName !== 'TBD' ? event.locationSnapshot?.venueName : null} />
          <DetailRow label="Dress Code"         value={event.dressCode} />
        </div>
        {event.description && (
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${P.borderSub}` }}>
            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Description</p>
            <p style={{ margin: 0, fontSize: 14, color: P.sub, lineHeight: 1.7 }}>{event.description}</p>
          </div>
        )}
      </GlassPanel>

      {/* ══════════ REPORT SECTION ══════════ */}

      {/* Report header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '32px 0 0', animation: 'cardIn 0.3s ease 0.12s both' }}>
        <SectionHeading icon={icons.printer} style={{ margin: 0, flex: 1 }}>Event Report</SectionHeading>
        {report && (
          <button
            onClick={exportPDF}
            disabled={exporting}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', border: `1px solid ${P.blue}55`,
              background: P.blueGlow, color: P.blue, borderRadius: 9,
              fontSize: 12, fontWeight: 700, cursor: exporting ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', opacity: exporting ? 0.65 : 1,
              transition: 'opacity 0.15s', flexShrink: 0, marginLeft: 12,
            }}
          >
            {icons.printer} {exporting ? 'Generating…' : 'Export PDF'}
          </button>
        )}
      </div>

      {/* Report loading */}
      {repLoading && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ flex: 1, height: 72, background: P.surface, borderRadius: 12, border: `1px solid ${P.border}`, animation: `skpulse 1.4s infinite ${i * 0.1}s` }} />
            ))}
          </div>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 18, background: P.surface, borderRadius: 6, border: `1px solid ${P.border}`, marginBottom: 10, width: `${65 + (i % 3) * 12}%`, animation: `skpulse 1.4s infinite ${i * 0.14}s` }} />
          ))}
        </div>
      )}

      {/* Report error */}
      {!repLoading && repError && (
        <GlassPanel style={{ padding: '24px', textAlign: 'center', marginTop: 16, animation: 'cardIn 0.3s ease both' }}>
          <p style={{ color: P.sub, fontSize: 13, margin: '0 0 12px' }}>{repError}</p>
          <button
            onClick={loadReport}
            style={{ padding: '8px 18px', background: P.blueGlow, border: `1px solid ${P.blue}44`, color: P.blue, borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', fontSize: 13 }}
          >
            Retry
          </button>
        </GlassPanel>
      )}

      {/* Report content */}
      {!repLoading && !repError && report && (() => {
        const { budget, attendance, feedback, currency } = report;
        const overBudget = budget.difference < 0;
        return (
          <>
            {/* Costs */}
            <SectionHeading icon={icons.budget}>Costs &amp; Budget</SectionHeading>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              <StatCard label="Planned Total" value={fmt(budget.plannedTotal, currency)}                                                       delay={0.02} />
              <StatCard label="Actual Spend"  value={fmt(budget.actualTotal, currency)}                                                        delay={0.06} />
              <StatCard
                label="Difference"
                value={`${overBudget ? '−' : '+'}${fmt(Math.abs(budget.difference), currency)}`}
                sub={overBudget ? 'Over budget' : 'Under budget'}
                accent={overBudget ? P.red : P.teal}
                delay={0.10}
              />
            </div>
            {budget.categoryComparison?.length > 0 && (
              <GlassPanel style={{ padding: '0 0 2px', marginBottom: 8, animation: 'cardIn 0.32s ease 0.13s both' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${P.border}` }}>
                      {['Category', 'Planned', 'Actual', 'Δ'].map(h => (
                        <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {budget.categoryComparison.map((row, i) => (
                      <tr key={i} style={{ borderBottom: i < budget.categoryComparison.length - 1 ? `1px solid ${P.borderSub}` : 'none' }}>
                        <td style={{ padding: '9px 14px', color: P.text, fontWeight: 600 }}>{row.category}</td>
                        <td style={{ padding: '9px 14px', color: P.sub }}>{fmt(row.planned, currency)}</td>
                        <td style={{ padding: '9px 14px', color: P.sub }}>{fmt(row.actual, currency)}</td>
                        <td style={{ padding: '9px 14px', fontWeight: 700, color: row.difference >= 0 ? P.teal : P.red }}>
                          {row.difference >= 0 ? '+' : ''}{fmt(row.difference, currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </GlassPanel>
            )}
            {budget.categoryComparison?.length === 0 && (
              <p style={{ fontSize: 13, color: P.muted, margin: '0 0 8px' }}>No budget breakdown recorded.</p>
            )}

            {/* Attendance */}
            <SectionHeading icon={icons.guests}>Attendance</SectionHeading>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              <StatCard label="Total Invited"   value={attendance.totalGuests}     delay={0.02} />
              <StatCard label="Confirmed RSVP"  value={attendance.attendingGuests} delay={0.06} />
              <StatCard
                label="Checked In"
                value={attendance.checkedIn}
                sub={`${attendance.checkInRate}% of confirmed`}
                accent={attendance.checkInRate >= 70 ? P.teal : attendance.checkInRate >= 40 ? P.amber : P.rose}
                delay={0.10}
              />
              <StatCard label="Pending"  value={attendance.rsvpPending}  accent={P.muted} delay={0.14} />
              <StatCard label="Declined" value={attendance.rsvpDeclined} accent={P.muted} delay={0.18} />
            </div>
            {attendance.totalGuests > 0 && (
              <GlassPanel style={{ padding: '14px 18px', marginBottom: 8, animation: 'cardIn 0.32s ease 0.21s both' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>RSVP Breakdown</div>
                <div style={{ display: 'flex', height: 8, borderRadius: 99, overflow: 'hidden', gap: 2 }}>
                  {[
                    { val: attendance.attendingGuests, color: P.teal  },
                    { val: attendance.rsvpPending,     color: P.amber },
                    { val: attendance.rsvpDeclined,    color: P.rose  },
                  ].map((seg, i) => {
                    const w = attendance.totalGuests > 0 ? (seg.val / attendance.totalGuests) * 100 : 0;
                    return w > 0 ? <div key={i} style={{ width: `${w}%`, background: seg.color, borderRadius: 99 }} /> : null;
                  })}
                </div>
                <div style={{ display: 'flex', gap: 20, marginTop: 10, fontSize: 11, color: P.sub, flexWrap: 'wrap' }}>
                  <span><span style={{ color: P.teal,  fontWeight: 700 }}>■</span> Attending ({pct(attendance.attendingGuests, attendance.totalGuests)})</span>
                  <span><span style={{ color: P.amber, fontWeight: 700 }}>■</span> Pending ({pct(attendance.rsvpPending, attendance.totalGuests)})</span>
                  <span><span style={{ color: P.rose,  fontWeight: 700 }}>■</span> Declined ({pct(attendance.rsvpDeclined, attendance.totalGuests)})</span>
                </div>
              </GlassPanel>
            )}

            {/* Outcomes / Feedback */}
            <SectionHeading icon={icons.feedback}>Outcomes &amp; Feedback</SectionHeading>
            {feedback.count === 0 ? (
              <GlassPanel style={{ padding: '28px 24px', textAlign: 'center', animation: 'cardIn 0.32s ease 0.04s both' }}>
                <div style={{ color: P.muted, fontSize: 13 }}>No feedback has been collected yet.</div>
              </GlassPanel>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                  <StatCard
                    label="Overall Score"
                    value={feedback.averages?.overall != null ? `${score(feedback.averages.overall)} / 5` : '—'}
                    accent={P.amber} delay={0.02}
                  />
                  <StatCard
                    label="Responses"
                    value={feedback.count}
                    sub={`${feedback.responseRate}% response rate`}
                    delay={0.06}
                  />
                </div>
                <GlassPanel style={{ padding: '18px 22px', marginBottom: 10, animation: 'cardIn 0.32s ease 0.09s both' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>Category Scores</div>
                  {['experience', 'food', 'venue', 'organisation'].map(cat => (
                    <ScoreBar key={cat} label={cat} value={feedback.averages?.[cat]} />
                  ))}
                </GlassPanel>
                {feedback.distribution && (
                  <GlassPanel style={{ padding: '18px 22px', animation: 'cardIn 0.32s ease 0.12s both' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>Experience Distribution</div>
                    {[5, 4, 3, 2, 1].map(star => {
                      const count  = feedback.distribution[star] || 0;
                      const pctVal = feedback.count > 0 ? (count / feedback.count) * 100 : 0;
                      const accent = star >= 4 ? P.teal : star === 3 ? P.amber : P.rose;
                      return (
                        <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
                          <div style={{ width: 28, fontSize: 12, color: P.sub, textAlign: 'right', fontWeight: 600 }}>{star}★</div>
                          <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pctVal}%`, background: accent, borderRadius: 99, boxShadow: `0 0 4px ${accent}55` }} />
                          </div>
                          <div style={{ width: 22, fontSize: 12, color: P.text, fontWeight: 700 }}>{count}</div>
                        </div>
                      );
                    })}
                  </GlassPanel>
                )}
              </>
            )}
          </>
        );
      })()}

      {showEdit && (
        <SettingsModal event={event} onSave={onEventUpdate} onClose={() => setShowEdit(false)} />
      )}
    </div>
  );
}
