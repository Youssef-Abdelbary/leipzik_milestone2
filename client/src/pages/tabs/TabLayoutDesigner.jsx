import { useEffect, useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "./TabLayoutDesigner.css";

const P = {
  bg: "#0a0a0f",
  surface: "rgba(19,19,30,0.72)",
  border: "rgba(255,255,255,0.08)",
  text: "#e8e8f0",
  sub: "rgba(200,200,220,0.5)",
  muted: "rgba(200,200,220,0.3)",

  blue: "#7c5cfc",
  indigo: "#8b6dff",
  teal: "#00e5c0",
  amber: "#f5a623",
  rose: "#ff4d6d",

  blueGlow: "rgba(124,92,252,0.12)",
  tealGlow: "rgba(0,229,192,0.12)",
  roseGlow: "rgba(255,77,109,0.12)",
};

const ITEM_COLORS = {
  Table: P.blue,
  Chair: P.teal,
  Stage: P.indigo,
  Booth: P.amber,
  Entrance: P.rose,
};

const elementTypes = [
  { type: "Table", icon: "🍽️" },
  { type: "Chair", icon: "🪑" },
  { type: "Stage", icon: "🎤" },
  { type: "Booth", icon: "🏪" },
  { type: "Entrance", icon: "🚪" },
];

const icons = {
  venue: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  save: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  ),
  share: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  ),
  img: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  pdf: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  trash: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
    </svg>
  ),
  clear: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  ),
  rotateLeft: "↶",
  rotateRight: "↷",
};

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getItemIcon(type) {
  if (type === "Table") return "🍽️";
  if (type === "Chair") return "🪑";
  if (type === "Stage") return "🎤";
  if (type === "Booth") return "🏪";
  if (type === "Entrance") return "🚪";
  return "📍";
}

