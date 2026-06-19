import { Navigate, useLocation } from "react-router-dom";

function getStoredUser() {
  try {
    const stored = localStorage.getItem("loggedInUser");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function hasToken() {
  return Boolean(localStorage.getItem("token"));
}

export default function ProtectedRoute({ children, roles }) {
  const location = useLocation();
  const user = getStoredUser();

  if (!hasToken() || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles?.length && !roles.includes(user.role)) {
    const fallback = {
      organizer: "/organizer/workflow",
      staff: "/staff/dashboard",
      vendor: "/vendor/dashboard",
      venue_owner: "/venueowner/venues",
    }[user.role];

    return <Navigate to={fallback || "/login"} replace />;
  }

  return children;
}
