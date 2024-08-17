const express = require('express');
const mongoose = require('mongoose');
const OrderBook = require('./models/orderBook.js');
const cors = require('cors');
// const { filteredTrades, tradersList } = require('./utils/filteredTrades.js');


/**
 * Express application instance.
 *
 * @type {import('express').Express}
 */
const app = express(); 

// This line is required to parse the request body in POST/PUT requests 
app.use(express.json());

// Enable CORS for all routes
app.use(cors());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/OrderBook');
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('We are connected to the database!');
});

// Import and activate the routes
const OrderBookRoute = require('./routes/OrderBookRoutes.js');
app.use(OrderBookRoute);

// Define a catch all route to handle requests to undefined routes
app.all('*', (req, res) => {
    res.status(404).send('Page not found');
});

// Start the server and listen for incoming requests on port 3000
app.listen(process.env.PORT || 3000, () => {
    console.log('Server started');
});
