import { useState, useEffect, useMemo } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import api from '../api';

// ── Mock data for offline / demo mode ──────────────────────────────────────
const MOCK_ROUTES = [
  { id: 1, busNumber: 'HP-01-1234', busType: 'Ordinary',    from: 'Delhi',      to: 'Shimla',      departureTime: '06:00', arrivalTime: '15:00', fare: 450,  totalSeats: 40, status: 'active' },
  { id: 2, busNumber: 'HP-66-2002', busType: 'Deluxe',      from: 'Delhi',      to: 'Shimla',      departureTime: '20:00', arrivalTime: '04:30', fare: 650,  totalSeats: 40, status: 'active' },
  { id: 3, busNumber: 'HP-01-3001', busType: 'Semi-Luxury', from: 'Delhi',      to: 'Manali',      departureTime: '21:30', arrivalTime: '05:30', fare: 850,  totalSeats: 36, status: 'active' },
  { id: 4, busNumber: 'HP-01-4003', busType: 'Volvo AC',    from: 'Chandigarh', to: 'Shimla',      departureTime: '22:00', arrivalTime: '06:00', fare: 1200, totalSeats: 32, status: 'active' },
  { id: 5, busNumber: 'HP-01-5001', busType: 'Electric',    from: 'Shimla',     to: 'Manali',      departureTime: '08:00', arrivalTime: '16:00', fare: 950,  totalSeats: 30, status: 'active' },
  { id: 6, busNumber: 'HP-02-6100', busType: 'Ordinary',    from: 'Delhi',      to: 'Dharamshala', departureTime: '18:00', arrivalTime: '05:00', fare: 600,  totalSeats: 40, status: 'active' },
  { id: 7, busNumber: 'HP-03-7200', busType: 'Deluxe',      from: 'Shimla',     to: 'Kullu',       departureTime: '07:00', arrivalTime: '13:00', fare: 300,  totalSeats: 40, status: 'maintenance' },
  { id: 8, busNumber: 'HP-04-8300', busType: 'Volvo AC',    from: 'Delhi',      to: 'Manali',      departureTime: '19:30', arrivalTime: '07:30', fare: 1400, totalSeats: 32, status: 'active' },
];

const MOCK_BOOKINGS = [
  { id: 1, bookingRef: 'HB-240101-001', passenger: 'Priya Sharma',   from: 'Delhi',      to: 'Shimla',  date: '2026-11-05', seats: '12, 13',     fare: 900,   status: 'confirmed', busType: 'Ordinary' },
  { id: 2, bookingRef: 'HB-240101-002', passenger: 'Rahul Verma',    from: 'Delhi',      to: 'Manali',  date: '2026-11-06', seats: '5',          fare: 850,   status: 'confirmed', busType: 'Semi-Luxury' },
  { id: 3, bookingRef: 'HB-240102-003', passenger: 'Anita Thakur',   from: 'Chandigarh', to: 'Shimla',  date: '2026-11-07', seats: '22, 23, 24', fare: 3600,  status: 'confirmed', busType: 'Volvo AC' },
  { id: 4, bookingRef: 'HB-240103-004', passenger: 'Vikram Singh',   from: 'Shimla',     to: 'Manali',  date: '2026-11-03', seats: '8',          fare: 950,   status: 'completed', busType: 'Electric' },
  { id: 5, bookingRef: 'HB-240104-005', passenger: 'Neha Gupta',     from: 'Delhi',      to: 'Shimla',  date: '2026-11-02', seats: '31, 32',     fare: 1300,  status: 'cancelled', busType: 'Deluxe' },
  { id: 6, bookingRef: 'HB-240105-006', passenger: 'Arjun Mehta',    from: 'Delhi',      to: 'Dharamshala', date: '2026-11-10', seats: '15',     fare: 600,   status: 'confirmed', busType: 'Ordinary' },
  { id: 7, bookingRef: 'HB-240106-007', passenger: 'Sonal Kapoor',   from: 'Delhi',      to: 'Manali',  date: '2026-11-12', seats: '1, 2',       fare: 2800,  status: 'pending',   busType: 'Volvo AC' },
  { id: 8, bookingRef: 'HB-240107-008', passenger: 'Deepak Negi',    from: 'Shimla',     to: 'Kullu',   date: '2026-11-01', seats: '18',         fare: 300,   status: 'completed', busType: 'Deluxe' },
];

// ── Status chip renderer ──
function StatusChip({ value }) {
  const colorMap = {
    active:      'success',
    maintenance: 'warning',
    inactive:    'default',
    confirmed:   'success',
    completed:   'info',
    cancelled:   'error',
    pending:     'warning',
  };
  return (
    <Chip
      label={value}
      size="small"
      color={colorMap[value] || 'default'}
      variant="outlined"
      sx={{ textTransform: 'capitalize', fontWeight: 500, fontSize: '0.75rem' }}
    />
  );
}

