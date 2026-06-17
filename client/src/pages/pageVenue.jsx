import { useState, useEffect, useMemo, useRef } from "react";
import {
  getMyVenues,
  createVenue,
  updateVenue,
  deleteVenue,
  deactivateVenue,
} from "../services/serviceVenue";
import {
  VscHome, VscMail, VscCalendar, VscBell, VscPerson,
} from 'react-icons/vsc';
import { getConfirmedBookings } from "../services/serviceBookingCalendar";
import MiniCalendar from "../components/componentMiniCalendar.jsx";
import { OpalSelect } from "../components/componentMenus.jsx";
import Dock from "../components/componentDock.jsx";
import AppHeader from "../components/componentAppHeader.jsx";
import { useNavigate } from "react-router-dom";
import "../components/componentTheme.css";

// ─── Constants ────────────────────────────────────────────────────────────────

const AMENITY_OPTIONS = [
  "Parking", "Outdoor Area", "Stage", "Wi-Fi", "Catering", "AV Equipment", "Dressing Room",
];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const DOCK_HEIGHT = 120;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const pad = n => String(n).padStart(2, "0");
const dateKey = d => { const dt = new Date(d); return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`; };
const toKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}
function formatPrice(pricing = {}) {
  const amount = Number(pricing.basePrice ?? pricing.amount ?? 0);
  return `${amount.toLocaleString()} ${pricing.currency ?? "EGP"}`;
}

// ─── Glass primitive ──────────────────────────────────────────────────────────

function GlassPanel({ children, style = {}, ...rest }) {
  return (
    <div {...rest} style={{
      background: "rgba(30,30,41,0.55)",
      backdropFilter: "blur(18px) saturate(140%)",
      WebkitBackdropFilter: "blur(18px) saturate(140%)",
      border: "1px solid var(--opal-border,rgba(255,255,255,0.08))",
      borderRadius: 16,
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionLabel({ children, style = {} }) {
  return (
    <p style={{
      fontSize: 10, fontWeight: 700, letterSpacing: 0.9, textTransform: "uppercase",
      color: "var(--opal-violet,#7c5cfc)", margin: "0 0 10px",
      fontFamily: "var(--font-body,system-ui)",
      ...style,
    }}>
      {children}
    </p>
  );
}

function Avatar({ name = "?", size = 34 }) {
  const initials = (name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: size / 2.8,
      background: "linear-gradient(135deg, var(--opal-violet,#7c5cfc) 0%, var(--opal-teal,#4fd1c5) 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.33, fontWeight: 700, color: "#0a0a0f", flexShrink: 0,
      letterSpacing: -0.3, fontFamily: "var(--font-display,system-ui)",
    }}>
      {initials}
    </div>
  );
}

// ─── Date filter popover ──────────────────────────────────────────────────────

function DateFilterPopover({ value, onChange, label }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const display = value
    ? new Date(`${value}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "Any date";

  return (
    <div ref={ref} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {label && <SectionLabel style={{ marginBottom: 5 }}>{label}</SectionLabel>}
      <div style={{ position: "relative" }}>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          style={{
            ...css.filterControl,
            color: value ? "var(--opal-text,#e8e6f0)" : "var(--opal-muted,rgba(232,230,240,0.35))",
            background: value ? "var(--opal-violet-dim,rgba(124,92,252,0.12))" : "rgba(21,21,29,0.7)",
            border: value ? "1px solid rgba(124,92,252,0.4)" : "1px solid var(--opal-border,rgba(255,255,255,0.08))",
            display: "flex", alignItems: "center", gap: 7, whiteSpace: "nowrap",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0, color: value ? "var(--opal-violet,#7c5cfc)" : "var(--opal-muted,rgba(232,230,240,0.35))" }}>
            <rect x="1" y="2" width="11" height="10" rx="2" stroke="currentColor" strokeWidth="1.2" />
            <path d="M1 5h11" stroke="currentColor" strokeWidth="1.2" />
            <path d="M4 1v2M9 1v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          {display}
          {value && (
            <span onClick={e => { e.stopPropagation(); onChange(""); }}
              style={{ marginLeft: 2, opacity: 0.6, fontSize: 14, lineHeight: 1, cursor: "pointer" }}>×</span>
          )}
        </button>
        {open && (
          <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 600 }}>
            <MiniCalendar
              selectedDates={value ? [value] : []}
              onChange={dates => {
                const next = dates.find(d => d !== value) ?? "";
                onChange(next);
                setOpen(false);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Confirmed Bookings section ───────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Pending" },
  { value: "declined", label: "Declined" },
  { value: "countered", label: "Countered" },
];

function ConfirmedBookingsSection() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ venueId: "", status: "approved", startDate: "", endDate: "" });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(null);
    getConfirmedBookings(filters)
      .then(res => { if (!cancelled) setBookings(res.data || []); })
      .catch(err => { if (!cancelled) setError(err.message || "Failed to load bookings"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [filters]);

  const venueOptions = useMemo(() => {
    const map = new Map();
    bookings.forEach(b => { if (b.venueId?._id) map.set(b.venueId._id, b.venueId.name); });
    return [
      { value: "", label: "All venues" },
      ...Array.from(map.entries()).map(([id, name]) => ({ value: id, label: name })),
    ];
  }, [bookings]);

  const bookingsByDate = useMemo(() => {
    const map = new Map();
    bookings.forEach(b => {
      (b.requestedDates || []).forEach(d => {
        const k = dateKey(d);
        if (!map.has(k)) map.set(k, []);
        map.get(k).push(b);
      });
    });
    return map;
  }, [bookings]);

  const selectedKeys = useMemo(() => {
    if (!selectedBooking) return new Set();
    return new Set((selectedBooking.requestedDates || []).map(d => dateKey(d)));
  }, [selectedBooking]);

  const bookedDatesList = useMemo(() => Array.from(bookingsByDate.keys()), [bookingsByDate]);
  const selectedDatesList = useMemo(() => Array.from(selectedKeys), [selectedKeys]);

  const handleSelectBooking = b => {
    setSelectedBooking(b);
    const d = new Date(b.requestedDates[0]);
    setCurrentMonth(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)));
  };

  const hasActiveFilters = filters.venueId || filters.startDate || filters.endDate || filters.status !== "approved";

  return (
    <div>
      {/* ── Filters bar ── */}
      <GlassPanel style={{ padding: "14px 18px", marginBottom: 16, position: "relative", zIndex: 10 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <SectionLabel style={{ marginBottom: 5 }}>Venue</SectionLabel>
            <OpalSelect
              value={filters.venueId}
              onChange={v => setFilters(f => ({ ...f, venueId: v }))}
              options={venueOptions}
              accent="violet"
              style={{ minWidth: 160 }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <SectionLabel style={{ marginBottom: 5 }}>Status</SectionLabel>
            <OpalSelect
              value={filters.status}
              onChange={v => setFilters(f => ({ ...f, status: v }))}
              options={STATUS_OPTIONS}
              accent="teal"
              style={{ minWidth: 140 }}
            />
          </div>
          <DateFilterPopover label="From" value={filters.startDate} onChange={v => setFilters(f => ({ ...f, startDate: v }))} />
          <DateFilterPopover label="To" value={filters.endDate} onChange={v => setFilters(f => ({ ...f, endDate: v }))} />
          {hasActiveFilters && (
            <button
              onClick={() => setFilters({ venueId: "", status: "approved", startDate: "", endDate: "" })}
              style={{ ...css.filterControl, color: "var(--opal-red,#ff5c66)", border: "1px solid rgba(255,92,102,0.28)", background: "transparent", alignSelf: "flex-end" }}
            >
              Clear filters
            </button>
          )}
        </div>
      </GlassPanel>

      {/* ── Three-column row: calendar | bookings list | organizer detail ── */}
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 1fr", gap: 16, alignItems: "stretch" }}>

        {/* Col 1 — MiniCalendar */}
        <GlassPanel style={{ padding: "18px 20px", display: "flex", flexDirection: "column" }}>
          <SectionLabel>Calendar</SectionLabel>
          <MiniCalendarControlled
            currentMonth={currentMonth}
            onChangeMonth={setCurrentMonth}
            bookedDates={bookedDatesList}
            selectedDates={selectedDatesList}
            onDayClick={key => {
              const dayBookings = bookingsByDate.get(key);
              if (dayBookings?.length) handleSelectBooking(dayBookings[0]);
            }}
          />
          <div style={{ display: "flex", gap: 14, marginTop: 14, fontSize: 11, color: "var(--opal-muted,rgba(232,230,240,0.35))" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--opal-red,#ff5c66)", display: "inline-block" }} /> Booked
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--opal-teal,#4fd1c5)", display: "inline-block" }} /> Selected
            </span>
          </div>
        </GlassPanel>

        {/* Col 2 — Bookings list */}
        <GlassPanel style={{ padding: "18px 20px", display: "flex", flexDirection: "column", minHeight: 0 }}>
          <SectionLabel>Bookings{bookings.length > 0 && ` (${bookings.length})`}</SectionLabel>
          {loading && <p style={{ margin: 0, fontSize: 13, color: "var(--opal-muted,rgba(232,230,240,0.35))" }}>Loading…</p>}
          {error && <p style={{ margin: 0, fontSize: 13, color: "var(--opal-red,#ff5c66)" }}>{error}</p>}
          {!loading && !error && bookings.length === 0 && (
            <p style={{ margin: 0, fontSize: 13, color: "var(--opal-muted,rgba(232,230,240,0.35))" }}>No bookings match these filters.</p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, overflowY: "auto", flex: 1 }}>
            {bookings.map(b => {
              const isSel = selectedBooking?._id === b._id;
              return (
                <button key={b._id} onClick={() => handleSelectBooking(b)} style={{
                  textAlign: "left",
                  background: isSel ? "rgba(79,209,197,0.1)" : "rgba(21,21,29,0.6)",
                  border: `1px solid ${isSel ? "rgba(79,209,197,0.4)" : "var(--opal-border,rgba(255,255,255,0.08))"}`,
                  borderRadius: 10, padding: "10px 12px", cursor: "pointer",
                  fontFamily: "var(--font-body,system-ui)", color: "var(--opal-text,#e8e6f0)",
                  transition: "background 0.12s, border-color 0.12s", flexShrink: 0,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{b.venueId?.name || "Venue"}</div>
                  <div style={{ fontSize: 11, color: "var(--opal-sub,rgba(232,230,240,0.55))", marginTop: 3 }}>
                    {fmtDate(b.requestedDates?.[0])} · {b.organizerId?.fullname || "Organizer"}
                  </div>
                </button>
              );
            })}
          </div>
        </GlassPanel>

        {/* Col 3 — Organizer detail */}
        <GlassPanel style={{ padding: "18px 20px", display: "flex", flexDirection: "column" }}>
          <SectionLabel>Organizer Details</SectionLabel>
          {!selectedBooking ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <span style={{ fontSize: 24, opacity: 0.25 }}>👤</span>
              <p style={{ margin: 0, fontSize: 13, color: "var(--opal-muted,rgba(232,230,240,0.35))", textAlign: "center" }}>
                Select a booking to view organizer details.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar name={selectedBooking.organizerId?.fullname} size={36} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--opal-text,#e8e6f0)" }}>
                    {selectedBooking.organizerId?.fullname}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--opal-sub,rgba(232,230,240,0.55))", marginTop: 2 }}>
                    {selectedBooking.organizerId?.email}
                  </div>
                </div>
              </div>
              {selectedBooking.organizerId?.phone && (
                <div style={{ fontSize: 12, color: "var(--opal-sub,rgba(232,230,240,0.55))" }}>
                  📞 {selectedBooking.organizerId.phone}
                </div>
              )}
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                <span style={css.chipAmber}>{selectedBooking.eventType}</span>
                {selectedBooking.expectedAttendees && (
                  <span style={css.chipMuted}>{selectedBooking.expectedAttendees} guests</span>
                )}
              </div>
              {selectedBooking.specialRequirements && (
                <div style={{ fontSize: 12, color: "var(--opal-sub,rgba(232,230,240,0.55))", fontStyle: "italic", lineHeight: 1.5 }}>
                  "{selectedBooking.specialRequirements}"
                </div>
              )}
              <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid var(--opal-border,rgba(255,255,255,0.08))", fontSize: 12, color: "var(--opal-muted,rgba(232,230,240,0.35))", lineHeight: 1.6 }}>
                <div>{selectedBooking.venueId?.name}</div>
                <div>{selectedBooking.requestedDates.map(d => fmtDate(d)).join(", ")}</div>
                {selectedBooking.proposedPrice?.amount && (
                  <div>{selectedBooking.proposedPrice.amount} {selectedBooking.proposedPrice.currency}</div>
                )}
              </div>
            </div>
          )}
        </GlassPanel>

      </div>
    </div>
  );
}

// ─── Controlled MiniCalendar ──────────────────────────────────────────────────

function MiniCalendarControlled({ currentMonth, onChangeMonth, bookedDates, selectedDates, onDayClick }) {
  const year = currentMonth.getUTCFullYear();
  const month = currentMonth.getUTCMonth();
  const monthLabel = new Date(Date.UTC(year, month, 1))
    .toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

  const firstDow = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const bookedSet = new Set(bookedDates);
  const selectedSet = new Set(selectedDates);
  const todayKey = (() => { const t = new Date(); return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`; })();

  const NAV_BTN = {
    width: 24, height: 24, borderRadius: 6,
    border: "1px solid var(--opal-border,rgba(255,255,255,0.08))",
    background: "rgba(30,30,41,0.8)", color: "var(--opal-sub,rgba(232,230,240,0.55))",
    fontSize: 14, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "var(--font-body,system-ui)", lineHeight: 1, padding: 0, flexShrink: 0,
  };

  return (
    <div style={{ userSelect: "none" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <button style={NAV_BTN} onClick={() => onChangeMonth(new Date(Date.UTC(year, month - 1, 1)))}>‹</button>
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--opal-text,#e8e6f0)", minWidth: 90, textAlign: "center" }}>{monthLabel}</span>
        <button style={NAV_BTN} onClick={() => onChangeMonth(new Date(Date.UTC(year, month + 1, 1)))}>›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 2 }}>
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} style={{ textAlign: "center", fontSize: 9, fontWeight: 700, color: "var(--opal-muted,rgba(232,230,240,0.35))", letterSpacing: 0.4 }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`b-${i}`} />;
          const key = `${year}-${pad(month + 1)}-${pad(day)}`;
          const isPast = key < todayKey;
          const isBooked = bookedSet.has(key);
          const isSel = selectedSet.has(key);
          let bg = "transparent", color = isPast ? "rgba(255,255,255,0.15)" : "var(--opal-sub,rgba(232,230,240,0.55))", border = "1px solid transparent";
          if (isBooked && !isSel) { bg = "rgba(255,92,102,0.15)"; color = "var(--opal-red,#ff5c66)"; border = "1px solid rgba(255,92,102,0.3)"; }
          if (isSel) { bg = "rgba(79,209,197,0.18)"; color = "var(--opal-teal,#4fd1c5)"; border = "1px solid rgba(79,209,197,0.4)"; }
          return (
            <button key={key} onClick={() => onDayClick(key)} style={{
              aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: 7, fontSize: 11, fontWeight: 600, border, cursor: isBooked ? "pointer" : "default",
              background: bg, color, transition: "background 0.1s, color 0.1s", fontFamily: "var(--font-body,system-ui)",
            }}>{day}</button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Venue form modal ─────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: "", description: "",
  city: "", area: "", address: "",
  capacity: "", dimensionsSqm: "",
  amenities: [],
  basePrice: "", currency: "EGP", pricingUnit: "per_event",
};

function VenueFormModal({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial ? {
    name: initial.name || "",
    description: initial.description || "",
    city: initial.location?.city || "",
    area: initial.location?.area || "",
    address: initial.location?.address || "",
    capacity: initial.capacity || "",
    dimensionsSqm: initial.dimensionsSqm || "",
    amenities: initial.amenities || [],
    basePrice: initial.pricing?.basePrice || "",
    currency: initial.pricing?.currency || "EGP",
    pricingUnit: initial.pricing?.pricingUnit || "per_event",
  } : EMPTY_FORM);

  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [selectedDates, setSelectedDates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef();
  const isEdit = !!initial?._id;

  const today = new Date();
  const [calView, setCalView] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const bookedKeys = new Set((initial?.bookedDates || []).map(b => toKey(new Date(b.date))));
  const selectedKeys = new Set(selectedDates.map(d => toKey(new Date(d))));

  const daysInMonth = new Date(calView.year, calView.month + 1, 0).getDate();
  const firstDay = new Date(calView.year, calView.month, 1).getDay();
  const calCells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  function toggleDate(day) {
    const date = new Date(calView.year, calView.month, day);
    const key = toKey(date);
    const past = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (past || bookedKeys.has(key)) return;
    setSelectedDates(prev =>
      prev.some(d => toKey(new Date(d)) === key)
        ? prev.filter(d => toKey(new Date(d)) !== key)
        : [...prev, date]
    );
  }

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }
  function toggleAmenity(a) {
    setForm(f => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a],
    }));
  }
  function onFileChange(e) {
    const files = Array.from(e.target.files);
    setPhotoFiles(prev => [...prev, ...files]);
    files.forEach(f => {
      const reader = new FileReader();
      reader.onload = ev => setPhotoPreviews(prev => [...prev, ev.target.result]);
      reader.readAsDataURL(f);
    });
  }
  function removePhoto(i) {
    setPhotoFiles(prev => prev.filter((_, idx) => idx !== i));
    setPhotoPreviews(prev => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit() {
    if (!form.name || !form.city || !form.capacity || !form.basePrice) {
      setError("Name, city, capacity and base price are required."); return;
    }
    setLoading(true); setError("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === "amenities") fd.append(k, JSON.stringify(v));
        else fd.append(k, v);
      });
      photoFiles.forEach(f => fd.append("photos", f));
      if (selectedDates.length) fd.append("bookedDates", JSON.stringify(selectedDates.map(d => new Date(d).toISOString())));
      if (isEdit) await updateVenue(initial._id, fd);
      else await createVenue(fd);
      onSave();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={css.overlay}>
      <GlassPanel style={css.modal} onClick={e => e.stopPropagation()}>
        <div style={css.modalHeader}>
          <span style={css.modalTitle}>{isEdit ? "Edit Venue" : "New Venue"}</span>
          <button style={css.closeBtn} onClick={onCancel}>×</button>
        </div>
        <div style={css.modalBody}>
          <SectionLabel>Basic Info</SectionLabel>
          <label style={css.formLabel}>
            Venue name *
            <input style={css.formInput} value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Nile Garden Hall" />
          </label>
          <label style={css.formLabel}>
            Description
            <textarea style={{ ...css.formInput, minHeight: 76, resize: "vertical" }} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Describe the venue…" />
          </label>

          <SectionLabel style={{ marginTop: 18 }}>Location</SectionLabel>
          <div style={css.formGrid2}>
            <label style={css.formLabel}>City *<input style={css.formInput} value={form.city} onChange={e => set("city", e.target.value)} placeholder="Cairo" /></label>
            <label style={css.formLabel}>Area<input style={css.formInput} value={form.area} onChange={e => set("area", e.target.value)} placeholder="Maadi" /></label>
          </div>
          <label style={css.formLabel}>Address<input style={css.formInput} value={form.address} onChange={e => set("address", e.target.value)} placeholder="Corniche El Maadi" /></label>

          <SectionLabel style={{ marginTop: 18 }}>Specs</SectionLabel>
          <div style={css.formGrid2}>
            <label style={css.formLabel}>Capacity *<input style={css.formInput} type="number" value={form.capacity} onChange={e => set("capacity", e.target.value)} placeholder="250" /></label>
            <label style={css.formLabel}>Area (sqm)<input style={css.formInput} type="number" value={form.dimensionsSqm} onChange={e => set("dimensionsSqm", e.target.value)} placeholder="600" /></label>
          </div>

          <SectionLabel style={{ marginTop: 18 }}>Amenities</SectionLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 4 }}>
            {AMENITY_OPTIONS.map(a => (
              <button key={a} type="button" onClick={() => toggleAmenity(a)} style={{ ...css.chip, ...(form.amenities.includes(a) ? css.chipActive : {}) }}>{a}</button>
            ))}
          </div>

          <SectionLabel style={{ marginTop: 18 }}>Pricing</SectionLabel>
          <div style={css.formGrid3}>
            <label style={css.formLabel}>Base price *<input style={css.formInput} type="number" value={form.basePrice} onChange={e => set("basePrice", e.target.value)} placeholder="35000" /></label>
            <label style={css.formLabel}>Currency
              <select style={css.formInput} value={form.currency} onChange={e => set("currency", e.target.value)}>
                <option>EGP</option><option>USD</option><option>EUR</option>
              </select>
            </label>
            <label style={css.formLabel}>Unit
              <select style={css.formInput} value={form.pricingUnit} onChange={e => set("pricingUnit", e.target.value)}>
                <option value="per_event">Per event</option>
                <option value="per_day">Per day</option>
                <option value="per_hour">Per hour</option>
              </select>
            </label>
          </div>

          <SectionLabel style={{ marginTop: 18 }}>Photos</SectionLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 4 }}>
            {(initial?.photos || []).map((p, i) => (
              <div key={`ex-${i}`} style={css.photoThumb}><img src={p.url} alt="" style={css.thumbImg} /></div>
            ))}
            {photoPreviews.map((src, i) => (
              <div key={`new-${i}`} style={css.photoThumb}>
                <img src={src} alt="" style={css.thumbImg} />
                <button style={css.removePhotoBtn} onClick={() => removePhoto(i)}>×</button>
              </div>
            ))}
            <button type="button" style={css.uploadBox} onClick={() => fileRef.current.click()}>
              <span style={{ fontSize: 24, color: "var(--opal-violet,#7c5cfc)", lineHeight: 1 }}>+</span>
              <span style={{ fontSize: 11, color: "var(--opal-muted,rgba(232,230,240,0.35))", marginTop: 3 }}>Add photo</span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={onFileChange} />
          </div>

          <SectionLabel style={{ marginTop: 18 }}>Block Dates</SectionLabel>
          <p style={{ fontSize: 12, color: "var(--opal-muted,rgba(232,230,240,0.35))", margin: "0 0 12px" }}>Click dates to mark them as unavailable.</p>
          <div style={css.calWrap}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <button style={css.navBtn} onClick={() => setCalView(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 })}>‹</button>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--opal-text,#e8e6f0)", minWidth: 110, textAlign: "center" }}>
                {MONTHS[calView.month]} {calView.year}
              </span>
              <button style={css.navBtn} onClick={() => setCalView(v => v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 })}>›</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <div key={i} style={{ textAlign: "center", fontSize: 9, fontWeight: 700, color: "var(--opal-muted,rgba(232,230,240,0.35))", padding: "2px 0", letterSpacing: 0.4 }}>{d}</div>
              ))}
              {calCells.map((day, i) => {
                if (!day) return <div key={`b-${i}`} />;
                const date = new Date(calView.year, calView.month, day);
                const key = toKey(date);
                const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                const booked = bookedKeys.has(key);
                const sel = selectedKeys.has(key);
                let bg = "transparent", color = "var(--opal-sub,rgba(232,230,240,0.55))", cursor = "pointer", border = "1px solid transparent";
                if (isPast) { color = "rgba(255,255,255,0.15)"; cursor = "default"; }
                if (booked) { bg = "rgba(255,92,102,0.15)"; color = "var(--opal-red,#ff5c66)"; cursor = "not-allowed"; border = "1px solid rgba(255,92,102,0.3)"; }
                if (sel) { bg = "var(--opal-violet,#7c5cfc)"; color = "#0a0a0f"; border = "1px solid var(--opal-violet,#7c5cfc)"; }
                return (
                  <button key={key} type="button" onClick={() => toggleDate(day)} style={{
                    aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: 7, fontSize: 11, fontWeight: 600, border, cursor, background: bg, color,
                    transition: "background 0.1s, color 0.1s", fontFamily: "var(--font-body,system-ui)",
                  }}>{day}</button>
                );
              })}
            </div>
          </div>

          {error && <p style={{ color: "var(--opal-red,#ff5c66)", fontSize: 13, marginTop: 12 }}>{error}</p>}
          <div style={css.formActions}>
            <button style={css.cancelBtn} onClick={onCancel}>Cancel</button>
            <button style={css.saveBtn} onClick={handleSubmit} disabled={loading}>
              {loading ? "Saving…" : isEdit ? "Save Changes" : "Create Venue"}
            </button>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}

// ─── Venue card ───────────────────────────────────────────────────────────────

function VenueCard({ venue, onEdit, onDelete, onDeactivate }) {
  const [confirming, setConfirming] = useState(null);
  const [hovered, setHovered] = useState(false);
  const photoUrl = venue.photos?.[0]?.url;

  return (
    <GlassPanel
      style={{ ...css.vCard, ...(hovered ? css.vCardHovered : {}) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {photoUrl ? (
        <img src={photoUrl} alt={venue.name} style={css.vCardImg} />
      ) : (
        <div style={{ ...css.vCardImg, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(21,21,29,0.8)", fontSize: 32 }}>🏛️</div>
      )}
      <div style={{ padding: "12px 14px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--opal-text,#e8e6f0)", margin: 0, fontFamily: "var(--font-display,system-ui)", letterSpacing: -0.2 }}>
              {venue.name}
            </h3>
            <p style={{ fontSize: 10, color: "var(--opal-muted,rgba(232,230,240,0.35))", margin: "2px 0 0" }}>
              {[venue.location?.area, venue.location?.city].filter(Boolean).join(", ")}
            </p>
          </div>
          <span style={{ ...css.statusBadge, ...(venue.isActive ? css.statusGreen : css.statusGray) }}>
            {venue.isActive ? "Active" : "Inactive"}
          </span>
        </div>
        <p style={{ fontSize: 12, color: "var(--opal-sub,rgba(232,230,240,0.55))", lineHeight: 1.4, marginBottom: 10, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {venue.description}
        </p>
        <div style={{ display: "flex", gap: 10, fontSize: 11, color: "var(--opal-muted,rgba(232,230,240,0.35))", marginBottom: 12, flexWrap: "wrap" }}>
          <span>👥 {venue.capacity}</span>
          <span>📐 {venue.dimensionsSqm}sqm</span>
          <span>💰 {formatPrice(venue.pricing)}</span>
        </div>
        {confirming === "delete" ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: "var(--opal-red,#ff5c66)" }}>Delete?</span>
            <button style={css.confirmYes} onClick={() => { onDelete(venue._id); setConfirming(null); }}>Yes</button>
            <button style={css.confirmNo} onClick={() => setConfirming(null)}>Cancel</button>
          </div>
        ) : confirming === "deactivate" ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: "var(--opal-amber,#f5b34a)" }}>Deactivate?</span>
            <button style={css.confirmYes} onClick={() => { onDeactivate(venue._id); setConfirming(null); }}>Yes</button>
            <button style={css.confirmNo} onClick={() => setConfirming(null)}>Cancel</button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 6 }}>
            <button style={css.vBtnEdit} onClick={() => onEdit(venue)}>Edit</button>
            <button style={css.vBtnDeactivate} onClick={() => setConfirming("deactivate")}>Deactivate</button>
            <button style={css.vBtnDelete} onClick={() => setConfirming("delete")}>Delete</button>
          </div>
        )}
      </div>
    </GlassPanel>
  );
}

// ─── My Venues section ────────────────────────────────────────────────────────

function MyVenuesSection() {
  const [venues, setVenues] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  async function load() {
    setLoading(true);
    try { const { venues } = await getMyVenues(); setVenues(venues); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  useEffect(() => {
    let list = venues;
    if (filter === "active") list = list.filter(v => v.isActive);
    if (filter === "inactive") list = list.filter(v => !v.isActive);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(v =>
        v.name.toLowerCase().includes(q) ||
        v.location?.city?.toLowerCase().includes(q) ||
        v.location?.area?.toLowerCase().includes(q)
      );
    }
    setFiltered(list);
  }, [venues, search, filter]);

  async function handleDelete(id) { try { await deleteVenue(id); load(); } catch (e) { console.error(e); } }
  async function handleDeactivate(id) { try { await deactivateVenue(id); load(); } catch (e) { console.error(e); } }

  return (
    <div style={{ flex: "1 1 0", minWidth: 0 }}>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 160px" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--opal-muted,rgba(232,230,240,0.35))", pointerEvents: "none" }}>⌕</span>
          <input
            style={css.searchInput}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search venues…"
          />
          {search && (
            <button style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--opal-muted,rgba(232,230,240,0.35))", fontSize: 14, cursor: "pointer" }}
              onClick={() => setSearch("")}>×</button>
          )}
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          {["all", "active", "inactive"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ ...css.filterBtn, ...(filter === f ? css.filterBtnActive : {}) }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button style={css.newVenueBtn} onClick={() => { setEditing(null); setShowForm(true); }}>
          + New Venue
        </button>
      </div>

      {loading ? (
        <p style={{ color: "var(--opal-muted,rgba(232,230,240,0.35))", fontSize: 13 }}>Loading venues…</p>
      ) : filtered.length === 0 ? (
        <GlassPanel style={{ textAlign: "center", padding: "36px 24px" }}>
          <p style={{ fontSize: 28, margin: "0 0 8px" }}>🏛️</p>
          <p style={{ fontSize: 15, fontWeight: 700, color: "var(--opal-text,#e8e6f0)", margin: "0 0 5px", fontFamily: "var(--font-display,system-ui)" }}>
            {search ? "No venues match your search" : "No venues yet"}
          </p>
          <p style={{ fontSize: 12, color: "var(--opal-muted,rgba(232,230,240,0.35))", marginBottom: 16 }}>
            {search ? "Try a different search term." : "Create your first listing to get started."}
          </p>
          {!search && <button style={css.newVenueBtn} onClick={() => { setEditing(null); setShowForm(true); }}>+ New Venue</button>}
        </GlassPanel>
      ) : (
        <div style={css.venueGrid}>
          {filtered.map(v => (
            <VenueCard
              key={v._id}
              venue={v}
              onEdit={venue => { setEditing(venue); setShowForm(true); }}
              onDelete={handleDelete}
              onDeactivate={handleDeactivate}
            />
          ))}
        </div>
      )}

      {showForm && (
        <VenueFormModal
          initial={editing}
          onSave={() => { setShowForm(false); setEditing(null); load(); }}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
}

// ─── Notifications panel ──────────────────────────────────────────────────────

function NotificationsPanel() {
  return (
    <GlassPanel style={{ padding: "18px 20px", display: "flex", flexDirection: "column", height: "100%" }}>
      <SectionLabel>Notifications</SectionLabel>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
        <span style={{ fontSize: 28, opacity: 0.25 }}>🔔</span>
        <p style={{ fontSize: 13, color: "var(--opal-muted,rgba(232,230,240,0.35))", margin: 0, textAlign: "center" }}>
          No notifications yet
        </p>
      </div>
    </GlassPanel>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function PageOwnerDashboard() {
  const navigate = useNavigate();

  const dockItems = [
    { icon: <VscMail size={26} />, label: "Requests", onClick: () => navigate("/venueowner/venueresponse") },
    { icon: <VscBell size={26} />, label: "Notifications", onClick: () => navigate("/notificationsview") },
    { icon: <VscHome size={26} />, label: "Home", active: true, onClick: () => navigate("/venueowner/venues") },
    { icon: <VscCalendar size={26} />, label: "Reports", onClick: () => navigate("/venueowner/venuereports") },
    { icon: <VscPerson size={26} />, label: "Owner Profile", onClick: () => navigate("/pageProfile") },
  ];

  return (
    <div style={css.page}>
      <AppHeader
        crumb="Venue Owner"
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: 'rgba(62,207,184,0.14)', color: '#3ecfb8', border: '1px solid rgba(62,207,184,0.27)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#3ecfb8', display: 'inline-block', boxShadow: '0 0 6px rgba(62,207,184,0.4)' }} />
            Venue Owner Portal
          </div>
        }
      />
      <div style={css.content}>
        {/* ── Confirmed Bookings ── */}
        <section style={{ marginBottom: 28 }}>
          <ConfirmedBookingsSection />
        </section>

        {/* ── Notifications + My Venues side by side ── */}
        <section>
          <div style={css.bottomLayout}>
            {/* Notifications — fixed width, stretches to match venues height */}
            <div style={{ flex: "0 0 280px", minWidth: 220, display: "flex", flexDirection: "column" }}>
              <NotificationsPanel />
            </div>
            {/* My Venues — takes remaining space, 2-column grid */}
            <MyVenuesSection />
          </div>
        </section>
      </div>

      <Dock items={dockItems} />
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const css = {
  page: {
    minHeight: "100vh",
    background: "var(--opal-bg,#0a0a0f)",
    fontFamily: "var(--font-body,system-ui)",
    color: "var(--opal-text,#e8e6f0)",
    WebkitFontSmoothing: "antialiased",
  },
  content: {
    // bottom padding clears the dock (120px) + some breathing room
    padding: `28px 28px ${DOCK_HEIGHT + 24}px`,
  },

  bottomLayout: {
    display: "flex",
    gap: 20,
    alignItems: "stretch",
  },

  // Filter controls
  filterControl: {
    padding: "9px 12px",
    border: "1px solid var(--opal-border,rgba(255,255,255,0.08))",
    borderRadius: 10, fontSize: 13,
    color: "var(--opal-sub,rgba(232,230,240,0.55))",
    background: "rgba(21,21,29,0.7)",
    fontFamily: "var(--font-body,system-ui)", outline: "none",
    cursor: "pointer",
  },
  navBtn: {
    width: 24, height: 24, borderRadius: 6,
    border: "1px solid var(--opal-border,rgba(255,255,255,0.08))",
    background: "rgba(30,30,41,0.8)", color: "var(--opal-sub,rgba(232,230,240,0.55))",
    fontSize: 14, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "var(--font-body,system-ui)", lineHeight: 1, padding: 0,
  },

  // Booking detail chips
  chipAmber: {
    padding: "3px 10px", borderRadius: 20,
    background: "rgba(245,179,74,0.15)", color: "var(--opal-amber,#f5b34a)",
    border: "1px solid rgba(245,179,74,0.3)", fontSize: 11, fontWeight: 600,
  },
  chipMuted: {
    padding: "3px 10px", borderRadius: 20,
    background: "rgba(255,255,255,0.05)", color: "var(--opal-sub,rgba(232,230,240,0.55))",
    border: "1px solid var(--opal-border,rgba(255,255,255,0.08))", fontSize: 11,
  },

  // Venue grid — 2 columns (smaller cards to give space to notifications)
  venueGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 14,
  },
  vCard: {
    overflow: "hidden",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    display: "flex", flexDirection: "column",
  },
  vCardHovered: {
    transform: "translateY(-3px)",
    boxShadow: "0 6px 24px rgba(124,92,252,0.18), inset 0 1px 0 rgba(255,255,255,0.04)",
  },
  vCardImg: {
    width: "100%", height: 150, objectFit: "cover", display: "block",
  },
  statusBadge: {
    fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20, flexShrink: 0,
  },
  statusGreen: { background: "rgba(48,209,88,0.15)", color: "#30d158", border: "1px solid rgba(48,209,88,0.3)" },
  statusGray: { background: "rgba(255,255,255,0.06)", color: "var(--opal-muted,rgba(232,230,240,0.35))", border: "1px solid var(--opal-border,rgba(255,255,255,0.08))" },

  vBtnEdit: {
    flex: 1, padding: "6px 0",
    border: "1px solid rgba(124,92,252,0.4)", borderRadius: 7,
    background: "rgba(124,92,252,0.08)", color: "var(--opal-violet,#7c5cfc)",
    fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body,system-ui)",
  },
  vBtnDeactivate: {
    flex: 1, padding: "6px 0",
    border: "1px solid rgba(245,179,74,0.35)", borderRadius: 7,
    background: "rgba(245,179,74,0.07)", color: "var(--opal-amber,#f5b34a)",
    fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body,system-ui)",
  },
  vBtnDelete: {
    flex: 1, padding: "6px 0",
    border: "1px solid rgba(255,92,102,0.35)", borderRadius: 7,
    background: "rgba(255,92,102,0.07)", color: "var(--opal-red,#ff5c66)",
    fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body,system-ui)",
  },
  confirmYes: {
    padding: "4px 10px", background: "var(--opal-red,#ff5c66)", color: "#0a0a0f",
    border: "none", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer",
    fontFamily: "var(--font-body,system-ui)",
  },
  confirmNo: {
    padding: "4px 10px", background: "rgba(255,255,255,0.07)", color: "var(--opal-sub,rgba(232,230,240,0.55))",
    border: "1px solid var(--opal-border,rgba(255,255,255,0.08))", borderRadius: 6,
    fontSize: 11, cursor: "pointer", fontFamily: "var(--font-body,system-ui)",
  },

  // Venue toolbar
  searchInput: {
    width: "100%", padding: "8px 32px",
    border: "1px solid var(--opal-border,rgba(255,255,255,0.08))",
    borderRadius: 10, fontSize: 12,
    background: "rgba(21,21,29,0.7)", outline: "none",
    color: "var(--opal-text,#e8e6f0)",
    fontFamily: "var(--font-body,system-ui)", boxSizing: "border-box",
  },
  filterBtn: {
    padding: "7px 11px",
    border: "1px solid var(--opal-border,rgba(255,255,255,0.08))",
    borderRadius: 9, fontSize: 11, fontWeight: 500,
    color: "var(--opal-sub,rgba(232,230,240,0.55))",
    background: "rgba(21,21,29,0.6)", cursor: "pointer",
    fontFamily: "var(--font-body,system-ui)",
  },
  filterBtnActive: {
    background: "var(--opal-violet,#7c5cfc)", color: "#0a0a0f",
    border: "1px solid var(--opal-violet,#7c5cfc)",
  },
  newVenueBtn: {
    padding: "8px 14px",
    background: "linear-gradient(135deg, var(--opal-violet,#7c5cfc) 0%, var(--opal-teal,#4fd1c5) 100%)",
    color: "#0a0a0f", border: "none", borderRadius: 9,
    fontSize: 12, fontWeight: 700, cursor: "pointer",
    fontFamily: "var(--font-body,system-ui)", whiteSpace: "nowrap",
  },

  // Form modal
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(10,10,15,0.7)", backdropFilter: "blur(4px)",
    zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
  },
  modal: {
    width: "100%", maxWidth: 660, maxHeight: "90vh",
    display: "flex", flexDirection: "column", overflow: "hidden",
  },
  modalHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "18px 22px",
    borderBottom: "1px solid var(--opal-border,rgba(255,255,255,0.08))",
    flexShrink: 0,
  },
  modalTitle: {
    fontSize: 17, fontWeight: 700, color: "var(--opal-text,#e8e6f0)",
    fontFamily: "var(--font-display,system-ui)",
  },
  closeBtn: {
    background: "none", border: "none", fontSize: 20, cursor: "pointer",
    color: "var(--opal-muted,rgba(232,230,240,0.35))", lineHeight: 1,
    display: "flex", alignItems: "center", justifyContent: "center",
    width: 28, height: 28,
  },
  modalBody: {
    overflowY: "auto", padding: "18px 22px 24px", flex: 1,
  },
  formLabel: {
    display: "flex", flexDirection: "column", gap: 6,
    fontSize: 12, fontWeight: 600, color: "var(--opal-sub,rgba(232,230,240,0.55))",
    marginBottom: 10,
  },
  formInput: {
    border: "1px solid var(--opal-border,rgba(255,255,255,0.08))",
    borderRadius: 10, padding: "9px 10px", fontSize: 13,
    color: "var(--opal-text,#e8e6f0)",
    background: "rgba(21,21,29,0.7)",
    fontFamily: "var(--font-body,system-ui)", outline: "none",
    width: "100%", boxSizing: "border-box",
  },
  formGrid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  formGrid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 },
  chip: {
    padding: "6px 14px",
    border: "1px solid var(--opal-border,rgba(255,255,255,0.08))",
    borderRadius: 20, fontSize: 12, cursor: "pointer",
    background: "rgba(21,21,29,0.7)",
    color: "var(--opal-sub,rgba(232,230,240,0.55))",
    fontFamily: "var(--font-body,system-ui)",
  },
  chipActive: {
    background: "var(--opal-violet-dim,rgba(124,92,252,0.15))",
    color: "var(--opal-violet,#7c5cfc)",
    border: "1px solid rgba(124,92,252,0.4)",
  },
  photoThumb: {
    position: "relative", width: 76, height: 76, borderRadius: 10,
    overflow: "hidden", border: "1px solid var(--opal-border,rgba(255,255,255,0.08))",
  },
  thumbImg: { width: "100%", height: "100%", objectFit: "cover" },
  removePhotoBtn: {
    position: "absolute", top: 3, right: 3,
    background: "rgba(10,10,15,0.65)", border: "none", color: "#fff",
    borderRadius: "50%", width: 18, height: 18, fontSize: 12, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  uploadBox: {
    width: 76, height: 76,
    border: "2px dashed var(--opal-border,rgba(255,255,255,0.08))",
    borderRadius: 10, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", cursor: "pointer",
    background: "transparent",
  },
  calWrap: {
    background: "rgba(21,21,29,0.7)",
    border: "1px solid var(--opal-border,rgba(255,255,255,0.08))",
    borderRadius: 14, padding: "14px 16px",
  },
  formActions: {
    display: "flex", gap: 10, justifyContent: "flex-end",
    marginTop: 24, paddingTop: 16,
    borderTop: "1px solid var(--opal-border,rgba(255,255,255,0.08))",
  },
  cancelBtn: {
    padding: "9px 18px",
    border: "1px solid var(--opal-border,rgba(255,255,255,0.08))",
    borderRadius: 10, background: "transparent",
    color: "var(--opal-sub,rgba(232,230,240,0.55))",
    fontSize: 13, cursor: "pointer", fontFamily: "var(--font-body,system-ui)",
  },
  saveBtn: {
    padding: "9px 22px",
    background: "linear-gradient(135deg, var(--opal-violet,#7c5cfc) 0%, var(--opal-teal,#4fd1c5) 100%)",
    color: "#0a0a0f", border: "none", borderRadius: 10,
    fontSize: 13, fontWeight: 700, cursor: "pointer",
    fontFamily: "var(--font-body,system-ui)",
  },
};