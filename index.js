require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

const allowedOrigins = [
  'https://standerarabia.vercel.app',
  'http://localhost:3000'
];

// CORS config
const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (like Postman or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Schema + Model
const certificateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  iqama: { type: String, required: true },
  course: { type: String, required: true },
  cardNo: { type: String, unique: true, index: true },
  issued: { type: String, required: true },
  expiry: { type: String, required: true }
}, { timestamps: true });

const Certificate = mongoose.model('Certificate', certificateSchema);

// Verification endpoint
app.post('/api/verify', async (req, res) => {
  try {
    const { query } = req.body;
    console.log('Verification query:', query);

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const cert = await Certificate.findOne({ cardNo: query });

    if (!cert) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    res.status(200).json({ data: cert });
  } catch (err) {
    console.error('Server error in /api/verify:', err.stack || err);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Server listening on port ${port}`);
});
