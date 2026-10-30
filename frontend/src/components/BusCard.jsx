import { useNavigate } from 'react-router-dom';
import { Clock, ArrowRight } from 'lucide-react';
import Button from '@mui/material/Button';

const busTypeColors = {
  'Ordinary':    'bg-gray-100   text-gray-700   border-gray-300',
  'Deluxe':      'bg-blue-100   text-blue-700   border-blue-300',
  'Semi-Luxury': 'bg-purple-100 text-purple-700 border-purple-300',
  'Volvo AC':    'bg-green-100  text-green-700  border-green-300',
  'Electric':    'bg-teal-100   text-teal-700   border-teal-300',
};

const busTypeEmoji = {
  'Ordinary':    '🚌',
  'Deluxe':      '🚍',
  'Semi-Luxury': '🛋️',
  'Volvo AC':    '❄️',
  'Electric':    '⚡',
};

function formatDuration(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h${m > 0 ? ` ${m}m` : ''}`;
}

export default function BusCard({ result, date }) {
  const navigate = useNavigate();
  const {
    route_id, bus, from_station, to_station,
    fare, departure_time, arrival_time, duration_mins, available_seats,
  } = result;

  const seatColor = available_seats === 0
    ? 'text-red-600'
    : available_seats <= 5
      ? 'text-orange-500'
      : 'text-green-600';

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition border border-gray-200 p-5">
      <div className="flex flex-col md:flex-row md:items-stretch gap-4">

        {/* ── Left: Route & Bus Info ── */}
        <div className="flex-1 min-w-0">
          {/* Bus type + number */}
          <div className="flex items-center gap-2 mb-4">
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${busTypeColors[bus.bus_type] || 'bg-gray-100 text-gray-700 border-gray-300'}`}>
              <span>{busTypeEmoji[bus.bus_type] || '🚌'}</span>
              {bus.bus_type}
            </span>
            <span className="text-sm text-gray-400 font-mono">{bus.bus_number}</span>
          </div>

          {/* Departure → Arrival timeline */}
          <div className="flex items-center gap-3">
            {/* From */}
            <div className="text-center min-w-[60px]">
              <div className="text-xl font-bold text-gray-900">{departure_time}</div>
              <div className="text-xs text-gray-500 mt-0.5">{from_station.city}</div>
            </div>

            {/* Duration line */}
            <div className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {formatDuration(duration_mins)}
              </span>
              <div className="w-full flex items-center gap-1">
                <div className="h-0.5 flex-1 bg-gray-200 rounded" />
                <ArrowRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              </div>
              <span className="text-xs text-gray-400">Direct</span>
            </div>

            {/* To */}
            <div className="text-center min-w-[60px]">
              <div className="text-xl font-bold text-gray-900">{arrival_time}</div>
              <div className="text-xs text-gray-500 mt-0.5">{to_station.city}</div>
            </div>
          </div>

          {/* Amenities */}
          {bus.amenities && bus.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {bus.amenities.map((a, i) => (
                <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md border border-blue-100">
                  {a}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Divider ── */}
        <div className="hidden md:block w-px bg-gray-100" />

        {/* ── Right: Fare, Seats, Button ── */}
        <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-3 md:min-w-[130px]">
          <div className="text-right">
            <div className="text-2xl font-extrabold text-blue-700">₹{fare}</div>
            <div className="text-xs text-gray-400">per seat</div>
          </div>

          <div className={`text-sm font-semibold ${seatColor}`}>
            {available_seats === 0 ? 'Sold Out' : `${available_seats} seats left`}
          </div>

          <Button
            variant="contained"
            onClick={() => navigate(`/seats/${route_id}/${date}`)}
            disabled={available_seats === 0}
            sx={{
              px: 2.5,
              py: 1.25,
              borderRadius: '0.75rem',
              fontWeight: 600,
              fontSize: '0.875rem',
              textTransform: 'none',
              whiteSpace: 'nowrap',
              backgroundColor: available_seats === 0 ? '#d1d5db' : '#2563eb',
              '&:hover': { backgroundColor: '#1d4ed8' },
              '&:active': { backgroundColor: '#1e40af' },
              '&.Mui-disabled': { backgroundColor: '#d1d5db', color: '#fff' },
            }}
          >
            {available_seats === 0 ? 'Sold Out' : 'Select Seats →'}
          </Button>
        </div>
      </div>
    </div>
  );
}
