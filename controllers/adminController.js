const Admin = require('../models/Admin');
const User = require('../models/User');
const Listing = require('../models/Listing');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Report = require('../models/Report');
const jwt = require('jsonwebtoken');
const emailService = require('../services/emailService');
const notificationService = require('../services/notificationService');
const mongoose = require('mongoose');

class AdminController {
    constructor() {
        // Lier les méthodes au contexte de l'instance
        this.generateKonnectPaymentLink = this.generateKonnectPaymentLink.bind(this);
        this.createBooking = this.createBooking.bind(this);
    }

    // Vérifier s'il existe au moins un admin
    async checkAdminExists(req, res, next) {
        try {
            const count = await Admin.countDocuments();
            res.status(200).json({
                success: true,
                exists: count > 0
            });
        } catch (error) {
            next(error);
        }
    }

    // Inscription du premier admin
    async registerFirstAdmin(req, res, next) {
        try {
            const count = await Admin.countDocuments();
            if (count > 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Un administrateur existe déjà. Veuillez vous connecter.'
                });
            }

            const { email, password, firstName, lastName } = req.body;
            const admin = new Admin({ email, password, firstName, lastName });
            await admin.save();

            const token = jwt.sign({ userId: admin._id, role: 'admin' }, process.env.JWT_SECRET || 'your-secret-key');

