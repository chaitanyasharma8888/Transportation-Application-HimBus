import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Search, ArrowLeftRight, Loader2 } from 'lucide-react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';

// ── Mock station data — always available even if backend is down ──
const MOCK_STATIONS = [
  { id: 1,  city: 'Delhi',       name: 'Delhi ISBT Kashmere Gate',    state: 'Delhi' },
  { id: 2,  city: 'Chandigarh',  name: 'Chandigarh ISBT Sector 43',   state: 'Chandigarh' },
  { id: 3,  city: 'Shimla',      name: 'Shimla ISBT',                  state: 'Himachal Pradesh' },
  { id: 4,  city: 'Manali',      name: 'Manali Bus Stand',             state: 'Himachal Pradesh' },
  { id: 5,  city: 'Dharamshala', name: 'Dharamshala Bus Stand',        state: 'Himachal Pradesh' },
  { id: 6,  city: 'Kullu',       name: 'Kullu Bus Stand',              state: 'Himachal Pradesh' },
  { id: 7,  city: 'Mandi',       name: 'Mandi Bus Stand',              state: 'Himachal Pradesh' },
  { id: 8,  city: 'Hamirpur',    name: 'Hamirpur Bus Stand',           state: 'Himachal Pradesh' },
  { id: 9,  city: 'Una',         name: 'Una Bus Stand',                state: 'Himachal Pradesh' },
  { id: 10, city: 'Bilaspur',    name: 'Bilaspur Bus Stand',           state: 'Himachal Pradesh' },
  { id: 11, city: 'Solan',       name: 'Solan Bus Stand',              state: 'Himachal Pradesh' },
  { id: 12, city: 'Nahan',       name: 'Nahan Bus Stand',              state: 'Himachal Pradesh' },
  { id: 13, city: 'Rampur',      name: 'Rampur Bus Stand',             state: 'Himachal Pradesh' },
  { id: 14, city: 'Keylong',     name: 'Keylong Bus Stand',            state: 'Himachal Pradesh' },
  { id: 15, city: 'Dalhousie',   name: 'Dalhousie Bus Stand',          state: 'Himachal Pradesh' },
  { id: 16, city: 'Haridwar',    name: 'Haridwar Bus Stand',           state: 'Uttarakhand' },
  { id: 17, city: 'Dehradun',    name: 'Dehradun ISBT',                state: 'Uttarakhand' },
];

function filterStations(query) {
  if (!query || !query.trim()) return MOCK_STATIONS;
  const q = query.trim().toLowerCase();
  return MOCK_STATIONS.filter(
    s => s.city.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
  );
}

// Shared sx for MUI TextFields so they blend with the existing Tailwind card
const textFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '0.75rem',
    backgroundColor: '#fff',
    fontSize: '0.875rem',
    '& fieldset': { borderColor: '#d1d5db' },
    '&:hover fieldset': { borderColor: '#93c5fd' },
    '&.Mui-focused fieldset': { borderColor: '#3b82f6', borderWidth: 2 },
  },
  '& .MuiInputLabel-root': { fontSize: '0.875rem' },
};

