const WebSocket = require('ws');

async function subscribeOrderBook(instrumentName, duration = 60000) { // duration in milliseconds, default 1 minute
    return new Promise((resolve, reject) => {
        const updates = [];
        const ws = new WebSocket('wss://test.deribit.com/ws/api/v2');

        const msg = {
            "jsonrpc": "2.0",
            "method": "public/subscribe",
            "id": 42,
            "params": {
                "channels": [`book.${instrumentName}.none.10.100ms`]
            }
        };

        let timer;

        ws.on('open', function open() {
            console.log('Connected to Deribit API');
            ws.send(JSON.stringify(msg));

            // Set a timer to close the connection after the specified duration
            timer = setTimeout(() => {
                unsubscribe(ws, instrumentName);
                resolve(updates);
            }, duration);
        });

        ws.on('message', function incoming(data) {
            const response = JSON.parse(data);
            
            if (response.method === 'subscription') {
                updates.push(response.params);
                console.log(`Received update ${updates.length}`);
            }
        });

        ws.on('error', function error(err) {
            console.error('WebSocket error:', err);
            clearTimeout(timer);
            reject(err);
        });

        ws.on('close', function close() {
            console.log('Disconnected from Deribit API');
            clearTimeout(timer);
            resolve(updates);
        });
    });
}

function unsubscribe(ws, instrumentName) {
    const unsubscribeMsg = {
        "jsonrpc": "2.0",
        "method": "public/unsubscribe",
        "id": 43,
        "params": {
            "channels": [`book.${instrumentName}.none.10.100ms`]
        }
    };
    ws.send(JSON.stringify(unsubscribeMsg));
    console.log("Unsubscribed from the channel.");
    ws.close();
}

async function getOrderBookData(instrument = "BTC-PERPETUAL", duration = 60000) {
    try {
        console.log(`Starting data collection for ${duration / 1000} seconds...`);
        const updates = await subscribeOrderBook(instrument, duration);
        return {
            instrument: instrument,
            duration_ms: duration,
            number_of_updates: updates.length,
            updates: updates
        };
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

// Usage
(async () => {
    const orderBookData = await getOrderBookData("BTC-PERPETUAL", 30000); // Collect data for 5 minutes
    console.log('Order book data received:', orderBookData.number_of_updates, 'updates over', orderBookData.duration_ms / 1000, 'seconds');
    // You can now use orderBookData in your code
})();

module.exports = getOrderBookData;