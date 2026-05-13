import { Bell, Compass, LogOut, Mail, MapPinned, Route, Sparkles, UserRound, Users } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/useAuth.js";

const navItems = [
  { to: "/generate", label: "Generate", icon: Sparkles },
  { to: "/tours", label: "Tours", icon: Route },
  { to: "/profile", label: "Profile", icon: UserRound },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/friends", label: "Friends", icon: Users },
  { to: "/invitations", label: "Invitations", icon: Mail },
  { to: "/groups", label: "Groups", icon: MapPinned },
  { to: "/notifications", label: "Notifications", icon: Bell },
];

export function AppLayout({ children }) {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">Marrakech</div>
        <nav className="nav-list" aria-label="Main navigation">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className="nav-link">
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-user">
          <span>{user?.full_name || user?.name || user?.email || "Traveler"}</span>
          <button className="nav-link logout-link" type="button" onClick={handleLogout}>
            <LogOut size={18} aria-hidden="true" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}

export default AppLayout;
