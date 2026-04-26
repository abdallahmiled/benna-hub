const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const Cafe = require('../models/Cafe');
const Commande = require('../models/Commande');
const { GABES_DELEGATION_SLUGS } = require('../constants/gabesDelegations');

/** Stats publiques pour la bannière d’accueil (comptes réels + avis + nombre de معتمديات Gabès). */
router.get('/home', async (req, res) => {
  try {
    const [restaurantCount, cafeCount, reviewCount] = await Promise.all([
      Restaurant.countDocuments(),
      Cafe.countDocuments(),
      Commande.countDocuments({
        status: 'delivered',
        'rating.score': { $gte: 1, $lte: 5 },
      }),
    ]);

    res.json({
      restaurantCount,
      cafeCount,
      reviewCount,
      /** Nombre de délégations de la liste officielle Gabès (pas le nombre d’établissements renseignés). */
      delegationCount: GABES_DELEGATION_SLUGS.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
