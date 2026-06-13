import { useState, useEffect,useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "./VenueLayoutDesigner.css";

function VenueLayoutDesigner() {
  const [items, setItems] = useState([]);
  const [draggingItemId, setDraggingItemId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedItemId, setSelectedItemId] = useState(null);
  const floorPlanRef = useRef(null);
  const [staffMembers, setStaffMembers] = useState([]);
  const [showShareBox, setShowShareBox] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [currentLayoutId, setCurrentLayoutId] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");

  useEffect(() => {
    async function loadEvents() {
      try {
        const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));

        if (!loggedInUser?._id && !loggedInUser?.id) {
          console.warn("No logged-in user found.");
          return;
        }

        const organizerId = loggedInUser._id || loggedInUser.id;

        const response = await fetch(
          `http://localhost:5001/api/workflow/events/${organizerId}`
        );

        const data = await response.json();

        setEvents(data);

        if (data.length > 0) {
          setSelectedEventId(data[0]._id);
        }
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

        if (!response.ok) {
          alert(data.message || "Failed to load staff members");
          return;
        }

        setStaffMembers(data);
      } catch (error) {
        console.error("Failed to load staff members:", error);
        alert("Something went wrong while loading staff members.");
      }
    }

    loadStaffMembers();
  }, []);

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

        const data = await response.json();

        if (!response.ok) {
          alert(data.message || "Failed to load layout for this event");
          return;
        }

        if (!data) {
          setItems([]);
          setCurrentLayoutId(null);
          return;
        }

        const loadedItems = data.elements.map((element) => ({
          id: Number(element.elementId),
          type: element.type,
          x: element.x,
          y: element.y,
        }));

        setItems(loadedItems);
        setCurrentLayoutId(data._id);
      } catch (error) {
        console.error("Failed to load layout for selected event:", error);
        alert("Something went wrong while loading this event layout.");
      }
    }

    loadLayoutForSelectedEvent();
  }, [selectedEventId]);

  async function shareLayoutWithStaff() {
  if (!selectedStaffId) {
    alert("Please choose a staff member first.");
    return;
  }
  if (!selectedEventId) {
    alert("Please select an event before sharing the layout.");
    return;
  }

  try {
  

    const saveResponse = await fetch("http://localhost:5001/api/layouts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventId: selectedEventId,
        title: "Venue Layout",
        elements: items.map((item) => ({
          elementId: String(item.id),
          type: item.type,
          label: item.type,
          x: item.x,
          y: item.y,
          width: 100,
          height: 50,
          rotation: 0,
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

    const shareResponse = await fetch(
      `http://localhost:5001/api/layouts/${layoutId}/share`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          staffId: selectedStaffId,
        }),
      }
    );

    const shareData = await shareResponse.json();

    if (!shareResponse.ok) {
      alert(shareData.message || "Failed to share layout");
      return;
    }

    alert("Layout shared successfully!");
    setShowShareBox(false);
    setSelectedStaffId("");
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
    };

    setItems([...items, newItem]);
  }

  function clearLayout() {
    setItems([]);
    setSelectedItemId(null);
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
    function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
  async function saveLayout() {
    try {
      if (!selectedEventId) {
        alert("Please select an event before saving the layout.");
        return;
      }

      const response = await fetch("http://localhost:5001/api/layouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: selectedEventId,
          title: "Venue Layout",
          elements: items.map((item) => ({
            elementId: String(item.id),
            type: item.type,
            label: item.type,
            x: item.x,
            y: item.y,
            width: 100,
            height: 50,
            rotation: 0,
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
      <aside className="layout-sidebar">
        <h2>Elements</h2>

        <button onClick={() => addItem("Table")}>🍽️ Table</button>
        <button onClick={() => addItem("Chair")}>🪑 Chair</button>
        <button onClick={() => addItem("Stage")}>🎤 Stage</button>
        <button onClick={() => addItem("Booth")}>🏪 Booth</button>
        <button onClick={() => addItem("Entrance")}>🚪 Entrance</button>
      </aside>

      <main className="layout-main">
        <div className="layout-header">
          <div>
            <h1>🏟️ Venue Layout Designer</h1>
            <p>Drag and drop elements to design your venue layout</p>
          </div>
          <div className="event-selector">
            <label>Select Event</label>

            <select
              value={selectedEventId}
              onChange={(event) => setSelectedEventId(event.target.value)}
            >
              <option value="">Choose an event</option>

              {events.map((event) => (
                <option key={event._id} value={event._id}>
                  {event.title}
                </option>
              ))}
            </select>
          </div>
          <div className="layout-actions">
            <button onClick={saveLayout}>💾 Save Layout</button>
            <button onClick={clearLayout}>🧹 Clear Layout</button>
            <button onClick={() => setShowShareBox(!showShareBox)}>📤 Share</button>
            <button onClick={exportAsImage}>🖼️ Export Image</button>
            <button onClick={exportAsPDF}>📄 Export PDF</button>
            <button onClick={deleteSelectedItem}>🗑️ Delete Selected</button>
          </div>
          {showShareBox && (
      <div className="share-box">
        <select
          value={selectedStaffId}
          onChange={(event) => setSelectedStaffId(event.target.value)}
        >
          <option value="">👥 Choose staff member</option>

          {staffMembers.map((staff) => (
            <option key={staff._id} value={staff._id}>
              {staff.fullName || staff.email}
            </option>
          ))}
        </select>

        <button onClick={shareLayoutWithStaff}>✅ Confirm Share</button>
      </div>
    )}
        </div>

        <div
          className="floor-plan"
          ref={floorPlanRef}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDragging}
          onMouseLeave={stopDragging}
        >
          {items.length === 0 && <p>Floor plan canvas</p>}

          {items.map((item) => (
  <div
    key={item.id}
    className={`layout-item ${item.type.toLowerCase()} ${
      selectedItemId === item.id ? "selected" : ""
    }`}
    style={{
      left: `${item.x}px`,
      top: `${item.y}px`,
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
      </main>
    </div>
  );
}

export default VenueLayoutDesigner;