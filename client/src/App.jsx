import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./pages/pageRegister";
import RegisterForOthers from "./pages/pageRegisterOthers";
import UserDeactivation from "./pages/pageDeactivate";
import GuestList from "./pages/pageGuestList";
import Login from "./pages/Login";
import VenuesPage from "./pages/pageVenue";
import BrowseVenuesPage from "./pages/pageBrowseVenue";
import BrowseVendorsPage from "./pages/pageBrowseVendor";


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
        <Route path="/browseVendors" element={<BrowseVendorsPage />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;