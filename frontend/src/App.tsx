
import {
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";

import { useAuth } from "./auth/AuthProvider";

import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import FindRoommates from "./pages/FindRoommates";
import StudentProfile from "./pages/StudentProfile";
import Requests from "./pages/Requests";
import MyReviews from "./pages/MyReviews";
import WriteReview from "./pages/WriteReview";
import MyProfile from "./pages/MyProfile";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import VerifyEmail from "./pages/VerifyEmail";

/* Protect pages that require a verified account */

function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <p role="status" style={{ padding: 24 }}>
        Loading RoomieReport...
      </p>
    );
  }

  return user ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace />
  );
}

/* Redirect visitors to the correct page */

function HomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <p role="status" style={{ padding: 24 }}>
        Loading RoomieReport...
      </p>
    );
  }

  return (
    <Navigate
      to={user ? "/dashboard" : "/login"}
      replace
    />
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />

      {/* Public pages */}

      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/verify" element={<VerifyEmail />} />

      {/* Protected pages */}

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/find"
            element={<FindRoommates />}
          />

          <Route
            path="/students/:id"
            element={<StudentProfile />}
          />

          <Route
            path="/requests"
            element={<Requests />}
          />

          <Route
            path="/reviews"
            element={<MyReviews />}
          />

          <Route
            path="/reviews/write/:connectionId"
            element={<WriteReview />}
          />

          <Route
            path="/profile"
            element={<MyProfile />}
          />
        </Route>
      </Route>

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}