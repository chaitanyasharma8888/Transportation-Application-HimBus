import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Loader2, CheckCircle, AlertCircle, CreditCard, ArrowRight } from 'lucide-react';
import api from '../api';
import {
  fetchBooking,
  clearCurrentBooking,
  selectCurrentBooking,
  selectCurrentBookingLoading,
  selectCurrentBookingError,
} from '../store/transportSlice';

export default function PaymentPage() {
  const { bookingRef } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux state for the booking
  const booking  = useSelector(selectCurrentBooking);
  const loading  = useSelector(selectCurrentBookingLoading);
  const loadErr  = useSelector(selectCurrentBookingError);

  // Local UI state for payment flow
  const [paying,  setPaying]  = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    dispatch(fetchBooking(bookingRef));
    return () => { dispatch(clearCurrentBooking()); };
  }, [bookingRef, dispatch]);

  // Merge loadErr into error for display
  const displayError = error || (loadErr && !booking ? loadErr : '');

  const handlePay = async () => {
    setPaying(true);
    setError('');
    try {
      const orderRes = await api.post('/payment/create-order', {
        booking_ref: bookingRef,
        amount: booking.total_fare,
      });
      const { order_id, mock } = orderRes.data;

      if (mock) {
        // Simulate payment delay
        await new Promise(r => setTimeout(r, 2000));
        await api.post('/payment/verify', {
          booking_ref: bookingRef,
          razorpay_order_id: order_id,
          razorpay_payment_id: 'pay_mock_' + Math.random().toString(36).slice(2, 10),
        });
        setSuccess(true);
        setTimeout(() => navigate(`/booking/${bookingRef}`), 2000);
      } else {
        // Real Razorpay
        const options = {
          key: orderRes.data.key_id,
          amount: orderRes.data.amount,
          currency: 'INR',
          name: 'HimBus',
          description: `Booking #${bookingRef}`,
          order_id,
          handler: async (response) => {
            await api.post('/payment/verify', {
              booking_ref: bookingRef,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setSuccess(true);
            setTimeout(() => navigate(`/booking/${bookingRef}`), 2000);
          },
          prefill: { name: booking.guest_name || '', email: booking.guest_email || '' },
          theme: { color: '#1d4ed8' },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      <span className="ml-3 text-gray-500">Loading booking...</span>
    </div>
  );

  if (displayError && !booking) return (
    <div className="text-center py-32">
      <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
      <p className="text-red-600">{displayError}</p>
    </div>
  );

  if (success) return (
    <div className="flex flex-col items-center justify-center py-32">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-bounce">
        <CheckCircle className="w-12 h-12 text-green-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h2>
      <p className="text-gray-500">Redirecting to your ticket...</p>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        <div className="text-center mb-8">
          <CreditCard className="w-12 h-12 text-blue-600 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-gray-800">Complete Payment</h1>
          <p className="text-gray-500 text-sm mt-1">Booking #{bookingRef}</p>
        </div>

        {/* Booking summary */}
        {booking && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Route</span>
              <span className="font-medium">{booking.from_city} → {booking.to_city}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date</span>
              <span className="font-medium">{booking.journey_date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Departure</span>
              <span className="font-medium">{booking.departure_time}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Seats</span>
              <span className="font-medium">{(Array.isArray(booking.seats) ? booking.seats : []).join(', ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Bus</span>
              <span className="font-medium">{booking.bus_type} • {booking.bus_number}</span>
            </div>
            <hr />
            <div className="flex justify-between text-lg font-bold">
              <span>Total Amount</span>
              <span className="text-blue-700">₹{booking.total_fare}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 text-blue-700 text-xs">
          🔒 <strong>Secure Payment</strong> — Demo mode: no real money will be charged.
        </div>

        <button
          onClick={handlePay}
          disabled={paying || booking?.payment_status === 'paid'}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {paying ? (
            <><Loader2 className="w-6 h-6 animate-spin" /> Processing Payment...</>
          ) : booking?.payment_status === 'paid' ? (
            <><CheckCircle className="w-6 h-6" /> Already Paid</>
          ) : (
            <><CreditCard className="w-6 h-6" /> Pay ₹{booking?.total_fare} <ArrowRight className="w-5 h-5" /></>
          )}
        </button>

        {booking?.payment_status === 'paid' && (
          <button onClick={() => navigate(`/booking/${bookingRef}`)}
            className="w-full mt-3 text-blue-600 py-2 text-sm hover:underline">
            View Ticket →
          </button>
        )}
      </div>
    </div>
  );
}
