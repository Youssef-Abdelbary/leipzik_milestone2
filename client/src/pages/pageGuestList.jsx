import React, { useState, useEffect } from "react";
import { getGuests, updateGuestCheckIn } from "../services/serviceGuestList";
import { log } from "../utils/logger";

const RSVP_OPTIONS = ["pending", "attending", "tentative", "declined"];
const CHECKIN_OPTIONS = ["Hasn't Arrived", "Arrived"];

export default function GuestListPage() {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [rsvpFilter, setRsvpFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    
    getGuests()
      .then((data) => {
        setGuests(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    }, []);

  const handleCheckInChange = (guestId, newStatus) => {
    updateGuestCheckIn(guestId, newStatus, "qr")
        .then((res) => {
            log("My guest:", guests.find(g => g._id === guestId));
            // 2. Grab the fully updated guest object from your backend response
            const updatedGuest = res.data; 
            log("Updated guest from backend:", updatedGuest);
            // 3. Replace the old guest in your React state with this fresh backend data
            setGuests((prev) =>
                prev.map((g) => (g._id === guestId ? updatedGuest : g))
            );
        })
        .catch((error) => {
            console.error("Failed to update guest check-in:", error);
            // Handle error UI here if you want to
    });
  };

  // Build list of unique events for the event filter dropdown
  const eventOptions = [];
  const seenEventIds = new Set();
  guests.forEach((g) => {
    const ev = g.eventId;
    const id = ev?._id || ev;
    if (id && !seenEventIds.has(id)) {
      seenEventIds.add(id);
      eventOptions.push({ id, title: ev?.title || String(id) });
    }
  });

  const filtered = guests.filter((g) => {
    const matchesQuery =
      (g.fullName || "").toLowerCase().includes(query.toLowerCase()) ||
      (g.email || "").toLowerCase().includes(query.toLowerCase());

    const matchesRsvp = rsvpFilter === "all" || (g.rsvp?.status || "pending") === rsvpFilter;

    const guestEventId = g.eventId?._id || g.eventId;
    const matchesEvent = eventFilter === "all" || guestEventId === eventFilter;

    return matchesQuery && matchesRsvp && matchesEvent;
  });

  const selectStyle = {
    padding: "11px 14px", borderRadius: 9, border: "1px solid #E2E8F0",
    background: "#fff", fontSize: 13, fontWeight: 600, color: "#0F172A",
    outline: "none", boxShadow: "0 1px 3px rgba(15,23,42,0.05)", cursor: "pointer",
  };

  const smallSelectStyle = {
    padding: "6px 10px", borderRadius: 7, border: "1px solid #E2E8F0",
    background: "#fff", fontSize: 13, color: "#0F172A", outline: "none", cursor: "pointer",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ background: "#0F172A", padding: "0 32px", display: "flex", alignItems: "center", height: 60, gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: 14 }}>⚙</span>
          </div>
          <span style={{ color: "#F8FAFC", fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em" }}>PopEyez</span>
        </div>
        <span style={{ color: "#475569", fontSize: 13, marginLeft: 4 }}>/ Guest List</span>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 24px" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.03em" }}>Guests</h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "#64748B" }}>View and manage guest list. Click a row for details.</p>
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", maxWidth: 320, flex: 1, minWidth: 220 }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email..."
              style={{
                width: "100%", padding: "11px 14px", borderRadius: 9,
                border: "1px solid #E2E8F0", background: "#fff", fontSize: 14,
                color: "#0F172A", outline: "none", boxSizing: "border-box",
                boxShadow: "0 1px 3px rgba(15,23,42,0.05)",
              }}
            />
          </div>

          <select value={rsvpFilter} onChange={(e) => setRsvpFilter(e.target.value)} style={selectStyle}>
            <option value="all">All RSVP</option>
            {RSVP_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>

          <select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)} style={selectStyle}>
            <option value="all">All Events</option>
            {eventOptions.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
          </select>
        </div>

        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 6px rgba(15,23,42,0.06)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                {["Guest", "Email", "Event", "RSVP", "Check-in"].map((h) => (
                  <th key={h} style={{ padding: "11px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: "48px 20px", textAlign: "center", color: "#94A3B8", fontSize: 14 }}>Loading guests...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: "48px 20px", textAlign: "center", color: "#94A3B8", fontSize: 14 }}>No guests match your search.</td></tr>
              ) : filtered.map((guest, i) => {
                const isExpanded = expandedId === guest._id;
                return (
                  <React.Fragment key={guest._id}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : guest._id)}
                      style={{ borderBottom: isExpanded ? "none" : (i < filtered.length - 1 ? "1px solid #F1F5F9" : "none"), cursor: "pointer" }}
                    >
                      <td style={{ padding: "14px 20px", fontSize: 14, fontWeight: 600, color: "#0F172A" }}>{guest.fullName || "Unnamed guest"}</td>
                      <td style={{ padding: "14px 20px", fontSize: 12, color: "#94A3B8", fontFamily: "'SF Mono', 'Fira Code', monospace" }}>{guest.email}</td>
                      <td style={{ padding: "14px 20px", fontSize: 13, color: "#64748B" }}>{guest.eventId?.title || "-"}</td>
                      <td style={{ padding: "14px 20px", fontSize: 13, color: "#64748B" }}>{guest.rsvp?.status || "pending"}</td>
                      <td style={{ padding: "14px 20px" }} onClick={(e) => e.stopPropagation()}>
                        <select
                          value={guest.checkIn?.status || "Hasn't Arrived"}
                          onChange={(e) => handleCheckInChange(guest._id, e.target.value)}
                          style={smallSelectStyle}
                        >
                          {CHECKIN_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr style={{ borderBottom: i < filtered.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                        <td colSpan={5} style={{ padding: "0 20px 20px 20px", background: "#F8FAFC" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, padding: "16px", background: "#fff", border: "1px solid #E2E8F0", borderRadius: 9 }}>
                            <DetailItem label="Phone" value={guest.phone || "-"} />
                            <DetailItem label="Event" value={guest.eventId?.title || "-"} />
                            <DetailItem label="Invitation Status" value={guest.invitationStatus || "-"} />
                            <DetailItem label="RSVP Status" value={guest.rsvp?.status || "-"} />
                            <DetailItem label="Dietary Preferences" value={(guest.rsvp?.dietaryPreferences || []).join(", ") || "-"} />
                            <DetailItem label="Special Requirements" value={guest.rsvp?.specialRequirements || "-"} />
                            <DetailItem label="QR Code" value={guest.qrCode?.code || "-"} />
                            <DetailItem label="Check-in Status" value={guest.checkIn?.status || "-"} />
                            <DetailItem label="Checked In At" value={guest.checkIn?.checkedInAt ? new Date(guest.checkIn.checkedInAt).toLocaleString() : "-"} />
                            <DetailItem label="Check-in Method" value={guest.checkIn?.method || "-"} />
                            <DetailItem label="Invitation Sent" value={guest.invitationSentAt ? new Date(guest.invitationSentAt).toLocaleDateString() : "-"} />
                            <DetailItem label="Confirmation Sent" value={guest.confirmationSentAt ? new Date(guest.confirmationSentAt).toLocaleDateString() : "-"} />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, color: "#0F172A", fontWeight: 500 }}>{value}</div>
    </div>
  );
}