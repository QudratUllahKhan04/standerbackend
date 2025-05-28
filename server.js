const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Define certificate schema
const certificateSchema = new mongoose.Schema({
  name: String,
  iqama: String,
  course: String,
  cardNo: { type: String, unique: true },
  issued: String,
  expiry: String,
});

const Certificate = mongoose.model('Certificate', certificateSchema);

// POST: Verify certificate by cardNo in body
app.post('/verify', async (req, res) => {
  const { query } = req.body;

  if (!query || query.trim() === '') {
    return res.status(400).json({ error: 'Please enter a certificate number or ID.' });
  }

  try {
    const data = await Certificate.findOne({ cardNo: query.trim() });
    if (data) {
      res.json({ data });
    } else {
      res.status(404).json({ error: 'No record found.' });
    }
  } catch (error) {
    console.error('Error during verification:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET: Retrieve certificate by cardNo in URL param
app.get('/certificate/:cardNo', async (req, res) => {
  const { cardNo } = req.params;

  try {
    const data = await Certificate.findOne({ cardNo });
    if (data) {
      res.json({ data });
    } else {
      res.status(404).json({ error: 'Certificate not found.' });
    }
  } catch (error) {
    console.error('Error during retrieval:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// DELETE: Remove certificate by cardNo
app.delete('/delete/:cardNo', async (req, res) => {
  const { cardNo } = req.params;

  try {
    const result = await Certificate.deleteOne({ cardNo });
    if (result.deletedCount > 0) {
      res.json({ message: `Deleted certificate with cardNo: ${cardNo}` });
    } else {
      res.status(404).json({ error: 'Certificate not found.' });
    }
  } catch (error) {
    console.error('Error during deletion:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
