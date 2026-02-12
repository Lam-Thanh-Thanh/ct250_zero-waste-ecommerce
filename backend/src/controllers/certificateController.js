const Certificate = require('../models/Certificate');
const Product = require('../models/Product');
const { uploadImage, deleteImage } = require('../config/cloudinary');
const { cleanupTempFile } = require('../middlewares/upload');

/**
 * @route   GET /api/certificates
 * @desc    Lấy danh sách certificates (có phân trang, tìm kiếm)
 * @access  Public
 */
exports.getAllCertificates = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      isActive
    } = req.query;

    // Build query
    const query = {};

    // Tìm kiếm theo tên hoặc tổ chức
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { organization: { $regex: search, $options: 'i' } }
      ];
    }

    // Lọc theo trạng thái
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute queries
    const [certificates, total] = await Promise.all([
      Certificate.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Certificate.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: {
        certificates,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalCertificates: total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get All Certificates Error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách chứng chỉ'
    });
  }
};

/**
 * @route   GET /api/certificates/all
 * @desc    Lấy tất cả certificates không phân trang (cho dropdown)
 * @access  Public
 */
exports.getAllCertificatesNoPagination = async (req, res) => {
  try {
    const certificates = await Certificate.find({ isActive: true })
      .select('_id name organization ecoPoints')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: certificates
    });
  } catch (error) {
    console.error('Get All Certificates (No Pagination) Error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách chứng chỉ'
    });
  }
};

/**
 * @route   GET /api/certificates/:id
 * @desc    Lấy thông tin chi tiết 1 certificate
 * @access  Public
 */
exports.getCertificateById = async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chứng chỉ'
      });
    }

    res.status(200).json({
      success: true,
      data: certificate
    });
  } catch (error) {
    console.error('Get Certificate By ID Error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin chứng chỉ'
    });
  }
};

/**
 * @route   POST /api/certificates
 * @desc    Tạo certificate mới (có upload ảnh)
 * @access  Private/Admin
 */
exports.createCertificate = async (req, res) => {
  try {
    const { name, organization, description, issuedDate, ecoPoints, isActive } = req.body;

    // Kiểm tra tên certificate đã tồn tại chưa
    const existingCertificate = await Certificate.findOne({ name });
    if (existingCertificate) {
      if (req.file) cleanupTempFile(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Tên chứng chỉ đã tồn tại'
      });
    }

    // Tạo certificate object
    const certificateData = {
      name,
      organization,
      description,
      issuedDate: issuedDate ? new Date(issuedDate) : Date.now(),
      ecoPoints: ecoPoints ? parseFloat(ecoPoints) : 0,
      isActive: isActive !== undefined ? isActive : true
    };

    // Upload ảnh nếu có
    if (req.file) {
      try {
        const imageResult = await uploadImage(req.file.path, 'zero-waste/certificates');
        certificateData.image = {
          url: imageResult.url,
          publicId: imageResult.publicId
        };
        cleanupTempFile(req.file.path);
      } catch (uploadError) {
        cleanupTempFile(req.file.path);
        return res.status(500).json({
          success: false,
          message: 'Lỗi khi upload hình ảnh'
        });
      }
    }

    // Tạo certificate
    const certificate = await Certificate.create(certificateData);

    res.status(201).json({
      success: true,
      message: 'Tạo chứng chỉ thành công',
      data: certificate
    });
  } catch (error) {
    console.error('Create Certificate Error:', error);
    if (req.file) cleanupTempFile(req.file.path);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo chứng chỉ'
    });
  }
};

/**
 * @route   PUT /api/certificates/:id
 * @desc    Cập nhật certificate (có thể upload ảnh mới)
 * @access  Private/Admin
 */
exports.updateCertificate = async (req, res) => {
  try {
    const { name, organization, description, issuedDate, ecoPoints, isActive } = req.body;

    const certificate = await Certificate.findById(req.params.id);

    if (!certificate) {
      if (req.file) cleanupTempFile(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chứng chỉ'
      });
    }

    // Kiểm tra tên unique (nếu thay đổi)
    if (name && name !== certificate.name) {
      const existingCertificate = await Certificate.findOne({
        name,
        _id: { $ne: req.params.id }
      });

      if (existingCertificate) {
        if (req.file) cleanupTempFile(req.file.path);
        return res.status(400).json({
          success: false,
          message: 'Tên chứng chỉ đã tồn tại'
        });
      }
    }

    // Cập nhật fields
    if (name) certificate.name = name;
    if (organization) certificate.organization = organization;
    if (description !== undefined) certificate.description = description;
    if (issuedDate) certificate.issuedDate = new Date(issuedDate);
    if (ecoPoints !== undefined) certificate.ecoPoints = parseFloat(ecoPoints);
    if (isActive !== undefined) certificate.isActive = isActive;

    // Upload ảnh mới nếu có
    if (req.file) {
      try {
        // Xóa ảnh cũ trên Cloudinary
        if (certificate.image && certificate.image.publicId) {
          await deleteImage(certificate.image.publicId);
        }

        // Upload ảnh mới
        const imageResult = await uploadImage(req.file.path, 'zero-waste/certificates');
        certificate.image = {
          url: imageResult.url,
          publicId: imageResult.publicId
        };

        cleanupTempFile(req.file.path);
      } catch (uploadError) {
        cleanupTempFile(req.file.path);
        return res.status(500).json({
          success: false,
          message: 'Lỗi khi upload hình ảnh'
        });
      }
    }

    await certificate.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật chứng chỉ thành công',
      data: certificate
    });
  } catch (error) {
    console.error('Update Certificate Error:', error);
    if (req.file) cleanupTempFile(req.file.path);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật chứng chỉ'
    });
  }
};

/**
 * @route   DELETE /api/certificates/:id
 * @desc    Xóa certificate (kiểm tra còn sản phẩm sử dụng không)
 * @access  Private/Admin
 */
exports.deleteCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chứng chỉ'
      });
    }

    // Kiểm tra xem còn sản phẩm sử dụng certificate không
    const productsCount = await Product.countDocuments({ 
      certificates: req.params.id 
    });

    if (productsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa chứng chỉ vì còn ${productsCount} sản phẩm đang sử dụng. Vui lòng xóa hoặc chuyển sang chứng chỉ khác.`
      });
    }

    // Xóa ảnh trên Cloudinary nếu có
    if (certificate.image && certificate.image.publicId) {
      try {
        await deleteImage(certificate.image.publicId);
      } catch (error) {
        console.error('Error deleting certificate image:', error);
      }
    }

    // Xóa certificate
    await Certificate.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Xóa chứng chỉ thành công'
    });
  } catch (error) {
    console.error('Delete Certificate Error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa chứng chỉ'
    });
  }
};

/**
 * @route   DELETE /api/certificates/:id/image
 * @desc    Xóa ảnh của certificate
 * @access  Private/Admin
 */
exports.deleteCertificateImage = async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chứng chỉ'
      });
    }

    if (!certificate.image || !certificate.image.publicId) {
      return res.status(400).json({
        success: false,
        message: 'Chứng chỉ chưa có hình ảnh'
      });
    }

    // Xóa ảnh trên Cloudinary
    await deleteImage(certificate.image.publicId);

    // Xóa ảnh trong database
    certificate.image = { url: null, publicId: null };
    await certificate.save();

    res.status(200).json({
      success: true,
      message: 'Xóa hình ảnh thành công'
    });
  } catch (error) {
    console.error('Delete Certificate Image Error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa hình ảnh'
    });
  }
};