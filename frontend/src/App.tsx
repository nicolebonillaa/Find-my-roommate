
import { Route, Routes } from "react-router-dom";

import AppLayout from "./components/AppLayout";

// Existing RoomieReport pages
import Dashboard from "./pages/Dashboard";
import FindRoommates from "./pages/FindRoommates";
import StudentProfile from "./pages/StudentProfile";
import Requests from "./pages/Requests";
import MyReviews from "./pages/MyReviews";
import WriteReview from "./pages/WriteReview";
import MyProfile from "./pages/MyProfile";

// Authentication pages
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import VerifyEmail from "./pages/VerifyEmail";

// All routes live here. Lead owns this file;
// coordinate changes to avoid merge conflicts.
// TODO: Add ProtectedRoute when Firebase Authentication is ready.

export default function App() {
  return (
    <Routes>
      {/* Authentication pages do not use the sidebar or topbar */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/verify" element={<VerifyEmail />} />

      {/* Existing RoomieReport pages */}
      <Route element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="find" element={<FindRoommates />} />
        <Route path="students/:id" element={<StudentProfile />} />
        <Route path="requests" element={<Requests />} />
        <Route path="reviews" element={<MyReviews />} />
        <Route
          path="reviews/write/:connectionId"
          element={<WriteReview />}
        />
        <Route path="profile" element={<MyProfile />} />
        <Route path="*" element={<p>Page not found.</p>} />
      </Route>
    </Routes>
  );
}
