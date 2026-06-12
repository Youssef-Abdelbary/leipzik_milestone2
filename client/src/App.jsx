import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./pages/pageRegister";
import RegisterForOthers from "./pages/pageRegisterOthers";
import UserDeactivation from "./pages/pageDeactivate";
import GuestList from "./pages/pageGuestList";
import Login from "./pages/Login";
<<<<<<< HEAD
import VenueLayoutDesigner from "./pages/VenueLayoutDesigner";
=======
import VenuesPage from "./pages/pageVenue";
import BrowseVenuesPage from "./pages/pageBrowseVenue";

>>>>>>> c6a2b807ccbc869ce28ebb95e999d79448b8d04c

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
<<<<<<< HEAD
        <Route path="/organizer/venue-layout" element={<VenueLayoutDesigner />} />
=======
        <Route path="/venues" element={<VenuesPage />} />
        <Route path="/browseVenues" element={<BrowseVenuesPage />} />

>>>>>>> c6a2b807ccbc869ce28ebb95e999d79448b8d04c
      </Routes>
    </BrowserRouter>
  );
}

export default App;