import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { requestVenueBooking, searchVenues } from "../services/serviceBrowseVenue";
import AppHeader from "../components/componentAppHeader.jsx";
import MiniCalendar from "../components/componentMiniCalendar.jsx";
import { OpalSelect, OpalMultiSelect } from "../components/componentMenus.jsx";
import '../components/componentTheme.css';

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

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name = "?", size = 36 }) {
  const initials = (name || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: size / 2.8,
      background: "linear-gradient(135deg, var(--opal-violet) 0%, var(--opal-teal) 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.33, fontWeight: 700, color: "#0a0a0f", flexShrink: 0,
      letterSpacing: -0.3, fontFamily: "var(--font-display)",
    }}>
      {initials}
    </div>
  );
}

// ─── Shared glass surface ─────────────────────────────────────────────────────

function GlassCard({ children, style = {}, ...rest }) {
  return (
    <div {...rest} style={{
      background: "rgba(30,30,41,0.55)",
      backdropFilter: "blur(18px) saturate(140%)",
      WebkitBackdropFilter: "blur(18px) saturate(140%)",
      border: "1px solid var(--opal-border)",
      borderRadius: 16,
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
      ...style,
    }}>
      {children}
    </div>
  );
}

function AmenityPill({ label }) {
  return (
    <span style={css.amenityPill}>
      <span style={css.amenityIcon}>{AMENITY_ICONS[label] || "+"}</span> {label}
    </span>
  );
}

