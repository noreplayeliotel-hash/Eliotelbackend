const UpdateConfig = require('../models/UpdateConfig');

class UpdateController {
    // Récupérer la configuration de mise à jour par son identifiant
    async getUpdateConfig(req, res, next) {
        try {
            const { identifier } = req.params;

            let config = await UpdateConfig.findOne({ identifier });

            // Si aucune configuration n'existe pour cet identifiant, on en crée une par défaut
            if (!config) {
                config = await UpdateConfig.create({
                    identifier: identifier || 'bladigo',
                    minimumVersion: '1.0.0',
                    minimumbuildNumber: '1',
                    iosminimumVersion: '1.0.0',
                    iosminimumbuildNumber: '1',
                    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.bladigo.app',
                    appStoreUrl: 'https://apps.apple.com/app/bladigo/id123456789'
                });
            }

            res.status(200).json(config);
        } catch (error) {
            next(error);
        }
    }

    // Mettre à jour la configuration (Admin)
    async updateConfig(req, res, next) {
        try {
            const { identifier } = req.params;
            const updateData = req.body;

            const config = await UpdateConfig.findOneAndUpdate(
                { identifier },
                { $set: updateData },
                { new: true, upsert: true }
            );

            res.status(200).json({
                success: true,
                data: config
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new UpdateController();