function GlassPanel({ children, style = {} }) {
  return (
    <div
      style={{
        background: P.surface,
        backdropFilter: "blur(18px) saturate(140%)",
        WebkitBackdropFilter: "blur(18px) saturate(140%)",
        border: `1px solid ${P.border}`,
        borderRadius: 16,
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.3)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function ElementPill({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        borderRadius: 10,
        border: `1px solid ${P.border}`,
        background: "transparent",
        color: P.text,
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left",
      }}
    >
      <span style={{ fontSize: 18 }}>{icon}</span>
      {label}
    </button>
  );
}

function ActionButton({ onClick, children, accent = false, danger = false }) {
  return (
    <button
      onClick={onClick}
      style={{
        minHeight: 52,
        padding: "0 22px",
        borderRadius: 13,
        border: danger
          ? "1px solid rgba(255, 82, 120, 0.34)"
          : accent
          ? "none"
          : "1px solid rgba(255, 255, 255, 0.09)",
        background: danger
          ? "rgba(255, 82, 120, 0.1)"
          : accent
          ? "linear-gradient(135deg, #7768ff 0%, #14d8d2 100%)"
          : "rgba(18, 18, 29, 0.72)",
        color: danger ? "#ff5c86" : accent ? "#071018" : P.text,
        fontSize: 15,
        fontWeight: 900,
        cursor: "pointer",
        fontFamily: "inherit",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 9,
      }}
    >
      {children}
    </button>
  );
}

export default function TabLayoutDesigner({ eventId, event, onNavigate }) {
  const selectedEventId = eventId;

  const [items, setItems] = useState([]);
  const [draggingItemId, setDraggingItemId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [currentLayoutId, setCurrentLayoutId] = useState(null);

  const floorPlanRef = useRef(null);

  useEffect(() => {
    async function loadLayoutForSelectedEvent() {
      if (!selectedEventId) {
        setItems([]);
        setCurrentLayoutId(null);
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:5001/api/layouts/event/${selectedEventId}`
        );

        if (response.status === 404) {
          setItems([]);
          setCurrentLayoutId(null);
          return;
        }

        const data = await response.json();

        if (!response.ok || !data || !data.elements) {
          setItems([]);
          setCurrentLayoutId(null);
          return;
        }

        const loadedItems = data.elements.map((element) => ({
          id: Number(element.elementId),
          type: element.type,
          x: element.x,
          y: element.y,
          rotation: element.rotation || 0,
        }));

        setItems(loadedItems);
        setCurrentLayoutId(data._id);
      } catch (error) {
        console.error("Failed to load layout for selected event:", error);
        setItems([]);
        setCurrentLayoutId(null);
      }
    }

    loadLayoutForSelectedEvent();
  }, [selectedEventId]);

  function getSafeEventFileName() {
    const eventName = event?.title || event?.name || "Venue Layout";

    return eventName
      .trim()
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function addItem(type) {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        type,
        x: 100 + prev.length * 24,
        y: 100 + prev.length * 24,
        rotation: 0,
      },
    ]);
  }

  function clearLayout() {
    setItems([]);
    setSelectedItemId(null);
  }

  function deleteSelectedItem() {
    if (selectedItemId === null) return;

    setItems((prev) => prev.filter((item) => item.id !== selectedItemId));
    setSelectedItemId(null);
  }

  function rotateSelectedItem(direction) {
    if (selectedItemId === null) {
      alert("Please select an item first.");
      return;
    }

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === selectedItemId
          ? {
              ...item,
              rotation:
                direction === "right"
                  ? (item.rotation || 0) + 15
                  : (item.rotation || 0) - 15,
            }
          : item
      )
    );
  }

  async function saveLayout() {
    if (!selectedEventId) {
      alert("No event selected.");
      return;
    }

    try {
      const layoutTitle = event?.title
        ? `${event.title} Venue Layout`
        : "Venue Layout";

      const response = await fetch("http://localhost:5001/api/layouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: selectedEventId,
          title: layoutTitle,
          elements: items.map((item) => ({
            elementId: String(item.id),
            type: item.type,
            label: item.type,
            x: item.x,
            y: item.y,
            width: 100,
            height: 50,
            rotation: item.rotation || 0,
          })),
          canvasSize: { width: 1000, height: 620 },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to save layout");
        return;
      }

      setCurrentLayoutId(data.layout._id);
      alert("Layout saved successfully!");
    } catch (error) {
      console.error("Save layout error:", error);
      alert("Something went wrong while saving the layout.");
    }
  }

  async function shareLayoutWithStaff() {
    if (!selectedEventId) {
      alert("No event selected.");
      return;
    }

    try {
      const layoutTitle = event?.title
        ? `${event.title} Venue Layout`
        : "Venue Layout";

      const saveResponse = await fetch("http://localhost:5001/api/layouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: selectedEventId,
          title: layoutTitle,
          elements: items.map((item) => ({
            elementId: String(item.id),
            type: item.type,
            label: item.type,
            x: item.x,
            y: item.y,
            width: 100,
            height: 50,
            rotation: item.rotation || 0,
          })),
          canvasSize: { width: 1000, height: 620 },
        }),
      });

      const saveData = await saveResponse.json();

      if (!saveResponse.ok) {
        alert(saveData.message || "Failed to save layout");
        return;
      }

      const layoutId = saveData.layout._id;
      setCurrentLayoutId(layoutId);

      const tasksResponse = await fetch(
        `http://localhost:5001/api/team/events/${selectedEventId}/tasks`
      );

      const tasksData = await tasksResponse.json();

      if (!tasksResponse.ok) {
        alert(tasksData.message || "Failed to load event staff members");
        return;
      }

      const staffIds = [
        ...new Set(
          tasksData
            .filter((task) => task.assignedTo)
            .map((task) =>
              typeof task.assignedTo === "object"
                ? String(task.assignedTo._id)
                : String(task.assignedTo)
            )
        ),
      ];

      if (staffIds.length === 0) {
        alert("No staff members are assigned to tasks in this event.");
        return;
      }

      const shareResponse = await fetch(
        `http://localhost:5001/api/layouts/${layoutId}/share`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ staffIds }),
        }
      );

      const shareData = await shareResponse.json();

      if (!shareResponse.ok) {
        alert(shareData.message || "Failed to share layout");
        return;
      }

      alert(`Layout shared with ${staffIds.length} staff member(s)!`);
    } catch (error) {
      console.error("Share layout error:", error);
      alert("Something went wrong while sharing the layout.");
    }
  }

  async function exportAsImage() {
    if (!floorPlanRef.current) return;

    setSelectedItemId(null);
    await wait(100);

    const canvas = await html2canvas(floorPlanRef.current);
    const link = document.createElement("a");

    link.href = canvas.toDataURL("image/png");
    link.download = `${getSafeEventFileName()}-layout.png`;
    link.click();
  }

  async function exportAsPDF() {
    if (!floorPlanRef.current) return;

    setSelectedItemId(null);
    await wait(100);

    const canvas = await html2canvas(floorPlanRef.current);
    const pdf = new jsPDF("landscape", "mm", "a4");

    const width = pdf.internal.pageSize.getWidth();
    const height = pdf.internal.pageSize.getHeight();

    pdf.addImage(
      canvas.toDataURL("image/png"),
      "PNG",
      10,
      10,
      width - 20,
      height - 20
    );

    pdf.save(`${getSafeEventFileName()}-layout.pdf`);
  }

  function startDragging(mouseEvent, item) {
    mouseEvent.preventDefault();

    const itemBox = mouseEvent.currentTarget.getBoundingClientRect();

    setDraggingItemId(item.id);
    setDragOffset({
      x: mouseEvent.clientX - itemBox.left,
      y: mouseEvent.clientY - itemBox.top,
    });
  }

  function handleMouseMove(mouseEvent) {
    if (draggingItemId === null) return;

    const floorPlan = mouseEvent.currentTarget.getBoundingClientRect();

    const mouseX = mouseEvent.clientX - floorPlan.left;
    const mouseY = mouseEvent.clientY - floorPlan.top;

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === draggingItemId
          ? {
              ...item,
              x: mouseX - dragOffset.x,
              y: mouseY - dragOffset.y,
            }
          : item
      )
    );
  }

  function stopDragging() {
    setDraggingItemId(null);
  }

  const countOf = (type) => items.filter((item) => item.type === type).length;

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: P.bg,
        fontFamily: "'Inter', system-ui, sans-serif",
        color: P.text,
        overflow: "hidden",
      }}
    >
      <aside
        style={{
          width: 220,
          flexShrink: 0,
          padding: "24px 16px",
          borderRight: `1px solid ${P.border}`,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          overflowY: "auto",
          background: "rgba(10,10,18,0.6)",
          backdropFilter: "blur(12px)",
        }}
      >
        <p
          style={{
            margin: "0 0 16px",
            fontSize: 11,
            fontWeight: 700,
            color: P.sub,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Elements
        </p>

        {elementTypes.map(({ type, icon }) => (
          <div key={type}>
            <ElementPill
              icon={icon}
              label={type}
              onClick={() => addItem(type)}
            />

            {countOf(type) > 0 && (
              <p
                style={{
                  margin: "2px 0 6px 14px",
                  fontSize: 11,
                  color: ITEM_COLORS[type],
                  fontWeight: 700,
                }}
              >
                {countOf(type)} placed
              </p>
            )}
          </div>
        ))}
      </aside>

      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "20px 28px",
            borderBottom: `1px solid ${P.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
            flexShrink: 0,
            background: "rgba(10,10,18,0.5)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                color: P.teal,
                background: P.tealGlow,
                padding: 8,
                borderRadius: 10,
                display: "flex",
              }}
            >
              {icons.venue}
            </span>

            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 800,
                  color: P.text,
                  letterSpacing: "-0.02em",
                }}
              >
                Venue Layout Designer
              </h1>

              <p style={{ margin: "3px 0 0", fontSize: 12, color: P.sub }}>
                {event?.title || "Design the selected event layout"}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <ActionButton onClick={saveLayout} accent>
              {icons.save} Save
            </ActionButton>

            <ActionButton onClick={shareLayoutWithStaff}>
              {icons.share} Share
            </ActionButton>

            <ActionButton onClick={exportAsImage}>
              {icons.img} Image
            </ActionButton>

            <ActionButton onClick={exportAsPDF}>
              {icons.pdf} PDF
            </ActionButton>

            <ActionButton onClick={() => rotateSelectedItem("left")}>
              <span style={{ fontSize: 20 }}>{icons.rotateLeft}</span>
              Left
            </ActionButton>

            <ActionButton onClick={() => rotateSelectedItem("right")}>
              <span style={{ fontSize: 20 }}>{icons.rotateRight}</span>
              Right
            </ActionButton>

            <ActionButton onClick={deleteSelectedItem} danger>
              {icons.trash} Delete
            </ActionButton>

            <ActionButton onClick={clearLayout}>
              {icons.clear} Clear
            </ActionButton>

            <ActionButton onClick={() => onNavigate?.("browse")}>
              ← Back
            </ActionButton>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            padding: "14px 28px",
            borderBottom: `1px solid ${P.border}`,
            flexShrink: 0,
            background: "rgba(10,10,18,0.3)",
          }}
        >
          {elementTypes.map(({ type }) =>
            countOf(type) > 0 ? (
              <div
                key={type}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 12px",
                  borderRadius: 99,
                  background: `${ITEM_COLORS[type]}18`,
                  border: `1px solid ${ITEM_COLORS[type]}33`,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: ITEM_COLORS[type],
                    boxShadow: `0 0 5px ${ITEM_COLORS[type]}`,
                  }}
                />

                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: ITEM_COLORS[type],
                  }}
                >
                  {countOf(type)} {type}
                  {countOf(type) > 1 ? "s" : ""}
                </span>
              </div>
            ) : null
          )}

          {items.length === 0 && (
            <span style={{ fontSize: 12, color: P.sub }}>
              No elements placed yet — click an element in the sidebar to begin
            </span>
          )}

          {items.length > 0 && (
            <span style={{ marginLeft: "auto", fontSize: 12, color: P.sub }}>
              {items.length} element{items.length !== 1 ? "s" : ""} total
            </span>
          )}
        </div>

        <div style={{ flex: 1, padding: "24px 28px", overflow: "hidden" }}>
          <GlassPanel
            style={{
              height: "100%",
              position: "relative",
              overflow: "hidden",
              background: "rgba(10,10,18,0.4)",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `linear-gradient(${P.border} 1px, transparent 1px), linear-gradient(90deg, ${P.border} 1px, transparent 1px)`,
                backgroundSize: "40px 40px",
                pointerEvents: "none",
                opacity: 0.5,
              }}
            />

            <div
              ref={floorPlanRef}
              style={{ position: "absolute", inset: 0 }}
              onMouseMove={handleMouseMove}
              onMouseUp={stopDragging}
              onMouseLeave={stopDragging}
            >
              {items.length === 0 && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    pointerEvents: "none",
                  }}
                >
                  <span style={{ fontSize: 40, opacity: 0.2 }}>🏟️</span>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14,
                      color: P.muted,
                      fontWeight: 600,
                    }}
                  >
                    Floor plan canvas
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: P.muted }}>
                    Add elements from the sidebar to get started
                  </p>
                </div>
              )}

              {items.map((item) => {
                const isSelected = selectedItemId === item.id;
                const isDragging = draggingItemId === item.id;
                const accent = ITEM_COLORS[item.type] || P.blue;

                return (
                  <div
                    key={item.id}
                    onMouseDown={(event) => startDragging(event, item)}
                    onClick={() =>
                      setSelectedItemId(
                        selectedItemId === item.id ? null : item.id
                      )
                    }
                    style={{
                      position: "absolute",
                      left: item.x,
                      top: item.y,
                      width: 56,
                      height: 56,
                      borderRadius: 12,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: isDragging ? "grabbing" : "grab",
                      userSelect: "none",
                      background: isSelected
                        ? `${accent}28`
                        : "rgba(19,19,30,0.85)",
                      border: isSelected
                        ? `2px solid ${accent}`
                        : `1px solid ${accent}44`,
                      boxShadow: isSelected
                        ? `0 0 0 3px ${accent}22, 0 0 20px ${accent}44`
                        : "0 2px 12px rgba(0,0,0,0.4)",
                      backdropFilter: "blur(8px)",
                      transform: `rotate(${item.rotation || 0}deg) ${
                        isDragging
                          ? "scale(1.08)"
                          : isSelected
                          ? "scale(1.03)"
                          : "scale(1)"
                      }`,
                      transition: isDragging ? "none" : "all 0.15s ease",
                      zIndex: isDragging ? 100 : isSelected ? 10 : 1,
                    }}
                  >
                    <span style={{ fontSize: 22, lineHeight: 1 }}>
                      {getItemIcon(item.type)}
                    </span>
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