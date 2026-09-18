const notificationService = require('../services/notificationService');
const emailService = require('../services/emailService');
const User = require('../models/User');

class ChatController {
  /**
   * Envoyer une notification de nouveau message
   * POST /api/chat/send-notification
   */
  async sendChatNotification(req, res, next) {
    try {
      const senderId = req.user.userId;
      const { recipientId, senderName, messageText, chatId, checkIn, checkOut, listingTitle } = req.body;

      if (!recipientId || !senderName || !messageText || !chatId) {
        return res.status(400).json({
          success: false,
          message: 'Données manquantes (recipientId, senderName, messageText, chatId requis)',
        });
      }

      const sender = await User.findById(senderId).select('firstName lastName');
      if (!sender) {
        return res.status(404).json({ success: false, message: 'Expéditeur non trouvé' });
      }

      const fullName = `${sender.firstName} ${sender.lastName}`;
      if (fullName !== senderName) {
        return res.status(403).json({ success: false, message: "Nom de l'expéditeur ne correspond pas" });
      }

      const recipient = await User.findById(recipientId).select('fcmToken firstName lastName email');
      if (!recipient) {
        return res.status(404).json({ success: false, message: 'Destinataire non trouvé' });
      }

      if (senderId === recipientId) {
        return res.status(400).json({ success: false, message: "Impossible d'envoyer une notification à soi-même" });
      }

      let displayText = messageText;
      if (displayText.length > 100) displayText = displayText.substring(0, 100) + '...';

      // Construire l'objet email style Airbnb :
      // "Objet : Demande d'information pour [titre], [jourA]–[jourD] [mois]"
      let emailSubject = `Demande d'information — ${senderName}`;
      if (checkIn && checkOut && listingTitle) {
        const dIn = new Date(checkIn);
        const dOut = new Date(checkOut);
        const sameMonth = dIn.getMonth() === dOut.getMonth() && dIn.getFullYear() === dOut.getFullYear();
        const monthName = dIn.toLocaleDateString('fr-FR', { month: 'long' });
        const yearStr = dIn.getFullYear() !== new Date().getFullYear() ? ` ${dIn.getFullYear()}` : '';
        const dateRange = sameMonth
          ? `${dIn.getDate()}–${dOut.getDate()} ${monthName}${yearStr}`
          : `${dIn.getDate()} ${dIn.toLocaleDateString('fr-FR', { month: 'long' })} – ${dOut.getDate()} ${dOut.toLocaleDateString('fr-FR', { month: 'long' })}${yearStr}`;
        emailSubject = `Objet : Demande d'information pour ${listingTitle}, ${dateRange}`;
      } else if (listingTitle) {
        emailSubject = `Objet : Nouveau message concernant ${listingTitle}`;
      }

      const result = await notificationService.sendNotificationToUser(
        recipientId,
        `💬 ${senderName}`,
        displayText,
        { type: 'chat_message', chatId, senderId, senderName }
      );

      // Email Gmail en parallèle
      if (recipient.email) {
        emailService.sendChatMessageEmail(
          recipient.email,
          recipient.firstName,
          senderName,
          messageText,
          chatId,
          emailSubject,
          checkIn,
          checkOut
        ).catch(err => console.error('Erreur envoi email chat:', err));
      }

      return res.status(200).json({
        success: true,
        message: 'Notification envoyée avec succès',
        data: { recipient: `${recipient.firstName} ${recipient.lastName}`, messageId: result.messageId },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir les informations d'un chat (pour vérification)
   * GET /api/chat/:chatId/info
   */
  async getChatInfo(req, res, next) {
    try {
      const userId = req.user.userId;
      const { chatId } = req.params;

      // TODO: Implémenter la récupération des infos du chat depuis Firebase
      // Pour l'instant, retourner une réponse basique
      
      res.status(200).json({
        success: true,
        data: {
          chatId,
          userId,
          message: 'Endpoint à implémenter avec Firebase Admin SDK',
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ChatController();
