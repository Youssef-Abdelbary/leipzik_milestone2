import { VscHome, VscCalendar, VscPerson, VscLayout, VscOrganization } from "react-icons/vsc";
import { FaQrcode } from "react-icons/fa";

export const STAFF_DASHBOARD_PATH = "/staff/dashboard";
export const STAFF_QR_PATH = "/staff/qr-scanner";

export const STAFF_TAB_DEFS = [
  { id: "tasks", label: "Tasks", icon: VscHome, path: STAFF_DASHBOARD_PATH },
  { id: "layout", label: "Layout", icon: VscLayout, path: STAFF_DASHBOARD_PATH },
  { id: "dayof", label: "Day-Of", icon: VscCalendar, path: STAFF_DASHBOARD_PATH },
  { id: "guests", label: "Guests", icon: VscOrganization, path: STAFF_DASHBOARD_PATH },
  { id: "qr", label: "QR Scan", icon: FaQrcode, path: STAFF_QR_PATH },
  { id: "profile", label: "Profile", icon: VscPerson, path: "/pageProfile" },
];

export function buildStaffDockItems(navigate, activeTab) {
  return STAFF_TAB_DEFS.map((tab) => {
    const Icon = tab.icon;
    return {
      icon: <Icon size={26} />,
      label: tab.label,
      active: activeTab === tab.id,
      onClick: () => {
        if (tab.id === "profile") {
          navigate(tab.path);
          return;
        }
        if (tab.id === "qr") {
          navigate(STAFF_QR_PATH);
          return;
        }
        navigate(STAFF_DASHBOARD_PATH, { state: { activeTab: tab.id } });
      },
    };
  });
}

export function getStaffTabLabel(activeTab) {
  return STAFF_TAB_DEFS.find((tab) => tab.id === activeTab)?.label || "Staff";
}
