const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, authorize } = require('../middlewares/auth');
const { upload } = require('../middlewares/upload');

/**
 * Product Routes
 * Base URL: /api/products
 */

// Public routes
router.get('/', productController.getAllProducts);

// Admin routes - Statistics (phải đặt TRƯỚC /:id để tránh conflict)
router.get(
    '/admin/stats',
    protect,
    authorize('admin'),
    productController.getProductStats
);

router.get('/:id', productController.getProductById);

// Admin routes - CRUD
router.post(
    '/',
    protect,
    authorize('admin'),
    upload.array('images', 10), // Cho phép upload tối đa 10 ảnh
    productController.createProduct
);

router.put(
    '/:id',
    protect,
    authorize('admin'),
    upload.array('images', 10),
    productController.updateProduct
);

router.delete(
    '/:id',
    protect,
    authorize('admin'),
    productController.deleteProduct
);

// Admin routes - Image management
router.delete(
    '/:id/images/:imageId',
    protect,
    authorize('admin'),
    productController.deleteProductImage
);

router.put(
    '/:id/images/:imageId/set-main',
    protect,
    authorize('admin'),
    productController.setMainImage
);

// Admin routes - Certificate management
router.post(
    '/:id/certificates',
    protect,
    authorize('admin'),
    productController.addCertificatesToProduct
);

router.delete(
    '/:id/certificates/:certificateId',
    protect,
    authorize('admin'),
    productController.removeCertificateFromProduct
);

// Admin routes - Packaging management
router.put(
    '/:id/packaging',
    protect,
    authorize('admin'),
    productController.setProductPackaging
);

router.delete(
    '/:id/packaging',
    protect,
    authorize('admin'),
    productController.removeProductPackaging
);

module.exports = router;