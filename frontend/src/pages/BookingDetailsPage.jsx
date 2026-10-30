import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Loader2, AlertCircle, MapPin, Clock, Bus, User,
  CheckCircle, XCircle, Printer, ArrowLeft, X
} from 'lucide-react';
import api from '../api';
import {
  fetchBooking,
  clearCurrentBooking,
  selectCurrentBooking,
  selectCurrentBookingLoading,
  selectCurrentBookingError,
} from '../store/transportSlice';

const statusColors = {
  confirmed: 'bg-green-100 text-green-700 border-green-300',
  cancelled: 'bg-red-100 text-red-700 border-red-300',
  completed: 'bg-gray-100 text-gray-700 border-gray-300',
};
const paymentColors = {
  paid: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  refunded: 'bg-purple-100 text-purple-700',
};

function formatDuration(mins) {
  const h = Math.floor(mins / 60), m = mins % 60;
  return `${h}h ${m > 0 ? m + 'm' : ''}`;
}

export default function BookingDetailsPage() {
  const { bookingRef } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux state
  const booking   = useSelector(selectCurrentBooking);
  const loading   = useSelector(selectCurrentBookingLoading);
  const loadError = useSelector(selectCurrentBookingError);

  // Local UI state for cancellation
  const [cancelError,   setCancelError]   = useState('');
  const [cancelling,    setCancelling]    = useState(false);
  const [showCancel,    setShowCancel]    = useState(false);
  const [cancelResult,  setCancelResult]  = useState(null);

  useEffect(() => {
    dispatch(fetchBooking(bookingRef));
    return () => { dispatch(clearCurrentBooking()); };
  }, [bookingRef, dispatch]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const res = await api.post(`/bookings/${bookingRef}/cancel`);
      setCancelResult(res.data);
      setShowCancel(false);
      dispatch(fetchBooking(bookingRef));
    } catch (err) {
      setCancelError(err.response?.data?.error || 'Failed to cancel booking.');
      setShowCancel(false);
    } finally {
      setCancelling(false);
    }
  };

  const canCancel = () => {
    if (!booking || booking.status !== 'confirmed') return false;
    const [h, m] = booking.departure_time.split(':').map(Number);
    const dep = new Date(booking.journey_date + 'T00:00:00');
    dep.setHours(h, m, 0, 0);
    return (dep - Date.now()) > 4 * 60 * 60 * 1000;
  };

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );
  if (loadError) return (
    <div className="text-center py-32">
      <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
      <p className="text-red-600">{loadError}</p>
      <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 hover:underline text-sm">Go Back</button>
    </div>
  );
  if (!booking) return null;

  const passengers = Array.isArray(booking.passenger_details) ? booking.passenger_details : [];
  const seats = Array.isArray(booking.seats) ? booking.seats : [];
  const amenities = Array.isArray(booking.amenities) ? booking.amenities : [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 print:py-2">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-blue-600 hover:underline mb-6 text-sm print:hidden">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Cancel Result Banner */}
      {cancelResult && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-red-700 mb-1">Booking Cancelled</h3>
          <p className="text-sm text-red-600">{cancelResult.note}</p>
          {cancelResult.refund_amount > 0 && (
            <p className="text-sm text-green-700 mt-1 font-medium">
              Refund: ₹{cancelResult.refund_amount.toFixed(2)} ({cancelResult.refund_percentage}% of ₹{cancelResult.total_fare})
            </p>
          )}
        </div>
      )}

      {/* Cancel Error Banner */}
      {cancelError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-red-600 font-medium">{cancelError}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-800 text-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-blue-200 text-sm mb-1">Booking Reference</p>
              <h1 className="text-3xl font-bold tracking-wider">{booking.booking_ref}</h1>
            </div>
            <div className="text-right">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[booking.status]} bg-white`}>
                {booking.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Route */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{booking.departure_time}</div>
              <div className="text-sm text-gray-500 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" />{booking.from_city}</div>
              <div className="text-xs text-gray-400">{booking.from_station}</div>
            </div>
            <div className="flex-1 flex flex-col items-center">
              <span className="text-xs text-gray-400 mb-1"><Clock className="w-3 h-3 inline mr-1" />{formatDuration(booking.duration_mins)}</span>
              <div className="w-full flex items-center"><div className="h-px flex-1 bg-gray-300 border-dashed"></div></div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{booking.arrival_time}</div>
              <div className="text-sm text-gray-500 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" />{booking.to_city}</div>
              <div className="text-xs text-gray-400">{booking.to_station}</div>
            </div>
          </div>

          {/* Journey Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 rounded-xl p-4 text-sm">
            <div>
              <div className="text-gray-500 text-xs mb-1">Date</div>
              <div className="font-semibold">{booking.journey_date}</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs mb-1">Bus</div>
              <div className="font-semibold">{booking.bus_type}</div>
              <div className="text-xs text-gray-400">{booking.bus_number}</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs mb-1">Seats</div>
              <div className="font-semibold">{seats.join(', ')}</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs mb-1">Payment</div>
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${paymentColors[booking.payment_status]}`}>
                {booking.payment_status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Amenities */}
          {amenities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {amenities.map((a, i) => (
                <span key={i} className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200">{a}</span>
              ))}
            </div>
          )}

          {/* Passengers */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><User className="w-4 h-4" /> Passengers</h3>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-3 py-2 text-gray-500 font-medium">Seat</th>
                  <th className="text-left px-3 py-2 text-gray-500 font-medium">Name</th>
                  <th className="text-left px-3 py-2 text-gray-500 font-medium">Age</th>
                  <th className="text-left px-3 py-2 text-gray-500 font-medium">Gender</th>
                </tr>
              </thead>
              <tbody>
                {passengers.map((p, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="px-3 py-2 font-medium text-blue-700">{seats[i]}</td>
                    <td className="px-3 py-2">{p.name}</td>
                    <td className="px-3 py-2">{p.age}</td>
                    <td className="px-3 py-2">{p.gender}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Fare */}
          <div className="flex justify-between items-center bg-blue-50 rounded-xl p-4">
            <span className="text-gray-700 font-medium">Total Fare</span>
            <span className="text-2xl font-bold text-blue-700">₹{booking.total_fare}</span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 print:hidden">
            <button onClick={() => window.print()}
              className="flex-1 flex items-center justify-center gap-2 border border-gray-300 text-gray-600 py-2.5 rounded-lg hover:bg-gray-50 transition text-sm">
              <Printer className="w-4 h-4" /> Print Ticket
            </button>
            {canCancel() && (
              <button onClick={() => setShowCancel(true)}
                className="flex-1 flex items-center justify-center gap-2 border border-red-300 text-red-600 py-2.5 rounded-lg hover:bg-red-50 transition text-sm">
                <X className="w-4 h-4" /> Cancel Booking
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cancel modal */}
      {showCancel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Cancel Booking?</h2>
            <p className="text-gray-500 text-sm mb-4">
              This action cannot be undone. A cancellation fee may apply based on how close to departure you are.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 text-sm text-amber-700">
              <strong>Refund Policy:</strong><br />
              &gt; 12 hrs before: 90% refund<br />
              4–12 hrs before: 75% refund<br />
              &lt; 4 hrs before: No refund
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCancel(false)}
                className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-lg hover:bg-gray-50 transition">
                Keep Booking
              </button>
              <button onClick={handleCancel} disabled={cancelling}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
