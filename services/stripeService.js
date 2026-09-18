const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class StripeService {
    /**
     * Créer ou récupérer un client Stripe
     */
    async createCustomer(email, name) {
        try {
            // Rechercher si le client existe déjà
            const customers = await stripe.customers.list({
                email: email,
                limit: 1
            });

            if (customers.data.length > 0) {
                return customers.data[0].id;
            }

            // Sinon créer un nouveau client
            const customer = await stripe.customers.create({
                email: email,
                name: name,
            });

            return customer.id;
        } catch (error) {
            console.error('Erreur Stripe Customer:', error);
            throw new Error(`Erreur lors de la gestion du client Stripe: ${error.message}`);
        }
    }

    /**
     * Créer un PaymentIntent
     */
    async createPaymentIntent(amount, currency, customerId) {
        try {
            // Créer l'intention de paiement
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: currency,
                customer: customerId,
                payment_method_types: ['card'],
            });

            return {
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id
            };
        } catch (error) {
            console.error('Erreur Stripe PaymentIntent:', error);
            throw new Error(`Erreur lors de la création de l'intention de paiement: ${error.message}`);
        }
    }
}

module.exports = new StripeService();
