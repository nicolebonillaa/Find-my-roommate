import { Bell, Search } from "lucide-react";
import Avatar from "./Avatar";
import { useAuth } from "../auth/AuthProvider";
import "../styles/Topbar.css";

export default function Topbar() {
  const { user } = useAuth();

  return (
    <div className="topbar">
      <label className="topbar__search">
        <Search size={16} aria-hidden="true" />
        <input
          type="search"
          placeholder="Search CSUN students…"
          aria-label="Search CSUN students"
        />
      </label>

      <button className="topbar__icon-btn" aria-label="Notifications">
        <Bell size={18} />
      </button>

      {user && <Avatar user={user} size="sm" round />}
    </div>
  );
}