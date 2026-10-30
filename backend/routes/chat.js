const express = require('express');
const router = express.Router();

// ---------------------------------------------------------------------------
// Smart keyword-based response bank
// Rules are checked top-to-bottom; FIRST match wins.
// Keywords use whole-word regex so "hi" won't match "shimla", etc.
// ---------------------------------------------------------------------------
const RESPONSE_RULES = [

  // ── Greetings ──────────────────────────────────────────────────────────────
  {
    keywords: ['hello', 'hi', 'hey', 'namaste', 'good morning', 'good evening', 'howdy', 'sup'],
    response: "Hello! 👋 Welcome to HimBus Assistant. I can help you with bus timings, seat availability, route info, booking status, and fare details. What would you like to know today?",
  },

  // ── Cancellation / Refund  (must be before 'ticket' / 'fare' rules) ───────
  {
    keywords: ['cancel', 'cancellation', 'refund', 'money back'],
    response: "❌ Cancellation & Refund Policy:\n• Cancel 24+ hours before departure: 90% refund\n• Cancel 12–24 hours before: 60% refund\n• Cancel within 12 hours: 25% refund\n• No-show: No refund\n\nRefunds are credited within 5–7 business days. To cancel, go to 'My Bookings' → select your trip → click 'Cancel Ticket'.",
  },

  // ── Booking status / My booking ────────────────────────────────────────────
  {
    keywords: ['my booking', 'booking status', 'pnr', 'booked', 'reservation', 'e-ticket', 'eticket', 'check booking'],
    response: "📋 To check your booking, click 'My Bookings' in the top nav after logging in. You'll see your booking reference, seat number, travel date, and can download your e-ticket as a PDF. For urgent help, call our helpline: 1800-180-8888 (Toll-Free).",
  },

  // ── Dharamshala ────────────────────────────────────────────────────────────
  {
    keywords: ['dharamshala', 'dharamsala', 'dharamshla'],
    response: "🚌 Dharamshala Service Update: The next bus to Dharamshala departs at 6:00 PM from Sector 43, Chandigarh. It's an AC Volvo coach (Bus No. HP-12-3456) with 14 seats still available. Estimated travel time is 7 hours. Fare starts at ₹650 per person. Board from Platform 6.",
  },

  // ── Manali ─────────────────────────────────────────────────────────────────
  {
    keywords: ['manali'],
    response: "🏔️ Manali Route: Two buses run today — 5:00 PM (Deluxe, ₹750) and 8:30 PM (AC Sleeper, ₹1,100) from ISBT Chandigarh Platform 3. The 8:30 PM bus has only 6 seats left — book soon! Arrival in Manali is around 5:00 AM next morning.",
  },

  // ── Shimla ─────────────────────────────────────────────────────────────────
  {
    keywords: ['shimla', 'simla'],
    response: "🌲 Shimla Bus Info: Buses to Shimla run every 30 minutes from Sector 43. Next departure: 5:30 PM (AC Volvo, Platform 2). Journey takes about 4 hours. Fare: ₹250 (Ordinary) or ₹380 (AC Volvo). All seats are currently available for evening slots!",
  },

  // ── Kullu ──────────────────────────────────────────────────────────────────
  {
    keywords: ['kullu', 'kulu'],
    response: "🌸 Kullu Route: The Kullu-bound semi-sleeper (Bus No. HP-08-7722) departs at 7:00 PM from Sector 43, Platform 5. Journey time is about 8 hours. Fare: ₹850 per seat. 22 seats are currently available. Enjoy the scenic Beas river valley on the way!",
  },

  // ── Spiti / Leh / Lahaul ───────────────────────────────────────────────────
  {
    keywords: ['spiti', 'leh', 'lahaul', 'kaza', 'keylong'],
    response: "🏔️ Spiti/Leh Route: Limited buses operate to this region due to mountain terrain. Buses depart every alternate day at 4:00 AM from Sector 43. Advance booking of at least 3 days is strongly recommended. Fare: ₹1,400–₹1,800 depending on destination. Roads may be closed in winter (Nov–April).",
  },

  // ── Seat availability ───────────────────────────────────────────────────────
  {
    keywords: ['seat', 'available seats', 'how many seats', 'seats left', 'availability'],
    response: "🪑 Live Seat Availability (Today's Evening):\n• Shimla 5:30 PM — 38 seats ✅\n• Dharamshala 6:00 PM — 14 seats ✅\n• Kullu 7:00 PM — 22 seats ✅\n• Manali 5:00 PM — 28 seats ✅\n• Manali 8:30 PM — Only 6 seats ⚠️\n\nTo choose specific seats, go to Search → select route → click 'Select Seats'.",
  },

  // ── Timing / Schedule ───────────────────────────────────────────────────────
  {
    keywords: ['time', 'timing', 'schedule', 'timetable', 'when does', 'what time', 'depart', 'departure', 'arrive', 'arrival', 'how long'],
    response: "🕐 Today's Full Schedule from Chandigarh (Sector 43 ISBT):\n• 5:00 PM → Manali (Deluxe, Platform 3)\n• 5:30 PM → Shimla (AC Volvo, Platform 2)\n• 6:00 PM → Dharamshala (AC Volvo, Platform 6)\n• 7:00 PM → Kullu (Semi-Sleeper, Platform 5)\n• 8:30 PM → Manali (AC Sleeper, Platform 3)\n\nArrive 15 minutes before departure. Tickets are checked at the gate.",
  },

  // ── Fare / Price / Cost ─────────────────────────────────────────────────────
  {
    keywords: ['fare', 'price', 'cost', 'ticket price', 'charge', 'rate', 'how much', 'fees'],
    response: "💰 HimBus Fare Guide (One-Way per Person):\n• Chandigarh → Shimla: ₹250 (Ordinary) / ₹380 (AC Volvo)\n• Chandigarh → Dharamshala: ₹650 (AC Volvo)\n• Chandigarh → Manali: ₹750 (Deluxe) / ₹1,100 (AC Sleeper)\n• Chandigarh → Kullu: ₹850 (Semi-Sleeper)\n\nChildren below 5 travel FREE! Senior citizens get 20% discount.",
  },

  // ── Payment ────────────────────────────────────────────────────────────────
  {
    keywords: ['pay', 'payment', 'upi', 'card', 'debit', 'credit', 'razorpay', 'online payment', 'gpay', 'phonepe', 'paytm'],
    response: "💳 Accepted Payment Methods on HimBus:\n• UPI — Google Pay, PhonePe, Paytm, BHIM ✅\n• Credit & Debit Cards — Visa, Mastercard, RuPay ✅\n• Net Banking — All major banks ✅\n• Wallets — Paytm, Mobikwik ✅\n\nAll payments are secured via Razorpay (256-bit SSL). E-ticket is emailed instantly after payment.",
  },

  // ── Luggage / Baggage ──────────────────────────────────────────────────────
  {
    keywords: ['luggage', 'baggage', 'bag', 'weight limit', 'carry', 'allowed'],
    response: "🧳 Luggage Policy:\n• Free allowance: 15 kg per passenger\n• Extra luggage: ₹5 per kg (charged at boarding)\n• 1 small carry-on bag allowed inside the bus\n• Cycles / large items must be declared at the time of booking\n\nTip: Lock your bags and don't leave valuables unattended at stops.",
  },

  // ── WiFi / Amenities ───────────────────────────────────────────────────────
  {
    keywords: ['wifi', 'wi-fi', 'internet', 'charging', 'amenities', 'facilities', 'ac bus', 'air conditioned', 'sleeper', 'blanket'],
    response: "✨ On-Board Amenities (AC Volvo & Sleeper Coaches):\n• 📶 Free WiFi\n• 🔌 USB charging at every seat\n• 💡 Individual reading lights\n• 🛏️ Blankets (Sleeper coaches)\n• 💧 Bottled water provided\n• 🚻 Restroom stops every 2–3 hours\n\nOrdinary buses have basic seating without AC. Check the bus type on the booking page.",
  },

  // ── Safety / Hygiene ───────────────────────────────────────────────────────
  {
    keywords: ['safe', 'safety', 'hygiene', 'sanitize', 'clean', 'covid', 'health'],
    response: "🛡️ HimBus Safety Standards:\n• Buses sanitized before every trip\n• Hand sanitizer dispensers on board\n• AC filters cleaned weekly\n• Drivers undergo monthly health checkups\n• GPS tracking on all routes\n• Emergency contact: 1800-180-8888\n\nWe follow all HRTC safety guidelines for a safe journey.",
  },

  // ── Customer support / Contact ─────────────────────────────────────────────
  {
    keywords: ['help', 'support', 'contact', 'phone number', 'helpline', 'customer care', 'complaint', 'report'],
    response: "📞 HimBus Customer Support:\n• Helpline: 1800-180-8888 (Toll-Free, 24/7) 📞\n• Email: support@himbus.in 📧\n• WhatsApp: +91-98050-12345 💬\n• Counter: Platform 8, Sector 43 ISBT\n\nFor lost & found or urgent issues at the bus stand, approach the HimBus counter directly. Average response time: under 5 minutes.",
  },

  // ── Thank you ──────────────────────────────────────────────────────────────
  {
    keywords: ['thank', 'thanks', 'thankyou', 'thank you', 'great', 'perfect', 'awesome', 'wonderful', 'excellent'],
    response: "😊 You're most welcome! Have a safe and enjoyable journey with HimBus. If you need anything before or during your trip, I'm just a message away. Happy travels! 🚌✨",
  },

  // ── Fallback (must be last, no keywords) ───────────────────────────────────
  {
    keywords: [],
    response: "🤔 Hmm, I didn't quite catch that. I can help you with:\n• 🕐 Bus schedules & timings\n• 🪑 Seat availability\n• 💰 Fares & pricing\n• 📋 Booking & cancellation\n• 💳 Payment options\n• 🧳 Luggage rules\n• 📞 Customer support\n\nTry asking: \"What time does the Manali bus leave?\" or \"How much is the fare to Shimla?\"",
  },
];

