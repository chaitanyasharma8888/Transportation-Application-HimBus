# 🚌 HimBus — Bus Ticket Booking Application

A full-stack bus ticket booking POC for Himachal Pradesh routes, built with React + Node.js.
Includes a **Streaming AI Chatbot** powered by Server-Sent Events (SSE).

---

## 🗂️ Project Structure

```
Transport application/
├── backend/                  ← Node.js + Express API server
│   ├── routes/
│   │   ├── auth.js           ← Login / Register routes
│   │   ├── booking.js        ← Booking CRUD routes
│   │   ├── payment.js        ← Razorpay payment routes
│   │   ├── search.js         ← Bus search routes
│   │   └── chat.js           ← ★ AI Chatbot SSE route (NEW)
│   ├── middleware/
│   │   └── auth.js           ← JWT authentication middleware
│   ├── database/
│   │   ├── setup.js          ← SQLite DB schema creation
│   │   ├── seed.js           ← Seeds sample bus/route data
│   │   └── himbus.db         ← SQLite database file
│   ├── server.js             ← Main Express app entry point (MODIFIED)
│   ├── .env                  ← Environment variables (not pushed to GitHub)
│   └── package.json          ← Backend dependencies
│
└── frontend/                 ← React + Vite application
    ├── src/
    │   ├── components/
    │   │   ├── ChatbotWidget.jsx   ← ★ AI Chatbot UI component (NEW)
    │   │   ├── BookingCard.jsx
    │   │   ├── BusCard.jsx
    │   │   ├── Navbar.jsx
    │   │   ├── Footer.jsx
    │   │   ├── PassengerForm.jsx
    │   │   ├── SearchForm.jsx
    │   │   └── SeatLayout.jsx
    │   ├── store/
    │   │   ├── index.js            ← Redux store setup
    │   │   ├── authSlice.js        ← Auth state management
    │   │   └── transportSlice.js   ← Search/booking state management
    │   ├── pages/
    │   │   ├── HomePage.jsx
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   ├── SearchResultsPage.jsx
    │   │   ├── SeatSelectionPage.jsx
    │   │   ├── BookingDetailsPage.jsx
    │   │   ├── PaymentPage.jsx
    │   │   ├── MyBookingsPage.jsx
    │   │   └── AdminDashboard.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── App.jsx             ← Root component (MODIFIED — added ChatbotWidget)
    │   ├── main.jsx            ← React entry point
    │   ├── api.js              ← Axios instance
    │   └── index.css           ← Global styles
    ├── vite.config.js
    └── package.json            ← Frontend dependencies
```

> **★ = Files created or modified for the AI Chatbot feature**

---

## 🤖 AI Chatbot — Files Created / Modified

### New Files Created

| File | Purpose |
|------|---------|
| `backend/routes/chat.js` | Express route that streams a keyword-matched response word-by-word using **Server-Sent Events (SSE)** |
| `frontend/src/components/ChatbotWidget.jsx` | The complete chatbot UI — floating button + sliding drawer + real-time streaming message display |

### Existing Files Modified

| File | What Changed |
|------|-------------|
| `backend/server.js` | Added `require('./routes/chat')` and registered it at `/api/chat`. Also upgraded CORS to support a comma-separated list of origins (for Vercel deployment) |
| `frontend/src/App.jsx` | Added `import ChatbotWidget` and placed `<ChatbotWidget />` just before `</BrowserRouter>` so it floats globally over every page |

---

## 🎨 Files Using Material UI (MUI)

MUI (`@mui/material`) is used for pre-built, polished React components.

| File | MUI Components Used |
|------|-------------------|
| `frontend/src/main.jsx` | `ThemeProvider`, `CssBaseline` — sets up the global MUI theme |
| `frontend/src/components/ChatbotWidget.jsx` | `Fab`, `Drawer`, `Box`, `Typography`, `TextField`, `IconButton`, `Avatar`, `CircularProgress`, `Divider` — **entire chatbot UI** |
| `frontend/src/components/BookingCard.jsx` | Cards, Chips, Typography for displaying booking summaries |
| `frontend/src/components/BusCard.jsx` | Cards, Buttons, Chips for bus listing items |
| `frontend/src/components/PassengerForm.jsx` | TextField, Select, FormControl for passenger details input |
| `frontend/src/components/SearchForm.jsx` | TextField, DatePicker, Autocomplete for the search bar |
| `frontend/src/pages/AdminDashboard.jsx` | DataGrid (`@mui/x-data-grid`) for admin data tables |
| `frontend/src/pages/LoginPage.jsx` | TextField, Button, Alert for the login form |
| `frontend/src/pages/RegisterPage.jsx` | TextField, Button, Alert for the register form |
| `frontend/src/pages/SearchResultsPage.jsx` | Select, MenuItem for sort/filter dropdowns |

