const express = require('express');
const adminController = require('../controllers/adminController');
const { auth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Routes publiques pour le backoffice
router.get('/exists', adminController.checkAdminExists);
router.post('/login', adminController.login);
router.post('/register-first', adminController.registerFirstAdmin);

// Route publique pour obtenir les listings actifs (page d'accueil)
router.get('/public/listings', adminController.getPublicListings);
router.get('/public/listings/:id', adminController.getPublicListingById);
router.get('/public/listings/:id/reviews', adminController.getPublicListingReviews);

// Toutes les autres routes admin sont protégées
router.use(auth);
router.use(requireAdmin);

// Dashboard
router.get('/stats', adminController.getDashboardStats);

// Gestion des utilisateurs
router.get('/users', adminController.getAllUsers);
router.post('/users', adminController.createUser);
router.patch('/users/:userId/status', adminController.updateUserStatus);

// Gestion des listings
router.get('/listings', adminController.getAllListings);
router.get('/active-hosts', adminController.getActiveHosts);
router.get('/active-guests', adminController.getActiveGuests);
router.patch('/listings/:listingId/status', adminController.updateListingStatus);
router.patch('/listings/:listingId', adminController.updateListing);

// Gestion des réservations
router.get('/bookings', adminController.getAllBookings);
router.post('/bookings', adminController.createBooking);
router.patch('/bookings/:bookingId', adminController.updateBooking);
router.patch('/bookings/:bookingId/payment-status', adminController.updateBookingPaymentStatus);
router.delete('/bookings/:bookingId', adminController.deleteBooking);

// Facturation hôtes
router.get('/billing/summary', adminController.getBillingSummary);
router.get('/billing/history', adminController.getPaymentHistory);
router.post('/billing/pay', adminController.markBookingsAsPaid);

// Gestion des avis
router.get('/reviews', adminController.getAllReviews);
router.delete('/reviews/:reviewId', adminController.deleteReview);

// Gestion des signalements
router.get('/reports', adminController.getAllReports);
router.patch('/reports/:reportId/status', adminController.updateReportStatus);
router.delete('/reports/:reportId', adminController.deleteReport);

// Notifications
router.post('/notifications/broadcast', adminController.sendBroadcastNotification);

module.exports = router;
