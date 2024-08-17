const express = require("express");
const router = express.Router();
const mongoose = require('mongoose');
const OrderBook = require('../models/orderBook.js');
const { getOrderBookData } = require("../utils/websocket");

// Fetch the data from the DB, request can state the instrument (for now only BTC-PERPETUAL) 
//but also start time end time and a limit on the number returned

router.get("/orderbook", async (req, res) => {
    try {
        const { instrument, limit = 100, startTime, endTime } = req.query;

        let query = {};

        // Filter by instrument if provided
        if (instrument) {
            query["data.instrument_name"] = instrument;
        }

        // Filter by time range if provided
        if (startTime || endTime) {
            query["data.timestamp"] = {};
            if (startTime) query["data.timestamp"].$gte = parseInt(startTime);
            if (endTime) query["data.timestamp"].$lte = parseInt(endTime);
        }

        // Fetch the data from MongoDB
        const orderBooks = await OrderBook.find(query)
            .sort({ "data.timestamp": -1 }) // Sort by timestamp, newest first
            .limit(parseInt(limit));

        // Prepare the response
        const response = {
            count: orderBooks.length,
            data: orderBooks.map(book => ({
                channel: book.channel,
                timestamp: book.data.timestamp,
                instrument_name: book.data.instrument_name,
                asks: book.data.asks,
                bids: book.data.bids,
                change_id: book.data.change_id
            }))
        };

        res.status(200).json(response);
    } catch (error) {
        console.error("Error retrieving order book data:", error);
        res.status(500).json({ message: "Error retrieving order book data" });
    }
});

// Fetch the data from Deribit using Websocket connexion and saves it in the DB
// The message sent by Postman should under this format: 
// {
//   "instrument": "BTC-PERPETUAL",
//   "duration": 60000
// }

router.post("/obinthedb", async (req, res) => {
    try {
        const { instrument, duration } = req.body;
        
        if (!instrument || !duration) {
            return res.status(400).json({ message: "Instrument and duration are required" });
        }

        let updateCount = 0;
        const startTime = Date.now();

        // Start the data collection process
        getOrderBookData(instrument, duration, async (data) => {
            try {
                const newOrderBook = new OrderBook({
                    channel: data.channel,
                    data: data.data
                });
                await newOrderBook.save();
                updateCount++;
                console.log(`Saved update ${updateCount}`);
            } catch (error) {
                console.error("Error saving individual update:", error);
            }
        });

        // Send an immediate response
        res.status(202).json({ message: "Data collection started" });

        // Wait for the data collection to complete
        await new Promise(resolve => setTimeout(resolve, duration));

        console.log(`Data collection completed. Saved ${updateCount} updates over ${duration / 1000} seconds.`);
    } catch (error) {
        console.error("Error in data collection process:", error);
        // Note: We can't send an error response here as the response has already been sent
    }
});

module.exports = router;