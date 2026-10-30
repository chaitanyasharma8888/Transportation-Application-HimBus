/**
 * ChatbotWidget.jsx
 *
 * Isolated floating chatbot overlay built with MUI.
 * Uses an MUI Fab (fixed, bottom-right) to open a right-side Drawer.
 * Streams responses from the Node.js SSE endpoint word-by-word.
 *
 * ISOLATION STRATEGY
 * - All MUI components are scoped inside a <StyledEngineProvider injectFirst>
 *   wrapper so that MUI's CSS-in-JS styles have lower specificity than
 *   the existing Tailwind stylesheet — no existing styles are affected.
 * - The Fab and Drawer use inline `sx` props / hardcoded styles only; they
 *   do NOT add any global class names that could clash with Tailwind.
 */

import { useState, useRef, useEffect } from 'react';
import {
  StyledEngineProvider,
  Fab,
  Drawer,
  Box,
  Typography,
  TextField,
  IconButton,
  CircularProgress,
  Divider,
  Avatar,
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import SmartToyIcon from '@mui/icons-material/SmartToy';

// ---------------------------------------------------------------------------
// Backend URL — set VITE_API_URL in your .env or Vercel Environment Variables.
// Falls back to the Vite dev-proxy base URL during local development.
// ---------------------------------------------------------------------------
const API_BASE = import.meta.env.VITE_API_URL || '';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const BOT_NAME = 'HimBus Assistant';

function createMessage(role, text = '') {
  return { id: Date.now() + Math.random(), role, text };
}

// ---------------------------------------------------------------------------
// Message Bubble
// ---------------------------------------------------------------------------
function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        gap: 1,
        mb: 1.5,
      }}
    >
      {/* Avatar */}
      <Avatar
        sx={{
          width: 30,
          height: 30,
          bgcolor: isUser ? '#1565c0' : '#e8f5e9',
          flexShrink: 0,
        }}
      >
        {isUser ? (
          <Typography sx={{ fontSize: 13, color: '#fff', fontWeight: 700 }}>U</Typography>
        ) : (
          <SmartToyIcon sx={{ fontSize: 17, color: '#2e7d32' }} />
        )}
      </Avatar>

      {/* Bubble */}
      <Box
        sx={{
          maxWidth: '76%',
          px: 1.5,
          py: 1,
          borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          bgcolor: isUser ? '#1565c0' : '#f1f3f4',
          color: isUser ? '#fff' : '#202124',
          fontSize: 14,
          lineHeight: 1.55,
          wordBreak: 'break-word',
          boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
          // Blinking cursor while bot is still typing
          '&.typing::after': msg.role === 'bot' && msg.isStreaming
            ? {
                content: '"▌"',
                display: 'inline-block',
                animation: 'blink 0.8s step-end infinite',
              }
            : {},
        }}
        className={msg.isStreaming ? 'typing' : ''}
      >
        {msg.text || (msg.isStreaming ? '' : <em style={{ opacity: 0.5 }}>…</em>)}
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Main Widget
// ---------------------------------------------------------------------------
export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    createMessage('bot', `Hi there! 👋 I'm ${BOT_NAME}. Ask me anything about your journey!`),
  ]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef(null);
  const eventSourceRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  // Clean up EventSource on unmount
  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  // ---------- Send a message ----------
  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || streaming) return;

    // Add user message
    const userMsg = createMessage('user', trimmed);
    // Add empty bot placeholder that will be filled by the stream
    const botMsgId = Date.now() + Math.random();
    const botPlaceholder = { id: botMsgId, role: 'bot', text: '', isStreaming: true };

    setMessages((prev) => [...prev, userMsg, botPlaceholder]);
    setInput('');
    setStreaming(true);

    // ---------- Open SSE connection ----------
    // EventSource only supports GET, which matches our endpoint.
    // We pass the user query as a URL param (unused by the mock, but ready for a real LLM).
    const url = `${API_BASE}/api/chat/stream?q=${encodeURIComponent(trimmed)}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      const chunk = event.data;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMsgId ? { ...m, text: m.text + chunk } : m
        )
      );
    };

    // Listen for our custom "done" event from the backend
    es.addEventListener('done', () => {
      es.close();
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMsgId ? { ...m, isStreaming: false } : m
        )
      );
      setStreaming(false);
    });

    es.onerror = () => {
      es.close();
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMsgId
            ? { ...m, text: m.text || '⚠️ Connection error. Please try again.', isStreaming: false }
            : m
        )
      );
      setStreaming(false);
    };
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClose = () => {
    // Close any active stream before closing the drawer
    eventSourceRef.current?.close();
    setOpen(false);
  };

  // ---------------------------------------------------------------------------
  // Render — wrapped in StyledEngineProvider to isolate MUI from Tailwind
  // ---------------------------------------------------------------------------
  return (
    <StyledEngineProvider injectFirst={false}>
      {/* Blinking cursor keyframe — injected once into the document */}
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>

      {/* ── FAB trigger ── */}
      <Fab
        aria-label="Open HimBus AI Chat"
        onClick={() => setOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 28,
          right: 28,
          zIndex: 1400,
          bgcolor: '#1565c0',
          color: '#fff',
          boxShadow: '0 4px 20px rgba(21,101,192,0.45)',
          '&:hover': { bgcolor: '#0d47a1' },
          // Pulse ring to draw attention on first load
          '&::after': {
            content: '""',
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            bgcolor: 'rgba(21,101,192,0.3)',
            animation: 'pulse 2s ease-out infinite',
          },
          '@keyframes pulse': {
            '0%': { transform: 'scale(1)', opacity: 0.8 },
            '100%': { transform: 'scale(2)', opacity: 0 },
          },
        }}
      >
        <ChatIcon />
      </Fab>

      {/* ── Drawer ── */}
      <Drawer
        anchor="right"
        open={open}
        onClose={handleClose}
        // Keep the drawer above Tailwind's base stacking context
        sx={{ zIndex: 1300 }}
        PaperProps={{
          sx: {
            width: { xs: '100vw', sm: 380 },
            display: 'flex',
            flexDirection: 'column',
            // Reset any inherited Tailwind styles
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
            bgcolor: '#fff',
          },
        }}
        // Prevent body-scroll lock from interfering with the existing page scroll
        disableScrollLock
      >
        {/* ── Header ── */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 2,
            py: 1.5,
            bgcolor: '#1565c0',
            color: '#fff',
            flexShrink: 0,
          }}
        >
          <DirectionsBusIcon sx={{ fontSize: 26 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>
              {BOT_NAME}
            </Typography>
            <Typography sx={{ fontSize: 11, opacity: 0.8 }}>
              {streaming ? 'Typing…' : 'Online · Streaming POC'}
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleClose} sx={{ color: '#fff' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Divider />

        {/* ── Message list ── */}
        <Box
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            px: 2,
            py: 2,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: '#fafafa',
          }}
        >
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
          {/* Invisible anchor for auto-scroll */}
          <div ref={messagesEndRef} />
        </Box>

        <Divider />

        {/* ── Input bar ── */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 1,
            px: 2,
            py: 1.5,
            bgcolor: '#fff',
            flexShrink: 0,
          }}
        >
          <TextField
            multiline
            maxRows={3}
            fullWidth
            size="small"
            placeholder="Ask about routes, timings, seats…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={streaming}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '20px',
                fontSize: 14,
              },
            }}
          />
          <IconButton
            onClick={handleSend}
            disabled={streaming || !input.trim()}
            sx={{
              bgcolor: streaming || !input.trim() ? '#e0e0e0' : '#1565c0',
              color: streaming || !input.trim() ? '#9e9e9e' : '#fff',
              '&:hover': { bgcolor: '#0d47a1' },
              flexShrink: 0,
              mb: '2px',
            }}
          >
            {streaming ? (
              <CircularProgress size={18} sx={{ color: '#9e9e9e' }} />
            ) : (
              <SendIcon fontSize="small" />
            )}
          </IconButton>
        </Box>
      </Drawer>
    </StyledEngineProvider>
  );
}

