import { useState, useEffect, useRef } from "react";
import {
  getMyVenues,
  createVenue,
  updateVenue,
  deleteVenue,
  deactivateVenue,
} from "../services/serviceVenue";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const AMENITY_OPTIONS = ["Parking", "Outdoor Area", "Stage", "Wi-Fi", "Catering", "AV Equipment", "Dressing Room"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDay(year, month) {
  return new Date(year, month, 1).getDay();
}
function toKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

// ─── Mini Calendar ───────────────────────────────────────────────────────────

function BookingCalendar({ bookedDates = [], selectedDates = [], onToggle }) {
  const today = new Date();
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });

  const bookedKeys   = new Set(bookedDates.map(b => toKey(new Date(b.date))));
  const selectedKeys = new Set(selectedDates.map(d => toKey(new Date(d))));

  const daysInMonth = getDaysInMonth(view.year, view.month);
  const firstDay    = getFirstDay(view.year, view.month);

  const prevMonth = () => setView(v => v.month === 0 ? { year: v.year-1, month: 11 } : { ...v, month: v.month-1 });
  const nextMonth = () => setView(v => v.month === 11 ? { year: v.year+1, month: 0 } : { ...v, month: v.month+1 });

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div style={styles.cal}>
      <div style={styles.calHeader}>
        <button style={styles.calNav} onClick={prevMonth}>‹</button>
        <span style={styles.calTitle}>{MONTHS[view.month]} {view.year}</span>
        <button style={styles.calNav} onClick={nextMonth}>›</button>
      </div>
      <div style={styles.calGrid}>
        {DAYS.map(d => <div key={d} style={styles.calDayLabel}>{d}</div>)}
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const date    = new Date(view.year, view.month, day);
          const key     = toKey(date);
          const isPast  = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const booked  = bookedKeys.has(key);
          const sel     = selectedKeys.has(key);

          let bg = "transparent", color = "#1a1a2e", cursor = "pointer", border = "1px solid transparent";
          if (isPast)  { bg = "transparent"; color = "#ccc"; cursor = "default"; }
          if (booked)  { bg = "#fee2e2"; color = "#ef4444"; cursor = "not-allowed"; }
          if (sel)     { bg = "#6366f1"; color = "#fff"; border = "1px solid #6366f1"; }

          return (
            <div
              key={key}
              onClick={() => !isPast && !booked && onToggle && onToggle(date)}
              style={{ ...styles.calCell, background: bg, color, cursor, border, borderRadius: 8 }}
            >
              {day}
            </div>
          );
        })}
      </div>
      <div style={styles.calLegend}>
        <span style={styles.legendItem}><span style={{...styles.dot, background:"#fee2e2", border:"1px solid #ef4444"}} /> Booked</span>
        <span style={styles.legendItem}><span style={{...styles.dot, background:"#6366f1"}} /> Selected</span>
      </div>
    </div>
  );
}

// ─── Venue Form ──────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: "", description: "",
  city: "", area: "", address: "",
  capacity: "", dimensionsSqm: "",
  amenities: [],
  basePrice: "", currency: "EGP", pricingUnit: "per_event",
};