> **Note:** The ChatbotWidget wraps all its MUI in `<StyledEngineProvider>` to prevent MUI styles from conflicting with the existing **Tailwind CSS** classes used by the rest of the app.

---

## 🔴 Files Using Redux Toolkit — And Why

Redux Toolkit is used to manage **global application state** — data that needs to be shared across multiple pages without prop-drilling.

### Store Setup

| File | Role |
|------|------|
| `frontend/src/store/index.js` | Creates the Redux store and combines both slices into one global state object |

### `authSlice.js` — User Authentication State

**Used in:** `AuthContext.jsx`, `LoginPage`, `RegisterPage`, `Navbar`, `MyBookingsPage`, `PaymentPage`

| Action | What it does |
|--------|-------------|
| `fetchProfile` | On app load, checks if the saved JWT token is still valid and loads the user |
| `loginUser` | Calls `/api/auth/login`, saves the JWT token to `localStorage`, stores user in state |
| `registerUser` | Calls `/api/auth/register`, saves JWT, stores user in state |
| `logout` | Clears JWT from `localStorage` and resets state to null |

**State shape:**
```js
auth: {
  user: { id, name, email, phone, role },
  token: "eyJ...",  // JWT
  loading: true/false,
  error: "Login failed..." / null
}
```

### `transportSlice.js` — Bus Search & Booking State

**Used in:** `SearchResultsPage`, `SeatSelectionPage`, `BookingDetailsPage`, `MyBookingsPage`, `PaymentPage`

| Action | What it does |
|--------|-------------|
| `searchBuses` | Calls `/api/search` with from/to/date. Falls back to mock data if the API returns 0 results |
| `fetchMyBookings` | Calls `/api/bookings` to load all bookings for the logged-in user |
| `fetchBooking` | Calls `/api/bookings/:ref` to load a single booking's full details |

**State shape:**
```js
transport: {
  searchResults: [...],     // array of bus routes
  searchLoading: false,
  isMock: false,            // true if showing demo data
  myBookings: [...],
  currentBooking: { ... }   // for detail/payment pages
}
```

---

## ⚙️ How Everything Works — High Level

```
┌─────────────────────────────────────────────────────┐
│                   BROWSER (User)                    │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │         React App  (localhost:5173)           │  │
│  │                                               │  │
│  │  Tailwind CSS  ──► Page Layout & Styles       │  │
│  │  React Router  ──► /search, /booking, etc.   │  │
│  │  Redux Store   ──► auth + transport state     │  │
│  │  MUI Components──► Forms, tables, chatbot     │  │
│  │                                               │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │  ChatbotWidget (Fab + Drawer)           │  │  │
│  │  │  EventSource → /api/chat/stream         │  │  │
│  │  │  Displays streamed words in real-time   │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────┘  │
│          │ Axios (REST)        │ EventSource (SSE)   │
└──────────┼─────────────────────┼────────────────────┘
           ▼                     ▼
┌─────────────────────────────────────────────────────┐
│           Node.js + Express  (localhost:5000)        │
│                                                     │
│  /api/auth/login     ──► bcrypt + JWT               │
│  /api/auth/register  ──► create user in SQLite      │
│  /api/search         ──► query routes from SQLite   │
│  /api/bookings       ──► CRUD bookings in SQLite    │
│  /api/payment        ──► Razorpay order creation    │
│  /api/chat/stream    ──► SSE keyword-matched reply  │
│                                                     │
│             ┌──────────────┐                        │
│             │  SQLite DB   │  (himbus.db)           │
│             │  users       │                        │
│             │  routes      │                        │
│             │  bookings    │                        │
│             └──────────────┘                        │
└─────────────────────────────────────────────────────┘
```

### Request Flow (Example: User searches for a bus)
1. User types "Chandigarh → Shimla" in `SearchForm` and clicks Search
2. `SearchResultsPage` dispatches `searchBuses(...)` Redux action
3. Redux calls `GET /api/search?from=1&to=2&date=...` via Axios
4. Express queries the SQLite database for matching routes
5. Results come back → Redux stores them in `transport.searchResults`
6. `SearchResultsPage` reads state with `useSelector` and renders `BusCard` components

### Chatbot Flow (SSE Streaming)
1. User types a message and hits Send in the Chatbot Drawer
2. Frontend opens an `EventSource` connection to `GET /api/chat/stream?q=shimla`
3. Backend's `chat.js` picks the best keyword-matched response for "shimla"
4. Backend streams the response **one word every 50ms** using `res.write('data: word\n\n')`
5. Frontend receives each word via `es.onmessage` and appends it to the UI in real-time
6. When all words are sent, backend fires `event: done` and closes the connection

