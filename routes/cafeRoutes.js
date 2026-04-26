const express = require('express');
const router = express.Router();
const Cafe = require('../models/Cafe');
const { protect } = require('../middleware/authMiddleware');

// Public: list cafes
router.get('/', async (req, res) => {
  try {
    const cafes = await Cafe.find({}).sort({ createdAt: -1 });
    res.json(cafes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Owner (cafe): my cafe
router.get('/owner/my-cafe', protect, async (req, res) => {
  try {
    if (req.user.role !== 'cafe_owner' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized as a cafe owner' });
    }
    const cafe = await Cafe.findOne({ owner: req.user._id });
    if (!cafe) return res.status(404).json({ message: 'Cafe not found for this owner' });
    res.json(cafe);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Owner (cafe): mettre à jour capacité tables et répartition ordinaires / familiales
router.put('/owner/my-cafe', protect, async (req, res) => {
  try {
    if (req.user.role !== 'cafe_owner' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized as a cafe owner' });
    }
    const cafe = await Cafe.findOne({ owner: req.user._id });
    if (!cafe) return res.status(404).json({ message: 'Cafe not found for this owner' });

    if (req.body.tableCount !== undefined) {
      const t = Math.max(0, Math.floor(Number(req.body.tableCount)));
      cafe.tableCount = Number.isFinite(t) ? t : 0;
    }

    const total = Math.max(0, Number(cafe.tableCount) || 0);

    if (req.body.ordinaryTableCount !== undefined) {
      let o = Math.floor(Number(req.body.ordinaryTableCount));
      if (Number.isNaN(o)) o = 0;
      o = Math.max(0, Math.min(total, o));
      cafe.ordinaryTableCount = o;
    }

    if (total === 0) {
      cafe.ordinaryTableCount = 0;
    } else if (cafe.ordinaryTableCount != null && Number(cafe.ordinaryTableCount) > total) {
      cafe.ordinaryTableCount = total;
    }

    await cafe.save();
    res.json(cafe);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Public: get cafe by id
router.get('/:id', async (req, res) => {
  try {
    const cafe = await Cafe.findById(req.params.id);
    if (!cafe) return res.status(404).json({ message: 'Cafe not found' });
    res.json(cafe);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

