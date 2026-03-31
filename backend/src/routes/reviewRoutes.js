const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect, authorize } = require('../middlewares/auth');

/**
 * Review Routes
 * Base URL: /api/reviews
 */

// ===== USER ROUTES (phải đặt TRƯỚC /:id) =====

// User tạo đánh giá (có upload ảnh)
router.post(
    '/',
    protect,
    reviewController.uploadReviewImages,
    reviewController.createReview
);

// Lấy đánh giá của user hiện tại
router.get(
    '/my-reviews',
    protect,
    reviewController.getMyReviews
);

// Lấy sản phẩm có thể đánh giá
router.get(
    '/reviewable',
    protect,
    reviewController.getReviewableProducts
);

// ===== PUBLIC ROUTES =====

// Get reviews for a product
router.get(
    '/product/:productId',
    reviewController.getProductReviews
);

// ===== ADMIN ROUTES =====

// Get statistics
router.get(
    '/stats/overview',
    protect,
    authorize('admin'),
    reviewController.getReviewStats
);

// Get pending reviews
router.get(
    '/pending',
    protect,
    authorize('admin'),
    reviewController.getPendingReviews
);

// Get all reviews (admin)
router.get(
    '/',
    protect,
    authorize('admin'),
    reviewController.getAllReviews
);

// Get single review
router.get(
    '/:id',
    protect,
    authorize('admin'),
    reviewController.getReviewById
);

// Approve review
router.put(
    '/:id/approve',
    protect,
    authorize('admin'),
    reviewController.approveReview
);

// Reject review
router.put(
    '/:id/reject',
    protect,
    authorize('admin'),
    reviewController.rejectReview
);

// Delete review
router.delete(
    '/:id',
    protect,
    authorize('admin'),
    reviewController.deleteReview
);

module.exports = router;
