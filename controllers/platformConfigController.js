const PlatformConfig = require('../models/PlatformConfig');

class PlatformConfigController {
  // Obtenir les frais actuels (accessible par le mobile voyageur/hôte et le backoffice)
  async getFees(req, res, next) {
    try {
      const config = await PlatformConfig.getOrCreateDefault();
      res.status(200).json({
        success: true,
        data: {
          guestServiceFeeRate: config.guestServiceFeeRate,
          hostServiceFeeRate: config.hostServiceFeeRate,
          stripeFeePercent: config.stripeFeePercent,
          stripeFeeFixed: config.stripeFeeFixed,
          cancellationGracePeriodHours: config.cancellationGracePeriodHours,
          cancellationFeeRate: config.cancellationFeeRate,
          currency: config.currency,
          updatedAt: config.updatedAt
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Mettre à jour les frais depuis le backoffice (Admin)
  async updateFees(req, res, next) {
    try {
      const {
        guestServiceFeeRate,
        hostServiceFeeRate,
        stripeFeePercent,
        stripeFeeFixed,
        cancellationGracePeriodHours,
        cancellationFeeRate,
        currency
      } = req.body;

      const config = await PlatformConfig.getOrCreateDefault();

      if (guestServiceFeeRate !== undefined) {
        if (guestServiceFeeRate < 0 || guestServiceFeeRate > 0.5) {
          return res.status(400).json({
            success: false,
            message: 'Le taux voyageur doit être entre 0% et 50%'
          });
        }
        config.guestServiceFeeRate = Number(guestServiceFeeRate);
      }

      if (hostServiceFeeRate !== undefined) {
        if (hostServiceFeeRate < 0 || hostServiceFeeRate > 0.3) {
          return res.status(400).json({
            success: false,
            message: 'Le taux hôte doit être entre 0% et 30%'
          });
        }
        config.hostServiceFeeRate = Number(hostServiceFeeRate);
      }

      if (stripeFeePercent !== undefined) {
        if (stripeFeePercent < 0) {
          return res.status(400).json({
            success: false,
            message: 'Le pourcentage Stripe ne peut pas être négatif'
          });
        }
        config.stripeFeePercent = Number(stripeFeePercent);
      }

      if (stripeFeeFixed !== undefined) {
        if (stripeFeeFixed < 0) {
          return res.status(400).json({
            success: false,
            message: 'Le frais fixe Stripe ne peut pas être négatif'
          });
        }
        config.stripeFeeFixed = Number(stripeFeeFixed);
      }

      if (cancellationGracePeriodHours !== undefined) {
        if (cancellationGracePeriodHours < 0) {
          return res.status(400).json({
            success: false,
            message: 'Le délai de grâce ne peut pas être négatif'
          });
        }
        config.cancellationGracePeriodHours = Number(cancellationGracePeriodHours);
      }

      if (cancellationFeeRate !== undefined) {
        if (cancellationFeeRate < 0 || cancellationFeeRate > 1.0) {
          return res.status(400).json({
            success: false,
            message: 'Le taux de frais d\'annulation doit être entre 0% et 100%'
          });
        }
        config.cancellationFeeRate = Number(cancellationFeeRate);
      }

      if (currency && ['EUR', 'USD', 'TND'].includes(currency)) {
        config.currency = currency;
      }

      if (req.admin && req.admin.adminId) {
        config.updatedBy = req.admin.adminId;
      }

      await config.save();

      console.log('✅ Configuration des frais mise à jour avec succès:', {
        guestServiceFeeRate: config.guestServiceFeeRate,
        hostServiceFeeRate: config.hostServiceFeeRate,
        stripeFeePercent: config.stripeFeePercent,
        stripeFeeFixed: config.stripeFeeFixed,
        cancellationGracePeriodHours: config.cancellationGracePeriodHours,
        cancellationFeeRate: config.cancellationFeeRate
      });

      res.status(200).json({
        success: true,
        message: 'Frais de la plateforme mis à jour avec succès',
        data: config
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PlatformConfigController();
