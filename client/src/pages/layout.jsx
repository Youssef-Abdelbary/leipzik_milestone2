import { Outlet, useNavigate } from "react-router-dom";
import AppHeader from "../components/componentAppHeader.jsx";
import "./header.css";

function getUserInitials() {
    try {
        const stored = localStorage.getItem("loggedInUser");
        if (!stored) return "U";
        const user = JSON.parse(stored);
        return (user.fullname || "").split(" ").map((word) => word[0] || "").join("").slice(0, 2).toUpperCase() || "U";
    } catch {
        return "U";
    }
}

const Layout = () => {
    const navigate = useNavigate();
    const initials = getUserInitials();

    return (
        <>
            <AppHeader
                right={
                    <button
                        type="button"
                        className="app-header__avatar"
                        onClick={() => navigate("/pageProfile")}
                    >
                        {initials}
                    </button>
                }
            />

            <main className="page-content">
                <Outlet />
            </main>
        </>
    );
};

export default Layout;