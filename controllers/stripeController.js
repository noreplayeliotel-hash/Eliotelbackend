const stripeService = require('../services/stripeService');

class StripeController {
    /**
     * Créer un client Stripe
     */
    async createCustomer(req, res, next) {
        try {
            const { email, name } = req.body;
            if (!email || !name) {
                return res.status(400).json({
                    success: false,
                    message: 'Email et nom requis'
                });
            }

            const customerId = await stripeService.createCustomer(email, name);
            res.status(200).json({
                success: true,
                customerId
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Créer une intention de paiement
     */
    async createPaymentIntent(req, res, next) {
        try {
            const { amount, currency, customerId } = req.body;
            if (!amount || !currency || !customerId) {
                return res.status(400).json({
                    success: false,
                    message: 'Montant, devise et ID client requis'
                });
            }

            const result = await stripeService.createPaymentIntent(amount, currency, customerId);
            res.status(200).json({
                success: true,
                ...result
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new StripeController();
