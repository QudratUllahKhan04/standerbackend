require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// CORS Configuration - single declaration
app.use(cors({
  origin: [
    'https://standerarabia.vercel.app/verification', // Your production frontend URL
    'http://localhost:3000'            // Your local development URL
  ],
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true // If you need to handle cookies/auth
}));

app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  retryWrites: true,       // Recommended for MongoDB Atlas
  w: 'majority'            // Write concern
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Certificate Schema
const certificateSchema = new mongoose.Schema({
  name: String,
  iqama: String,
  course: String,
  cardNo: { type: String, unique: true, index: true }, // Added index
  issued: String,
  expiry: String,
}, { timestamps: true }); // Added timestamps for tracking

const Certificate = mongoose.model('Certificate', certificateSchema);

// POST endpoint
app.post('/verify', async (req, res) => {
  const { query } = req.body;

  if (!query?.trim()) {
    return res.status(400).json({ error: 'Please enter a certificate number or ID.' });
  }

  try {
    const data = await Certificate.findOne({ 
      $or: [
        { cardNo: query.trim() },
        { iqama: query.trim() }
      ]
    }).lean(); // Using lean() for better performance
    
    if (!data) {
      return res.status(404).json({ error: 'No record found.' });
    }

    // Structured response
    res.json({ 
      success: true,
      data: {
        name: data.name,
        iqama: data.iqama,
        course: data.course,
        cardNo: data.cardNo,
        issued: data.issued,
        expiry: data.expiry
      }
    });

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = app;