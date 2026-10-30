import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import store from './store'
import './index.css'
import App from './App.jsx'

// ── MUI theme — minimal config to co-exist peacefully with Tailwind v4.
// NO CssBaseline — Tailwind's @import "tailwindcss" already handles
// global resets (box-sizing, margin, font-family) and CssBaseline fights it.
const muiTheme = createTheme({
  typography: {
    fontFamily: 'inherit',
  },
  palette: {
    background: {
      default: 'transparent', // don't override Tailwind's bg-gray-50 on body
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider theme={muiTheme}>
        <App />
      </ThemeProvider>
    </Provider>
  </StrictMode>,
)
