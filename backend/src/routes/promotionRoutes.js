const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotionController');
const { protect, authorize } = require('../middlewares/auth');

/**
 * Promotion Routes
 * Base URL: /api/promotions
 */

// User routes
router.get(
    '/available',
    protect,
    promotionController.getAvailablePromotions
);

router.post(
    '/validate',
    protect,
    promotionController.validatePromotionCode
);

// Admin routes - CRUD
router.get(
    '/',
    protect,
    authorize('admin'),
    promotionController.getAllPromotions
);

router.get(
    '/:id',
    protect,
    authorize('admin'),
    promotionController.getPromotionById
);

router.post(
    '/',
    protect,
    authorize('admin'),
    promotionController.createPromotion
);

router.put(
    '/:id',
    protect,
    authorize('admin'),
    promotionController.updatePromotion
);

router.delete(
    '/:id',
    protect,
    authorize('admin'),
    promotionController.deletePromotion
);

module.exports = router;
