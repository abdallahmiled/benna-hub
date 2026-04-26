const mongoose = require('mongoose');

const cafeSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    description: { type: String },
    phone: { type: String },
    address: { type: String, required: true },
    delegation: { type: String, default: '' },
    googleMapsUrl: { type: String },
    image: { type: String },
    services: [{ type: String }],
    hospitalityType: { type: String },
    tableCount: { type: Number, default: 0 },
    /** Nombre de tables « ordinaires » ; le reste (tableCount − ce nombre) = tables familiales. null = non défini (tout considéré ordinaire côté affichage). */
    ordinaryTableCount: { type: Number, default: null },
    reservationPrice: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    isOpen: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Cafe', cafeSchema);

