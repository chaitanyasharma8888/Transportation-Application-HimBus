import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Loader2, AlertCircle, ArrowRight, ArrowLeft, Bus, Calendar } from 'lucide-react';
import api from '../api';
import { selectUser } from '../store/authSlice';
import SeatLayout from '../components/SeatLayout';

export default function SeatSelectionPage() {
  const { routeId, date } = useParams();
  const navigate           = useNavigate();
  const user               = useSelector(selectUser);

  const [seatData,      setSeatData]      = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [passengers,    setPassengers]    = useState([]);   // [{ name, age, gender }]
  const [contact,       setContact]       = useState({ name: '', email: '', phone: '' });
  const [loading,       setLoading]       = useState(true);
  const [submitting,    setSubmitting]    = useState(false);
  const [error,         setError]         = useState('');
  const [step,          setStep]          = useState(1);    // 1 = seats, 2 = passenger details

  // ── Pre-fill contact from logged-in user ──────────────────────────────────
  useEffect(() => {
    if (user) {
      setContact({ name: user.name || '', email: user.email || '', phone: user.phone || '' });
    }
  }, [user]);

  // ── Fetch seat layout + fare ───────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/seats/${routeId}/${date}`),
      api.get(`/route-fare/${routeId}`).catch(() => ({ data: { fare: 0 } })),
    ])
      .then(([seatRes, fareRes]) => {
        setSeatData({ ...seatRes.data, fare: fareRes.data.fare });
      })
      .catch(err => setError(err.response?.data?.error || 'Failed to load seat layout.'))
      .finally(() => setLoading(false));
  }, [routeId, date]);

  // ── Keep passenger list in sync with seat count ────────────────────────────
  // Use a ref-style approach to avoid stale-closure bug
  const syncPassengers = useCallback((seats) => {
    setPassengers(prev => {
      const next = seats.map((_, i) => prev[i] || { name: '', age: '', gender: 'Male' });
      return next;
    });
  }, []);

  const handleSeatsChange = (seats) => {
    setSelectedSeats(seats);
    syncPassengers(seats);
  };

  const updatePassenger = (idx, field, value) => {
    setPassengers(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  // ── Validation & booking submission ────────────────────────────────────────
  const handleBooking = async () => {
    setError('');

    // Passenger validation
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.name.trim()) { setError(`Please enter name for Passenger ${i + 1}.`); return; }
      const age = Number(p.age);
      if (!p.age || age < 1 || age > 120) { setError(`Please enter a valid age for Passenger ${i + 1}.`); return; }
    }

    // Contact validation
    if (!contact.name.trim())  { setError('Please enter your name.');  return; }
    if (!contact.email.trim()) { setError('Please enter your email.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) { setError('Please enter a valid email.'); return; }
    if (!contact.phone.trim()) { setError('Please enter your phone number.'); return; }

    setSubmitting(true);
    try {
      const body = {
        route_id:           Number(routeId),
        journey_date:       date,
        seats:              selectedSeats,
        passenger_details:  passengers.map(p => ({ ...p, age: Number(p.age) })),
      };
      // Attach guest details if not logged in
      if (!user) {
        body.guest_name  = contact.name;
        body.guest_email = contact.email;
        body.guest_phone = contact.phone;
      }

      const res = await api.post('/bookings', body);
      navigate(`/payment/${res.data.booking.booking_ref}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render helpers ────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-3">
      <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      <p className="text-gray-500 text-sm">Loading seat layout…</p>
    </div>
  );

  if (!seatData) return (
    <div className="text-center py-32">
      <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
      <p className="text-red-600 font-medium">{error || 'Route not found.'}</p>
      <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 hover:underline text-sm">← Go Back</button>
    </div>
  );

  const totalFare = selectedSeats.length * (seatData.fare || 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* ── Back button ── */}
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-blue-600 hover:underline mb-5 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to results
      </button>

      {/* ── Info bar ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-gray-700">
          <Bus className="w-5 h-5 text-blue-600" />
          <span className="font-semibold">{seatData.bus_type}</span>
          <span className="text-gray-400 text-sm">({seatData.bus_number})</span>
        </div>
        <div className="flex items-center gap-2 text-gray-700">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span className="text-sm">{date}</span>
        </div>
        <div className="ml-auto text-sm text-gray-500">
          <span className="font-semibold text-blue-700">₹{seatData.fare}</span> per seat
        </div>
      </div>

      {/* ── Progress steps ── */}
      <div className="flex items-center gap-2 mb-6">
        {['Select Seats', 'Passenger Details'].map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step > i ? 'bg-blue-600 text-white' : step === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
              {i + 1}
            </div>
            <span className={`text-sm font-medium ${step === i + 1 ? 'text-blue-700' : 'text-gray-400'}`}>{label}</span>
            {i < 1 && <ArrowRight className="w-4 h-4 text-gray-300" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Main panel ── */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">

          {step === 1 ? (
            /* STEP 1 — Seat selection */
            <>
              <h2 className="font-bold text-gray-800 text-lg mb-1">Choose Your Seats</h2>
              <p className="text-gray-400 text-sm mb-6">Select up to 6 seats. Click to select, click again to deselect.</p>
              <SeatLayout
                seats={seatData.seats || []}
                selectedSeats={selectedSeats}
                onSeatClick={handleSeatsChange}
              />
              {selectedSeats.length > 0 && (
                <button
                  onClick={() => setStep(2)}
                  className="mt-6 w-full bg-blue-600 text-white py-3 rounded-xl font-bold
                             hover:bg-blue-700 transition flex items-center justify-center gap-2"
                >
                  Continue to Passenger Details <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </>
          ) : (
            /* STEP 2 — Passenger + contact details */
            <>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-gray-800 text-lg">Passenger Details</h2>
                <button onClick={() => setStep(1)}
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" /> Change Seats
                </button>
              </div>

              {/* Per-passenger forms */}
              <div className="space-y-4 mb-6">
                {passengers.map((p, i) => (
                  <div key={i} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">{i + 1}</span>
                      Passenger {i + 1} &mdash; Seat <span className="text-blue-600 font-bold ml-1">{selectedSeats[i]}</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1 font-medium">Full Name *</label>
                        <input
                          type="text"
                          value={p.name}
                          onChange={e => updatePassenger(i, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                          placeholder="e.g. Rahul Sharma"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1 font-medium">Age *</label>
                        <input
                          type="number" min="1" max="120"
                          value={p.age}
                          onChange={e => updatePassenger(i, 'age', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                          placeholder="Age"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1 font-medium">Gender *</label>
                        <select
                          value={p.gender}
                          onChange={e => updatePassenger(i, 'gender', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Contact details */}
              <div className="border border-gray-200 rounded-xl p-4 mb-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Contact Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1 font-medium">Contact Name *</label>
                    <input type="text" value={contact.name}
                      onChange={e => setContact(c => ({ ...c, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Your name" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1 font-medium">Email *</label>
                    <input type="email" value={contact.email}
                      onChange={e => setContact(c => ({ ...c, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="you@email.com" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1 font-medium">Phone *</label>
                    <input type="tel" value={contact.phone}
                      onChange={e => setContact(c => ({ ...c, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="10-digit mobile" />
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm mb-4 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <button
                onClick={handleBooking}
                disabled={submitting}
                className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold text-base
                           hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed
                           flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
                {submitting ? 'Creating Booking…' : 'Proceed to Payment →'}
              </button>
            </>
          )}
        </div>

        {/* ── Booking summary sidebar ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 h-fit lg:sticky lg:top-20">
          <h3 className="font-bold text-gray-800 mb-4">Booking Summary</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Bus Type</span>
              <span className="font-medium">{seatData.bus_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Bus No.</span>
              <span className="font-medium font-mono text-xs">{seatData.bus_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Journey Date</span>
              <span className="font-medium">{date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Fare / seat</span>
              <span className="font-medium">₹{seatData.fare}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Selected Seats</span>
              <span className="font-medium text-blue-700">
                {selectedSeats.length > 0 ? selectedSeats.sort((a, b) => a - b).join(', ') : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Passengers</span>
              <span className="font-medium">{selectedSeats.length}</span>
            </div>
            <hr className="border-gray-100" />
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-800">Total</span>
              <span className="text-xl font-extrabold text-blue-700">
                {selectedSeats.length > 0 ? `₹${totalFare}` : '—'}
              </span>
            </div>
          </div>

          {/* Cancellation policy note */}
          <div className="mt-5 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
            <strong>Free cancellation</strong> up to 12 hrs before departure (90% refund).
          </div>
        </div>
      </div>
    </div>
  );
}
