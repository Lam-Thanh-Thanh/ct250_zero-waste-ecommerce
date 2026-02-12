const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { protect, authorize } = require('../middlewares/auth');
const { upload } = require('../middlewares/upload');

/**
 * Category Routes
 * Base URL: /api/categories
 */

// Public routes
router.get('/', categoryController.getAllCategories);
router.get('/all', categoryController.getAllCategoriesNoPagination);
router.get('/:id', categoryController.getCategoryById);

// Admin routes
router.post(
    '/',
    protect,
    authorize('admin'),
    upload.single('image'),
    categoryController.createCategory
);

router.put(
    '/:id',
    protect,
    authorize('admin'),
    upload.single('image'),
    categoryController.updateCategory
);

router.delete(
    '/:id',
    protect,
    authorize('admin'),
    categoryController.deleteCategory
);

router.delete(
    '/:id/image',
    protect,
    authorize('admin'),
    categoryController.deleteCategoryImage
);

module.exports = router;