const Product = require('../models/Product');
const Category = require('../models/Category');
const Certificate = require('../models/Certificate');
const Packaging = require('../models/Packaging');
const { uploadImage, deleteImage, deleteMultipleImages } = require('../config/cloudinary');
const { cleanupTempFile, cleanupTempFiles } = require('../middlewares/upload');

/**
 * @route   GET /api/products
 * @desc    Lấy danh sách sản phẩm (có filter, phân trang)
 * @access  Public
 */
exports.getAllProducts = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 12,
            search = '',
            category,
            minPrice,
            maxPrice,
            minEcoScore,
            maxEcoScore,
            inStock,
            isFeatured,
            isActive,
            sortBy = 'createdAt',
            order = 'desc'
        } = req.query;

        // Build query
        const query = {};

        // Tìm kiếm theo tên
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        // Lọc theo category
        if (category) {
            query.category = category;
        }

        // Lọc theo giá
        if (minPrice || maxPrice) {
            query.finalPrice = {};
            if (minPrice) query.finalPrice.$gte = parseFloat(minPrice);
            if (maxPrice) query.finalPrice.$lte = parseFloat(maxPrice);
        }

        // Lọc theo eco score
        if (minEcoScore || maxEcoScore) {
            query.ecoScore = {};
            if (minEcoScore) query.ecoScore.$gte = parseFloat(minEcoScore);
            if (maxEcoScore) query.ecoScore.$lte = parseFloat(maxEcoScore);
        }

        // Lọc theo tồn kho
        if (inStock !== undefined) {
            query.inStock = inStock === 'true';
        }

        // Lọc sản phẩm nổi bật
        if (isFeatured !== undefined) {
            query.isFeatured = isFeatured === 'true';
        }

        // Lọc theo trạng thái
        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        // Sorting
        const sortOptions = {};
        sortOptions[sortBy] = order === 'asc' ? 1 : -1;

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Execute queries
        const [products, total] = await Promise.all([
            Product.find(query)
                .populate('category', 'name slug')
                .populate('certificates', 'name organization ecoPoints image')
                .populate('packaging', 'name material ecoPoints')
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit)),
            Product.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            data: {
                products,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalProducts: total,
                    limit: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Get All Products Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách sản phẩm'
        });
    }
};

/**
 * @route   GET /api/products/:id
 * @desc    Lấy thông tin chi tiết 1 sản phẩm
 * @access  Public
 */
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category', 'name slug')
            .populate('certificates', 'name organization description ecoPoints image issuedDate')
            .populate('packaging', 'name material description ecoPoints isBiodegradable isReusable isRecyclable decompositionTime');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }

        // Tăng view count
        product.views += 1;
        await product.save();

        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Get Product By ID Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin sản phẩm'
        });
    }
};

/**
 * @route   POST /api/products
 * @desc    Tạo sản phẩm mới (có upload nhiều ảnh)
 * @access  Private/Admin
 */
