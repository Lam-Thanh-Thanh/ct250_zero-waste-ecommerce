const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

/**
 * Dashboard Service
 * Chứa logic aggregation & export cho trang thống kê admin
 */

// ===== 1. DOANH THU THEO NGÀY (30 ngày gần nhất) =====
const getRevenueByDay = async (days = 30) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Aggregation Pipeline:
    // 1. $match: Lọc đơn hàng trong khoảng thời gian
    // 1.b. $addFields: Tính tổng số lượng sản phẩm của mỗi đơn
    // 2. $group: Nhóm theo ngày, tính tổng doanh thu (chỉ đơn paid), đếm tổng đơn & tổng SP
    // 3. $sort: Sắp xếp theo ngày tăng dần
    const revenue = await Order.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $addFields: { orderTotalItems: { $sum: "$items.quantity" } } },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                totalRevenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmount', 0] } },
                orderCount: { $sum: 1 },
                totalItemsCount: { $sum: "$orderTotalItems" }
            }
        },
        { $sort: { _id: 1 } },
        {
            $project: {
                _id: 0,
                date: '$_id',
                revenue: '$totalRevenue',
                orders: '$orderCount',
                items: '$totalItemsCount'
            }
        }
    ]);

    return revenue;
};

// ===== 2. DOANH THU THEO THÁNG (12 tháng gần nhất) =====
const getRevenueByMonth = async (months = 12) => {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    // Aggregation Pipeline:
    // Group theo year-month thay vì year-month-day
    const revenue = await Order.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $addFields: { orderTotalItems: { $sum: "$items.quantity" } } },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                totalRevenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmount', 0] } },
                orderCount: { $sum: 1 },
                totalItemsCount: { $sum: "$orderTotalItems" }
            }
        },
        { $sort: { _id: 1 } },
        {
            $project: {
                _id: 0,
                date: '$_id',
                revenue: '$totalRevenue',
                orders: '$orderCount',
                items: '$totalItemsCount'
            }
        }
    ]);

    return revenue;
};

// ===== 3. THỐNG KÊ THÁNG HIỆN TẠI =====
const getMonthlyStats = async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Đếm đơn hàng mới trong tháng (tất cả status, không chỉ paid)
    const newOrders = await Order.countDocuments({
        createdAt: { $gte: startOfMonth }
    });

    // Đếm user mới đăng ký trong tháng
    const newUsers = await User.countDocuments({
        createdAt: { $gte: startOfMonth }
    });

    // Tổng số sản phẩm (items) được bán ra trong tháng (chỉ đơn hàng hợp lệ, nhưng ở đây có thể lấy tất cả giống đơn hàng mới)
    const itemsAgg = await Order.aggregate([
        { $match: { createdAt: { $gte: startOfMonth } } },
        { $addFields: { orderTotalItems: { $sum: "$items.quantity" } } },
        { $group: { _id: null, totalItems: { $sum: "$orderTotalItems" } } }
    ]);
    const newItems = itemsAgg.length > 0 ? itemsAgg[0].totalItems : 0;

    // Tổng doanh thu tháng hiện tại (chỉ đơn đã thanh toán)
    const revenueAgg = await Order.aggregate([
        {
            $match: {
                paymentStatus: 'paid',
                createdAt: { $gte: startOfMonth }
            }
        },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: '$totalAmount' }
            }
        }
    ]);

    const monthlyRevenue = revenueAgg.length > 0 ? revenueAgg[0].totalRevenue : 0;

    return { newOrders, newUsers, monthlyRevenue, newItems };
};

