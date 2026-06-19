import { Navigate } from "react-router-dom";

export default function GuestListPage() {
  return <Navigate to="/staff/dashboard" replace state={{ activeTab: "guests" }} />;
}
