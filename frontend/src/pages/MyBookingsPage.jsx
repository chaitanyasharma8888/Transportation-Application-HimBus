import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Loader2, AlertCircle, Ticket, ArrowRight, Bus, MapPin, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  fetchMyBookings,
  selectMyBookings,
  selectMyBookingsLoading,
  selectMyBookingsError,
} from '../store/transportSlice';

const statusColors = {
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-gray-100 text-gray-600',
};
const tabs = ['All', 'Upcoming', 'Cancelled'];

function formatDate(d) {
  try { return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return d; }
}

function BookingRow({ bk, navigate }) {
  const seats = Array.isArray(bk.seats) ? bk.seats : [];
  const isUpcoming = bk.status === 'confirmed' && new Date(bk.journey_date + 'T23:59:59') >= new Date();
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition p-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-bold text-gray-800 text-lg tracking-wide">{bk.booking_ref}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[bk.status]}`}>
              {bk.status}
            </span>
          </div>
          <div className="flex items-center gap-3 text-gray-700 font-medium mb-1">
            <MapPin className="w-4 h-4 text-green-600" />
            {bk.from_city}
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <MapPin className="w-4 h-4 text-red-500" />
            {bk.to_city}
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatDate(bk.journey_date)}</span>
            <span className="flex items-center gap-1"><Bus className="w-3.5 h-3.5" /> {bk.bus_type}</span>
            <span>Seats: {seats.join(', ')}</span>
          </div>
        </div>
        <div className="flex flex-row md:flex-col items-center md:items-end gap-3 md:gap-1">
          <span className="text-2xl font-bold text-blue-700">₹{bk.total_fare}</span>
          <button
            onClick={() => navigate(`/booking/${bk.booking_ref}`)}
            className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition flex items-center gap-1"
          >
            View Ticket <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MyBookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux state
  const bookings = useSelector(selectMyBookings);
  const loading  = useSelector(selectMyBookingsLoading);
  const error    = useSelector(selectMyBookingsError);

  // Local UI state
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!user) return;
    dispatch(fetchMyBookings());
  }, [user, dispatch]);

  const filtered = bookings.filter(bk => {
    if (activeTab === 'Upcoming') return bk.status === 'confirmed' && new Date(bk.journey_date + 'T23:59:59') >= new Date();
    if (activeTab === 'Cancelled') return bk.status === 'cancelled';
    return true;
  });

  if (authLoading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Bookings</h1>
          <p className="text-gray-500 text-sm">Welcome back, {user?.name}</p>
        </div>
        <Link to="/" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">
          + New Booking
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition -mb-px ${activeTab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-500">Loading bookings...</span>
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-600">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-500 mb-2">No {activeTab !== 'All' ? activeTab.toLowerCase() + ' ' : ''}bookings found</h3>
          <Link to="/" className="text-blue-600 hover:underline text-sm">Search and book a bus →</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(bk => <BookingRow key={bk.booking_ref} bk={bk} navigate={navigate} />)}
        </div>
      )}
    </div>
  );
}
