const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const { protect, authorize } = require('../middlewares/auth');
const { upload } = require('../middlewares/upload');

/**
 * Certificate Routes
 * Base URL: /api/certificates
 */

// Public routes
router.get('/', certificateController.getAllCertificates);
router.get('/all', certificateController.getAllCertificatesNoPagination);
router.get('/:id', certificateController.getCertificateById);

// Admin routes
router.post(
  '/',
  protect,
  authorize('admin'),
  upload.single('image'),
  certificateController.createCertificate
);

router.put(
  '/:id',
  protect,
  authorize('admin'),
  upload.single('image'),
  certificateController.updateCertificate
);

router.delete(
  '/:id',
  protect,
  authorize('admin'),
  certificateController.deleteCertificate
);

router.delete(
  '/:id/image',
  protect,
  authorize('admin'),
  certificateController.deleteCertificateImage
);

module.exports = router;