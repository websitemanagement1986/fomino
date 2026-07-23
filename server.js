const express = require('express');
const path = require('path');
const createOrder = require('./api/create-order');
const verifyPayment = require('./api/verify-payment');
const placeCodOrder = require('./api/place-cod-order');
const contact = require('./api/contact');
const paymateCreateOrder = require('./api/paymate/create-order');
const paymateCallback = require('./api/paymate/callback');
const paymateStatus = require('./api/paymate/status');
const paymateDebugIp = require('./api/paymate/debug-ip');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

function apiRoute(handler) {
  return (req, res) => handler(req, res);
}

app.post('/api/create-order', apiRoute(createOrder));
app.post('/api/verify-payment', apiRoute(verifyPayment));
app.post('/api/place-cod-order', apiRoute(placeCodOrder));
app.post('/api/contact', apiRoute(contact));
app.post('/api/paymate/create-order', apiRoute(paymateCreateOrder));
app.post('/api/paymate/callback', apiRoute(paymateCallback));
app.get('/api/paymate/debug-ip', apiRoute(paymateDebugIp));
app.options('/api/paymate/debug-ip', apiRoute(paymateDebugIp));
app.post('/api/paymate/status', apiRoute(paymateStatus));

app.options('/api/create-order', apiRoute(createOrder));
app.options('/api/verify-payment', apiRoute(verifyPayment));
app.options('/api/place-cod-order', apiRoute(placeCodOrder));
app.options('/api/contact', apiRoute(contact));
app.options('/api/paymate/create-order', apiRoute(paymateCreateOrder));
app.options('/api/paymate/callback', apiRoute(paymateCallback));
app.options('/api/paymate/status', apiRoute(paymateStatus));

app.listen(PORT, () => {
  console.log(`Fomino server running on port ${PORT}`);
});
