const Product = require('../models/Product');

/**
 * Inventory Service
 * Cung cấp các hàm tra cứu tồn kho cho Gemini Function Calling
 */

/**
 * Tìm sản phẩm theo tên và trả về thông tin tồn kho
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
      .select('name stock inStock price finalPrice category sold ecoScore')
      .populate('category', 'name')
      .limit(5)
      .lean();

    // Nếu không tìm thấy chính xác → tìm kiếm mờ (fuzzy / partial match)
    if (products.length === 0) {
      products = await Product.find({
        name: { $regex: escaped, $options: 'i' },
        isActive: true
      })
        .select('name stock inStock price finalPrice category sold ecoScore')
        .populate('category', 'name')
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

    // Tìm thấy đúng 1 sản phẩm
    if (products.length === 1) {
      const p = products[0];
      return {
        found: true,
        product: {
          name: p.name,
          stock: p.stock,
          inStock: p.inStock,
          price: p.price,
          finalPrice: p.finalPrice,
          category: p.category?.name || 'Không rõ',
          sold: p.sold,
          ecoScore: p.ecoScore
        }
      };
    }

    // Tìm thấy nhiều sản phẩm → trả danh sách để Gemini hỏi lại
    return {
      found: true,
      multipleResults: true,
      count: products.length,
      products: products.map((p) => ({
        name: p.name,
        stock: p.stock,
        inStock: p.inStock,
        price: p.price,
        finalPrice: p.finalPrice,
        category: p.category?.name || 'Không rõ'
      })),
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

// Map tên hàm → hàm thực thi (dùng trong geminiService)
const AVAILABLE_FUNCTIONS = {
  checkProductStock
};

module.exports = {
  checkProductStock,
  AVAILABLE_FUNCTIONS
};
