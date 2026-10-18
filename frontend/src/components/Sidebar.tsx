import { NavLink } from "react-router-dom";
import { House, Search, Bell, Star, UserRound } from "lucide-react";
import { useAuth } from "../auth/AuthProvider"
import "../styles/Sidebar.css";

export default function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <h2>RoomieReport</h2>
        <p>CSUN student community</p>
      </div>

      <p className="sidebar__label">WORKSPACE</p>

      <nav className="sidebar__nav">
        <NavLink to="/" end>
          <House size={18} />
          Dashboard
        </NavLink>

        <NavLink to="/find">
          <Search size={18} />
          Find roommates
        </NavLink>

        <NavLink to="/requests">
          <Bell size={18} />
          Requests
        </NavLink>

        <NavLink to="/reviews">
          <Star size={18} />
          My reviews
        </NavLink>

        <NavLink to="/profile">
          <UserRound size={18} />
          My profile
        </NavLink>
      </nav>

      {user && (
        <div className="sidebar__user">
          <strong>{user.name}</strong>
          <p>Verified CSUN student</p>
        </div>
      )}
    </aside>
  );
}