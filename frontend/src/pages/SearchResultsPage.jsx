import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Loader2, AlertCircle, Bus, SlidersHorizontal } from 'lucide-react';
import {
  searchBuses,
  selectSearchResults,
  selectSearchLoading,
  selectIsMock,
} from '../store/transportSlice';
import BusCard from '../components/BusCard';
import SearchForm from '../components/SearchForm';

import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';

const BUS_TYPES   = ['Ordinary', 'Deluxe', 'Semi-Luxury', 'Volvo AC', 'Electric'];
const SORT_OPTIONS = [
  { value: 'departure_time',  label: '⏰ Earliest Departure' },
  { value: 'fare',            label: '💰 Lowest Fare' },
  { value: 'available_seats', label: '💺 Most Seats' },
];

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();

  const from     = searchParams.get('from');
  const to       = searchParams.get('to');
  const date     = searchParams.get('date');
  const fromName = decodeURIComponent(searchParams.get('fromName') || 'Origin');
  const toName   = decodeURIComponent(searchParams.get('toName')   || 'Destination');

  // Redux state
  const results = useSelector(selectSearchResults);
  const loading = useSelector(selectSearchLoading);
  const isMock  = useSelector(selectIsMock);

  // UI-only local state (filters, toggles — stay local)
  const [busType,     setBusType]     = useState('');
  const [sortBy,      setSortBy]      = useState('departure_time');
  const [showSearch,  setShowSearch]  = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!from || !to || !date) return;
    dispatch(searchBuses({ from, to, date, sortBy, fromName, toName }));
  }, [from, to, date, sortBy, dispatch, fromName, toName]);

  // Client-side bus type filter
  const filtered = busType
    ? results.filter(r => r.bus.bus_type === busType)
    : results;

  const formatDate = (d) => {
    try {
      return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
      });
    } catch { return d; }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">

      {/* ── Search Summary Bar ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              {fromName} → {toName}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {formatDate(date)} •{' '}
              {loading ? 'Searching…' : (
                <span className="text-blue-600 font-medium">
                  {filtered.length} bus{filtered.length !== 1 ? 'es' : ''} found
                  {isMock && <span className="text-amber-500 ml-1">(demo data)</span>}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => setShowSearch(s => !s)}
            className="text-sm text-blue-600 font-medium hover:underline"
          >
            {showSearch ? '▲ Hide' : '✏️ Modify Search'}
          </button>
        </div>

        {showSearch && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <SearchForm
              compact
              initialFrom={{ id: Number(from), city: fromName }}
              initialTo={  { id: Number(to),   city: toName   }}
              initialDate={date}
            />
          </div>
        )}
      </div>

      {/* ── Mock data notice ── */}
      {isMock && !loading && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl p-3 mb-4 text-sm flex items-center gap-2">
          ⚠️ <span>Showing <strong>demo data</strong> — backend may be starting up or no routes found for this combination. Results below are for illustration.</span>
        </div>
      )}

      {/* ── Filters row ── */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <Button
          variant="outlined"
          size="small"
          onClick={() => setShowFilters(s => !s)}
          startIcon={<SlidersHorizontal className="w-4 h-4" />}
          sx={{
            borderRadius: '0.5rem',
            textTransform: 'none',
            fontSize: '0.875rem',
            borderColor: '#d1d5db',
            color: '#374151',
            '&:hover': { backgroundColor: '#f9fafb', borderColor: '#9ca3af' },
            px: 1.5,
            py: 0.75,
          }}
        >
          Filters
        </Button>

        {showFilters && (
          <>
            {BUS_TYPES.map(t => (
              <button key={t}
                onClick={() => setBusType(busType === t ? '' : t)}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition ${
                  busType === t
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                }`}
              >
                {t}
              </button>
            ))}
          </>
        )}

        <div className="ml-auto">
          <FormControl size="small">
            <Select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              sx={{
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#d1d5db' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#93c5fd' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6', borderWidth: 2 },
              }}
            >
              {SORT_OPTIONS.map(o => (
                <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
      </div>

      {/* ── Results ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          <p className="text-gray-500 text-sm">Searching available buses…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24">
          <Bus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No buses found</h3>
          <p className="text-gray-400 text-sm">
            Try removing filters, or check a different date.
          </p>
          {busType && (
            <button
              onClick={() => setBusType('')}
              className="mt-4 text-blue-600 hover:underline text-sm"
            >
              Clear bus type filter
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(r => (
            <BusCard key={r.route_id} result={r} date={date} />
          ))}
        </div>
      )}
    </div>
  );
}
