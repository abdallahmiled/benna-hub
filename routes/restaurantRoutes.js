const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const Food = require('../models/Food');
const Commande = require('../models/Commande');
const { protect, owner } = require('../middleware/authMiddleware');
const { ensureOrderNumbers } = require('../utils/orderNumbers');

// Get all restaurants
router.get('/', async (req, res) => {
  try {
    const restaurants = await Restaurant.find({});
    res.json(restaurants);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Create restaurant (Owner only)
router.post('/', protect, owner, async (req, res) => {
  try {
    const existingRestaurant = await Restaurant.findOne({ owner: req.user._id });
    if (existingRestaurant) {
      return res.status(400).json({ message: 'Owner already has a restaurant' });
    }

    const restaurant = new Restaurant({
      owner: req.user._id,
      name: req.body.name,
      description: req.body.description,
      address: req.body.address,
      location: req.body.location,
      googleMapsUrl: req.body.googleMapsUrl,
      cuisineType: req.body.cuisineType,
      image: req.body.image
    });
    const createdRestaurant = await restaurant.save();
    res.status(201).json(createdRestaurant);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get owner restaurant (Owner only)
router.get('/owner/my-restaurant', protect, owner, async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found for this owner' });
    }
    res.json(restaurant);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Owner dashboard stats
router.get('/owner/dashboard', protect, owner, async (req, res) => {
  try {
    await ensureOrderNumbers();
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found for this owner' });
    }

    const [foods, commandes] = await Promise.all([
      Food.find({ restaurant: restaurant._id }).sort({ createdAt: -1 }),
      Commande.find({ restaurant: restaurant._id })
        .populate('user', 'name')
        .populate('items.food', 'name image')
        .sort({ createdAt: -1 })
    ]);

    const deliveredStatuses = ['delivered'];
    const activeStatuses = ['pending', 'accepted', 'preparing', 'ready_for_delivery', 'out_for_delivery'];
    const allStatuses = [
      'pending',
      'accepted',
      'rejected',
      'preparing',
      'ready_for_delivery',
      'out_for_delivery',
      'delivered',
      'cancelled'
    ];

    const totalOrders = commandes.length;
    const completedOrders = commandes.filter((c) => deliveredStatuses.includes(c.status)).length;
    const remainingOrders = commandes.filter((c) => activeStatuses.includes(c.status)).length;
    const rejectedOrders = commandes.filter((c) => c.status === 'rejected').length;
    const cancelledOrders = commandes.filter((c) => c.status === 'cancelled').length;
    const totalSalesDelivered = commandes
      .filter((c) => deliveredStatuses.includes(c.status))
      .reduce((sum, c) => {
        if (typeof c.itemsTotal === 'number') return sum + c.itemsTotal;
        return sum + Math.max(0, (c.totalAmount || 0) - (c.deliveryFee || 0));
      }, 0);

    const totalSalesRated = commandes
      .filter((c) => c.status === 'delivered' && c.rating && typeof c.rating.score === 'number')
      .reduce((sum, c) => {
        if (typeof c.itemsTotal === 'number') return sum + c.itemsTotal;
        return sum + Math.max(0, (c.totalAmount || 0) - (c.deliveryFee || 0));
      }, 0);

    const ordersByStatus = {};
    allStatuses.forEach((s) => {
      ordersByStatus[s] = commandes.filter((c) => c.status === s).length;
    });

    const formatYMD = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const salesByDay = [];
    for (let i = 13; i >= 0; i -= 1) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = formatYMD(d);
      const dayTotal = commandes
        .filter(
          (c) => c.status === 'delivered' && c.rating && typeof c.rating.score === 'number' && formatYMD(new Date(c.createdAt)) === key
        )
        .reduce((sum, c) => {
          if (typeof c.itemsTotal === 'number') return sum + c.itemsTotal;
          return sum + Math.max(0, (c.totalAmount || 0) - (c.deliveryFee || 0));
        }, 0);
      salesByDay.push({ date: key, total: dayTotal });
    }

    res.json({
      restaurant,
      stats: {
        totalSalesDelivered,
        totalSalesRated,
        totalOrders,
        completedOrders,
        remainingOrders,
        rejectedOrders,
        cancelledOrders,
        totalFoods: foods.length
      },
      charts: {
        salesByDay,
        ordersByStatus
      },
      foods,
      recentOrders: commandes.slice(0, 10)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Public: avis clients (notes après livraison)
router.get('/:id/reviews', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid restaurant id' });
    }
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const rows = await Commande.find({
      restaurant: req.params.id,
      status: 'delivered',
      'rating.score': { $gte: 1, $lte: 5 },
    })
      .sort({ 'rating.ratedAt': -1 })
      .limit(limit)
      .select('rating');

    res.json(
      rows.map((c) => ({
        score: c.rating.score,
        comment: String(c.rating.comment || '').slice(0, 500),
        ratedAt: c.rating.ratedAt,
      }))
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single restaurant
router.get('/:id', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (restaurant) res.json(restaurant);
    else res.status(404).json({ message: 'Restaurant not found' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Update restaurant
router.put('/:id', protect, owner, async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (restaurant) {
      if (restaurant.owner.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: 'Not authorized' });
      }
      restaurant.name = req.body.name || restaurant.name;
      restaurant.description = req.body.description || restaurant.description;
      restaurant.address = req.body.address || restaurant.address;
      restaurant.location = req.body.location || restaurant.location;
      restaurant.googleMapsUrl = req.body.googleMapsUrl || restaurant.googleMapsUrl;
      restaurant.cuisineType = req.body.cuisineType || restaurant.cuisineType;
      restaurant.image = req.body.image || restaurant.image;
      if (req.body.delegation !== undefined) {
        restaurant.delegation = String(req.body.delegation || '').trim();
      }
      restaurant.isOpen = req.body.isOpen !== undefined ? req.body.isOpen : restaurant.isOpen;
      const updatedRestaurant = await restaurant.save();
      res.json(updatedRestaurant);
    } else {
      res.status(404).json({ message: 'Restaurant not found' });
    }
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
