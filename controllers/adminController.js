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

    // Mettre à jour le statut d'un utilisateur (ex: suspension)
    async updateUserStatus(req, res, next) {
        try {
            const { userId } = req.params;
            const { status } = req.body;

            if (!['active', 'suspended'].includes(status)) {
                return res.status(400).json({ success: false, message: 'Statut invalide' });
            }

            const user = await User.findByIdAndUpdate(userId, { status }, { new: true });

            res.status(200).json({
                success: true,
                message: `Utilisateur ${status === 'active' ? 'activé' : 'suspendu'} avec succès`,
                data: user
            });
        } catch (error) {
            next(error);
        }
    }

    // Modérer un listing
    async updateListingStatus(req, res, next) {
        try {
            const { listingId } = req.params;
            const { status } = req.body;

            console.log(`Updating listing ${listingId} to status ${status}`);

            const validStatuses = ['draft', 'active', 'inactive', 'suspended'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ success: false, message: 'Statut invalide' });
            }

            const listing = await Listing.findById(listingId);

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

    // Mettre à jour une réservation (statut ou dates)
    async updateBooking(req, res, next) {
        try {
            const { bookingId } = req.params;
            const { status, checkIn, checkOut, eliotelPaid } = req.body;

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

            if (checkIn) booking.checkIn = new Date(checkIn);
            if (checkOut) booking.checkOut = new Date(checkOut);
            if (typeof eliotelPaid === 'boolean') booking.eliotelPaid = eliotelPaid;

            await booking.save();

            res.status(200).json({
                success: true,
                message: 'Réservation mise à jour avec succès',
                data: booking
            });
        } catch (error) {
            console.error('Error updating booking:', error);
            res.status(500).json({ success: false, message: error.message });
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

            const report = await Report.findByIdAndUpdate(reportId, { status }, { new: true });

            if (!report) {
                return res.status(404).json({ success: false, message: 'Signalement non trouvé' });
            }

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
}

module.exports = new AdminController();