// ===== 4. TOP 5 SẢN PHẨM BÁN CHẠY NHẤT =====
const getTopSellingProducts = async (limit = 5) => {
    // Aggregation Pipeline:
    // 1. $match: Lọc đơn hàng đã thanh toán
    // 2. $unwind: Tách mảng items thành từng document riêng
    // 3. $group: Nhóm theo product ID, tính tổng quantity & revenue
    // 4. $sort: Sắp xếp theo totalQuantity giảm dần
    // 5. $limit: Lấy top N
    // 6. $lookup: Join với collection products để lấy tên, ảnh
    const topProducts = await Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $unwind: '$items' },
        {
            $group: {
                _id: '$items.product',
                totalQuantity: { $sum: '$items.quantity' },
                totalRevenue: { $sum: '$items.subtotal' },
                productName: { $first: '$items.productName' },
                productImage: { $first: '$items.productImage' }
            }
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: limit },
        {
            $lookup: {
                from: 'products',
                localField: '_id',
                foreignField: '_id',
                as: 'productInfo'
            }
        },
        { $unwind: { path: '$productInfo', preserveNullAndEmptyArrays: true } },
        {
            $project: {
                _id: 0,
                productId: '$_id',
                name: '$productName',
                image: { $ifNull: [{ $arrayElemAt: ['$productInfo.images.url', 0] }, '$productImage'] }, totalQuantity: 1,
                totalRevenue: 1
            }
        }
    ]);

    return topProducts;
};

// ===== 5. SẢN PHẨM SẮP HẾT HÀNG (stock < threshold) =====
const getLowStockProducts = async (threshold = 10) => {
    const products = await Product.find({
        stock: { $lt: threshold },
        isActive: true
    })
        .select('name stock images price sold')
        .sort({ stock: 1 })   // Sắp xếp: ít tồn kho nhất lên đầu
        .lean();

    return products;
};

// ===== 6. ĐƠN HÀNG THÀNH CÔNG vs HỦY THEO TUẦN (7 ngày) =====
// Dữ liệu cho Grouped BarChart: so sánh delivered vs cancelled
const getWeeklyOrderStatus = async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    startDate.setHours(0, 0, 0, 0);

    // Aggregation: group theo ngày + status, đếm số đơn
    const result = await Order.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
            $group: {
                _id: {
                    date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    status: '$status'
                },
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id.date': 1 } }
    ]);

    // Reshape: [{ date, delivered, cancelled }]
    const dateMap = {};
    result.forEach(item => {
        const d = item._id.date;
        if (!dateMap[d]) dateMap[d] = { date: d, delivered: 0, cancelled: 0, other: 0 };
        if (item._id.status === 'delivered') dateMap[d].delivered = item.count;
        else if (item._id.status === 'cancelled') dateMap[d].cancelled = item.count;
        else dateMap[d].other += item.count;
    });

    return Object.values(dateMap);
};

// ===== 7. DOANH THU THEO DANH MỤC SẢN PHẨM =====
// Dữ liệu cho Horizontal BarChart
const getRevenueByCategory = async () => {
    const result = await Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $unwind: '$items' },
        // Lookup product → lấy category
        {
            $lookup: {
                from: 'products',
                localField: 'items.product',
                foreignField: '_id',
                as: 'productInfo'
            }
        },
        { $unwind: { path: '$productInfo', preserveNullAndEmptyArrays: true } },
        // Lookup category → lấy tên
        {
            $lookup: {
                from: 'categories',
                localField: 'productInfo.category',
                foreignField: '_id',
                as: 'categoryInfo'
            }
        },
        { $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true } },
        {
            $group: {
                _id: '$categoryInfo.name',
                revenue: { $sum: '$items.subtotal' },
                count: { $sum: '$items.quantity' }
            }
        },
        { $sort: { revenue: -1 } },
        { $limit: 6 },
        {
            $project: {
                _id: 0,
                category: { $ifNull: ['$_id', 'Khác'] },
                revenue: 1,
                count: 1
            }
        }
    ]);

    return result;
};

