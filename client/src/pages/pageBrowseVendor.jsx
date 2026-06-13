import React, { useState, useEffect } from "react";
import { fetchVendors } from "../services/serviceBrowseVendors";

export default function VendorListPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetchVendors()
      .then((data) => {
        setVendors(data.data || []);
        setLoading(false);
      })
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
        </div>

        <div style={{ marginBottom: 20, maxWidth: 360 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, supply, or location..."
            style={{
              width: "100%", padding: "11px 14px", borderRadius: 9,
              border: "1px solid #E2E8F0", background: "#fff", fontSize: 14,
              color: "#0F172A", outline: "none", boxSizing: "border-box",
              boxShadow: "0 1px 3px rgba(15,23,42,0.05)",
            }}
          />
        </div>

        {loading ? (
          <div style={{ padding: "48px 0", textAlign: "center", color: "#94A3B8", fontSize: 14 }}>Loading vendors...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "48px 0", textAlign: "center", color: "#94A3B8", fontSize: 14 }}>No vendors match your search.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
            {filtered.map((vendor) => (
              <div key={vendor._id} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 20, boxShadow: "0 1px 6px rgba(15,23,42,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0F172A" }}>{vendor.companyName}</h3>
                  <span style={{
                    display: "inline-block", padding: "3px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600,
                    background: vendor.isActive ? "#F0FDF4" : "#FEF2F2",
                    color: vendor.isActive ? "#166534" : "#991B1B",
                  }}>
                    {vendor.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div style={{ fontSize: 13, color: "#64748B", marginBottom: 12 }}>
                  {vendor.mainLocation?.area}, {vendor.mainLocation?.city}
                </div>

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                  {(vendor.suppliesOffered || []).map((supply) => (
                    <span key={supply} style={{ fontSize: 12, fontWeight: 600, color: "#3B82F6", background: "#EFF6FF", padding: "3px 10px", borderRadius: 99 }}>
                      {supply}
                    </span>
                  ))}
                </div>

                <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Pricing</div>
                  {(vendor.pricingList || []).map((item, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#0F172A", marginBottom: 4 }}>
                      <span>{item.itemName} <span style={{ color: "#94A3B8" }}>({item.unit})</span></span>
                      <span style={{ fontWeight: 600 }}>{item.price} {item.currency}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}