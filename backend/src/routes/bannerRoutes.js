const express = require('express');
const router = express.Router();
const {
    getBanners,
    getAllBanners,
    createBanner,
    updateBanner,
    deleteBanner
} = require('../controllers/bannerController');
const { protect, authorize } = require('../middlewares/auth');
const { upload } = require('../middlewares/upload');

// Public routes
router.get('/', getBanners);

// Admin routes
router.get('/all', protect, authorize('admin'), getAllBanners);
router.post('/', protect, authorize('admin'), upload.single('image'), createBanner);
router.put('/:id', protect, authorize('admin'), upload.single('image'), updateBanner);
router.delete('/:id', protect, authorize('admin'), deleteBanner);

module.exports = router;
