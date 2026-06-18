import { Outlet, useNavigate, useLocation } from "react-router-dom";
import AppHeader from "../components/componentAppHeader.jsx";
import "./header.css";

function getStoredUser() {
    try {
        const stored = localStorage.getItem("loggedInUser");
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
}

function getUserInitials() {
    const user = getStoredUser();
    const fullname = user?.fullname || "";
    return (fullname.split(" ").map((word) => word[0] || "").join("").slice(0, 2).toUpperCase() || "U");
}

const Layout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const user = getStoredUser();
    const initials = getUserInitials();
    const showAvatar = user?.role !== "venue_owner";
    const hideHeader = location.pathname.startsWith('/venueowner') || location.pathname.startsWith('/organizer') || location.pathname.startsWith('/staff')
        || ((location.pathname === '/pageProfile' || location.pathname === '/profile') && (user?.role === 'venue_owner' || user?.role === 'organizer' || user?.role === 'staff'))
        || location.pathname === '/notificationsview';

    const flushPageContent =
        location.pathname.startsWith("/organizer/") ||
                location.pathname.startsWith("/venueowner/") ||
                location.pathname.startsWith("/staff/") ||
                        location.pathname === "/notificationsview" ||
        ((location.pathname === "/pageProfile" || location.pathname === "/profile") &&
            (user?.role === "organizer" || user?.role === "staff" || user?.role === "venue_owner"));                const lockPageScroll = location.pathname === "/organizer/deactivate";

    return (
        <>
            {!hideHeader && (
                <AppHeader
                    right={
                        showAvatar ? (
                            <button
                                type="button"
                                className="app-header__avatar"
                                onClick={() => navigate("/pageProfile")}
                            >
                                {initials}
                            </button>
                        ) : null
                    }
                />
            )}

            <main
                className={[
                    "page-content",
                    flushPageContent ? "page-content--flush" : "",
                    lockPageScroll ? "page-content--locked" : "",
                ]
                    .filter(Boolean)
                    .join(" ")}
            >                                <Outlet />
            </main>
        </>
    );
};

export default Layout;