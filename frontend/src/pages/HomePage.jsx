import { useNavigate } from 'react-router-dom';
import {
  Ticket, MousePointer, CheckCircle, Shield,
  Calendar, Clock, CreditCard, Star, Bus,
  MapPin, ArrowRight, Users, TrendingUp, Zap
} from 'lucide-react';
import SearchForm from '../components/SearchForm';

// ── Static dummy data — no API needed ──────────────────────────────────────
const POPULAR_ROUTES = [
  { from: 'Delhi',      to: 'Shimla',      fromId: 1, toId: 3,  fare: 450,  duration: '9 hrs',  buses: 4, image: '🏔️' },
  { from: 'Delhi',      to: 'Manali',      fromId: 1, toId: 4,  fare: 700,  duration: '13 hrs', buses: 4, image: '🌨️' },
  { from: 'Shimla',     to: 'Manali',      fromId: 3, toId: 4,  fare: 350,  duration: '8 hrs',  buses: 3, image: '⛰️' },
  { from: 'Chandigarh', to: 'Shimla',      fromId: 2, toId: 3,  fare: 200,  duration: '3.5 hrs',buses: 3, image: '🌿' },
  { from: 'Delhi',      to: 'Dharamshala', fromId: 1, toId: 5,  fare: 600,  duration: '11 hrs', buses: 3, image: '🧘' },
  { from: 'Shimla',     to: 'Kullu',       fromId: 3, toId: 6,  fare: 300,  duration: '6 hrs',  buses: 2, image: '🍎' },
];

const FEATURES = [
  {
    icon: Ticket,
    color: 'bg-blue-100 text-blue-600',
    title: 'Easy Booking',
    desc: 'Book tickets in under 2 minutes. No queues, no hassle.',
  },
  {
    icon: MousePointer,
    color: 'bg-green-100 text-green-600',
    title: 'Choose Your Seat',
    desc: 'Interactive seat map — pick window, aisle or front seat.',
  },
  {
    icon: CheckCircle,
    color: 'bg-purple-100 text-purple-600',
    title: 'Instant Confirmation',
    desc: 'Get your e-ticket immediately after payment.',
  },
  {
    icon: Shield,
    color: 'bg-orange-100 text-orange-600',
    title: 'Secure & Safe',
    desc: '100% secure payments with industry-standard encryption.',
  },
];

const STATS = [
  { icon: Users,      value: '2,50,000+', label: 'Happy Travellers' },
  { icon: Bus,        value: '47+',       label: 'Daily Routes' },
  { icon: MapPin,     value: '17',        label: 'Cities Covered' },
  { icon: TrendingUp, value: '99.2%',     label: 'On-Time Rate' },
];

const TESTIMONIALS = [
  {
    name: 'Priya Sharma',
    city: 'Delhi',
    rating: 5,
    text: 'Booked Delhi to Shimla Volvo in minutes. Seat selection was smooth and the ticket arrived instantly. Best bus booking app!',
  },
  {
    name: 'Rahul Verma',
    city: 'Chandigarh',
    rating: 5,
    text: 'Used HimBus for my Manali trip. Really easy to use, great seat map, and the refund came quickly when I had to cancel.',
  },
  {
    name: 'Anita Thakur',
    city: 'Shimla',
    rating: 4,
    text: 'Finally a proper HP bus booking site! All the routes are there, prices are transparent, and no hidden charges.',
  },
];

