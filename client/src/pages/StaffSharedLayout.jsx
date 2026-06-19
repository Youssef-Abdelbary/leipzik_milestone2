import { useEffect, useState } from "react";
import "./StaffSharedLayout.css";
import "../components/componentTheme.css";
import { OpalSelect } from "../components/componentMenus";
import { P, icons, GlassPanel } from "../components/componentTheme";
import { apiFetch, getUserIdFromToken } from "../utils/apiFetch";

function StaffSharedLayout() {
  const [layouts, setLayouts] = useState([]);
  const [selectedLayout, setSelectedLayout] = useState(null);
  const [message, setMessage] = useState("Loading shared layouts...");

  function getItemIcon(type) {
    if (type === "Table") return icons.utensils;
    if (type === "Stage") return icons.building2;
    return icons.mapPin;
  }

  useEffect(() => {
    async function loadSharedLayouts() {
      try {
        const loggedInUser =
          JSON.parse(localStorage.getItem("loggedInUser")) ||
          JSON.parse(localStorage.getItem("user"));

        if (!loggedInUser) {
          setMessage("No logged-in user found.");
          return;
        }

        const staffId =
          getUserIdFromToken() ||
          loggedInUser._id ||
          loggedInUser.id;

        const data = await apiFetch(`/layouts/shared/${staffId}`);

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

  function getLayoutEventName(layout) {
    return (
      layout.eventId?.title ||
      layout.eventId?.name ||
      layout.eventTitle ||
      layout.eventName ||
      "Venue Layout"
    );
  }

  const selectedElements = selectedLayout?.elements || [];

  return (
    <div className="shared-layout-tab">
      <div className="shared-layout-header">
        <div>
          <h1>Shared Floor Plan</h1>
          <p>View the digital layout shared by the organizer.</p>
        </div>

        {layouts.length > 0 && (
          <OpalSelect
            value={selectedLayout?._id || ""}
            onChange={(layoutId) => {
              const layout = layouts.find((item) => item._id === layoutId);
              setSelectedLayout(layout);
            }}
            options={layouts.map((layout) => ({
              value: layout._id,
              label: getLayoutEventName(layout),
            }))}
            placeholder="Select layout"
            accent="teal"
            style={{ minWidth: 220 }}
          />
        )}
      </div>

      {message && (
        <GlassPanel className="shared-layout-empty">
          <div className="shared-layout-empty-icon">{icons.building2}</div>
          <h2>Layout unavailable</h2>
          <p>{message}</p>
        </GlassPanel>
      )}

      {selectedLayout && (
        <>
          <div className="shared-layout-stats">
            <GlassPanel className="shared-layout-stat">
              <span>Total Items</span>
              <strong>{selectedElements.length}</strong>
            </GlassPanel>

            <GlassPanel className="shared-layout-stat">
              <span>Tables</span>
              <strong>
                {selectedElements.filter((item) => item.type === "Table").length}
              </strong>
            </GlassPanel>

            <GlassPanel className="shared-layout-stat">
              <span>Chairs</span>
              <strong>
                {selectedElements.filter((item) => item.type === "Chair").length}
              </strong>
            </GlassPanel>

            <GlassPanel className="shared-layout-stat">
              <span>Event Areas</span>
              <strong>
                {
                  selectedElements.filter((item) =>
                    ["Stage", "Booth", "Entrance"].includes(item.type)
                  ).length
                }
              </strong>
            </GlassPanel>
          </div>

          <GlassPanel className="shared-layout-panel">
            <div className="shared-layout-panel-header">
              <div>
                <h2>{getLayoutEventName(selectedLayout)}</h2>
                <p>Organizer-approved floor plan for this event.</p>
              </div>

              <span className="shared-layout-badge">
                {selectedElements.length} elements
              </span>
            </div>

            <div className="staff-floor-plan">
              {selectedElements.map((item) => (
                <div
                  key={item.elementId}
                  className={`staff-layout-item ${item.type.toLowerCase()}`}
                  style={{
                    left: `${item.x}px`,
                    top: `${item.y}px`,
                    transform: `rotate(${item.rotation || 0}deg)`,
                  }}
                  title={item.label || item.type}
                >
                  <span>{getItemIcon(item.type)}</span>
                  
                </div>
              ))}
            </div>
          </GlassPanel>
        </>
      )}
    </div>
  );
}

export default StaffSharedLayout;