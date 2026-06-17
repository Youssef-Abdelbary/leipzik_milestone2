import { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { apiFetch } from '../../utils/apiFetch';
import { P, GlassPanel, icons } from '../../components/componentTheme';
import '../../components/componentTheme.css';

const fmt   = (n, cur = 'EGP') => `${cur} ${Number(n || 0).toLocaleString()}`;
const pct   = (num, den)        => (den > 0 ? `${Math.round((num / den) * 100)}%` : '0%');
const score = (v)               => (v != null ? v.toFixed(1) : '—');

// ── Sub-components ──────────────────────────────────────────────────────────

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

function SectionHeading({ children, icon, delay = 0 }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      margin: '28px 0 14px',
      animation: `cardIn 0.3s ease ${delay}s both`,
    }}>
      {icon && <span style={{ color: P.muted, display: 'flex' }}>{icon}</span>}
      <h2 style={{ margin: 0, fontSize: 11, fontWeight: 800, color: P.sub, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {children}
      </h2>
      <div style={{ flex: 1, height: 1, background: P.borderSub }} />
    </div>
  );
}

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
          boxShadow: `0 0 6px ${accent}66`,
          transition: 'width 0.5s ease',
        }} />
      </div>
      <div style={{ width: 32, fontSize: 13, fontWeight: 800, color: accent, textAlign: 'right', letterSpacing: '-0.02em', fontFamily: 'var(--font-display)' }}>
        {score(value)}
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function TabReports({ eventId }) {
  const [report,    setReport]    = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    apiFetch(`/events/${eventId}/report`)
      .then(data => setReport(data))
      .catch(err => setError(err.message || 'Failed to load report'))
      .finally(() => setLoading(false));
  }, [eventId]);

  function exportPDF() {
    if (!report) return;
    setExporting(true);
    try {
      const doc      = new jsPDF({ unit: 'pt', format: 'a4' });
      const W        = doc.internal.pageSize.getWidth();
      const margin   = 48;
      let   y        = 56;
      const currency = report.currency || 'EGP';

      const lineH      = (h = 14) => { y += h; };
      const checkPage  = (need = 40) => {
        if (y + need > doc.internal.pageSize.getHeight() - 48) {
          doc.addPage(); y = 48;
        }
      };

      // ── Cover ────────────────────────────────────────────────────────────
      doc.setFontSize(22); doc.setFont('helvetica', 'bold');
      doc.text(`Event Report: ${report.eventTitle || 'Untitled'}`, margin, y);
      lineH(24);

      doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      doc.setTextColor(120);
      const dateStr = report.eventDate
        ? new Date(report.eventDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
        : '';
      doc.text(`${dateStr}  ·  Status: ${report.eventStatus || '—'}  ·  Generated: ${new Date().toLocaleDateString()}`, margin, y);
      doc.setTextColor(0);
      lineH(32);

      // ── Budget ───────────────────────────────────────────────────────────
      doc.setFontSize(13); doc.setFont('helvetica', 'bold');
      doc.text('Costs & Budget', margin, y); lineH(18);
      doc.setFontSize(10); doc.setFont('helvetica', 'normal');

      const b = report.budget;
      doc.text(`Planned Total:  ${fmt(b.plannedTotal, currency)}`, margin, y); lineH(14);
      doc.text(`Actual Spend:   ${fmt(b.actualTotal, currency)}`, margin, y); lineH(14);
      const diff = b.difference;
      doc.text(`Difference:     ${diff >= 0 ? '+' : ''}${fmt(diff, currency)} (${diff >= 0 ? 'Under budget' : 'Over budget'})`, margin, y);
      lineH(20);

      if (b.categoryComparison?.length) {
        doc.setFontSize(10); doc.setFont('helvetica', 'bold');
        doc.text('Category', margin, y);
        doc.text('Planned',  margin + 200, y);
        doc.text('Actual',   margin + 290, y);
        doc.text('Δ',        margin + 375, y);
        lineH(4);
        doc.setDrawColor(200); doc.line(margin, y, W - margin, y); lineH(12);
        doc.setFont('helvetica', 'normal');
        b.categoryComparison.forEach(row => {
          checkPage();
          doc.text(row.category, margin, y);
          doc.text(fmt(row.planned, currency), margin + 200, y);
          doc.text(fmt(row.actual,  currency), margin + 290, y);
          const d = row.difference;
          doc.setTextColor(d >= 0 ? 0 : 180, d >= 0 ? 120 : 0, 0);
          doc.text(`${d >= 0 ? '+' : ''}${fmt(d, currency)}`, margin + 375, y);
          doc.setTextColor(0);
          lineH(14);
        });
      }

      // ── Attendance ───────────────────────────────────────────────────────
      checkPage(100);
      lineH(14);
      doc.setFontSize(13); doc.setFont('helvetica', 'bold');
      doc.text('Attendance', margin, y); lineH(18);
      doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      const a = report.attendance;
      doc.text(`Total Invited:    ${a.totalGuests}`,                          margin, y); lineH(14);
      doc.text(`RSVPd Attending:  ${a.attendingGuests}`,                      margin, y); lineH(14);
      doc.text(`Checked In:       ${a.checkedIn} (${a.checkInRate}%)`,        margin, y); lineH(14);
      doc.text(`RSVP Pending:     ${a.rsvpPending}`,                          margin, y); lineH(14);
      doc.text(`RSVP Declined:    ${a.rsvpDeclined}`,                         margin, y); lineH(22);

      // ── Feedback ─────────────────────────────────────────────────────────
      checkPage(80);
      doc.setFontSize(13); doc.setFont('helvetica', 'bold');
      doc.text('Outcomes & Feedback', margin, y); lineH(18);
      doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      const fb = report.feedback;
      doc.text(`Responses: ${fb.count} / ${a.attendingGuests} (${fb.responseRate}%)`, margin, y); lineH(14);
      if (fb.averages) {
        const avg = fb.averages;
        doc.text(`Overall Score: ${avg.overall ?? '—'} / 5`, margin, y); lineH(14);
        ['experience', 'food', 'venue', 'organisation'].forEach(cat => {
          checkPage();
          doc.text(`  ${cat.charAt(0).toUpperCase() + cat.slice(1)}: ${avg[cat] ?? '—'} / 5`, margin, y); lineH(13);
        });
      } else {
        doc.text('No feedback collected yet.', margin, y); lineH(14);
      }

      // Footer
      const pages = doc.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFontSize(8); doc.setTextColor(160);
        doc.text(`Page ${i} of ${pages}  ·  Generated ${new Date().toLocaleDateString()}`, margin, doc.internal.pageSize.getHeight() - 24);
        doc.setTextColor(0);
      }

      doc.save(`Report_${(report.eventTitle || 'event').replace(/\s+/g, '_')}.pdf`);
    } finally {
      setExporting(false);
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ padding: '28px 28px 48px', maxWidth: 880, margin: '0 auto' }}>
        <style>{`@keyframes skpulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ flex: 1, height: 80, background: P.surface, borderRadius: 12, border: `1px solid ${P.border}`, animation: `skpulse 1.4s infinite ${i * 0.1}s` }} />
          ))}
        </div>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ height: 20, background: P.surface, borderRadius: 6, border: `1px solid ${P.border}`, marginBottom: 10, width: `${70 + (i % 3) * 10}%`, animation: `skpulse 1.4s infinite ${i * 0.14}s` }} />
        ))}
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ padding: '40px 28px' }}>
        <GlassPanel style={{ padding: 36, textAlign: 'center', maxWidth: 500, margin: '0 auto' }}>
          <div style={{ color: P.red, display: 'flex', justifyContent: 'center', transform: 'scale(1.5)', marginBottom: 16 }}>{icons.warning}</div>
          <p style={{ color: P.text, fontSize: 16, fontWeight: 700, margin: '0 0 8px', fontFamily: 'var(--font-display)' }}>Report unavailable</p>
          <p style={{ color: P.sub, fontSize: 13, margin: '0 0 20px', lineHeight: 1.6 }}>{error}</p>
          <button
            onClick={() => {
              setError(null); setLoading(true);
              apiFetch(`/events/${eventId}/report`)
                .then(data => setReport(data))
                .catch(err => setError(err.message || 'Failed to load report'))
                .finally(() => setLoading(false));
            }}
            style={{ padding: '9px 22px', background: P.blueGlow, border: `1px solid ${P.blue}55`, color: P.blue, borderRadius: 9, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', fontSize: 13 }}
          >
            Retry
          </button>
        </GlassPanel>
      </div>
    );
  }

  if (!report) return null;

  const { budget, attendance, feedback, currency } = report;
  const overBudget = budget.difference < 0;

  return (
    <div style={{ padding: '24px 28px 60px', maxWidth: 880, margin: '0 auto' }}>
      <style>{`
        @keyframes pageIn { from{opacity:0} to{opacity:1} }
        @keyframes cardIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* ── Top bar ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12, animation: 'cardIn 0.3s ease both' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: P.text, letterSpacing: '-0.03em', fontFamily: 'var(--font-display)' }}>
            Event Report
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: P.sub }}>
            Costs · Attendance · Outcomes
            {report.eventDate && ` · ${new Date(report.eventDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
          </p>
        </div>
        <button
          onClick={exportPDF}
          disabled={exporting}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '9px 18px', border: `1px solid ${P.blue}55`,
            background: P.blueGlow, color: P.blue, borderRadius: 9,
            fontSize: 13, fontWeight: 700, cursor: exporting ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', opacity: exporting ? 0.65 : 1,
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => { if (!exporting) e.currentTarget.style.opacity = '0.8'; }}
          onMouseLeave={e => e.currentTarget.style.opacity = exporting ? '0.65' : '1'}
        >
          {icons.printer} {exporting ? 'Generating…' : 'Export PDF'}
        </button>
      </div>

      {/* ══ SECTION 1: Costs ══════════════════════════════════════════════════ */}
      <SectionHeading icon={icons.budget} delay={0.04}>Costs &amp; Budget</SectionHeading>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <StatCard label="Planned Total"  value={fmt(budget.plannedTotal, currency)}           delay={0.07} />
        <StatCard label="Actual Spend"   value={fmt(budget.actualTotal, currency)}            delay={0.11} />
        <StatCard
          label="Difference"
          value={`${overBudget ? '−' : '+'}${fmt(Math.abs(budget.difference), currency)}`}
          sub={overBudget ? 'Over budget' : 'Under budget'}
          accent={overBudget ? P.red : P.teal}
          delay={0.15}
        />
      </div>

      {budget.categoryComparison?.length > 0 && (
        <GlassPanel style={{ padding: '0 0 2px', marginBottom: 6, animation: 'cardIn 0.32s ease 0.18s both' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${P.border}` }}>
                {['Category', 'Planned', 'Actual', 'Δ'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {budget.categoryComparison.map((row, i) => (
                <tr key={i} style={{ borderBottom: i < budget.categoryComparison.length - 1 ? `1px solid ${P.borderSub}` : 'none' }}>
                  <td style={{ padding: '10px 16px', color: P.text, fontWeight: 600 }}>{row.category}</td>
                  <td style={{ padding: '10px 16px', color: P.sub }}>{fmt(row.planned, currency)}</td>
                  <td style={{ padding: '10px 16px', color: P.sub }}>{fmt(row.actual, currency)}</td>
                  <td style={{ padding: '10px 16px', fontWeight: 700, color: row.difference >= 0 ? P.teal : P.red }}>
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

      {/* ══ SECTION 2: Attendance ══════════════════════════════════════════ */}
      <SectionHeading icon={icons.guests} delay={0.22}>Attendance</SectionHeading>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <StatCard label="Total Invited"   value={attendance.totalGuests}    delay={0.25} />
        <StatCard label="Confirmed RSVP"  value={attendance.attendingGuests} delay={0.29} />
        <StatCard
          label="Checked In"
          value={attendance.checkedIn}
          sub={`${attendance.checkInRate}% of confirmed`}
          accent={attendance.checkInRate >= 70 ? P.teal : attendance.checkInRate >= 40 ? P.amber : P.rose}
          delay={0.33}
        />
        <StatCard label="Pending"  value={attendance.rsvpPending}  accent={P.muted} delay={0.37} />
        <StatCard label="Declined" value={attendance.rsvpDeclined} accent={P.muted} delay={0.41} />
      </div>

      {attendance.totalGuests > 0 && (
        <GlassPanel style={{ padding: '14px 18px', marginBottom: 6, animation: 'cardIn 0.32s ease 0.44s both' }}>
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

      {/* ══ SECTION 3: Feedback ═══════════════════════════════════════════ */}
      <SectionHeading icon={icons.feedback} delay={0.48}>Outcomes &amp; Feedback</SectionHeading>

      {feedback.count === 0 ? (
        <GlassPanel style={{ padding: '32px 24px', textAlign: 'center', animation: 'cardIn 0.32s ease 0.5s both' }}>
          <div style={{ color: P.muted, fontSize: 13 }}>No feedback has been collected yet.</div>
        </GlassPanel>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
            <StatCard
              label="Overall Score"
              value={feedback.averages?.overall != null ? `${score(feedback.averages.overall)} / 5` : '—'}
              accent={P.amber}
              delay={0.51}
            />
            <StatCard
              label="Responses"
              value={feedback.count}
              sub={`${feedback.responseRate}% response rate`}
              delay={0.55}
            />
          </div>

          <GlassPanel style={{ padding: '18px 22px', marginBottom: 10, animation: 'cardIn 0.32s ease 0.58s both' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>
              Category Scores
            </div>
            {['experience', 'food', 'venue', 'organisation'].map(cat => (
              <ScoreBar key={cat} label={cat} value={feedback.averages?.[cat]} />
            ))}
          </GlassPanel>

          {feedback.distribution && (
            <GlassPanel style={{ padding: '18px 22px', animation: 'cardIn 0.32s ease 0.62s both' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>
                Experience Rating Distribution
              </div>
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
    </div>
  );
}
