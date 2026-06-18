import { useState, useEffect, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "./TabLayoutDesigner.css";
import "../../components/componentTheme.css";
import { GlassPanel } from "../../components/componentTheme";

const icons = {
  save: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  ),
  share: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  ),
  image: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  pdf: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  trash: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  ),
  clear: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  ),
  rotateLeft: "↺",
  rotateRight: "↻",
};

function VenueLayoutDesigner({ eventId, event, onNavigate }) {
  const [items, setItems] = useState([]);
  const [draggingItemId, setDraggingItemId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedItemId, setSelectedItemId] = useState(null);

  const floorPlanRef = useRef(null);

 
  const [currentLayoutId, setCurrentLayoutId] = useState(null);



  const selectedEventId = eventId;

  

  

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

        if (!response.ok) {
          alert(data.message || "Failed to load layout for this event");
          return;
        }

        if (!data || !data.elements) {
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

  async function shareLayoutWithStaff() {
    if (!selectedEventId) {
      alert("Please select an event before sharing the layout.");
      return;
    }

    try {
      const layoutTitle = `Venue Layout - ${selectedEventId}`;

      const saveResponse = await fetch("http://localhost:5001/api/layouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
          canvasSize: {
            width: 1000,
            height: 620,
          },
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
            .map((task) => String(task.assignedTo))
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
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            staffIds: staffIds,
          }),
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

  function getItemIcon(type) {
    if (type === "Table") return "🍽️";
    if (type === "Chair") return "🪑";
    if (type === "Stage") return "🎤";
    if (type === "Booth") return "🏪";
    if (type === "Entrance") return "🚪";
    return "📍";
  }

  function addItem(type) {
    const newItem = {
      id: Date.now(),
      type: type,
      x: 100 + items.length * 20,
      y: 100 + items.length * 20,
      rotation: 0,
    };

    setItems([...items, newItem]);
  }

  function clearLayout() {
    setItems([]);
    setSelectedItemId(null);
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function exportAsImage() {
    if (!floorPlanRef.current) return;

    setSelectedItemId(null);
    await wait(100);

    const canvas = await html2canvas(floorPlanRef.current);
    const image = canvas.toDataURL("image/png");

    const link = document.createElement("a");
    link.href = image;
    link.download = "venue-layout.png";
    link.click();
  }

  async function exportAsPDF() {
    if (!floorPlanRef.current) {
      return;
    }

    setSelectedItemId(null);
    await wait(100);

    const canvas = await html2canvas(floorPlanRef.current);
    const image = canvas.toDataURL("image/png");

    const pdf = new jsPDF("landscape", "mm", "a4");

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(image, "PNG", 10, 10, pageWidth - 20, pageHeight - 20);

    pdf.save("venue-layout.pdf");
  }

  function deleteSelectedItem() {
    if (selectedItemId === null) return;

    setItems(items.filter((item) => item.id !== selectedItemId));
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
    try {
      if (!selectedEventId) {
        alert("Please select an event before saving the layout.");
        return;
      }

      const layoutTitle = `Venue Layout - ${selectedEventId}`;

      const response = await fetch("http://localhost:5001/api/layouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
          canvasSize: {
            width: 1000,
            height: 620,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to save layout");
        return;
      }

      setCurrentLayoutId(data.layout._id);
      alert("Layout saved successfully for this event!");
    } catch (error) {
      console.error("Save layout error:", error);
      alert("Something went wrong while saving the layout.");
    }
  }

  function startDragging(event, item) {
    event.preventDefault();

    const itemBox = event.currentTarget.getBoundingClientRect();

    setDraggingItemId(item.id);

    setDragOffset({
      x: event.clientX - itemBox.left,
      y: event.clientY - itemBox.top,
    });
  }

  function handleMouseMove(event) {
    if (draggingItemId === null) return;

    const floorPlan = event.currentTarget.getBoundingClientRect();

    const mouseX = event.clientX - floorPlan.left;
    const mouseY = event.clientY - floorPlan.top;

    setItems(
      items.map((item) =>
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

  return (
    <div className="layout-page">
      <GlassPanel className="layout-sidebar">
        <h2>Elements</h2>

        <button onClick={() => addItem("Table")}>🍽️ Table</button>
        <button onClick={() => addItem("Chair")}>🪑 Chair</button>
        <button onClick={() => addItem("Stage")}>🎤 Stage</button>
        <button onClick={() => addItem("Booth")}>🏪 Booth</button>
        <button onClick={() => addItem("Entrance")}>🚪 Entrance</button>
      </GlassPanel>

      <main className="layout-main">
        <div className="layout-header">
          <div>
            <h1>Venue Layout Designer</h1>
            <p>Drag and drop elements to design your venue layout.</p>
          </div>
        </div>
        <div className="layout-back-area">
          <button
            className="layout-back-button"
            onClick={() => onNavigate("reply")}
          >
            ← Back to Venue Booking
          </button>
        </div>

        <GlassPanel className="layout-actions-panel">
          <div className="layout-actions">
            <button className="layout-action-button primary" onClick={saveLayout}>
              {icons.save}
              <span>Save</span>
            </button>

            <button className="layout-action-button" onClick={shareLayoutWithStaff}>
              {icons.share}
              <span>Share</span>
            </button>

            <button className="layout-action-button" onClick={exportAsImage}>
              {icons.image}
              <span>Image</span>
            </button>

            <button className="layout-action-button" onClick={exportAsPDF}>
              {icons.pdf}
              <span>PDF</span>
            </button>

            <button
              className="layout-action-button"
              onClick={() => rotateSelectedItem("left")}
            >
              <span className="layout-action-symbol">{icons.rotateLeft}</span>
              <span>Left</span>
            </button>

            <button
              className="layout-action-button"
              onClick={() => rotateSelectedItem("right")}
            >
              <span className="layout-action-symbol">{icons.rotateRight}</span>
              <span>Right</span>
            </button>

            <button className="layout-action-button danger" onClick={deleteSelectedItem}>
              {icons.trash}
              <span>Delete</span>
            </button>

            <button className="layout-action-button" onClick={clearLayout}>
              {icons.clear}
              <span>Clear</span>
            </button>
          </div>
        </GlassPanel>

        <GlassPanel className="floor-plan-panel">
          <div
            className="floor-plan"
            ref={floorPlanRef}
            onMouseMove={handleMouseMove}
            onMouseUp={stopDragging}
            onMouseLeave={stopDragging}
          >
            {items.length === 0 && (
              <p className="floor-plan-empty">Floor plan canvas</p>
            )}

            {items.map((item) => (
              <div
                key={item.id}
                className={`layout-item ${item.type.toLowerCase()} ${
                  selectedItemId === item.id ? "selected" : ""
                }`}
                style={{
                  left: `${item.x}px`,
                  top: `${item.y}px`,
                  transform: `rotate(${item.rotation || 0}deg)`,
                }}
                onMouseDown={(event) => startDragging(event, item)}
                onClick={() =>
                  setSelectedItemId(selectedItemId === item.id ? null : item.id)
                }
              >
                {getItemIcon(item.type)}
              </div>
            ))}
          </div>
        </GlassPanel>
      </main>
    </div>
  );
}

export default VenueLayoutDesigner;