const bookingService = require('../services/bookingService');
const { validationResult } = require('express-validator');

class BookingController {
  // Valider une réservation avant paiement
  async validateBooking(req, res, next) {
    try {
      const guestId = req.user.userId;
      await bookingService.validateBooking(req.body, guestId);
      res.status(200).json({ success: true, message: 'Réservation valide' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Créer une nouvelle réservation
  async createBooking(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: errors.array()
        });
      }

      const guestId = req.user.userId;
      const booking = await bookingService.createBooking(req.body, guestId);

      res.status(201).json({
        success: true,
        message: 'Réservation créée avec succès',
        data: {
          booking
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Calculer le prix d'une réservation
  async calculatePrice(req, res, next) {
    try {
      const { listing, checkIn, checkOut, guests } = req.body;

      if (!listing || !checkIn || !checkOut) {
        return res.status(400).json({
          success: false,
          message: 'Données manquantes pour le calcul du prix'
        });
      }

      const pricing = await bookingService.calculatePrice(listing, checkIn, checkOut, guests);

      res.status(200).json({
        success: true,
        pricing
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtenir les réservations de l'utilisateur connecté
  async getMyBookings(req, res, next) {
    try {
      const userId = req.user.userId;
      const role = req.query.role || 'guest'; // 'guest' ou 'host'
      const status = req.query.status;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      // Auto-compléter les réservations passées si c'est un voyageur
      if (role === 'guest') {
        await bookingService.autoCompleteBookings(userId);
      }

      const result = await bookingService.getUserBookings(userId, role, status, page, limit);

      res.status(200).json({
        success: true,
        bookings: result.bookings,
        totalCount: result.pagination.totalBookings,
        currentPage: result.pagination.currentPage,
        totalPages: result.pagination.totalPages
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtenir une réservation par ID
  async getBookingById(req, res, next) {
    try {
      const { bookingId } = req.params;
      const userId = req.user.userId;

      const booking = await bookingService.getBookingById(bookingId, userId);

      res.status(200).json({
        success: true,
        data: {
          booking
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Confirmer une réservation (hôte)
  async confirmBooking(req, res, next) {
    try {
      const { bookingId } = req.params;
      const { hostMessage } = req.body;
      const hostId = req.user.userId;

      const booking = await bookingService.confirmBooking(bookingId, hostId, hostMessage);

      res.status(200).json({
        success: true,
        message: 'Réservation confirmée avec succès',
        data: {
          booking
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Rejeter une réservation (hôte)
  async rejectBooking(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: errors.array()
        });
      }

      const { bookingId } = req.params;
      const { reason } = req.body;
      const hostId = req.user.userId;

      const booking = await bookingService.rejectBooking(bookingId, hostId, reason);

      res.status(200).json({
        success: true,
        message: 'Réservation rejetée',
        data: {
          booking
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Annuler une réservation
  async cancelBooking(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: errors.array()
        });
      }

      const { bookingId } = req.params;
      const { reason } = req.body;
      const userId = req.user.userId;

      const booking = await bookingService.cancelBooking(bookingId, userId, reason);

      res.status(200).json({
        success: true,
        message: 'Réservation annulée avec succès',
        data: {
          booking
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Marquer une réservation comme terminée
  async completeBooking(req, res, next) {
    try {
      const { bookingId } = req.params;

      const booking = await bookingService.completeBooking(bookingId);

      res.status(200).json({
        success: true,
        message: 'Réservation marquée comme terminée',
        data: {
          booking
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtenir les statistiques de réservation (hôte)
  async getBookingStats(req, res, next) {
    try {
      const hostId = req.user.userId;
      const stats = await bookingService.getBookingStats(hostId);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  // Vérifier la disponibilité d'une annonce
  async checkAvailability(req, res, next) {
    try {
      const { listingId } = req.params;
      const { checkIn, checkOut } = req.query;

      if (!checkIn || !checkOut) {
        return res.status(400).json({
          success: false,
          message: 'Dates d\'arrivée et de départ requises'
        });
      }

      const result = await bookingService.checkListingAvailability(listingId, checkIn, checkOut);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtenir les dates occupées pour une annonce
  async getOccupiedDates(req, res, next) {
    try {
      const { listingId } = req.params;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Dates de début et de fin requises'
        });
      }

      const result = await bookingService.getOccupiedDates(listingId, startDate, endDate);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtenir l'historique de paiement pour l'hôte connecté
  async getHostPaymentHistory(req, res, next) {
    try {
      const hostId = req.user.userId;
      const { month, year } = req.query;

      console.log('🔍 getHostPaymentHistory - hostId:', hostId);
      console.log('🔍 Filtres - month:', month, 'year:', year);

      const Booking = require('../models/Booking');
      const mongoose = require('mongoose');

      // Convertir hostId en ObjectId
      const hostObjectId = new mongoose.Types.ObjectId(hostId);

      const query = {
        host: hostObjectId,
        status: { $in: ['confirmed', 'completed'] }  // Toutes les réservations confirmées ou complétées
      };

      if (month && year) {
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
        query.checkIn = { $gte: startDate, $lte: endDate };
        console.log('📅 Filtrage par date:', startDate, 'à', endDate);
      }

      console.log('🔎 Query MongoDB:', JSON.stringify(query));

      // Vérifier d'abord combien de bookings correspondent
      const bookingsCount = await Booking.countDocuments(query);
      console.log(`📊 Nombre de bookings trouvés: ${bookingsCount}`);

      // Si aucun booking avec eliotelPaid, vérifier tous les bookings de l'hôte
      const allHostBookings = await Booking.countDocuments({ host: hostObjectId });
      console.log(`📊 Nombre total de bookings de l'hôte: ${allHostBookings}`);

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
                eliotelPaid: "$eliotelPaid",
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

      console.log('✅ Résultat aggregation:', JSON.stringify(historyData, null, 2));

      res.status(200).json({
        success: true,
        data: historyData
      });
    } catch (error) {
      console.error('❌ Erreur dans getHostPaymentHistory:', error);
      next(error);
    }
  }

  // Obtenir les informations de paiement (route publique)
  async getPaymentInfo(req, res, next) {
    try {
      const { bookingId } = req.params;
      
      // Récupérer directement la réservation sans vérification d'autorisation
      const Booking = require('../models/Booking');
      const booking = await Booking.findById(bookingId)
        .populate('listing', 'title images address')
        .populate('guest', 'firstName lastName email')
        .lean();
      
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Réservation non trouvée'
        });
      }

      // Retourner uniquement les informations nécessaires pour la page de paiement
      const paymentInfo = {
        _id: booking._id,
        listing: {
          title: booking.listing.title,
          images: booking.listing.images,
          address: booking.listing.address
        },
        guest: {
          firstName: booking.guest.firstName,
          lastName: booking.guest.lastName,
          email: booking.guest.email
        },
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        pricing: booking.pricing,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        paymentMethod: booking.paymentMethod,
        paymentLink: booking.paymentLink
      };

      res.status(200).json({
        success: true,
        data: paymentInfo
      });
    } catch (error) {
      next(error);
    }
  }

  // Initialiser un paiement Konnect (route publique)
  async initKonnectPayment(req, res, next) {
    try {
      const { bookingId } = req.params;
      
      // Récupérer la réservation
      const Booking = require('../models/Booking');
      const booking = await Booking.findById(bookingId)
        .populate('guest', 'firstName lastName email phone')
        .lean();
      
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Réservation non trouvée'
        });
      }

      // Configuration Konnect
      const konnectApiUrl = process.env.KONNECT_API_URL || 'https://api.konnect.network/api/v2';
      const konnectApiKey = process.env.KONNECT_API_KEY;
      const konnectWalletId = process.env.KONNECT_WALLET_ID;

      if (!konnectApiKey || !konnectWalletId) {
        return res.status(500).json({
          success: false,
          message: 'Configuration Konnect manquante'
        });
      }

      // Créer une demande de paiement Konnect
      const axios = require('axios');
      const apiUrl = konnectApiUrl.endsWith('/') ? konnectApiUrl : `${konnectApiUrl}/`;
      
      // Convertir le montant en centimes pour EUR (ou millimes pour TND)
      const currency = booking.pricing.currency || 'EUR';
      const amount = currency === 'TND' 
        ? Math.round(booking.pricing.total * 1000) // Millimes pour TND
        : Math.round(booking.pricing.total * 100);  // Centimes pour EUR/USD
      
      const response = await axios.post(
        `${apiUrl}payments/init-payment`,
        {
          receiverWalletId: konnectWalletId,
          amount: amount,
          token: currency,
          type: 'immediate',
          description: `Réservation ${booking._id}`,
          acceptedPaymentMethods: ['wallet', 'bank_card', 'e-DINAR'],
          lifespan: 60, // Maximum 60 minutes
          checkoutForm: true,
          addPaymentFeesToAmount: true,
          firstName: booking.guest.firstName,
          lastName: booking.guest.lastName,
          email: booking.guest.email,
          phoneNumber: booking.guest.phone || '',
          orderId: booking._id.toString(),
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

      res.status(200).json({
        success: true,
        data: {
          payUrl: response.data.payUrl,
          paymentRef: response.data.paymentRef
        }
      });
    } catch (error) {
      console.error('Error initializing Konnect payment:', error);
      
      // Log détaillé de l'erreur Konnect
      if (error.response) {
        console.error('Konnect API Error Response:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      }
      
      res.status(500).json({
        success: false,
        message: error.response?.data?.errors 
          ? `Erreur Konnect: ${JSON.stringify(error.response.data.errors)}` 
          : 'Erreur lors de l\'initialisation du paiement',
        details: error.response?.data
      });
    }
  }

  // Créer un PaymentIntent Stripe (route publique)
  async createStripePaymentIntent(req, res, next) {
    try {
      const { bookingId } = req.params;
      
      console.log('🔍 Création PaymentIntent pour booking:', bookingId);
      
      // Récupérer la réservation
      const Booking = require('../models/Booking');
      const booking = await Booking.findById(bookingId)
        .populate('guest', 'firstName lastName email')
        .lean();
      
      if (!booking) {
        console.log('❌ Réservation non trouvée:', bookingId);
        return res.status(404).json({
          success: false,
          message: 'Réservation non trouvée'
        });
      }

      console.log('📋 Réservation trouvée:', {
        id: booking._id,
        total: booking.pricing.total,
        currency: booking.pricing.currency,
        paymentStatus: booking.paymentStatus
      });

      // Vérifier que la réservation n'est pas déjà payée
      if (booking.paymentStatus === 'paid') {
        console.log('⚠️ Réservation déjà payée');
        return res.status(400).json({
          success: false,
          message: 'Cette réservation est déjà payée'
        });
      }

      // Initialiser Stripe
      console.log('🔧 Initialisation Stripe avec clé:', process.env.STRIPE_SECRET_KEY ? 'Configurée' : 'Manquante');
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      
      // Convertir le montant en centimes
      const amount = Math.round(booking.pricing.total * 100);
      console.log('💰 Montant calculé:', { original: booking.pricing.total, centimes: amount });
      
      // Créer un PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: booking.pricing.currency.toLowerCase(),
        metadata: {
          bookingId: booking._id.toString(),
          guestEmail: booking.guest.email,
          guestName: `${booking.guest.firstName} ${booking.guest.lastName}`
        },
        description: `Réservation ${booking._id}`,
        receipt_email: booking.guest.email
      });

      console.log('✅ PaymentIntent créé:', paymentIntent.id);

      const responseData = {
        success: true,
        data: {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id
        }
      };

      console.log('📤 Réponse envoyée au frontend:', responseData);

      res.status(200).json(responseData);
    } catch (error) {
      console.error('❌ Erreur création PaymentIntent:', error);
      
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création du paiement Stripe',
        details: error.message
      });
    }
  }

  // Confirmer un paiement Stripe et mettre à jour la réservation (route publique)
  async confirmStripePayment(req, res, next) {
    try {
      const { bookingId } = req.params;
      const { paymentIntentId } = req.body;
      
      console.log('🔄 Confirmation paiement Stripe pour booking:', bookingId);
      console.log('💳 PaymentIntent ID:', paymentIntentId);
      
      // Récupérer la réservation
      const Booking = require('../models/Booking');
      const booking = await Booking.findById(bookingId)
        .populate('guest', 'firstName lastName email')
        .populate('listing', 'title')
        .populate('host', 'firstName lastName email');
      
      if (!booking) {
        console.log('❌ Réservation non trouvée:', bookingId);
        return res.status(404).json({
          success: false,
          message: 'Réservation non trouvée'
        });
      }

      // Vérifier le paiement avec Stripe
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      console.log('📊 Statut PaymentIntent:', paymentIntent.status);
      
      if (paymentIntent.status === 'succeeded') {
        // Mettre à jour la réservation
        booking.paymentStatus = 'paid';
        booking.status = 'confirmed';
        booking.paymentDetails.transactionId = paymentIntentId;
        booking.paymentDetails.paymentDate = new Date();
        
        await booking.save();
        
        console.log('✅ Réservation mise à jour:', {
          id: booking._id,
          status: booking.status,
          paymentStatus: booking.paymentStatus
        });

        // Envoyer email de confirmation (async, ne bloque pas)
        const emailService = require('../services/emailService');
        emailService.sendBookingConfirmedEmail(booking.guest.email, booking).catch(err => {
          console.error('Erreur envoi email confirmation:', err.message);
        });

        res.status(200).json({
          success: true,
          message: 'Paiement confirmé et réservation mise à jour',
          data: {
            booking: {
              _id: booking._id,
              status: booking.status,
              paymentStatus: booking.paymentStatus
            }
          }
        });
      } else {
        console.log('⚠️ Paiement non réussi:', paymentIntent.status);
        res.status(400).json({
          success: false,
          message: `Paiement non confirmé. Statut: ${paymentIntent.status}`
        });
      }
    } catch (error) {
      console.error('❌ Erreur confirmation paiement:', error);
      
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la confirmation du paiement',
        details: error.message
      });
    }
  }
}

module.exports = new BookingController();