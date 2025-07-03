import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import PostsList from './components/PostsList';
import PostDetail from './components/PostDetail';
import PostForm from './components/PostForm';
import { AuthProvider, AuthContext } from './context/AuthContext.jsx';

// ProtectedRoute component for guarding create/edit routes
function ProtectedRoute({ token, children }) {
  const location = useLocation();
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

function App() {
  const { token, user, handleAuth, handleLogout } = useContext(AuthContext);

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-100">
        {/* Header/Nav */}
        <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            {/* Logo/Title */}
            <Link to="/" className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent tracking-tight drop-shadow">MERN Blog App</Link>
            {/* Navigation */}
            <nav className="flex items-center gap-6 text-base font-medium">
              <Link to="/" className="hover:text-blue-600 transition-colors">Posts</Link>
              {token && <Link to="/create" className="hover:text-pink-600 transition-colors">Create Post</Link>}
              {!token && <Link to="/login" className="hover:text-blue-600 transition-colors">Login</Link>}
              {!token && <Link to="/register" className="hover:text-pink-600 transition-colors">Register</Link>}
            </nav>
            {/* User Info/Logout */}
            {token && user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-700 bg-blue-100 px-3 py-1 rounded-full">Welcome, {user?.username}!</span>
                <button onClick={handleLogout} className="bg-gradient-to-r from-pink-500 to-blue-500 text-white px-4 py-1.5 rounded-lg font-semibold shadow hover:from-blue-500 hover:to-pink-500 transition-colors">Logout</button>
              </div>
            ) : null}
          </div>
        </header>
        <Routes>
          <Route path="/" element={<PostsList />} />
          <Route path="/posts/:id" element={<PostDetail />} />
          <Route path="/login" element={<Login onAuth={handleAuth} />} />
          <Route path="/register" element={<Register onAuth={handleAuth} />} />
          <Route path="/create" element={
            <ProtectedRoute token={token}>
              <PostForm />
            </ProtectedRoute>
          } />
          <Route path="/edit/:id" element={
            <ProtectedRoute token={token}>
              <PostForm />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default function WrappedApp() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
} 