            res.status(201).json({
                success: true,
                message: 'Premier administrateur créé avec succès',
                data: { admin, token }
            });
        } catch (error) {
            next(error);
        }
    }

    // Connexion Admin
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const admin = await Admin.findOne({ email });

            if (!admin || !(await admin.comparePassword(password))) {
                return res.status(401).json({
                    success: false,
                    message: 'Email ou mot de passe incorrect'
                });
            }

            const token = jwt.sign({ userId: admin._id, role: 'admin' }, process.env.JWT_SECRET || 'your-secret-key');

            res.status(200).json({
                success: true,
                message: 'Connexion réussie',
                data: { admin, token }
            });
        } catch (error) {
            next(error);
        }
    }
    // Obtenir les statistiques globales du dashboard
    async getDashboardStats(req, res, next) {
        try {
            const totalUsers = await User.countDocuments();
            const totalListings = await Listing.countDocuments();
            const totalBookings = await Booking.countDocuments();

            // Revenus totaux (confirmés)
            const confirmedBookings = await Booking.find({ status: 'confirmed' });
            const totalRevenue = confirmedBookings.reduce((sum, booking) => sum + (booking.pricing.total || 0), 0);

            // Listings par statut
            const activeListings = await Listing.countDocuments({ status: 'active' });
            const pendingListings = await Listing.countDocuments({ status: 'draft' });

            // Réservations récentes (les 5 dernières)
            const recentBookings = await Booking.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('guest', 'firstName lastName email avatar')
                .populate('listing', 'title images');

            res.status(200).json({
                success: true,
                data: {
                    overview: {
                        totalUsers,
                        totalListings,
                        totalBookings,
                        totalRevenue
                    },
                    listings: {
                        active: activeListings,
                        pending: pendingListings
                    },
                    recentBookings
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Obtenir tous les utilisateurs avec pagination et filtres
    async getAllUsers(req, res, next) {
        try {
            const { status, role, search, page = 1, limit = 100 } = req.query;
            const query = {};

            if (status) query.status = status;
            if (role) query.role = role;
            if (search) {
                query.$or = [
                    { firstName: { $regex: search, $options: 'i' } },
                    { lastName: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ];
            }

            const users = await User.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(Number(limit));

            const total = await User.countDocuments(query);

            res.status(200).json({
                success: true,
                data: {
                    users,
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Obtenir uniquement les hôtes qui ont au moins une annonce
    async getActiveHosts(req, res, next) {
        try {
            const hostIds = await Listing.distinct('host');
            const hosts = await User.find({ _id: { $in: hostIds } })
                .select('firstName lastName email avatar');

            res.status(200).json({
                success: true,
                data: hosts
            });
        } catch (error) {
            next(error);
        }
    }

    // Obtenir uniquement les voyageurs qui ont fait au moins une réservation
    async getActiveGuests(req, res, next) {
        try {
            const guestIds = await Booking.distinct('guest');
            const guests = await User.find({ _id: { $in: guestIds } })
                .select('firstName lastName email avatar');

            res.status(200).json({
                success: true,
                data: guests
            });
        } catch (error) {
            next(error);
        }
    }

    // Obtenir tous les listings
    async getAllListings(req, res, next) {
        try {
            const { status, search, host, page = 1, limit = 10 } = req.query;
            const query = {};

            if (status) query.status = status;
            if (host) query.host = host;
            if (search) {
                query.$or = [
                    { title: { $regex: search, $options: 'i' } },
                    { 'address.city': { $regex: search, $options: 'i' } }
                ];
            }

            const listings = await Listing.find(query)
                .populate('host', 'firstName lastName email phone')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(Number(limit));

            const total = await Listing.countDocuments(query);

            res.status(200).json({
                success: true,
                data: {
                    listings,
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Créer un nouvel utilisateur (Admin)
    async createUser(req, res, next) {
        try {
            const { email, firstName, lastName, phone, password, role = 'guest' } = req.body;

            // Vérifier si l'utilisateur existe déjà
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Un utilisateur avec cet email existe déjà'
                });
            }

            // Créer le nouvel utilisateur
            const user = new User({
                email,
                firstName,
                lastName,
                phone,
                password,
                role,
                isVerified: true, // Auto-vérifié par l'admin
                status: 'active'
            });

            await user.save();

            res.status(201).json({
                success: true,
                message: 'Utilisateur créé avec succès',
                data: user
            });
        } catch (error) {
            next(error);
        }
    }

    // Mettre à jour le statut d'un utilisateur (ex: suspension)
    async updateUserStatus(req, res, next) {
        try {
            const { userId } = req.params;
            const { status } = req.body;

            if (!['active', 'inactive', 'suspended'].includes(status)) {
                return res.status(400).json({ success: false, message: 'Statut invalide' });
            }

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
            }

            user.status = status;
            await user.save();

            res.status(200).json({
                success: true,
                message: 'Statut de l\'utilisateur mis à jour',
                data: user
            });
        } catch (error) {
            next(error);
        }
    }

    // Mettre à jour une annonce (externalBlocks, seasonalPricing, etc.)
    async updateListing(req, res, next) {
        try {
            const { listingId } = req.params;
            const { externalBlocks, seasonalPricing } = req.body;

            const listing = await Listing.findById(listingId).populate('host', 'firstName lastName email phone');
            if (!listing) {
                return res.status(404).json({ success: false, message: 'Annonce non trouvée' });
            }

            if (externalBlocks !== undefined) listing.externalBlocks = externalBlocks;
            if (seasonalPricing !== undefined) listing.pricing.seasonalPricing = seasonalPricing;

            await listing.save();

            res.status(200).json({ success: true, message: 'Annonce mise à jour', data: listing });
        } catch (error) {
            console.error('Error updating listing:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // Modérer un listing
    async updateListingStatus(req, res, next) {
        try {
            const { listingId } = req.params;
            const { status } = req.body;

            if (!['draft', 'active', 'inactive', 'suspended', 'pending', 'rejected', 'archived'].includes(status)) {
                return res.status(400).json({ success: false, message: 'Statut invalide' });
            }

            const listing = await Listing.findById(listingId).populate('host', 'firstName lastName avatar email phone');

            if (!listing) {
                return res.status(404).json({ success: false, message: 'Annonce non trouvée' });
            }

            listing.status = status;
            await listing.save();

            res.status(200).json({
                success: true,
                message: `Statut de l'annonce mis à jour : ${status}`,
                data: listing
            });
        } catch (error) {
            console.error('Error updating listing status:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // Obtenir toutes les réservations
    async getAllBookings(req, res, next) {
        try {
            const { status, search, startDate, endDate, guest, host, page = 1, limit = 10 } = req.query;
            const query = {};

            if (status) query.status = status;

            // Filtre voyageur (recherche par nom/email si pas ID)
            if (guest) {
                if (mongoose.Types.ObjectId.isValid(guest)) {
                    query.guest = guest;
                } else {
                    const users = await User.find({
                        $or: [
                            { firstName: new RegExp(guest, 'i') },
                            { lastName: new RegExp(guest, 'i') },
                            { email: new RegExp(guest, 'i') }
                        ]
                    });
                    query.guest = { $in: users.map(u => u._id) };
                }
            }

            // Filtre hôte (recherche par nom/email si pas ID)
            if (host) {
                if (mongoose.Types.ObjectId.isValid(host)) {
                    query.host = host;
                } else {
                    const users = await User.find({
                        $or: [
                            { firstName: new RegExp(host, 'i') },
                            { lastName: new RegExp(host, 'i') },
                            { email: new RegExp(host, 'i') }
                        ]
                    });
                    query.host = { $in: users.map(u => u._id) };
                }
            }

            // Filtre par date
            if (startDate || endDate) {
                query.checkIn = {};
                if (startDate) query.checkIn.$gte = new Date(startDate);
                if (endDate) query.checkIn.$lte = new Date(endDate);
            }

            const bookings = await Booking.find(query)
                .populate('guest', 'firstName lastName email phone')
                .populate('host', 'firstName lastName email phone')
                .populate('listing', 'title images address')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(Number(limit));

            const total = await Booking.countDocuments(query);

            res.status(200).json({
                success: true,
                data: {
                    bookings,
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Créer une nouvelle réservation (Admin)
    async createBooking(req, res, next) {
        try {
            const { listing, guest, checkIn, checkOut, guests, pricing, paymentMethod = 'cash' } = req.body;

            console.log('🔍 Données reçues pour création réservation:');
            console.log('- listing:', listing);
            console.log('- guest:', guest);
            console.log('- paymentMethod:', paymentMethod);
            console.log('- req.body complet:', JSON.stringify(req.body, null, 2));

            // Utiliser le service de réservation au lieu de créer directement
            const bookingService = require('../services/bookingService');

            // Préparer les données pour le service
            const bookingData = {
                listingId: listing,
                checkIn,
                checkOut,
                guests,
                specialRequests: req.body.specialRequests || '',
                guestMessage: req.body.guestMessage || '',
                paymentStatus: paymentMethod === 'cash' ? 'paid' : 'pending',
                paymentDetails: {},
                paymentMethod: paymentMethod
            };

            console.log('📦 Données préparées pour le service:', JSON.stringify(bookingData, null, 2));

            // Créer la réservation via le service (admin bypass les blocs externes et la disponibilité)
            const booking = await bookingService.createBooking(bookingData, guest, {
                skipExternalBlockCheck: true,
                skipAvailabilityCheck: true
            });

            console.log('✅ Réservation créée via service avec ID:', booking._id);
            console.log('- paymentMethod final:', booking.paymentMethod);
            console.log('- status final:', booking.status);
            console.log('- paymentStatus final:', booking.paymentStatus);

            // Gestion selon la méthode de paiement (avec gestion d'erreur)
            try {
                if (paymentMethod === 'konnect') {
                    // Générer le lien de paiement Konnect
                    const paymentLink = await this.generateKonnectPaymentLink(booking);

                    // Enregistrer le lien de paiement dans la réservation
                    booking.paymentLink = paymentLink;
                    await booking.save();

                    // Envoyer l'email avec le lien de paiement (async, ne bloque pas)
                    emailService.sendPaymentLinkEmail(booking.guest, booking, paymentLink).catch(err => {
                        console.error('Erreur envoi email Konnect:', err.message);
                    });

                    // Envoyer une notification push (async, ne bloque pas)
                    notificationService.sendNotificationToUser(
                        booking.guest._id,
                        '💳 Paiement requis',
                        `Votre réservation pour ${booking.listing.title} est en attente de paiement.`,
                        {
                            type: 'payment_required',
                            bookingId: booking._id.toString(),
                            paymentLink: paymentLink
                        }
                    ).catch(err => {
                        console.error('Erreur notification Konnect:', err.message);
                    });
                } else if (paymentMethod === 'stripe') {
                    // Pour Stripe, on peut générer un lien de paiement ou rediriger vers la page de paiement
                    const stripePaymentUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/${booking._id}?method=stripe`;
                    booking.paymentLink = stripePaymentUrl;
                    await booking.save();

                    // Envoyer l'email avec le lien de paiement Stripe (async, ne bloque pas)
                    emailService.sendPaymentLinkEmail(booking.guest, booking, stripePaymentUrl).catch(err => {
                        console.error('Erreur envoi email Stripe:', err.message);
                    });

                    // Envoyer une notification push (async, ne bloque pas)
                    notificationService.sendNotificationToUser(
                        booking.guest._id,
                        '💳 Paiement par carte requis',
                        `Votre réservation pour ${booking.listing.title} est en attente de paiement par carte.`,
                        {
                            type: 'payment_required',
                            bookingId: booking._id.toString(),
                            paymentLink: stripePaymentUrl
                        }
                    ).catch(err => {
                        console.error('Erreur notification Stripe:', err.message);
                    });
                } else if (paymentMethod === 'cash') {
                    // Pour le paiement en espèces, envoyer une confirmation directe (async, ne bloque pas)
                    emailService.sendBookingConfirmedEmail(booking.guest.email, booking).catch(err => {
                        console.error('Erreur envoi email confirmation:', err.message);
                    });

                    // Notifier l'hôte de la nouvelle réservation confirmée (async, ne bloque pas)
                    notificationService.sendNotificationToUser(
                        booking.host._id,
                        '🎉 Nouvelle réservation confirmée',
                        `${booking.guest.firstName} ${booking.guest.lastName} a réservé ${booking.listing.title} (paiement en espèces).`,
                        {
                            type: 'booking_confirmed',
                            bookingId: booking._id.toString()
                        }
                    ).catch(err => {
                        console.error('Erreur notification hôte:', err.message);
                    });
                }
            } catch (notificationError) {
                console.error('Erreur lors de l\'envoi des notifications:', notificationError.message);
                // Ne pas faire échouer la création de réservation pour des erreurs de notification
            }

            res.status(201).json({
                success: true,
                message: paymentMethod === 'cash'
                    ? 'Réservation créée et confirmée avec succès (paiement en espèces).'
                    : `Réservation créée avec succès. Un lien de paiement ${paymentMethod === 'stripe' ? 'Stripe' : 'Konnect'} a été envoyé au voyageur.`,
                data: {
                    booking,
                    paymentLink: booking.paymentLink
                }
            });
        } catch (error) {
            console.error('Error creating booking:', error);
            next(error);
        }
    }

    // Générer un lien de paiement Konnect
    async generateKonnectPaymentLink(booking) {
        try {
            // Configuration Konnect
            const konnectApiUrl = process.env.KONNECT_API_URL || 'https://api.konnect.network/api/v2';
            const konnectApiKey = process.env.KONNECT_API_KEY;
            const konnectWalletId = process.env.KONNECT_WALLET_ID;

            if (!konnectApiKey || !konnectWalletId) {
                console.warn('Konnect credentials not configured. Using site payment link.');
                return `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/${booking._id}`;
            }

            // Créer une demande de paiement Konnect
            const axios = require('axios');
            const response = await axios.post(
                `${konnectApiUrl}/payments/init-payment`,
                {
                    receiverWalletId: konnectWalletId,
                    amount: Math.round(booking.pricing.total * 1000), // Montant en millimes
                    token: 'TND',
                    type: 'immediate',
                    description: `Réservation ${booking._id}`,
                    acceptedPaymentMethods: ['wallet', 'bank_card', 'e-DINAR'],
                    lifespan: 24, // Lien valide 24h
                    checkoutForm: true,
                    addPaymentFeesToAmount: true,
                    webhook: `${process.env.BACKEND_URL || 'http://localhost:3002'}/api/webhooks/konnect`,
                    silentWebhook: true,
                    successUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/booking-success/${booking._id}`,
                    failUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/booking-failed/${booking._id}`,
                    theme: 'light'
                },
                {
                    headers: {
                        'x-api-key': konnectApiKey
                    }
                }
            );

            return response.data.payUrl;
        } catch (error) {
            console.error('Error generating Konnect payment link:', error);
            // Fallback: retourner un lien de paiement vers notre site
            return `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/${booking._id}`;
        }
    }

    // Mettre à jour uniquement le statut de paiement d'une réservation (méthode dédiée plus robuste)
    async updateBookingPaymentStatus(req, res, next) {
        try {
            const { bookingId } = req.params;
            const { paymentStatus } = req.body;

            console.log(`[updateBookingPaymentStatus] ID: ${bookingId}`, { paymentStatus });

            // 1. Validation rapide du statut
            const validPaymentStatuses = ['pending', 'paid', 'refunded', 'failed'];
            if (!paymentStatus || !validPaymentStatuses.includes(paymentStatus)) {
                return res.status(400).json({ success: false, message: 'Statut de paiement invalide ou manquant' });
            }

            // 2. Mise à jour atomique
            const updateData = { paymentStatus: paymentStatus };

            // Logique métier : confirmer si payé
            // Note: Pour faire ça proprement en une fois, il faudrait d'abord trouver le booking
            const booking = await Booking.findById(bookingId);

            if (!booking) {
                return res.status(404).json({ success: false, message: 'Réservation non trouvée' });
            }

            booking.paymentStatus = paymentStatus;
            if (paymentStatus === 'paid' && booking.status === 'pending') {
                booking.status = 'confirmed';
            }

            await booking.save();

            // 3. Récupérer l'objet complet pour le frontend
            const updatedBooking = await Booking.findById(bookingId)
                .populate('guest', 'firstName lastName email phone')
                .populate('host', 'firstName lastName email phone')
                .populate('listing', 'title images address');

            return res.status(200).json({
                success: true,
                message: 'Statut de paiement mis à jour',
                data: updatedBooking
            });

        } catch (error) {
            console.error('Erreur updateBookingPaymentStatus:', error);
            next(error); // Laisse le middleware d'erreur gérer la réponse 500
        }
    }

    // Mettre à jour une réservation (statut ou dates)
    async updateBooking(req, res, next) {
        try {
            const { bookingId } = req.params;
            const { status, checkIn, checkOut, eliotelPaid, paymentStatus, pricingTotal } = req.body;

            console.log(`[updateBooking] bookingId=${bookingId}, body=`, req.body);

            const booking = await Booking.findById(bookingId);
            if (!booking) {
                return res.status(404).json({ success: false, message: 'Réservation non trouvée' });
            }

            if (status) {
                const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed', 'rejected'];
                if (!validStatuses.includes(status)) {
                    return res.status(400).json({ success: false, message: 'Statut invalide' });
                }
                booking.status = status;
            }

            if (paymentStatus) {
                const validPaymentStatuses = ['pending', 'paid', 'refunded', 'failed'];
                if (!validPaymentStatuses.includes(paymentStatus)) {
                    return res.status(400).json({ success: false, message: 'Statut de paiement invalide' });
                }
                booking.paymentStatus = paymentStatus;

                // Synchronisation : si on marque comme payé, on peut automatiquement confirmer
                if (paymentStatus === 'paid' && booking.status === 'pending') {
                    booking.status = 'confirmed';
                }
            }

            if (checkIn) booking.checkIn = new Date(checkIn);
            if (checkOut) booking.checkOut = new Date(checkOut);
            if (typeof eliotelPaid === 'boolean') booking.eliotelPaid = eliotelPaid;

            if (pricingTotal !== undefined) {
                const val = parseFloat(pricingTotal);
                if (isNaN(val) || val < 0) {
                    return res.status(400).json({ success: false, message: 'Prix total invalide' });
                }
                booking.pricing.total = val;
            }

            await booking.save();

            const updatedBooking = await Booking.findById(bookingId)
                .populate('guest', 'firstName lastName email phone')
                .populate('host', 'firstName lastName email phone')
                .populate('listing', 'title images address');

            res.status(200).json({
                success: true,
                message: 'Réservation mise à jour avec succès',
                data: updatedBooking
            });
        } catch (error) {
            console.error('Error updating booking:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // Supprimer une réservation (Admin)
    async deleteBooking(req, res, next) {
        try {
            const { bookingId } = req.params;

            const booking = await Booking.findById(bookingId);
            if (!booking) {
                return res.status(404).json({
                    success: false,
                    message: 'Réservation non trouvée'
                });
            }

            // Supprimer la réservation
            await Booking.findByIdAndDelete(bookingId);

            res.status(200).json({
                success: true,
                message: 'Réservation supprimée avec succès'
            });
        } catch (error) {
            console.error('Error deleting booking:', error);
            next(error);
        }
    }

    // Obtenir le récapitulatif de facturation par hôte
    async getBillingSummary(req, res, next) {
        try {
            const { month, year } = req.query;
            const query = {
                status: { $in: ['confirmed', 'completed'] },
                eliotelPaid: { $ne: true }
            };

            if (month && year) {
                // On cherche les réservations dont le séjour commence dans le mois sélectionné
                const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
                const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
                query.checkIn = { $gte: startDate, $lte: endDate };
            }

            console.log('Billing Query:', JSON.stringify(query));
            const billingData = await Booking.aggregate([
                { $match: query },
                {
                    $lookup: {
                        from: "users",
                        localField: "guest",
                        foreignField: "_id",
                        as: "guestInfo"
                    }
                },
                { $unwind: { path: "$guestInfo", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: "listings",
                        localField: "listing",
                        foreignField: "_id",
                        as: "listingInfo"
                    }
                },
                { $unwind: { path: "$listingInfo", preserveNullAndEmptyArrays: true } },
                {
                    $group: {
                        _id: "$host",
                        totalAmount: { $sum: "$pricing.total" },
                        bookingsCount: { $sum: 1 },
                        bookings: {
                            $push: {
                                _id: "$_id",
                                checkIn: "$checkIn",
                                checkOut: "$checkOut",
                                total: "$pricing.total",
                                status: "$status",
                                guest: {
                                    firstName: "$guestInfo.firstName",
                                    lastName: "$guestInfo.lastName",
                                    email: "$guestInfo.email",
                                    phone: "$guestInfo.phone"
                                },
                                listing: {
                                    title: "$listingInfo.title"
                                }
                            }
                        }
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "_id",
                        foreignField: "_id",
                        as: "hostDetails"
                    }
                },
                { $unwind: "$hostDetails" },
                {
                    $project: {
                        host: {
                            _id: "$hostDetails._id",
                            firstName: "$hostDetails.firstName",
                            lastName: "$hostDetails.lastName",
                            email: "$hostDetails.email",
                            phone: "$hostDetails.phone",
                            avatar: "$hostDetails.avatar",
                            rib: "$hostDetails.rib",
                            ribImage: "$hostDetails.ribImage"
                        },
                        totalAmount: 1,
                        bookingsCount: 1,
                        bookings: 1
                    }
                }
            ]);

            res.status(200).json({
                success: true,
                data: billingData
            });
        } catch (error) {
            next(error);
        }
    }

    // Obtenir l'historique des paiements par hôte
    async getPaymentHistory(req, res, next) {
        try {
            const { month, year } = req.query;
            const query = {
                eliotelPaid: true
            };

            if (month && year) {
                const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
                const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
                query.checkIn = { $gte: startDate, $lte: endDate };
            }

            const historyData = await Booking.aggregate([
                { $match: query },
                {
                    $lookup: {
                        from: "users",
                        localField: "guest",
                        foreignField: "_id",
                        as: "guestInfo"
                    }
                },
                { $unwind: { path: "$guestInfo", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: "listings",
                        localField: "listing",
                        foreignField: "_id",
                        as: "listingInfo"
                    }
                },
                { $unwind: { path: "$listingInfo", preserveNullAndEmptyArrays: true } },
                {
                    $group: {
                        _id: "$host",
                        totalAmount: { $sum: "$pricing.total" },
                        bookingsCount: { $sum: 1 },
                        bookings: {
                            $push: {
                                _id: "$_id",
                                checkIn: "$checkIn",
                                checkOut: "$checkOut",
                                total: "$pricing.total",
                                status: "$status",
                                guest: {
                                    firstName: "$guestInfo.firstName",
                                    lastName: "$guestInfo.lastName",
                                    email: "$guestInfo.email",
                                    phone: "$guestInfo.phone"
                                },
                                listing: {
                                    title: "$listingInfo.title"
                                }
                            }
                        }
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "_id",
                        foreignField: "_id",
                        as: "hostDetails"
                    }
                },
                { $unwind: "$hostDetails" },
                {
                    $project: {
                        host: {
                            _id: "$hostDetails._id",
                            firstName: "$hostDetails.firstName",
                            lastName: "$hostDetails.lastName",
                            email: "$hostDetails.email",
                            phone: "$hostDetails.phone",
                            avatar: "$hostDetails.avatar",
                            rib: "$hostDetails.rib",
                            ribImage: "$hostDetails.ribImage"
                        },
                        totalAmount: 1,
                        bookingsCount: 1,
                        bookings: 1
                    }
                },
                { $sort: { totalAmount: -1 } }
            ]);

            res.status(200).json({
                success: true,
                data: historyData
            });
        } catch (error) {
            next(error);
        }
    }

    // Marquer des réservations comme payées à l'hôte
    async markBookingsAsPaid(req, res, next) {
        try {
            const { bookingIds } = req.body;

            if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
                return res.status(400).json({ success: false, message: 'Aucun ID de réservation fourni' });
            }

            // Mettre à jour les réservations
            await Booking.updateMany(
                { _id: { $in: bookingIds } },
                { $set: { eliotelPaid: true } }
            );

            // Récupérer les détails pour l'email et la notification
            const bookings = await Booking.find({ _id: { $in: bookingIds } })
                .populate('host')
                .populate('guest')
                .populate('listing');

            if (bookings.length > 0) {
                const host = bookings[0].host;
                const totalAmount = bookings.reduce((sum, b) => sum + (b.pricing?.total || 0), 0);
                const monthName = new Date(bookings[0].checkIn).toLocaleDateString('fr-FR', { month: 'long' });

                // 1. Envoyer l'Email détaillé
                await emailService.sendPaymentConfirmationEmail(host, bookings, totalAmount);

                // 2. Envoyer la Notification FCM
                const notifTitle = '💸 Virement effectué !';
                const notifBody = `Votre virement de ${totalAmount.toLocaleString()} € pour le mois de ${monthName} a été validé.`;
                await notificationService.sendNotificationToUser(host._id, notifTitle, notifBody, {
                    type: 'payment_received',
                    amount: totalAmount.toString(),
                    month: monthName
                });
            }

            res.status(200).json({
                success: true,
                message: `${bookingIds.length} réservations marquées comme payées. Notifications envoyées.`
            });
        } catch (error) {
            console.error('Error in markBookingsAsPaid:', error);
            next(error);
        }
    }

    // Obtenir tous les avis
    async getAllReviews(req, res, next) {
        try {
            const { search, page = 1, limit = 100 } = req.query;
            const query = {};

            if (search) {
                query.comment = { $regex: search, $options: 'i' };
            }

            const reviews = await Review.find(query)
                .populate('reviewer', 'firstName lastName email avatar phone')
                .populate('reviewee', 'firstName lastName email avatar phone')
                .populate('listing', 'title images')
                .populate('booking', 'checkIn checkOut')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(Number(limit));

            const total = await Review.countDocuments(query);

            res.status(200).json({
                success: true,
                data: {
                    reviews,
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Supprimer un avis (Admin)
    async deleteReview(req, res, next) {
        try {
            const { reviewId } = req.params;
            const review = await Review.findByIdAndDelete(reviewId);

            if (!review) {
                return res.status(404).json({ success: false, message: 'Avis non trouvé' });
            }

            res.status(200).json({
                success: true,
                message: 'Avis supprimé avec succès'
            });
        } catch (error) {
            next(error);
        }
    }

    // Obtenir tous les signalements
    async getAllReports(req, res, next) {
        try {
            const { search, status, page = 1, limit = 100 } = req.query;
            const query = {};

            if (status) query.status = status;
            if (search) {
                query.$or = [
                    { reason: { $regex: search, $options: 'i' } },
                    { details: { $regex: search, $options: 'i' } }
                ];
            }

            const reports = await Report.find(query)
                .populate('reporter', 'firstName lastName email phone avatar')
                .populate('reportedUser', 'firstName lastName email phone avatar')
                .populate({
                    path: 'reportedListing',
                    select: 'title images host',
                    populate: {
                        path: 'host',
                        select: 'firstName lastName email phone'
                    }
                })
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(Number(limit));

            const total = await Report.countDocuments(query);

            res.status(200).json({
                success: true,
                data: {
                    reports,
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Mettre à jour le statut d'un signalement
    async updateReportStatus(req, res, next) {
        try {
            const { reportId } = req.params;
            const { status } = req.body;

            if (!['pending', 'reviewed', 'resolved', 'dismissed'].includes(status)) {
                return res.status(400).json({ success: false, message: 'Statut invalide' });
            }

            const report = await Report.findById(reportId);
            if (!report) {
                return res.status(404).json({ success: false, message: 'Signalement non trouvé' });
            }

            report.status = status;
            await report.save();

            res.status(200).json({
                success: true,
                message: 'Statut du signalement mis à jour',
                data: report
            });
        } catch (error) {
            next(error);
        }
    }

    // Supprimer un signalement
    async deleteReport(req, res, next) {
        try {
            const { reportId } = req.params;
            const report = await Report.findByIdAndDelete(reportId);

            if (!report) {
                return res.status(404).json({ success: false, message: 'Signalement non trouvé' });
            }

            res.status(200).json({
                success: true,
                message: 'Signalement supprimé avec succès'
            });
        } catch (error) {
            next(error);
        }
    }

    // Envoyer une notification à tous les utilisateurs
    async sendBroadcastNotification(req, res, next) {
        try {
            const { title, body, data } = req.body;

            if (!title || !body) {
                return res.status(400).json({
                    success: false,
                    message: 'Le titre et le corps du message sont obligatoires.'
                });
            }

            const result = await notificationService.sendBroadcastNotification(title, body, data || {});

            res.status(200).json({
                success: true,
                message: 'Notification envoyée avec succès.',
                data: result
            });
        } catch (error) {
            console.error('Error in sendBroadcastNotification:', error);
            next(error);
        }
    }

    // Obtenir les listings publics (route publique pour la page d'accueil)
    async getPublicListings(req, res, next) {
        try {
            // Récupérer uniquement les listings actifs
            const listings = await Listing.find({ status: 'active' })
                .populate('host', 'firstName lastName avatar')
                .select('title description images address capacity pricing propertyType roomType ratings')
                .sort({ createdAt: -1 })
                .limit(50)
                .lean();

            res.status(200).json({
                success: true,
                data: {
                    listings,
                    total: listings.length
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Obtenir un listing public spécifique par ID
    async getPublicListingById(req, res, next) {
        try {
            const { id } = req.params;

            const listing = await Listing.findOne({ _id: id, status: 'active' })
                .populate('host', 'firstName lastName avatar email')
                .lean();

            if (!listing) {
                return res.status(404).json({
                    success: false,
                    message: 'Logement non trouvé'
                });
            }

            res.status(200).json({
                success: true,
                data: listing
            });
        } catch (error) {
            next(error);
        }
    }

    // Obtenir les avis publics d'un listing
    async getPublicListingReviews(req, res, next) {
        try {
            const { id } = req.params;
            const Review = require('../models/Review');

            const reviews = await Review.find({
                listing: id,
                reviewerRole: 'guest'
            })
                .populate('reviewer', 'firstName lastName avatar')
                .sort({ createdAt: -1 })
                .limit(20)
                .lean();

            res.status(200).json({
                success: true,
                data: reviews
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AdminController();
