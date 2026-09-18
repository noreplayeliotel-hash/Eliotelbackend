const express = require('express');
const updateController = require('../controllers/updateController');
const { auth, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Récupérer la configuration (Public)
router.get('/:identifier', updateController.getUpdateConfig);

// Mettre à jour la configuration (Admin)
// router.put('/:identifier', auth, isAdmin, updateController.updateConfig);
router.put('/:identifier', updateController.updateConfig); // Pour les tests, on laisse ouvert ou on décommente auth/isAdmin en prod

module.exports = router;
