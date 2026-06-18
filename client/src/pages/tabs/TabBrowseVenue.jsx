import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { requestVenueBooking, searchVenues } from "../../services/serviceBrowseVenue.js";
import MiniCalendarSelect from '../../components/componentMiniCalendarSelect.jsx';
import MiniCalendar from '../../components/componentMiniCalendar.jsx';
import { OpalSelect, OpalMultiSelect } from "../../components/componentMenus.jsx";
import { P, icons, GlassPanel } from "../../components/componentTheme";
import '../../components/componentTheme.css';
import { fetchVenueAvailability } from "../../services/serviceReplyVenue.js";

const AMENITY_ICONS = {
  Parking: "P",
  "Outdoor Area": "O",
  Stage: "S",
  "Wi-Fi": "W",
  Catering: "C",
  "AV Equipment": "A",
  "Dressing Room": "D",
};

const EVENT_TYPES = ["wedding", "conference", "concert", "workshop", "corporate", "private_party", "other"];

function toDateKey(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatPrice(pricing = {}) {
  const amount = Number(pricing.basePrice ?? pricing.amount ?? 0);
  const currency = pricing.currency ?? "EGP";
  return `${amount.toLocaleString()} ${currency}`;
}

function isVenueAvailableOn(venue, dateStr) {
  if (!dateStr || !venue.bookedDates?.length) return true;
  const key = toDateKey(dateStr);
  return !venue.bookedDates.some((b) => toDateKey(b.date) === key);
}

// ─── Stat tile — matches TabDayOf StatCard ────────────────────────────────────
function StatCard({ label, value, color, sub, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '16px 18px',
        flex: '1 1 120px',
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
      <p style={{ margin: 0, fontSize: 28, fontWeight: 900, color, letterSpacing: '-0.04em', lineHeight: 1, fontFamily: 'var(--font-display)' }}>{value}</p>
      <p style={{ margin: '6px 0 0', fontSize: 11, fontWeight: 700, color: isActive ? color : P.text, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
      {sub && <p style={{ margin: '3px 0 0', fontSize: 11, color: isActive ? color : P.sub }}>{sub}</p>}
    </button>
  );
}

// ─── Amenity pill ─────────────────────────────────────────────────────────────
function AmenityPill({ label }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, color: P.blue,
      background: P.blueGlow, padding: '2px 9px', borderRadius: 99,
      border: `1px solid ${P.blue}22`,
      display: 'inline-flex', alignItems: 'center', gap: 4,
    }}>
      {label}
    </span>
  );
}

