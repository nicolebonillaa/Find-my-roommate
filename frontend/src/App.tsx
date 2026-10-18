import { Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import FindRoommates from "./pages/FindRoommates";
import StudentProfile from "./pages/StudentProfile";
import Requests from "./pages/Requests";
import MyReviews from "./pages/MyReviews";
import WriteReview from "./pages/WriteReview";
import MyProfile from "./pages/MyProfile";

// All routes live here. Lead owns this file; ask before editing
// to avoid merge conflicts.
// TODO: add /login and /signup OUTSIDE AppLayout, plus a ProtectedRoute.
export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="find" element={<FindRoommates />} />
        <Route path="students/:id" element={<StudentProfile />} />
        <Route path="requests" element={<Requests />} />
        <Route path="reviews" element={<MyReviews />} />
        <Route path="reviews/write/:connectionId" element={<WriteReview />} />
        <Route path="profile" element={<MyProfile />} />
        <Route path="*" element={<p>Page not found.</p>} />
      </Route>
    </Routes>
  );
}