// ---------------------------------------------------------------------------
// Whole-word keyword matching using regex word boundaries.
// This prevents 'hi' from matching 'shimla', 'rate' from matching 'separate', etc.
// ---------------------------------------------------------------------------
function buildWordRegex(keyword) {
  // Escape special regex chars in keyword, then wrap in word boundaries.
  // For multi-word keywords like "good morning", \b works at spaces too.
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

function getResponse(question) {
  const q = (question || '').trim();
  if (!q) return RESPONSE_RULES[RESPONSE_RULES.length - 1].response; // fallback

  for (const rule of RESPONSE_RULES) {
    // Fallback rule has empty keywords array → always matches
    if (rule.keywords.length === 0) return rule.response;

    const matched = rule.keywords.some((kw) => buildWordRegex(kw).test(q));
    if (matched) return rule.response;
  }

  return RESPONSE_RULES[RESPONSE_RULES.length - 1].response;
}

// ---------------------------------------------------------------------------
// GET /api/chat/stream?q=<user message>
// ---------------------------------------------------------------------------
router.get('/stream', (req, res) => {
  // ── SSE headers ──────────────────────────────────────────────────────────
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disables Nginx response buffering
  res.flushHeaders();                        // Send headers immediately

  // ── Pick the right response based on the user's question ─────────────────
  const userQuestion = req.query.q || '';
  const responseText = getResponse(userQuestion);

  // ── Stream word by word every 50 ms ──────────────────────────────────────
  const words = responseText.split(' ');
  let index = 0;

  const interval = setInterval(() => {
    if (index < words.length) {
      const chunk = index < words.length - 1 ? words[index] + ' ' : words[index];
      res.write(`data: ${chunk}\n\n`);
      index++;
    } else {
      res.write(`event: done\ndata: [DONE]\n\n`);
      clearInterval(interval);
      res.end();
    }
  }, 50);

  // ── Clean up if client disconnects early ─────────────────────────────────
  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
});

module.exports = router;
