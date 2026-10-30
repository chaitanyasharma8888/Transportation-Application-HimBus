import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api';

// ── Async thunks ────────────────────────────────────────────────────────────

export const fetchProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/auth/profile');
      return res.data.user;
    } catch {
      localStorage.removeItem('himbus_token');
      return rejectWithValue(null);
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('himbus_token', res.data.token);
      return { user: res.data.user, token: res.data.token };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Login failed. Check your credentials.');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async ({ name, email, phone, password }, { rejectWithValue }) => {
    try {
      const res = await api.post('/auth/register', { name, email, phone, password });
      localStorage.setItem('himbus_token', res.data.token);
      return { user: res.data.user, token: res.data.token };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Registration failed. Please try again.');
    }
  }
);

// ── Slice ───────────────────────────────────────────────────────────────────

const initialState = {
  user: null,
  token: localStorage.getItem('himbus_token'),
  loading: true,     // true until initial profile fetch resolves
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      localStorage.removeItem('himbus_token');
      state.user = null;
      state.token = null;
      state.loading = false;
      state.error = null;
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchProfile
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
      })
      .addCase(fetchProfile.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.loading = false;
      });

    // loginUser
    builder
      .addCase(loginUser.pending, (state) => {
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.error = action.payload;
      });

    // registerUser
    builder
      .addCase(registerUser.pending, (state) => {
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;

// Selectors
export const selectUser    = (state) => state.auth.user;
export const selectToken   = (state) => state.auth.token;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError   = (state) => state.auth.error;

export default authSlice.reducer;