// ── Column definitions ──
const routeColumns = [
  { field: 'id',            headerName: 'ID',        width: 60 },
  { field: 'busNumber',     headerName: 'Bus #',     width: 130 },
  { field: 'busType',       headerName: 'Type',      width: 120 },
  { field: 'from',          headerName: 'From',       width: 130 },
  { field: 'to',            headerName: 'To',         width: 130 },
  { field: 'departureTime', headerName: 'Departs',    width: 100 },
  { field: 'arrivalTime',   headerName: 'Arrives',    width: 100 },
  { field: 'fare',          headerName: 'Fare (₹)',   width: 100, type: 'number' },
  { field: 'totalSeats',    headerName: 'Seats',      width: 80,  type: 'number' },
  {
    field: 'status',
    headerName: 'Status',
    width: 130,
    renderCell: (params) => <StatusChip value={params.value} />,
  },
];

const bookingColumns = [
  { field: 'id',          headerName: 'ID',           width: 60 },
  { field: 'bookingRef',  headerName: 'Reference',    width: 160 },
  { field: 'passenger',   headerName: 'Passenger',    width: 150 },
  { field: 'from',        headerName: 'From',          width: 120 },
  { field: 'to',          headerName: 'To',             width: 120 },
  { field: 'date',        headerName: 'Journey Date',  width: 130 },
  { field: 'seats',       headerName: 'Seats',         width: 110 },
  { field: 'busType',     headerName: 'Bus Type',      width: 120 },
  { field: 'fare',        headerName: 'Fare (₹)',      width: 100, type: 'number' },
  {
    field: 'status',
    headerName: 'Status',
    width: 130,
    renderCell: (params) => <StatusChip value={params.value} />,
  },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState(0);
  const [routes, setRoutes] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // Attempt to load from API; fall back to mock data
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await api.get('/admin/routes', { timeout: 5000 });
        if (!cancelled && res.data?.routes?.length) {
          setRoutes(res.data.routes.map((r, i) => ({ id: r._id || r.id || i + 1, ...r })));
        } else if (!cancelled) {
          setRoutes(MOCK_ROUTES);
        }
      } catch {
        if (!cancelled) setRoutes(MOCK_ROUTES);
      } finally {
        if (!cancelled) setLoadingRoutes(false);
      }
    })();

    (async () => {
      try {
        const res = await api.get('/admin/bookings', { timeout: 5000 });
        if (!cancelled && res.data?.bookings?.length) {
          setBookings(res.data.bookings.map((b, i) => ({ id: b._id || b.id || i + 1, ...b })));
        } else if (!cancelled) {
          setBookings(MOCK_BOOKINGS);
        }
      } catch {
        if (!cancelled) setBookings(MOCK_BOOKINGS);
      } finally {
        if (!cancelled) setLoadingBookings(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // Summary stats
  const stats = useMemo(() => ({
    totalRoutes: routes.length,
    activeRoutes: routes.filter(r => r.status === 'active').length,
    totalBookings: bookings.length,
    confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
    totalRevenue: bookings
      .filter(b => b.status !== 'cancelled')
      .reduce((s, b) => s + (b.fare || 0), 0),
  }), [routes, bookings]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Manage bus routes and bookings</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Total Routes',     value: stats.totalRoutes,        color: 'text-blue-700' },
          { label: 'Active Routes',    value: stats.activeRoutes,       color: 'text-green-700' },
          { label: 'Total Bookings',   value: stats.totalBookings,      color: 'text-purple-700' },
          { label: 'Confirmed',        value: stats.confirmedBookings,  color: 'text-emerald-700' },
          { label: 'Revenue',          value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`, color: 'text-orange-700' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.9rem' },
          }}
        >
          <Tab label={`Bus Routes (${routes.length})`} />
          <Tab label={`Bookings (${bookings.length})`} />
        </Tabs>
      </Box>

      {/* DataGrid panels */}
      <Box
        sx={{
          height: 520,
          width: '100%',
          backgroundColor: '#fff',
          borderRadius: '0.75rem',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
          '& .MuiDataGrid-root': { border: 'none' },
          '& .MuiDataGrid-columnHeaders': { backgroundColor: '#f8fafc' },
          '& .MuiDataGrid-cell:focus-within': { outline: 'none' },
        }}
      >
        {tab === 0 ? (
          <DataGrid
            rows={routes}
            columns={routeColumns}
            loading={loadingRoutes}
            pageSizeOptions={[5, 10, 25]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
              sorting: { sortModel: [{ field: 'id', sort: 'asc' }] },
            }}
            disableRowSelectionOnClick
            sx={{ fontSize: '0.85rem' }}
          />
        ) : (
          <DataGrid
            rows={bookings}
            columns={bookingColumns}
            loading={loadingBookings}
            pageSizeOptions={[5, 10, 25]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
              sorting: { sortModel: [{ field: 'id', sort: 'desc' }] },
            }}
            disableRowSelectionOnClick
            sx={{ fontSize: '0.85rem' }}
          />
        )}
      </Box>

      {/* Demo notice */}
      <Typography variant="body2" sx={{ mt: 2, color: '#9ca3af', textAlign: 'center' }}>
        Showing demo data — connect the admin API endpoints to see live data.
      </Typography>
    </div>
  );
}

