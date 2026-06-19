import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Register from "./pages/pageRegister";
import RegisterForOthers from "./pages/pageRegisterOthers";
import UserDeactivation from "./pages/pageDeactivate";
import Login from "./pages/Login";
import VenuesPage from "./pages/pageVenue.jsx";
import GuestList from "./pages/pageGuestList";
import PageResponseVenue from "./pages/pageResponseVenue.jsx";
import BookingCalendar from "./pages/pageBookingCalendar";
import VenueReports from "./pages/pageVenueReports";
import StaffSharedLayoutRedirect from "./pages/pageStaffSharedLayoutRedirect";
import Events from "./pages/pageEvents";
import EventWorkspace from "./pages/pageEventWorkspace";
import RsvpPage from "./pages/pageRsvp";
import NotificationsPage from "./pages/pageNotificationsView";
import OrganizerWorkflow from "./pages/pageOrganizerWorkflow";
import BudgetManagement from "./pages/pageBudgetManagement";
import FeedbackPage from "./pages/pageFeedback";
import InvoiceOrganizerPage from "./pages/pageInvoicesOrganizer";
import StaffQRScanner from "./pages/pageStaffQRScanner";
import StaffTasks from "./pages/pageStaffTasks";
import VendorDashboard from "./pages/pageVendorDashboard";
import Layout from "./pages/layout";
import ProfilePage from "./pages/pageProfile";
import ProtectedRoute from "./components/ProtectedRoute";

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
        <Route path="/register" element={<Register />} />
        <Route path="/guest/rsvp/:token" element={<RsvpPage />} />
        <Route path="/guest/feedback/:token" element={<FeedbackPage />} />

        <Route
          path="/organizer/events"
          element={
            <ProtectedRoute roles={["organizer"]}>
              <Events />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizer/events/:eventId/workspace"
          element={
            <ProtectedRoute roles={["organizer"]}>
              <EventWorkspace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizer/vendortracking"
          element={<Navigate to="/organizer/events" replace />}
        />
        <Route
          path="/vendor/invoices"
          element={<Navigate to="/vendor/dashboard?tab=invoices" replace />}
        />
        <Route
          path="/staff/qr-scanner"
          element={
            <ProtectedRoute roles={["staff", "organizer"]}>
              <StaffQRScanner />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendor/dashboard"
          element={
            <ProtectedRoute roles={["vendor"]}>
              <VendorDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route
            path="/staff/guestlist"
            element={
              <ProtectedRoute roles={["staff"]}>
                <GuestList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/registerothers"
            element={
              <ProtectedRoute roles={["organizer"]}>
                <RegisterForOthers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/deactivate"
            element={
              <ProtectedRoute roles={["organizer"]}>
                <UserDeactivation />
              </ProtectedRoute>
            }
          />

          <Route
            path="/venueowner/venues"
            element={
              <ProtectedRoute roles={["venue_owner"]}>
                <VenuesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/venueowner/venueresponse"
            element={
              <ProtectedRoute roles={["venue_owner"]}>
                <PageResponseVenue currentUserId={currentUserId} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/venueowner/venuereports"
            element={
              <ProtectedRoute roles={["venue_owner"]}>
                <VenueReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/venueowner/bookingcalendar"
            element={
              <ProtectedRoute roles={["venue_owner"]}>
                <BookingCalendar />
              </ProtectedRoute>
            }
          />

          <Route
            path="/staff/sharedlayout"
            element={
              <ProtectedRoute roles={["staff"]}>
                <StaffSharedLayoutRedirect />
              </ProtectedRoute>
            }
          />
          <Route path="/notificationsview" element={<NotificationsPage />} />

          <Route
            path="/organizer/browsevendors"
            element={<Navigate to="/organizer/events" replace />}
          />
          <Route
            path="/organizer/workflow"
            element={
              <ProtectedRoute roles={["organizer"]}>
                <OrganizerWorkflow />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/budget"
            element={
              <ProtectedRoute roles={["organizer"]}>
                <BudgetManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/invoices"
            element={
              <ProtectedRoute roles={["organizer"]}>
                <InvoiceOrganizerPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/staff/dashboard"
            element={
              <ProtectedRoute roles={["staff"]}>
                <StaffTasks />
              </ProtectedRoute>
            }
          />

          <Route path="/pageProfile" element={<ProfilePage />} />
          <Route path="/profile" element={<Navigate to="/pageProfile" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
