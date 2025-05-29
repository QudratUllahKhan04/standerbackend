const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  name: String,
  iqama: String,
  course: String,
  cardNo: { type: String, unique: true },
  issued: String,
  expiry: String,
});

module.exports = mongoose.model('Certificate', certificateSchema);