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

// CORS options
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow Postman, curl, etc.
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

// Apply CORS middleware BEFORE all routes
app.use(cors(corsOptions));

// Parse JSON bodies
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Certificate schema and model
const certificateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  iqama: { type: String, required: true },
  course: { type: String, required: true },
  cardNo: { type: String, unique: true, index: true },
  issued: { type: String, required: true },
  expiry: { type: String, required: true },
}, { timestamps: true });

const Certificate = mongoose.model('Certificate', certificateSchema);

// Verification endpoint
app.post('/api/verify', async (req, res) => {
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
    res.status(500).json({ error: 'Server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// CORS error handler middleware (optional for debugging)
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    console.warn('Blocked by CORS:', req.headers.origin);
    return res.status(403).json({ error: 'CORS error: origin not allowed' });
  }
  next(err);
});

module.exports = app;
