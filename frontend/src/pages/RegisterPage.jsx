import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bus, Mail, Lock, User, Phone, Loader2, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    '& fieldset': { borderColor: '#d1d5db' },
    '&:hover fieldset': { borderColor: '#93c5fd' },
    '&.Mui-focused fieldset': { borderColor: '#3b82f6', borderWidth: 2 },
  },
};

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    if (!form.name.trim()) return 'Name is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Invalid email address.';
    if (!/^[6-9]\d{9}$/.test(form.phone)) return 'Enter a valid 10-digit Indian mobile number.';
    if (form.password.length < 6) return 'Password must be at least 6 characters.';
    if (form.password !== form.confirm) return 'Passwords do not match.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    setError('');
    try {
      await register(form.name, form.email, form.phone, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pwdStrength = form.password.length === 0 ? 0 : form.password.length < 6 ? 1 : form.password.length < 10 ? 2 : 3;
  const pwdColors = ['', 'bg-red-500', 'bg-yellow-500', 'bg-green-500'];
  const pwdLabels = ['', 'Weak', 'Fair', 'Strong'];

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Create Account</h1>
          <p className="text-gray-500 text-sm mt-1">Join HimBus and book your journey</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 mb-4 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <TextField
              fullWidth
              label="Full Name"
              type="text"
              value={form.name}
              onChange={update('name')}
              placeholder="Your full name"
              required
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <User className="w-5 h-5 text-gray-400" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={fieldSx}
            />
          </div>

          <div>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={form.email}
              onChange={update('email')}
              placeholder="you@example.com"
              required
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Mail className="w-5 h-5 text-gray-400" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={fieldSx}
            />
          </div>

          <div>
            <TextField
              fullWidth
              label="Mobile Number"
              type="tel"
              value={form.phone}
              onChange={update('phone')}
              placeholder="10-digit mobile number"
              required
              slotProps={{
                htmlInput: { maxLength: 10 },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone className="w-5 h-5 text-gray-400" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={fieldSx}
            />
          </div>

          <div>
            <TextField
              fullWidth
              label="Password"
              type={showPwd ? 'text' : 'password'}
              value={form.password}
              onChange={update('password')}
              placeholder="Min. 6 characters"
              required
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock className="w-5 h-5 text-gray-400" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPwd(!showPwd)} edge="end" size="small">
                        {showPwd ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={fieldSx}
            />
            {form.password && (
              <div className="mt-1 flex items-center gap-2">
                <div className="flex gap-1 flex-1">
                  {[1,2,3].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full ${pwdStrength >= i ? pwdColors[pwdStrength] : 'bg-gray-200'}`}></div>
                  ))}
                </div>
                <span className="text-xs text-gray-500">{pwdLabels[pwdStrength]}</span>
              </div>
            )}
          </div>

          <div>
            <TextField
              fullWidth
              label="Confirm Password"
              type="password"
              value={form.confirm}
              onChange={update('confirm')}
              placeholder="Re-enter password"
              required
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock className="w-5 h-5 text-gray-400" />
                    </InputAdornment>
                  ),
                  endAdornment: form.confirm && form.confirm === form.password ? (
                    <InputAdornment position="end">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </InputAdornment>
                  ) : null,
                },
              }}
              sx={fieldSx}
            />
          </div>

          <div>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              disableElevation
              sx={{
                py: 1.5,
                borderRadius: '0.5rem',
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.9rem',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                '&:hover': { backgroundColor: '#1d4ed8' },
                '&.Mui-disabled': { opacity: 0.5, backgroundColor: '#2563eb', color: '#ffffff' },
              }}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              Create Account
            </Button>
          </div>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
