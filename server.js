const express = require('express');
const path = require('path');
const createOrder = require('./api/create-order');
const verifyPayment = require('./api/verify-payment');
const placeCodOrder = require('./api/place-cod-order');
const contact = require('./api/contact');

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

app.options('/api/create-order', apiRoute(createOrder));
app.options('/api/verify-payment', apiRoute(verifyPayment));
app.options('/api/place-cod-order', apiRoute(placeCodOrder));
app.options('/api/contact', apiRoute(contact));

app.listen(PORT, () => {
  console.log(`Fomino server running on port ${PORT}`);
});
