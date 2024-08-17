const mongoose = require('mongoose');

// Define a schema
const orderBookSchema = new mongoose.Schema({
    channel: String,
    data: {
      asks: [[Number]], // Array of arrays, each containing two numbers
      bids: [[Number]], // Array of arrays, each containing two numbers
      instrument_name: String,
      change_id: Number,
      timestamp: Number
    },
    receivedAt: { type: Date, default: Date.now } // To track when we received this update
  });

// Create a model
const OrderBook = mongoose.model('OrderBook',orderBookSchema);

module.exports = OrderBook;