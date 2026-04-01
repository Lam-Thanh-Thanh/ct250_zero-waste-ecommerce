const Product = require('../models/Product');
const Promotion = require('../models/Promotion');

/**
 * Inventory Service
 * Cung cấp các hàm tra cứu tồn kho & khuyến mãi cho Gemini Function Calling
 */

/**
 * Tìm sản phẩm theo tên và trả về thông tin tồn kho + biến thể (variants)
 * @param {string} productName - Tên sản phẩm (hoặc một phần tên)
 * @returns {Object} Kết quả tra cứu dạng JSON cho Gemini
 */
const checkProductStock = async (productName) => {
  try {
    if (!productName || !productName.trim()) {
      return {
        found: false,
        message: 'Tên sản phẩm không được để trống.'
      };
    }

    const trimmed = productName.trim();

    // Escape ký tự regex đặc biệt
    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Tìm kiếm chính xác trước (case-insensitive)
    let products = await Product.find({
      name: { $regex: `^${escaped}$`, $options: 'i' },
      isActive: true
    })
      .select('name stock inStock price discount finalPrice category sold ecoScore variants')
      .populate('category', 'name')
      .populate('variants')
      .limit(5)
      .lean();

    // Nếu không tìm thấy chính xác → tìm kiếm mờ (fuzzy / partial match)
    if (products.length === 0) {
      products = await Product.find({
        name: { $regex: escaped, $options: 'i' },
        isActive: true
      })
        .select('name stock inStock price discount finalPrice category sold ecoScore variants')
        .populate('category', 'name')
        .populate('variants')
        .limit(5)
        .lean();
    }

    // Không tìm thấy sản phẩm nào
    if (products.length === 0) {
      return {
        found: false,
        searchTerm: trimmed,
        message: `Không tìm thấy sản phẩm nào có tên "${trimmed}" trong cửa hàng. Khách hàng có thể kiểm tra lại tên sản phẩm hoặc duyệt danh mục trên website.`
      };
    }

    /**
     * Helper: format thông tin biến thể cho Gemini
     */
    const formatVariants = (product) => {
      if (!product.variants || product.variants.length === 0) {
        return { hasVariants: false, variants: [] };
      }

      return {
        hasVariants: true,
        variantCount: product.variants.length,
        variants: product.variants.map((v) => {
          const variantLabel = [
            v.size ? `Size: ${v.size}` : '',
            v.weight ? `Trọng lượng: ${v.weight}g` : '',
            v.volume ? `Dung tích: ${v.volume}` : ''
          ].filter(Boolean).join(', ');

          const variantPrice = product.price + (v.priceModifier || 0);
          const variantFinalPrice = variantPrice - (variantPrice * (product.discount || 0) / 100);

          return {
            label: variantLabel || 'Mặc định',
            size: v.size || null,
            weight: v.weight || null,
            volume: v.volume || null,
            priceModifier: v.priceModifier || 0,
            price: variantPrice,
            finalPrice: Math.round(variantFinalPrice),
            stockQuantity: v.stockQuantity,
            inStock: v.stockQuantity > 0
          };
        })
      };
    };

    // Tìm thấy đúng 1 sản phẩm
    if (products.length === 1) {
      const p = products[0];
      const variantInfo = formatVariants(p);

      return {
        found: true,
        product: {
          name: p.name,
          stock: p.stock,
          inStock: p.inStock,
          price: p.price,
          discount: p.discount || 0,
          finalPrice: p.finalPrice,
          category: p.category?.name || 'Không rõ',
          sold: p.sold,
          ecoScore: p.ecoScore,
          ...variantInfo
        }
      };
    }

    // Tìm thấy nhiều sản phẩm → trả danh sách để Gemini hỏi lại
    return {
      found: true,
      multipleResults: true,
      count: products.length,
      products: products.map((p) => {
        const variantInfo = formatVariants(p);
        return {
          name: p.name,
          stock: p.stock,
          inStock: p.inStock,
          price: p.price,
          discount: p.discount || 0,
          finalPrice: p.finalPrice,
          category: p.category?.name || 'Không rõ',
          ...variantInfo
        };
      }),
      message: `Tìm thấy ${products.length} sản phẩm phù hợp với "${trimmed}". Hãy liệt kê cho khách hàng và hỏi họ muốn biết về sản phẩm nào cụ thể.`
    };
  } catch (error) {
    console.error('inventoryService.checkProductStock error:', error);
    return {
      found: false,
      error: true,
      message: 'Đã xảy ra lỗi khi truy vấn cơ sở dữ liệu. Vui lòng thử lại sau.'
    };
  }
};

