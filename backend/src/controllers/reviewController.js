const Review = require('../models/Review');
const Product = require('../models/Product');

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

        const [reviews, total, stats] = await Promise.all([
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
                    distribution: stats
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