// ===== 8. LOẠI KHÁCH HÀNG: MỚI vs QUAY LẠI =====
// Dữ liệu cho DonutChart
const getCustomerTypes = async () => {
    // User totalOrders = 0 hoặc 1 → "Mới", > 1 → "Quay lại"
    const result = await User.aggregate([
        { $match: { role: 'user', isActive: true } },
        {
            $group: {
                _id: {
                    $cond: [{ $lte: ['$totalOrders', 1] }, 'Khách mới', 'Quay lại']
                },
                count: { $sum: 1 }
            }
        },
        { $project: { _id: 0, type: '$_id', count: 1 } }
    ]);

    return result;
};

// ===== 9. TOP KHÁCH HÀNG CHI TIÊU NHIỀU NHẤT =====
const getTopCustomers = async (limit = 5) => {
    const result = await Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        {
            $group: {
                _id: '$user',
                totalSpent: { $sum: '$totalAmount' },
                orderCount: { $sum: 1 }
            }
        },
        { $sort: { totalSpent: -1 } },
        { $limit: limit },
        {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'userInfo'
            }
        },
        { $unwind: '$userInfo' },
        {
            $project: {
                _id: 0,
                userId: '$_id',
                username: '$userInfo.username',
                email: '$userInfo.email',
                avatar: '$userInfo.avatar',
                totalSpent: 1,
                orderCount: 1
            }
        }
    ]);

    return result;
};

// ===== 10. XUẤT FILE EXCEL — Danh sách đơn hàng & doanh thu =====
const exportOrdersExcel = async (res, month, year) => {
    // Lấy tất cả đơn hàng đã thanh toán (có lọc theo năm/tháng nếu có), populate user
    let query = { paymentStatus: 'paid' };
    if (month && year) {
        const { start, end } = getMonthRange(month, year);
        query.createdAt = { $gte: start, $lte: end };
    }

    const orders = await Order.find(query)
        .populate('user', 'username email')
        .sort({ createdAt: -1 })
        .lean();

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Zero-Waste Admin';
    workbook.created = new Date();

    // --- Sheet 1: Danh sách đơn hàng ---
    const orderSheet = workbook.addWorksheet('Đơn hàng', {
        properties: { tabColor: { argb: '16A34A' } }
    });

    orderSheet.columns = [
        { header: 'Mã đơn', key: 'orderNumber', width: 20 },
        { header: 'Khách hàng', key: 'customer', width: 25 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Tổng tiền (VND)', key: 'totalAmount', width: 18 },
        { header: 'Trạng thái', key: 'status', width: 15 },
        { header: 'Thanh toán', key: 'paymentMethod', width: 15 },
        { header: 'Ngày đặt', key: 'createdAt', width: 20 }
    ];

    // Style header row
    orderSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    orderSheet.getRow(1).fill = {
        type: 'pattern', pattern: 'solid',
        fgColor: { argb: '16A34A' }  // Green-600
    };

    // Đổ dữ liệu đơn hàng vào từng row
    orders.forEach(order => {
        orderSheet.addRow({
            orderNumber: order.orderNumber,
            customer: order.user?.username || 'N/A',
            email: order.user?.email || 'N/A',
            totalAmount: order.totalAmount,
            status: order.status,
            paymentMethod: order.paymentMethod,
            createdAt: new Date(order.createdAt).toLocaleDateString('vi-VN')
        });
    });

    // Format cột tiền thành số có dấu phẩy
    orderSheet.getColumn('totalAmount').numFmt = '#,##0';

    // --- Sheet 2: Tổng hợp doanh thu theo tháng ---
    let revenueData;
    let tabName;
    if (month && year) {
        revenueData = await getRevenueByDayInMonth(month, year);
        tabName = 'Doanh thu trong tháng';
    } else {
        revenueData = await getRevenueByMonth(12);
        tabName = 'Doanh thu theo tháng';
    }

    const revenueSheet = workbook.addWorksheet(tabName, {
        properties: { tabColor: { argb: '22C55E' } }
    });

    revenueSheet.columns = [
        { header: month && year ? 'Ngày' : 'Tháng', key: 'date', width: 15 },
        { header: 'Doanh thu (VND)', key: 'revenue', width: 20 },
        { header: 'Số đơn hàng', key: 'orders', width: 15 }
    ];

    revenueSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    revenueSheet.getRow(1).fill = {
        type: 'pattern', pattern: 'solid',
        fgColor: { argb: '22C55E' }
    };

    revenueData.forEach(item => {
        revenueSheet.addRow(item);
    });
    revenueSheet.getColumn('revenue').numFmt = '#,##0';

    // Set response headers để trình duyệt download file
    res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
        'Content-Disposition',
        `attachment; filename=bao-cao-don-hang-${new Date().toISOString().slice(0, 10)}.xlsx`
    );

    // Ghi workbook ra response stream
    await workbook.xlsx.write(res);
    res.end();
};

