const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
// const { CloudinaryStorage } = require('multer-storage-cloudinary');
// const cloudinary = require('../config/cloudinary');

/**
 * @route   GET /api/reviews
 * @desc    Get all reviews (Admin) with filters
 * @access  Private/Admin
 */
exports.getAllReviews = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            rating,
            product,
            search,
            sortBy = 'createdAt',
            order = 'desc'
        } = req.query;

        // Build query
        const query = {};

        // Filter by status
        if (status && status !== 'all') {
            query.status = status;
        }

        // Filter by rating
        if (rating && rating !== 'all') {
            query.rating = parseInt(rating);
        }

        // Filter by product
        if (product) {
            query.product = product;
        }

        // Search by comment or user
        if (search) {
            query.$or = [
                { comment: { $regex: search, $options: 'i' } }
            ];
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Sorting
        const sortOptions = {};
        sortOptions[sortBy] = order === 'asc' ? 1 : -1;

        // Execute queries
        const [reviews, total] = await Promise.all([
            Review.find(query)
                .populate('user', 'username email')
                .populate('product', 'name slug images')
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Review.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            data: {
                reviews,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalReviews: total,
                    limit: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Get All Reviews Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách đánh giá'
        });
    }
};

/**
 * @route   GET /api/reviews/pending
 * @desc    Get pending reviews only (Admin)
 * @access  Private/Admin
 */
exports.getPendingReviews = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [reviews, total] = await Promise.all([
            Review.find({ status: 'pending' })
                .populate('user', 'username email')
                .populate('product', 'name slug images')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Review.countDocuments({ status: 'pending' })
        ]);

        res.status(200).json({
            success: true,
            data: {
                reviews,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalReviews: total,
                    limit: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Get Pending Reviews Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy đánh giá chờ duyệt'
        });
    }
};

/**
 * @route   GET /api/reviews/:id
 * @desc    Get single review by ID
 * @access  Private/Admin
 */
exports.getReviewById = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id)
            .populate('user', 'username email phone')
            .populate('product', 'name slug images price')
            .populate('order', 'orderNumber createdAt');

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đánh giá'
            });
        }

        res.status(200).json({
            success: true,
            data: review
        });
    } catch (error) {
        console.error('Get Review By ID Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin đánh giá'
        });
    }
};

/**
 * @route   PUT /api/reviews/:id/approve
 * @desc    Approve a review
 * @access  Private/Admin
 */
exports.approveReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đánh giá'
            });
        }

        if (review.status === 'approved') {
            return res.status(400).json({
                success: false,
                message: 'Đánh giá đã được duyệt'
            });
        }

        review.status = 'approved';
        review.adminNote = ''; // Clear any rejection note
        await review.save();

        res.status(200).json({
            success: true,
            message: 'Duyệt đánh giá thành công',
            data: review
        });
    } catch (error) {
        console.error('Approve Review Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi duyệt đánh giá'
        });
    }
};

/**
 * @route   PUT /api/reviews/:id/reject
 * @desc    Reject a review with admin note
 * @access  Private/Admin
 */
exports.rejectReview = async (req, res) => {
    try {
        const { adminNote } = req.body;

        if (!adminNote) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập lý do từ chối'
            });
        }

        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đánh giá'
            });
        }

        review.status = 'rejected';
        review.adminNote = adminNote;
        await review.save();

        res.status(200).json({
            success: true,
            message: 'Từ chối đánh giá thành công',
            data: review
        });
    } catch (error) {
        console.error('Reject Review Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi từ chối đánh giá'
        });
    }
};

/**
 * @route   DELETE /api/reviews/:id
 * @desc    Delete a review
 * @access  Private/Admin
 */
exports.deleteReview = async (req, res) => {
    try {
        const review = await Review.findByIdAndDelete(req.params.id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đánh giá'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Xóa đánh giá thành công'
        });
    } catch (error) {
        console.error('Delete Review Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa đánh giá'
        });
    }
};

/**
 * @route   GET /api/reviews/product/:productId
 * @desc    Get approved reviews for a product (Public)
 * @access  Public
 */
