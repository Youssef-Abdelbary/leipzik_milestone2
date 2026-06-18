import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchVendors, submitVendorRequest } from "../services/serviceBrowseVendors";
import { getUserIdFromToken } from "../utils/apiFetch";

function SourcingRequestModal({ vendor, eventId, organizerId, onClose }) {
  const [items, setItems] = useState(
    (vendor.pricingList || []).map((p) => ({ itemName: p.itemName, quantity: "", unit: p.unit, notes: "" }))
  );
  const [deliveryDate, setDeliveryDate] = useState("");
  const [venueName, setVenueName] = useState("");
  const [address, setAddress] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const updateItem = (i, field, val) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [field]: val } : it)));

  async function handleSubmit() {
    if (!deliveryDate || !venueName || !address || !contactName || !contactEmail || !contactPhone) {
      setError("Please fill in all required fields."); return;
    }
    const filled = items.filter((i) => i.itemName.trim() && i.quantity);
    if (!filled.length) { setError("Add at least one item with a name and quantity."); return; }

    if (!eventId || !organizerId) {
      setError("Missing event context. Open this page from an event workspace or add ?eventId=... to the URL.");
      return;
    }

    setSubmitting(true);
    const payload = {
      eventId,
      organizerId,
      vendorId: vendor._id,
      requestedItems: filled.map((i) => ({ ...i, quantity: Number(i.quantity), notes: i.notes.trim() || null })),
      deliveryDate: new Date(deliveryDate).toISOString(),
      deliveryLocation: { venueName, address },
      organizerContactSnapshot: { name: contactName, email: contactEmail, phone: contactPhone },
    };
    try {
      await submitVendorRequest(payload);
      setSubmitted(true);
    } catch {
      setError("Failed to send request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle = {
    width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #E2E8F0",
    fontSize: 13, color: "#0F172A", outline: "none", boxSizing: "border-box",
  };
  const sectionLabel = {
    fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase",
    letterSpacing: "0.06em", margin: "16px 0 8px",
  };
  const Label = ({ text, required, optional }) => (
    <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>
      {text}
      {required && <span style={{ color: "#EF4444", marginLeft: 2 }}>*</span>}
      {optional && <span style={{ color: "#94A3B8", fontWeight: 400, marginLeft: 4 }}>(optional)</span>}
    </div>
  );

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}
    >
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(15,23,42,0.18)" }}>

        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>Sourcing Request</div>
            <div style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>{vendor.companyName}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: 20 }}>✕</button>
        </div>

        {submitted ? (
          <div style={{ padding: "40px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>Request sent!</div>
            <div style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>Your sourcing request has been submitted to {vendor.companyName}.</div>
            <button onClick={onClose} style={{ marginTop: 20, padding: "9px 24px", borderRadius: 8, border: "none", background: "#3B82F6", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Done</button>
          </div>
        ) : (
          <div style={{ padding: "4px 24px 24px" }}>

            <div style={sectionLabel}>Requested Items</div>
            {items.map((item, i) => (
              <div key={i} style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: 12, marginBottom: 8 }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <div style={{ flex: 2 }}><Label text="Item name" required /><input style={inputStyle} placeholder="e.g. Open buffet" value={item.itemName} onChange={(e) => updateItem(i, "itemName", e.target.value)} /></div>
                  <div style={{ flex: 1 }}><Label text="Qty" required /><input style={inputStyle} placeholder="0" type="number" min="1" value={item.quantity} onChange={(e) => updateItem(i, "quantity", e.target.value)} /></div>
                  <div style={{ flex: 1 }}><Label text="Unit" required /><input style={inputStyle} placeholder="e.g. person" value={item.unit} onChange={(e) => updateItem(i, "unit", e.target.value)} /></div>
                </div>
                <Label text="Notes" optional />
                <input style={inputStyle} placeholder="Any special instructions..." value={item.notes} onChange={(e) => updateItem(i, "notes", e.target.value)} />
              </div>
            ))}
            <button
              onClick={() => setItems((prev) => [...prev, { itemName: "", quantity: "", unit: "", notes: "" }])}
              style={{ width: "100%", padding: "8px", borderRadius: 8, border: "1px dashed #CBD5E1", background: "none", color: "#3B82F6", fontSize: 13, fontWeight: 600, cursor: "pointer", marginTop: 2 }}
            >+ Add item</button>

            <div style={sectionLabel}>Delivery</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <div style={{ flex: 1 }}><Label text="Venue name" required /><input style={inputStyle} placeholder="e.g. Nile Garden Hall" value={venueName} onChange={(e) => setVenueName(e.target.value)} /></div>
              <div style={{ flex: 1 }}><Label text="Delivery date" required /><input style={inputStyle} type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} /></div>
            </div>
            <Label text="Delivery address" required />
            <input style={inputStyle} placeholder="e.g. Corniche El Maadi" value={address} onChange={(e) => setAddress(e.target.value)} />

            <div style={sectionLabel}>Your Contact</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <div style={{ flex: 1 }}><Label text="Full name" required /><input style={inputStyle} placeholder="Your name" value={contactName} onChange={(e) => setContactName(e.target.value)} /></div>
              <div style={{ flex: 1 }}><Label text="Phone" required /><input style={inputStyle} placeholder="+20..." value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} /></div>
            </div>
            <Label text="Email" required />
            <input style={inputStyle} placeholder="you@example.com" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />

            {error && (
              <div style={{ marginTop: 12, padding: "9px 12px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, fontSize: 13, color: "#991B1B" }}>{error}</div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff", fontSize: 13, fontWeight: 600, color: "#475569", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleSubmit} disabled={submitting} style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "#3B82F6", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                {submitting ? "Sending…" : "Send Request"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VendorListPage() {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get("eventId") || "";
  const organizerId = getUserIdFromToken() || "";
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedVendor, setSelectedVendor] = useState(null);

  useEffect(() => {
    fetchVendors()
      .then((data) => { setVendors(data.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = vendors.filter((v) => {
    const q = query.toLowerCase();
    return (
      (v.companyName || "").toLowerCase().includes(q) ||
      (v.suppliesOffered || []).some((s) => s.toLowerCase().includes(q)) ||
      (v.mainLocation?.area || "").toLowerCase().includes(q) ||
      (v.mainLocation?.city || "").toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ background: "#0F172A", padding: "0 32px", display: "flex", alignItems: "center", height: 60, gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: 14 }}>⚙</span>
          </div>
          <span style={{ color: "#F8FAFC", fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em" }}>PopEyez</span>
        </div>
        <span style={{ color: "#475569", fontSize: 13, marginLeft: 4 }}>/ Vendor List</span>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 24px" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.03em" }}>Vendors</h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "#64748B" }}>View vendor details and pricing.</p>
          {!eventId && (
            <p style={{ margin: "8px 0 0", fontSize: 13, color: "#B45309" }}>
              Add <code>?eventId=YOUR_EVENT_ID</code> to the URL to send sourcing requests.
            </p>
          )}
        </div>

        <div style={{ marginBottom: 20, maxWidth: 360 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, supply, or location..."
            style={{ width: "100%", padding: "11px 14px", borderRadius: 9, border: "1px solid #E2E8F0", background: "#fff", fontSize: 14, color: "#0F172A", outline: "none", boxSizing: "border-box", boxShadow: "0 1px 3px rgba(15,23,42,0.05)" }}
          />
        </div>

        {loading ? (
          <div style={{ padding: "48px 0", textAlign: "center", color: "#94A3B8", fontSize: 14 }}>Loading vendors...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "48px 0", textAlign: "center", color: "#94A3B8", fontSize: 14 }}>No vendors match your search.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
            {filtered.map((vendor) => (
              <div key={vendor._id} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 20, boxShadow: "0 1px 6px rgba(15,23,42,0.06)", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0F172A" }}>{vendor.companyName}</h3>
                  <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600, background: vendor.isActive ? "#F0FDF4" : "#FEF2F2", color: vendor.isActive ? "#166534" : "#991B1B" }}>
                    {vendor.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div style={{ fontSize: 13, color: "#64748B", marginBottom: 12 }}>
                  {vendor.mainLocation?.area}, {vendor.mainLocation?.city}
                </div>

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                  {(vendor.suppliesOffered || []).map((supply) => (
                    <span key={supply} style={{ fontSize: 12, fontWeight: 600, color: "#3B82F6", background: "#EFF6FF", padding: "3px 10px", borderRadius: 99 }}>{supply}</span>
                  ))}
                </div>

                <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 10, flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Pricing</div>
                  {(vendor.pricingList || []).map((item, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#0F172A", marginBottom: 4 }}>
                      <span>{item.itemName} <span style={{ color: "#94A3B8" }}>({item.unit})</span></span>
                      <span style={{ fontWeight: 600 }}>{item.price} {item.currency}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => vendor.isActive && setSelectedVendor(vendor)}
                  style={{ marginTop: 14, width: "100%", padding: "9px 0", borderRadius: 8, border: "1px solid", borderColor: vendor.isActive ? "#3B82F6" : "#E2E8F0", background: vendor.isActive ? "#EFF6FF" : "#F8FAFC", color: vendor.isActive ? "#2563EB" : "#94A3B8", fontSize: 13, fontWeight: 600, cursor: vendor.isActive ? "pointer" : "not-allowed" }}
                >
                  {vendor.isActive ? "Send Sourcing Request" : "Vendor Unavailable"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedVendor && (
        <SourcingRequestModal
          vendor={selectedVendor}
          eventId={eventId}
          organizerId={organizerId}
          onClose={() => setSelectedVendor(null)}
        />
      )}
    </div>
  );
}