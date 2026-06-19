import { useState, useEffect } from "react";
import { getGuests, updateGuestCheckIn } from "../../services/serviceGuestList";
import { OpalSelect } from "../../components/componentMenus";
import { GlassPanel } from "../../components/componentTheme";
import "../../components/componentTheme.css";
import "./TabStaffGuests.css";

const RSVP_OPTIONS = [
  { value: "all", label: "All RSVP" },
  { value: "pending", label: "Pending" },
  { value: "attending", label: "Attending" },
  { value: "tentative", label: "Tentative" },
  { value: "declined", label: "Declined" },
];

const CHECKIN_OPTIONS = [
  { value: "Hasn't Arrived", label: "Hasn't Arrived" },
  { value: "Arrived", label: "Arrived" },
];

export default function TabStaffGuests() {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [rsvpFilter, setRsvpFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const loggedInUser =
      JSON.parse(localStorage.getItem("loggedInUser")) ||
      JSON.parse(localStorage.getItem("user"));

    const staffId = loggedInUser?._id || loggedInUser?.id;

    if (!staffId) {
      setLoading(false);
      return;
    }

    getGuests(staffId)
      .then((data) => {
        setGuests(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleCheckInChange = (guestId, newStatus) => {
    updateGuestCheckIn(guestId, newStatus, "manual")
      .then((res) => {
        const updatedGuest = res.data;
        setGuests((prev) =>
          prev.map((g) => (g._id === guestId ? updatedGuest : g))
        );
      })
      .catch((error) => {
        console.error("Failed to update guest check-in:", error);
      });
  };

  const eventOptions = [{ value: "all", label: "All Events" }];
  const seenEventIds = new Set();
  guests.forEach((g) => {
    const ev = g.eventId;
    const id = ev?._id || ev;
    if (id && !seenEventIds.has(String(id))) {
      seenEventIds.add(String(id));
      eventOptions.push({ value: String(id), label: ev?.title || String(id) });
    }
  });

  const filtered = guests.filter((g) => {
    const matchesQuery =
      (g.fullName || "").toLowerCase().includes(query.toLowerCase()) ||
      (g.email || "").toLowerCase().includes(query.toLowerCase());

    const matchesRsvp =
      rsvpFilter === "all" || (g.rsvp?.status || "pending") === rsvpFilter;

    const guestEventId = String(g.eventId?._id || g.eventId || "");
    const matchesEvent = eventFilter === "all" || guestEventId === eventFilter;

    return matchesQuery && matchesRsvp && matchesEvent;
  });

  return (
    <div className="staff-guests-tab">
      <div className="staff-page-header">
        <div>
          <h1>Guest List</h1>
          <p>Guests for events you are assigned to. Update check-in status inline.</p>
        </div>
      </div>

      <div className="staff-guests-filters">
        <input
          className="staff-guests-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email..."
        />
        <OpalSelect
          value={rsvpFilter}
          onChange={setRsvpFilter}
          options={RSVP_OPTIONS}
          placeholder="RSVP filter"
        />
        <OpalSelect
          value={eventFilter}
          onChange={setEventFilter}
          options={eventOptions}
          placeholder="Event filter"
        />
      </div>

      <GlassPanel className="staff-guests-table-wrap">
        <table className="staff-guests-table">
          <thead>
            <tr>
              {["Guest", "Email", "Event", "RSVP", "Check-in"].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="staff-guests-empty">
                  Loading guests...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="staff-guests-empty">
                  No guests match your search.
                </td>
              </tr>
            ) : (
              filtered.map((guest) => {
                const isExpanded = expandedId === guest._id;
                return (
                  <GuestRow
                    key={guest._id}
                    guest={guest}
                    isExpanded={isExpanded}
                    onToggle={() =>
                      setExpandedId(isExpanded ? null : guest._id)
                    }
                    onCheckInChange={handleCheckInChange}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </GlassPanel>
    </div>
  );
}

function GuestRow({ guest, isExpanded, onToggle, onCheckInChange }) {
  return (
    <>
      <tr className="staff-guests-row" onClick={onToggle}>
        <td>{guest.fullName || "Unnamed guest"}</td>
        <td className="staff-guests-email">{guest.email}</td>
        <td>{guest.eventId?.title || "-"}</td>
        <td>{guest.rsvp?.status || "pending"}</td>
        <td onClick={(e) => e.stopPropagation()}>
          <OpalSelect
            value={guest.checkIn?.status || "Hasn't Arrived"}
            onChange={(value) => onCheckInChange(guest._id, value)}
            options={CHECKIN_OPTIONS}
            accent="teal"
            style={{ minWidth: 150 }}
          />
        </td>
      </tr>
      {isExpanded && (
        <tr className="staff-guests-detail-row">
          <td colSpan={5}>
            <div className="staff-guests-detail-grid">
              <DetailItem label="Phone" value={guest.phone || "-"} />
              <DetailItem label="Event" value={guest.eventId?.title || "-"} />
              <DetailItem label="Invitation Status" value={guest.invitationStatus || "-"} />
              <DetailItem label="RSVP Status" value={guest.rsvp?.status || "-"} />
              <DetailItem
                label="Dietary Preferences"
                value={(guest.rsvp?.dietaryPreferences || []).join(", ") || "-"}
              />
              <DetailItem
                label="Special Requirements"
                value={guest.rsvp?.specialRequirements || "-"}
              />
              <DetailItem label="QR Code" value={guest.qrCode?.code || "-"} />
              <DetailItem label="Check-in Status" value={guest.checkIn?.status || "-"} />
              <DetailItem
                label="Checked In At"
                value={
                  guest.checkIn?.checkedInAt
                    ? new Date(guest.checkIn.checkedInAt).toLocaleString()
                    : "-"
                }
              />
              <DetailItem label="Check-in Method" value={guest.checkIn?.method || "-"} />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="staff-guests-detail-item">
      <span>{label}</span>
      <p>{value}</p>
    </div>
  );
}
