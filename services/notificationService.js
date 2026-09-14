const admin = require('firebase-admin');
const User = require('../models/User');

class NotificationService {
  /**
   * Envoyer une notification FCM à un utilisateur
   * @param {String} userId - ID de l'utilisateur destinataire
   * @param {String} title - Titre de la notification
   * @param {String} body - Corps de la notification
   * @param {Object} data - Données supplémentaires
   * @returns {Promise<Object>}
   */
  async sendNotificationToUser(userId, title, body, data = {}) {
    try {
      // Récupérer l'utilisateur et son token FCM
      const user = await User.findById(userId).select('fcmToken firstName lastName');

      if (!user) {
        console.log(`Utilisateur ${userId} non trouvé`);
        return { success: false, message: 'Utilisateur non trouvé' };
      }

      if (!user.fcmToken) {
        console.log(`Utilisateur ${user.firstName} ${user.lastName} n'a pas de token FCM`);
        return { success: false, message: 'Token FCM non disponible' };
      }

      // Préparer le message
      const message = {
        token: user.fcmToken,
        notification: {
          title,
          body
        },
        data: {
          ...data,
          click_action: 'FLUTTER_NOTIFICATION_CLICK'
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'booking_notifications'
          }
        },
        apns: {
          headers: {
            'apns-priority': '10'
          },
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        }
      };

      // Envoyer la notification
      const response = await admin.messaging().send(message);
      console.log(`Notification envoyée avec succès à ${user.firstName} ${user.lastName}:`, response);

      return {
        success: true,
        messageId: response,
        recipient: `${user.firstName} ${user.lastName}`
      };
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification:', error);

      // Si le token est invalide, le supprimer de la base de données
      if (error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered') {
        await User.findByIdAndUpdate(userId, { $set: { fcmToken: null } });
        console.log(`Token FCM invalide supprimé pour l'utilisateur ${userId}`);
      }

      return {
        success: false,
        message: error.message,
        code: error.code
      };
    }
  }

  /**
   * Envoyer une notification de nouvelle réservation à l'hôte
   */
  async notifyNewBooking(booking) {
    try {
      const title = '🎉 Nouvelle réservation !';
      const body = `${booking.guest.firstName} souhaite réserver votre propriété du ${this.formatDate(booking.checkIn)} au ${this.formatDate(booking.checkOut)}`;

      const data = {
        type: 'new_booking',
        bookingId: booking._id.toString(),
        guestId: booking.guest._id.toString(),
        listingId: booking.listing._id.toString(),
        status: booking.status
      };

      return await this.sendNotificationToUser(booking.host._id, title, body, data);
    } catch (error) {
      console.error('Erreur notifyNewBooking:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Envoyer une notification de confirmation de réservation au voyageur
   */
  async notifyBookingConfirmed(booking) {
    try {
      const checkInStr = this.formatDate(booking.checkIn);
      const checkOutStr = this.formatDate(booking.checkOut);
      const totalAmount = booking.pricing?.total ? `${booking.pricing.total} ${booking.pricing.currency || 'EUR'}` : '';

      // Notifier le voyageur
      const guestTitle = '✅ Paiement effectué et réservation confirmée !';
      const guestBody = `Votre paiement ${totalAmount ? `(${totalAmount}) ` : ''}a été validé. Votre réservation chez ${booking.host.firstName} est confirmée du ${checkInStr} au ${checkOutStr}.`;

      const guestData = {
        type: 'booking_confirmed',
        bookingId: booking._id.toString(),
        hostId: booking.host._id.toString(),
        listingId: booking.listing._id.toString(),
        status: 'confirmed'
      };

      const guestNotif = await this.sendNotificationToUser(booking.guest._id, guestTitle, guestBody, guestData);

      // Notifier l'hôte
      const hostTitle = '🎉 Paiement reçu et réservation confirmée !';
      const hostBody = `Paiement validé ${totalAmount ? `(${totalAmount}) ` : ''}! ${booking.guest.firstName} ${booking.guest.lastName} a réservé votre logement du ${checkInStr} au ${checkOutStr}.`;

      const hostData = {
        type: 'booking_confirmed',
        bookingId: booking._id.toString(),
        guestId: booking.guest._id.toString(),
        listingId: booking.listing._id.toString(),
        status: 'confirmed'
      };

      const hostNotif = await this.sendNotificationToUser(booking.host._id, hostTitle, hostBody, hostData);

      return {
        success: true,
        guestNotification: guestNotif,
        hostNotification: hostNotif
      };
    } catch (error) {
      console.error('Erreur notifyBookingConfirmed:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Envoyer une notification de rejet de réservation au voyageur
   */
  async notifyBookingRejected(booking) {
    try {
      const title = '❌ Réservation refusée';
      const body = `Votre demande de réservation chez ${booking.host.firstName} a été refusée`;

      const data = {
        type: 'booking_rejected',
        bookingId: booking._id.toString(),
        hostId: booking.host._id.toString(),
        listingId: booking.listing._id.toString(),
        status: 'rejected'
      };

      return await this.sendNotificationToUser(booking.guest._id, title, body, data);
    } catch (error) {
      console.error('Erreur notifyBookingRejected:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Envoyer une notification d'annulation de réservation
   */
  async notifyBookingCancelled(booking, cancelledByUserId) {
    try {
      const hostIdStr = (booking.host._id || booking.host).toString();
      const guestIdStr = (booking.guest._id || booking.guest).toString();
      const isCancelledByHost = hostIdStr === cancelledByUserId.toString() || booking.cancellation?.cancelledByRole === 'host';
      const cancelledByGuest = !isCancelledByHost;

      const hostId = booking.host._id || booking.host;
      const guestId = booking.guest._id || booking.guest;
      const refundAmount = booking.cancellation?.refundAmount || 0;
      const currency = booking.pricing?.currency || 'EUR';

      let hostResult = null;
      // 1. Notification pour l'hôte : UNIQUEMENT si l'annulation a été faite par le voyageur !
      // Si l'hôte a lui-même annulé, il ne reçoit pas de notification ("pas pour l'hôte").
      if (cancelledByGuest) {
        const cancellerName = booking.guest?.firstName || 'Le voyageur';
        const hostTitle = '🚫 Réservation annulée par le voyageur';
        const hostBody = `${cancellerName} a annulé sa réservation du ${this.formatDate(booking.checkIn)}`;

        const hostData = {
          type: 'booking_cancelled',
          bookingId: booking._id.toString(),
          cancelledBy: 'guest',
          listingId: (booking.listing._id || booking.listing).toString(),
          status: 'cancelled'
        };

        hostResult = await this.sendNotificationToUser(hostId, hostTitle, hostBody, hostData);
      }

      // 2. Notification pour le voyageur (avec confirmation d'annulation et remboursement par virement)
      const guestTitle = isCancelledByHost
        ? "🚫 Réservation annulée par l'hôte"
        : '🚫 Annulation de réservation';

      const guestBody = isCancelledByHost
        ? `L'hôte ${booking.host?.firstName ? booking.host.firstName + ' ' : ''}a annulé votre réservation du ${this.formatDate(booking.checkIn)}. Vous bénéficiez d'un remboursement intégral qui vous sera versé par virement bancaire sur votre RIB.`
        : (refundAmount > 0
            ? `Votre réservation a été annulée. Un remboursement de ${refundAmount.toFixed(2)} ${currency} vous sera versé par virement bancaire sur votre RIB.`
            : `Votre réservation du ${this.formatDate(booking.checkIn)} a été annulée.`);

      const guestData = {
        type: 'booking_cancelled',
        bookingId: booking._id.toString(),
        cancelledBy: isCancelledByHost ? 'host' : 'guest',
        listingId: (booking.listing._id || booking.listing).toString(),
        refundAmount: refundAmount.toString(),
        refundMethod: 'bank_transfer',
        status: 'cancelled'
      };

      const guestResult = await this.sendNotificationToUser(guestId, guestTitle, guestBody, guestData);

      return { success: true, hostResult, guestResult };
    } catch (error) {
      console.error('Erreur notifyBookingCancelled:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Envoyer une notification de réservation terminée
   */
  async notifyBookingCompleted(booking) {
    try {
      // Notifier le voyageur
      const guestTitle = '🎊 Séjour terminé !';
      const guestBody = `Merci d'avoir séjourné chez ${booking.host.firstName}. N'oubliez pas de laisser un avis !`;

      const guestData = {
        type: 'booking_completed',
        bookingId: booking._id.toString(),
        hostId: booking.host._id.toString(),
        listingId: booking.listing._id.toString(),
        action: 'leave_review'
      };

      // Notifier l'hôte
      const hostTitle = '🎊 Séjour terminé !';
      const hostBody = `Le séjour de ${booking.guest.firstName} est terminé. N'oubliez pas de laisser un avis !`;

      const hostData = {
        type: 'booking_completed',
        bookingId: booking._id.toString(),
        guestId: booking.guest._id.toString(),
        listingId: booking.listing._id.toString(),
        action: 'leave_review'
      };

      // Envoyer les deux notifications
      const guestNotif = await this.sendNotificationToUser(booking.guest._id, guestTitle, guestBody, guestData);
      const hostNotif = await this.sendNotificationToUser(booking.host._id, hostTitle, hostBody, hostData);

      return {
        success: true,
        guestNotification: guestNotif,
        hostNotification: hostNotif
      };
    } catch (error) {
      console.error('Erreur notifyBookingCompleted:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Envoyer un rappel de check-in
   */
  async notifyCheckInReminder(booking) {
    try {
      const title = '🏠 Rappel de check-in';
      const body = `Votre check-in chez ${booking.host.firstName} est prévu demain !`;

      const data = {
        type: 'checkin_reminder',
        bookingId: booking._id.toString(),
        hostId: booking.host._id.toString(),
        listingId: booking.listing._id.toString(),
        checkInDate: booking.checkIn.toISOString()
      };

      return await this.sendNotificationToUser(booking.guest._id, title, body, data);
    } catch (error) {
      console.error('Erreur notifyCheckInReminder:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Envoyer une notification aux modérateurs (admins) lors d'un signalement
   */
  async notifyModeratorsReport(report) {
    try {
      const admins = await User.find({ role: 'admin' }).select('fcmToken');

      const title = '⚠️ Nouveau signalement !';
      const body = `Un nouveau signalement pour "${report.reason}" a été reçu et nécessite une action sous 24h.`;

      const data = {
        type: 'new_report',
        reportId: report._id.toString(),
        reason: report.reason
      };

      const results = [];
      for (const adminUser of admins) {
        if (adminUser.fcmToken) {
          results.push(await this.sendNotificationToUser(adminUser._id, title, body, data));
        }
      }

      console.log(`Signalement notifié à ${results.filter(r => r.success).length} administrateurs`);
      return results;
    } catch (error) {
      console.error('Erreur notifyModeratorsReport:', error);
      return [];
    }
  }

  /**
   * Envoyer une notification FCM à tous les utilisateurs (Broadcast)
   * @param {String} title - Titre de la notification
   * @param {String} body - Corps de la notification
   * @param {Object} data - Données supplémentaires
   * @returns {Promise<Object>}
   */
  async sendBroadcastNotification(title, body, data = {}) {
    try {
      // Pour l'instant on utilise multicat ou une boucle 
      // Si trop d'utilisateurs, il faudrait utiliser Topics ou une file d'attente
      const users = await User.find({ fcmToken: { $ne: null } }).select('fcmToken');
      const tokens = users.map(u => u.fcmToken);

      if (tokens.length === 0) {
        return { success: false, message: 'Aucun utilisateur avec un token FCM trouvé.' };
      }

      const message = {
        notification: {
          title,
          body
        },
        data: {
          ...data,
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
          type: 'broadcast'
        },
        tokens: tokens // sendMulticast accepte un tableau de tokens
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      console.log(`${response.successCount} notifications envoyées avec succès.`);
      console.log(`${response.failureCount} échecs.`);

      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
        total: tokens.length
      };
    } catch (error) {
      console.error('Erreur lors de l\'envoi broadcast:', error);
      throw error;
    }
  }

  /**
   * Formater une date en format lisible
   */
  formatDate(date) {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(date).toLocaleDateString('fr-FR', options);
  }
}

module.exports = new NotificationService();