function VenueForm({ initial, onSave, onCancel }) {
const [form, setForm] = useState(initial ? {
    name:         initial.name         || '',
    description:  initial.description  || '',
    city:         initial.location?.city    || '',
    area:         initial.location?.area    || '',
    address:      initial.location?.address || '',
    capacity:     initial.capacity          || '',
    dimensionsSqm:initial.dimensionsSqm     || '',
    amenities:    initial.amenities         || [],
    basePrice:    initial.pricing?.basePrice    || '',
    currency:     initial.pricing?.currency     || 'EGP',
    pricingUnit:  initial.pricing?.pricingUnit  || 'per_event',
} : EMPTY_FORM);
  const [photoFiles,   setPhotoFiles]   = useState([]);
  const [photoPreviews,setPhotoPreviews]= useState([]);
  const [bookedDates,  setBookedDates]  = useState(initial?.bookedDates || []);
  const [selectedDates,setSelectedDates]= useState([]);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const fileRef = useRef();

  const isEdit = !!initial?._id;

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  function toggleAmenity(a) {
    setForm(f => ({
      ...f,
      amenities: f.amenities.includes(a)
        ? f.amenities.filter(x => x !== a)
        : [...f.amenities, a],
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

  function toggleDate(date) {
    const key = toKey(date);
    setSelectedDates(prev =>
      prev.some(d => toKey(new Date(d)) === key)
        ? prev.filter(d => toKey(new Date(d)) !== key)
        : [...prev, date]
    );
  }

  async function handleSubmit() {
    if (!form.name || !form.city || !form.capacity || !form.basePrice) {
      setError("Name, city, capacity and base price are required.");
      return;
    }
    setLoading(true); setError("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === "amenities") fd.append(k, JSON.stringify(v));
        else fd.append(k, v);
      });
      photoFiles.forEach(f => fd.append("photos", f));
        if (selectedDates.length) {
            fd.append("bookedDates", JSON.stringify(
                selectedDates.map(d => new Date(d).toISOString())
            ));
        }

      if (isEdit) await updateVenue(initial._id, fd);
      else        await createVenue(fd);

      onSave();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>{isEdit ? "Edit Venue" : "New Venue"}</h2>
          <button style={styles.closeBtn} onClick={onCancel}>✕</button>
        </div>

        <div style={styles.modalBody}>

          {/* ── Basic Info ── */}
          <p style={styles.sectionLabel}>Basic Info</p>
          <div style={styles.row}>
            <div style={styles.fieldFull}>
              <label style={styles.label}>Venue Name *</label>
              <input style={styles.input} value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Nile Garden Hall" />
            </div>
          </div>
          <div style={styles.fieldFull}>
            <label style={styles.label}>Description</label>
            <textarea style={{...styles.input, height:80, resize:"vertical"}} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Describe the venue..." />
          </div>

          {/* ── Location ── */}
          <p style={styles.sectionLabel}>Location</p>
          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>City *</label>
              <input style={styles.input} value={form.city} onChange={e => set("city", e.target.value)} placeholder="Cairo" />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Area</label>
              <input style={styles.input} value={form.area} onChange={e => set("area", e.target.value)} placeholder="Maadi" />
            </div>
          </div>
          <div style={styles.fieldFull}>
            <label style={styles.label}>Address</label>
            <input style={styles.input} value={form.address} onChange={e => set("address", e.target.value)} placeholder="Corniche El Maadi" />
          </div>

          {/* ── Specs ── */}
          <p style={styles.sectionLabel}>Specs</p>
          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Capacity *</label>
              <input style={styles.input} type="number" value={form.capacity} onChange={e => set("capacity", e.target.value)} placeholder="250" />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Area (sqm)</label>
              <input style={styles.input} type="number" value={form.dimensionsSqm} onChange={e => set("dimensionsSqm", e.target.value)} placeholder="600" />
            </div>
          </div>

          {/* ── Amenities ── */}
          <p style={styles.sectionLabel}>Amenities</p>
          <div style={styles.chipRow}>
            {AMENITY_OPTIONS.map(a => (
              <button
                key={a}
                onClick={() => toggleAmenity(a)}
                style={{ ...styles.chip, ...(form.amenities.includes(a) ? styles.chipActive : {}) }}
              >
                {a}
              </button>
            ))}
          </div>

          {/* ── Pricing ── */}
          <p style={styles.sectionLabel}>Pricing</p>
          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Base Price *</label>
              <input style={styles.input} type="number" value={form.basePrice} onChange={e => set("basePrice", e.target.value)} placeholder="35000" />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Currency</label>
              <select style={styles.input} value={form.currency} onChange={e => set("currency", e.target.value)}>
                <option>EGP</option><option>USD</option><option>EUR</option>
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Pricing Unit</label>
              <select style={styles.input} value={form.pricingUnit} onChange={e => set("pricingUnit", e.target.value)}>
                <option value="per_event">Per Event</option>
                <option value="per_day">Per Day</option>
                <option value="per_hour">Per Hour</option>
              </select>
            </div>
          </div>

          {/* ── Photos ── */}
          <p style={styles.sectionLabel}>Photos</p>
          <div style={styles.photoGrid}>
            {/* Existing photos from edit */}
            {(initial?.photos || []).map((p, i) => (
              <div key={`ex-${i}`} style={styles.photoThumb}>
                <img src={p.url} alt="" style={styles.thumbImg} />
              </div>
            ))}
            {/* New uploads */}
            {photoPreviews.map((src, i) => (
              <div key={`new-${i}`} style={styles.photoThumb}>
                <img src={src} alt="" style={styles.thumbImg} />
                <button style={styles.removePhoto} onClick={() => removePhoto(i)}>✕</button>
              </div>
            ))}
            <button style={styles.uploadBox} onClick={() => fileRef.current.click()}>
              <span style={{ fontSize: 28, color: "#6366f1" }}>+</span>
              <span style={{ fontSize: 12, color: "#888", marginTop: 4 }}>Add photo</span>
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple style={{ display:"none" }} onChange={onFileChange} />

          {/* ── Availability Calendar ── */}
          <p style={styles.sectionLabel}>Block Dates</p>
          <p style={{ fontSize: 12, color: "#888", marginBottom: 12 }}>Click dates to mark them as unavailable.</p>
          <BookingCalendar
            bookedDates={bookedDates}
            selectedDates={selectedDates}
            onToggle={toggleDate}
          />

          {error && <p style={styles.error}>{error}</p>}

          <div style={styles.formActions}>
            <button style={styles.cancelBtn} onClick={onCancel}>Cancel</button>
            <button style={styles.saveBtn} onClick={handleSubmit} disabled={loading}>
              {loading ? "Saving..." : isEdit ? "Save Changes" : "Create Venue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Venue Card ──────────────────────────────────────────────────────────────

function VenueCard({ venue, onEdit, onDelete, onDeactivate }) {
  const [confirming, setConfirming] = useState(null); // 'delete' | 'deactivate'

  return (
    <div style={styles.card}>
      {venue.photos?.[0] && (
        <img src={venue.photos[0].url} alt={venue.name} style={styles.cardImg} />
      )}
      {!venue.photos?.[0] && (
        <div style={styles.cardImgPlaceholder}>
          <span style={{ fontSize: 32 }}>🏛️</span>
        </div>
      )}
      <div style={styles.cardBody}>
        <div style={styles.cardTop}>
          <div>
            <h3 style={styles.cardName}>{venue.name}</h3>
            <p style={styles.cardLocation}>{[venue.location?.area, venue.location?.city].filter(Boolean).join(", ")}</p>
          </div>
          <span style={{ ...styles.badge, ...(venue.isActive ? styles.badgeGreen : styles.badgeGray) }}>
            {venue.isActive ? "Active" : "Inactive"}
          </span>
        </div>
        <p style={styles.cardDesc}>{venue.description}</p>
        <div style={styles.cardMeta}>
          <span>👥 {venue.capacity}</span>
          <span>📐 {venue.dimensionsSqm} sqm</span>
          <span>💰 {venue.pricing?.basePrice?.toLocaleString()} {venue.pricing?.currency}</span>
        </div>

        {confirming === "delete" ? (
          <div style={styles.confirmRow}>
            <span style={{ fontSize: 13, color: "#ef4444" }}>Delete this venue?</span>
            <button style={styles.confirmYes} onClick={() => { onDelete(venue._id); setConfirming(null); }}>Yes, delete</button>
            <button style={styles.confirmNo}  onClick={() => setConfirming(null)}>Cancel</button>
          </div>
        ) : confirming === "deactivate" ? (
          <div style={styles.confirmRow}>
            <span style={{ fontSize: 13, color: "#f59e0b" }}>Deactivate this venue?</span>
            <button style={styles.confirmYes} onClick={() => { onDeactivate(venue._id); setConfirming(null); }}>Yes</button>
            <button style={styles.confirmNo}  onClick={() => setConfirming(null)}>Cancel</button>
          </div>
        ) : (
          <div style={styles.cardActions}>
            <button style={styles.editBtn}       onClick={() => onEdit(venue)}>Edit</button>
            <button style={styles.deactivateBtn} onClick={() => setConfirming("deactivate")}>Deactivate</button>
            <button style={styles.deleteBtn}     onClick={() => setConfirming("delete")}>Delete</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function VenuesPage() {
  const [venues,    setVenues]    = useState([]);
  const [filtered,  setFiltered]  = useState([]);
  const [search,    setSearch]    = useState("");
  const [filter,    setFilter]    = useState("all");   // all | active | inactive
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [editing,   setEditing]   = useState(null);

  async function load() {
    setLoading(true);
    try {
      const { venues } = await getMyVenues();
      setVenues(venues);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    let list = venues;
    if (filter === "active")   list = list.filter(v => v.isActive);
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

  async function handleDelete(id) {
    try { await deleteVenue(id); load(); } catch (e) { console.error(e); }
  }

  async function handleDeactivate(id) {
    try { await deactivateVenue(id); load(); } catch (e) { console.error(e); }
  }

  return (
    <div style={styles.page}>

      {/* ── Header ── */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>My Venues</h1>
          <p style={styles.pageSubtitle}>{venues.length} listing{venues.length !== 1 ? "s" : ""}</p>
        </div>
        <button style={styles.newBtn} onClick={() => { setEditing(null); setShowForm(true); }}>
          + New Venue
        </button>
      </div>

      {/* ── Search + Filters ── */}
      <div style={styles.toolbar}>
        <div style={styles.searchWrap}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            style={styles.searchInput}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, city or area..."
          />
          {search && (
            <button style={styles.clearSearch} onClick={() => setSearch("")}>✕</button>
          )}
        </div>
        <div style={styles.filters}>
          {["all","active","inactive"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{ ...styles.filterBtn, ...(filter === f ? styles.filterBtnActive : {}) }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Venue Grid ── */}
      {loading ? (
        <div style={styles.center}><p style={{ color: "#888" }}>Loading venues...</p></div>
      ) : filtered.length === 0 ? (
        <div style={styles.empty}>
          <p style={styles.emptyIcon}>🏛️</p>
          <p style={styles.emptyTitle}>{search ? "No venues match your search" : "No venues yet"}</p>
          <p style={styles.emptyHint}>{search ? "Try a different search term." : "Create your first listing to get started."}</p>
          {!search && (
            <button style={styles.newBtn} onClick={() => { setEditing(null); setShowForm(true); }}>
              + New Venue
            </button>
          )}
        </div>
      ) : (
        <div style={styles.grid}>
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

      {/* ── Form Modal ── */}
      {showForm && (
        <VenueForm
          initial={editing}
          onSave={() => { setShowForm(false); setEditing(null); load(); }}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = {
  page:           { minHeight:"100vh", background:"#f8f8fb", fontFamily:"Inter, system-ui, sans-serif", padding:"32px 24px" },
  pageHeader:     { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 },
  pageTitle:      { fontSize:28, fontWeight:700, color:"#1a1a2e", margin:0 },
  pageSubtitle:   { fontSize:14, color:"#888", margin:"4px 0 0" },

  toolbar:        { display:"flex", gap:16, marginBottom:28, flexWrap:"wrap" },
  searchWrap:     { position:"relative", flex:1, minWidth:220 },
  searchIcon:     { position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:14 },
  searchInput:    { width:"100%", padding:"10px 36px", border:"1px solid #e5e7eb", borderRadius:10, fontSize:14, background:"#fff", outline:"none", boxSizing:"border-box" },
  clearSearch:    { position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#aaa", fontSize:14 },
  filters:        { display:"flex", gap:8 },
  filterBtn:      { padding:"10px 18px", border:"1px solid #e5e7eb", borderRadius:10, background:"#fff", fontSize:13, cursor:"pointer", color:"#555", fontWeight:500 },
  filterBtnActive:{ background:"#6366f1", color:"#fff", borderColor:"#6366f1" },

  newBtn:         { padding:"10px 20px", background:"#6366f1", color:"#fff", border:"none", borderRadius:10, fontSize:14, fontWeight:600, cursor:"pointer" },

  grid:           { display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(320px, 1fr))", gap:20 },

  card:           { background:"#fff", borderRadius:14, overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,0.06)", border:"1px solid #f0f0f5" },
  cardImg:        { width:"100%", height:180, objectFit:"cover" },
  cardImgPlaceholder: { width:"100%", height:180, background:"#f3f4f6", display:"flex", alignItems:"center", justifyContent:"center" },
  cardBody:       { padding:16 },
  cardTop:        { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 },
  cardName:       { fontSize:16, fontWeight:700, color:"#1a1a2e", margin:0 },
  cardLocation:   { fontSize:12, color:"#888", margin:"2px 0 0" },
  cardDesc:       { fontSize:13, color:"#555", marginBottom:12, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" },
  cardMeta:       { display:"flex", gap:12, fontSize:12, color:"#666", marginBottom:14, flexWrap:"wrap" },
  cardActions:    { display:"flex", gap:8 },
  badge:          { fontSize:11, fontWeight:600, padding:"3px 10px", borderRadius:20 },
  badgeGreen:     { background:"#dcfce7", color:"#16a34a" },
  badgeGray:      { background:"#f3f4f6", color:"#888" },

  editBtn:        { flex:1, padding:"8px 0", border:"1px solid #6366f1", borderRadius:8, background:"transparent", color:"#6366f1", fontSize:13, fontWeight:600, cursor:"pointer" },
  deactivateBtn:  { flex:1, padding:"8px 0", border:"1px solid #f59e0b", borderRadius:8, background:"transparent", color:"#f59e0b", fontSize:13, fontWeight:600, cursor:"pointer" },
  deleteBtn:      { flex:1, padding:"8px 0", border:"1px solid #ef4444", borderRadius:8, background:"transparent", color:"#ef4444", fontSize:13, fontWeight:600, cursor:"pointer" },

  confirmRow:     { display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" },
  confirmYes:     { padding:"6px 12px", background:"#ef4444", color:"#fff", border:"none", borderRadius:6, fontSize:12, cursor:"pointer" },
  confirmNo:      { padding:"6px 12px", background:"#f3f4f6", color:"#555", border:"none", borderRadius:6, fontSize:12, cursor:"pointer" },

  center:         { display:"flex", justifyContent:"center", padding:60 },
  empty:          { textAlign:"center", padding:80 },
  emptyIcon:      { fontSize:48, margin:0 },
  emptyTitle:     { fontSize:18, fontWeight:600, color:"#1a1a2e", margin:"12px 0 4px" },
  emptyHint:      { fontSize:14, color:"#888", marginBottom:20 },

  // Modal
  overlay:        { position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 },
  modal:          { background:"#fff", borderRadius:16, width:"100%", maxWidth:680, maxHeight:"90vh", display:"flex", flexDirection:"column", overflow:"hidden" },
  modalHeader:    { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"20px 24px", borderBottom:"1px solid #f0f0f5" },
  modalTitle:     { fontSize:20, fontWeight:700, color:"#1a1a2e", margin:0 },
  closeBtn:       { background:"none", border:"none", fontSize:18, cursor:"pointer", color:"#888" },
  modalBody:      { overflowY:"auto", padding:"20px 24px", flex:1 },

  sectionLabel:   { fontSize:11, fontWeight:700, letterSpacing:"0.08em", color:"#6366f1", textTransform:"uppercase", margin:"20px 0 10px" },
  row:            { display:"flex", gap:12, marginBottom:12 },
  field:          { flex:1 },
  fieldFull:      { flex:1, marginBottom:12 },
  label:          { display:"block", fontSize:12, fontWeight:600, color:"#555", marginBottom:4 },
  input:          { width:"100%", padding:"9px 12px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:14, outline:"none", boxSizing:"border-box", background:"#fafafa" },

  chipRow:        { display:"flex", flexWrap:"wrap", gap:8, marginBottom:4 },
  chip:           { padding:"6px 14px", border:"1px solid #e5e7eb", borderRadius:20, fontSize:13, cursor:"pointer", background:"#fafafa", color:"#555" },
  chipActive:     { background:"#ede9fe", color:"#6366f1", borderColor:"#6366f1" },

  photoGrid:      { display:"flex", flexWrap:"wrap", gap:10, marginBottom:4 },
  photoThumb:     { position:"relative", width:80, height:80, borderRadius:8, overflow:"hidden", border:"1px solid #e5e7eb" },
  thumbImg:       { width:"100%", height:"100%", objectFit:"cover" },
  removePhoto:    { position:"absolute", top:2, right:2, background:"rgba(0,0,0,0.5)", border:"none", color:"#fff", borderRadius:"50%", width:18, height:18, fontSize:10, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" },
  uploadBox:      { width:80, height:80, border:"2px dashed #d1d5db", borderRadius:8, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", background:"#fafafa" },

  formActions:    { display:"flex", gap:12, justifyContent:"flex-end", marginTop:24, paddingTop:16, borderTop:"1px solid #f0f0f5" },
  cancelBtn:      { padding:"10px 20px", border:"1px solid #e5e7eb", borderRadius:8, background:"transparent", color:"#555", fontSize:14, cursor:"pointer" },
  saveBtn:        { padding:"10px 24px", background:"#6366f1", color:"#fff", border:"none", borderRadius:8, fontSize:14, fontWeight:600, cursor:"pointer" },

  error:          { color:"#ef4444", fontSize:13, marginTop:8 },

  // Calendar
  cal:            { background:"#fafafa", border:"1px solid #e5e7eb", borderRadius:12, padding:16, maxWidth:360 },
  calHeader:      { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 },
  calTitle:       { fontSize:15, fontWeight:600, color:"#1a1a2e" },
  calNav:         { background:"none", border:"none", fontSize:18, cursor:"pointer", color:"#6366f1", padding:"0 8px" },
  calGrid:        { display:"grid", gridTemplateColumns:"repeat(7, 1fr)", gap:4 },
  calDayLabel:    { fontSize:11, fontWeight:600, color:"#aaa", textAlign:"center", paddingBottom:4 },
  calCell:        { fontSize:13, textAlign:"center", padding:"7px 0", userSelect:"none" },
  calLegend:      { display:"flex", gap:16, marginTop:12, fontSize:12, color:"#666" },
  legendItem:     { display:"flex", alignItems:"center", gap:6 },
  dot:            { width:12, height:12, borderRadius:"50%", display:"inline-block" },
};