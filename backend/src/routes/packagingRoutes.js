const express = require('express');
const router = express.Router();
const packagingController = require('../controllers/packagingController');
const { protect, authorize } = require('../middlewares/auth');

/**
 * Packaging Routes
 * Base URL: /api/packagings
 */

// Public routes
router.get('/', packagingController.getAllPackagings);
router.get('/all', packagingController.getAllPackagingsNoPagination);
router.get('/:id', packagingController.getPackagingById);

// Admin routes
router.post(
    '/',
    protect,
    authorize('admin'),
    packagingController.createPackaging
);

router.put(
    '/:id',
    protect,
    authorize('admin'),
    packagingController.updatePackaging
);

router.delete(
    '/:id',
    protect,
    authorize('admin'),
    packagingController.deletePackaging
);

module.exports = router;