// ===== 7. XUẤT FILE PDF — Báo cáo doanh thu =====
const exportRevenuePdf = async (res, month, year) => {
    const path = require('path');

    let monthlyStats, revenueData, topProducts, reportTitle, tableTitle, col1Header;

    if (month && year) {
        const { start, end } = getMonthRange(month, year);
        const newOrders = await Order.countDocuments({ createdAt: { $gte: start, $lte: end } });
        const newUsers = await User.countDocuments({ createdAt: { $gte: start, $lte: end } });
        const revenueAgg = await Order.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end }, paymentStatus: 'paid' } },
            { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
        ]);
        monthlyStats = {
            newOrders,
            newUsers,
            monthlyRevenue: revenueAgg.length > 0 ? revenueAgg[0].totalRevenue : 0
        };

        revenueData = await getRevenueByDayInMonth(month, year);
        topProducts = await getTopSellingProductsInMonth(month, year, 5);
        reportTitle = `BÁO CÁO THÁNG ${month}/${year}`;
        tableTitle = `DOANH THU THEO NGÀY TRONG THÁNG ${month}/${year}`;
        col1Header = 'Ngày';
    } else {
        monthlyStats = await getMonthlyStats();
        revenueData = await getRevenueByMonth(6);
        topProducts = await getTopSellingProducts(5);
        reportTitle = `BÁO CÁO THÁNG HIỆN TẠI`;
        tableTitle = 'DOANH THU THEO THÁNG (6 tháng gần nhất)';
        col1Header = 'Tháng';
    }

    // Tạo PDF document
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Đăng ký font Arial (hỗ trợ tiếng Việt Unicode)
    const fontDir = path.join(__dirname, '..', 'assets', 'fonts');
    doc.registerFont('Arial', path.join(fontDir, 'arial.ttf'));
    doc.registerFont('Arial-Bold', path.join(fontDir, 'arialbd.ttf'));

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    const filenameDate = month && year ? `${year}-${String(month).padStart(2, '0')}` : new Date().toISOString().slice(0, 10);
    res.setHeader(
        'Content-Disposition',
        `attachment; filename=bao-cao-doanh-thu-${filenameDate}.pdf`
    );

    // Pipe PDF stream → response
    doc.pipe(res);

    // --- Tiêu đề ---
    doc.fontSize(22).font('Arial-Bold')
        .text(reportTitle, { align: 'center' });
    doc.fontSize(11).font('Arial')
        .text(`Zero-Waste E-commerce | Ngày in: ${new Date().toLocaleDateString('vi-VN')}`, {
            align: 'center'
        });
    doc.moveDown(1.5);

    // --- Tổng quan tháng hiện tại ---
    doc.fontSize(14).font('Arial-Bold')
        .text('TỔNG QUAN');
    doc.moveDown(0.5);
    doc.fontSize(11).font('Arial');
    doc.text(`Tổng doanh thu: ${monthlyStats.monthlyRevenue.toLocaleString('vi-VN')} VNĐ`);
    doc.text(`Đơn hàng mới: ${monthlyStats.newOrders}`);
    doc.text(`Người dùng mới: ${monthlyStats.newUsers}`);
    doc.moveDown(1.5);

    // --- Bảng doanh thu theo tháng ---
    doc.fontSize(14).font('Arial-Bold')
        .text(tableTitle);
    doc.moveDown(0.5);

    // Vẽ header bảng
    const tableTop = doc.y;
    const col1 = 50, col2 = 200, col3 = 380;

    doc.fontSize(10).font('Arial-Bold');
    doc.text(col1Header, col1, tableTop);
    doc.text('Doanh thu (VNĐ)', col2, tableTop);
    doc.text('Số đơn hàng', col3, tableTop);

    // Vẽ đường kẻ header
    doc.moveTo(col1, tableTop + 15)
        .lineTo(500, tableTop + 15)
        .stroke();

    // Vẽ data rows
    doc.font('Arial').fontSize(10);
    let rowY = tableTop + 22;
    revenueData.forEach(item => {
        doc.text(item.date, col1, rowY);
        doc.text(item.revenue.toLocaleString('vi-VN'), col2, rowY);
        doc.text(String(item.orders), col3, rowY);
        rowY += 18;
    });

    doc.moveDown(2);
    doc.y = rowY + 20;

    // --- Top sản phẩm bán chạy ---
    doc.fontSize(14).font('Arial-Bold')
        .text('TOP 5 SẢN PHẨM BÁN CHẠY');
    doc.moveDown(0.5);

    const prodTop = doc.y;
    doc.fontSize(10).font('Arial-Bold');
    doc.text('STT', col1, prodTop);
    doc.text('Tên sản phẩm', col1 + 40, prodTop);
    doc.text('Số lượng bán', col2 + 80, prodTop);
    doc.text('Doanh thu (VNĐ)', col3, prodTop);

    doc.moveTo(col1, prodTop + 15)
        .lineTo(500, prodTop + 15)
        .stroke();

    doc.font('Arial').fontSize(10);
    let prodY = prodTop + 22;
    topProducts.forEach((product, index) => {
        doc.text(String(index + 1), col1, prodY);
        // Truncate tên sản phẩm nếu quá dài
        const truncatedName = product.name && product.name.length > 30
            ? product.name.substring(0, 30) + '...'
            : (product.name || 'N/A');
        doc.text(truncatedName, col1 + 40, prodY);
        doc.text(String(product.totalQuantity), col2 + 80, prodY);
        doc.text(product.totalRevenue.toLocaleString('vi-VN'), col3, prodY);
        prodY += 18;
    });

    // Footer
    doc.moveDown(3);
    doc.fontSize(9).font('Arial')
        .text('--- Được tạo bởi Zero-Waste E-commerce Admin ---', {
            align: 'center'
        });

    doc.end();
};

