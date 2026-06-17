import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Profile.css";

const roleLabels = {
    vendor: "Vendor",
    venue_owner: "Venue Owner",
    organizer: "Organizer",
    staff: "Staff",
    guest: "Guest",
};

const commonSections = [
    {
        title: "Notifications",
        description: "View your latest notifications and updates.",
        link: "/notificationsview",
    },
];

const roleSections = {
    organizer: [
        {
            title: "My Events",
            description: "Create, view, and manage your events.",
            link: "/organizer/events",
        },
        {
            title: "Register Others",
            description: "Register guests or other users for events.",
            link: "/organizer/registerothers",
        },
        {
            title: "Deactivate Users",
            description: "Manage user access and deactivate accounts.",
            link: "/organizer/deactivate",
        },
        {
            title: "Browse Venues",
            description: "Search for venues for your events.",
            link: "/organizer/browsevenues",
        },
        {
            title: "Venue Layout Designer",
            description: "Design or manage venue layouts.",
            link: "/organizer/venuelayout",
        },
        {
            title: "Browse Vendors",
            description: "Find vendors for your events.",
            link: "/organizer/browsevendors",
        },
        {
            title: "Organizer Workflow",
            description: "Track your event planning workflow.",
            link: "/organizer/workflow",
        },
        {
            title: "Budget Management",
            description: "Track event budget, costs, and expenses.",
            link: "/organizer/budget",
        },
        {
            title: "Venue Replies",
            description: "View and reply to venue-related responses.",
            link: "/organizer/reply",
        },
        {
            title: "Organizer Invoices",
            description: "View invoices related to your events.",
            link: "/organizer/invoices",
        },
        {
            title: "Vendor Tracking",
            description: "Track vendor progress and assignments.",
            link: "/organizer/vendortracking",
        },
    ],

    vendor: [
        {
            title: "Vendor Invoices",
            description: "View invoices related to your vendor services.",
            link: "/vendor/invoices",
        },
        {
            title: "Vendor Profile",
            description: "Edit your vendor service information later.",
            link: "#",
        },
    ],

    venue_owner: [
        {
            title: "My Venues",
            description: "Manage your venues and venue details.",
            link: "/venueowner/venues",
        },
        {
            title: "Venue Responses",
            description: "Respond to venue booking requests.",
            link: "/venueowner/venueresponse",
        },
        {
            title: "Venue Reports",
            description: "View reports and performance information.",
            link: "/venueowner/venuereports",
        },
        {
            title: "Booking Calendar",
            description: "View and manage venue bookings.",
            link: "/venueowner/bookingcalendar",
        },
    ],

    staff: [
        {
            title: "Staff Dashboard",
            description: "View your assigned tasks and staff tools.",
            link: "/staff/dashboard",
        },
        {
            title: "Shared Staff Layout",
            description: "Open the shared staff workspace.",
            link: "/staff/sharedlayout",
        },
        {
            title: "QR Scanner",
            description: "Scan guest QR codes for event check-in.",
            link: "/staff/qr-scanner",
        },
    ],

    guest: [
        {
            title: "My Invitations",
            description: "View invitation and RSVP details when available.",
            link: "#",
        },
        {
            title: "Feedback",
            description: "Submit feedback when you receive a feedback link.",
            link: "#",
        },
    ],
};

