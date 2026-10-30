// ── Redux-backed AuthContext ────────────────────────────────────────────────
// This file preserves the exact same `useAuth()` hook API that every consumer
// already relies on, but wires it to the Redux store instead of local state.
// Existing call-sites (Navbar, LoginPage, RegisterPage, etc.) keep working
// without any import changes.

import { createContext, useContext, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchProfile,
  loginUser,
  registerUser,
  logout as logoutAction,
  selectUser,
  selectToken,
  selectAuthLoading,
} from '../store/authSlice';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const dispatch = useDispatch();
  const user    = useSelector(selectUser);
  const token   = useSelector(selectToken);
  const loading = useSelector(selectAuthLoading);

  // On mount (or when token changes), fetch profile just like the old Context did
  useEffect(() => {
    if (token) {
      dispatch(fetchProfile());
    }
  }, [token, dispatch]);

  const login = async (email, password) => {
    const result = await dispatch(loginUser({ email, password })).unwrap();
    return result;
  };

  const register = async (name, email, phone, password) => {
    const result = await dispatch(registerUser({ name, email, phone, password })).unwrap();
    return result;
  };

  const logout = () => {
    dispatch(logoutAction());
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
