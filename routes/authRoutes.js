const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Cafe = require('../models/Cafe');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/authMiddleware');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Register User
router.post('/register/user', async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });
    const user = await User.create({ name, email, password, phone, address, role: 'user' });
    if (!user) {
      return res.status(400).json({ message: 'Invalid user data' });
    }

    const token = generateToken(user._id);
    res.status(201).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
      },
      token,
    });
  } catch (err) {
    console.error('Register user error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Register Owner
router.post('/register/owner', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      address,
      restaurantName,
      restaurantDescription,
      restaurantAddress,
      restaurantCuisineType,
      restaurantImage,
      restaurantLocation,
      restaurantGoogleMapsUrl,
      restaurantDelegation,
    } = req.body;

    if (!restaurantName || !restaurantAddress) {
      return res.status(400).json({
        message: 'restaurantName and restaurantAddress are required'
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({
      name: name || restaurantName,
      email,
      password,
      phone,
      address,
      role: 'owner'
    });
    if (!user) {
      return res.status(400).json({ message: 'Invalid user data' });
    }

    const restaurant = await Restaurant.create({
      owner: user._id,
      name: restaurantName,
      description: restaurantDescription,
      address: restaurantAddress,
      delegation: String(restaurantDelegation || '').trim(),
      cuisineType: restaurantCuisineType,
      image: restaurantImage,
      location: restaurantLocation,
      googleMapsUrl: restaurantGoogleMapsUrl
    });

    const token = generateToken(user._id);
    res.status(201).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
      },
      restaurant,
      foods: [],
      token,
    });
  } catch (err) {
    console.error('Register owner error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Register Cafe Owner
router.post('/register/cafe-owner', async (req, res) => {
  try {
    const {
      email,
      password,
      phone,
      cafeName,
      cafeAddress,
      cafeDescription,
      cafeMapsUrl,
      cafeImage,
      cafeServices,
      cafeHospitalityType,
      tableReservationPrice,
      cafeTableCount,
      cafeDelegation,
    } = req.body;
    if (!cafeName || !cafeAddress) {
      return res.status(400).json({ message: 'cafeName and cafeAddress are required' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({
      name: cafeName,
      email,
      password,
      phone,
      address: cafeAddress,
      role: 'cafe_owner'
    });

    const cafe = await Cafe.create({
      owner: user._id,
      name: cafeName,
      address: cafeAddress,
      delegation: String(cafeDelegation || '').trim(),
      description: cafeDescription,
      phone,
      googleMapsUrl: cafeMapsUrl || '',
      image: cafeImage || '',
      services: Array.isArray(cafeServices) ? cafeServices : [],
      hospitalityType: cafeHospitalityType || '',
      tableCount: Number(cafeTableCount || 0),
      reservationPrice: Number(tableReservationPrice || 0),
    });

    const token = generateToken(user._id);
    res.status(201).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
      },
      cafe,
      token,
    });
  } catch (err) {
    console.error('Register cafe owner error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Register Livreur
router.post('/register/livreur', async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({
      name,
      email,
      password,
      phone,
      address,
      role: 'livreur',
    });

    const token = generateToken(user._id);
    res.status(201).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
      },
      token,
    });
  } catch (err) {
    console.error('Register livreur error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const emailNorm = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    // Compat anciens comptes: email en DB parfois avec majuscules/espaces → recherche insensible à la casse
    const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let user = await User.findOne({ email: emailNorm });
    if (!user && emailNorm) {
      user = await User.findOne({ email: { $regex: `^${escapeRegex(emailNorm)}$`, $options: 'i' } });
    }

    const isBcrypt = (value) => typeof value === 'string' && value.startsWith('$2');

    let ok = false;
    if (user) {
      if (isBcrypt(user.password)) {
        ok = await user.matchPassword(password);
      } else {
        // Compat: ancien compte enregistré en clair → on accepte une fois puis on re-hash
        ok = user.password === password;
        if (ok) {
          user.password = password;
          await user.save(); // pre('save') hash
        }
      }
    }

    if (user && ok) {
      const token = generateToken(user._id);
      res.json({
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          address: user.address,
        },
        token,
      });
    } else {
      res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get Profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.json({
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          address: user.address,
        },
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Update Profile
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const name = req.body.name !== undefined ? String(req.body.name || '').trim() : user.name;
    const email = req.body.email !== undefined ? String(req.body.email || '').trim().toLowerCase() : user.email;
    const phone = req.body.phone !== undefined ? String(req.body.phone || '').trim() : user.phone;
    const address = req.body.address !== undefined ? String(req.body.address || '').trim() : user.address;

    if (!name) {
      return res.status(400).json({ message: 'Le nom est requis.' });
    }
    if (!email) {
      return res.status(400).json({ message: "L'email est requis." });
    }

    if (email !== user.email) {
      const exists = await User.findOne({ email, _id: { $ne: user._id } });
      if (exists) {
        return res.status(400).json({ message: 'Email déjà utilisé.' });
      }
    }

    user.name = name;
    user.email = email;
    user.phone = phone;
    user.address = address;
    await user.save();

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
