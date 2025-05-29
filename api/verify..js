require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Certificate Schema
const certificateSchema = new mongoose.Schema({
  name: String,
  iqama: String,
  course: String,
  cardNo: { type: String, unique: true },
  issued: String,
  expiry: String,
});

const Certificate = mongoose.model('Certificate', certificateSchema);

// POST endpoint matching your frontend
app.post('/verify', async (req, res) => {
  const { query } = req.body;

  if (!query || query.trim() === '') {
    return res.status(400).json({ error: 'Please enter a certificate number or ID.' });
  }

  try {
    const data = await Certificate.findOne({ 
      $or: [
        { cardNo: query.trim() },
        { iqama: query.trim() }
      ]
    });
    
    if (data) {
      res.json({ 
        data: {
          name: data.name,
          iqama: data.iqama,
          course: data.course,
          cardNo: data.cardNo,
          issued: data.issued,
          expiry: data.expiry
        }
      });
    } else {
      res.status(404).json({ error: 'No record found.' });
    }
  } catch (error) {
    console.error('Error during verification:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = app;