exports.createProduct = async (req, res) => {
    try {
        const {
            name,
            description,
            shortDescription,
            price,
            discount,
            category,
            stock,
            // Eco criteria (5 tiêu chí)
            isNaturalMaterial,
            isReusable,
            isBiodegradable,
            hasRefill,
            materials,
            certificates,
            packaging,
            isActive,
            isFeatured
        } = req.body;

        // Kiểm tra category tồn tại
        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
            if (req.files) {
                cleanupTempFiles(req.files.map(f => f.path));
            }
            return res.status(400).json({
                success: false,
                message: 'Danh mục không tồn tại'
            });
        }

        // Kiểm tra certificates nếu có
        if (certificates) {
            const certArray = Array.isArray(certificates) ? certificates : JSON.parse(certificates);
            if (certArray.length > 0) {
                const certCount = await Certificate.countDocuments({ _id: { $in: certArray } });
                if (certCount !== certArray.length) {
                    if (req.files) cleanupTempFiles(req.files.map(f => f.path));
                    return res.status(400).json({
                        success: false,
                        message: 'Một hoặc nhiều chứng chỉ không tồn tại'
                    });
                }
            }
        }

        // Kiểm tra packaging nếu có
        if (packaging) {
            const packagingExists = await Packaging.findById(packaging);
            if (!packagingExists) {
                if (req.files) cleanupTempFiles(req.files.map(f => f.path));
                return res.status(400).json({
                    success: false,
                    message: 'Bao bì không tồn tại'
                });
            }
        }

        // Tạo product object
        const productData = {
            name,
            description,
            shortDescription,
            price: parseFloat(price),
            discount: discount ? parseFloat(discount) : 0,
            category,
            stock: parseInt(stock) || 0,
            // Eco criteria (ecoScore sẽ tính tự động)
            isNaturalMaterial: isNaturalMaterial === true || isNaturalMaterial === 'true',
            isReusable: isReusable === true || isReusable === 'true',
            isBiodegradable: isBiodegradable === true || isBiodegradable === 'true',
            hasRefill: hasRefill === true || hasRefill === 'true',
            materials: materials ? (Array.isArray(materials) ? materials : JSON.parse(materials)) : [],
            certificates: certificates ? (Array.isArray(certificates) ? certificates : JSON.parse(certificates)) : [],
            packaging: packaging || null,
            isActive: isActive !== undefined ? isActive : true,
            isFeatured: isFeatured !== undefined ? isFeatured : false,
            images: []
        };

        // Upload nhiều ảnh nếu có
        if (req.files && req.files.length > 0) {
            try {
                const uploadPromises = req.files.map((file, index) =>
                    uploadImage(file.path, 'zero-waste/products').then(result => ({
                        url: result.url,
                        publicId: result.publicId,
                        isMain: index === 0 // Ảnh đầu tiên là ảnh chính
                    }))
                );

                productData.images = await Promise.all(uploadPromises);

                // Xóa file tạm
                cleanupTempFiles(req.files.map(f => f.path));
            } catch (uploadError) {
                console.error('Upload Error:', uploadError);
                cleanupTempFiles(req.files.map(f => f.path));
                return res.status(500).json({
                    success: false,
                    message: 'Lỗi khi upload hình ảnh'
                });
            }
        }

        // Tạo product
        const product = await Product.create(productData);

        // Cập nhật productCount trong category
        await Category.findByIdAndUpdate(category, {
            $inc: { productCount: 1 }
        });

        // Cập nhật productCount trong certificates
        if (productData.certificates && productData.certificates.length > 0) {
            await Certificate.updateMany(
                { _id: { $in: productData.certificates } },
                { $inc: { productCount: 1 } }
            );
        }

        // Cập nhật productCount trong packaging
        if (productData.packaging) {
            await Packaging.findByIdAndUpdate(productData.packaging, {
                $inc: { productCount: 1 }
            });
        }

        // Populate trước khi trả về
        await product.populate([
            { path: 'category', select: 'name slug' },
            { path: 'certificates', select: 'name organization ecoPoints image' },
            { path: 'packaging', select: 'name material ecoPoints' }
        ]);

        res.status(201).json({
            success: true,
            message: 'Tạo sản phẩm thành công',
            data: product
        });
    } catch (error) {
        console.error('Create Product Error:', error);
        // Xóa file tạm nếu có lỗi
        if (req.files) {
            cleanupTempFiles(req.files.map(f => f.path));
        }
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo sản phẩm'
        });
    }
};

/**
 * @route   PUT /api/products/:id
 * @desc    Cập nhật sản phẩm (có thể thêm ảnh mới)
 * @access  Private/Admin
 */