const Profile = () => {


    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("loggedInUser");

        navigate("/login");
    };

    const storedUser = localStorage.getItem("loggedInUser");

    const parsedUser = storedUser ? JSON.parse(storedUser) : null;

    const [user, setUser] = useState(parsedUser);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [formData, setFormData] = useState({
        fullname: parsedUser?.fullname || "",
        email: parsedUser?.email || "",
        phone: parsedUser?.phone || "",
    });

    if (!user) {
        return (
            <div className="profile-page">
                <p className="profile-error">No logged-in user found.</p>
            </div>
        );
    }

    const options = [
        ...commonSections,
        ...(roleSections[user.role] || []),
    ];

    const handleEditClick = () => {
        setIsEditing(true);
        setError("");
        setSuccess("");

        setFormData({
            fullname: user.fullname || "",
            email: user.email || "",
            phone: user.phone || "",
        });
    };

    const handleCancelClick = () => {
        setIsEditing(false);
        setError("");
        setSuccess("");

        setFormData({
            fullname: user.fullname || "",
            email: user.email || "",
            phone: user.phone || "",
        });
    };

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previousData) => ({
            ...previousData,
            [name]: value,
        }));
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
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to update profile");
            }

            setUser(data.user);
            localStorage.setItem("loggedInUser", JSON.stringify(data.user));

            setIsEditing(false);
            setSuccess("Profile updated successfully.");
        } catch (error) {
            setError(error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="profile-page">
            <section className="profile-hero">
                <div className="profile-hero__content">
                    <div className="profile-hero__eyebrow">Profile</div>
                    <h1 className="profile-hero__title">{user.fullname}</h1>
                    <p className="profile-hero__subtitle">
                        Manage your account, view your role tools, and keep your profile in sync with the rest of the dashboard.
                    </p>
                </div>

                <button className="profile-logout-btn" onClick={handleLogout}>
                    Logout
                </button>
            </section>

            <section className="profile-card">
                <div className="profile-header">
                    <div className="profile-avatar">
                        {user.fullname?.charAt(0)?.toUpperCase() || "U"}
                    </div>

                    <div>
                        <h1>{user.fullname}</h1>
                        <p>{roleLabels[user.role] || user.role}</p>
                    </div>
                </div>

                {error && <p className="profile-error">{error}</p>}
                {success && <p className="profile-success">{success}</p>}

                <div className="profile-info-grid">
                    <div className="profile-info-item">
                        <span>Full Name</span>

                        {isEditing ? (
                            <input
                                type="text"
                                name="fullname"
                                value={formData.fullname}
                                onChange={handleChange}
                            />
                        ) : (
                            <strong>{user.fullname}</strong>
                        )}
                    </div>

                    <div className="profile-info-item">
                        <span>Email</span>

                        {isEditing ? (
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        ) : (
                            <strong>{user.email}</strong>
                        )}
                    </div>

                    <div className="profile-info-item">
                        <span>Phone</span>

                        {isEditing ? (
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        ) : (
                            <strong>{user.phone}</strong>
                        )}
                    </div>

                    <div className="profile-info-item">
                        <span>Role</span>
                        <strong>{roleLabels[user.role] || user.role}</strong>
                    </div>

                    <div className="profile-info-item">
                        <span>Status</span>
                        <strong>{user.status}</strong>
                    </div>

                    <div className="profile-info-item">
                        <span>Joined</span>
                        <strong>
                            {user.createdAt
                                ? new Date(user.createdAt).toLocaleDateString()
                                : "Not available"}
                        </strong>
                    </div>
                </div>

                <div className="profile-actions">
                    {isEditing ? (
                        <>
                            <button
                                className="save-profile-btn"
                                onClick={handleSaveClick}
                                disabled={saving}
                            >
                                {saving ? "Saving..." : "Save Changes"}
                            </button>

                            <button
                                className="cancel-profile-btn"
                                onClick={handleCancelClick}
                                disabled={saving}
                            >
                                Cancel
                            </button>
                        </>
                    ) : (
                        <button className="edit-profile-btn" onClick={handleEditClick}>
                            Edit Profile
                        </button>
                    )}
                </div>
            </section>

            <section className="role-section">
                <h2>{roleLabels[user.role] || user.role} Options</h2>

                {options.length === 0 ? (
                    <p className="empty-options">No role options available yet.</p>
                ) : (
                    <div className="role-options-grid">
                        {options.map((option) => (
                            option.link.startsWith("/") ? (
                                <Link key={option.title} to={option.link} className="role-option-card">
                                    <h3>{option.title}</h3>
                                    <p>{option.description}</p>
                                </Link>
                            ) : (
                                <a key={option.title} href={option.link} className="role-option-card">
                                    <h3>{option.title}</h3>
                                    <p>{option.description}</p>
                                </a>
                            )
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default Profile;