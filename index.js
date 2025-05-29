require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// Allowed origins for CORS
const allowedOrigins = [
  'https://standerarabia.vercel.app',
  'http://localhost:3000',
];

// CORS middleware options
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow Postman or curl
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Use cors middleware globally first
app.use(cors(corsOptions));

// Parse JSON bodies
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Certificate schema/model
const certificateSchema = new mongoose.Schema({
  name: String,
  iqama: String,
  course: String,
  cardNo: { type: String, unique: true, index: true },
  issued: String,
  expiry: String,
}, { timestamps: true });

const Certificate = mongoose.model('Certificate', certificateSchema);

// Verify endpoint
app.post('/api/verify', async (req, res, next) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const certificate = await Certificate.findOne({ cardNo: query });

    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    res.status(200).json({ data: certificate });
  } catch (error) {
    console.error('Verification error:', error);
    next(error); // pass to error handler
  }
});

// Global error handler - **this is critical**
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);

  // Always send CORS headers here
  res.header('Access-Control-Allow-Origin', allowedOrigins.includes(req.headers.origin) ? req.headers.origin : '');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS error: origin not allowed' });
  }

  res.status(500).json({ error: 'Server error' });
});

module.exports = app;