---

## 🚀 How to Run the Application

### Prerequisites
- Node.js v18+ installed
- npm installed

### Step 1 — Install Backend Dependencies
```bash
cd "Transport application/backend"
npm install
```

### Step 2 — Install Frontend Dependencies
```bash
cd "Transport application/frontend"
npm install
```

### Step 3 — Start the Backend Server
```bash
cd "Transport application/backend"
node server.js
```
You should see:
```
Database initialized.
HimBus API server running on http://localhost:5000
```

### Step 4 — Start the Frontend (open a NEW terminal)
```bash
cd "Transport application/frontend"
npm run dev
```
You should see:
```
VITE v5.x.x  ready in ...ms
➜  Local:   http://localhost:5173/
```

### Step 5 — Open in Browser
Go to **http://localhost:5173** — you will see the full app.

> ⚠️ **Why does `localhost:5000` show an error in the browser?**
> That is completely normal! `localhost:5000` is the **API server**, not a website.
> It only responds to specific API paths like `/api/health` or `/api/chat/stream`.
> You never need to open port 5000 in your browser — the React app at port 5173 talks to it automatically in the background.

---

## 🐙 Putting the Code on GitHub — Step by Step

### First Time: Upload to GitHub

**Step 1 — Create a `.gitignore` file** in the project root (very important — keeps secrets and large files out):

Create a file called `.gitignore` in `Transport application/` with this content:
```
# Dependencies
node_modules/
*/node_modules/

# Environment files (contains passwords/secrets — NEVER push these)
.env
*/.env

# Build output
frontend/dist/
frontend/.vite/

# Database (optional — remove this line if you want to push seed data)
backend/database/himbus.db

# OS files
.DS_Store
Thumbs.db
```

**Step 2 — Go to GitHub.com** and create a new repository (click the `+` → "New repository"). Name it something like `himbus-transport-app`. Leave it empty (no README).

**Step 3 — Open a terminal in the `Transport application/` folder** and run these commands one by one:

```bash
# Initialize git
git init

# Add all files
git add .

# Make your first commit
git commit -m "Initial commit: HimBus transport app with AI chatbot"

# Connect to your GitHub repo (replace YOUR_USERNAME and YOUR_REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git push -u origin main
```

---

### Future Updates: Push Code Changes to GitHub

Whenever you make changes and want to update GitHub:

```bash
# Step 1: See what files changed
git status

# Step 2: Stage all changes
git add .

# Step 3: Commit with a description of what you changed
git commit -m "Fixed chatbot keyword matching"

# Step 4: Push to GitHub
git push
```

That's it! GitHub will automatically show the latest version of your code.

---

### ⚠️ Important: What NOT to Push to GitHub

| File/Folder | Why to exclude |
|-------------|---------------|
| `node_modules/` | Huge folder (100k+ files). Anyone cloning runs `npm install` to get it back |
| `.env` | Contains your JWT secret and Razorpay keys — never make these public |
| `frontend/dist/` | Build output, generated automatically — no need to store |
| `himbus.db` | SQLite database with user data — keep private |

---

## 🔑 Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
JWT_SECRET=your_secret_key_here
RAZORPAY_KEY_ID=rzp_test_your_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
FRONTEND_URL=http://localhost:5173
# For Vercel deployment, add your Vercel URL:
# FRONTEND_URL=http://localhost:5173,https://your-app.vercel.app
```

### Frontend (create `frontend/.env` for deployment)
```env
# Leave empty for local dev (Vite proxy handles it)
# Set this when deploying to Vercel:
VITE_API_URL=https://your-backend-server.com
```

---

## 🧰 Tech Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend Framework | React 18 | UI component library |
| Build Tool | Vite | Fast dev server & bundler |
| Styling | Tailwind CSS | Utility-first page layout & design |
| UI Components | Material UI (MUI) | Pre-built form controls, chatbot UI |
| State Management | Redux Toolkit | Global auth + search/booking state |
| Routing | React Router v6 | Client-side page navigation |
| Backend | Node.js + Express | REST API + SSE chatbot endpoint |
| Database | SQLite (sql.js) | Lightweight embedded database |
| Auth | JWT + bcrypt | Secure login token system |
| Payments | Razorpay | Payment gateway integration |
| Chatbot | SSE (EventSource) | Real-time streaming AI chat (mock) |
| Deployment (planned) | Vercel (frontend) + VPS (backend) | Cloud hosting |