function VenueCard({ venue, onViewDetails }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const photoUrl = venue.photos?.[0]?.url;
  const unit = venue.pricing?.pricingUnit?.replace("per_", "") ?? "event";

  return (
    <GlassCard
      style={{ ...css.card, ...(hovered ? css.cardHovered : {}) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={css.cardImgWrap}>
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={venue.name}
            style={{ ...css.cardImg, opacity: imgLoaded ? 1 : 0, transition: "opacity 0.4s" }}
            onLoad={() => setImgLoaded(true)}
          />
        ) : (
          <div style={css.cardImgPlaceholder}>Venue</div>
        )}
        <div style={css.priceBadge}>
          {formatPrice(venue.pricing)}
          <span style={css.priceBadgeUnit}> / {unit}</span>
        </div>
      </div>

      <div style={css.cardBody}>
        <div style={css.cardLocation}>
          {[venue.location?.area, venue.location?.city].filter(Boolean).join(", ")}
        </div>
        <h3 style={css.cardName}>{venue.name}</h3>
        <p style={css.cardDesc}>{venue.description}</p>

        <div style={css.statsRow}>
          <div style={css.stat}>
            <span style={css.statVal}>{Number(venue.capacity ?? 0).toLocaleString()}</span>
            <span style={css.statLabel}>guests</span>
          </div>
          <div style={css.statDivider} />
          <div style={css.stat}>
            <span style={css.statVal}>{Number(venue.dimensionsSqm ?? 0).toLocaleString()}</span>
            <span style={css.statLabel}>sqm</span>
          </div>
          <div style={css.statDivider} />
          <div style={css.stat}>
            <span style={css.statVal}>{venue.amenities?.length ?? 0}</span>
            <span style={css.statLabel}>amenities</span>
          </div>
        </div>

        <div style={css.pillsRow}>
          {(venue.amenities ?? []).slice(0, 3).map((a) => <AmenityPill key={a} label={a} />)}
          {(venue.amenities?.length ?? 0) > 3 && (
            <span style={css.moreAmenities}>+{venue.amenities.length - 3}</span>
          )}
        </div>

        <button
          style={css.viewBtn}
          onClick={() => onViewDetails(venue)}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
        >
          View Details
        </button>
      </div>
    </GlassCard>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function DetailModal({ venue, onClose, onBookingSent }) {
  const [form, setForm] = useState({
    eventType: "wedding",
    expectedAttendees: "",
    specialRequirements: "",
    proposedAmount: "",
    proposedCurrency: venue.pricing?.currency ?? "EGP",
  });
  const [selectedDates, setSelectedDates] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const photoUrl = venue.photos?.[0]?.url;
  const unit = venue.pricing?.pricingUnit?.replace("per_", "") ?? "event";

  const updateField = (field, value) => {
    setError("");
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleDatesChange = (dates) => {
    setError("");
    setSelectedDates(dates);
  };

  const submitBooking = async (event) => {
    event.preventDefault();
    if (selectedDates.length === 0) { setError("Select at least one date."); return; }
    setSubmitting(true);
    setError("");
    try {
      await requestVenueBooking(venue._id, {
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
    <div style={css.overlay} onClick={onClose}>
      <GlassCard style={css.detailModal} onClick={(e) => e.stopPropagation()}>
        <div style={css.detailImgWrap}>
          {photoUrl ? (
            <img src={photoUrl} alt={venue.name} style={css.detailImg} />
          ) : (
            <div style={{ ...css.detailImg, background: "var(--opal-surface)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: "var(--opal-muted)" }}>Venue</div>
          )}
          <div style={css.detailImgOverlay} />
          <button style={css.detailCloseBtn} onClick={onClose}>×</button>
          <div style={css.detailHeroContent}>
            <p style={css.detailHeroArea}>{[venue.location?.area, venue.location?.city].filter(Boolean).join(" - ")}</p>
            <h2 style={css.detailHeroName}>{venue.name}</h2>
            <p style={css.detailHeroPrice}>
              {formatPrice(venue.pricing)}
              <span style={{ fontWeight: 300, fontSize: 15 }}> / {unit}</span>
            </p>
          </div>
        </div>

        <div style={css.detailBody}>
          <GlassCard style={css.detailStatsRow}>
            <div style={css.detailStat}>
              <span style={css.detailStatVal}>{Number(venue.capacity ?? 0).toLocaleString()}</span>
              <span style={css.detailStatLabel}>Max guests</span>
            </div>
            <div style={css.detailStatDiv} />
            <div style={css.detailStat}>
              <span style={css.detailStatVal}>{Number(venue.dimensionsSqm ?? 0).toLocaleString()}</span>
              <span style={css.detailStatLabel}>sqm floor area</span>
            </div>
            <div style={css.detailStatDiv} />
            <div style={css.detailStat}>
              <span style={css.detailStatVal}>{venue.amenities?.length ?? 0}</span>
              <span style={css.detailStatLabel}>amenities</span>
            </div>
          </GlassCard>

          <div style={css.detailSection}>
            <p style={css.detailSectionLabel}>About this venue</p>
            <p style={css.detailDesc}>{venue.description}</p>
          </div>

          <div style={css.detailSection}>
            <p style={css.detailSectionLabel}>Address</p>
            <p style={css.detailDesc}>
              {[venue.location?.address, venue.location?.area, venue.location?.city].filter(Boolean).join(", ")}
            </p>
          </div>

          <div style={css.detailSection}>
            <p style={css.detailSectionLabel}>Amenities</p>
            <div style={css.detailAmenitiesGrid}>
              {(venue.amenities ?? []).map((a) => <AmenityPill key={a} label={a} />)}
            </div>
          </div>

          <form style={css.bookingForm} onSubmit={submitBooking}>
            <p style={css.detailSectionLabel}>Select date(s) for your event</p>

            <MiniCalendar
              selectedDates={selectedDates}
              onChange={handleDatesChange}
              disabledDates={venue.bookedDates?.map((b) => b.date) ?? []}
            />

            {selectedDates.length > 0 && (
              <div style={css.selectedDatesRow}>
                {selectedDates.map((d) => (
                  <span key={d} style={css.selectedDateChip}>
                    {new Date(`${d}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    <button
                      type="button"
                      style={css.selectedDateChipRemove}
                      onClick={() => setSelectedDates((prev) => prev.filter((x) => x !== d))}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <p style={{ ...css.detailSectionLabel, marginTop: 20 }}>Request booking</p>

            <div style={css.formGrid}>
              <OpalSelect
                label="Event type"
                value={form.eventType}
                onChange={(v) => updateField("eventType", v)}
                options={EVENT_TYPES.map((t) => ({ value: t, label: t.replaceAll("_", " ") }))}
                accent="violet"
              />

              <label style={css.formLabel}>
                Expected attendees
                <input
                  type="number"
                  min="1"
                  style={css.formInput}
                  value={form.expectedAttendees}
                  onChange={(e) => updateField("expectedAttendees", e.target.value)}
                  required
                />
              </label>

              <label style={css.formLabel}>
                Proposed amount
                <input
                  type="number"
                  min="0"
                  style={css.formInput}
                  value={form.proposedAmount}
                  onChange={(e) => updateField("proposedAmount", e.target.value)}
                  placeholder={String(venue.pricing?.basePrice ?? "")}
                />
              </label>

              <OpalSelect
                label="Currency"
                value={form.proposedCurrency}
                onChange={(v) => updateField("proposedCurrency", v)}
                options={["EGP", "USD", "EUR", "GBP", "SAR", "AED"]}
                accent="teal"
              />
            </div>

            <label style={css.formLabel}>
              Special requirements
              <textarea
                style={{ ...css.formInput, minHeight: 76, resize: "vertical" }}
                value={form.specialRequirements}
                onChange={(e) => updateField("specialRequirements", e.target.value)}
              />
            </label>

            {error && <p style={css.formError}>{error}</p>}
            <div style={css.detailCTA}>
              <button type="submit" style={css.submitBookingBtn} disabled={submitting}>
                {submitting ? "Sending…" : "Send Booking Request"}
              </button>
            </div>
          </form>
        </div>
      </GlassCard>
    </div>
  );
}

// ─── Date filter popover ──────────────────────────────────────────────────────

function DateFilterPopover({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const label = value
    ? new Date(`${value}T12:00:00`).toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric",
      })
    : "Any date";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "9px 14px",
          border: value ? "1px solid rgba(124,92,252,0.45)" : "1px solid var(--opal-border)",
          borderRadius: 10,
          fontSize: 13,
          color: value ? "var(--opal-text)" : "var(--opal-muted)",
          background: value ? "var(--opal-violet-dim)" : "var(--opal-surface)",
          cursor: "pointer",
          fontFamily: "var(--font-body)",
          whiteSpace: "nowrap",
        }}
      >
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0, color: value ? "var(--opal-violet)" : "var(--opal-muted)" }}>
          <rect x="1" y="2" width="11" height="10" rx="2" stroke="currentColor" strokeWidth="1.2" />
          <path d="M1 5h11" stroke="currentColor" strokeWidth="1.2" />
          <path d="M4 1v2M9 1v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        {label}
        {value && (
          <span
            onClick={(e) => { e.stopPropagation(); onChange(""); }}
            style={{ marginLeft: 2, opacity: 0.6, fontSize: 15, lineHeight: 1, cursor: "pointer" }}
          >
            ×
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 8px)",
          left: 0,
          zIndex: 600,
        }}>
          <MiniCalendar
            selectedDates={value ? [value] : []}
            onChange={(dates) => {
              // single-select: pick whichever date was just added, or clear
              const next = dates.find((d) => d !== value) ?? "";
              onChange(next);
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function VenueDiscovery() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [amenityFilter, setAmenityFilter] = useState([]);
  const [sortBy, setSortBy] = useState("default");
  const [detailVenue, setDetailVenue] = useState(null);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [toast, setToast] = useState(null);
  const lastFetchedQuery = useRef(null);
  const requestId = useRef(0);

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

  useEffect(() => {
    const id = setTimeout(() => loadVenues(search), 800);
    return () => clearTimeout(id);
  }, [search, loadVenues]);

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
    if (sortBy === "price_asc") list = [...list].sort((a, b) => (a.pricing?.basePrice ?? 0) - (b.pricing?.basePrice ?? 0));
    if (sortBy === "price_desc") list = [...list].sort((a, b) => (b.pricing?.basePrice ?? 0) - (a.pricing?.basePrice ?? 0));
    if (sortBy === "capacity") list = [...list].sort((a, b) => (b.capacity ?? 0) - (a.capacity ?? 0));
    return list;
  }, [venues, locationSearch, dateFilter, amenityFilter, sortBy]);

  const activeFilterCount = [locationSearch.trim(), dateFilter, amenityFilter.length > 0].filter(Boolean).length;

  const SORT_OPTIONS = [
    { value: "default",    label: "Default" },
    { value: "price_asc",  label: "Price: Low → High" },
    { value: "price_desc", label: "Price: High → Low" },
    { value: "capacity",   label: "Capacity" },
  ];

  return (
    <div style={css.page}>
      {toast && (
        <div style={{ ...css.toast, ...(toast.type === "error" ? css.toastError : {}) }}>
          {toast.message}
        </div>
      )}

      <AppHeader
        crumb="Discover Venues"
        right={<Avatar name="Account" size={32} />}
      />

      {/* ── Search bar ── */}
      <div style={css.searchBar}>
        <div style={css.searchBarInner}>
          {/* Name search */}
          <div style={css.searchFieldWrap}>
            <span style={css.searchFieldIcon}>⌕</span>
            <input
              style={css.searchField}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search venues"
            />
            {search && <button style={css.clearBtn} onClick={() => setSearch("")}>×</button>}
          </div>

          {/* Location search */}
          <div style={css.searchFieldWrap}>
            <span style={css.searchFieldIcon}>◎</span>
            <input
              style={css.searchField}
              value={locationSearch}
              onChange={(e) => setLocationSearch(e.target.value)}
              placeholder="Area or city"
              list="location-suggestions"
            />
            {locationSearch && <button style={css.clearBtn} onClick={() => setLocationSearch("")}>×</button>}
            <datalist id="location-suggestions">
              {locationSuggestions.map((l) => <option key={l} value={l} />)}
            </datalist>
          </div>

          {/* Date filter — MiniCalendar popover */}
          <DateFilterPopover value={dateFilter} onChange={setDateFilter} />

          {/* More filters toggle */}
          <button
            style={{ ...css.moreFiltersBtn, ...(filtersExpanded || activeFilterCount > 1 ? css.moreFiltersBtnActive : {}) }}
            onClick={() => setFiltersExpanded((v) => !v)}
          >
            Filters {activeFilterCount > 0 && <span style={css.filterCountBadge}>{activeFilterCount}</span>}
          </button>

          {/* Sort */}
          <OpalSelect
            value={sortBy}
            onChange={setSortBy}
            options={SORT_OPTIONS}
            style={{ minWidth: 180 }}
            accent="violet"
          />
        </div>

        {/* Expanded filters */}
        {filtersExpanded && (
          <div style={css.expandedFilters}>
            {amenityOptions.length > 0 && (
              <div style={{ flex: 1, minWidth: 260 }}>
                <OpalMultiSelect
                  label="Must-have amenities"
                  value={amenityFilter}
                  onChange={setAmenityFilter}
                  options={amenityOptions}
                  placeholder="Any amenities"
                  accent="violet"
                />
              </div>
            )}

            {activeFilterCount > 0 && (
              <button
                style={css.clearAllBtn}
                onClick={() => { setLocationSearch(""); setDateFilter(""); setAmenityFilter([]); }}
              >
                Clear all
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Results count ── */}
      <div style={css.resultsHeader}>
        <p style={css.resultsCount}>
          {loading ? "Loading venues…" : (
            <>
              <strong>{filtered.length}</strong> venue{filtered.length !== 1 ? "s" : ""} found
              {dateFilter && (
                <span style={css.resultsDateTag}>
                  {" "}— available on {new Date(`${dateFilter}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              )}
            </>
          )}
        </p>
      </div>

      {/* ── Grid / empty state ── */}
      {!loading && filtered.length === 0 ? (
        <div style={css.emptyState}>
          <p style={css.emptyStateIcon}>⌀</p>
          <p style={css.emptyStateTitle}>No venues match your criteria</p>
          <p style={css.emptyStateHint}>Try adjusting your filters or choosing a different date.</p>
          <button
            style={css.emptyStateClear}
            onClick={() => { setSearch(""); setLocationSearch(""); setDateFilter(""); setAmenityFilter([]); }}
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div style={css.grid}>
          {filtered.map((v) => (
            <VenueCard key={v._id} venue={v} onViewDetails={setDetailVenue} />
          ))}
        </div>
      )}

      {detailVenue && (
        <DetailModal
          venue={detailVenue}
          onClose={() => setDetailVenue(null)}
          onBookingSent={showToast}
        />
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const css = {
  page: {
    minHeight: "100vh",
    background: "var(--opal-bg)",
    fontFamily: "var(--font-body)",
    color: "var(--opal-text)",
    WebkitFontSmoothing: "antialiased",
  },
  toast: {
    position: "fixed",
    top: 18,
    right: 18,
    zIndex: 900,
    background: "var(--opal-surface)",
    border: "1px solid var(--opal-border)",
    color: "var(--opal-text)",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 13,
    boxShadow: "0 8px 26px rgba(0,0,0,0.35)",
  },
  toastError: {
    background: "var(--opal-red-dim)",
    border: "1px solid rgba(255,92,102,0.28)",
    color: "var(--opal-red)",
  },
searchBar: {
  background: "rgba(21,21,29,0.6)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  borderBottom: "1px solid var(--opal-border)",
  padding: "16px 24px",
  position: "relative",   // ← add
  zIndex: 10,             // ← add
},
  searchBarInner: {
    maxWidth: 1280,
    margin: "0 auto",
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },
  searchFieldWrap: {
    flex: "1 1 220px",
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  searchFieldIcon: {
    position: "absolute",
    left: 12,
    fontSize: 14,
    pointerEvents: "none",
    color: "var(--opal-muted)",
  },
  searchField: {
    width: "100%",
    padding: "9px 36px",
    border: "1px solid var(--opal-border)",
    borderRadius: 10,
    fontSize: 14,
    background: "var(--opal-surface)",
    outline: "none",
    color: "var(--opal-text)",
    fontFamily: "var(--font-body)",
    boxSizing: "border-box",
  },
  clearBtn: {
    position: "absolute",
    right: 10,
    background: "none",
    border: "none",
    color: "var(--opal-muted)",
    fontSize: 16,
    cursor: "pointer",
  },
  moreFiltersBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "9px 14px",
    border: "1px solid var(--opal-border)",
    borderRadius: 10,
    fontSize: 14,
    color: "var(--opal-text)",
    background: "var(--opal-surface)",
    cursor: "pointer",
    fontFamily: "var(--font-body)",
  },
  moreFiltersBtnActive: {
    background: "var(--opal-violet)",
    color: "#0a0a0f",
    borderColor: "var(--opal-violet)",
  },
  filterCountBadge: {
    background: "#0a0a0f",
    color: "var(--opal-violet)",
    fontSize: 11,
    fontWeight: 700,
    borderRadius: 10,
    padding: "1px 6px",
  },
  expandedFilters: {
    maxWidth: 1280,
    margin: "14px auto 0",
    display: "flex",
    gap: 16,
    alignItems: "flex-end",
    flexWrap: "wrap",
    paddingTop: 14,
    borderTop: "1px solid var(--opal-border)",
  },
  clearAllBtn: {
    padding: "9px 16px",
    border: "1px solid rgba(255,92,102,0.28)",
    borderRadius: 10,
    fontSize: 13,
    color: "var(--opal-red)",
    background: "transparent",
    cursor: "pointer",
    fontFamily: "var(--font-body)",
    alignSelf: "flex-end",
    height: 40,
  },
  resultsHeader: { maxWidth: 1280, margin: "0 auto", padding: "14px 24px 0" },
  resultsCount: { fontSize: 13, color: "var(--opal-muted)", margin: 0 },
  resultsDateTag: { color: "var(--opal-violet)" },
  grid: {
    maxWidth: 1280,
    margin: "0 auto",
    padding: "16px 24px 40px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
    gap: 20,
  },
  card: {
    overflow: "hidden",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
  cardHovered: {
    transform: "translateY(-3px)",
    boxShadow: "0 4px 24px rgba(124,92,252,0.18), inset 0 1px 0 rgba(255,255,255,0.04)",
  },
  cardImgWrap: { position: "relative", height: 200, overflow: "hidden", flexShrink: 0 },
  cardImg: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  cardImgPlaceholder: {
    width: "100%",
    height: "100%",
    background: "var(--opal-surface)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    color: "var(--opal-muted)",
  },
  priceBadge: {
    position: "absolute",
    bottom: 12,
    left: 12,
    background: "rgba(10,10,15,0.7)",
    backdropFilter: "blur(8px)",
    border: "1px solid var(--opal-border)",
    color: "var(--opal-text)",
    fontSize: 13,
    fontWeight: 600,
    padding: "5px 10px",
    borderRadius: 8,
  },
  priceBadgeUnit: { fontWeight: 300, fontSize: 11, color: "var(--opal-sub)" },
  cardBody: { padding: "16px 18px 18px", display: "flex", flexDirection: "column", flex: 1 },
  cardLocation: { fontSize: 11, color: "var(--opal-muted)", marginBottom: 4 },
  cardName: {
    fontSize: 17, fontWeight: 700, color: "var(--opal-text)", margin: "0 0 6px",
    fontFamily: "var(--font-display)", letterSpacing: -0.2,
  },
  cardDesc: {
    fontSize: 13, color: "var(--opal-sub)", lineHeight: 1.5, marginBottom: 14,
    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
    overflow: "hidden", flexGrow: 1,
  },
  statsRow: { display: "flex", alignItems: "center", marginBottom: 12 },
  stat: { display: "flex", alignItems: "baseline", gap: 3, flex: 1, justifyContent: "center" },
  statVal: { fontSize: 14, fontWeight: 700, color: "var(--opal-text)", fontVariantNumeric: "tabular-nums" },
  statLabel: { fontSize: 11, color: "var(--opal-muted)" },
  statDivider: { width: 1, height: 20, background: "var(--opal-border)" },
  pillsRow: { display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 },
  amenityPill: {
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "3px 9px", borderRadius: 20,
    background: "var(--opal-surface)", border: "1px solid var(--opal-border)",
    color: "var(--opal-sub)", fontSize: 11, fontWeight: 500,
  },
  amenityIcon: {
    width: 14, height: 14, display: "inline-flex", alignItems: "center", justifyContent: "center",
    borderRadius: "50%", background: "var(--opal-violet-dim)", fontSize: 8, color: "var(--opal-violet)",
  },
  moreAmenities: {
    display: "inline-flex", alignItems: "center", padding: "3px 9px", borderRadius: 20,
    background: "var(--opal-violet-dim)", color: "var(--opal-violet)", fontSize: 11, fontWeight: 600,
  },
  viewBtn: {
    width: "100%", padding: "10px 0",
    background: "linear-gradient(135deg, var(--opal-violet) 0%, var(--opal-teal) 100%)",
    color: "#0a0a0f", border: "none", borderRadius: 10,
    fontSize: 14, fontWeight: 700, cursor: "pointer",
    fontFamily: "var(--font-body)", transition: "opacity 0.15s",
  },
  emptyState: { textAlign: "center", padding: "80px 24px" },
  emptyStateIcon: { fontSize: 40, margin: 0, color: "var(--opal-muted)" },
  emptyStateTitle: {
    fontSize: 20, fontWeight: 700, color: "var(--opal-text)",
    margin: "12px 0 6px", fontFamily: "var(--font-display)",
  },
  emptyStateHint: { fontSize: 14, color: "var(--opal-sub)", marginBottom: 20 },
  emptyStateClear: {
    padding: "10px 24px", background: "var(--opal-violet)", color: "#0a0a0f",
    border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700,
    cursor: "pointer", fontFamily: "var(--font-body)",
  },
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(10,10,15,0.6)", backdropFilter: "blur(4px)",
    zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
  },
  detailModal: {
    width: "100%", maxWidth: 620, maxHeight: "90vh", overflowY: "auto",
    boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
  },
  detailImgWrap: { position: "relative", height: 280 },
  detailImg: { width: "100%", height: "100%", objectFit: "cover", display: "block", borderRadius: "16px 16px 0 0" },
  detailImgOverlay: {
    position: "absolute", inset: 0,
    background: "linear-gradient(to top, rgba(10,10,15,0.75) 0%, transparent 60%)",
    borderRadius: "16px 16px 0 0",
  },
  detailCloseBtn: {
    position: "absolute", top: 14, right: 14,
    width: 32, height: 32, borderRadius: "50%",
    background: "rgba(10,10,15,0.6)", backdropFilter: "blur(8px)",
    border: "1px solid var(--opal-border)", color: "var(--opal-text)",
    fontSize: 18, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  detailHeroContent: { position: "absolute", bottom: 16, left: 20, right: 20 },
  detailHeroArea: { color: "rgba(232,230,240,0.8)", fontSize: 12, margin: "0 0 4px", fontWeight: 500 },
  detailHeroName: {
    color: "var(--opal-text)", fontSize: 22, fontWeight: 700,
    margin: "0 0 4px", fontFamily: "var(--font-display)", letterSpacing: -0.3,
  },
  detailHeroPrice: { color: "var(--opal-text)", fontSize: 18, fontWeight: 600, margin: 0 },
  detailBody: { padding: "20px 24px 28px" },
  detailStatsRow: { display: "flex", padding: "14px 0", marginBottom: 20 },
  detailStat: { flex: 1, textAlign: "center" },
  detailStatVal: {
    display: "block", fontSize: 20, fontWeight: 700,
    color: "var(--opal-text)", fontFamily: "var(--font-display)",
  },
  detailStatLabel: { display: "block", fontSize: 11, color: "var(--opal-muted)", marginTop: 2 },
  detailStatDiv: { width: 1, background: "var(--opal-border)" },
  detailSection: { marginBottom: 20 },
  detailSectionLabel: {
    fontSize: 11, fontWeight: 700, color: "var(--opal-violet)",
    textTransform: "uppercase", margin: "0 0 8px", letterSpacing: 0.8,
  },
  detailDesc: { fontSize: 14, color: "var(--opal-sub)", lineHeight: 1.6, margin: 0 },
  detailAmenitiesGrid: { display: "flex", flexWrap: "wrap", gap: 6 },
  detailCTA: { marginTop: 18 },
  submitBookingBtn: {
    width: "100%", padding: "13px 0", border: "none", borderRadius: 12,
    background: "linear-gradient(135deg, var(--opal-violet) 0%, var(--opal-teal) 100%)",
    color: "#0a0a0f", fontSize: 15, fontWeight: 700,
    cursor: "pointer", fontFamily: "var(--font-body)",
  },
  bookingForm: { borderTop: "1px solid var(--opal-border)", paddingTop: 18 },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10, marginTop: 4, marginBottom: 10,
  },
  formLabel: {
    display: "flex", flexDirection: "column", gap: 6,
    fontSize: 12, fontWeight: 600, color: "var(--opal-sub)", marginBottom: 10,
  },
  formInput: {
    border: "1px solid var(--opal-border)", borderRadius: 10,
    padding: "9px 10px", fontSize: 14, color: "var(--opal-text)",
    background: "var(--opal-surface)", fontFamily: "var(--font-body)", outline: "none",
  },
  formError: { color: "var(--opal-red)", fontSize: 13, margin: "4px 0 0" },
  selectedDatesRow: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 },
  selectedDateChip: {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "4px 8px 4px 10px", borderRadius: 20,
    background: "var(--opal-violet)", color: "#0a0a0f",
    fontSize: 12, fontWeight: 500,
  },
  selectedDateChipRemove: {
    background: "rgba(10,10,15,0.25)", border: "none", color: "#0a0a0f",
    borderRadius: "50%", width: 16, height: 16, fontSize: 11, lineHeight: 1,
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
  },
};