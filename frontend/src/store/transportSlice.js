import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api';

// ── Mock data generator (moved here from SearchResultsPage) ─────────────────
function generateMockResults(fromName, toName) {
  const types = [
    { bus_type: 'Ordinary',    bus_number: 'HP-01-1234', total_seats: 40, amenities: [],                                                      fare: 450,  dep: '06:00', arr: '15:00', dur: 540 },
    { bus_type: 'Deluxe',      bus_number: 'HP-66-2002', total_seats: 40, amenities: ['Cushioned Seats','Curtains'],                           fare: 650,  dep: '20:00', arr: '04:30', dur: 510 },
    { bus_type: 'Semi-Luxury', bus_number: 'HP-01-3001', total_seats: 36, amenities: ['Pushback Seats','Charging Point','Curtains'],           fare: 850,  dep: '21:30', arr: '05:30', dur: 480 },
    { bus_type: 'Volvo AC',    bus_number: 'HP-01-4003', total_seats: 32, amenities: ['AC','Pushback Seats','Charging Point','Reading Light'], fare: 1200, dep: '22:00', arr: '06:00', dur: 480 },
    { bus_type: 'Electric',    bus_number: 'HP-01-5001', total_seats: 30, amenities: ['AC','Eco-friendly','USB Charging'],                     fare: 950,  dep: '08:00', arr: '16:00', dur: 480 },
  ];
  return types.map((t, i) => ({
    route_id: i + 1,
    from_station: { id: 1, name: fromName + ' Bus Stand', city: fromName },
    to_station:   { id: 2, name: toName + ' Bus Stand',   city: toName },
    bus: { id: i + 1, bus_number: t.bus_number, bus_type: t.bus_type, total_seats: t.total_seats, layout: '2x2', amenities: t.amenities },
    fare:           t.fare,
    departure_time: t.dep,
    arrival_time:   t.arr,
    duration_mins:  t.dur,
    available_seats: t.total_seats - Math.floor(Math.random() * 10),
  }));
}

// ── Search buses thunk ──────────────────────────────────────────────────────

export const searchBuses = createAsyncThunk(
  'transport/searchBuses',
  async ({ from, to, date, sortBy, fromName, toName }, { rejectWithValue }) => {
    try {
      const res = await api.get('/search', {
        params: { from_station_id: from, to_station_id: to, date, sort_by: sortBy },
        timeout: 5000,
      });
      if (res.data.results && res.data.results.length > 0) {
        return { results: res.data.results, isMock: false };
      }
      // API returned 0 results — fall back to mock
      return { results: generateMockResults(fromName, toName), isMock: true };
    } catch {
      // API failed — fall back to mock data
      return { results: generateMockResults(fromName, toName), isMock: true };
    }
  }
);

// ── Fetch my bookings thunk ─────────────────────────────────────────────────

export const fetchMyBookings = createAsyncThunk(
  'transport/fetchMyBookings',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/bookings');
      return res.data.bookings;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to load bookings.');
    }
  }
);

// ── Fetch single booking thunk ──────────────────────────────────────────────

export const fetchBooking = createAsyncThunk(
  'transport/fetchBooking',
  async (bookingRef, { rejectWithValue }) => {
    try {
      const res = await api.get(`/bookings/${bookingRef}`);
      return res.data.booking;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Booking not found.');
    }
  }
);

// ── Slice ───────────────────────────────────────────────────────────────────

const initialState = {
  // Search
  searchResults: [],
  searchLoading: false,
  searchError: '',
  isMock: false,

  // My bookings
  myBookings: [],
  myBookingsLoading: false,
  myBookingsError: '',

  // Current booking (detail/payment pages)
  currentBooking: null,
  currentBookingLoading: false,
  currentBookingError: '',
};

const transportSlice = createSlice({
  name: 'transport',
  initialState,
  reducers: {
    clearSearchResults(state) {
      state.searchResults = [];
      state.searchError = '';
      state.isMock = false;
    },
    clearCurrentBooking(state) {
      state.currentBooking = null;
      state.currentBookingError = '';
    },
    clearMyBookings(state) {
      state.myBookings = [];
      state.myBookingsError = '';
    },
  },
  extraReducers: (builder) => {
    // searchBuses
    builder
      .addCase(searchBuses.pending, (state) => {
        state.searchLoading = true;
        state.searchError = '';
        state.isMock = false;
      })
      .addCase(searchBuses.fulfilled, (state, action) => {
        state.searchResults = action.payload.results;
        state.isMock = action.payload.isMock;
        state.searchLoading = false;
      })
      .addCase(searchBuses.rejected, (state, action) => {
        state.searchError = action.payload || 'Search failed.';
        state.searchLoading = false;
      });

    // fetchMyBookings
    builder
      .addCase(fetchMyBookings.pending, (state) => {
        state.myBookingsLoading = true;
        state.myBookingsError = '';
      })
      .addCase(fetchMyBookings.fulfilled, (state, action) => {
        state.myBookings = action.payload;
        state.myBookingsLoading = false;
      })
      .addCase(fetchMyBookings.rejected, (state, action) => {
        state.myBookingsError = action.payload;
        state.myBookingsLoading = false;
      });

    // fetchBooking
    builder
      .addCase(fetchBooking.pending, (state) => {
        state.currentBookingLoading = true;
        state.currentBookingError = '';
      })
      .addCase(fetchBooking.fulfilled, (state, action) => {
        state.currentBooking = action.payload;
        state.currentBookingLoading = false;
      })
      .addCase(fetchBooking.rejected, (state, action) => {
        state.currentBookingError = action.payload;
        state.currentBookingLoading = false;
      });
  },
});

export const { clearSearchResults, clearCurrentBooking, clearMyBookings } = transportSlice.actions;

// Selectors
export const selectSearchResults  = (state) => state.transport.searchResults;
export const selectSearchLoading  = (state) => state.transport.searchLoading;
export const selectSearchError    = (state) => state.transport.searchError;
export const selectIsMock         = (state) => state.transport.isMock;

export const selectMyBookings       = (state) => state.transport.myBookings;
export const selectMyBookingsLoading = (state) => state.transport.myBookingsLoading;
export const selectMyBookingsError   = (state) => state.transport.myBookingsError;

export const selectCurrentBooking       = (state) => state.transport.currentBooking;
export const selectCurrentBookingLoading = (state) => state.transport.currentBookingLoading;
export const selectCurrentBookingError   = (state) => state.transport.currentBookingError;

export default transportSlice.reducer;

