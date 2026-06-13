import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./pages/pageRegister";
import RegisterForOthers from "./pages/pageRegisterOthers";
import UserDeactivation from "./pages/pageDeactivate";
import Login from "./pages/Login";
import VenuesPage from "./pages/pageVenue";
import BrowseVenuesPage from "./pages/pageBrowseVenue";
import VenueLayoutDesigner from "./pages/organizer/VenueLayoutDesigner";
import GuestList from "./pages/pageGuestList";
import StaffSharedLayout from "./pages/StaffSharedLayout";
import Events from "./pages/pageEvents";
import EventWorkspace from "./pages/pageEventWorkspace";
import RsvpPage from "./pages/pageRsvp";
import NotificationsPage from "./pages/pageNotificationsView";
import BrowseVendorsPage from "./pages/pageBrowseVendor";
import OrganizerWorkflow from "./pages/pageOrganizerWorkflow";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/guestList" element={<GuestList />} />
        <Route path="/register" element={<Register />} />
        <Route path="/registerOthers" element={<RegisterForOthers />} />
        <Route path="/deactivate" element={<UserDeactivation />} />
        <Route path="/venues" element={<VenuesPage />} />
        <Route path="/browseVenues" element={<BrowseVenuesPage />} />
        <Route path="/organizer/venue-layout" element={<VenueLayoutDesigner />} />
        <Route path="/staff/shared-layout" element={<StaffSharedLayout />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:eventId/workspace" element={<EventWorkspace />} />
        <Route path="/rsvp/:token" element={<RsvpPage />} />
        <Route path="/notificationsView" element={<NotificationsPage />} />
        <Route path="/browseVendors" element={<BrowseVendorsPage />} />
        <Route path="/organizer/workflow" element={<OrganizerWorkflow />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;