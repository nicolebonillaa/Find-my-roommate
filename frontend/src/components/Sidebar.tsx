
import { useState } from "react";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";

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

import { signOutUser } from "../services/authService";
import { useAuth } from "../auth/AuthProvider";

import Avatar from "./Avatar";

import roommateLogo from "../assets/roomiereport-logo-white.svg";

import "../styles/Sidebar.css";

export default function Sidebar() {
  const { user, profile } = useAuth();

  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [signOutError, setSignOutError] = useState("");

  /* Sign out through Firebase */

  async function handleSignOut() {
    try {
      setSignOutError("");

      await signOutUser();

      setMenuOpen(false);

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Could not sign out:",
        error
      );

      setSignOutError(
        "Unable to sign out. Please try again."
      );
    }
  }

  return (
    <aside className="sidebar">
      {/* RoomieReport branding */}

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

      {/* Workspace label */}

      <p className="sidebar__label">
        WORKSPACE
      </p>

      {/* Navigation links */}

      <nav className="sidebar__nav">
        <NavLink to="/dashboard">
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
            onClick={() =>
              setMenuOpen((open) => !open)
            }
            aria-expanded={menuOpen}
            aria-controls="sidebar-user-menu"
          >
            {/* Profile avatar */}

            <span className="sidebar__avatar">
              <Avatar
                user={profile?.user ?? user}
                photoUrl={profile?.photoUrl}
                size="sm"
                round
              />
            </span>

            {/* User information */}

            <span className="sidebar__user-info">
              <strong>
                {profile?.user.name ?? user.name}
              </strong>

              <span>
                Verified CSUN student
              </span>
            </span>

            {/* Dropdown arrow */}

            {menuOpen ? (
              <ChevronUp size={17} />
            ) : (
              <ChevronDown size={17} />
            )}
          </button>

          {/* Expanded account menu */}

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

              {signOutError && (
                <p role="alert">
                  {signOutError}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}