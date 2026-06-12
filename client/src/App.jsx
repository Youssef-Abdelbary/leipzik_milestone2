import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./pages/pageRegister";
import RegisterForOthers from "./pages/pageRegisterOthers";
import UserDeactivation from "./pages/pageDeactivate";
import Login from "./pages/Login";
import VenuesPage from "./pages/pageVenue";
import BrowseVenuesPage from "./pages/pageBrowseVenue";
import VenueLayoutDesigner from "./pages/VenueLayoutDesigner";
import GuestList from "./pages/pageGuestList";
import PageResponseVenue from "./pages/PageResponseVenue";

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
        <Route path="/guestList" element={<GuestList />} />
        <Route path="/register" element={<Register />} />
        <Route path="/registerOthers" element={<RegisterForOthers />} />
        <Route path="/deactivate" element={<UserDeactivation />} />
        <Route path="/venues" element={<VenuesPage />} />
        <Route path="/browseVenues" element={<BrowseVenuesPage />} />
        <Route path="/organizer/venue-layout" element={<VenueLayoutDesigner />} />
        <Route path="/venueResponse" element={<PageResponseVenue currentUserId={currentUserId} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;