exports.updateProduct = async (req, res) => {
    try {
        const {
            name,
            description,
            shortDescription,
            price,
            discount,
            category,
            stock,
            // Eco criteria (5 tiêu chí)
            isNaturalMaterial,
            isReusable,
            isBiodegradable,
            hasRefill,
            materials,
            certificates,
            packaging,
            isActive,
            isFeatured
        } = req.body;

        const product = await Product.findById(req.params.id);

        if (!product) {
            if (req.files) cleanupTempFiles(req.files.map(f => f.path));
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }

        // Kiểm tra category nếu thay đổi
        if (category && category !== product.category.toString()) {
            const categoryExists = await Category.findById(category);
            if (!categoryExists) {
                if (req.files) cleanupTempFiles(req.files.map(f => f.path));
                return res.status(400).json({
                    success: false,
                    message: 'Danh mục không tồn tại'
                });
            }

            // Cập nhật productCount
            await Category.findByIdAndUpdate(product.category, {
                $inc: { productCount: -1 }
            });
            await Category.findByIdAndUpdate(category, {
                $inc: { productCount: 1 }
            });

            product.category = category;
        }

        // Xử lý certificates thay đổi
        if (certificates !== undefined) {
            const newCerts = Array.isArray(certificates) ? certificates : JSON.parse(certificates);
            const oldCerts = product.certificates.map(c => c.toString());

            // Tìm certificates bị xóa
            const removedCerts = oldCerts.filter(cert => !newCerts.includes(cert));
            // Tìm certificates mới thêm
            const addedCerts = newCerts.filter(cert => !oldCerts.includes(cert));

            // Giảm productCount cho certificates bị xóa
            if (removedCerts.length > 0) {
                await Certificate.updateMany(
                    { _id: { $in: removedCerts } },
                    { $inc: { productCount: -1 } }
                );
            }

            // Tăng productCount cho certificates mới
            if (addedCerts.length > 0) {
                await Certificate.updateMany(
                    { _id: { $in: addedCerts } },
                    { $inc: { productCount: 1 } }
                );
            }

            product.certificates = newCerts;
        }

        // Xử lý packaging thay đổi
        if (packaging !== undefined) {
            const oldPackaging = product.packaging ? product.packaging.toString() : null;
            const newPackaging = packaging || null;

            if (oldPackaging !== newPackaging) {
                // Giảm productCount cho packaging cũ
                if (oldPackaging) {
                    await Packaging.findByIdAndUpdate(oldPackaging, {
                        $inc: { productCount: -1 }
                    });
                }

                // Tăng productCount cho packaging mới
                if (newPackaging) {
                    await Packaging.findByIdAndUpdate(newPackaging, {
                        $inc: { productCount: 1 }
                    });
                }

                product.packaging = newPackaging;
            }
        }

        // Cập nhật các fields
        if (name) product.name = name;
        if (description) product.description = description;
        if (shortDescription !== undefined) product.shortDescription = shortDescription;
        if (price) product.price = parseFloat(price);
        if (discount !== undefined) product.discount = parseFloat(discount);
        if (stock !== undefined) product.stock = parseInt(stock);
        
        // Cập nhật eco criteria
        if (isNaturalMaterial !== undefined) product.isNaturalMaterial = isNaturalMaterial === true || isNaturalMaterial === 'true';
        if (isReusable !== undefined) product.isReusable = isReusable === true || isReusable === 'true';
        if (isBiodegradable !== undefined) product.isBiodegradable = isBiodegradable === true || isBiodegradable === 'true';
        if (hasRefill !== undefined) product.hasRefill = hasRefill === true || hasRefill === 'true';
        
        if (materials) product.materials = Array.isArray(materials) ? materials : JSON.parse(materials);
        if (isActive !== undefined) product.isActive = isActive;
        if (isFeatured !== undefined) product.isFeatured = isFeatured;

        // Upload ảnh mới nếu có
        if (req.files && req.files.length > 0) {
            try {
                const uploadPromises = req.files.map((file, index) =>
                    uploadImage(file.path, 'zero-waste/products').then(result => ({
                        url: result.url,
                        publicId: result.publicId,
                        isMain: product.images.length === 0 && index === 0 // Ảnh đầu tiên là main nếu chưa có ảnh
                    }))
                );

                const newImages = await Promise.all(uploadPromises);
                product.images.push(...newImages);

                // Xóa file tạm
                cleanupTempFiles(req.files.map(f => f.path));
            } catch (uploadError) {
                cleanupTempFiles(req.files.map(f => f.path));
                return res.status(500).json({
                    success: false,
                    message: 'Lỗi khi upload hình ảnh'
                });
            }
        }

        await product.save();
        await product.populate([
            { path: 'category', select: 'name slug' },
            { path: 'certificates', select: 'name organization ecoPoints image' },
            { path: 'packaging', select: 'name material ecoPoints' }
        ]);

        res.status(200).json({
            success: true,
            message: 'Cập nhật sản phẩm thành công',
            data: product
        });
    } catch (error) {
        console.error('Update Product Error:', error);
        if (req.files) cleanupTempFiles(req.files.map(f => f.path));
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật sản phẩm'
        });
    }
};

