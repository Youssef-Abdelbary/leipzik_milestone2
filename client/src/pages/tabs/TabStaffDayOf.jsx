import { useEffect, useState } from "react";
import { getGuests, updateGuestCheckIn } from "../../services/serviceGuestList";
import {
  getEventVendorsForStaff,
  markVendorArrived,
} from "../../services/serviceStaffDayOf";
import "./TabStaffDayOf.css";

const CHECKIN_OPTIONS = ["Hasn't Arrived", "Arrived"];
function normalizeCheckInStatus(status) {
  if (!status) return "Hasn't Arrived";

  if (
    status === "Hasn't Arrived" ||
    status === "not_arrived" ||
    status === "Not Arrived"
  ) {
    return "Hasn't Arrived";
  }

  if (status === "Arrived" || status === "arrived") {
    return "Arrived";
  }

  return status;
}

export default function TabStaffDayOf() {
  const [staffId, setStaffId] = useState("");
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedEventTitle, setSelectedEventTitle] = useState("");

  const [guests, setGuests] = useState([]);
  const [vendors, setVendors] = useState([]);

  const [guestStatusFilter, setGuestStatusFilter] = useState("all");
  const [vendorStatusFilter, setVendorStatusFilter] = useState("all");
  
  const [loading, setLoading] = useState(false);
  const [expandedGuestId, setExpandedGuestId] = useState(null);
  useEffect(() => {
    const loggedInUser =
      JSON.parse(localStorage.getItem("loggedInUser")) ||
      JSON.parse(localStorage.getItem("user"));

    const id = loggedInUser?._id || loggedInUser?.id;

    if (!id) {
      console.warn("No logged-in staff found.");
      return;
    }

    setStaffId(id);
  }, []);

  useEffect(() => {
    if (!staffId) return;
    loadStaffEvents();
  }, [staffId]);

  useEffect(() => {
    if (!staffId || !selectedEventId) return;

    loadGuestsForEvent();
    loadVendorsForEvent();
  }, [staffId, selectedEventId]);

  async function loadStaffEvents() {
    const response = await fetch(
      `http://localhost:5001/api/staff-tasks/events/${staffId}`
    );

    const data = await response.json();
    setEvents(data);
  }

  async function loadGuestsForEvent() {
    const data = await getGuests(staffId, selectedEventId);
    setGuests(data.data || []);
  }

  async function loadVendorsForEvent() {
    const data = await getEventVendorsForStaff(staffId, selectedEventId);
    setVendors(data || []);
  }

  async function handleCheckInChange(guestId, newStatus) {
    try {
      setLoading(true);

      const res = await updateGuestCheckIn(guestId, newStatus, "manual");

      const updatedGuest = res.data;

      setGuests((prev) =>
        prev.map((guest) => (guest._id === guestId ? updatedGuest : guest))
      );
    } catch (error) {
      console.error("Failed to update guest check-in:", error);
      alert("Failed to update guest check-in.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVendorArrived(vendorRequestId) {
    try {
      setLoading(true);

      await markVendorArrived(staffId, selectedEventId, vendorRequestId);

      await loadVendorsForEvent();
    } catch (error) {
      console.error("Failed to mark vendor arrived:", error);
      alert("Failed to mark vendor as arrived.");
    } finally {
      setLoading(false);
    }
  }

  const filteredGuests = guests.filter((guest) => {
    const status = normalizeCheckInStatus(guest.checkIn?.status);

    return guestStatusFilter === "all" || status === guestStatusFilter;
  });

  const filteredVendors = vendors.filter((vendor) => {
    const status = vendor.arrivalStatus || "not_arrived";
    return vendorStatusFilter === "all" || status === vendorStatusFilter;
  });

  const totalGuests = guests.length;
  const arrivedGuests = guests.filter(
    (guest) => guest.checkIn?.status === "Arrived"
  ).length;

  const totalVendors = vendors.length;
  const arrivedVendors = vendors.filter(
    (vendor) => vendor.arrivalStatus === "arrived"
  ).length;



  return (
    <div className="staff-dayof-tab">
      <div className="staff-page-header">
        <div>
          <h1>Day-Of Logistics</h1>
          <p>
            Manage guest check-in and vendor arrival for events you are assigned
            to.
          </p>
        </div>
      </div>

      <div className="staff-summary-cards">
        <div className="staff-summary-card">
          <h3>Total Guests</h3>
          <p>{totalGuests}</p>
        </div>

        <div className="staff-summary-card">
          <h3>Arrived Guests</h3>
          <p>{arrivedGuests}</p>
        </div>

        <div className="staff-summary-card">
          <h3>Total Vendors</h3>
          <p>{totalVendors}</p>
        </div>

        <div className="staff-summary-card">
          <h3>Arrived Vendors</h3>
          <p>{arrivedVendors}</p>
        </div>
      </div>

      <section className="staff-section">
        <div className="staff-section-header">
          <div>
            <h2>Participating Events</h2>
            <p>Select an event to manage day-of operations.</p>
          </div>
        </div>

        <div className="staff-list">
          {events.length === 0 && (
            <p className="staff-empty">No assigned events found.</p>
          )}

          {events.map((event) => {
            const isSelected = selectedEventId === event._id;

            return (
              <div
                key={event._id}
                className={
                  isSelected
                    ? "staff-event-card selected-event-card expanded-event-card"
                    : "staff-event-card"
                }
                onClick={() => {
                  if (isSelected) {
                    setSelectedEventId("");
                    setSelectedEventTitle("");
                    setGuests([]);
                    setVendors([]);
                  } else {
                    setSelectedEventId(event._id);
                    setSelectedEventTitle(event.title);
                  }
                }}
              >
                <div className="staff-event-main-row">
                  <div>
                    <h3>{event.title}</h3>
                    <p>
                      📅{" "}
                      {event.date
                        ? new Date(event.date).toDateString()
                        : "No date"}
                    </p>
                  </div>

                  <div className="staff-event-right">
                    <span className="staff-status-badge">{event.status}</span>
                    <span className="event-expand-arrow">
                      {isSelected ? "▲" : "▼"}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <div
                    className="dayof-expanded-content"
                    onClick={(clickEvent) => clickEvent.stopPropagation()}
                  >
                    <section className="dayof-panel">
                      <div className="dayof-panel-header">
                        <div>
                          <h2>Guest Check-In</h2>
                          <p>Update guest arrival status for this event.</p>
                        </div>

                        <select
                          value={guestStatusFilter}
                          onChange={(event) =>
                            setGuestStatusFilter(event.target.value)
                          }
                        >
                          <option value="all">All guests</option>
                          <option value="Hasn't Arrived">Hasn't Arrived</option>
                          <option value="Arrived">Arrived</option>
                        </select>
                      </div>

                      <div className="dayof-table-wrapper">
                        <table className="dayof-table">
                          <thead>
                            <tr>
                              <th>Guest</th>
                              <th>Email</th>
                              <th>RSVP</th>
                              <th>Check-in</th>
                            </tr>
                          </thead>

                          <tbody>
                            {filteredGuests.length === 0 ? (
                              <tr>
                                <td colSpan="4" className="dayof-empty-cell">
                                  No guests found.
                                </td>
                              </tr>
                            ) : (
                            filteredGuests.map((guest) => {
                            const isExpanded = expandedGuestId === guest._id;

                            return (
                                <>
                                <tr
                                    key={guest._id}
                                    className="dayof-clickable-row"
                                    onClick={() =>
                                    setExpandedGuestId(isExpanded ? null : guest._id)
                                    }
                                >
                                    <td>{guest.fullName || "Unnamed guest"}</td>
                                    <td>{guest.email || "-"}</td>
                                    <td>{guest.rsvp?.status || "pending"}</td>
                                    <td onClick={(event) => event.stopPropagation()}>
                                    <select
                                        value={normalizeCheckInStatus(guest.checkIn?.status)}
                                        onChange={(event) =>
                                        handleCheckInChange(guest._id, event.target.value)
                                        }
                                        disabled={loading}
                                    >
                                        {CHECKIN_OPTIONS.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                        ))}
                                    </select>
                                    </td>
                                </tr>

                                {isExpanded && (
                                    <tr className="dayof-expanded-guest-row">
                                    <td colSpan="4">
                                        <div className="dayof-guest-details">
                                        <DetailItem label="Phone" value={guest.phone || "-"} />
                                        <DetailItem label="Event" value={guest.eventId?.title || "-"} />
                                        <DetailItem
                                            label="Invitation Status"
                                            value={guest.invitationStatus || "-"}
                                        />
                                        <DetailItem
                                            label="RSVP Status"
                                            value={guest.rsvp?.status || "-"}
                                        />
                                        <DetailItem
                                            label="Dietary Preferences"
                                            value={(guest.rsvp?.dietaryPreferences || []).join(", ") || "-"}
                                        />
                                        <DetailItem
                                            label="Special Requirements"
                                            value={guest.rsvp?.specialRequirements || "-"}
                                        />
                                        <DetailItem
                                            label="QR Code"
                                            value={guest.qrCode?.code || "-"}
                                        />
                                        <DetailItem
                                            label="Check-in Status"
                                            value={guest.checkIn?.status || "-"}
                                        />
                                        <DetailItem
                                            label="Checked In At"
                                            value={
                                            guest.checkIn?.checkedInAt
                                                ? new Date(guest.checkIn.checkedInAt).toLocaleString()
                                                : "-"
                                            }
                                        />
                                        <DetailItem
                                            label="Check-in Method"
                                            value={guest.checkIn?.method || "-"}
                                        />
                                        <DetailItem
                                            label="Invitation Sent"
                                            value={
                                            guest.invitationSentAt
                                                ? new Date(guest.invitationSentAt).toLocaleDateString()
                                                : "-"
                                            }
                                        />
                                        <DetailItem
                                            label="Confirmation Sent"
                                            value={
                                            guest.confirmationSentAt
                                                ? new Date(guest.confirmationSentAt).toLocaleDateString()
                                                : "-"
                                            }
                                        />
                                        </div>
                                    </td>
                                    </tr>
                                )}
                                </>
                            );
                            })                            )}
                          </tbody>
                        </table>
                      </div>
                    </section>

                    <section className="dayof-panel">
                      <div className="dayof-panel-header">
                        <div>
                          <h2>Vendor Arrival Coordination</h2>
                          <p>Mark vendors as arrived upon delivery.</p>
                        </div>

                        <select
                          value={vendorStatusFilter}
                          onChange={(event) =>
                            setVendorStatusFilter(event.target.value)
                          }
                        >
                          <option value="all">All vendors</option>
                          <option value="not_arrived">Not arrived</option>
                          <option value="arrived">Arrived</option>
                        </select>
                      </div>

                      <div className="vendor-card-list">
                        {filteredVendors.length === 0 && (
                          <p className="staff-empty">No vendors found.</p>
                        )}

                        {filteredVendors.map((vendor) => (
                          <div className="vendor-arrival-card" key={vendor._id}>
                            <div>
                              <h3>{vendor.vendorName}</h3>
                              <p>{vendor.serviceType}</p>
                              <p className="vendor-contact">
                                {vendor.email} • {vendor.phone}
                              </p>
                            </div>

                            <div className="vendor-arrival-actions">
                              <span
                                className={
                                  vendor.arrivalStatus === "arrived"
                                    ? "vendor-arrival-badge arrived"
                                    : "vendor-arrival-badge"
                                }
                              >
                                {vendor.arrivalStatus === "arrived"
                                  ? "Arrived"
                                  : "Not arrived"}
                              </span>

                              {vendor.arrivalStatus !== "arrived" && (
                                <button
                                  onClick={() => handleVendorArrived(vendor._id)}
                                  disabled={loading}
                                >
                                  Mark Arrived
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

  function DetailItem({ label, value }) {
    return (
        <div>
        <div className="dayof-detail-label">{label}</div>
        <div className="dayof-detail-value">{value}</div>
        </div>
    );
    }