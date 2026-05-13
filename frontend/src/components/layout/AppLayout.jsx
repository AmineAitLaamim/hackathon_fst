import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/useAuth.js";

export default function AppLayout() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/tours" className="brand">
          Marrakech Tours
        </NavLink>
        <nav className="nav-links" aria-label="Primary navigation">
          <NavLink to="/generate">Generate</NavLink>
          <NavLink to="/tours">Tours</NavLink>
          <NavLink to="/profile">Profile</NavLink>
        </nav>
        <div className="topbar-user">
          <span>{user?.name || user?.email || "Traveler"}</span>
          <button className="ghost-button" type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
