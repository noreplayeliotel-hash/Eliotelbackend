const Booking = require('../models/Booking');
const Listing = require('../models/Listing');
const User = require('../models/User');
const notificationService = require('./notificationService');
const emailService = require('./emailService');

// Retourne le prix applicable pour une nuit donnée (saisonnier ou base)
function getSeasonalPrice(date, basePrice, seasonalPricing) {
    if (!seasonalPricing || seasonalPricing.length === 0) return basePrice;
    const d = new Date(date);
    d.setHours(12, 0, 0, 0);
    for (const season of seasonalPricing) {
        const start = new Date(season.startDate);
        const end = new Date(season.endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        if (d >= start && d <= end) return season.price;
    }
    return basePrice;
}

class BookingService {
    // Calculer le prix d'une réservation (avec prix saisonniers)
    async calculatePrice(listingId, checkIn, checkOut, guestsCount) {
        try {
            const listing = await Listing.findById(listingId);
            if (!listing) {
                throw new Error('Annonce non trouvée');
            }

            const checkInDate = new Date(checkIn);
            const checkOutDate = new Date(checkOut);
            const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

            if (nights <= 0) {
                throw new Error('La date de départ doit être après la date d\'arrivée');
            }

            // Calcul nuit par nuit avec prix saisonniers
            let subtotal = 0;
            const seasonal = listing.pricing.seasonalPricing || [];
            for (let i = 0; i < nights; i++) {
                const night = new Date(checkInDate);
                night.setDate(night.getDate() + i);
                const price = getSeasonalPrice(night, listing.pricing.basePrice, seasonal);
                subtotal += price;
            }

            const cleaningFee = listing.pricing.cleaningFee || 0;
            const serviceFee = listing.pricing.serviceFee || 0;
            const total = subtotal + cleaningFee + serviceFee;

            return {
                basePrice: listing.pricing.basePrice,
                nights,
                subtotal,
                cleaningFee,
                serviceFee,
                taxes: 0,
                total,
                currency: listing.pricing.currency
            };
        } catch (error) {
            throw error;
        }
    }

    // Valider une réservation SANS la créer (appelé avant le paiement)
    async validateBooking(bookingData, guestId) {
        const { listingId, checkIn, checkOut, guests } = bookingData;

        const listing = await Listing.findById(listingId).populate('host');
        if (!listing) throw new Error('Annonce non trouvée');
        if (listing.status !== 'active') throw new Error('Cette annonce n\'est pas disponible');
        if (listing.host._id.toString() === guestId) throw new Error('Vous ne pouvez pas réserver votre propre annonce');

        const totalGuestsCount = guests.adults + guests.children + guests.infants;
        if (totalGuestsCount > listing.capacity.guests) {
            throw new Error(`Cette annonce ne peut accueillir que ${listing.capacity.guests} invités`);
        }
        if (guests.pets > 0 && !listing.houseRules.petsAllowed) {
            throw new Error('Les animaux ne sont pas autorisés dans cette annonce');
        }

        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        const isAvailable = await Booking.checkAvailability(listingId, checkInDate, checkOutDate);
        if (!isAvailable) throw new Error('Ces dates ne sont pas disponibles');

        // Vérifier les blocs externes (réservations manuelles)
        const hasExternalBlock = (listing.externalBlocks || []).some(block =>
            new Date(block.startDate) < checkOutDate && new Date(block.endDate) > checkInDate
        );
        if (hasExternalBlock) throw new Error('Ces dates ne sont pas disponibles (bloquées par l\'hôte)');

        const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
        if (nights < listing.availability.minStay) {
            throw new Error(`Séjour minimum de ${listing.availability.minStay} nuit(s) requis`);
        }
        if (nights > listing.availability.maxStay) {
            throw new Error(`Séjour maximum de ${listing.availability.maxStay} nuit(s) autorisé`);
        }

        return { valid: true };
    }

    // Créer une nouvelle réservation
    async createBooking(bookingData, guestId) {
        try {
            const { listingId, checkIn, checkOut, guests, specialRequests, guestMessage, paymentStatus, paymentDetails, paymentMethod } = bookingData;

            console.log('🏗️ BookingService.createBooking appelé:');
            console.log('- guestId:', guestId);
            console.log('- listingId:', listingId);
            console.log('- paymentMethod reçu:', paymentMethod);
            console.log('- bookingData complet:', JSON.stringify(bookingData, null, 2));

            // Vérifier que l'annonce existe et est active
            const listing = await Listing.findById(listingId).populate('host');
            if (!listing) {
                throw new Error('Annonce non trouvée');
            }
            if (listing.status !== 'active') {
                throw new Error('Cette annonce n\'est pas disponible');
            }

            // Vérifier que l'invité n'est pas l'hôte
            if (listing.host._id.toString() === guestId) {
                throw new Error('Vous ne pouvez pas réserver votre propre annonce');
            }

            // Vérifier la capacité
            const totalGuestsCount = guests.adults + guests.children + guests.infants;
            if (totalGuestsCount > listing.capacity.guests) {
                throw new Error(`Cette annonce ne peut accueillir que ${listing.capacity.guests} invités`);
            }

            // Vérifier les animaux si nécessaire
            if (guests.pets > 0 && !listing.houseRules.petsAllowed) {
                throw new Error('Les animaux ne sont pas autorisés dans cette annonce');
            }

            // Vérifier la disponibilité
            const checkInDate = new Date(checkIn);
            const checkOutDate = new Date(checkOut);
            const isAvailable = await Booking.checkAvailability(listingId, checkInDate, checkOutDate);
            if (!isAvailable) {
                throw new Error('Ces dates ne sont pas disponibles');
            }

            // Vérifier les blocs externes (réservations manuelles de l'hôte)
            const hasExternalBlock = (listing.externalBlocks || []).some(block =>
                new Date(block.startDate) < checkOutDate && new Date(block.endDate) > checkInDate
            );
            if (hasExternalBlock) {
                throw new Error('Ces dates ne sont pas disponibles (bloquées par l\'hôte)');
            }

            // Vérifier minStay/maxStay
            const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
            if (nights < listing.availability.minStay) {
                throw new Error(`Séjour minimum de ${listing.availability.minStay} nuit(s) requis`);
            }
            if (nights > listing.availability.maxStay) {
                throw new Error(`Séjour maximum de ${listing.availability.maxStay} nuit(s) autorisé`);
            }

            // Calculer les prix via la nouvelle méthode
            const pricing = await this.calculatePrice(listingId, checkIn, checkOut, totalGuestsCount);

            // Déterminer le statut initial selon la méthode de paiement
            let initialStatus = 'pending';
            let initialPaymentStatus = 'pending';
            
            // Si paiement en espèces, la réservation est confirmée directement
            if (paymentMethod === 'cash') {
                initialStatus = 'confirmed';
                initialPaymentStatus = 'paid';
            }

            console.log('📊 Statuts calculés dans le service:');
            console.log('- paymentMethod:', paymentMethod);
            console.log('- initialStatus:', initialStatus);
            console.log('- initialPaymentStatus:', initialPaymentStatus);

            // Créer la réservation
            const booking = new Booking({
                listing: listingId,
                guest: guestId,
                host: listing.host._id,
                checkIn: checkInDate,
                checkOut: checkOutDate,
                guests,
                pricing,
                specialRequests,
                guestMessage,
                status: paymentStatus === 'paid' ? 'confirmed' : initialStatus,
                paymentStatus: paymentStatus || initialPaymentStatus,
                paymentMethod: paymentMethod || 'cash',
                paymentDetails: paymentDetails || {}
            });

            console.log('💾 Réservation avant sauvegarde dans le service:');
            console.log('- paymentMethod:', booking.paymentMethod);
            console.log('- status:', booking.status);
            console.log('- paymentStatus:', booking.paymentStatus);

            await booking.save();

            console.log('✅ Réservation sauvegardée dans le service avec ID:', booking._id);
            console.log('- paymentMethod final:', booking.paymentMethod);

            // Populer les données pour la réponse
            await booking.populate([
                { path: 'listing', select: 'title images address' },
                { path: 'guest', select: 'firstName lastName email avatar phone' },
                { path: 'host', select: 'firstName lastName email avatar phone' }
            ]);

            // Log pour déboguer les numéros de téléphone
            console.log('📞 Guest phone:', booking.guest.phone);
            console.log('📞 Host phone:', booking.host.phone);

            // TODO: Créer un chat Firebase pour la réservation
            // Cette fonctionnalité sera implémentée avec Firebase Realtime Database

            // Envoyer une notification à l'hôte pour la nouvelle réservation
            if (booking.status === 'pending') {
                // Notification asynchrone (ne bloque pas la création de la réservation)
                Promise.all([
                    notificationService.notifyNewBooking(booking),
                    emailService.sendNewBookingEmail(booking.host.email, booking)
                ]).catch(err => {
                    console.error('Erreur lors de l\'envoi des notifications de nouvelle réservation:', err);
                });
            } else if (booking.status === 'confirmed') {
                // Si réservation instantanée, notifier le voyageur de la confirmation
                Promise.all([
                    notificationService.notifyBookingConfirmed(booking),
                    emailService.sendBookingConfirmedEmail(booking.guest.email, booking)
                ]).catch(err => {
                    console.error('Erreur lors de l\'envoi des notifications de confirmation:', err);
                });
            }

            return booking;
        } catch (error) {
            throw error;
        }
    }

    // Obtenir les réservations d'un utilisateur
    async getUserBookings(userId, role = 'guest', status = null, page = 1, limit = 10) {
        try {
            const skip = (page - 1) * limit;

            const query = role === 'guest' ? { guest: userId } : { host: userId };
            if (status) {
                query.status = status;
            }

            const bookings = await Booking.find(query)
                .populate('listing', 'title images address propertyType')
                .populate('guest', 'firstName lastName avatar phone')
                .populate('host', 'firstName lastName avatar phone')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            const total = await Booking.countDocuments(query);

            return {
                bookings,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalBookings: total,
                    hasNext: page < Math.ceil(total / limit),
                    hasPrev: page > 1
                }
            };
        } catch (error) {
            throw error;
        }
    }

    // Obtenir une réservation par ID
    async getBookingById(bookingId, userId) {
        try {
            const booking = await Booking.findById(bookingId)
                .populate('listing')
                .populate('guest', 'firstName lastName email phone avatar')
                .populate('host', 'firstName lastName email phone avatar');

            if (!booking) {
                throw new Error('Réservation non trouvée');
            }

            // Vérifier que l'utilisateur est autorisé à voir cette réservation
            if (booking.guest._id.toString() !== userId && booking.host._id.toString() !== userId) {
                throw new Error('Non autorisé à voir cette réservation');
            }

            return booking;
        } catch (error) {
            throw error;
        }
    }

    // Confirmer une réservation (hôte)
    async confirmBooking(bookingId, hostId, hostMessage = null) {
        try {
            const booking = await Booking.findById(bookingId);
            if (!booking) {
                throw new Error('Réservation non trouvée');
            }

            if (booking.host.toString() !== hostId) {
                throw new Error('Non autorisé à confirmer cette réservation');
            }

            if (booking.status !== 'pending') {
                throw new Error('Cette réservation ne peut pas être confirmée');
            }

            // Vérifier à nouveau la disponibilité
            const isAvailable = await Booking.checkAvailability(
                booking.listing,
                booking.checkIn,
                booking.checkOut,
                bookingId
            );
            if (!isAvailable) {
                throw new Error('Ces dates ne sont plus disponibles');
            }

            booking.status = 'confirmed';
            if (hostMessage) {
                booking.hostResponse = {
                    message: hostMessage,
                    respondedAt: new Date()
                };
            }

            await booking.save();
            await booking.populate([
                { path: 'listing', select: 'title images' },
                { path: 'guest', select: 'firstName lastName email' },
                { path: 'host', select: 'firstName lastName' }
            ]);

            // Envoyer une notification au voyageur
            Promise.all([
                notificationService.notifyBookingConfirmed(booking),
                emailService.sendBookingConfirmedEmail(booking.guest.email, booking)
            ]).catch(err => {
                console.error('Erreur lors de l\'envoi des notifications de confirmation:', err);
            });

            return booking;
        } catch (error) {
            throw error;
        }
    }

    // Rejeter une réservation (hôte)
    async rejectBooking(bookingId, hostId, reason) {
        try {
            const booking = await Booking.findById(bookingId);
            if (!booking) {
                throw new Error('Réservation non trouvée');
            }

            if (booking.host.toString() !== hostId) {
                throw new Error('Non autorisé à rejeter cette réservation');
            }

            if (booking.status !== 'pending') {
                throw new Error('Cette réservation ne peut pas être rejetée');
            }

            booking.status = 'rejected';
            booking.hostResponse = {
                message: reason,
                respondedAt: new Date()
            };

            await booking.save();
            await booking.populate([
                { path: 'guest', select: 'firstName lastName email' },
                { path: 'host', select: 'firstName lastName' },
                { path: 'listing', select: 'title' }
            ]);

            // Envoyer une notification au voyageur
            Promise.all([
                notificationService.notifyBookingRejected(booking),
                emailService.sendBookingRejectedEmail(booking.guest.email, booking)
            ]).catch(err => {
                console.error('Erreur lors de l\'envoi des notifications de rejet:', err);
            });

            return booking;
        } catch (error) {
            throw error;
        }
    }

    // Annuler une réservation
    async cancelBooking(bookingId, userId, reason) {
        try {
            const booking = await Booking.findById(bookingId);
            if (!booking) {
                throw new Error('Réservation non trouvée');
            }

            // Vérifier que l'utilisateur peut annuler
            if (booking.guest.toString() !== userId && booking.host.toString() !== userId) {
                throw new Error('Non autorisé à annuler cette réservation');
            }

            if (!['pending', 'confirmed'].includes(booking.status)) {
                throw new Error('Cette réservation ne peut pas être annulée');
            }

            // Calculer le remboursement selon la politique d'annulation
            let refundAmount = 0;
            const now = new Date();
            const checkIn = new Date(booking.checkIn);
            const daysUntilCheckIn = Math.ceil((checkIn - now) / (1000 * 60 * 60 * 24));

            // Politique d'annulation flexible (exemple)
            if (daysUntilCheckIn >= 7) {
                refundAmount = booking.pricing.total; // Remboursement complet
            } else if (daysUntilCheckIn >= 1) {
                refundAmount = booking.pricing.total * 0.5; // 50% de remboursement
            }
            // Sinon pas de remboursement

            await booking.cancel(userId, reason, refundAmount);
            await booking.populate([
                { path: 'guest', select: 'firstName lastName email' },
                { path: 'host', select: 'firstName lastName email' },
                { path: 'listing', select: 'title' }
            ]);

            // Envoyer une notification à l'autre partie
            const isCancelledByHost = userId.toString() === booking.host._id.toString();
            const recipientEmail = isCancelledByHost ? booking.guest.email : booking.host.email;

            Promise.all([
                notificationService.notifyBookingCancelled(booking, userId),
                emailService.sendBookingCancelledEmail(recipientEmail, booking, userId)
            ]).catch(err => {
                console.error('Erreur lors de l\'envoi des notifications d\'annulation:', err);
            });

            return booking;
        } catch (error) {
            throw error;
        }
    }

    // Marquer une réservation comme terminée
    async completeBooking(bookingId) {
        try {
            const booking = await Booking.findById(bookingId);
            if (!booking) {
                throw new Error('Réservation non trouvée');
            }

            const now = new Date();
            const checkOut = new Date(booking.checkOut);

            if (now < checkOut) {
                throw new Error('La réservation n\'est pas encore terminée');
            }

            if (booking.status !== 'confirmed') {
                throw new Error('Seules les réservations confirmées peuvent être marquées comme terminées');
            }

            booking.status = 'completed';
            await booking.save();
            await booking.populate([
                { path: 'guest', select: 'firstName lastName email' },
                { path: 'host', select: 'firstName lastName email' },
                { path: 'listing', select: 'title' }
            ]);

            // Envoyer des notifications au voyageur et à l'hôte
            Promise.all([
                notificationService.notifyBookingCompleted(booking),
                emailService.sendBookingCompletedEmail(booking.guest.email, booking, false),
                emailService.sendBookingCompletedEmail(booking.host.email, booking, true)
            ]).catch(err => {
                console.error('Erreur lors de l\'envoi des notifications de fin de séjour:', err);
            });

            return booking;
        } catch (error) {
            throw error;
        }
    }

    // Mettre à jour automatiquement les réservations passées à "completed"
    async autoCompleteBookings(userId) {
        try {
            const now = new Date();

            // Trouver toutes les réservations confirmées dont la date de checkout est passée
            const pastBookings = await Booking.find({
                guest: userId,
                status: 'confirmed',
                checkOut: { $lt: now }
            });

            // Mettre à jour chaque réservation à "completed"
            const updatePromises = pastBookings.map(booking => {
                booking.status = 'completed';
                return booking.save();
            });

            await Promise.all(updatePromises);

            return {
                updated: pastBookings.length,
                bookingIds: pastBookings.map(b => b._id)
            };
        } catch (error) {
            throw error;
        }
    }

    // Obtenir les statistiques de réservation pour un hôte
    async getBookingStats(hostId) {
        try {
            const stats = await Booking.aggregate([
                { $match: { host: hostId } },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                        totalRevenue: { $sum: '$pricing.total' }
                    }
                }
            ]);

            const totalBookings = await Booking.countDocuments({ host: hostId });
            const totalRevenue = await Booking.aggregate([
                { $match: { host: hostId, status: { $in: ['confirmed', 'completed'] } } },
                { $group: { _id: null, total: { $sum: '$pricing.total' } } }
            ]);

            return {
                totalBookings,
                totalRevenue: totalRevenue[0]?.total || 0,
                statusBreakdown: stats,
                summary: {
                    pending: stats.find(s => s._id === 'pending')?.count || 0,
                    confirmed: stats.find(s => s._id === 'confirmed')?.count || 0,
                    completed: stats.find(s => s._id === 'completed')?.count || 0,
                    cancelled: stats.find(s => s._id === 'cancelled')?.count || 0
                }
            };
        } catch (error) {
            throw error;
        }
    }

    // Vérifier la disponibilité d'une annonce
    async checkListingAvailability(listingId, checkIn, checkOut) {
        try {
            const listing = await Listing.findById(listingId);
            if (!listing) {
                throw new Error('Annonce non trouvée');
            }

            const isAvailable = await Booking.checkAvailability(
                listingId,
                new Date(checkIn),
                new Date(checkOut)
            );

            return {
                available: isAvailable,
                listing: {
                    id: listing._id,
                    title: listing.title,
                    minStay: listing.availability.minStay,
                    maxStay: listing.availability.maxStay,
                    instantBook: listing.availability.instantBook
                }
            };
        } catch (error) {
            throw error;
        }
    }

    // Obtenir les dates occupées pour une annonce
    async getOccupiedDates(listingId, startDate, endDate) {
        try {
            const listing = await Listing.findById(listingId);
            if (!listing) {
                throw new Error('Annonce non trouvée');
            }

            // Récupérer toutes les réservations confirmées ou en attente dans la période
            const bookings = await Booking.find({
                listing: listingId,
                status: { $in: ['confirmed', 'pending'] },
                $or: [
                    { checkIn: { $gte: new Date(startDate), $lte: new Date(endDate) } },
                    { checkOut: { $gte: new Date(startDate), $lte: new Date(endDate) } },
                    { checkIn: { $lte: new Date(startDate) }, checkOut: { $gte: new Date(endDate) } }
                ]
            }).select('checkIn checkOut status');

            // Générer toutes les dates occupées par réservations
            const occupiedDates = [];
            bookings.forEach(booking => {
                const current = new Date(booking.checkIn);
                const end = new Date(booking.checkOut);
                while (current < end) {
                    occupiedDates.push({ date: new Date(current), status: booking.status });
                    current.setDate(current.getDate() + 1);
                }
            });

            // Ajouter les dates bloquées par les blocs externes
            const rangeStart = new Date(startDate);
            const rangeEnd = new Date(endDate);
            const externalBlocks = listing.externalBlocks || [];
            externalBlocks.forEach(block => {
                const blockStart = new Date(block.startDate);
                const blockEnd = new Date(block.endDate);
                // Intersection avec la plage demandée
                const current = new Date(Math.max(blockStart, rangeStart));
                const end = new Date(Math.min(blockEnd, rangeEnd));
                while (current < end) {
                    occupiedDates.push({ date: new Date(current), status: 'blocked' });
                    current.setDate(current.getDate() + 1);
                }
            });

            return {
                listingId,
                occupiedDates,
                totalBookings: bookings.length
            };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new BookingService();