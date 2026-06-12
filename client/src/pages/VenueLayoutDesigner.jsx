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
  useEffect(() => {
    const savedLayout = localStorage.getItem("venueLayout");

    if (savedLayout) {
      setItems(JSON.parse(savedLayout));
    }
  }, []);

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
    localStorage.removeItem("venueLayout");
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
    function saveLayout() {
    localStorage.setItem("venueLayout", JSON.stringify(items));
    alert("Layout saved successfully!");
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

        <button onClick={() => addItem("Table")}>Table</button>
        <button onClick={() => addItem("Chair")}>Chair</button>
        <button onClick={() => addItem("Stage")}>Stage</button>
        <button onClick={() => addItem("Booth")}>Booth</button>
        <button onClick={() => addItem("Entrance")}>Entrance</button>
      </aside>

      <main className="layout-main">
        <div className="layout-header">
          <div>
            <h1>Venue Layout Designer</h1>
            <p>Drag and drop elements to design your venue layout</p>
          </div>

          <div className="layout-actions">
            <button onClick={deleteSelectedItem}>Delete Selected</button>
            <button onClick={saveLayout}>Save Layout</button>
            <button onClick={clearLayout}>Clear Layout</button>
            <button>Share</button>
            <button onClick={exportAsImage}>Export Image</button>
            <button onClick={exportAsPDF}>Export PDF</button>
          </div>
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
    {item.type}
  </div>
))}
        </div>
      </main>
    </div>
  );
}

export default VenueLayoutDesigner;