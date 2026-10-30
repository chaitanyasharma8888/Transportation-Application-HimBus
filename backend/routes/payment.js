const express = require('express');
const crypto = require('crypto');
const { getDb } = require('../database/setup');

const router = express.Router();

function isMockMode() {
  return (
    !process.env.RAZORPAY_KEY_ID ||
    process.env.RAZORPAY_KEY_ID === 'rzp_test_placeholder' ||
    !process.env.RAZORPAY_KEY_SECRET ||
    process.env.RAZORPAY_KEY_SECRET === 'placeholder_secret'
  );
}

// POST /api/payment/create-order
router.post('/create-order', async (req, res) => {
  try {
    const { booking_ref, amount } = req.body;

    if (!booking_ref || !amount) {
      return res.status(400).json({ error: 'booking_ref and amount are required.' });
    }

    const db = getDb();
    const booking = db.prepare('SELECT * FROM bookings WHERE booking_ref = ?').get(booking_ref.toUpperCase());

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    if (booking.payment_status === 'paid') {
      return res.status(400).json({ error: 'Payment already completed for this booking.' });
    }

    if (isMockMode()) {
      // Mock Razorpay order
      const mockOrderId = 'order_mock_' + crypto.randomBytes(8).toString('hex');
      return res.json({
        order_id: mockOrderId,
        amount: Math.round(amount * 100), // amount in paise
        currency: 'INR',
        booking_ref: booking.booking_ref,
        mock: true,
      });
    }

    // Real Razorpay
    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // amount in paise
      currency: 'INR',
      receipt: booking.booking_ref,
      notes: {
        booking_ref: booking.booking_ref,
      },
    });

    res.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      booking_ref: booking.booking_ref,
      mock: false,
    });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Failed to create payment order.' });
  }
});

// POST /api/payment/verify
router.post('/verify', (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, booking_ref } = req.body;

    if (!booking_ref) {
      return res.status(400).json({ error: 'booking_ref is required.' });
    }

    const db = getDb();
    const booking = db.prepare('SELECT * FROM bookings WHERE booking_ref = ?').get(booking_ref.toUpperCase());

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    if (booking.payment_status === 'paid') {
      return res.status(400).json({ error: 'Payment already verified for this booking.' });
    }

    if (isMockMode()) {
      // In mock mode, accept any payment and update status
      const paymentId = razorpay_payment_id || 'pay_mock_' + crypto.randomBytes(8).toString('hex');

      db.prepare(`UPDATE bookings SET payment_status = 'paid', payment_id = ? WHERE booking_ref = ?`)
        .run(paymentId, booking_ref.toUpperCase());

      return res.json({
        message: 'Payment verified successfully (mock mode).',
        booking_ref: booking.booking_ref,
        payment_id: paymentId,
        payment_status: 'paid',
      });
    }

    // Real Razorpay verification
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.' });
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Payment verification failed. Invalid signature.' });
    }

    db.prepare(`UPDATE bookings SET payment_status = 'paid', payment_id = ? WHERE booking_ref = ?`)
      .run(razorpay_payment_id, booking_ref.toUpperCase());

    res.json({
      message: 'Payment verified successfully.',
      booking_ref: booking.booking_ref,
      payment_id: razorpay_payment_id,
      payment_status: 'paid',
    });
  } catch (err) {
    console.error('Verify payment error:', err);
    res.status(500).json({ error: 'Payment verification failed.' });
  }
});

module.exports = router;
