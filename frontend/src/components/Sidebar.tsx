
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  House,
  Search,
  Bell,
  Star,
  UserRound,
  ChevronUp,
  ChevronDown,
  LogOut,
} from "lucide-react";

import { useAuth } from "../auth/AuthProvider";
import roommateLogo from "../assets/roomiereport-logo-white.svg";
import "../styles/Sidebar.css";

export default function Sidebar() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);

  function handleSignOut() {
    setMenuOpen(false);

    // Frontend demonstration only.
    // Replace with Firebase signOut() when authentication is ready.
    navigate("/login");
  }

  const initials = user?.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside className="sidebar">
      {/* RoomieReport logo */}
      <div className="sidebar__brand">
        <img
          src={roommateLogo}
          alt="RoomieReport logo"
          className="sidebar__logo"
        />

  <div className="sidebar__brand-text">
    <h2>RoomieReport</h2>
    <p>CSUN student community</p>
  </div>
</div>

      {/* Main navigation */}
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

      {/* Bottom user section */}
      {user && (
        <div className="sidebar__user">
          <button
            type="button"
            className="sidebar__user-toggle"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="sidebar-user-menu"
          >
            {/* User avatar */}
            <span className="sidebar__avatar">
              {initials}
            </span>

            {/* User information */}
            <span className="sidebar__user-info">
              <strong>{user.name}</strong>
              <span>Verified CSUN student</span>
            </span>

            {/* Dropdown arrow */}
            {menuOpen ? (
              <ChevronUp size={17} />
            ) : (
              <ChevronDown size={17} />
            )}
          </button>

          {/* Expanded menu */}
          {menuOpen && (
            <div
              className="sidebar__user-menu"
              id="sidebar-user-menu"
            >
              <button
                type="button"
                className="sidebar__signout"
                onClick={handleSignOut}
              >
                <LogOut size={17} />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}