import { Navigate } from "react-router-dom";

export default function StaffSharedLayoutRedirect() {
  return <Navigate to="/staff/dashboard" replace state={{ activeTab: "layout" }} />;
}
