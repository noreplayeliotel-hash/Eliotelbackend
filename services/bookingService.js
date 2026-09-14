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

// Normalise une date pour le calendrier de réservation (UTC midi pour éviter les décalages de fuseau horaire)
function normalizeBookingDate(dateInput) {
    if (!dateInput) return null;
    if (typeof dateInput === 'string') {
        const match = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
            const year = parseInt(match[1], 10);
            const month = parseInt(match[2], 10) - 1;
            const day = parseInt(match[3], 10);
            return new Date(Date.UTC(year, month, day, 12, 0, 0));
        }
    }
    const d = new Date(dateInput);
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0));
}

class BookingService {
    // Calculer le prix d'une réservation (avec prix saisonniers)
    async calculatePrice(listingId, checkIn, checkOut, guestsCount) {
        try {
            const listing = await Listing.findById(listingId);
            if (!listing) {
                throw new Error('Annonce non trouvée');
            }

            const checkInDate = normalizeBookingDate(checkIn);
            const checkOutDate = normalizeBookingDate(checkOut);
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

            const PlatformConfig = require('../models/PlatformConfig');
            const platformConfig = await PlatformConfig.getOrCreateDefault();

            const cleaningFee = listing.pricing.cleaningFee || 0;
            // Frais de service dynamique configuré en base de données (ex: 12% aligné Airbnb)
            let serviceFee = listing.pricing.serviceFee || 0;
            if (!serviceFee || serviceFee <= 0) {
                serviceFee = Math.round(subtotal * (platformConfig.guestServiceFeeRate || 0.12) * 100) / 100;
            }
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

        const checkInDate = normalizeBookingDate(checkIn);
        const checkOutDate = normalizeBookingDate(checkOut);
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
    async createBooking(bookingData, guestId, options = {}) {
        try {
            const { listingId, checkIn, checkOut, checkInTime, checkOutTime, guests, specialRequests, guestMessage, paymentStatus, paymentDetails, paymentMethod } = bookingData;
            const { skipExternalBlockCheck = false, skipAvailabilityCheck = false } = options;

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
            const checkInDate = normalizeBookingDate(checkIn);
            const checkOutDate = normalizeBookingDate(checkOut);
            if (!skipAvailabilityCheck) {
                const isAvailable = await Booking.checkAvailability(listingId, checkInDate, checkOutDate);
                if (!isAvailable) {
                    throw new Error('Ces dates ne sont pas disponibles');
                }
            }

            // Vérifier les blocs externes (réservations manuelles de l'hôte)
            if (!skipExternalBlockCheck) {
                const hasExternalBlock = (listing.externalBlocks || []).some(block =>
                    new Date(block.startDate) < checkOutDate && new Date(block.endDate) > checkInDate
                );
                if (hasExternalBlock) {
                    throw new Error('Ces dates ne sont pas disponibles (bloquées par l\'hôte)');
                }
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
            const pricing = await this.calculatePrice(listingId, checkInDate, checkOutDate, totalGuestsCount);

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
                checkInTime: checkInTime || listing.houseRules?.checkIn || null,
                checkOutTime: checkOutTime || listing.houseRules?.checkOut || null,
                guests,
                pricing,
                cancellationPolicy: listing.cancellationPolicy || 'flexible',
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
                { path: 'listing', select: 'title images address cancellationPolicy' },
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
                // Notifier le voyageur ET l'hôte (notification in-app et email de confirmation pour les deux)
                Promise.all([
                    notificationService.notifyBookingConfirmed(booking),
                    emailService.sendBookingConfirmedEmail(booking.guest.email, booking),
                    emailService.sendBookingConfirmedHostEmail(booking.host.email, booking)
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
                { path: 'host', select: 'firstName lastName email' }
            ]);

            // Envoyer une notification au voyageur et à l'hôte
            Promise.all([
                notificationService.notifyBookingConfirmed(booking),
                emailService.sendBookingConfirmedEmail(booking.guest.email, booking),
                emailService.sendBookingConfirmedHostEmail(booking.host.email, booking)
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
    async cancelBooking(bookingId, userId, reason, rib = null) {
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

            const now = new Date();
            const checkIn = new Date(booking.checkIn);
            if (now >= checkIn) {
                throw new Error('Impossible d\'annuler une réservation dont le séjour a déjà commencé.');
            }

            // Récupérer la politique d'annulation de la réservation ou de l'annonce
            let policy = booking.cancellationPolicy;
            if (!policy) {
                const Listing = require('../models/Listing');
                const listingDoc = await Listing.findById(booking.listing).select('cancellationPolicy');
                policy = listingDoc?.cancellationPolicy || 'flexible';
            }
            policy = (policy || 'flexible').toLowerCase();

            // Calcul du remboursement selon la politique d'annulation Airbnb (Flexible, Ferme, Stricte) :
            const PlatformConfig = require('../models/PlatformConfig');
            const platformConfig = await PlatformConfig.getOrCreateDefault();

            const createdAt = new Date(booking.createdAt || booking._id.getTimestamp());
            const hoursSinceBooking = (now - createdAt) / (1000 * 60 * 60);

            const msUntilCheckIn = checkIn - now;
            const hoursUntilCheckIn = msUntilCheckIn / (1000 * 60 * 60);
            const daysUntilCheckIn = Math.ceil(msUntilCheckIn / (1000 * 60 * 60 * 24));

            // Décomposition des montants
            const cleaningFee = booking.pricing.cleaningFee || 0;
            const baseNights = booking.pricing.subtotal || Math.max(0, booking.pricing.total - cleaningFee);
            const hostCommissionRate = platformConfig.hostServiceFeeRate !== undefined ? platformConfig.hostServiceFeeRate : 0.03;

            // Déterminer si c'est l'hôte qui annule la réservation
            const hostIdStr = (booking.host._id || booking.host).toString();
            const isHostCancelling = hostIdStr === userId.toString();
            const cancelledByRole = isHostCancelling ? 'host' : 'guest';

            let travelerRefundRate = 0; // 1.0 = 100%, 0.5 = 50%, 0.0 = 0%
            let hostPayoutRate = 0;     // 1.0 = 100%, 0.5 = 50%, 0.0 = 0%
            let hostCancellationFee = 0;
            let hostCancellationFeeRate = 0;
            let datesBlocked = false;

            if (isHostCancelling) {
                // Si l'hôte annule : Eliotel ne retourne rien à l'hôte (0,00 €),
                // le voyageur est intégralement remboursé (100% nuitées + ménage)
                travelerRefundRate = 1.0;
                hostPayoutRate = 0.0;

                // Pénalité financière Airbnb pour l'hôte (10% à 50%) sur les politiques Ferme et Stricte + Blocage des dates
                if (policy === 'moderate') {
                    datesBlocked = true;
                    if (daysUntilCheckIn >= 30) {
                        hostCancellationFeeRate = 0.10; // 10% si > 30 jours
                    } else if (daysUntilCheckIn >= 7) {
                        hostCancellationFeeRate = 0.25; // 25% entre 30j et 7j
                    } else {
                        hostCancellationFeeRate = 0.50; // 50% à moins de 7 jours
                    }
                } else if (policy === 'strict') {
                    datesBlocked = true;
                    if (daysUntilCheckIn >= 30) {
                        hostCancellationFeeRate = 0.10; // 10% si > 30 jours
                    } else if (daysUntilCheckIn >= 14) {
                        hostCancellationFeeRate = 0.25; // 25% entre 30j et 14j
                    } else {
                        hostCancellationFeeRate = 0.50; // 50% à moins de 14 jours
                    }
                }

                if (hostCancellationFeeRate > 0) {
                    hostCancellationFee = Math.round(booking.pricing.total * hostCancellationFeeRate * 100) / 100;
                }

                // Bloquer les dates sur l'annonce pour empêcher l'hôte de relouer
                if (datesBlocked && booking.listing) {
                    try {
                        const Listing = require('../models/Listing');
                        await Listing.findByIdAndUpdate(booking.listing, {
                            $push: {
                                externalBlocks: {
                                    startDate: booking.checkIn,
                                    endDate: booking.checkOut,
                                    reason: `Dates bloquées suite à annulation hôte (politique ${policy})`,
                                    createdAt: new Date()
                                }
                            }
                        });
                        console.log(`[HostCancellation] Dates ${booking.checkIn} - ${booking.checkOut} bloquées sur le listing ${booking.listing}`);
                    } catch (blockErr) {
                        console.error('Erreur lors du blocage des dates du listing:', blockErr);
                    }
                }
            } else if (policy === 'flexible') {
                // Flexible :
                // - Jusqu'à 24h avant l'arrivée : voyageur 100% nuitées (+ ménage), hôte 0%
                // - Moins de 24h avant l'arrivée : voyageur 0% nuitées (+ ménage), hôte 100% nuitées (- com 3%)
                if (hoursUntilCheckIn >= 24) {
                    travelerRefundRate = 1.0;
                    hostPayoutRate = 0.0;
                } else {
                    travelerRefundRate = 0.0;
                    hostPayoutRate = 1.0;
                }
            } else if (policy === 'moderate') { // "Ferme"
                // Ferme :
                // - Jusqu'à 30 jours avant l'arrivée : voyageur 100% nuitées (+ ménage), hôte 0%
                // - Entre 30 jours et 7 jours avant l'arrivée : voyageur 50% nuitées (+ ménage), hôte 50% nuitées (- com 3%)
                // - Moins de 7 jours avant l'arrivée : voyageur 0% nuitées (+ ménage), hôte 100% nuitées (- com 3%)
                if (daysUntilCheckIn >= 30) {
                    travelerRefundRate = 1.0;
                    hostPayoutRate = 0.0;
                } else if (daysUntilCheckIn >= 7) {
                    travelerRefundRate = 0.5;
                    hostPayoutRate = 0.5;
                } else {
                    travelerRefundRate = 0.0;
                    hostPayoutRate = 1.0;
                }
            } else if (policy === 'strict') {
                // Stricte :
                // - Dans les 48h suivant la réservation (si arrivée > 14 jours) : voyageur 100% nuitées (+ ménage), hôte 0%
                // - Jusqu'à 14 jours avant l'arrivée (après les 48h) : voyageur 50% nuitées (+ ménage), hôte 50% nuitées (- com 3%)
                // - Moins de 14 jours avant l'arrivée : voyageur 0% nuitées (+ ménage), hôte 100% nuitées (- com 3%)
                if (hoursSinceBooking <= 48 && daysUntilCheckIn >= 14) {
                    travelerRefundRate = 1.0;
                    hostPayoutRate = 0.0;
                } else if (daysUntilCheckIn >= 14) {
                    travelerRefundRate = 0.5;
                    hostPayoutRate = 0.5;
                } else {
                    travelerRefundRate = 0.0;
                    hostPayoutRate = 1.0;
                }
            } else {
                // Défaut : flexible
                if (hoursUntilCheckIn >= 24) {
                    travelerRefundRate = 1.0;
                    hostPayoutRate = 0.0;
                } else {
                    travelerRefundRate = 0.0;
                    hostPayoutRate = 1.0;
                }
            }

            // Calcul remboursement voyageur :
            // Nuitées remboursées + Frais de ménage remboursés à 100% (non consommé)
            let refundAmount = Math.round(((baseNights * travelerRefundRate) + cleaningFee) * 100) / 100;
            if (travelerRefundRate === 0 && cleaningFee === 0) {
                refundAmount = 0;
            }

            // Déduction des frais Stripe réduits selon PlatformConfig (1.2% + 0.18€) uniquement si annulation voyageur
            let stripeFeeDeducted = 0;
            if (!isHostCancelling && booking.paymentMethod === 'stripe' && refundAmount > 0) {
                const stripePct = platformConfig.stripeFeePercent !== undefined ? platformConfig.stripeFeePercent : 0.012;
                const stripeFixed = platformConfig.stripeFeeFixed !== undefined ? platformConfig.stripeFeeFixed : 0.18;
                stripeFeeDeducted = Math.round((booking.pricing.total * stripePct + stripeFixed) * 100) / 100;
                refundAmount = Math.max(0, Math.round((refundAmount - stripeFeeDeducted) * 100) / 100);
            }

            // Calcul du versement hôte (si annulation par le voyageur selon barème). Si l'hôte annule : 0
            let hostPayoutAmount = 0;
            if (!isHostCancelling && hostPayoutRate > 0) {
                hostPayoutAmount = Math.max(0, Math.round((baseNights * hostPayoutRate * (1 - hostCommissionRate)) * 100) / 100);
            }

            // Mettre à jour le RIB de l'utilisateur si fourni
            if (rib && rib.trim().length > 0) {
                const User = require('../models/User');
                await User.findByIdAndUpdate(userId, { rib: rib.trim() });
            }

            await booking.cancel(userId, reason, refundAmount, rib, stripeFeeDeducted, policy, hostPayoutAmount, hostCancellationFee, hostCancellationFeeRate, datesBlocked, cancelledByRole);
            await booking.populate([
                { path: 'guest', select: 'firstName lastName email' },
                { path: 'host', select: 'firstName lastName email' },
                { path: 'listing', select: 'title cancellationPolicy' }
            ]);

            // Notification et email d'annulation :
            // Si l'hôte annule, la notification et l'email sont envoyés uniquement au voyageur
            const recipientEmail = isHostCancelling ? booking.guest.email : booking.host.email;

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
                normalizeBookingDate(checkIn),
                normalizeBookingDate(checkOut)
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

            const normStart = normalizeBookingDate(startDate);
            const normEnd = normalizeBookingDate(endDate);

            // Récupérer toutes les réservations confirmées ou en attente dans la période
            const bookings = await Booking.find({
                listing: listingId,
                status: { $in: ['confirmed', 'pending'] },
                $or: [
                    { checkIn: { $gte: normStart, $lte: normEnd } },
                    { checkOut: { $gte: normStart, $lte: normEnd } },
                    { checkIn: { $lte: normStart }, checkOut: { $gte: normEnd } }
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
            const rangeStart = normStart;
            const rangeEnd = normEnd;
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