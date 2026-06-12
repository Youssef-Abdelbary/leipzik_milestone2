import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./pages/pageRegister";
import RegisterForOthers from "./pages/pageRegisterOthers";
import UserDeactivation from "./pages/pageDeactivate";
import Login from "./pages/Login";
import VenueLayoutDesigner from "./pages/VenueLayoutDesigner";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/registerOthers" element={<RegisterForOthers />} />
        <Route path="/deactivate" element={<UserDeactivation />} />
        <Route path="/organizer/venue-layout" element={<VenueLayoutDesigner />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;