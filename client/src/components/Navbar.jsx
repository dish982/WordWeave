import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('search') || '');

  const onSearch = (e) => {
    e.preventDefault();
    const term = q.trim();
    navigate(term ? `/?search=${encodeURIComponent(term)}` : '/');
  };

  const onLogout = async () => {
    try { await logout(); } finally { navigate('/'); }
  };

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="text-2xl font-extrabold text-maroon tracking-tight shrink-0">
          WordWeave
        </Link>

        <form onSubmit={onSearch} className="flex-1 max-w-md mx-2 hidden sm:block">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="SEARCH BLOGS"
            className="w-full pl-5 p-2 bg-gray-50 border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-maroon/20 focus:border-maroon focus:bg-white transition-all"
          />
        </form>

        <div className="flex items-center gap-4 shrink-0">
          {user ? (
            <>
              <div className="hidden md:flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                <div className="w-7 h-7 bg-maroon text-white font-bold rounded-full flex items-center justify-center text-xs uppercase shadow-sm">
                  {(user?.username || '?').charAt(0).toUpperCase()}
                  
                </div>
                <span className="text-sm font-semibold text-gray-600">{user.username}</span>
              </div>
              <button onClick={onLogout} className="text-sm font-bold text-gray-500 hover:text-red-600 transition-colors">
                Logout
              </button>
            </>
          ) : (
            <>
              <span className="hidden md:inline text-xs font-bold uppercase text-gray-400 bg-gray-100 px-2.5 py-1 rounded-md">
                Guest
              </span>
              <Link to="/auth" className="px-4 py-2 bg-maroon text-white text-sm font-bold rounded-xl hover:bg-maroon-hover transition-colors">
                Sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}