export default function SearchForm({ compact = false, initialFrom, initialTo, initialDate }) {
  const [fromQuery, setFromQuery]         = useState('');
  const [toQuery, setToQuery]             = useState('');
  const [fromStation, setFromStation]     = useState(initialFrom || null);
  const [toStation, setToStation]         = useState(initialTo   || null);
  const [date, setDate]                   = useState(initialDate || '');
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions,   setToSuggestions]   = useState([]);
  const [showFrom, setShowFrom]           = useState(false);
  const [showTo,   setShowTo]             = useState(false);
  const [loading, setLoading]             = useState(false);

  const fromRef = useRef(null);
  const toRef   = useRef(null);
  const navigate = useNavigate();

  const today   = new Date().toISOString().split('T')[0];
  const maxDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Pre-fill labels when initialFrom/To provided
  useEffect(() => {
    if (initialFrom) setFromQuery(initialFrom.city || initialFrom.name || '');
  }, [initialFrom]);
  useEffect(() => {
    if (initialTo) setToQuery(initialTo.city || initialTo.name || '');
  }, [initialTo]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (fromRef.current && !fromRef.current.contains(e.target)) setShowFrom(false);
      if (toRef.current   && !toRef.current.contains(e.target))   setShowTo(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleFromChange = (e) => {
    const v = e.target.value;
    setFromQuery(v);
    setFromStation(null);
    setFromSuggestions(filterStations(v));
    setShowFrom(true);
  };

  const handleToChange = (e) => {
    const v = e.target.value;
    setToQuery(v);
    setToStation(null);
    setToSuggestions(filterStations(v));
    setShowTo(true);
  };

  const selectFrom = (s) => {
    setFromStation(s);
    setFromQuery(s.city);
    setShowFrom(false);
  };

  const selectTo = (s) => {
    setToStation(s);
    setToQuery(s.city);
    setShowTo(false);
  };

  const swap = () => {
    const tmpS = fromStation, tmpQ = fromQuery;
    setFromStation(toStation);  setFromQuery(toQuery);
    setToStation(tmpS);         setToQuery(tmpQ);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!fromStation || !toStation || !date) return;
    navigate(
      `/search?from=${fromStation.id}&to=${toStation.id}&date=${date}` +
      `&fromName=${encodeURIComponent(fromStation.city)}&toName=${encodeURIComponent(toStation.city)}`
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`bg-white rounded-2xl shadow-xl ${compact ? 'p-4' : 'p-6 md:p-8'}`}
    >
      {!compact && (
        <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">
          🔍 Search Bus Tickets
        </h2>
      )}

      {/* ── Row 1: From / Swap / To / Date ── */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-end">

        {/* FROM */}
        <div className="relative flex-1" ref={fromRef}>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            From
          </label>
          <TextField
            fullWidth
            size="small"
            value={fromQuery}
            onChange={handleFromChange}
            onFocus={() => { setFromSuggestions(filterStations(fromQuery)); setShowFrom(true); }}
            placeholder="Origin city…"
            autoComplete="off"
            required
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <MapPin className="w-4 h-4 text-green-500" />
                  </InputAdornment>
                ),
              },
            }}
            sx={textFieldSx}
          />
          {showFrom && fromSuggestions.length > 0 && (
            <ul className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-200
                           rounded-xl shadow-lg max-h-52 overflow-y-auto">
              {fromSuggestions
                .filter(s => !toStation || s.id !== toStation.id)
                .map(s => (
                  <li
                    key={s.id}
                    onMouseDown={() => selectFrom(s)}
                    className="flex items-center gap-2 px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-sm"
                  >
                    <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span>
                      <span className="font-medium text-gray-800">{s.city}</span>
                      <span className="text-gray-400 text-xs ml-1">— {s.name}</span>
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </div>

        {/* SWAP button */}
        <div className="flex items-end justify-center md:pb-0 pb-0 md:flex-shrink-0">
          <IconButton
            onClick={swap}
            title="Swap stations"
            sx={{
              width: 40,
              height: 40,
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              '&:hover': { backgroundColor: '#dbeafe' },
              mb: '2px',
            }}
          >
            <ArrowLeftRight className="w-4 h-4 text-blue-600" />
          </IconButton>
        </div>

        {/* TO */}
        <div className="relative flex-1" ref={toRef}>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            To
          </label>
          <TextField
            fullWidth
            size="small"
            value={toQuery}
            onChange={handleToChange}
            onFocus={() => { setToSuggestions(filterStations(toQuery)); setShowTo(true); }}
            placeholder="Destination city…"
            autoComplete="off"
            required
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <MapPin className="w-4 h-4 text-red-400" />
                  </InputAdornment>
                ),
              },
            }}
            sx={textFieldSx}
          />
          {showTo && toSuggestions.length > 0 && (
            <ul className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-200
                           rounded-xl shadow-lg max-h-52 overflow-y-auto">
              {toSuggestions
                .filter(s => !fromStation || s.id !== fromStation.id)
                .map(s => (
                  <li
                    key={s.id}
                    onMouseDown={() => selectTo(s)}
                    className="flex items-center gap-2 px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-sm"
                  >
                    <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span>
                      <span className="font-medium text-gray-800">{s.city}</span>
                      <span className="text-gray-400 text-xs ml-1">— {s.name}</span>
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </div>

        {/* DATE */}
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Date of Journey
          </label>
          <TextField
            fullWidth
            size="small"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Calendar className="w-4 h-4 text-blue-500" />
                  </InputAdornment>
                ),
              },
              htmlInput: { min: today, max: maxDate },
            }}
            required
            sx={textFieldSx}
          />
        </div>

        {/* SEARCH BUTTON */}
        <div className="md:flex-shrink-0">
          <label className="block text-xs font-semibold text-transparent mb-1 select-none">.</label>
          <Button
            type="submit"
            variant="contained"
            disabled={!fromStation || !toStation || !date}
            startIcon={<Search className="w-4 h-4" />}
            sx={{
              width: { xs: '100%', md: 'auto' },
              px: 4,
              py: '10.5px',
              borderRadius: '0.75rem',
              fontWeight: 700,
              fontSize: '0.875rem',
              textTransform: 'none',
              backgroundColor: '#2563eb',
              '&:hover': { backgroundColor: '#1d4ed8' },
              '&:active': { backgroundColor: '#1e40af' },
              '&.Mui-disabled': { opacity: 0.4, backgroundColor: '#2563eb', color: '#fff' },
            }}
          >
            Search
          </Button>
        </div>
      </div>

      {/* Validation hint */}
      {(!fromStation || !toStation) && (fromQuery || toQuery) && (
        <p className="text-xs text-amber-600 mt-3 text-center">
          Please select a city from the dropdown suggestions.
        </p>
      )}
    </form>
  );
}
