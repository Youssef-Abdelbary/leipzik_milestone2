import { useState, useEffect, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// ─── Design tokens (mirrors TabDayOf / componentTheme) ───────────────────────
const P = {
  bg:       '#0a0a0f',
  surface:  'rgba(19,19,30,0.72)',
  border:   'rgba(255,255,255,0.08)',
  text:     '#e8e8f0',
  sub:      'rgba(200,200,220,0.5)',
  muted:    'rgba(200,200,220,0.3)',

  blue:     '#7c5cfc',
  indigo:   '#8b6dff',
  teal:     '#00e5c0',
  cyan:     '#00c9e5',
  amber:    '#f5a623',
  rose:     '#ff4d6d',
  green:    '#22c55e',
  red:      '#ff4d6d',

  blueGlow:  'rgba(124,92,252,0.12)',
  tealGlow:  'rgba(0,229,192,0.12)',
  roseGlow:  'rgba(255,77,109,0.12)',
  redGlow:   'rgba(255,77,109,0.12)',
};

// ─── GlassPanel ──────────────────────────────────────────────────────────────
function GlassPanel({ children, style = {} }) {
  return (
    <div style={{
      background: P.surface,
      backdropFilter: 'blur(18px) saturate(140%)',
      WebkitBackdropFilter: 'blur(18px) saturate(140%)',
      border: `1px solid ${P.border}`,
      borderRadius: 16,
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.3)',
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── Icon button ─────────────────────────────────────────────────────────────
function ActionButton({ onClick, children, accent = false, danger = false }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '8px 14px', borderRadius: 9, fontSize: 13, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.18s',
    border: 'none', outline: 'none',
  };
  const style = accent
    ? { ...base, background: `linear-gradient(135deg, ${P.blue} 0%, ${P.teal} 100%)`, color: '#0a0a0f' }
    : danger
    ? { ...base, background: `${P.rose}22`, color: P.rose, border: `1px solid ${P.rose}44` }
    : { ...base, background: 'transparent', color: P.text, border: `1px solid ${P.border}` };

  return (
    <button
      onClick={onClick}
      style={style}
      onMouseEnter={e => {
        if (accent) { e.currentTarget.style.opacity = '0.85'; return; }
        if (danger) { e.currentTarget.style.background = `${P.rose}33`; return; }
        e.currentTarget.style.background = P.blueGlow;
        e.currentTarget.style.borderColor = `${P.blue}44`;
        e.currentTarget.style.color = P.blue;
      }}
      onMouseLeave={e => {
        if (accent) { e.currentTarget.style.opacity = '1'; return; }
        if (danger) { e.currentTarget.style.background = `${P.rose}22`; return; }
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.borderColor = P.border;
        e.currentTarget.style.color = P.text;
      }}
    >
      {children}
    </button>
  );
}

// ─── Sidebar element pill ─────────────────────────────────────────────────────
function ElementPill({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px', borderRadius: 10, border: `1px solid ${P.border}`,
        background: 'transparent', color: P.text, fontSize: 13, fontWeight: 600,
        cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.18s', textAlign: 'left',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = P.blueGlow;
        e.currentTarget.style.borderColor = `${P.blue}44`;
        e.currentTarget.style.color = P.blue;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.borderColor = P.border;
        e.currentTarget.style.color = P.text;
      }}
    >
      <span style={{ fontSize: 18 }}>{icon}</span>
      {label}
    </button>
  );
}

// ─── Icons ───────────────────────────────────────────────────────────────────
const icons = {
  venue:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  save:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  clear:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
  share:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  img:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  pdf:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  trash:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>,
};

function getItemIcon(type) {
  if (type === "Table")    return "🍽️";
  if (type === "Chair")    return "🪑";
  if (type === "Stage")    return "🎤";
  if (type === "Booth")    return "🏪";
  if (type === "Entrance") return "🚪";
  return "📍";
}

const ITEM_COLORS = {
  Table:    P.blue,
  Chair:    P.teal,
  Stage:    P.indigo,
  Booth:    P.amber,
  Entrance: P.rose,
};

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── Main Component ───────────────────────────────────────────────────────────
function VenueLayoutDesigner() {
  const [items, setItems]                   = useState([]);
  const [draggingItemId, setDraggingItemId] = useState(null);
  const [dragOffset, setDragOffset]         = useState({ x: 0, y: 0 });
  const [selectedItemId, setSelectedItemId] = useState(null);
  const floorPlanRef                        = useRef(null);
  const [staffMembers, setStaffMembers]     = useState([]);
  const [currentLayoutId, setCurrentLayoutId] = useState(null);
  const [events, setEvents]                 = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");

  useEffect(() => {
    async function loadEvents() {
      try {
        const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
        if (!loggedInUser?._id && !loggedInUser?.id) return;
        const organizerId = loggedInUser._id || loggedInUser.id;
        const response = await fetch(`http://localhost:5001/api/workflow/events/${organizerId}`);
        const data = await response.json();
        setEvents(data);
        if (data.length > 0) setSelectedEventId(data[0]._id);
      } catch (error) {
        console.error("Failed to load events:", error);
      }
    }
    loadEvents();
  }, []);

  useEffect(() => {
    async function loadStaffMembers() {
      try {
        const response = await fetch("http://localhost:5001/api/layouts/staff");
        const data = await response.json();
        if (response.ok) setStaffMembers(data);
      } catch (error) {
        console.error("Failed to load staff members:", error);
      }
    }
    loadStaffMembers();
  }, []);

  useEffect(() => {
    async function loadLayoutForSelectedEvent() {
      if (!selectedEventId) { setItems([]); setCurrentLayoutId(null); return; }
      try {
        const response = await fetch(`http://localhost:5001/api/layouts/event/${selectedEventId}`);
        const data = await response.json();
        if (!response.ok || !data) { setItems([]); setCurrentLayoutId(null); return; }
        setItems(data.elements.map(el => ({ id: Number(el.elementId), type: el.type, x: el.x, y: el.y })));
        setCurrentLayoutId(data._id);
      } catch (error) {
        console.error("Failed to load layout:", error);
      }
    }
    loadLayoutForSelectedEvent();
  }, [selectedEventId]);

  async function shareLayoutWithStaff() {
    if (!selectedEventId) { alert("Please select an event before sharing the layout."); return; }
    try {
      const selectedEvent = events.find(e => e._id === selectedEventId);
      const layoutTitle = selectedEvent ? `${selectedEvent.title} Venue Layout` : "Venue Layout";
      const saveResponse = await fetch("http://localhost:5001/api/layouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: selectedEventId, title: layoutTitle,
          elements: items.map(item => ({ elementId: String(item.id), type: item.type, label: item.type, x: item.x, y: item.y, width: 100, height: 50, rotation: 0 })),
          canvasSize: { width: 1000, height: 620 },
        }),
      });
      const saveData = await saveResponse.json();
      if (!saveResponse.ok) { alert(saveData.message || "Failed to save layout"); return; }
      const layoutId = saveData.layout._id;
      setCurrentLayoutId(layoutId);
      const tasksResponse = await fetch(`http://localhost:5001/api/team/events/${selectedEventId}/tasks`);
      const tasksData = await tasksResponse.json();
      if (!tasksResponse.ok) { alert(tasksData.message || "Failed to load staff"); return; }
      const staffIds = [...new Set(tasksData.filter(t => t.assignedTo).map(t => String(t.assignedTo)))];
      if (staffIds.length === 0) { alert("No staff members assigned to tasks in this event."); return; }
      const shareResponse = await fetch(`http://localhost:5001/api/layouts/${layoutId}/share`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffIds }),
      });
      const shareData = await shareResponse.json();
      if (!shareResponse.ok) { alert(shareData.message || "Failed to share layout"); return; }
      alert(`Layout shared with ${staffIds.length} staff member(s)!`);
    } catch (error) {
      console.error("Share layout error:", error);
      alert("Something went wrong while sharing the layout.");
    }
  }

  function addItem(type) {
    setItems(prev => [...prev, { id: Date.now(), type, x: 100 + prev.length * 24, y: 100 + prev.length * 24 }]);
  }

  function clearLayout() { setItems([]); setSelectedItemId(null); }

  function deleteSelectedItem() {
    if (selectedItemId === null) return;
    setItems(items.filter(item => item.id !== selectedItemId));
    setSelectedItemId(null);
  }

  async function exportAsImage() {
    if (!floorPlanRef.current) return;
    setSelectedItemId(null);
    await wait(100);
    const canvas = await html2canvas(floorPlanRef.current);
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "venue-layout.png";
    link.click();
  }

  async function exportAsPDF() {
    if (!floorPlanRef.current) return;
    setSelectedItemId(null);
    await wait(100);
    const canvas = await html2canvas(floorPlanRef.current);
    const pdf = new jsPDF("landscape", "mm", "a4");
    const w = pdf.internal.pageSize.getWidth();
    const h = pdf.internal.pageSize.getHeight();
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 10, 10, w - 20, h - 20);
    pdf.save("venue-layout.pdf");
  }

  async function saveLayout() {
    if (!selectedEventId) { alert("Please select an event before saving."); return; }
    try {
      const selectedEvent = events.find(e => e._id === selectedEventId);
      const layoutTitle = selectedEvent ? `${selectedEvent.title} Venue Layout` : "Venue Layout";
      const response = await fetch("http://localhost:5001/api/layouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: selectedEventId, title: layoutTitle,
          elements: items.map(item => ({ elementId: String(item.id), type: item.type, label: item.type, x: item.x, y: item.y, width: 100, height: 50, rotation: 0 })),
          canvasSize: { width: 1000, height: 620 },
        }),
      });
      const data = await response.json();
      if (!response.ok) { alert(data.message || "Failed to save layout"); return; }
      setCurrentLayoutId(data.layout._id);
      alert("Layout saved successfully!");
    } catch (error) {
      console.error("Save layout error:", error);
      alert("Something went wrong while saving the layout.");
    }
  }

  function startDragging(event, item) {
    event.preventDefault();
    const box = event.currentTarget.getBoundingClientRect();
    setDraggingItemId(item.id);
    setDragOffset({ x: event.clientX - box.left, y: event.clientY - box.top });
  }

  function handleMouseMove(event) {
    if (draggingItemId === null) return;
    const fp = event.currentTarget.getBoundingClientRect();
    setItems(items.map(item =>
      item.id === draggingItemId
        ? { ...item, x: event.clientX - fp.left - dragOffset.x, y: event.clientY - fp.top - dragOffset.y }
        : item
    ));
  }

  function stopDragging() { setDraggingItemId(null); }

  const elementTypes = [
    { type: "Table",    icon: "🍽️" },
    { type: "Chair",    icon: "🪑" },
    { type: "Stage",    icon: "🎤" },
    { type: "Booth",    icon: "🏪" },
    { type: "Entrance", icon: "🚪" },
  ];

  const countOf = (type) => items.filter(i => i.type === type).length;

  return (
    <div style={{ display: 'flex', height: '100vh', background: P.bg, fontFamily: "'Inter', system-ui, sans-serif", color: P.text, overflow: 'hidden' }}>

      {/* ── Sidebar ── */}
      <aside style={{ width: 220, flexShrink: 0, padding: '24px 16px', borderRight: `1px solid ${P.border}`, display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', background: 'rgba(10,10,18,0.6)', backdropFilter: 'blur(12px)' }}>
        <p style={{ margin: '0 0 16px', fontSize: 11, fontWeight: 700, color: P.sub, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Elements</p>

        {elementTypes.map(({ type, icon }) => (
          <div key={type}>
            <ElementPill icon={icon} label={type} onClick={() => addItem(type)} />
            {countOf(type) > 0 && (
              <p style={{ margin: '2px 0 6px 14px', fontSize: 11, color: ITEM_COLORS[type], fontWeight: 700 }}>
                {countOf(type)} placed
              </p>
            )}
          </div>
        ))}

        <div style={{ flex: 1 }} />

        {/* Legend */}
        <div style={{ paddingTop: 16, borderTop: `1px solid ${P.border}` }}>
          <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: P.sub, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Legend</p>
          {elementTypes.map(({ type, icon }) => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: ITEM_COLORS[type], flexShrink: 0, boxShadow: `0 0 6px ${ITEM_COLORS[type]}88` }} />
              <span style={{ fontSize: 12, color: P.sub }}>{icon} {type}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '20px 28px', borderBottom: `1px solid ${P.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, flexShrink: 0, background: 'rgba(10,10,18,0.5)', backdropFilter: 'blur(12px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: P.teal, background: P.tealGlow, padding: 8, borderRadius: 10, display: 'flex' }}>{icons.venue}</span>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: P.text, letterSpacing: '-0.02em' }}>Venue Layout Designer</h1>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: P.sub }}></p>
            </div>
          </div>

          {/* Event selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: P.sub, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>Event</label>
            <select
              value={selectedEventId}
              onChange={e => setSelectedEventId(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 9, border: `1px solid ${P.border}`, background: P.surface, color: P.text, fontSize: 13, fontFamily: 'inherit', outline: 'none', cursor: 'pointer', backdropFilter: 'blur(12px)', minWidth: 180 }}
              onFocus={e => e.target.style.borderColor = `${P.blue}66`}
              onBlur={e => e.target.style.borderColor = P.border}
            >
              <option value="">Choose an event</option>
              {events.map(event => (
                <option key={event._id} value={event._id}>{event.title}</option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <ActionButton onClick={saveLayout} accent>{icons.save} Save</ActionButton>
            <ActionButton onClick={shareLayoutWithStaff}>{icons.share} Share</ActionButton>
            <ActionButton onClick={exportAsImage}>{icons.img} Image</ActionButton>
            <ActionButton onClick={exportAsPDF}>{icons.pdf} PDF</ActionButton>
            <ActionButton onClick={deleteSelectedItem} danger disabled={!selectedItemId}>{icons.trash} Delete</ActionButton>
            <ActionButton onClick={clearLayout}>{icons.clear} Clear</ActionButton>
          </div>
        </div>

        {/* Stats strip */}
        <div style={{ display: 'flex', gap: 12, padding: '14px 28px', borderBottom: `1px solid ${P.border}`, flexShrink: 0, background: 'rgba(10,10,18,0.3)' }}>
          {elementTypes.map(({ type }) => (
            countOf(type) > 0 && (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 99, background: `${ITEM_COLORS[type]}18`, border: `1px solid ${ITEM_COLORS[type]}33` }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: ITEM_COLORS[type], boxShadow: `0 0 5px ${ITEM_COLORS[type]}` }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: ITEM_COLORS[type] }}>{countOf(type)} {type}{countOf(type) > 1 ? 's' : ''}</span>
              </div>
            )
          ))}
          {items.length === 0 && <span style={{ fontSize: 12, color: P.sub }}>No elements placed yet — click an element in the sidebar to begin</span>}
          {items.length > 0 && (
            <span style={{ marginLeft: 'auto', fontSize: 12, color: P.sub }}>{items.length} element{items.length !== 1 ? 's' : ''} total</span>
          )}
        </div>

        {/* Canvas */}
        <div style={{ flex: 1, padding: '24px 28px', overflow: 'hidden' }}>
          <GlassPanel style={{ height: '100%', position: 'relative', overflow: 'hidden', background: 'rgba(10,10,18,0.4)' }}>
            {/* Grid overlay */}
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${P.border} 1px, transparent 1px), linear-gradient(90deg, ${P.border} 1px, transparent 1px)`, backgroundSize: '40px 40px', pointerEvents: 'none', opacity: 0.5 }} />

            <div
              ref={floorPlanRef}
              style={{ position: 'absolute', inset: 0 }}
              onMouseMove={handleMouseMove}
              onMouseUp={stopDragging}
              onMouseLeave={stopDragging}
            >
              {items.length === 0 && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, pointerEvents: 'none' }}>
                  <span style={{ fontSize: 40, opacity: 0.2 }}>🏟️</span>
                  <p style={{ margin: 0, fontSize: 14, color: P.muted, fontWeight: 600 }}>Floor plan canvas</p>
                  <p style={{ margin: 0, fontSize: 12, color: P.muted }}>Add elements from the sidebar to get started</p>
                </div>
              )}

              {items.map(item => {
                const isSelected = selectedItemId === item.id;
                const isDragging = draggingItemId === item.id;
                const accent = ITEM_COLORS[item.type] || P.blue;
                return (
                  <div
                    key={item.id}
                    onMouseDown={e => startDragging(e, item)}
                    onClick={() => setSelectedItemId(selectedItemId === item.id ? null : item.id)}
                    style={{
                      position: 'absolute',
                      left: item.x,
                      top: item.y,
                      width: 56,
                      height: 56,
                      borderRadius: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 2,
                      cursor: isDragging ? 'grabbing' : 'grab',
                      userSelect: 'none',
                      background: isSelected ? `${accent}28` : 'rgba(19,19,30,0.85)',
                      border: isSelected ? `2px solid ${accent}` : `1px solid ${accent}44`,
                      boxShadow: isSelected
                        ? `0 0 0 3px ${accent}22, 0 0 20px ${accent}44, inset 0 1px 0 rgba(255,255,255,0.08)`
                        : `0 2px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)`,
                      backdropFilter: 'blur(8px)',
                      transform: isDragging ? 'scale(1.08)' : isSelected ? 'scale(1.03)' : 'scale(1)',
                      transition: isDragging ? 'none' : 'all 0.15s cubic-bezier(0.34,1.4,0.64,1)',
                      zIndex: isDragging ? 100 : isSelected ? 10 : 1,
                    }}
                  >
                    <span style={{ fontSize: 22, lineHeight: 1 }}>{getItemIcon(item.type)}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: isSelected ? accent : P.sub, textTransform: 'uppercase', letterSpacing: '0.05em' }}></span>
                  </div>
                );
              })}
            </div>
          </GlassPanel>
        </div>
      </main>
    </div>
  );
}

export default VenueLayoutDesigner;