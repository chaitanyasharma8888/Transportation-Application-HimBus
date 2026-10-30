import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bus, Menu, X, User, LogOut, Ticket } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <nav className="bg-blue-700 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <Bus className="w-7 h-7" />
            <span>HimBus</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="hover:text-blue-200 transition">Home</Link>
            {user && (
              <Link to="/my-bookings" className="hover:text-blue-200 transition flex items-center gap-1">
                <Ticket className="w-4 h-4" />
                My Bookings
              </Link>
            )}
            {user ? (
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1 bg-blue-600 px-3 py-1 rounded-full text-sm">
                  <User className="w-4 h-4" />
                  {user.name}
                </span>
                <button onClick={handleLogout} className="flex items-center gap-1 hover:text-blue-200 transition">
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="hover:text-blue-200 transition">Login</Link>
                <Link to="/register" className="bg-white text-blue-700 px-4 py-1.5 rounded-lg font-medium hover:bg-blue-50 transition">
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link to="/" onClick={() => setMenuOpen(false)} className="block py-2 hover:text-blue-200">Home</Link>
            {user && (
              <Link to="/my-bookings" onClick={() => setMenuOpen(false)} className="block py-2 hover:text-blue-200">My Bookings</Link>
            )}
            {user ? (
              <>
                <div className="py-2 text-blue-200 text-sm">Signed in as {user.name}</div>
                <button onClick={handleLogout} className="block py-2 hover:text-blue-200">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} className="block py-2 hover:text-blue-200">Login</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="block py-2 hover:text-blue-200">Register</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
