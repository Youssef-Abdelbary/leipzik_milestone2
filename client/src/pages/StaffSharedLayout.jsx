import { useEffect, useState } from "react";
import "./StaffSharedLayout.css";

function StaffSharedLayout() {
  const [layouts, setLayouts] = useState([]);
  const [selectedLayout, setSelectedLayout] = useState(null);
  const [message, setMessage] = useState("Loading shared layouts...");
  function getItemIcon(type) {
    if (type === "Table") return "🍽️";
    if (type === "Chair") return "🪑";
    if (type === "Stage") return "🎤";
    if (type === "Booth") return "🏪";
    if (type === "Entrance") return "🚪";
    return "📍";
    }
  useEffect(() => {
    async function loadSharedLayouts() {
      try {
        const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));

        if (!loggedInUser) {
          setMessage("No logged-in user found.");
          return;
        }

        const response = await fetch(
          `http://localhost:5001/api/layouts/shared/${loggedInUser.id}`
        );

        const data = await response.json();

        if (!response.ok) {
          setMessage(data.message || "Failed to load shared layouts.");
          return;
        }

        setLayouts(data);

        if (data.length > 0) {
          setSelectedLayout(data[0]);
          setMessage("");
        } else {
          setMessage("No layout has been shared with you yet.");
        }
      } catch (error) {
        console.error("Load shared layout error:", error);
        setMessage("Something went wrong while loading the layout.");
      }
    }

    loadSharedLayouts();
  }, []);

  return (
    <div className="staff-layout-page">
      <div className="staff-layout-header">
        <div>
          <h1>📍 Shared Venue Layout</h1>
          <p>👀 Read-only layout shared by the organizer.</p>
        </div>

        {layouts.length > 1 && (
          <select
            value={selectedLayout?._id || ""}
            onChange={(event) => {
              const layout = layouts.find(
                (layout) => layout._id === event.target.value
              );
              setSelectedLayout(layout);
            }}
          >
            {layouts.map((layout) => (
              <option key={layout._id} value={layout._id}>
                {layout.title || "Venue Layout"}
              </option>
            ))}
          </select>
        )}
      </div>

      {message && <p className="staff-message">{message}</p>}

      {selectedLayout && (
        <div className="staff-floor-plan">
          {selectedLayout.elements.map((item) => (
            <div
              key={item.elementId}
              className={`staff-layout-item ${item.type.toLowerCase()}`}
              style={{
                left: `${item.x}px`,
                top: `${item.y}px`,
              }}
            >
              {getItemIcon(item.type)} {item.label || item.type}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default StaffSharedLayout;