// ===== 11. FILTERED QUERIES (theo tháng/năm cụ thể) =====

// Helper: tạo date range cho 1 tháng cụ thể
const getMonthRange = (month, year) => {
    const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const end = new Date(year, month, 0, 23, 59, 59, 999); // last day of month
    return { start, end };
};

// Doanh thu theo ngày trong 1 tháng cụ thể
const getRevenueByDayInMonth = async (month, year) => {
    const { start, end } = getMonthRange(month, year);
    const revenue = await Order.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $addFields: { orderTotalItems: { $sum: "$items.quantity" } } },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                totalRevenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmount', 0] } },
                orderCount: { $sum: 1 },
                totalItemsCount: { $sum: "$orderTotalItems" }
            }
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: '$_id', revenue: '$totalRevenue', orders: '$orderCount', items: '$totalItemsCount' } }
    ]);
    return revenue;
};

// Top sản phẩm bán chạy trong 1 tháng
const getTopSellingProductsInMonth = async (month, year, limit = 5) => {
    const { start, end } = getMonthRange(month, year);
    const topProducts = await Order.aggregate([
        { $match: { paymentStatus: 'paid', createdAt: { $gte: start, $lte: end } } },
        { $unwind: '$items' },
        {
            $group: {
                _id: '$items.product',
                totalQuantity: { $sum: '$items.quantity' },
                totalRevenue: { $sum: '$items.subtotal' },
                productName: { $first: '$items.productName' },
                productImage: { $first: '$items.productImage' }
            }
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: limit },
        { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'productInfo' } },
        { $unwind: { path: '$productInfo', preserveNullAndEmptyArrays: true } },
        { $project: { _id: 0, productId: '$_id', name: '$productName', image: { $ifNull: [{ $arrayElemAt: ['$productInfo.images.url', 0] }, '$productImage'] }, totalQuantity: 1, totalRevenue: 1 } }
    ]);
    return topProducts;
};

