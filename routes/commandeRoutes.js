const express = require('express');
const router = express.Router();
const Commande = require('../models/Commande');
const Counter = require('../models/Counter');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const { protect, owner, livreur } = require('../middleware/authMiddleware');
const { ensureOrderNumbers } = require('../utils/orderNumbers');

const STATUS_MESSAGES = {
  pending: 'Commande envoyee au restaurant, en attente de confirmation.',
  accepted: 'Commande acceptee par le restaurant.',
  rejected: 'Commande refusee par le restaurant.',
  preparing: 'Commande en cours de preparation.',
  ready_for_delivery: 'Votre commande est prete pour le livreur.',
  out_for_delivery: 'Votre commande est en route.',
  delivered: 'Votre commande est livree. Vous pouvez donner une note.',
  cancelled: 'Commande annulee.'
};

const ALLOWED_TRANSITIONS = {
  pending: ['accepted', 'rejected', 'cancelled'],
  accepted: ['preparing', 'cancelled'],
  preparing: ['ready_for_delivery', 'cancelled'],
  ready_for_delivery: ['out_for_delivery', 'delivered'],
  out_for_delivery: ['delivered'],
  delivered: [],
  rejected: [],
  cancelled: []
};

// Create commande
router.post('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'user') {
      return res.status(403).json({ message: 'Seuls les clients peuvent commander.' });
    }
    const { restaurant, items, totalAmount, deliveryAddress } = req.body;
    if (items && items.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    } else {
      const counter = await Counter.findByIdAndUpdate(
        'commande',
        { $inc: { seq: 1 } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      const itemsTotal = Number(totalAmount) || 0;
      const deliveryFee = 5;
      const finalTotal = Number((itemsTotal + deliveryFee).toFixed(2));

      const commande = new Commande({
        orderNumber: counter.seq,
        user: req.user._id,
        restaurant,
        items,
        itemsTotal,
        deliveryFee,
        totalAmount: finalTotal,
        deliveryAddress,
        status: 'pending',
        customerMessage: STATUS_MESSAGES.pending
      });
      const createdCommande = await commande.save();
      res.status(201).json(createdCommande);
    }
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get logged in user commandes
router.get('/my', protect, async (req, res) => {
  try {
    await ensureOrderNumbers();
    const commandes = await Commande.find({ user: req.user._id })
      .populate('restaurant', 'name image')
      .populate('items.food', 'name image')
      .populate('deliveryPerson', 'name phone')
      .sort({ createdAt: -1 });
    res.json(commandes);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Owner: get commandes of one restaurant
router.get('/restaurant/:restaurantId', protect, owner, async (req, res) => {
  try {
    await ensureOrderNumbers();
    const restaurant = await Restaurant.findById(req.params.restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized for this restaurant' });
    }

    const commandes = await Commande.find({ restaurant: restaurant._id })
      .populate('user', 'name email phone')
      .populate('items.food', 'name image')
      .populate('deliveryPerson', 'name phone')
      .sort({ createdAt: -1 });

    res.json(commandes);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Owner: update commande status (accept/reject/prepare/ready...)
router.patch('/:id/status', protect, owner, async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const commande = await Commande.findById(req.params.id).populate('restaurant');

    if (!commande) {
      return res.status(404).json({ message: 'Commande not found' });
    }

    if (commande.restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized for this commande' });
    }

    const allowedNextStatuses = ALLOWED_TRANSITIONS[commande.status] || [];
    if (!allowedNextStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid transition from ${commande.status} to ${status}`
      });
    }

    if (status === 'rejected' && !rejectionReason) {
      return res.status(400).json({ message: 'rejectionReason is required when status is rejected' });
    }

    commande.status = status;
    commande.customerMessage = STATUS_MESSAGES[status] || 'Mise a jour de votre commande.';

    // Auto-assign to least-loaded livreur when owner starts preparing
    if (status === 'preparing' && !commande.deliveryPerson) {
      const livreurs = await User.find({ role: 'livreur' }).select('_id');
      if (livreurs.length > 0) {
        const livreurIds = livreurs.map((l) => l._id);
        const activeStatuses = ['accepted', 'preparing', 'ready_for_delivery', 'out_for_delivery'];
        const loadRows = await Commande.aggregate([
          { $match: { deliveryPerson: { $in: livreurIds }, status: { $in: activeStatuses } } },
          { $group: { _id: '$deliveryPerson', count: { $sum: 1 } } }
        ]);
        const loadMap = new Map(loadRows.map((r) => [String(r._id), r.count]));
        let picked = livreurs[0];
        let best = Number.MAX_SAFE_INTEGER;
        livreurs.forEach((l) => {
          const c = loadMap.get(String(l._id)) || 0;
          if (c < best) {
            best = c;
            picked = l;
          }
        });
        commande.deliveryPerson = picked._id;
      }
    }

    if (status === 'rejected') {
      commande.rejectionReason = rejectionReason;
      commande.customerMessage = `Commande refusee: ${rejectionReason}`;
    } else if (status === 'preparing') {
      commande.customerMessage = commande.deliveryPerson
        ? 'Commande en preparation. Un livreur a ete assigne.'
        : STATUS_MESSAGES.preparing;
    }

    const updatedCommande = await commande.save();
    res.json(updatedCommande);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Livreur: get my assigned commandes
router.get('/livreur/my', protect, livreur, async (req, res) => {
  try {
    await ensureOrderNumbers();
    const commandes = await Commande.find({ deliveryPerson: req.user._id })
      .populate('restaurant', 'name address')
      .populate('user', 'name phone address')
      .populate('items.food', 'name image')
      .sort({ createdAt: -1 });
    res.json(commandes);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Livreur: update delivery status
router.patch('/:id/livreur-status', protect, livreur, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['out_for_delivery', 'delivered'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid delivery status' });
    }

    const commande = await Commande.findById(req.params.id);
    if (!commande) return res.status(404).json({ message: 'Commande not found' });
    if (!commande.deliveryPerson || commande.deliveryPerson.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized for this commande' });
    }

    if (status === 'out_for_delivery' && !['ready_for_delivery', 'out_for_delivery'].includes(commande.status)) {
      return res.status(400).json({ message: 'Commande must be ready before delivery.' });
    }
    if (status === 'delivered' && !['out_for_delivery', 'delivered'].includes(commande.status)) {
      return res.status(400).json({ message: 'Commande must be out for delivery first.' });
    }

    commande.status = status;
    commande.customerMessage = STATUS_MESSAGES[status] || commande.customerMessage;
    const updated = await commande.save();
    res.json(updated);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// User: add rating after delivery
router.patch('/:id/rating', protect, async (req, res) => {
  try {
    const { score, comment } = req.body;
    const commande = await Commande.findById(req.params.id);

    if (!commande) {
      return res.status(404).json({ message: 'Commande not found' });
    }

    if (commande.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized for this commande' });
    }

    if (commande.status !== 'delivered') {
      return res.status(400).json({ message: 'Rating is allowed only after delivery' });
    }

    if (!score || score < 1 || score > 5) {
      return res.status(400).json({ message: 'score must be between 1 and 5' });
    }

    if (commande.rating && commande.rating.score) {
      return res.status(400).json({ message: 'Rating already submitted for this commande' });
    }

    commande.rating = {
      score,
      comment: comment || '',
      ratedAt: new Date()
    };

    const updatedCommande = await commande.save();

    const deliveredWithRating = await Commande.find({
      restaurant: commande.restaurant,
      status: 'delivered',
      'rating.score': { $exists: true }
    }).select('rating.score');

    const ratingCount = deliveredWithRating.length;
    const ratingSum = deliveredWithRating.reduce((sum, cmd) => sum + cmd.rating.score, 0);
    const averageRating = ratingCount > 0 ? Number((ratingSum / ratingCount).toFixed(2)) : 0;

    await Restaurant.findByIdAndUpdate(commande.restaurant, {
      rating: averageRating,
      ratingCount
    });

    res.json(updatedCommande);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
