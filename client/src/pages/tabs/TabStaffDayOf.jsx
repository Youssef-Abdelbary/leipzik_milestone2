import { Fragment, useEffect, useState } from "react";
import { getGuests, updateGuestCheckIn } from "../../services/serviceGuestList";
import {
  getEventVendorsForStaff,
  markVendorArrived,
} from "../../services/serviceStaffDayOf";
import { fetchStaffEvents } from "../../services/serviceStaffTasks";
import { OpalSelect } from "../../components/componentMenus";
import { icons, GlassPanel } from "../../components/componentTheme";
import "../../components/componentTheme.css";
import "./TabStaffDayOf.css";

const CHECKIN_OPTIONS = [
  { value: "Hasn't Arrived", label: "Hasn't Arrived" },
  { value: "Arrived", label: "Arrived" },
];

const GUEST_FILTER_OPTIONS = [
  { value: "all", label: "All guests" },
  { value: "Hasn't Arrived", label: "Hasn't Arrived" },
  { value: "Arrived", label: "Arrived" },
];

const VENDOR_FILTER_OPTIONS = [
  { value: "all", label: "All vendors" },
  { value: "not_arrived", label: "Not arrived" },
  { value: "arrived", label: "Arrived" },
];

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
    const data = await fetchStaffEvents(staffId);
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
    (guest) => normalizeCheckInStatus(guest.checkIn?.status) === "Arrived"
  ).length;

  const totalVendors = vendors.length;

  const arrivedVendors = vendors.filter(
    (vendor) => vendor.arrivalStatus === "arrived"
  ).length;

  const selectedEvent = events.find((event) => event._id === selectedEventId);

  return (
    <div className="staff-dayof-tab">
      <div className="dayof-page-header">
        <div>
          <h1>Day-Of Logistics</h1>
          <p>
            Manage guest check-in and vendor arrivals for your assigned events.
          </p>
        </div>

        {selectedEvent && (
          <span className="dayof-selected-event-badge">
            {icons.calendar} {selectedEvent.title}
          </span>
        )}
      </div>

      <div className="dayof-summary-cards">
        <GlassPanel className="dayof-summary-card">
          <span>Total Guests</span>
          <strong>{totalGuests}</strong>
        </GlassPanel>

        <GlassPanel className="dayof-summary-card">
          <span>Arrived Guests</span>
          <strong>{arrivedGuests}</strong>
        </GlassPanel>

        <GlassPanel className="dayof-summary-card">
          <span>Total Vendors</span>
          <strong>{totalVendors}</strong>
        </GlassPanel>

        <GlassPanel className="dayof-summary-card">
          <span>Arrived Vendors</span>
          <strong>{arrivedVendors}</strong>
        </GlassPanel>
      </div>

      <GlassPanel className="dayof-section">
        <div className="dayof-section-header">
          <div>
            <h2>Participating Events</h2>
            <p>Select an event to manage day-of operations.</p>
          </div>
        </div>

        <div className="dayof-event-list">
          {events.length === 0 && (
            <p className="dayof-empty">No assigned events found.</p>
          )}

          {events.map((event) => {
            const isSelected = selectedEventId === event._id;

            return (
              <div
                key={event._id}
                className={
                  isSelected
                    ? "dayof-event-card selected expanded"
                    : "dayof-event-card"
                }
                onClick={() => {
                  if (isSelected) {
                    setSelectedEventId("");
                    setGuests([]);
                    setVendors([]);
                    setExpandedGuestId(null);
                  } else {
                    setSelectedEventId(event._id);
                    setExpandedGuestId(null);
                  }
                }}
              >
                <div className="dayof-event-main-row">
                  <div>
                    <h3>{event.title}</h3>
                    <p>
                      {icons.calendar}{" "}
                      {event.date
                        ? new Date(event.date).toDateString()
                        : "No date"}
                    </p>
                  </div>

                  <div className="dayof-event-right">
                    <span className="dayof-status-badge">
                      {event.status || "planning"}
                    </span>
                    <span className="dayof-expand-arrow">
                      {isSelected ? icons.chevronUp : icons.chevronDown}
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

                        <OpalSelect
                          value={guestStatusFilter}
                          onChange={setGuestStatusFilter}
                          options={GUEST_FILTER_OPTIONS}
                          placeholder="Guest filter"
                          accent="teal"
                        />
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
                                const isExpanded =
                                  expandedGuestId === guest._id;

                                return (
                                  <Fragment key={guest._id}>
                                    <tr
                                      className="dayof-clickable-row"
                                      onClick={() =>
                                        setExpandedGuestId(
                                          isExpanded ? null : guest._id
                                        )
                                      }
                                    >
                                      <td>{guest.fullName || "Unnamed guest"}</td>
                                      <td>{guest.email || "-"}</td>
                                      <td>{guest.rsvp?.status || "pending"}</td>
                                      <td
                                        onClick={(event) =>
                                          event.stopPropagation()
                                        }
                                      >
                                        <OpalSelect
                                          value={normalizeCheckInStatus(
                                            guest.checkIn?.status
                                          )}
                                          onChange={(value) =>
                                            handleCheckInChange(guest._id, value)
                                          }
                                          options={CHECKIN_OPTIONS}
                                          accent="teal"
                                          disabled={loading}
                                          style={{ minWidth: 150 }}
                                        />
                                      </td>
                                    </tr>

                                    {isExpanded && (
                                      <tr className="dayof-expanded-guest-row">
                                        <td colSpan="4">
                                          <div className="dayof-guest-details">
                                            <DetailItem
                                              label="Phone"
                                              value={guest.phone || "-"}
                                            />
                                            <DetailItem
                                              label="Event"
                                              value={
                                                guest.eventId?.title || "-"
                                              }
                                            />
                                            <DetailItem
                                              label="Invitation Status"
                                              value={
                                                guest.invitationStatus || "-"
                                              }
                                            />
                                            <DetailItem
                                              label="RSVP Status"
                                              value={guest.rsvp?.status || "-"}
                                            />
                                            <DetailItem
                                              label="Dietary Preferences"
                                              value={
                                                (
                                                  guest.rsvp
                                                    ?.dietaryPreferences || []
                                                ).join(", ") || "-"
                                              }
                                            />
                                            <DetailItem
                                              label="Special Requirements"
                                              value={
                                                guest.rsvp
                                                  ?.specialRequirements || "-"
                                              }
                                            />
                                            <DetailItem
                                              label="QR Code"
                                              value={guest.qrCode?.code || "-"}
                                            />
                                            <DetailItem
                                              label="Check-in Status"
                                              value={
                                                normalizeCheckInStatus(
                                                  guest.checkIn?.status
                                                ) || "-"
                                              }
                                            />
                                            <DetailItem
                                              label="Checked In At"
                                              value={
                                                guest.checkIn?.checkedInAt
                                                  ? new Date(
                                                      guest.checkIn.checkedInAt
                                                    ).toLocaleString()
                                                  : "-"
                                              }
                                            />
                                            <DetailItem
                                              label="Check-in Method"
                                              value={
                                                guest.checkIn?.method || "-"
                                              }
                                            />
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </Fragment>
                                );
                              })
                            )}
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

                        <OpalSelect
                          value={vendorStatusFilter}
                          onChange={setVendorStatusFilter}
                          options={VENDOR_FILTER_OPTIONS}
                          placeholder="Vendor filter"
                          accent="teal"
                        />
                      </div>

                      <div className="vendor-card-list">
                        {filteredVendors.length === 0 && (
                          <p className="dayof-empty">No vendors found.</p>
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
      </GlassPanel>
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