const express = require('express');
const listingController = require('../controllers/listingController');
const { auth, requireHost, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadToImageServer } = require('../middleware/upload');
const {
  validateListingUpdate,
  validateStatusUpdate,
  validateObjectId,
  validateUserObjectId,
  validateCoordinates
} = require('../middleware/validation');

const router = express.Router();

// Routes publiques
router.get('/', optionalAuth, listingController.getListings);
router.get('/search/available', optionalAuth, listingController.searchAvailableListings);
router.get('/search/nearby', [validateCoordinates, optionalAuth], listingController.searchNearby);
router.get('/suggestions', listingController.getLocationSuggestions);
router.get('/host/:hostId', [validateUserObjectId, optionalAuth], listingController.getListingsByHostId);

// Routes spécifiques AVANT l'authentification pour éviter les conflits
router.get('/my/listings', auth, requireHost, listingController.getHostListings);
router.get('/my/stats', auth, requireHost, listingController.getListingStats);

// Route publique pour obtenir un listing par ID (doit être avant router.use(auth))
router.get('/:listingId', [validateUserObjectId, optionalAuth], listingController.getListingById);

// Routes protégées (authentification requise)
router.use(auth);

// Routes pour les hôtes
router.post('/', [requireHost, upload.array('images', 10), uploadToImageServer], listingController.createListing);

router.put('/:listingId', [requireHost, upload.array('newImages', 10), uploadToImageServer, validateObjectId, validateListingUpdate], listingController.updateListing);
router.delete('/:listingId', [requireHost, validateObjectId], listingController.deleteListing);
router.patch('/:listingId/status', [requireHost, validateObjectId, validateStatusUpdate], listingController.updateListingStatus);

// Routes pour les blocs externes (dates indisponibles)
router.get('/:listingId/external-blocks', [auth, requireHost], listingController.getExternalBlocks);
router.post('/:listingId/external-blocks', [auth, requireHost], listingController.addExternalBlock);
router.delete('/:listingId/external-blocks/:blockId', [auth, requireHost], listingController.deleteExternalBlock);

module.exports = router;