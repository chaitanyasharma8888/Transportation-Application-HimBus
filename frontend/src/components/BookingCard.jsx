import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Clock, ArrowRight, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import api from '../api';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

const statusColors = {
  confirmed: 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800',
  pending: 'bg-amber-100 text-amber-800',
};

export default function BookingCard({ booking, onUpdate }) {
  const navigate = useNavigate();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const status = booking.status || 'confirmed';
  const ref = booking.bookingRef || booking.bookingReference || booking._id;
  const route = booking.route || {};
  const fromName = route.from?.name || route.fromStation?.name || booking.from || '—';
  const toName = route.to?.name || route.toStation?.name || booking.to || '—';
  const seats = booking.seats || booking.seatNumbers || [];
  const passengers = booking.passengers || [];
  const fare = booking.totalFare || booking.fare || 0;
  const journeyDate = booking.journeyDate || booking.date || '';

  const canCancel = () => {
    if (status !== 'confirmed') return false;
    if (!booking.departureTime && !route.departureTime) return true;
    const depTime = booking.departureTime || route.departureTime;
    const depDate = new Date(`${journeyDate} ${depTime}`);
    return (depDate.getTime() - Date.now()) > 4 * 60 * 60 * 1000;
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await api.post(`/bookings/${ref}/cancel`);
      if (onUpdate) onUpdate();
      setShowCancelModal(false);
    } catch {
      alert('Failed to cancel booking. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      <div
        className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-slate-100 overflow-hidden cursor-pointer"
        onClick={() => navigate(`/booking/${ref}`)}
      >
        <div className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
            <div>
              <div className="text-xs text-slate-500 mb-1">Booking Reference</div>
              <div className="font-bold text-slate-800 font-mono">{ref}</div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[status] || statusColors.pending}`}>
              {status}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-700 mb-2">
            <MapPin className="w-4 h-4 text-blue-500" />
            <span className="font-medium">{fromName}</span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <span className="font-medium">{toName}</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 mb-3">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              {journeyDate ? new Date(journeyDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
            </div>
            {(booking.departureTime || route.departureTime) && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                {booking.departureTime || route.departureTime}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm text-slate-500">
              Seats: <span className="font-semibold text-slate-700">{Array.isArray(seats) ? seats.join(', ') : seats}</span>
              {passengers.length > 0 && (
                <span className="ml-2">· {passengers.length} passenger{passengers.length > 1 ? 's' : ''}</span>
              )}
            </div>
            <div className="text-lg font-bold text-blue-700">₹{fare}</div>
          </div>

          {status === 'cancelled' && booking.refundAmount && (
            <div className="mt-2 p-2 bg-amber-50 rounded-lg text-xs text-amber-700 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              Refund of ₹{booking.refundAmount} {booking.refundStatus === 'processed' ? 'processed' : 'initiated'}
            </div>
          )}

          {canCancel() && (
            <Button
              variant="text"
              color="error"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setShowCancelModal(true);
              }}
              sx={{
                mt: 1.5,
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.875rem',
                '&:hover': { textDecoration: 'underline', backgroundColor: 'transparent' },
              }}
            >
              Cancel Booking
            </Button>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowCancelModal(false)}>
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Cancel Booking?</h3>
            <p className="text-sm text-slate-600 mb-1">Booking: <span className="font-mono font-semibold">{ref}</span></p>
            <p className="text-sm text-slate-500 mb-5">
              Are you sure you want to cancel this booking? Cancellation charges may apply as per policy.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outlined"
                fullWidth
                onClick={() => setShowCancelModal(false)}
                sx={{
                  borderRadius: '0.5rem',
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  borderColor: '#cbd5e1',
                  color: '#334155',
                  '&:hover': { backgroundColor: '#f8fafc', borderColor: '#94a3b8' },
                }}
              >
                Keep Booking
              </Button>
              <Button
                variant="contained"
                fullWidth
                onClick={handleCancel}
                disabled={cancelling}
                sx={{
                  borderRadius: '0.5rem',
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  backgroundColor: '#dc2626',
                  '&:hover': { backgroundColor: '#b91c1c' },
                  '&.Mui-disabled': { backgroundColor: '#fca5a5', color: '#fff' },
                }}
              >
                {cancelling ? (
                  <CircularProgress size={16} sx={{ color: '#fff' }} />
                ) : (
                  'Yes, Cancel'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