/**
 * Tra cứu các chương trình khuyến mãi đang hoạt động
 * @param {string} [keyword] - Từ khóa tìm kiếm (tùy chọn)
 * @returns {Object} Danh sách khuyến mãi đang hoạt động
 */
const getActivePromotions = async (keyword) => {
  try {
    const now = new Date();

    // Tìm tất cả promotion đang active và trong thời hạn
    const query = {
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    };

    // Nếu có keyword, thêm điều kiện tìm kiếm
    if (keyword && keyword.trim()) {
      const escaped = keyword.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { code: { $regex: escaped, $options: 'i' } },
        { name: { $regex: escaped, $options: 'i' } },
        { description: { $regex: escaped, $options: 'i' } }
      ];
    }

    const promotions = await Promotion.find(query)
      .select('code name description discountValue type applicableTo minOrderAmount startDate endDate usageLimit usedCount')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    if (promotions.length === 0) {
      return {
        found: false,
        message: keyword
          ? `Không tìm thấy khuyến mãi nào liên quan đến "${keyword.trim()}".`
          : 'Hiện tại không có chương trình khuyến mãi nào đang hoạt động.'
      };
    }

    return {
      found: true,
      count: promotions.length,
      promotions: promotions.map((p) => {
        // Tính số lượt còn lại
        const remainingUses = p.usageLimit !== null
          ? Math.max(0, p.usageLimit - p.usedCount)
          : null; // null = không giới hạn

        return {
          code: p.code,
          name: p.name,
          description: p.description || '',
          discountValue: p.discountValue,
          type: p.type, // 'percentage' hoặc 'fixed'
          typeLabel: p.type === 'percentage'
            ? `Giảm ${p.discountValue}%`
            : `Giảm ${p.discountValue.toLocaleString('vi-VN')}₫`,
          applicableTo: p.applicableTo, // 'all', 'category', 'product'
          applicableToLabel: p.applicableTo === 'all'
            ? 'Tất cả sản phẩm'
            : p.applicableTo === 'category'
              ? 'Theo danh mục'
              : 'Theo sản phẩm',
          minOrderAmount: p.minOrderAmount,
          minOrderAmountLabel: p.minOrderAmount > 0
            ? `Đơn tối thiểu ${p.minOrderAmount.toLocaleString('vi-VN')}₫`
            : 'Không yêu cầu đơn tối thiểu',
          startDate: p.startDate.toISOString().slice(0, 10),
          endDate: p.endDate.toISOString().slice(0, 10),
          remainingUses: remainingUses,
          remainingUsesLabel: remainingUses !== null
            ? `Còn ${remainingUses} lượt sử dụng`
            : 'Không giới hạn lượt sử dụng'
        };
      }),
      message: `Tìm thấy ${promotions.length} khuyến mãi đang hoạt động. Hãy liệt kê đầy đủ mã khuyến mãi, giá trị giảm, điều kiện áp dụng cho khách hàng.`
    };
  } catch (error) {
    console.error('inventoryService.getActivePromotions error:', error);
    return {
      found: false,
      error: true,
      message: 'Đã xảy ra lỗi khi truy vấn dữ liệu khuyến mãi. Vui lòng thử lại sau.'
    };
  }
};

// Map tên hàm → hàm thực thi (dùng trong geminiService)
const AVAILABLE_FUNCTIONS = {
  checkProductStock,
  getActivePromotions
};

module.exports = {
  checkProductStock,
  getActivePromotions,
  AVAILABLE_FUNCTIONS
};
