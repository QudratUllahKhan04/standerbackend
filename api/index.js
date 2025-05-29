// /api/index.js
const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const router = express.Router();

const Certificate = mongoose.model('Certificate', new mongoose.Schema({
  name: String,
  iqama: String,
  course: String,
  cardNo: { type: String, unique: true },
  issued: String,
  expiry: String,
}));

router.post('/verify', async (req, res) => {
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

app.use('/api', router);

module.exports = app;
module.exports.handler = serverless(app);
