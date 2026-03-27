require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (no Origin header) and local frontend on any localhost port.
    if (!origin || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/restaurants', require('./routes/restaurantRoutes'));
app.use('/api/cafes', require('./routes/cafeRoutes'));
app.use('/api/cafe-reservations', require('./routes/cafeReservationRoutes'));
app.use('/api/cafe-products', require('./routes/cafeProductRoutes'));
app.use('/api/foods', require('./routes/foodRoutes'));
app.use('/api/commandes', require('./routes/commandeRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));

// Root
app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
