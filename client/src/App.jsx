import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./pages/pageRegister";
import RegisterForOthers from "./pages/pageRegisterOthers";
import UserDeactivation from "./pages/pageDeactivate";
import Login from "./pages/Login";
import VenuesPage from "./pages/pageVenue";
import BrowseVenuesPage from "./pages/pageBrowseVenue";
import VenueLayoutDesigner from "./pages/organizer/VenueLayoutDesigner";
import GuestList from "./pages/pageGuestList";
import PageResponseVenue from "./pages/PageResponseVenue";
import BookingCalendar from "./pages/pageBookingCalendar";
import VenueReports from "./pages/pageVenueReports";
import StaffSharedLayout from "./pages/StaffSharedLayout";
import Events from "./pages/pageEvents";
import EventWorkspace from "./pages/pageEventWorkspace";
import RsvpPage from "./pages/pageRsvp";
import NotificationsPage from "./pages/pageNotificationsView";
import BrowseVendorsPage from "./pages/pageBrowseVendor";
import OrganizerWorkflow from "./pages/pageOrganizerWorkflow";
import BudgetManagement from "./pages/pageBudgetManagement";
import InvoiceOrganizerPage from "./pages/pageInvoicesOrganizer";
import InvoiceVendorPage from "./pages/pageInvoicesVendor";

function getCurrentUserId() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.user_id ?? null;
  } catch {
    return null;
  }
}
function App() {
  const currentUserId = getCurrentUserId();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/staff/guestlist" element={<GuestList />} />
        <Route path="/register" element={<Register />} />
        <Route path="/organizer/registerothers" element={<RegisterForOthers />} />
        <Route path="/organizer/deactivate" element={<UserDeactivation />} />
        <Route path="/venueowner/venues" element={<VenuesPage />} />
        <Route path="/organizer/browsevenues" element={<BrowseVenuesPage />} />
        <Route path="/organizer/venuelayout" element={<VenueLayoutDesigner />} />
        <Route path="/venueowner/venueresponse" element={<PageResponseVenue currentUserId={currentUserId} />} />
        <Route path="/venueowner/venuereports" element={<VenueReports />} />
        <Route path="/venueowner/bookingcalendar" element={<BookingCalendar />} />
        <Route path="/staff/sharedlayout" element={<StaffSharedLayout />} />
        <Route path="/organizer/events" element={<Events />} />
        <Route path="/organizer/events/:eventId/workspace" element={<EventWorkspace />} />
        <Route path="/guest/rsvp/:token" element={<RsvpPage />} />
        <Route path="/notificationsview" element={<NotificationsPage />} />
        <Route path="/organizer/browsevendors" element={<BrowseVendorsPage />} />
        <Route path="/organizer/workflow" element={<OrganizerWorkflow />} />
        <Route path="/organizer/budget" element={<BudgetManagement />} />
        <Route path="/organizer/invoices" element={<InvoiceOrganizerPage />} />
        <Route path="/vendor/invoices" element={<InvoiceVendorPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;