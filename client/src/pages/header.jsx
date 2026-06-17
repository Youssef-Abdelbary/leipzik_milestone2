import { Link, useNavigate } from "react-router-dom";
import "./header.css";

const Header = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");

        navigate("/login");
    };

    return (
        <header className="header">
            <h2 className="logo">PopEyez</h2>

            <nav className="nav">
                <Link to="/profile" className="profile-icon">
                    👤 Profile
                </Link>

                <button onClick={handleLogout} className="logout-btn">
                    Logout
                </button>
            </nav>
        </header>
    );
};

export default Header;