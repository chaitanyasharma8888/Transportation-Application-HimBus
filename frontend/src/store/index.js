import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import transportReducer from './transportSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    transport: transportReducer,
  },
});

export default store;