// Top khách hàng trong 1 tháng
const getTopCustomersInMonth = async (month, year, limit = 5) => {
    const { start, end } = getMonthRange(month, year);
    const result = await Order.aggregate([
        { $match: { paymentStatus: 'paid', createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: '$user', totalSpent: { $sum: '$totalAmount' }, orderCount: { $sum: 1 } } },
        { $sort: { totalSpent: -1 } },
        { $limit: limit },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userInfo' } },
        { $unwind: '$userInfo' },
        { $project: { _id: 0, userId: '$_id', username: '$userInfo.username', email: '$userInfo.email', totalSpent: 1, orderCount: 1 } }
    ]);
    return result;
};

// Doanh thu theo danh mục trong 1 tháng
const getRevenueByCategoryInMonth = async (month, year) => {
    const { start, end } = getMonthRange(month, year);
    const result = await Order.aggregate([
        { $match: { paymentStatus: 'paid', createdAt: { $gte: start, $lte: end } } },
        { $unwind: '$items' },
        { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'productInfo' } },
        { $unwind: { path: '$productInfo', preserveNullAndEmptyArrays: true } },
        { $lookup: { from: 'categories', localField: 'productInfo.category', foreignField: '_id', as: 'categoryInfo' } },
        { $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true } },
        { $group: { _id: '$categoryInfo.name', revenue: { $sum: '$items.subtotal' }, count: { $sum: '$items.quantity' } } },
        { $sort: { revenue: -1 } },
        { $limit: 6 },
        { $project: { _id: 0, category: { $ifNull: ['$_id', 'Khác'] }, revenue: 1, count: 1 } }
    ]);
    return result;
};

// Hiệu suất đơn hàng trong 1 tháng (thành công / chờ / hủy)
const getOrderPerformanceInMonth = async (month, year) => {
    const { start, end } = getMonthRange(month, year);
    const result = await Order.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { _id: 0, status: '$_id', count: 1 } }
    ]);
    // Reshape
    const map = {};
    result.forEach(r => { map[r.status] = r.count; });
    return [
        { name: 'Thành công', value: (map['delivered'] || 0) },
        { name: 'Chờ thanh toán', value: (map['pending'] || 0) + (map['confirmed'] || 0) + (map['processing'] || 0) + (map['shipping'] || 0) },
        { name: 'Hủy', value: (map['cancelled'] || 0) },
    ];
};

module.exports = {
    getRevenueByDay,
    getRevenueByMonth,
    getMonthlyStats,
    getTopSellingProducts,
    getLowStockProducts,
    getWeeklyOrderStatus,
    getRevenueByCategory,
    getCustomerTypes,
    getTopCustomers,
    exportOrdersExcel,
    exportRevenuePdf,
    // Filtered by month/year
    getRevenueByDayInMonth,
    getTopSellingProductsInMonth,
    getTopCustomersInMonth,
    getRevenueByCategoryInMonth,
    getOrderPerformanceInMonth,
};
