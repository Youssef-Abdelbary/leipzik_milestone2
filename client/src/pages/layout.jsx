import { Outlet } from "react-router-dom";
import Header from "./Header";
import "./header.css";

const Layout = () => {
    return (
        <>
            <Header />

            <main className="page-content">
                <Outlet />
            </main>
        </>
    );
};

export default Layout;