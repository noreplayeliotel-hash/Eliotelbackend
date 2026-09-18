const Booking = require('../models/Booking');
const notificationService = require('./notificationService');
const emailService = require('./emailService');

class ReminderService {
  /**
   * Retourne une plage de dates pour cibler un jour précis (minuit → minuit+1)
   * @param {number} daysFromNow - Nombre de jours à partir d'aujourd'hui
   */
  _getDayRange(daysFromNow) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() + daysFromNow);

    const end = new Date(start);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  /**
   * Récupère les réservations confirmées dont le checkIn tombe dans une plage donnée
   */
  async _getBookingsForRange(start, end) {
    return Booking.find({
      status: 'confirmed',
      checkIn: { $gte: start, $lte: end }
    }).populate([
      { path: 'listing', select: 'title address images' },
      { path: 'guest', select: 'firstName lastName email fcmToken' },
      { path: 'host', select: 'firstName lastName email fcmToken' }
    ]);
  }

  /**
   * Envoie FCM + email de rappel à l'hôte et au voyageur
   */
  async _sendReminders(booking, type) {
    const fmt = (d) =>
      new Date(d).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

    const checkInStr = fmt(booking.checkIn);
    const checkOutStr = fmt(booking.checkOut);
    const listingTitle = booking.listing?.title || 'votre logement';

    const configs = {
      week: {
        guestTitle: '📅 Rappel : votre séjour dans 7 jours',
        guestBody: `Votre arrivée chez ${booking.host.firstName} est dans 7 jours (${checkInStr}).`,
        hostTitle: '📅 Rappel : un voyageur arrive dans 7 jours',
        hostBody: `${booking.guest.firstName} ${booking.guest.lastName} arrive dans 7 jours (${checkInStr}) pour "${listingTitle}".`,
        emailSubjectGuest: '📅 Rappel - Votre séjour commence dans 7 jours',
        emailSubjectHost: '📅 Rappel - Un voyageur arrive dans 7 jours'
      },
      day: {
        guestTitle: '⏰ Rappel : votre séjour commence demain !',
        guestBody: `Votre arrivée chez ${booking.host.firstName} est demain (${checkInStr}).`,
        hostTitle: '⏰ Rappel : un voyageur arrive demain !',
        hostBody: `${booking.guest.firstName} ${booking.guest.lastName} arrive demain (${checkInStr}) pour "${listingTitle}".`,
        emailSubjectGuest: '⏰ Rappel - Votre séjour commence demain',
        emailSubjectHost: '⏰ Rappel - Un voyageur arrive demain'
      },
      today: {
        guestTitle: "🏠 C'est aujourd'hui ! Bon séjour !",
        guestBody: `Votre check-in chez ${booking.host.firstName} est aujourd'hui (${checkInStr}).`,
        hostTitle: "🏠 Votre voyageur arrive aujourd'hui !",
        hostBody: `${booking.guest.firstName} ${booking.guest.lastName} arrive aujourd'hui pour "${listingTitle}".`,
        emailSubjectGuest: "🏠 Aujourd'hui c'est le grand jour - Bon séjour !",
        emailSubjectHost: "🏠 Votre voyageur arrive aujourd'hui"
      }
    };

    const cfg = configs[type];

    const promises = [
      // FCM voyageur
      notificationService.sendNotificationToUser(
        booking.guest._id,
        cfg.guestTitle,
        cfg.guestBody,
        {
          type: `booking_reminder_${type}`,
          bookingId: booking._id.toString(),
          checkIn: booking.checkIn.toISOString(),
          checkOut: booking.checkOut.toISOString()
        }
      ),
      // FCM hôte
      notificationService.sendNotificationToUser(
        booking.host._id,
        cfg.hostTitle,
        cfg.hostBody,
        {
          type: `booking_reminder_${type}`,
          bookingId: booking._id.toString(),
          checkIn: booking.checkIn.toISOString(),
          checkOut: booking.checkOut.toISOString()
        }
      ),
      // Email voyageur
      emailService.sendBookingReminderEmail(
        booking.guest.email,
        booking.guest.firstName,
        booking,
        type,
        cfg.emailSubjectGuest,
        false
      ),
      // Email hôte
      emailService.sendBookingReminderEmail(
        booking.host.email,
        booking.host.firstName,
        booking,
        type,
        cfg.emailSubjectHost,
        true
      )
    ];

    const results = await Promise.allSettled(promises);
    const failed = results.filter(r => r.status === 'rejected');
    if (failed.length > 0) {
      console.error(`[ReminderService] ${failed.length} erreur(s) pour booking ${booking._id}:`, failed.map(f => f.reason));
    }
  }

  /**
   * Traite les rappels pour un type donné (week / day / today)
   */
  async _processReminders(type, daysFromNow) {
    const { start, end } = this._getDayRange(daysFromNow);
    const bookings = await this._getBookingsForRange(start, end);

    console.log(`[ReminderService] Rappel "${type}" : ${bookings.length} réservation(s) trouvée(s) (checkIn entre ${start.toISOString()} et ${end.toISOString()})`);

    for (const booking of bookings) {
      try {
        await this._sendReminders(booking, type);
        console.log(`[ReminderService] ✅ Rappel "${type}" envoyé pour booking ${booking._id}`);
      } catch (err) {
        console.error(`[ReminderService] ❌ Erreur rappel "${type}" pour booking ${booking._id}:`, err.message);
      }
    }

    return bookings.length;
  }

  /**
   * Point d'entrée principal — appelé par le cron chaque jour
   */
  async runDailyReminders() {
    console.log(`[ReminderService] 🔔 Démarrage des rappels quotidiens — ${new Date().toISOString()}`);

    const [week, day, today] = await Promise.all([
      this._processReminders('week', 7),
      this._processReminders('day', 1),
      this._processReminders('today', 0)
    ]);

    console.log(`[ReminderService] ✅ Terminé — semaine: ${week}, demain: ${day}, aujourd'hui: ${today}`);
    return { week, day, today };
  }
}

module.exports = new ReminderService();
