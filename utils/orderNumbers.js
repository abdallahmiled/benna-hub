const Commande = require('../models/Commande');
const Counter = require('../models/Counter');

let running = false;

const ensureOrderNumbers = async () => {
  if (running) return;
  running = true;
  try {
    const missing = await Commande.find({
      $or: [{ orderNumber: { $exists: false } }, { orderNumber: null }],
    })
      .sort({ createdAt: 1, _id: 1 })
      .select('_id');

    if (!missing.length) return;

    const counter = await Counter.findByIdAndUpdate(
      'commande',
      { $inc: { seq: missing.length } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    let n = (counter?.seq || 0) - missing.length;
    const ops = missing.map((doc) => {
      n += 1;
      return {
        updateOne: {
          filter: { _id: doc._id, $or: [{ orderNumber: { $exists: false } }, { orderNumber: null }] },
          update: { $set: { orderNumber: n } },
        },
      };
    });

    if (ops.length) {
      await Commande.bulkWrite(ops, { ordered: true });
    }
  } finally {
    running = false;
  }
};

module.exports = { ensureOrderNumbers };

