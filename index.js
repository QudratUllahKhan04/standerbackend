require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Allowed origins for CORS
const allowedOrigins = [
  'https://stendararabia.vercel.app', // ✅ frontend
  'http://localhost:3000',
];


// CORS middleware options
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) {
      // Allow requests like curl/Postman with no origin
      return callback(null, true);
    }
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Use CORS middleware globally (handles OPTIONS automatically)
app.use(cors(corsOptions));

// Parse JSON bodies
app.use(express.json());

// Connect to MongoDB
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
  name: String,
  iqama: String,
  course: String,
  cardNo: { type: String, unique: true, index: true },
  issued: String,
  expiry: String,
}, { timestamps: true });

const Certificate = mongoose.model('Certificate', certificateSchema);

// POST /api/verify endpoint
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

    return res.status(200).json({ data: certificate });
  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Optional: test API root
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Global error handler (catches CORS and other errors)
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS error: origin not allowed' });
  }

  return res.status(500).json({ error: 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

module.exports = app;
