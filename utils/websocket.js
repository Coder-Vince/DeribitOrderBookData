const WebSocket = require('ws');

async function subscribeOrderBook(instrumentName, duration = 60000, callback) {
    return new Promise((resolve, reject) => {
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

            timer = setTimeout(() => {
                unsubscribe(ws, instrumentName);
                resolve();
            }, duration);
        });

        ws.on('message', function incoming(data) {
            const response = JSON.parse(data);
            
            if (response.method === 'subscription') {
                callback(response.params);
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
            resolve();
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

async function getOrderBookData(instrument = "BTC-PERPETUAL", duration = 60000, callback) {
    try {
        console.log(`Starting data collection for ${duration / 1000} seconds...`);
        await subscribeOrderBook(instrument, duration, callback);
        console.log("Data collection completed.");
    } catch (error) {
        console.error('Error:', error);
    }
}

module.exports = { getOrderBookData };