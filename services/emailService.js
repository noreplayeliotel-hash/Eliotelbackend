const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }

    async sendChatMessageEmail(to, recipientFirstName, senderName, messageText, chatId, subject, checkIn, checkOut) {
        const emailSubject = subject || `Nouveau message de ${senderName}`;

        // Bloc dates si présentes
        let datesBlock = '';
        if (checkIn && checkOut) {
            const fmt = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
            const nights = Math.round((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
            datesBlock = `
            <div style="background-color: #fff3f5; border: 1px solid #FF385C; border-radius: 8px; padding: 14px 18px; margin: 16px 0;">
              <div style="font-size: 13px; color: #FF385C; font-weight: bold; margin-bottom: 8px;">📅 Dates demandées</div>
              <div style="font-size: 14px; color: #333;">Arrivée : <strong>${fmt(checkIn)}</strong></div>
              <div style="font-size: 14px; color: #333; margin-top: 4px;">Départ : <strong>${fmt(checkOut)}</strong></div>
              <div style="font-size: 13px; color: #666; margin-top: 4px;">${nights} nuit${nights > 1 ? 's' : ''}</div>
            </div>`;
        }

        const mailOptions = {
            from: `"Eliotel" <${process.env.EMAIL_USER}>`,
            to,
            subject: emailSubject,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <div style="background-color: #FF385C; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 22px;">Nouveau message</h1>
          </div>
          <div style="padding: 28px; background-color: #ffffff; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="font-size: 15px;">Bonjour <strong>${recipientFirstName}</strong>,</p>
            <p style="font-size: 15px;">Vous avez reçu un nouveau message de <strong>${senderName}</strong> :</p>
            ${datesBlock}
            <div style="background-color: #f9f9f9; border-left: 4px solid #FF385C; padding: 16px 20px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; font-size: 15px; color: #444; line-height: 1.6; white-space: pre-line;">${messageText}</p>
            </div>
            <p style="font-size: 13px; color: #888;">Connectez-vous à l'application Eliotel pour répondre à ce message.</p>
            <br>
            <p style="font-size: 14px;">Cordialement,<br><strong>L'équipe Eliotel</strong></p>
          </div>
        </div>
      `
        };

        try {
            await this.transporter.sendMail(mailOptions);
            console.log('Chat message email sent to:', to);
        } catch (error) {
            console.error('Error sending chat message email:', error);
            throw error;
        }
    }

    async sendPasswordResetEmail(to, code) {
        const mailOptions = {
            from: `"Eliotel" <${process.env.EMAIL_USER}>`,
            to,
            subject: 'Réinitialisation de votre mot de passe Eliotel',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF385C;">Réinitialisation du mot de passe</h2>
          <p>Bonjour,</p>
          <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte Eliotel.</p>
          <p>Voici votre code de vérification :</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; font-size: 24px; letter-spacing: 5px; font-weight: bold; color: #333;">
            ${code}
          </div>
          <p>Ce code est valable pendant 15 minutes.</p>
          <p>Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet e-mail.</p>
          <br>
          <p>Cordialement,</p>
          <p>L'équipe Eliotel</p>
        </div>
      `
        };

        try {
            await this.transporter.sendMail(mailOptions);
            console.log('Password reset email sent to:', to);
        } catch (error) {
            console.error('Error sending email:', error);
            throw new Error('Erreur lors de l\'envoi de l\'email');
        }
    }
    async sendNewBookingEmail(to, booking) {
        const mailOptions = {
            from: `"Eliotel" <${process.env.EMAIL_USER}>`,
            to,
            subject: 'Nouvelle demande de réservation !',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF385C;">Nouvelle réservation</h2>
          <p>Bonjour ${booking.host.firstName},</p>
          <p>Vous avez reçu une nouvelle demande de réservation pour <strong>${booking.listing.title}</strong>.</p>
          <p><strong>Voyageur :</strong> ${booking.guest.firstName} ${booking.guest.lastName}</p>
          <p><strong>Dates :</strong> Du ${new Date(booking.checkIn).toLocaleDateString()} au ${new Date(booking.checkOut).toLocaleDateString()}</p>
          <p><strong>Total :</strong> ${booking.pricing.total} ${booking.pricing.currency}</p>
          <p>Connectez-vous à votre tableau de bord pour accepter ou refuser cette demande.</p>
          <br>
          <p>Cordialement,</p>
          <p>L'équipe Eliotel</p>
        </div>
      `
        };

        try {
            await this.transporter.sendMail(mailOptions);
            console.log('New booking email sent to:', to);
        } catch (error) {
            console.error('Error sending email:', error);
        }
    }

    async sendBookingConfirmedEmail(to, booking) {
        const mailOptions = {
            from: `"Eliotel" <${process.env.EMAIL_USER}>`,
            to,
            subject: 'Réservation confirmée !',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF385C;">Réservation confirmée</h2>
          <p>Bonjour ${booking.guest.firstName},</p>
          <p>Votre réservation pour <strong>${booking.listing.title}</strong> a été confirmée par l'hôte.</p>
          <p><strong>Dates :</strong> Du ${new Date(booking.checkIn).toLocaleDateString()} au ${new Date(booking.checkOut).toLocaleDateString()}</p>
          <p>Préparez vos valises !</p>
          <br>
          <p>Cordialement,</p>
          <p>L'équipe Eliotel</p>
        </div>
      `
        };

        try {
            await this.transporter.sendMail(mailOptions);
            console.log('Booking confirmed email sent to:', to);
        } catch (error) {
            console.error('Error sending email:', error);
        }
    }

    async sendBookingRejectedEmail(to, booking) {
        const mailOptions = {
            from: `"Eliotel" <${process.env.EMAIL_USER}>`,
            to,
            subject: 'Mise à jour de votre réservation',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF385C;">Réservation refusée</h2>
          <p>Bonjour ${booking.guest.firstName},</p>
          <p>Malheureusement, votre demande de réservation pour <strong>${booking.listing.title}</strong> a été refusée par l'hôte.</p>
          <p><strong>Raison :</strong> ${booking.hostResponse?.message || 'Non spécifiée'}</p>
          <p>N'hésitez pas à rechercher d'autres logements sur Eliotel.</p>
          <br>
          <p>Cordialement,</p>
          <p>L'équipe Eliotel</p>
        </div>
      `
        };

        try {
            await this.transporter.sendMail(mailOptions);
            console.log('Booking rejected email sent to:', to);
        } catch (error) {
            console.error('Error sending email:', error);
        }
    }

    async sendBookingCancelledEmail(to, booking, cancelledByUserId) {
        const isCancelledByHost = cancelledByUserId.toString() === booking.host._id.toString();
        const recipientName = isCancelledByHost ? booking.guest.firstName : booking.host.firstName;
        const cancellerRole = isCancelledByHost ? "l'hôte" : "le voyageur";

        const mailOptions = {
            from: `"Eliotel" <${process.env.EMAIL_USER}>`,
            to,
            subject: 'Annulation de réservation',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF385C;">Réservation annulée</h2>
          <p>Bonjour ${recipientName},</p>
          <p>La réservation pour <strong>${booking.listing.title}</strong> a été annulée par ${cancellerRole}.</p>
          <p><strong>Dates :</strong> Du ${new Date(booking.checkIn).toLocaleDateString()} au ${new Date(booking.checkOut).toLocaleDateString()}</p>
          <br>
          <p>Cordialement,</p>
          <p>L'équipe Eliotel</p>
        </div>
      `
        };

        try {
            await this.transporter.sendMail(mailOptions);
            console.log('Booking cancelled email sent to:', to);
        } catch (error) {
            console.error('Error sending email:', error);
        }
    }

    async sendBookingCompletedEmail(to, booking, isHost) {
        const name = isHost ? booking.host.firstName : booking.guest.firstName;
        const message = isHost
            ? `Le séjour de ${booking.guest.firstName} à ${booking.listing.title} est terminé.`
            : `Votre séjour à ${booking.listing.title} est terminé.`;

        const mailOptions = {
            from: `"Eliotel" <${process.env.EMAIL_USER}>`,
            to,
            subject: 'Séjour terminé',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
          <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #FF385C;">
            <h1 style="color: #FF385C; margin: 0;">Eliotel</h1>
          </div>
          <div style="padding: 20px;">
            <h2 style="color: #FF385C;">Séjour terminé</h2>
            <p>Bonjour ${name},</p>
            <p>${message}</p>
            <p>Nous espérons que tout s'est bien passé !</p>
          </div>
          <div style="background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #777;">
            <p>Cordialement,<br>L'équipe Eliotel</p>
          </div>
        </div>
      `
        };

        try {
            await this.transporter.sendMail(mailOptions);
            console.log('Booking completed email sent to:', to);
        } catch (error) {
            console.error('Error sending email:', error);
        }
    }

    async sendPaymentConfirmationEmail(host, bookings, totalAmount) {
        const monthYear = new Date(bookings[0].checkIn).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

        const bookingsHtml = bookings.map(b => `
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #eee;">
                    <div style="font-weight: bold; color: #333;">${b.listing.title}</div>
                    <div style="font-size: 12px; color: #666;">Voyageur: ${b.guest.firstName} ${b.guest.lastName}</div>
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; color: #333;">
                    ${b.pricing.total} €
                </td>
            </tr>
        `).join('');

        const mailOptions = {
            from: `"Eliotel" <${process.env.EMAIL_USER}>`,
            to: host.email,
            subject: `Virement Eliotel effectué - ${monthYear}`,
            html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; color: #333;">
            <div style="background-color: #FF385C; padding: 30px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 28px;">Virement Effectué</h1>
                <p style="margin: 10px 0 0; opacity: 0.9;">Votre paiement pour ${monthYear} est en route !</p>
            </div>
            
            <div style="padding: 30px; background-color: white;">
                <p style="font-size: 16px; margin-top: 0;">Bonjour <strong>${host.firstName}</strong>,</p>
                <p style="font-size: 15px; color: #555;">Nous avons le plaisir de vous informer que nous avons procédé au virement de vos revenus locatifs pour le mois de ${monthYear}.</p>
                
                <div style="background-color: #f8f9fa; border-left: 4px solid #FF385C; padding: 20px; margin: 25px 0; border-radius: 4px;">
                    <div style="font-size: 14px; color: #666; margin-bottom: 5px;">Montant Total du Virement</div>
                    <div style="font-size: 32px; font-weight: bold; color: #FF385C;">${totalAmount.toLocaleString()} €</div>
                    <div style="margin-top: 15px; font-size: 13px; color: #666; border-top: 1px solid #eee; padding-top: 10px;">
                        <strong>RIB de destination :</strong><br>
                        <span style="font-family: monospace; font-size: 14px;">${host.rib || 'Non renseigné'}</span>
                    </div>
                </div>

                <h3 style="color: #333; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px; margin-top: 35px;">Détails des Réservations</h3>
                <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                    <thead>
                        <tr style="background-color: #f9f9f9;">
                            <th style="padding: 12px; text-align: left; font-size: 13px; color: #666;">Description</th>
                            <th style="padding: 12px; text-align: right; font-size: 13px; color: #666;">Montant</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${bookingsHtml}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td style="padding: 15px 12px; text-align: right; font-weight: bold; font-size: 16px;">Total versé :</td>
                            <td style="padding: 15px 12px; text-align: right; font-weight: bold; font-size: 20px; color: #FF385C;">${totalAmount.toLocaleString()} €</td>
                        </tr>
                    </tfoot>
                </table>

                <div style="margin-top: 40px; padding: 25px; border-radius: 12px; background-color: #fff8f8; border: 1px dashed #FF385C; text-align: center;">
                    <p style="margin: 0; font-size: 14px; color: #d32f2f;">Le délai de réception sur votre compte dépend de votre établissement bancaire (généralement 24h à 72h ouvrables).</p>
                </div>

                <div style="margin-top: 40px; text-align: center; color: #888; font-size: 13px;">
                    <p>Merci de votre confiance et de votre collaboration avec Eliotel !</p>
                    <p style="margin-top: 15px;">L'équipe Eliotel<br>© ${new Date().getFullYear()} Eliotel</p>
                </div>
            </div>
        </div>
      `
        };

        try {
            await this.transporter.sendMail(mailOptions);
            console.log('Payment confirmation email sent to:', host.email);
        } catch (error) {
            console.error('Error sending payment confirmation email:', error);
        }
    }

    async sendPaymentLinkEmail(guest, booking, paymentLink) {
        const checkInDate = new Date(booking.checkIn).toLocaleDateString('fr-FR', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        });
        const checkOutDate = new Date(booking.checkOut).toLocaleDateString('fr-FR', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        });

        const mailOptions = {
            from: `"Eliotel" <${process.env.EMAIL_USER}>`,
            to: guest.email,
            subject: '💳 Finalisez votre réservation - Paiement requis',
            html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; color: #333;">
            <div style="background-color: #FF385C; padding: 30px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 28px;">💳 Paiement Requis</h1>
                <p style="margin: 10px 0 0; opacity: 0.9;">Finalisez votre réservation</p>
            </div>
            
            <div style="padding: 30px; background-color: white;">
                <p style="font-size: 16px; margin-top: 0;">Bonjour <strong>${guest.firstName}</strong>,</p>
                <p style="font-size: 15px; color: #555;">Votre réservation a été créée avec succès ! Pour la confirmer, veuillez procéder au paiement.</p>
                
                <div style="background-color: #f8f9fa; border-left: 4px solid #FF385C; padding: 20px; margin: 25px 0; border-radius: 4px;">
                    <h3 style="margin-top: 0; color: #333;">Détails de la réservation</h3>
                    <div style="margin: 10px 0;">
                        <strong>Annonce :</strong> ${booking.listing.title}
                    </div>
                    <div style="margin: 10px 0;">
                        <strong>Dates :</strong> Du ${checkInDate} au ${checkOutDate}
                    </div>
                    <div style="margin: 10px 0;">
                        <strong>Voyageurs :</strong> ${booking.guests.adults} adulte(s)
                    </div>
                    <div style="margin: 15px 0; padding-top: 15px; border-top: 1px solid #eee;">
                        <div style="font-size: 14px; color: #666; margin-bottom: 5px;">Montant Total</div>
                        <div style="font-size: 32px; font-weight: bold; color: #FF385C;">${booking.pricing.total} ${booking.pricing.currency}</div>
                    </div>
                </div>

                <div style="text-align: center; margin: 35px 0;">
                    <a href="${paymentLink}" style="display: inline-block; background-color: #FF385C; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 12px rgba(255, 56, 92, 0.3);">
                        Payer Maintenant
                    </a>
                </div>

                <div style="background-color: #fff8e1; padding: 20px; border-radius: 8px; margin: 25px 0;">
                    <p style="margin: 0; font-size: 14px; color: #f57c00;">
                        <strong>⏰ Important :</strong> Ce lien de paiement est valable pendant 24 heures. Passé ce délai, votre réservation sera automatiquement annulée.
                    </p>
                </div>

                <div style="margin-top: 30px; padding: 20px; background-color: #f9f9f9; border-radius: 8px;">
                    <h4 style="margin-top: 0; color: #333;">Paiement sécurisé avec Konnect</h4>
                    <p style="font-size: 13px; color: #666; margin: 5px 0;">
                        ✓ Paiement par carte bancaire<br>
                        ✓ Paiement par e-Dinar<br>
                        ✓ Paiement par wallet Konnect<br>
                        ✓ Transaction 100% sécurisée
                    </p>
                </div>

                <div style="margin-top: 40px; text-align: center; color: #888; font-size: 13px;">
                    <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
                    <p style="margin-top: 15px;">L'équipe Eliotel<br>© ${new Date().getFullYear()} Eliotel</p>
                </div>
            </div>
        </div>
      `
        };

        try {
            await this.transporter.sendMail(mailOptions);
            console.log('Payment link email sent to:', guest.email);
        } catch (error) {
            console.error('Error sending payment link email:', error);
            throw new Error('Erreur lors de l\'envoi de l\'email de paiement');
        }
    }
}

module.exports = new EmailService();
