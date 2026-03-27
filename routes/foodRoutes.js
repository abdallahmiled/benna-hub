const express = require('express');
const router = express.Router();
const Food = require('../models/Food');
const Restaurant = require('../models/Restaurant');
const { protect, owner } = require('../middleware/authMiddleware');

// Get all foods
router.get('/', async (req, res) => {
  try {
    const query = {};
    if (req.query.restaurant) {
      query.restaurant = req.query.restaurant;
    }
    const foods = await Food.find(query).populate('restaurant', 'name');
    res.json(foods);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Owner: get foods of his restaurant
router.get('/owner/my-foods', protect, owner, async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found for this owner' });
    }

    const foods = await Food.find({ restaurant: restaurant._id }).sort({ createdAt: -1 });
    res.json(foods);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Owner: create food
router.post('/', protect, owner, async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found for this owner' });
    }

    const { name, description, price, image, isAvailable } = req.body;
    if (!name || !price) {
      return res.status(400).json({ message: 'name and price are required' });
    }

    const food = new Food({
      restaurant: restaurant._id,
      name,
      description,
      price,
      image,
      isAvailable: isAvailable !== undefined ? isAvailable : true
    });

    const createdFood = await food.save();
    res.status(201).json(createdFood);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Owner: update food
router.put('/:id', protect, owner, async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found for this owner' });
    }

    const food = await Food.findById(req.params.id);
    if (!food) {
      return res.status(404).json({ message: 'Food not found' });
    }

    if (food.restaurant.toString() !== restaurant._id.toString()) {
      return res.status(403).json({ message: 'Not authorized for this food' });
    }

    food.name = req.body.name || food.name;
    food.description = req.body.description || food.description;
    food.price = req.body.price !== undefined ? req.body.price : food.price;
    food.image = req.body.image || food.image;
    food.isAvailable = req.body.isAvailable !== undefined ? req.body.isAvailable : food.isAvailable;

    const updatedFood = await food.save();
    res.json(updatedFood);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Owner: delete food
router.delete('/:id', protect, owner, async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found for this owner' });
    }

    const food = await Food.findById(req.params.id);
    if (!food) {
      return res.status(404).json({ message: 'Food not found' });
    }

    if (food.restaurant.toString() !== restaurant._id.toString()) {
      return res.status(403).json({ message: 'Not authorized for this food' });
    }

    await Food.findByIdAndDelete(food._id);
    res.json({ message: 'Food deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
