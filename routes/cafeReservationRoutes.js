const express = require('express');
const router = express.Router();
const Cafe = require('../models/Cafe');
const CafeReservation = require('../models/CafeReservation');
const Counter = require('../models/Counter');
const { protect, cafeOwner } = require('../middleware/authMiddleware');

// User: create reservation
router.post('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'user') {
      return res.status(403).json({ message: 'Seuls les clients peuvent reserver.' });
    }

    const { cafe, peopleCount, reservationDate, reservationTime, occasionType, note } = req.body;
    if (!cafe || !peopleCount || !reservationDate || !reservationTime) {
      return res.status(400).json({ message: 'champs requis: cafe, peopleCount, reservationDate, reservationTime' });
    }

    const cafeDoc = await Cafe.findById(cafe);
    if (!cafeDoc) return res.status(404).json({ message: 'Cafe not found' });

    const counter = await Counter.findByIdAndUpdate(
      'cafe_reservation',
      { $inc: { seq: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const reservation = await CafeReservation.create({
      cafe: cafeDoc._id,
      user: req.user._id,
      orderNumber: counter.seq,
      peopleCount: Number(peopleCount),
      reservationDate,
      reservationTime,
      occasionType: occasionType || 'normal',
      note: note || '',
      tablePrice: Number(cafeDoc.reservationPrice || 0),
      status: 'pending',
      ownerMessage: 'Reservation envoyee, en attente de confirmation.',
    });

    res.status(201).json(reservation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// User: my reservations
router.get('/my', protect, async (req, res) => {
  try {
    const rows = await CafeReservation.find({ user: req.user._id })
      .populate('cafe', 'name image address')
      .sort({ createdAt: -1 });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Cafe owner: reservations of my cafe
router.get('/owner/my-reservations', protect, cafeOwner, async (req, res) => {
  try {
    const cafe = await Cafe.findOne({ owner: req.user._id });
    if (!cafe) return res.status(404).json({ message: 'Cafe not found for this owner' });

    const rows = await CafeReservation.find({ cafe: cafe._id })
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Cafe owner: update reservation status
router.patch('/:id/status', protect, cafeOwner, async (req, res) => {
  try {
    const { status, ownerMessage } = req.body;
    const allowed = ['accepted', 'rejected', 'completed', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'invalid status' });
    }

    const cafe = await Cafe.findOne({ owner: req.user._id });
    if (!cafe) return res.status(404).json({ message: 'Cafe not found for this owner' });

    const row = await CafeReservation.findById(req.params.id);
    if (!row) return res.status(404).json({ message: 'Reservation not found' });
    if (row.cafe.toString() !== cafe._id.toString()) {
      return res.status(403).json({ message: 'Not authorized for this reservation' });
    }

    row.status = status;
    row.ownerMessage =
      ownerMessage ||
      (status === 'accepted'
        ? 'Reservation acceptee.'
        : status === 'rejected'
          ? 'Reservation refusee.'
          : status === 'completed'
            ? 'Reservation terminee.'
            : 'Reservation annulee.');
    const updated = await row.save();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

