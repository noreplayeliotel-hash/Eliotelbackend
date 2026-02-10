const express = require('express');
const stripeController = require('../controllers/stripeController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Toutes les routes de paiement nécessitent une authentification
router.use(auth);

router.post('/create-customer', stripeController.createCustomer);
router.post('/create-payment-intent', stripeController.createPaymentIntent);

module.exports = router;
