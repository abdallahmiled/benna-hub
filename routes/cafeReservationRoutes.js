const express = require('express');
const router = express.Router();
const Cafe = require('../models/Cafe');
const CafeReservation = require('../models/CafeReservation');
const Counter = require('../models/Counter');
const { protect, cafeOwner } = require('../middleware/authMiddleware');

const ACTIVE_TABLE_STATUSES = ['pending', 'accepted'];

/** Réattribue 1..cap aux réservations acceptées par date (cohérence + données anciennes). */
async function normalizeAcceptedTableAssignments(cafeId, tableCapacity) {
  const cap = Math.max(0, Number(tableCapacity) || 0);
  if (cap < 1) return;
  const dates = await CafeReservation.distinct('reservationDate', {
    cafe: cafeId,
    status: 'accepted',
  });
  for (const date of dates) {
    const rows = await CafeReservation.find({
      cafe: cafeId,
      reservationDate: date,
      status: 'accepted',
    }).sort({ createdAt: 1 });
    let n = 1;
    for (const r of rows) {
      const next = n <= cap ? n : null;
      n += 1;
      if (r.assignedTableNumber !== next) {
        r.assignedTableNumber = next;
        await r.save();
      }
    }
  }
}

// Public: capacité tables / réservées / disponibles pour une date (1 réservation = 1 table)
router.get('/cafe/:cafeId/day/:date', async (req, res) => {
  try {
    const { cafeId, date } = req.params;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: 'Date requise (YYYY-MM-DD).' });
    }
    const cafeDoc = await Cafe.findById(cafeId);
    if (!cafeDoc) return res.status(404).json({ message: 'Cafe not found' });

    const tableCapacity = Math.max(0, Number(cafeDoc.tableCount) || 0);
    const reservedTables = await CafeReservation.countDocuments({
      cafe: cafeDoc._id,
      reservationDate: date,
      status: { $in: ACTIVE_TABLE_STATUSES },
    });
    const availableTables = Math.max(0, tableCapacity - reservedTables);

    res.json({
      date,
      tableCapacity,
      reservedTables,
      availableTables,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

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

    await normalizeAcceptedTableAssignments(cafe._id, cafe.tableCount);
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

    const prevStatus = row.status;
    const cap = Math.max(0, Number(cafe.tableCount) || 0);

    if (status === 'accepted') {
      if (cap < 1) {
        return res.status(400).json({ message: 'Capacité tables non configurée dans le profil du café.' });
      }
      const countAccepted = await CafeReservation.countDocuments({
        cafe: cafe._id,
        reservationDate: row.reservationDate,
        status: 'accepted',
        _id: { $ne: row._id },
      });
      if (countAccepted >= cap) {
        return res.status(400).json({ message: 'Plus de table libre pour cette date.' });
      }
    } else if (prevStatus === 'accepted' && ['rejected', 'completed', 'cancelled'].includes(status)) {
      row.assignedTableNumber = null;
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
    await row.save();
    await normalizeAcceptedTableAssignments(cafe._id, cafe.tableCount);
    const updated = await CafeReservation.findById(row._id).populate('user', 'name email phone');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

