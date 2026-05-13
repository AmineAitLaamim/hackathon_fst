import { Bell, Compass, Users, MapPinned } from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/friends", label: "Friends", icon: Users },
  { to: "/groups", label: "Groups", icon: MapPinned },
  { to: "/notifications", label: "Notifications", icon: Bell },
];

export function AppLayout({ children }) {
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
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}
