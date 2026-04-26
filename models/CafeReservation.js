const mongoose = require('mongoose');

const cafeReservationSchema = new mongoose.Schema(
  {
    cafe: { type: mongoose.Schema.Types.ObjectId, ref: 'Cafe', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderNumber: { type: Number, unique: true, sparse: true, index: true },
    peopleCount: { type: Number, required: true, min: 1 },
    reservationDate: { type: String, required: true }, // YYYY-MM-DD
    reservationTime: { type: String, required: true }, // HH:mm
    occasionType: { type: String, default: 'normal' }, // romantic | birthday | party | business | normal
    note: { type: String, default: '' },
    tablePrice: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
      default: 'pending',
    },
    /** Numéro de table (1..N) pour la date de réservation, attribué à l’acceptation */
    assignedTableNumber: { type: Number, min: 1, default: null },
    ownerMessage: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CafeReservation', cafeReservationSchema);

