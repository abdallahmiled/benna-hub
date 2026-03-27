const express = require('express');
const router = express.Router();
const Cafe = require('../models/Cafe');
const CafeProduct = require('../models/CafeProduct');
const { protect, cafeOwner } = require('../middleware/authMiddleware');

// Public: list products (optionally by cafe)
router.get('/', async (req, res) => {
  try {
    const query = {};
    if (req.query.cafe) query.cafe = req.query.cafe;
    const products = await CafeProduct.find(query).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Cafe owner: my products
router.get('/owner/my-products', protect, cafeOwner, async (req, res) => {
  try {
    const cafe = await Cafe.findOne({ owner: req.user._id });
    if (!cafe) return res.status(404).json({ message: 'Cafe not found for this owner' });
    const products = await CafeProduct.find({ cafe: cafe._id }).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Cafe owner: create product
router.post('/', protect, cafeOwner, async (req, res) => {
  try {
    const cafe = await Cafe.findOne({ owner: req.user._id });
    if (!cafe) return res.status(404).json({ message: 'Cafe not found for this owner' });

    const { name, description, price, image, isAvailable } = req.body;
    if (!name || price === undefined) return res.status(400).json({ message: 'name and price are required' });

    const created = await CafeProduct.create({
      cafe: cafe._id,
      name,
      description,
      price,
      image,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
    });

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Cafe owner: update product
router.put('/:id', protect, cafeOwner, async (req, res) => {
  try {
    const cafe = await Cafe.findOne({ owner: req.user._id });
    if (!cafe) return res.status(404).json({ message: 'Cafe not found for this owner' });

    const p = await CafeProduct.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Product not found' });
    if (p.cafe.toString() !== cafe._id.toString()) {
      return res.status(403).json({ message: 'Not authorized for this product' });
    }

    p.name = req.body.name || p.name;
    p.description = req.body.description !== undefined ? req.body.description : p.description;
    p.price = req.body.price !== undefined ? req.body.price : p.price;
    p.image = req.body.image || p.image;
    p.isAvailable = req.body.isAvailable !== undefined ? req.body.isAvailable : p.isAvailable;

    const updated = await p.save();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Cafe owner: delete product
router.delete('/:id', protect, cafeOwner, async (req, res) => {
  try {
    const cafe = await Cafe.findOne({ owner: req.user._id });
    if (!cafe) return res.status(404).json({ message: 'Cafe not found for this owner' });

    const p = await CafeProduct.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Product not found' });
    if (p.cafe.toString() !== cafe._id.toString()) {
      return res.status(403).json({ message: 'Not authorized for this product' });
    }

    await CafeProduct.findByIdAndDelete(p._id);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