exports.getProductReviews = async (req, res) => {
    try {
        const { page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const sortOptions = {};
        sortOptions[sortBy] = order === 'asc' ? 1 : -1;

        const [reviews, total, stats, distribution] = await Promise.all([
            Review.find({ 
                product: req.params.productId, 
                status: 'approved' 
            })
                .populate('user', 'username')
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Review.countDocuments({ 
                product: req.params.productId, 
                status: 'approved' 
            }),
            Review.getAverageRating(req.params.productId),
            Review.getRatingDistribution(req.params.productId)
        ]);

        res.status(200).json({
            success: true,
            data: {
                reviews,
                stats: {
                    averageRating: stats.avgRating || 0,
                    totalReviews: stats.totalReviews || 0,
                    distribution: distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
                },
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalReviews: total,
                    limit: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Get Product Reviews Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy đánh giá sản phẩm'
        });
    }
};

/**
 * @route   GET /api/reviews/stats/overview
 * @desc    Get review statistics (Admin)
 * @access  Private/Admin
 */
exports.getReviewStats = async (req, res) => {
    try {
        const [
            total,
            pending,
            approved,
            rejected,
            recentReviews,
            ratingDistribution
        ] = await Promise.all([
            Review.countDocuments(),
            Review.countDocuments({ status: 'pending' }),
            Review.countDocuments({ status: 'approved' }),
            Review.countDocuments({ status: 'rejected' }),
            Review.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('user', 'username')
                .populate('product', 'name')
                .lean(),
            Review.aggregate([
                {
                    $group: {
                        _id: '$rating',
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: -1 } }
            ])
        ]);

        const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        ratingDistribution.forEach(d => {
            distribution[d._id] = d.count;
        });

        res.status(200).json({
            success: true,
            data: {
                overview: {
                    total,
                    pending,
                    approved,
                    rejected
                },
                ratingDistribution: distribution,
                recentReviews
            }
        });
    } catch (error) {
        console.error('Get Review Stats Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê đánh giá'
        });
    }
};

// ===========================================================
// USER-FACING METHODS
// ===========================================================

/**
 * Multer config cho upload ảnh review lưu cục bộ qua Frontend public folder
 */
const uploadDir = path.join(__dirname, '../../../frontend/public/uploads/reviews');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const reviewStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'review-' + uniqueSuffix + path.extname(file.originalname));
    }
});

exports.uploadReviewImages = multer({
    storage: reviewStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận file định dạng hình ảnh'), false);
        }
    }
}).array('images', 5); // Max 5 images

/**
 * @route   POST /api/reviews
 * @desc    User tạo đánh giá sản phẩm
 * @access  Private
 */
exports.createReview = async (req, res) => {
    try {
        const { productId, orderId, rating, comment } = req.body;

        if (!productId || !rating || !comment) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ: productId, rating, comment'
            });
        }

        // Kiểm tra sản phẩm tồn tại
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }

        // Kiểm tra đã review chưa cho đơn hàng này
        const existingReview = await Review.findOne({
            product: productId,
            user: req.user._id,
            order: orderId
        });
        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: 'Bạn đã đánh giá sản phẩm này trong đơn hàng này rồi'
            });
        }

        // Xử lý ảnh upload
        const imageUrls = req.files ? req.files.map(f => `/uploads/reviews/${f.filename}`) : [];

        const reviewData = {
            product: productId,
            user: req.user._id,
            rating: parseInt(rating),
            comment: comment.trim(),
            images: imageUrls,
            status: 'pending'
        };

        // Kiểm tra verified purchase và các sản phẩm bị trả lại
        if (orderId) {
            const order = await Order.findOne({
                _id: orderId,
                user: req.user._id,
                status: 'delivered'
            });
            if (order) {
                // Kiểm tra xem sản phẩm có nằm trong danh sách trả hàng không
                let isReturned = false;
                if (order.returnRequest && order.returnRequest.items) {
                    isReturned = order.returnRequest.items.some(
                        item => item.product.toString() === productId.toString()
                    );
                }

                if (isReturned) {
                    return res.status(400).json({
                        success: false,
                        message: 'Sản phẩm này đã được yêu cầu trả lại, không thể đánh giá'
                    });
                }

                const hasProduct = order.items.some(
                    item => item.product.toString() === productId.toString()
                );
                if (hasProduct) {
                    reviewData.order = orderId;
                    reviewData.verifiedPurchase = true;
                }
            }
        }

        const review = await Review.create(reviewData);

        res.status(201).json({
            success: true,
            message: 'Đánh giá đã được gửi và đang chờ duyệt',
            data: review
        });
    } catch (error) {
        console.error('Create Review Error:', error);
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Bạn đã đánh giá sản phẩm này rồi'
            });
        }
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi tạo đánh giá'
        });
    }
};

