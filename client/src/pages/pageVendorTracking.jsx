// src/pages/VendorTrackingPage.jsx
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchEventVendorRequests, updateDeliveryStatus } from "../services/serviceBrowseVendors";

export default function VendorTrackingPage() {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get("eventId") || "";
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    if (eventId) {
      loadTrackingData();
    } else {
      setLoading(false);
    }
  }, [eventId]);

  async function loadTrackingData() {
    try {
      const data = await fetchEventVendorRequests(eventId);
      setRequests(data.data || []);
    } catch (err) {
      console.error("Failed to load tracking records:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAsArrived(requestId) {
    setUpdatingId(requestId);
    try {
      await updateDeliveryStatus(requestId, {
        status: "delivered",
        estimatedArrivalTime: new Date().toISOString()
      });
      // Instant local state update for snappy performance
      setRequests(prev =>
        prev.map(r => r._id === requestId ? { ...r, delivery: { ...r.delivery, status: "delivered" } } : r)
      );
    } catch (err) {
      alert("Failed to update status. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  }

  const filteredRequests = requests.filter(r => {
    if (filterStatus === "all") return true;
    if (filterStatus === "pending_delivery") return r.delivery?.status === "preparing" || r.delivery?.status === "out_for_delivery";
    return r.delivery?.status === filterStatus;
  });

  // Common UI Styles matching PopEyez Core Theme
  const badgeStyle = (status) => {
    let bg = "#F1F5F9", color = "#475569";
    if (status === "delivered") { bg = "#F0FDF4"; color = "#166534"; }
    if (status === "out_for_delivery") { bg = "#EFF6FF"; color = "#1D4ED8"; }
    if (status === "preparing") { bg = "#FEF3C7"; color = "#92400E"; }
    return { display: "inline-block", padding: "3px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600, background: bg, color };
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Top Navbar */}
      <div style={{ background: "#0F172A", padding: "0 32px", display: "flex", alignItems: "center", height: 60, gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: 14 }}>⚙</span>
          </div>
          <span style={{ color: "#F8FAFC", fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em" }}>PopEyez</span>
        </div>
        <span style={{ color: "#475569", fontSize: 13, marginLeft: 4 }}>/ Operations Dashboard</span>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 24px" }}>
        {/* Header Section */}
        <div style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.03em" }}>Delivery Tracking</h1>
            <p style={{ margin: "4px 0 0", fontSize: 14, color: "#64748B" }}>Monitor logs and confirm logistics arrivals for your active event vendors.</p>
          </div>
          
          {/* Quick Status Filter Tabs */}
          <div style={{ display: "flex", gap: 6, background: "#E2E8F0", padding: 4, borderRadius: 8 }}>
            {["all", "pending_delivery", "delivered"].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterStatus(tab)}
                style={{
                  padding: "6px 12px", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  background: filterStatus === tab ? "#fff" : "none",
                  color: filterStatus === tab ? "#0F172A" : "#64748B",
                  boxShadow: filterStatus === tab ? "0 1px 3px rgba(15,23,42,0.08)" : "none"
                }}
              >
                {tab === "all" ? "All Vendors" : tab === "pending_delivery" ? "In Transit" : "Arrived"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "48px 0", textAlign: "center", color: "#94A3B8", fontSize: 14 }}>Loading tracking data...</div>
        ) : !eventId ? (
          <div style={{ padding: "48px 0", textAlign: "center", color: "#B45309", fontSize: 14 }}>
            Add <code>?eventId=YOUR_EVENT_ID</code> to the URL to load vendor deliveries.
          </div>
        ) : filteredRequests.length === 0 ? (
          <div style={{ padding: "48px 0", textAlign: "center", color: "#94A3B8", fontSize: 14 }}>No deliveries found under this filter option.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
            {filteredRequests.map((req) => (
              <div key={req._id} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 20, boxShadow: "0 1px 6px rgba(15,23,42,0.06)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  {/* Top Meta info */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0F172A" }}>{req.vendorId?.companyName || "Vendor Operations"}</h3>
                      <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>📍 {req.vendorId?.mainLocation?.area || "Venue Site Location"}</div>
                    </div>
                    <span style={badgeStyle(req.delivery?.status || "pending")}>
                      {req.delivery?.status ? req.delivery.status.replace(/_/g, " ") : "no data"}
                    </span>
                  </div>

                  {/* Cargo Breakdown */}
                  <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "10px 12px", marginBottom: 14, border: "1px solid #F1F5F9" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Expected Items</div>
                    {(req.requestedItems || []).map((item, idx) => (
                      <div key={idx} style={{ fontSize: 13, color: "#334155", marginBottom: 4, display: "flex", justifyContent: "space-between" }}>
                        <span>• {item.itemName}</span>
                        <span style={{ fontWeight: 600, color: "#0F172A" }}>x{item.quantity} {item.unit}</span>
                      </div>
                    ))}
                  </div>

                  {/* Timing Meta details */}
                  <div style={{ fontSize: 13, color: "#475569", marginBottom: 6, display: "flex", gap: 6 }}>
                    <span style={{ color: "#94A3B8" }}>Target Window:</span>
                    <span style={{ fontWeight: 500 }}>{req.deliveryDate ? new Date(req.deliveryDate).toLocaleDateString() : "N/A"}</span>
                  </div>
                  {req.delivery?.estimatedArrivalTime && (
                    <div style={{ fontSize: 13, color: "#475569", marginBottom: 16, display: "flex", gap: 6 }}>
                      <span style={{ color: "#94A3B8" }}>{req.delivery.status === "delivered" ? "Arrived At:" : "ETA:"}</span>
                      <span style={{ fontWeight: 500 }}>{new Date(req.delivery.estimatedArrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}
                </div>

                {/* Operations Control Actions */}
                <div style={{ marginTop: 14, borderTop: "1px solid #F1F5F9", paddingTop: 14 }}>
                  {req.delivery?.status === "delivered" ? (
                    <div style={{ width: "100%", padding: "9px 0", borderRadius: 8, background: "#F0FDF4", color: "#15803D", fontSize: 13, fontWeight: 600, textAlign: "center" }}>
                      ✓ Delivery Onsite & Confirmed
                    </div>
                  ) : (
                    <button
                      onClick={() => handleMarkAsArrived(req._id)}
                      disabled={updatingId === req._id}
                      style={{
                        width: "100%", padding: "9px 0", borderRadius: 8, border: "none", background: "#3B82F6", color: "#fff",
                        fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "background 0.2s"
                      }}
                    >
                      {updatingId === req._id ? "Processing Status..." : "Mark as Arrived"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}