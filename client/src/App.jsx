import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./pages/pageRegister";
import RegisterForOthers from "./pages/pageRegisterOthers";
import UserDeactivation from "./pages/pageDeactivate";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/register" element={<Register />} />
                <Route path="/registerOthers" element={<RegisterForOthers />} />
                <Route path="/deactivate" element={<UserDeactivation />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;