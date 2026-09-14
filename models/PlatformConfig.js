const mongoose = require('mongoose');

const platformConfigSchema = new mongoose.Schema({
  identifier: {
    type: String,
    required: true,
    unique: true,
    default: 'default_platform_config'
  },
  // Frais de service voyageur (ex: 12% = 0.12, aligné Airbnb)
  guestServiceFeeRate: {
    type: Number,
    required: true,
    default: 0.12,
    min: [0, 'Le taux ne peut pas être négatif'],
    max: [0.5, 'Le taux ne peut pas dépasser 50%']
  },
  // Frais de service / commission hôte (ex: 3% = 0.03, aligné Airbnb)
  hostServiceFeeRate: {
    type: Number,
    required: true,
    default: 0.03,
    min: [0, 'Le taux ne peut pas être négatif'],
    max: [0.3, 'Le taux ne peut pas dépasser 30%']
  },
  // Pourcentage Stripe réduit (ex: 1.2% = 0.012 comme Airbnb grands comptes)
  stripeFeePercent: {
    type: Number,
    required: true,
    default: 0.012,
    min: [0, 'Le pourcentage Stripe ne peut pas être négatif']
  },
  // Frais fixe Stripe réduit (ex: 0.18€)
  stripeFeeFixed: {
    type: Number,
    required: true,
    default: 0.18,
    min: [0, 'Le frais fixe Stripe ne peut pas être négatif']
  },
  // Période d'annulation 100% gratuite (heures après réservation, ex: 48h = 2 jours comme Airbnb)
  cancellationGracePeriodHours: {
    type: Number,
    required: true,
    default: 48,
    min: [0, 'Le délai ne peut pas être négatif']
  },
  // Taux de retenue des frais d'annulation Eliotel / Airbnb (ex: 50% = 0.50 sur l'hébergement)
  cancellationFeeRate: {
    type: Number,
    required: true,
    default: 0.50,
    min: [0, 'Le taux de frais d\'annulation ne peut pas être négatif'],
    max: [1.0, 'Le taux ne peut pas dépasser 100%']
  },
  // Devise par défaut de la plateforme
  currency: {
    type: String,
    required: true,
    default: 'EUR',
    enum: ['EUR', 'USD', 'TND']
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  }
}, {
  timestamps: true
});

// Récupère la config ou la crée avec les valeurs par défaut
platformConfigSchema.statics.getOrCreateDefault = async function () {
  let config = await this.findOne({ identifier: 'default_platform_config' });
  if (!config) {
    config = await this.create({
      identifier: 'default_platform_config',
      guestServiceFeeRate: 0.12,
      hostServiceFeeRate: 0.03,
      stripeFeePercent: 0.012,
      stripeFeeFixed: 0.18,
      cancellationGracePeriodHours: 48,
      cancellationFeeRate: 0.50,
      currency: 'EUR'
    });
  } else {
    let shouldSave = false;
    // Si la config existait déjà avec les anciens frais plus élevés, on applique les frais diminués
    if (config.stripeFeePercent > 0.012 || config.stripeFeeFixed > 0.18) {
      config.stripeFeePercent = 0.012;
      config.stripeFeeFixed = 0.18;
      shouldSave = true;
    }
    if (config.cancellationGracePeriodHours === undefined || config.cancellationGracePeriodHours === null) {
      config.cancellationGracePeriodHours = 48;
      shouldSave = true;
    }
    if (config.cancellationFeeRate === undefined || config.cancellationFeeRate === null) {
      config.cancellationFeeRate = 0.50;
      shouldSave = true;
    }
    if (shouldSave) {
      await config.save();
    }
  }
  return config;
};

module.exports = mongoose.model('PlatformConfig', platformConfigSchema);
