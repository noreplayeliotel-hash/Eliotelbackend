const bookingService = require('../services/bookingService');
const { validationResult } = require('express-validator');

class BookingController {
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
}

module.exports = new BookingController();