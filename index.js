require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Enhanced CORS configuration
const allowedOrigins = [
  'https://stendararabia.vercel.app',
  'http://localhost:3000',
  'https://standerbackend-woad.vercel.app'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || 
        origin.includes('vercel.app') || 
        origin.includes('localhost')) {
      return callback(null, true);
    }
    
    const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
    return callback(new Error(msg), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

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

    const certificate = await Certificate.findOne({ 
      $or: [
        { cardNo: query },
        { iqama: query }
      ]
    });

    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    return res.status(200).json({ 
      data: {
        name: certificate.name,
        iqama: certificate.iqama,
        course: certificate.course,
        cardNo: certificate.cardNo,
        issued: certificate.issued,
        expiry: certificate.expiry
      }
    });
  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

module.exports = app;
