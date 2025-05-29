const express = require('express');
const cors = require('cors');
const connectDB = require('../middlewares/db');
const Certificate = require('../models/Certificate');

const app = express();

// Middlewares
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies

// Database connection
connectDB();

// GET certificate by cardNo
app.get('/:cardNo', async (req, res) => {
  const { cardNo } = req.params;

  // Validate input
  if (!cardNo || cardNo.trim() === '') {
    return res.status(400).json({ 
      success: false,
      error: 'Please provide a valid card number' 
    });
  }

  try {
    const data = await Certificate.findOne({ cardNo: cardNo.trim() });
    
    if (!data) {
      return res.status(404).json({ 
        success: false, 
        error: 'Certificate not found' 
      });
    }

    // Return successful response
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
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

module.exports = app;