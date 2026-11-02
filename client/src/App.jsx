import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AuthPage from './pages/AuthPage';
import FeedPage from './pages/FeedPage';
import PostPage from './pages/PostPage';
import EditPage from './pages/EditPage';

// Pages that show the navbar
function Layout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route element={<Layout />}>
        <Route path="/" element={<FeedPage />} />            {/* guests allowed */}
        <Route path="/post/:id" element={<PostPage />} />    {/* guests allowed */}
        <Route
          path="/edit/:id"
          element={<ProtectedRoute><EditPage /></ProtectedRoute>} // login required
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}