const BUS_TYPES = [
  { type: 'Ordinary',    color: 'border-gray-300 bg-gray-50',   badge: 'bg-gray-200 text-gray-700',   icon: '🚌', desc: 'Affordable travel to every corner of HP' },
  { type: 'Deluxe',      color: 'border-blue-300 bg-blue-50',   badge: 'bg-blue-200 text-blue-700',   icon: '🚍', desc: 'Cushioned seats with extra comfort' },
  { type: 'Semi-Luxury', color: 'border-purple-300 bg-purple-50', badge: 'bg-purple-200 text-purple-700', icon: '🛋️', desc: 'Pushback seats and charging points' },
  { type: 'Volvo AC',    color: 'border-green-300 bg-green-50', badge: 'bg-green-200 text-green-700', icon: '❄️', desc: 'Premium AC coaches for long routes' },
  { type: 'Electric',    color: 'border-teal-300 bg-teal-50',   badge: 'bg-teal-200 text-teal-700',   icon: '⚡', desc: 'Eco-friendly zero-emission buses' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-gray-50">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-blue-800 via-blue-700 to-indigo-800 text-white overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute -bottom-16 -left-16 w-72 h-72 bg-white/5 rounded-full" />

        <div className="relative max-w-7xl mx-auto px-4 pt-16 pb-12 md:pt-24 md:pb-20">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20
                            rounded-full px-4 py-1.5 text-sm mb-6">
              <Zap className="w-4 h-4 text-yellow-300" />
              <span>Book up to 60 days in advance</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-4">
              Your Gateway to<br />
              <span className="text-yellow-300">the Hills</span>
            </h1>
            <p className="text-blue-100 text-lg md:text-xl max-w-2xl mx-auto">
              Book bus tickets across Himachal Pradesh — Shimla, Manali, Dharamshala, Kullu &amp; 13 more destinations.
            </p>
          </div>

          {/* Search Form */}
          <div className="max-w-5xl mx-auto">
            <SearchForm />
          </div>

          {/* Quick stats below hero */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10 max-w-4xl mx-auto">
            {STATS.map(({ icon: Icon, value, label }) => (
              <div key={label} className="text-center bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
                <Icon className="w-5 h-5 mx-auto mb-1 text-yellow-300" />
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-blue-200 text-xs">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BUS TYPES ─────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-14">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 text-center mb-2">
          Choose Your Comfort
        </h2>
        <p className="text-gray-500 text-center mb-8">Five bus categories for every budget and journey</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {BUS_TYPES.map(bt => (
            <div key={bt.type}
              className={`border-2 ${bt.color} rounded-xl p-4 text-center hover:shadow-md transition cursor-pointer`}
              onClick={() => navigate(`/search?from=1&to=3&date=${today}&fromName=Delhi&toName=Shimla`)}>
              <div className="text-3xl mb-2">{bt.icon}</div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${bt.badge}`}>{bt.type}</span>
              <p className="text-gray-500 text-xs mt-2 leading-snug">{bt.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── POPULAR ROUTES ────────────────────────────────────────────────── */}
      <section className="bg-white py-14">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 text-center mb-2">
            Popular Routes
          </h2>
          <p className="text-gray-500 text-center mb-8">Most booked routes this month — click any to search instantly</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {POPULAR_ROUTES.map((route, i) => (
              <button
                key={i}
                onClick={() => navigate(
                  `/search?from=${route.fromId}&to=${route.toId}&date=${today}` +
                  `&fromName=${route.from}&toName=${route.to}`
                )}
                className="group bg-white border-2 border-gray-100 hover:border-blue-400
                           rounded-2xl p-5 text-left shadow-sm hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="text-3xl">{route.image}</div>
                  <span className="text-xs bg-blue-50 text-blue-600 font-medium px-2 py-1 rounded-lg">
                    {route.buses} buses/day
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-800 font-bold text-lg mb-1">
                  <span>{route.from}</span>
                  <ArrowRight className="w-4 h-4 text-blue-500 group-hover:translate-x-1 transition-transform" />
                  <span>{route.to}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {route.duration}
                  </span>
                  <span className="text-blue-700 font-bold text-base">
                    ₹{route.fare} <span className="text-gray-400 font-normal text-xs">onwards</span>
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-14">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 text-center mb-2">
          Why HimBus?
        </h2>
        <p className="text-gray-500 text-center mb-10">Everything you need for a smooth journey</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center hover:shadow-md transition">
              <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                <Icon className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-gray-800 mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── REFUND / BOOKING POLICY ───────────────────────────────────────── */}
      <section className="bg-blue-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          {[
            { icon: '📅', title: '60-Day Advance Booking', desc: 'Plan ahead and lock in the best seats.' },
            { icon: '💳', title: 'Secure Payments', desc: 'UPI, Cards, Net Banking — all accepted.' },
            { icon: '↩️', title: 'Easy Cancellation', desc: '90% refund if cancelled 12+ hrs before.' },
          ].map(p => (
            <div key={p.title} className="flex flex-col items-center gap-2">
              <div className="text-4xl">{p.icon}</div>
              <h3 className="font-bold text-lg">{p.title}</h3>
              <p className="text-blue-200 text-sm">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-14">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 text-center mb-2">
          What Travellers Say
        </h2>
        <p className="text-gray-500 text-center mb-10">Real reviews from real HimBus passengers</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-1 mb-3">
                {[...Array(t.rating)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">"{t.text}"</p>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                  {t.name[0]}
                </div>
                <div>
                  <div className="font-semibold text-gray-800 text-sm">{t.name}</div>
                  <div className="text-gray-400 text-xs">{t.city}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── BOTTOM CTA ────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white py-14">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-3">Ready to Hit the Hills?</h2>
          <p className="text-blue-200 mb-6">Search buses, pick your seat, and hit the road — all in under 2 minutes.</p>
          <button
            onClick={() => document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-white text-blue-700 font-bold px-8 py-3 rounded-xl hover:bg-blue-50 transition inline-flex items-center gap-2"
          >
            <Bus className="w-5 h-5" /> Book Now
          </button>
        </div>
      </section>

    </div>
  );
}