/**
 * @route   GET /api/reviews/my-reviews
 * @desc    Lấy danh sách đánh giá của user hiện tại
 * @access  Private
 */
exports.getMyReviews = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [reviews, total] = await Promise.all([
            Review.find({ user: req.user._id })
                .populate('product', 'name slug images price')
                .populate('order', 'orderNumber')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Review.countDocuments({ user: req.user._id })
        ]);

        res.status(200).json({
            success: true,
            data: {
                reviews,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalReviews: total,
                    limit: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Get My Reviews Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách đánh giá'
        });
    }
};

/**
 * @route   GET /api/reviews/reviewable
 * @desc    Lấy danh sách sản phẩm có thể đánh giá (đã mua, đã giao, chưa review)
 * @access  Private
 */
exports.getReviewableProducts = async (req, res) => {
    try {
        // Lấy tất cả đơn hàng đã giao của user
        const deliveredOrders = await Order.find({
            user: req.user._id,
            status: 'delivered'
        }).lean();

        if (deliveredOrders.length === 0) {
            return res.status(200).json({
                success: true,
                data: []
            });
        }

        // Lấy tất cả các review của user này
        const userReviews = await Review.find({ user: req.user._id }, 'product order').lean();
        
        const reviewedOrderProducts = new Set();
        const reviewedProductsNoOrder = new Set();
        
        userReviews.forEach(r => {
            if (r.order) {
                reviewedOrderProducts.add(`${r.order.toString()}_${r.product.toString()}`);
            } else {
                reviewedProductsNoOrder.add(r.product.toString());
            }
        });

        // Tìm sản phẩm chưa review từ các đơn đã giao
        const reviewableItems = [];
        const addedOrderProducts = new Set();

        for (const order of deliveredOrders) {
            const orderIdStr = order._id.toString();
            for (const item of order.items) {
                const productIdStr = item.product.toString();

                // Bỏ qua nếu sản phẩm nằm trong danh sách yêu cầu trả hàng
                let isReturned = false;
                if (order.returnRequest && order.returnRequest.items) {
                    isReturned = order.returnRequest.items.some(
                        rItem => rItem.product.toString() === productIdStr
                    );
                }
                if (isReturned) continue;

                const orderProductKey = `${orderIdStr}_${productIdStr}`;

                // Nếu đã review cho đơn hàng này thì bỏ qua
                if (reviewedOrderProducts.has(orderProductKey)) continue;

                // Xử lý tương thích ngược: nếu có 1 review cũ không gắn với order nào
                // ta tính review cũ đó cho lần xuất hiện đầu tiên của sản phẩm này trong lịch sử đơn hàng
                if (reviewedProductsNoOrder.has(productIdStr)) {
                    reviewedProductsNoOrder.delete(productIdStr);
                    continue;
                }

                // Nếu chưa có trong danh sách reviewable của đơn hàng này
                if (!addedOrderProducts.has(orderProductKey)) {
                    reviewableItems.push({
                        product: {
                            _id: item.product,
                            name: item.productName,
                            image: item.productImage,
                            price: item.price,
                            finalPrice: item.finalPrice
                        },
                        order: {
                            _id: order._id,
                            orderNumber: order.orderNumber,
                            deliveredAt: order.deliveredAt
                        },
                        variant: item.variantSize || item.variantWeight || item.variantVolume
                            ? { size: item.variantSize, weight: item.variantWeight, volume: item.variantVolume }
                            : null
                    });
                    addedOrderProducts.add(orderProductKey);
                }
            }
        }

        res.status(200).json({
            success: true,
            data: reviewableItems
        });
    } catch (error) {
        console.error('Get Reviewable Products Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách sản phẩm có thể đánh giá'
        });
    }
};
