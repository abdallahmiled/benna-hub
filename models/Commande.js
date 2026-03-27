const mongoose = require('mongoose');

const commandeSchema = new mongoose.Schema({
  orderNumber: { type: Number, unique: true, sparse: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  items: [{
    food: { type: mongoose.Schema.Types.ObjectId, ref: 'Food', required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    note: { type: String, default: '' }
  }],
  itemsTotal: { type: Number, required: true, default: 0 },
  deliveryFee: { type: Number, required: true, default: 5 },
  totalAmount: { type: Number, required: true },
  deliveryPerson: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: [
      'pending',
      'accepted',
      'rejected',
      'preparing',
      'ready_for_delivery',
      'out_for_delivery',
      'delivered',
      'cancelled'
    ],
    default: 'pending'
  },
  deliveryAddress: { type: String, required: true },
  customerMessage: { type: String },
  rejectionReason: { type: String },
  rating: {
    score: { type: Number, min: 1, max: 5 },
    comment: { type: String, default: '' },
    ratedAt: { type: Date }
  }
}, { timestamps: true });

module.exports = mongoose.model('Commande', commandeSchema);
