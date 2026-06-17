import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { VscHome, VscMail, VscCalendar, VscBell, VscPerson } from "react-icons/vsc";

import Dock from "../components/componentDock.jsx";
import AppHeader from "../components/componentAppHeader.jsx";
import { P, GlassPanel } from "../components/componentTheme";

import "../components/componentTheme.css";
import "./Profile.css";

const roleLabels = {
    vendor: "Vendor",
    venue_owner: "Venue Owner",
    organizer: "Organizer",
    staff: "Staff",
    guest: "Guest",
};

const Profile = () => {
    const navigate = useNavigate();

    const storedUser = localStorage.getItem("loggedInUser");
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;

    const [user, setUser] = useState(parsedUser);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [formData, setFormData] = useState({
        fullname: parsedUser?.fullname || "",
        email: parsedUser?.email || "",
        phone: parsedUser?.phone || "",
        venueName: parsedUser?.venueName || "",
    });

    if (!user) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    background: "var(--opal-bg)",
                    color: P.text,
                    display: "grid",
                    placeItems: "center",
                    fontFamily: "var(--font-body)",
                }}
            >
                <GlassPanel style={{ padding: 28, maxWidth: 420, textAlign: "center" }}>
                    <p style={{ margin: 0, color: P.text }}>No logged-in user found.</p>
                </GlassPanel>
            </div>
        );
    }

    const isOwner = user.role === "venue_owner";

    const dockItems = [
        {
            icon: <VscMail size={26} />,
            label: "Requests",
            onClick: () => navigate("/venueowner/venueresponse"),
        },
        {
            icon: <VscBell size={26} />,
            label: "Notifications",
            onClick: () => navigate("/notificationsview"),
        },
        {
            icon: <VscHome size={26} />,
            label: "Home",
            onClick: () => navigate("/venueowner/venues"),
        },
        {
            icon: <VscCalendar size={26} />,
            label: "Reports",
            onClick: () => navigate("/venueowner/venuereports"),
        },
        {
            icon: <VscPerson size={26} />,
            label: "Owner Profile",
            active: true,
            onClick: () => navigate("/pageProfile"),
        },
    ];

    const section = (title, children) => (
        <div
            style={{
                background: "rgba(19,19,30,0.72)",
                backdropFilter: "blur(18px)",
                WebkitBackdropFilter: "blur(18px)",
                border: `1px solid ${P.border}`,
                borderRadius: 14,
                padding: 22,
                marginBottom: 16,
                animation: "cardIn 0.32s ease both",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
            }}
        >
            <div
                style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.09em",
                    color: P.muted,
                    marginBottom: 16,
                }}
            >
                {title}
            </div>

            {children}
        </div>
    );

    const label = (text) => (
        <div
            style={{
                fontSize: 12,
                color: P.sub,
                fontWeight: 600,
                marginBottom: 5,
            }}
        >
            {text}
        </div>
    );

    const inputStyle = {
        background: "rgba(255,255,255,0.06)",
        border: `1px solid ${P.border}`,
        borderRadius: 8,
        padding: "9px 12px",
        color: P.text,
        fontSize: 13,
        fontFamily: "inherit",
        width: "100%",
        outline: "none",
        boxSizing: "border-box",
        transition: "border-color 0.15s",
    };

    const inp = (value, onChange, placeholder, extraStyle = {}) => (
        <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            style={{
                ...inputStyle,
                ...extraStyle,
            }}
        />
    );

    const disabledInp = (value) => (
        <input
            value={value}
            disabled
            style={{
                ...inputStyle,
                background: "rgba(255,255,255,0.04)",
                color: P.muted,
                cursor: "not-allowed",
            }}
        />
    );

    const handleChange = (field, value) => {
        setFormData((previousData) => ({
            ...previousData,
            [field]: value,
        }));
    };


    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("loggedInUser");

        navigate("/login");
    };

    const handleSaveClick = async () => {
        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const token = localStorage.getItem("token");

            const response = await fetch("http://localhost:5001/api/users/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    fullname: formData.fullname,
                    email: formData.email,
                    phone: formData.phone,
                    venueName: formData.venueName,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to update profile");
            }

            const updatedUser = {
                ...user,
                ...formData,
                ...(data.user || {}),
            };

            setUser(updatedUser);
            localStorage.setItem("loggedInUser", JSON.stringify(updatedUser));

            setSuccess("Profile updated successfully.");
        } catch (err) {
            setError(err.message || "Unable to save profile.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "var(--opal-bg)",
                color: P.text,
                fontFamily: "var(--font-body)",
            }}
        >
            <style>{`
        @keyframes pageIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes cardIn {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

            <AppHeader
                crumb={isOwner ? "Owner Profile" : "Profile"}
                right={
                    isOwner ? (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "6px 14px",
                                borderRadius: 999,
                                background: P.tealGlow,
                                color: P.teal,
                                border: `1px solid ${P.teal}44`,
                                fontSize: 11,
                                fontWeight: 700,
                            }}
                        >
                            <span
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: "50%",
                                    background: P.teal,
                                    boxShadow: `0 0 8px ${P.teal}55`,
                                }}
                            />
                            Venue Owner Portal
                        </div>
                    ) : null
                }
            />

            <div
                style={{
                    maxWidth: 1100,
                    margin: "0 auto",
                    padding: "28px 24px 140px",
                    animation: "pageIn 0.3s ease",
                }}
            >
                <div style={{ marginBottom: 24 }}>
                    <h1
                        style={{
                            margin: 0,
                            fontSize: 28,
                            fontWeight: 900,
                            color: P.text,
                            letterSpacing: "-0.03em",
                            fontFamily: "var(--font-display)",
                        }}
                    >
                        {isOwner ? "Venue Owner Profile" : "Profile"}
                    </h1>

                    <p
                        style={{
                            margin: "5px 0 0",
                            fontSize: 14,
                            color: P.sub,
                            maxWidth: 760,
                        }}
                    >
                        Manage your account details, contact information, and profile settings.
                    </p>
                </div>

                {section(
                    "Account Identity",
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                            gap: 12,
                        }}
                    >
                        <div>
                            {label("Full Name")}
                            {inp(
                                formData.fullname,
                                (value) => handleChange("fullname", value),
                                "Enter full name"
                            )}
                        </div>

                        <div>
                            {label("Role")}
                            {disabledInp(roleLabels[user.role] || user.role || "Unknown")}
                        </div>

                        <div>
                            {label("Status")}
                            {disabledInp(user.status || "active")}
                        </div>

                        <div>
                            {label("Joined")}
                            {disabledInp(
                                user.createdAt
                                    ? new Date(user.createdAt).toLocaleDateString()
                                    : "Unknown"
                            )}
                        </div>
                    </div>
                )}

                {section(
                    "Contact Information",
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                            gap: 12,
                        }}
                    >
                        <div>
                            {label("Email")}
                            {inp(
                                formData.email,
                                (value) => handleChange("email", value),
                                "owner@email.com"
                            )}
                        </div>

                        <div>
                            {label("Phone")}
                            {inp(
                                formData.phone,
                                (value) => handleChange("phone", value),
                                "+20 10 ..."
                            )}
                        </div>
                    </div>
                )}

                {isOwner &&
                    section(
                        "Venue Information",
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                                gap: 12,
                            }}
                        >
                            <div style={{ gridColumn: "1 / -1" }}>
                                {label("Venue / Business Name")}
                                {inp(
                                    formData.venueName,
                                    (value) => handleChange("venueName", value),
                                    "Optional venue name"
                                )}
                            </div>
                        </div>
                    )}

                {error && (
                    <p
                        style={{
                            color: P.red,
                            fontSize: 13,
                            marginBottom: 12,
                        }}
                    >
                        {error}
                    </p>
                )}

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        flexWrap: "wrap",
                    }}
                >
                    <button
                        onClick={handleSaveClick}
                        disabled={saving}
                        style={{
                            padding: "11px 28px",
                            background: `linear-gradient(135deg, ${P.blue} 0%, ${P.teal} 100%)`,
                            border: "none",
                            borderRadius: 10,
                            color: "#0a0a12",
                            fontWeight: 700,
                            fontSize: 14,
                            cursor: saving ? "not-allowed" : "pointer",
                            fontFamily: "inherit",
                            opacity: saving ? 0.7 : 1,
                        }}
                    >
                        {saving ? "Saving..." : "Save Profile"}
                    </button>

                    <button
                        onClick={handleLogout}
                        style={{
                            padding: "11px 28px",
                            background: "rgba(220,38,38,0.16)",
                            border: "1px solid rgba(248,113,113,0.35)",
                            borderRadius: 10,
                            color: "#f87171",
                            fontWeight: 800,
                            fontSize: 14,
                            cursor: "pointer",
                            fontFamily: "inherit",
                        }}
                    >
                        Logout
                    </button>

                    {success && (
                        <span
                            style={{
                                fontSize: 13,
                                color: P.teal,
                                fontWeight: 600,
                            }}
                        >
                            {success}
                        </span>
                    )}
                </div>
            </div>

            {isOwner && <Dock items={dockItems} />}
        </div>
    );
};

export default Profile;