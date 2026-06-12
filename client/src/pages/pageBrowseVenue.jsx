import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { requestVenueBooking, searchVenues } from "../services/serviceBrowseVenue";

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
    <div
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

        <button style={css.viewBtn} onClick={() => onViewDetails(venue)}>
          View Details
        </button>
      </div>
    </div>
  );
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function BookingCalendar({ bookedDates = [], selectedDates, onToggleDate }) {
  const today = new Date();
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const bookedKeys = new Set(bookedDates.map((b) => toDateKey(b.date)));
  const selectedKeys = new Set(selectedDates);
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const firstDay = new Date(view.year, view.month, 1).getDay();
  const cells = [];

  for (let i = 0; i < firstDay; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);

  const prevMonth = () => setView((v) => (v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 }));
  const nextMonth = () => setView((v) => (v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 }));

  return (
    <div style={css.miniCal}>
      <div style={css.miniCalHeader}>
        <button type="button" style={css.calNavBtn} onClick={prevMonth}>{"<"}</button>
        <span style={css.calMonthLabel}>{MONTHS[view.month]} {view.year}</span>
        <button type="button" style={css.calNavBtn} onClick={nextMonth}>{">"}</button>
      </div>
      <div style={css.calGrid7}>
        {DAYS.map((d) => <div key={d} style={css.calDayHead}>{d}</div>)}
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;

          const key = `${view.year}-${String(view.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const booked = bookedKeys.has(key);
          const selected = selectedKeys.has(key);
          const dateObj = new Date(view.year, view.month, day);
          const isPast = dateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const disabled = booked || isPast;

          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => onToggleDate(key)}
              style={{
                ...css.calDay,
                background: booked ? "#FF3B30" : selected ? "#007AFF" : "transparent",
                color: booked || selected ? "#fff" : isPast ? "#C7C7CC" : "#1C1C1E",
                cursor: disabled ? "not-allowed" : "pointer",
                fontWeight: booked || selected ? 600 : 400,
              }}
            >
              {day}
            </button>
          );
        })}
      </div>
      <div style={css.calLegendRow}>
        <span style={css.calLegendItem}><span style={{ ...css.calLegendDot, background: "#FF3B30" }} /> Booked</span>
        <span style={css.calLegendItem}><span style={{ ...css.calLegendDot, background: "#007AFF" }} /> Selected</span>
      </div>
    </div>
  );
}

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

  const toggleDate = (key) => {
    setError("");
    setSelectedDates((prev) => (
      prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key].sort()
    ));
  };

  const submitBooking = async (event) => {
    event.preventDefault();

    if (selectedDates.length === 0) {
      setError("Select at least one date.");
      return;
    }

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
      <div style={css.detailModal} onClick={(e) => e.stopPropagation()}>
        <div style={css.detailImgWrap}>
          {photoUrl ? (
            <img src={photoUrl} alt={venue.name} style={css.detailImg} />
          ) : (
            <div style={{ ...css.detailImg, background: "#F2F2F7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>Venue</div>
          )}
          <div style={css.detailImgOverlay} />
          <button style={css.detailCloseBtn} onClick={onClose}>x</button>
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
          <div style={css.detailStatsRow}>
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
          </div>

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
              {(venue.amenities ?? []).map((a) => (
                <AmenityPill key={a} label={a} />
              ))}
            </div>
          </div>

          <form style={css.bookingForm} onSubmit={submitBooking}>
            <p style={css.detailSectionLabel}>Select date(s) for your event</p>
            <BookingCalendar
              bookedDates={venue.bookedDates}
              selectedDates={selectedDates}
              onToggleDate={toggleDate}
            />

            {selectedDates.length > 0 && (
              <div style={css.selectedDatesRow}>
                {selectedDates.map((d) => (
                  <span key={d} style={css.selectedDateChip}>
                    {new Date(`${d}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    <button type="button" style={css.selectedDateChipRemove} onClick={() => toggleDate(d)}>x</button>
                  </span>
                ))}
              </div>
            )}

            <p style={{ ...css.detailSectionLabel, marginTop: 20 }}>Request booking</p>
            <div style={css.formGrid}>
              <label style={css.formLabel}>
                Event type
                <select
                  style={css.formInput}
                  value={form.eventType}
                  onChange={(e) => updateField("eventType", e.target.value)}
                  required
                >
                  {EVENT_TYPES.map((type) => (
                    <option key={type} value={type}>{type.replaceAll("_", " ")}</option>
                  ))}
                </select>
              </label>
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
              <label style={css.formLabel}>
                Currency
                <input
                  style={css.formInput}
                  value={form.proposedCurrency}
                  onChange={(e) => updateField("proposedCurrency", e.target.value)}
                />
              </label>
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
                {submitting ? "Sending..." : "Send Booking Request"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function VenueDiscovery() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [minCapacity, setMinCapacity] = useState("");
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

    if (lastFetchedQuery.current === normalizedSearch) {
      return;
    }

    lastFetchedQuery.current = normalizedSearch;
    const currentRequestId = requestId.current + 1;
    requestId.current = currentRequestId;
    setLoading(true);

    try {
      const data = await searchVenues(normalizedSearch);

      if (requestId.current === currentRequestId) {
        setVenues(Array.isArray(data) ? data : []);
      }
    } catch {
      if (requestId.current === currentRequestId) {
        showToast("Failed to load venues.", "error");
      }
    } finally {
      if (requestId.current === currentRequestId) {
        setLoading(false);
      }
    }
  }, [showToast]);

  useEffect(() => {
    loadVenues("");
  }, [loadVenues]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadVenues(search);
    }, 800);

    return () => clearTimeout(timeoutId);
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

  const toggleAmenityFilter = (a) => {
    setAmenityFilter((prev) => (
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    ));
  };

  const filtered = useMemo(() => {
    let list = venues.filter((v) => v.isActive !== false);

    if (locationSearch.trim()) {
      const q = locationSearch.trim().toLowerCase();
      list = list.filter((v) => {
        const loc = [v.location?.area, v.location?.city, v.location?.address]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return loc.includes(q);
      });
    }
    if (dateFilter) {
      list = list.filter((v) => isVenueAvailableOn(v, dateFilter));
    }
    if (minCapacity) {
      list = list.filter((v) => Number(v.capacity ?? 0) >= parseInt(minCapacity, 10));
    }
    if (amenityFilter.length) {
      list = list.filter((v) => amenityFilter.every((a) => (v.amenities ?? []).includes(a)));
    }

    if (sortBy === "price_asc") list = [...list].sort((a, b) => (a.pricing?.basePrice ?? 0) - (b.pricing?.basePrice ?? 0));
    if (sortBy === "price_desc") list = [...list].sort((a, b) => (b.pricing?.basePrice ?? 0) - (a.pricing?.basePrice ?? 0));
    if (sortBy === "capacity") list = [...list].sort((a, b) => (b.capacity ?? 0) - (a.capacity ?? 0));

    return list;
  }, [venues, locationSearch, dateFilter, minCapacity, amenityFilter, sortBy]);

  const activeFilterCount = [
    locationSearch.trim(),
    dateFilter,
    minCapacity,
    amenityFilter.length > 0,
  ].filter(Boolean).length;

  return (
    <div style={css.page}>
      {toast && <div style={{ ...css.toast, ...(toast.type === "error" ? css.toastError : {}) }}>{toast.message}</div>}

      <header style={css.header}>
        <div style={css.headerInner}>
          <div style={css.headerLeft}>
            <div style={css.logoMark}>P</div>
            <div>
              <h1 style={css.siteName}>PopEyez</h1>
              <p style={css.siteTagline}>Find your perfect venue</p>
            </div>
          </div>
        </div>
      </header>

      <div style={css.searchBar}>
        <div style={css.searchBarInner}>
          <div style={css.searchFieldWrap}>
            <span style={css.searchFieldIcon}>?</span>
            <input
              style={css.searchField}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search venues"
            />
            {search && <button style={css.clearBtn} onClick={() => setSearch("")}>x</button>}
          </div>

          <div style={css.searchFieldWrap}>
            <span style={css.searchFieldIcon}>Loc</span>
            <input
              style={css.searchField}
              value={locationSearch}
              onChange={(e) => setLocationSearch(e.target.value)}
              placeholder="Search location (area, city)"
              list="location-suggestions"
            />
            {locationSearch && <button style={css.clearBtn} onClick={() => setLocationSearch("")}>x</button>}
            <datalist id="location-suggestions">
              {locationSuggestions.map((l) => <option key={l} value={l} />)}
            </datalist>
          </div>

          <div style={css.selectWrap}>
            <span style={css.selectIcon}>Date</span>
            <input
              type="date"
              style={{ ...css.selectField, colorScheme: "light" }}
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>

          <button
            style={{ ...css.moreFiltersBtn, ...(filtersExpanded || activeFilterCount > 1 ? css.moreFiltersBtnActive : {}) }}
            onClick={() => setFiltersExpanded((v) => !v)}
          >
            Filters {activeFilterCount > 0 && <span style={css.filterCountBadge}>{activeFilterCount}</span>}
          </button>

          <div style={css.selectWrap}>
            <select style={{ ...css.selectField, minWidth: 130, paddingLeft: 10 }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="default">Sort: Default</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="capacity">Capacity</option>
            </select>
          </div>
        </div>

        {filtersExpanded && (
          <div style={css.expandedFilters}>
            <div style={css.expandedFilterGroup}>
            </div>
            {amenityOptions.length > 0 && (
              <div style={css.expandedFilterGroup}>
                <label style={css.expandedFilterLabel}>Must-have Amenities</label>
                <div style={css.expandedAmenityRow}>
                  {amenityOptions.map((a) => (
                    <button
                      key={a}
                      onClick={() => toggleAmenityFilter(a)}
                      style={{
                        ...css.amenityFilterChip,
                        ...(amenityFilter.includes(a) ? css.amenityFilterChipActive : {}),
                      }}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {activeFilterCount > 0 && (
              <button
                style={css.clearAllBtn}
                onClick={() => {
                  setLocationSearch("");
                  setDateFilter("");
                  setMinCapacity("");
                  setAmenityFilter([]);
                }}
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      <div style={css.resultsHeader}>
        <p style={css.resultsCount}>
          {loading ? "Loading venues..." : (
            <>
              <strong>{filtered.length}</strong> venue{filtered.length !== 1 ? "s" : ""} found
              {dateFilter && <span style={css.resultsDateTag}> - available on {new Date(`${dateFilter}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>}
            </>
          )}
        </p>
      </div>

      {!loading && filtered.length === 0 ? (
        <div style={css.emptyState}>
          <p style={css.emptyStateIcon}>No venues</p>
          <p style={css.emptyStateTitle}>No venues match your criteria</p>
          <p style={css.emptyStateHint}>Try adjusting your filters or choosing a different date.</p>
          <button
            style={css.emptyStateClear}
            onClick={() => {
              setSearch("");
              setLocationSearch("");
              setDateFilter("");
              setMinCapacity("");
              setAmenityFilter([]);
            }}
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div style={css.grid}>
          {filtered.map((v) => (
            <VenueCard
              key={v._id}
              venue={v}
              onViewDetails={setDetailVenue}
            />
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

const css = {
  page: {
    minHeight: "100vh",
    background: "#F2F2F7",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif",
    WebkitFontSmoothing: "antialiased",
  },
  toast: {
    position: "fixed",
    top: 18,
    right: 18,
    zIndex: 900,
    background: "#1C1C1E",
    color: "#fff",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 13,
    boxShadow: "0 8px 26px rgba(0,0,0,0.18)",
  },
  toastError: { background: "#FF3B30" },
  header: {
    background: "rgba(255,255,255,0.85)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderBottom: "0.5px solid rgba(0,0,0,0.1)",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  headerInner: {
    maxWidth: 1280,
    margin: "0 auto",
    padding: "12px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: "linear-gradient(135deg, #007AFF 0%, #5856D6 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: 16,
    fontWeight: 700,
    boxShadow: "0 2px 8px rgba(0,122,255,0.3)",
  },
  siteName: { fontSize: 18, fontWeight: 700, color: "#1C1C1E", margin: 0 },
  siteTagline: { fontSize: 11, color: "#8E8E93", margin: 0, marginTop: 1 },
  searchBar: {
    background: "rgba(255,255,255,0.9)",
    backdropFilter: "blur(20px)",
    borderBottom: "0.5px solid rgba(0,0,0,0.08)",
    padding: "16px 24px",
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
    flex: "1 1 240px",
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  searchFieldIcon: { position: "absolute", left: 12, fontSize: 14, pointerEvents: "none" },
  searchField: {
    width: "100%",
    padding: "9px 36px",
    border: "1px solid #E5E5EA",
    borderRadius: 10,
    fontSize: 14,
    background: "#F2F2F7",
    outline: "none",
    color: "#1C1C1E",
    boxSizing: "border-box",
  },
  clearBtn: {
    position: "absolute",
    right: 10,
    background: "none",
    border: "none",
    color: "#8E8E93",
    fontSize: 16,
    cursor: "pointer",
  },
  selectWrap: { position: "relative", display: "flex", alignItems: "center" },
  selectIcon: { position: "absolute", left: 10, fontSize: 10, color: "#8E8E93", pointerEvents: "none" },
  selectField: {
    padding: "9px 10px 9px 42px",
    border: "1px solid #E5E5EA",
    borderRadius: 10,
    fontSize: 14,
    background: "#F2F2F7",
    color: "#1C1C1E",
    outline: "none",
    cursor: "pointer",
    appearance: "none",
    WebkitAppearance: "none",
    fontFamily: "inherit",
  },
  moreFiltersBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "9px 14px",
    border: "1px solid #E5E5EA",
    borderRadius: 10,
    fontSize: 14,
    color: "#1C1C1E",
    background: "#F2F2F7",
    cursor: "pointer",
    fontFamily: "inherit",
    position: "relative",
  },
  moreFiltersBtnActive: { background: "#007AFF", color: "#fff", borderColor: "#007AFF" },
  filterCountBadge: {
    background: "#fff",
    color: "#007AFF",
    fontSize: 11,
    fontWeight: 700,
    borderRadius: 10,
    padding: "1px 6px",
    marginLeft: 2,
  },
  expandedFilters: {
    maxWidth: 1280,
    margin: "14px auto 0",
    display: "flex",
    gap: 24,
    alignItems: "flex-start",
    flexWrap: "wrap",
    paddingTop: 14,
    borderTop: "0.5px solid #E5E5EA",
  },
  expandedFilterGroup: { display: "flex", flexDirection: "column", gap: 8 },
  expandedFilterLabel: { fontSize: 12, fontWeight: 600, color: "#8E8E93", textTransform: "uppercase" },
  expandedFilterInput: {
    padding: "8px 12px",
    border: "1px solid #E5E5EA",
    borderRadius: 8,
    fontSize: 14,
    background: "#F2F2F7",
    color: "#1C1C1E",
    outline: "none",
    width: 120,
    fontFamily: "inherit",
  },
  expandedAmenityRow: { display: "flex", flexWrap: "wrap", gap: 6 },
  amenityFilterChip: {
    padding: "6px 12px",
    border: "1px solid #E5E5EA",
    borderRadius: 20,
    fontSize: 13,
    cursor: "pointer",
    background: "#F2F2F7",
    color: "#1C1C1E",
    fontFamily: "inherit",
  },
  amenityFilterChipActive: { background: "#007AFF", color: "#fff", borderColor: "#007AFF" },
  clearAllBtn: {
    padding: "8px 16px",
    border: "1px solid #FF3B30",
    borderRadius: 8,
    fontSize: 13,
    color: "#FF3B30",
    background: "transparent",
    cursor: "pointer",
    fontFamily: "inherit",
    alignSelf: "flex-end",
  },
  resultsHeader: { maxWidth: 1280, margin: "0 auto", padding: "14px 24px 0" },
  resultsCount: { fontSize: 13, color: "#8E8E93", margin: 0 },
  resultsDateTag: { color: "#007AFF" },
  grid: {
    maxWidth: 1280,
    margin: "0 auto",
    padding: "16px 24px 40px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
    gap: 20,
  },
  card: {
    background: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)",
    border: "0.5px solid rgba(0,0,0,0.06)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
  cardHovered: {
    transform: "translateY(-3px)",
    boxShadow: "0 4px 20px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.06)",
  },
  cardImgWrap: { position: "relative", height: 200, overflow: "hidden", flexShrink: 0 },
  cardImg: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  cardImgPlaceholder: {
    width: "100%",
    height: "100%",
    background: "#E5E5EA",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    color: "#636366",
  },
  priceBadge: {
    position: "absolute",
    bottom: 12,
    left: 12,
    background: "rgba(28,28,30,0.8)",
    backdropFilter: "blur(8px)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    padding: "5px 10px",
    borderRadius: 8,
  },
  priceBadgeUnit: { fontWeight: 300, fontSize: 11 },
  cardBody: { padding: "16px 18px 18px", display: "flex", flexDirection: "column", flex: 1 },
  cardLocation: { fontSize: 11, color: "#8E8E93", marginBottom: 4 },
  cardName: { fontSize: 17, fontWeight: 600, color: "#1C1C1E", margin: "0 0 6px" },
  cardDesc: {
    fontSize: 13,
    color: "#636366",
    lineHeight: 1.5,
    marginBottom: 14,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    flexGrow: 1,
  },
  statsRow: { display: "flex", alignItems: "center", marginBottom: 12 },
  stat: { display: "flex", alignItems: "baseline", gap: 3, flex: 1, justifyContent: "center" },
  statVal: { fontSize: 14, fontWeight: 600, color: "#1C1C1E" },
  statLabel: { fontSize: 11, color: "#8E8E93" },
  statDivider: { width: 1, height: 20, background: "#E5E5EA" },
  pillsRow: { display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 },
  amenityPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "3px 9px",
    borderRadius: 20,
    background: "#F2F2F7",
    color: "#3C3C43",
    fontSize: 11,
    fontWeight: 500,
  },
  amenityIcon: {
    width: 14,
    height: 14,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    background: "#E5E5EA",
    fontSize: 8,
    color: "#636366",
  },
  moreAmenities: {
    display: "inline-flex",
    alignItems: "center",
    padding: "3px 9px",
    borderRadius: 20,
    background: "#F2F2F7",
    color: "#007AFF",
    fontSize: 11,
    fontWeight: 600,
  },
  viewBtn: {
    width: "100%",
    padding: "10px 0",
    background: "linear-gradient(135deg, #007AFF 0%, #5856D6 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  emptyState: { textAlign: "center", padding: "80px 24px" },
  emptyStateIcon: { fontSize: 20, margin: 0, color: "#8E8E93" },
  emptyStateTitle: { fontSize: 20, fontWeight: 600, color: "#1C1C1E", margin: "12px 0 6px" },
  emptyStateHint: { fontSize: 14, color: "#8E8E93", marginBottom: 20 },
  emptyStateClear: {
    padding: "10px 24px",
    background: "#007AFF",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    backdropFilter: "blur(4px)",
    zIndex: 500,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  detailModal: {
    background: "#fff",
    borderRadius: 22,
    width: "100%",
    maxWidth: 620,
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 30px 80px rgba(0,0,0,0.25)",
  },
  detailImgWrap: { position: "relative", height: 280 },
  detailImg: { width: "100%", height: "100%", objectFit: "cover", display: "block", borderRadius: "22px 22px 0 0" },
  detailImgOverlay: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)",
    borderRadius: "22px 22px 0 0",
  },
  detailCloseBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "rgba(0,0,0,0.5)",
    backdropFilter: "blur(8px)",
    border: "none",
    color: "#fff",
    fontSize: 18,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  detailHeroContent: { position: "absolute", bottom: 16, left: 20, right: 20 },
  detailHeroArea: { color: "rgba(255,255,255,0.8)", fontSize: 12, margin: "0 0 4px", fontWeight: 500 },
  detailHeroName: { color: "#fff", fontSize: 22, fontWeight: 700, margin: "0 0 4px" },
  detailHeroPrice: { color: "#fff", fontSize: 18, fontWeight: 600, margin: 0 },
  detailBody: { padding: "20px 24px 28px" },
  detailStatsRow: { display: "flex", background: "#F2F2F7", borderRadius: 14, padding: "14px 0", marginBottom: 20 },
  detailStat: { flex: 1, textAlign: "center" },
  detailStatVal: { display: "block", fontSize: 20, fontWeight: 700, color: "#1C1C1E" },
  detailStatLabel: { display: "block", fontSize: 11, color: "#8E8E93", marginTop: 2 },
  detailStatDiv: { width: 1, background: "#E5E5EA" },
  detailSection: { marginBottom: 20 },
  detailSectionLabel: { fontSize: 11, fontWeight: 700, color: "#007AFF", textTransform: "uppercase", margin: "0 0 8px" },
  detailDesc: { fontSize: 14, color: "#3C3C43", lineHeight: 1.6, margin: 0 },
  detailAmenitiesGrid: { display: "flex", flexWrap: "wrap", gap: 6 },
  detailCTA: { marginTop: 18 },
  submitBookingBtn: {
    width: "100%",
    padding: "13px 0",
    border: "none",
    borderRadius: 12,
    background: "#007AFF",
    color: "#fff",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  bookingForm: { borderTop: "0.5px solid #E5E5EA", paddingTop: 18 },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, marginTop: 4 },
  formLabel: { display: "flex", flexDirection: "column", gap: 6, fontSize: 12, fontWeight: 600, color: "#636366", marginBottom: 10 },
  formInput: {
    border: "1px solid #E5E5EA",
    borderRadius: 10,
    padding: "9px 10px",
    fontSize: 14,
    color: "#1C1C1E",
    background: "#F2F2F7",
    fontFamily: "inherit",
    outline: "none",
  },
  formError: { color: "#FF3B30", fontSize: 13, margin: "4px 0 0" },
  miniCal: { background: "#F2F2F7", borderRadius: 14, padding: "14px 16px", maxWidth: 320 },
  miniCalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  calNavBtn: { background: "none", border: "none", fontSize: 20, color: "#007AFF", cursor: "pointer", padding: "0 8px" },
  calMonthLabel: { fontSize: 14, fontWeight: 600, color: "#1C1C1E" },
  calGrid7: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 },
  calDayHead: { fontSize: 10, fontWeight: 600, color: "#8E8E93", textAlign: "center", paddingBottom: 4 },
  calDay: {
    fontSize: 12,
    textAlign: "center",
    padding: "6px 0",
    userSelect: "none",
    border: "none",
    borderRadius: 8,
    fontFamily: "inherit",
  },
  calLegendRow: { display: "flex", gap: 16, marginTop: 10, fontSize: 11, color: "#636366" },
  calLegendItem: { display: "flex", alignItems: "center", gap: 5 },
  calLegendDot: { width: 10, height: 10, borderRadius: "50%", display: "inline-block" },
  selectedDatesRow: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 },
  selectedDateChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 8px 4px 10px",
    borderRadius: 20,
    background: "#007AFF",
    color: "#fff",
    fontSize: 12,
    fontWeight: 500,
  },
  selectedDateChipRemove: {
    background: "rgba(255,255,255,0.25)",
    border: "none",
    color: "#fff",
    borderRadius: "50%",
    width: 16,
    height: 16,
    fontSize: 11,
    lineHeight: 1,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};