/**
 * @route   DELETE /api/products/:id
 * @desc    Xóa sản phẩm
 * @access  Private/Admin
 */
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }

        // Xóa tất cả ảnh trên Cloudinary
        if (product.images && product.images.length > 0) {
            try {
                const publicIds = product.images.map(img => img.publicId);
                await deleteMultipleImages(publicIds);
            } catch (error) {
                console.error('Error deleting product images:', error);
            }
        }

        // Giảm productCount trong category
        await Category.findByIdAndUpdate(product.category, {
            $inc: { productCount: -1 }
        });

        // Giảm productCount trong certificates
        if (product.certificates && product.certificates.length > 0) {
            await Certificate.updateMany(
                { _id: { $in: product.certificates } },
                { $inc: { productCount: -1 } }
            );
        }

        // Giảm productCount trong packaging
        if (product.packaging) {
            await Packaging.findByIdAndUpdate(product.packaging, {
                $inc: { productCount: -1 }
            });
        }

        // Xóa product
        await Product.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Xóa sản phẩm thành công'
        });
    } catch (error) {
        console.error('Delete Product Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa sản phẩm'
        });
    }
};

/**
 * @route   DELETE /api/products/:id/images/:imageId
 * @desc    Xóa 1 ảnh của sản phẩm
 * @access  Private/Admin
 */
exports.deleteProductImage = async (req, res) => {
    try {
        const { id, imageId } = req.params;

        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }

        // Tìm ảnh cần xóa
        const imageIndex = product.images.findIndex(img => img._id.toString() === imageId);

        if (imageIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hình ảnh'
            });
        }

        // Không cho xóa nếu chỉ còn 1 ảnh
        if (product.images.length === 1) {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa ảnh cuối cùng. Sản phẩm phải có ít nhất 1 ảnh.'
            });
        }

        const imageToDelete = product.images[imageIndex];

        // Xóa ảnh trên Cloudinary
        await deleteImage(imageToDelete.publicId);

        // Xóa ảnh khỏi mảng
        product.images.splice(imageIndex, 1);

        // Nếu xóa ảnh chính, set ảnh đầu tiên làm ảnh chính
        if (imageToDelete.isMain && product.images.length > 0) {
            product.images[0].isMain = true;
        }

        await product.save();

        res.status(200).json({
            success: true,
            message: 'Xóa hình ảnh thành công',
            data: product
        });
    } catch (error) {
        console.error('Delete Product Image Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa hình ảnh'
        });
    }
};

/**
 * @route   PUT /api/products/:id/images/:imageId/set-main
 * @desc    Đặt ảnh làm ảnh chính
 * @access  Private/Admin
 */
exports.setMainImage = async (req, res) => {
    try {
        const { id, imageId } = req.params;

        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }

        // Tìm ảnh
        const imageIndex = product.images.findIndex(img => img._id.toString() === imageId);

        if (imageIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hình ảnh'
            });
        }

        // Reset tất cả isMain = false
        product.images.forEach(img => img.isMain = false);

        // Set ảnh được chọn làm main
        product.images[imageIndex].isMain = true;

        await product.save();

        res.status(200).json({
            success: true,
            message: 'Đặt ảnh chính thành công',
            data: product
        });
    } catch (error) {
        console.error('Set Main Image Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi đặt ảnh chính'
        });
    }
};

/**
 * @route   GET /api/products/admin/stats
 * @desc    Thống kê sản phẩm
 * @access  Private/Admin
 */
exports.getProductStats = async (req, res) => {
    try {
        const [
            totalProducts,
            totalActiveProducts,
            totalInStock,
            totalOutOfStock,
            totalFeatured,
            productsByCategory
        ] = await Promise.all([
            Product.countDocuments(),
            Product.countDocuments({ isActive: true }),
            Product.countDocuments({ inStock: true }),
            Product.countDocuments({ inStock: false }),
            Product.countDocuments({ isFeatured: true }),
            Product.aggregate([
                {
                    $group: {
                        _id: '$category',
                        count: { $sum: 1 }
                    }
                },
                {
                    $lookup: {
                        from: 'categories',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'category'
                    }
                },
                {
                    $unwind: '$category'
                },
                {
                    $project: {
                        categoryName: '$category.name',
                        count: 1
                    }
                }
            ])
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalProducts,
                totalActiveProducts,
                totalInStock,
                totalOutOfStock,
                totalFeatured,
                productsByCategory
            }
        });
    } catch (error) {
        console.error('Get Product Stats Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê sản phẩm'
        });
    }
};

/**
 * @route   POST /api/products/:id/certificates
 * @desc    Thêm certificates vào sản phẩm
 * @access  Private/Admin
 */
