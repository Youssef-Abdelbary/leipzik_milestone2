import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./pages/pageRegister";
import RegisterForOthers from "./pages/pageRegisterOthers";
import UserDeactivation from "./pages/pageDeactivate";
import VenuesPage from "./pages/pageVenue";
import BrowseVenuesPage from "./pages/pageBrowseVenue";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/registerOthers" element={<RegisterForOthers />} />
        <Route path="/deactivate" element={<UserDeactivation />} />
        <Route path="/venues" element={<VenuesPage />} />
        <Route path="/browseVenues" element={<BrowseVenuesPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;