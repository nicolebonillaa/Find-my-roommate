
import { Navigate, Outlet, Route, Routes } from "react-router-dom";

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

// Temporary demo session until Firebase Authentication is connected.
function hasDemoSession() {
  return sessionStorage.getItem("roomiereport-demo-session") === "true";
}

function DemoGuard() {
  return hasDemoSession() ? <Outlet /> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Navigate
            to={hasDemoSession() ? "/dashboard" : "/login"}
            replace
          />
        }
      />

      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/verify" element={<VerifyEmail />} />

      <Route element={<DemoGuard />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/find" element={<FindRoommates />} />
          <Route path="/students/:id" element={<StudentProfile />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/reviews" element={<MyReviews />} />
          <Route
            path="/reviews/write/:connectionId"
            element={<WriteReview />}
          />
          <Route path="/profile" element={<MyProfile />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