exports.addCertificatesToProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { certificateIds } = req.body;

        if (!certificateIds || !Array.isArray(certificateIds) || certificateIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp mảng certificateIds'
            });
        }

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }

        // Kiểm tra certificates tồn tại
        const certCount = await Certificate.countDocuments({ _id: { $in: certificateIds } });
        if (certCount !== certificateIds.length) {
            return res.status(400).json({
                success: false,
                message: 'Một hoặc nhiều chứng chỉ không tồn tại'
            });
        }

        // Lọc ra certificates chưa có trong product
        const existingIds = product.certificates.map(c => c.toString());
        const newCertIds = certificateIds.filter(certId => !existingIds.includes(certId));

        if (newCertIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Tất cả chứng chỉ đã được thêm vào sản phẩm'
            });
        }

        // Thêm certificates mới
        product.certificates.push(...newCertIds);
        await product.save();

        // Tăng productCount
        await Certificate.updateMany(
            { _id: { $in: newCertIds } },
            { $inc: { productCount: 1 } }
        );

        await product.populate('certificates', 'name organization ecoPoints image');

        res.status(200).json({
            success: true,
            message: 'Thêm chứng chỉ thành công',
            data: product
        });
    } catch (error) {
        console.error('Add Certificates Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thêm chứng chỉ'
        });
    }
};

/**
 * @route   DELETE /api/products/:id/certificates/:certificateId
 * @desc    Xóa certificate khỏi sản phẩm
 * @access  Private/Admin
 */
exports.removeCertificateFromProduct = async (req, res) => {
    try {
        const { id, certificateId } = req.params;

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }

        const certIndex = product.certificates.findIndex(c => c.toString() === certificateId);
        if (certIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Chứng chỉ không có trong sản phẩm'
            });
        }

        // Xóa certificate
        product.certificates.splice(certIndex, 1);
        await product.save();

        // Giảm productCount
        await Certificate.findByIdAndUpdate(certificateId, {
            $inc: { productCount: -1 }
        });

        await product.populate('certificates', 'name organization ecoPoints image');

        res.status(200).json({
            success: true,
            message: 'Xóa chứng chỉ thành công',
            data: product
        });
    } catch (error) {
        console.error('Remove Certificate Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa chứng chỉ'
        });
    }
};

/**
 * @route   PUT /api/products/:id/packaging
 * @desc    Gán packaging cho sản phẩm
 * @access  Private/Admin
 */
exports.setProductPackaging = async (req, res) => {
    try {
        const { id } = req.params;
        const { packagingId } = req.body;

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }

        // Kiểm tra packaging tồn tại
        if (packagingId) {
            const packagingExists = await Packaging.findById(packagingId);
            if (!packagingExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Bao bì không tồn tại'
                });
            }
        }

        const oldPackagingId = product.packaging ? product.packaging.toString() : null;
        const newPackagingId = packagingId || null;

        // Nếu packaging không thay đổi
        if (oldPackagingId === newPackagingId) {
            return res.status(400).json({
                success: false,
                message: 'Bao bì không thay đổi'
            });
        }

        // Giảm productCount cho packaging cũ
        if (oldPackagingId) {
            await Packaging.findByIdAndUpdate(oldPackagingId, {
                $inc: { productCount: -1 }
            });
        }

        // Tăng productCount cho packaging mới
        if (newPackagingId) {
            await Packaging.findByIdAndUpdate(newPackagingId, {
                $inc: { productCount: 1 }
            });
        }

        product.packaging = newPackagingId;
        await product.save();

        await product.populate('packaging', 'name material ecoPoints');

        res.status(200).json({
            success: true,
            message: newPackagingId ? 'Gán bao bì thành công' : 'Xóa bao bì thành công',
            data: product
        });
    } catch (error) {
        console.error('Set Packaging Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi gán bao bì'
        });
    }
};

/**
 * @route   DELETE /api/products/:id/packaging
 * @desc    Xóa packaging khỏi sản phẩm
 * @access  Private/Admin
 */
exports.removeProductPackaging = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }

        if (!product.packaging) {
            return res.status(400).json({
                success: false,
                message: 'Sản phẩm không có bao bì'
            });
        }

        // Giảm productCount
        await Packaging.findByIdAndUpdate(product.packaging, {
            $inc: { productCount: -1 }
        });

        product.packaging = null;
        await product.save();

        res.status(200).json({
            success: true,
            message: 'Xóa bao bì thành công',
            data: product
        });
    } catch (error) {
        console.error('Remove Packaging Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa bao bì'
        });
    }
};