// ─── Venue Card ───────────────────────────────────────────────────────────────
function VenueCard({ venue, onViewDetails }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const photoUrl = venue.photos?.[0]?.url;
  const unit = venue.pricing?.pricingUnit?.replace("per_", "") ?? "event";

  return (
    <div
      style={{
        background: 'rgba(19,19,30,0.72)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid ${P.border}`,
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
        overflow: 'hidden',
        transition: 'transform 0.2s ease, border-color 0.2s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = P.indigo + '55';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = P.border;
      }}
    >
      {/* Photo */}
      <div style={{ position: 'relative', height: 180, flexShrink: 0, background: 'rgba(30,30,41,0.8)' }}>
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={venue.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.4s' }}
            onLoad={() => setImgLoaded(true)}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: P.muted }}>
            No photo
          </div>
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,20,0.72) 0%, transparent 55%)' }} />
        <div style={{
          position: 'absolute', bottom: 10, left: 12,
          background: 'rgba(10,10,15,0.7)', backdropFilter: 'blur(8px)',
          border: `1px solid ${P.border}`, color: P.text,
          fontSize: 13, fontWeight: 700, padding: '4px 10px', borderRadius: 8,
        }}>
          {formatPrice(venue.pricing)}
          <span style={{ fontWeight: 300, fontSize: 11, color: P.sub }}> / {unit}</span>
        </div>
      </div>

      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: P.text, fontFamily: 'var(--font-display)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {venue.name}
          </h3>
          <span style={{
            display: 'inline-block', padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 700,
            background: 'rgba(62,207,184,0.12)', color: P.teal,
            border: `1px solid ${P.teal}33`, flexShrink: 0, marginLeft: 8,
          }}>
            {venue.location?.city || 'Venue'}
          </span>
        </div>

        <div style={{ fontSize: 12, color: P.sub, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ color: P.muted, display: 'flex' }}>{icons.mapPin}</span>
          {[venue.location?.area, venue.location?.city].filter(Boolean).join(", ") || "Location TBD"}
        </div>

        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
          {(venue.amenities ?? []).slice(0, 4).map((a) => <AmenityPill key={a} label={a} />)}
          {(venue.amenities?.length ?? 0) > 4 && (
            <span style={{
              fontSize: 11, fontWeight: 600, color: P.indigo,
              background: `${P.indigo}15`, padding: '2px 9px', borderRadius: 99,
              border: `1px solid ${P.indigo}22`,
            }}>+{venue.amenities.length - 4}</span>
          )}
        </div>

        <div style={{ borderTop: `1px solid ${P.borderSub ?? P.border}`, paddingTop: 10, flex: 1, marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>Details</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: P.sub, marginBottom: 4 }}>
            <span style={{ color: P.text }}>Capacity</span>
            <span style={{ fontWeight: 700, color: P.text }}>{Number(venue.capacity ?? 0).toLocaleString()} <span style={{ color: P.muted, fontWeight: 400 }}>guests</span></span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: P.sub, marginBottom: 4 }}>
            <span style={{ color: P.text }}>Floor area</span>
            <span style={{ fontWeight: 700, color: P.text }}>{Number(venue.dimensionsSqm ?? 0).toLocaleString()} <span style={{ color: P.muted, fontWeight: 400 }}>sqm</span></span>
          </div>
          {venue.description && (
            <p style={{ fontSize: 12, color: P.sub, lineHeight: 1.5, margin: '8px 0 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {venue.description}
            </p>
          )}
        </div>

        <button
          onClick={() => onViewDetails(venue)}
          style={{
            width: '100%', padding: '9px 0', borderRadius: 9,
            border: `1px solid ${P.blue}55`,
            background: P.blueGlow,
            color: P.blue,
            fontSize: 13, fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = P.blue; e.currentTarget.style.color = '#0a0a12'; }}
          onMouseLeave={e => { e.currentTarget.style.background = P.blueGlow; e.currentTarget.style.color = P.blue; }}
        >
          View & Book
        </button>
      </div>
    </div>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function DetailModal({ venue, onClose, onBookingSent, eventId }) {
    const [form, setForm] = useState({
        eventType: "wedding",
        expectedAttendees: "",
        specialRequirements: "",
        proposedAmount: "",
        proposedCurrency: venue.pricing?.currency ?? "EGP",
    });
    const [selectedDates,  setSelectedDates]  = useState([]);
    const [submitting,     setSubmitting]     = useState(false);
    const [error,          setError]          = useState("");
    const [bookedDates,    setBookedDates]    = useState([]);
    const [loadingDates,   setLoadingDates]   = useState(true);
    const photoUrl = venue.photos?.[0]?.url;
    const unit = venue.pricing?.pricingUnit?.replace("per_", "") ?? "event";

    useEffect(() => {
        setLoadingDates(true);
        console.log('Fetching availability for venue:', venue._id);
        fetchVenueAvailability(venue._id)
            .then(data => {
                console.log('Availability data:', data);
                setBookedDates(data.bookedDates?.map(b => b.date) ?? []);
            })
            .catch(err => {
                console.error('Availability fetch failed:', err);
                setBookedDates([]);
            })
            .finally(() => setLoadingDates(false));
    }, [venue._id]);

    const inp = {
        width: '100%', padding: '9px 12px', borderRadius: 8,
        border: `1px solid ${P.border}`, background: 'rgba(30,30,41,0.8)',
        fontSize: 13, color: P.text, outline: 'none', boxSizing: 'border-box',
        fontFamily: 'inherit', transition: 'border-color 0.15s',
    };

    const updateField = (field, value) => { setError(""); setForm((prev) => ({ ...prev, [field]: value })); };
    const handleDatesChange = (dates) => { setError(""); setSelectedDates(dates); };

    const submitBooking = async (event) => {
        event.preventDefault();
        if (selectedDates.length === 0) { setError("Select at least one date."); return; }
        setSubmitting(true);
        setError("");
        try {
            await requestVenueBooking(venue._id, {
                eventId,
                eventType: form.eventType,
                requestedDates: selectedDates,
                expectedAttendees: Number(form.expectedAttendees),
                specialRequirements: form.specialRequirements.trim(),
                proposedAmount: form.proposedAmount ? Number(form.proposedAmount) : undefined,
                proposedCurrency: form.proposedCurrency.trim() || undefined,
            });
            onBookingSent("Booking request sent.");
            onClose();
        } catch (err) {
            setError(err.message || "Failed to send booking request.");
        } finally {
            setSubmitting(false);
        }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(10,10,20,0.75)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'rgba(14,14,22,0.96)',
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          border: `1px solid ${P.border}`,
          borderRadius: 16, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 24px 72px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.05)',
        }}
      >
        <div style={{ position: 'relative', height: 240, flexShrink: 0 }}>
          {photoUrl ? (
            <img src={photoUrl} alt={venue.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: '16px 16px 0 0' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'rgba(30,30,41,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: P.muted, borderRadius: '16px 16px 0 0' }}>Venue</div>
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,15,0.80) 0%, transparent 55%)', borderRadius: '16px 16px 0 0' }} />
          <button
            onClick={onClose}
            style={{ position: 'absolute', top: 14, right: 14, width: 30, height: 30, borderRadius: 8, background: 'rgba(10,10,15,0.6)', backdropFilter: 'blur(8px)', border: `1px solid ${P.border}`, color: P.muted, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 0.15s, color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = P.sub; e.currentTarget.style.color = P.text; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = P.border; e.currentTarget.style.color = P.muted; }}
          >
            {icons.x ?? '×'}
          </button>
          <div style={{ position: 'absolute', bottom: 16, left: 20, right: 20 }}>
            <p style={{ color: 'rgba(232,230,240,0.7)', fontSize: 11, margin: '0 0 4px', fontWeight: 500 }}>
              {[venue.location?.area, venue.location?.city].filter(Boolean).join(" — ")}
            </p>
            <h2 style={{ color: P.text, fontSize: 20, fontWeight: 700, margin: '0 0 4px', fontFamily: 'var(--font-display)', letterSpacing: -0.3 }}>{venue.name}</h2>
            <p style={{ color: P.text, fontSize: 16, fontWeight: 600, margin: 0 }}>
              {formatPrice(venue.pricing)} <span style={{ fontWeight: 300, fontSize: 13, color: P.sub }}>/ {unit}</span>
            </p>
          </div>
        </div>

        <div style={{ padding: '20px 24px 28px' }}>
          <div style={{
            background: 'rgba(255,255,255,0.04)', border: `1px solid ${P.border}`,
            borderRadius: 10, display: 'flex', marginBottom: 20,
          }}>
            {[
              { val: Number(venue.capacity ?? 0).toLocaleString(), label: 'Max guests' },
              { val: `${Number(venue.dimensionsSqm ?? 0).toLocaleString()} sqm`, label: 'Floor area' },
              { val: venue.amenities?.length ?? 0, label: 'Amenities' },
            ].map((s, i, arr) => (
              <div key={s.label} style={{ flex: 1, textAlign: 'center', padding: '12px 0', borderRight: i < arr.length - 1 ? `1px solid ${P.border}` : 'none' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: P.text, fontFamily: 'var(--font-display)' }}>{s.val}</div>
                <div style={{ fontSize: 11, color: P.muted, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {venue.description && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 7 }}>About this venue</div>
              <p style={{ fontSize: 13, color: P.sub, lineHeight: 1.6, margin: 0 }}>{venue.description}</p>
            </div>
          )}

          {(venue.amenities ?? []).length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 7 }}>Amenities</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(venue.amenities ?? []).map((a) => <AmenityPill key={a} label={a} />)}
              </div>
            </div>
          )}

        <div style={{ borderTop: `1px solid ${P.border}`, paddingTop: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 7 }}>Select date(s)</div>
            {loadingDates ? (
                <div style={{ fontSize: 13, color: P.muted, padding: '12px 0' }}>Loading availability…</div>
            ) : (
                  <MiniCalendarSelect
                      selectedDates={selectedDates}
                      onChange={handleDatesChange}
                      disabledDates={bookedDates}
                  />
            )}

            {selectedDates.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                    {selectedDates.map((d) => (
                        <span key={d} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 8px 4px 10px', borderRadius: 20, background: P.blue, color: '#0a0a12', fontSize: 12, fontWeight: 500 }}>
                            {new Date(`${d}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                            <button type="button" onClick={() => setSelectedDates((prev) => prev.filter((x) => x !== d))}
                                style={{ background: 'rgba(10,10,15,0.25)', border: 'none', color: '#0a0a12', borderRadius: '50%', width: 16, height: 16, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                ×
                            </button>
                        </span>
                    ))}
                </div>
            )}

            <div style={{ fontSize: 10, fontWeight: 700, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.09em', margin: '18px 0 10px', paddingTop: 14, borderTop: `1px solid ${P.border}` }}>
                Request Booking
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginBottom: 10 }}>
              <OpalSelect label="Event type" value={form.eventType} onChange={(v) => updateField("eventType", v)} options={EVENT_TYPES.map((t) => ({ value: t, label: t.replaceAll("_", " ") }))} accent="violet" />
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 600, color: P.sub }}>
                Expected attendees
                <input type="number" min="1" style={inp} value={form.expectedAttendees} onChange={(e) => updateField("expectedAttendees", e.target.value)} required
                  onFocus={e => e.target.style.borderColor = P.blue} onBlur={e => e.target.style.borderColor = P.border} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 600, color: P.sub }}>
                Proposed amount
                <input type="number" min="0" style={inp} value={form.proposedAmount} onChange={(e) => updateField("proposedAmount", e.target.value)} placeholder={String(venue.pricing?.basePrice ?? "")}
                  onFocus={e => e.target.style.borderColor = P.blue} onBlur={e => e.target.style.borderColor = P.border} />
              </label>
              <OpalSelect label="Currency" value={form.proposedCurrency} onChange={(v) => updateField("proposedCurrency", v)} options={["EGP", "USD", "EUR", "GBP", "SAR", "AED"]} accent="teal" />
            </div>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 600, color: P.sub, marginBottom: 14 }}>
              Special requirements
              <textarea style={{ ...inp, minHeight: 72, resize: 'vertical' }} value={form.specialRequirements} onChange={(e) => updateField("specialRequirements", e.target.value)} />
            </label>

            {error && (
              <div style={{ marginBottom: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: `1px solid ${P.red}33`, borderRadius: 8, fontSize: 13, color: P.red }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={onClose}
                style={{ padding: '9px 20px', borderRadius: 9, border: `1px solid ${P.border}`, background: 'transparent', fontSize: 13, fontWeight: 600, color: P.sub, cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = P.sub}
                onMouseLeave={e => e.currentTarget.style.borderColor = P.border}
              >
                Cancel
              </button>
              <button onClick={submitBooking} disabled={submitting}
                style={{
                  padding: '9px 24px', borderRadius: 9, border: 'none',
                  background: submitting ? 'rgba(255,255,255,0.08)' : `linear-gradient(135deg, ${P.blue} 0%, ${P.teal} 100%)`,
                  color: submitting ? P.muted : '#0a0a12',
                  fontSize: 13, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', transition: 'opacity 0.15s',
                }}
              >
                {submitting ? "Sending…" : "Send Booking Request"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Date filter popover ──────────────────────────────────────────────────────
function DateFilterPopover({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const label = value
    ? new Date(`${value}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "Any date";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 7, padding: "9px 14px",
          border: value ? `1px solid ${P.blue}55` : `1px solid ${P.border}`,
          borderRadius: 9, fontSize: 13,
          color: value ? P.text : P.muted,
          background: value ? P.blueGlow : 'rgba(30,30,41,0.7)',
          cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
          transition: 'all 0.15s',
        }}
      >
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0, color: value ? P.blue : P.muted }}>
          <rect x="1" y="2" width="11" height="10" rx="2" stroke="currentColor" strokeWidth="1.2" />
          <path d="M1 5h11" stroke="currentColor" strokeWidth="1.2" />
          <path d="M4 1v2M9 1v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        {label}
        {value && (
          <span onClick={(e) => { e.stopPropagation(); onChange(""); }} style={{ marginLeft: 2, opacity: 0.6, fontSize: 15, lineHeight: 1, cursor: "pointer" }}>×</span>
        )}
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 10000 }}>
            <MiniCalendar
                selectedDates={value ? [value] : []}
                onChange={(dates) => { const next = dates.find((d) => d !== value) ?? ""; onChange(next); setOpen(false); }}
            />
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function VenueDiscovery({ onNavigate, eventId }) {
  const navigate = useNavigate();
  const [venues,           setVenues]           = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [search,           setSearch]           = useState("");
  const [locationSearch,   setLocationSearch]   = useState("");
  const [dateFilter,       setDateFilter]       = useState("");
  const [amenityFilter,    setAmenityFilter]    = useState([]);
  const [sortBy,           setSortBy]           = useState("default");
  const [detailVenue,      setDetailVenue]      = useState(null);
  const [filtersExpanded,  setFiltersExpanded]  = useState(false);
  const [toast,            setToast]            = useState(null);
  const lastFetchedQuery = useRef(null);
  const requestId        = useRef(0);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  }, []);

  const loadVenues = useCallback(async (searchText) => {
    const normalizedSearch = searchText.trim();
    if (lastFetchedQuery.current === normalizedSearch) return;
    lastFetchedQuery.current = normalizedSearch;
    const currentRequestId = requestId.current + 1;
    requestId.current = currentRequestId;
    setLoading(true);
    try {
      const data = await searchVenues(normalizedSearch);
      if (requestId.current === currentRequestId) setVenues(Array.isArray(data) ? data : []);
    } catch {
      if (requestId.current === currentRequestId) showToast("Failed to load venues.", "error");
    } finally {
      if (requestId.current === currentRequestId) setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { loadVenues(""); }, [loadVenues]);
  useEffect(() => { const id = setTimeout(() => loadVenues(search), 800); return () => clearTimeout(id); }, [search, loadVenues]);

  const locationSuggestions = useMemo(() => {
    const set = new Set();
    venues.forEach((v) => {
      const { area, city } = v.location ?? {};
      if (area && city) set.add(`${area}, ${city}`);
      else if (city) set.add(city);
      else if (area) set.add(area);
    });
    return Array.from(set).sort();
  }, [venues]);

  const amenityOptions = useMemo(() => {
    const set = new Set();
    venues.forEach((v) => (v.amenities ?? []).forEach((a) => set.add(a)));
    return Array.from(set).sort();
  }, [venues]);

  const filtered = useMemo(() => {
    let list = venues.filter((v) => v.isActive !== false);
    if (locationSearch.trim()) {
      const q = locationSearch.trim().toLowerCase();
      list = list.filter((v) => {
        const loc = [v.location?.area, v.location?.city, v.location?.address].filter(Boolean).join(" ").toLowerCase();
        return loc.includes(q);
      });
    }
    if (dateFilter) list = list.filter((v) => isVenueAvailableOn(v, dateFilter));
    if (amenityFilter.length) list = list.filter((v) => amenityFilter.every((a) => (v.amenities ?? []).includes(a)));
    if (sortBy === "price_asc")  list = [...list].sort((a, b) => (a.pricing?.basePrice ?? 0) - (b.pricing?.basePrice ?? 0));
    if (sortBy === "price_desc") list = [...list].sort((a, b) => (b.pricing?.basePrice ?? 0) - (a.pricing?.basePrice ?? 0));
    if (sortBy === "capacity")   list = [...list].sort((a, b) => (b.capacity ?? 0) - (a.capacity ?? 0));
    return list;
  }, [venues, locationSearch, dateFilter, amenityFilter, sortBy]);

  // Derived stat counts
  const totalVenues    = venues.filter(v => v.isActive !== false).length;
  const availableToday = venues.filter(v => v.isActive !== false && isVenueAvailableOn(v, new Date().toISOString().slice(0, 10))).length;
  const avgCapacity    = totalVenues > 0
    ? Math.round(venues.reduce((sum, v) => sum + (v.capacity ?? 0), 0) / totalVenues)
    : 0;

  const activeFilterCount = [locationSearch.trim(), dateFilter, amenityFilter.length > 0].filter(Boolean).length;

  const SORT_OPTIONS = [
    { value: "default",    label: "Default" },
    { value: "price_asc",  label: "Price: Low → High" },
    { value: "price_desc", label: "Price: High → Low" },
    { value: "capacity",   label: "Capacity" },
  ];

  const inp = {
    width: '100%', padding: '9px 14px 9px 36px', borderRadius: 9,
    border: `1px solid ${P.border}`, background: 'rgba(30,30,41,0.7)',
    fontSize: 13, color: P.text, outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit', transition: 'border-color 0.15s',
  };

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'var(--font-body)', color: P.text, WebkitFontSmoothing: 'antialiased' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 18, right: 18, zIndex: 900,
          background: toast.type === 'error' ? 'rgba(239,68,68,0.12)' : 'rgba(30,30,41,0.9)',
          border: `1px solid ${toast.type === 'error' ? `${P.red}44` : P.border}`,
          color: toast.type === 'error' ? P.red : P.text,
          borderRadius: 10, padding: '10px 14px', fontSize: 13,
          boxShadow: '0 8px 26px rgba(0,0,0,0.35)', backdropFilter: 'blur(12px)',
        }}>
          {toast.message}
        </div>
      )}

      {/* ── Page header ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 0' }}>

        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{
              margin: 0, fontSize: 24, fontWeight: 800,
              color: P.text, letterSpacing: '-0.02em',
              display: 'flex', alignItems: 'center', gap: 10,
              fontFamily: 'var(--font-display)',
            }}>
              <span style={{
                color: P.blue,
                background: P.blueGlow,
                padding: 7, borderRadius: 9, display: 'flex', fontSize: 18,
              }}>
                🏛️
              </span>
              Browse Venues
            </h2>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: P.sub }}>
              Discover and book venues for your event
            </p>
          </div>

          {/* Back button — same ghost style as TabDayOf secondary buttons */}
          <button
            onClick={() => onNavigate?.('reply')}
            style={{
              padding: '8px 16px', borderRadius: 9,
              border: `1px solid ${P.border}`,
              background: 'transparent',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              color: P.text, transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = P.blueGlow; e.currentTarget.style.borderColor = `${P.blue}44`; e.currentTarget.style.color = P.blue; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = P.border; e.currentTarget.style.color = P.text; }}
          >
            ← My Bookings
          </button>
        </div>

        {/* ── Stat tiles ── */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
          <StatCard
            label="Total Venues"
            value={loading ? '—' : totalVenues}
            color={P.blue ?? 'var(--opal-blue)'}
            sub="in catalogue"
          />
          <StatCard
            label="Showing"
            value={loading ? '—' : filtered.length}
            color={P.violet ?? 'var(--opal-violet)'}
            sub={activeFilterCount > 0 ? `${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} active` : 'no filters'}
          />
          <StatCard
            label="Available Today"
            value={loading ? '—' : availableToday}
            color={P.teal ?? 'var(--opal-teal)'}
            sub="open for booking"
          />
          <StatCard
            label="Avg Capacity"
            value={loading ? '—' : avgCapacity.toLocaleString()}
            color={P.amber ?? 'var(--opal-amber)'}
            sub="guests"
          />
        </div>

        {/* ── Search + filter bar (now inside the content width) ── */}
        <div style={{ position: 'relative', zIndex: 100 }}>
          <GlassPanel style={{ padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Name search */}
              <div style={{ flex: '1 1 220px', position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: 12, fontSize: 14, pointerEvents: 'none', color: P.muted }}>⌕</span>
                <input style={inp} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search venues"
                  onFocus={e => e.target.style.borderColor = P.blue} onBlur={e => e.target.style.borderColor = P.border} />
                {search && <button style={{ position: 'absolute', right: 10, background: 'none', border: 'none', color: P.muted, fontSize: 16, cursor: 'pointer' }} onClick={() => setSearch("")}>×</button>}
              </div>

              {/* Location search */}
              <div style={{ flex: '1 1 180px', position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: 12, fontSize: 14, pointerEvents: 'none', color: P.muted }}>◎</span>
                <input style={inp} value={locationSearch} onChange={(e) => setLocationSearch(e.target.value)} placeholder="Area or city" list="location-suggestions"
                  onFocus={e => e.target.style.borderColor = P.blue} onBlur={e => e.target.style.borderColor = P.border} />
                {locationSearch && <button style={{ position: 'absolute', right: 10, background: 'none', border: 'none', color: P.muted, fontSize: 16, cursor: 'pointer' }} onClick={() => setLocationSearch("")}>×</button>}
                <datalist id="location-suggestions">{locationSuggestions.map((l) => <option key={l} value={l} />)}</datalist>
              </div>

              <DateFilterPopover value={dateFilter} onChange={setDateFilter} />

              {/* Filters toggle */}
              <button
                onClick={() => setFiltersExpanded((v) => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px',
                  border: filtersExpanded || activeFilterCount > 1 ? `1px solid ${P.blue}` : `1px solid ${P.border}`,
                  borderRadius: 9, fontSize: 13,
                  color: filtersExpanded || activeFilterCount > 1 ? '#0a0a12' : P.text,
                  background: filtersExpanded || activeFilterCount > 1 ? P.blue : 'rgba(30,30,41,0.7)',
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                }}
              >
                Filters {activeFilterCount > 0 && <span style={{ background: '#0a0a0f', color: P.blue, fontSize: 11, fontWeight: 700, borderRadius: 10, padding: '1px 6px' }}>{activeFilterCount}</span>}
              </button>

              <OpalSelect value={sortBy} onChange={setSortBy} options={SORT_OPTIONS} style={{ minWidth: 180 }} accent="violet" />
            </div>

            {filtersExpanded && (
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap', paddingTop: 14, marginTop: 14, borderTop: `1px solid ${P.border}` }}>
                {amenityOptions.length > 0 && (
                  <div style={{ flex: 1, minWidth: 260 }}>
                    <OpalMultiSelect label="Must-have amenities" value={amenityFilter} onChange={setAmenityFilter} options={amenityOptions} placeholder="Any amenities" accent="violet" />
                  </div>
                )}
                {activeFilterCount > 0 && (
                  <button
                    onClick={() => { setLocationSearch(""); setDateFilter(""); setAmenityFilter([]); }}
                    style={{ padding: '9px 16px', border: `1px solid ${P.red}44`, borderRadius: 9, fontSize: 13, color: P.red, background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', alignSelf: 'flex-end', height: 40, transition: 'border-color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = P.red}
                    onMouseLeave={e => e.currentTarget.style.borderColor = `${P.red}44`}
                  >
                    Clear all
                  </button>
                )}
              </div>
            )}
          </GlassPanel>
        </div>

        {/* Active filter pill */}
        {activeFilterCount > 0 && (
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: P.sub }}>Active filters</span>
            {locationSearch.trim() && (
              <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: 'rgba(255,255,255,0.06)', color: P.text, border: `1px solid ${P.border}` }}>
                📍 {locationSearch}
              </span>
            )}
            {dateFilter && (
              <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: 'rgba(255,255,255,0.06)', color: P.text, border: `1px solid ${P.border}` }}>
                📅 {new Date(`${dateFilter}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              </span>
            )}
            {amenityFilter.length > 0 && (
              <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: 'rgba(255,255,255,0.06)', color: P.text, border: `1px solid ${P.border}` }}>
                ✦ {amenityFilter.length} amenit{amenityFilter.length > 1 ? 'ies' : 'y'}
              </span>
            )}
            <button
              onClick={() => { setLocationSearch(""); setDateFilter(""); setAmenityFilter([]); }}
              style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: 'transparent', border: `1px solid ${P.border}`, color: P.sub, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = P.rose ?? P.red; e.currentTarget.style.borderColor = P.rose ?? P.red; }}
              onMouseLeave={e => { e.currentTarget.style.color = P.sub; e.currentTarget.style.borderColor = P.border; }}
            >
              ✕ Clear all
            </button>
          </div>
        )}
      </div>

      {/* ── Results grid ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 40px' }}>
        {!loading && filtered.length === 0 ? (
          <GlassPanel style={{ textAlign: 'center', padding: '64px 24px' }}>
            <p style={{ fontSize: 36, margin: 0, color: P.muted, opacity: 0.4 }}>⌀</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: P.text, margin: '12px 0 6px', fontFamily: 'var(--font-display)' }}>No venues match your criteria</p>
            <p style={{ fontSize: 14, color: P.sub, marginBottom: 20 }}>Try adjusting your filters or choosing a different date.</p>
            <button
              onClick={() => { setSearch(""); setLocationSearch(""); setDateFilter(""); setAmenityFilter([]); }}
              style={{ padding: '10px 24px', background: P.blue, color: '#0a0a12', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Clear all filters
            </button>
          </GlassPanel>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 14,
          }}>
            {loading
              ? [1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} style={{ height: 380, background: 'rgba(19,19,30,0.72)', border: `1px solid ${P.border}`, borderRadius: 12, animation: `skpulse 1.4s infinite ${i * 0.1}s` }} />
                ))
              : filtered.map((v, i) => (
                  <div key={v._id} style={{ animation: `cardIn 0.3s ease ${i * 0.05}s both` }}>
                    <VenueCard venue={v} onViewDetails={setDetailVenue} />
                  </div>
                ))
            }
          </div>
        )}
      </div>

      {detailVenue && (
        <DetailModal venue={detailVenue} onClose={() => setDetailVenue(null)} onBookingSent={showToast} eventId={eventId} />
      )}

      <style>{`
        @keyframes cardIn  { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes skpulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}