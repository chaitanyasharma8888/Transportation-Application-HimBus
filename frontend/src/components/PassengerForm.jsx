import { useState, useEffect } from 'react';
import { User, Mail, Phone, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

// Shared sx for MUI TextFields — matches rounded Tailwind card aesthetic
const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    backgroundColor: '#fff',
    '& fieldset': { borderColor: '#cbd5e1' },
    '&:hover fieldset': { borderColor: '#93c5fd' },
    '&.Mui-focused fieldset': { borderColor: '#3b82f6', borderWidth: 2 },
  },
  '& .MuiInputLabel-root': { fontSize: '0.875rem' },
};

const errorFieldSx = {
  ...fieldSx,
  '& .MuiOutlinedInput-root': {
    ...fieldSx['& .MuiOutlinedInput-root'],
    '& fieldset': { borderColor: '#f87171' },
  },
};

export default function PassengerForm({ selectedSeats, onSubmit, loading }) {
  const { user } = useAuth();
  const [passengers, setPassengers] = useState([]);
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setPassengers(
      selectedSeats.map((seat) => ({
        seatNumber: seat,
        name: '',
        age: '',
        gender: 'Male',
      }))
    );
  }, [selectedSeats]);

  useEffect(() => {
    if (user) {
      setContactEmail(user.email || '');
      setContactPhone(user.phone || '');
    }
  }, [user]);

  const updatePassenger = (index, field, value) => {
    setPassengers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[`p${index}_${field}`];
      return copy;
    });
  };

  const validate = () => {
    const errs = {};
    passengers.forEach((p, i) => {
      if (!p.name.trim()) errs[`p${i}_name`] = 'Name is required';
      if (!p.age || p.age < 1 || p.age > 120) errs[`p${i}_age`] = 'Valid age required';
    });
    if (!contactEmail.trim() || !/\S+@\S+\.\S+/.test(contactEmail))
      errs.email = 'Valid email is required';
    if (!contactPhone.trim() || contactPhone.replace(/\D/g, '').length < 10)
      errs.phone = 'Valid phone number is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      passengers,
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim(),
    });
  };

  if (selectedSeats.length === 0) return null;

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-5 space-y-6">
      <h3 className="text-lg font-bold text-slate-800">Passenger Details</h3>

      {passengers.map((p, i) => (
        <div key={p.seatNumber} className="p-4 bg-slate-50 rounded-xl space-y-3">
          <div className="text-sm font-semibold text-blue-700">
            Seat {p.seatNumber} — Passenger {i + 1}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Name */}
            <div>
              <TextField
                fullWidth
                size="small"
                label="Full Name"
                value={p.name}
                onChange={(e) => updatePassenger(i, 'name', e.target.value)}
                placeholder="Passenger name"
                error={!!errors[`p${i}_name`]}
                helperText={errors[`p${i}_name`] || ''}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <User className="w-4 h-4 text-slate-400" />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={errors[`p${i}_name`] ? errorFieldSx : fieldSx}
              />
            </div>

            {/* Age */}
            <div>
              <TextField
                fullWidth
                size="small"
                label="Age"
                type="number"
                value={p.age}
                onChange={(e) => updatePassenger(i, 'age', e.target.value)}
                placeholder="Age"
                error={!!errors[`p${i}_age`]}
                helperText={errors[`p${i}_age`] || ''}
                slotProps={{ htmlInput: { min: 1, max: 120 } }}
                sx={errors[`p${i}_age`] ? errorFieldSx : fieldSx}
              />
            </div>

            {/* Gender — MUI Select via TextField select prop */}
            <div>
              <TextField
                fullWidth
                size="small"
                select
                label="Gender"
                value={p.gender}
                onChange={(e) => updatePassenger(i, 'gender', e.target.value)}
                sx={fieldSx}
              >
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>
            </div>
          </div>
        </div>
      ))}

      {/* Contact Details */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-700">Contact Details</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Email */}
          <div>
            <TextField
              fullWidth
              size="small"
              label="Email"
              type="email"
              value={contactEmail}
              onChange={(e) => {
                setContactEmail(e.target.value);
                setErrors((prev) => { const c = { ...prev }; delete c.email; return c; });
              }}
              placeholder="email@example.com"
              error={!!errors.email}
              helperText={errors.email || ''}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Mail className="w-4 h-4 text-slate-400" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={errors.email ? errorFieldSx : fieldSx}
            />
          </div>

          {/* Phone */}
          <div>
            <TextField
              fullWidth
              size="small"
              label="Phone"
              type="tel"
              value={contactPhone}
              onChange={(e) => {
                setContactPhone(e.target.value);
                setErrors((prev) => { const c = { ...prev }; delete c.phone; return c; });
              }}
              placeholder="10-digit phone"
              error={!!errors.phone}
              helperText={errors.phone || ''}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone className="w-4 h-4 text-slate-400" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={errors.phone ? errorFieldSx : fieldSx}
            />
          </div>
        </div>
      </div>

      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={loading}
        sx={{
          py: 1.5,
          borderRadius: '0.75rem',
          fontWeight: 600,
          fontSize: '0.9rem',
          textTransform: 'none',
          backgroundColor: '#16a34a',
          '&:hover': { backgroundColor: '#15803d' },
          '&.Mui-disabled': { backgroundColor: '#86efac', color: '#fff' },
        }}
      >
        {loading ? (
          <>
            <CircularProgress size={20} sx={{ color: '#fff', mr: 1 }} />
            Processing...
          </>
        ) : (
          'Proceed to Payment'
        )}
      </Button>
    </form>
  );
}
