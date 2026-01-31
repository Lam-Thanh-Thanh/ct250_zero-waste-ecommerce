# 🏗️ LAYERED ARCHITECTURE CHI TIẾT

## 📊 SƠ ĐỒ TỔNG QUAN

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
│                    React Frontend Application                    │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP Request (REST API)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Routes     │  │ Controllers  │  │ Middlewares  │          │
│  │ (Endpoints)  │→ │  (HTTP I/O)  │  │ (Auth, Valid)│          │
│  └──────────────┘  └──────┬───────┘  └──────────────┘          │
└─────────────────────────────┼────────────────────────────────────┘
                              │ Call Business Logic
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                          │
│  ┌──────────────────────────────────────────────────────┐       │
│  │                   Services                            │       │
│  │  - authService.js    - cartService.js                │       │
│  │  - productService.js - orderService.js               │       │
│  │  - chatbotService.js - emailService.js               │       │
│  └────────────────────────┬─────────────────────────────┘       │
└─────────────────────────────┼────────────────────────────────────┘
                              │ Call Data Access
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATA ACCESS LAYER (Optional)                  │
│  ┌──────────────────────────────────────────────────────┐       │
│  │                 Repositories                          │       │
│  │  - userRepository.js                                 │       │
│  │  - productRepository.js                              │       │
│  │  - orderRepository.js                                │       │
│  └────────────────────────┬─────────────────────────────┘       │
└─────────────────────────────┼────────────────────────────────────┘
                              │ CRUD Operations
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                               │
│  ┌──────────────────────────────────────────────────────┐       │
│  │              Models (Mongoose Schemas)               │       │
│  │  User, Product, Order, Cart, Review, etc.           │       │
│  └────────────────────────┬─────────────────────────────┘       │
└─────────────────────────────┼────────────────────────────────────┘
                              │ MongoDB Driver
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATABASE                                  │
│                    MongoDB (NoSQL)                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 LUỒNG XỬ LÝ 1 REQUEST

### Ví dụ: Thêm sản phẩm vào giỏ hàng

```
1. CLIENT gửi request:
   POST /api/cart/items
   Body: { productVariantId: "123", quantity: 2 }
   Header: Authorization: Bearer <token>
   
   ↓

2. ROUTES (cartRoutes.js):
   router.post('/items', authMiddleware, addToCart)
   → Kiểm tra authentication
   → Gọi controller
   
   ↓

3. CONTROLLER (cartController.js):
   - Nhận request (req.body, req.user)
   - Validate input
   - Gọi Service
   - Trả response
   
   const addToCart = async (req, res) => {
     try {
       const { productVariantId, quantity } = req.body;
       const userId = req.user.id;
       
       const cart = await cartService.addItem(userId, productVariantId, quantity);
       
       res.status(200).json({
         success: true,
         data: cart
       });
     } catch (error) {
       res.status(400).json({
         success: false,
         message: error.message
       });
     }
   }
   
   ↓

4. SERVICE (cartService.js):
   - Xử lý logic nghiệp vụ
   - Không biết về HTTP
   - Gọi Repository hoặc Model trực tiếp
   
   const addItem = async (userId, variantId, quantity) => {
     // Kiểm tra sản phẩm còn hàng không
     const variant = await ProductVariant.findById(variantId);
     if (!variant || variant.stockQuantity < quantity) {
       throw new Error('Sản phẩm không đủ số lượng');
     }
     
     // Tìm hoặc tạo giỏ hàng
     let cart = await Cart.findOne({ userId });
     if (!cart) {
       cart = await Cart.create({ userId });
     }
     
     // Kiểm tra xem sản phẩm đã có trong giỏ chưa
     const existingItem = await CartItem.findOne({
       cartId: cart._id,
       variantId
     });
     
     if (existingItem) {
       // Cập nhật số lượng
       existingItem.quantity += quantity;
       await existingItem.save();
     } else {
       // Thêm mới
       await CartItem.create({
         cartId: cart._id,
         variantId,
         quantity
       });
     }
     
     // Trả về giỏ hàng đầy đủ
     return await this.getCart(userId);
   }
   
   ↓

5. MODEL (Cart.js, CartItem.js):
   - Mongoose Schema
   - Tương tác với MongoDB
   
   const cartSchema = new mongoose.Schema({
     userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
   });
   
   const cartItemSchema = new mongoose.Schema({
     cartId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cart' },
     variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant' },
     quantity: { type: Number, required: true }
   });
   
   ↓

6. DATABASE (MongoDB):
   - Lưu trữ dữ liệu
   - Trả kết quả về
```

---

## 📁 CẤU TRÚC FILE VÀ NHIỆM VỤ

### 1. ROUTES (Presentation Layer)

**File:** `src/routes/cartRoutes.js`

**Nhiệm vụ:**
- Định nghĩa endpoints (URL paths)
- Áp dụng middlewares
- Gọi controller functions

**Ví dụ:**
```javascript
const express = require('express');
const router = express.Router();
const { 
  addToCart, 
  getCart, 
  updateCartItem, 
  removeCartItem 
} = require('../controllers/cartController');
const { authMiddleware } = require('../middlewares/auth');

// Tất cả routes cần authentication
router.use(authMiddleware);

router.post('/items', addToCart);           // Thêm vào giỏ
router.get('/', getCart);                   // Xem giỏ hàng
router.put('/items/:itemId', updateCartItem); // Cập nhật
router.delete('/items/:itemId', removeCartItem); // Xóa

module.exports = router;
```

---

### 2. CONTROLLERS (Presentation Layer)

**File:** `src/controllers/cartController.js`

**Nhiệm vụ:**
- Nhận HTTP request (req, res)
- Extract data từ req.body, req.params, req.query
- Gọi Service functions
- Trả HTTP response
- Xử lý lỗi HTTP

**Ví dụ:**
```javascript
const cartService = require('../services/cartService');

exports.addToCart = async (req, res) => {
  try {
    const { productVariantId, quantity } = req.body;
    const userId = req.user.id; // Từ authMiddleware
    
    // Validate input
    if (!productVariantId || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin sản phẩm hoặc số lượng'
      });
    }
    
    // Gọi service
    const cart = await cartService.addItem(userId, productVariantId, quantity);
    
    // Trả response
    res.status(200).json({
      success: true,
      message: 'Đã thêm vào giỏ hàng',
      data: cart
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await cartService.getCart(userId);
    
    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
```

---

### 3. SERVICES (Business Logic Layer)

**File:** `src/services/cartService.js`

**Nhiệm vụ:**
- Xử lý TOÀN BỘ logic nghiệp vụ
- KHÔNG biết về HTTP request/response
- Gọi Models hoặc Repositories
- Throw Error nếu có lỗi (không xử lý HTTP status)

**Ví dụ:**
```javascript
const Cart = require('../models/Cart');
const CartItem = require('../models/CartItem');
const ProductVariant = require('../models/ProductVariant');

class CartService {
  async addItem(userId, variantId, quantity) {
    // Kiểm tra sản phẩm
    const variant = await ProductVariant.findById(variantId)
      .populate('productId');
      
    if (!variant) {
      throw new Error('Sản phẩm không tồn tại');
    }
    
    if (variant.stockQuantity < quantity) {
      throw new Error(`Chỉ còn ${variant.stockQuantity} sản phẩm`);
    }
    
    // Tìm hoặc tạo giỏ hàng
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = await Cart.create({ userId });
    }
    
    // Kiểm tra sản phẩm đã có trong giỏ chưa
    let cartItem = await CartItem.findOne({
      cartId: cart._id,
      variantId
    });
    
    if (cartItem) {
      // Cập nhật số lượng
      const newQuantity = cartItem.quantity + quantity;
      
      if (newQuantity > variant.stockQuantity) {
        throw new Error('Vượt quá số lượng có sẵn');
      }
      
      cartItem.quantity = newQuantity;
      await cartItem.save();
    } else {
      // Thêm mới
      cartItem = await CartItem.create({
        cartId: cart._id,
        variantId,
        quantity
      });
    }
    
    // Trả về giỏ hàng đầy đủ
    return this.getCart(userId);
  }
  
  async getCart(userId) {
    const cart = await Cart.findOne({ userId });
    
    if (!cart) {
      return { items: [], totalAmount: 0 };
    }
    
    const items = await CartItem.find({ cartId: cart._id })
      .populate({
        path: 'variantId',
        populate: { path: 'productId' }
      });
    
    // Tính tổng tiền
    const totalAmount = items.reduce((sum, item) => {
      const price = item.variantId.productId.price + 
                   item.variantId.priceModifier;
      return sum + (price * item.quantity);
    }, 0);
    
    return {
      cartId: cart._id,
      items,
      totalAmount
    };
  }
  
  async updateItemQuantity(userId, itemId, quantity) {
    // Logic cập nhật số lượng
    const cartItem = await CartItem.findById(itemId)
      .populate('variantId');
      
    if (!cartItem) {
      throw new Error('Sản phẩm không có trong giỏ hàng');
    }
    
    // Kiểm tra cart thuộc về user này
    const cart = await Cart.findOne({ 
      _id: cartItem.cartId, 
      userId 
    });
    
    if (!cart) {
      throw new Error('Không có quyền thao tác');
    }
    
    if (quantity <= 0) {
      await cartItem.deleteOne();
    } else {
      if (quantity > cartItem.variantId.stockQuantity) {
        throw new Error('Vượt quá số lượng có sẵn');
      }
      
      cartItem.quantity = quantity;
      await cartItem.save();
    }
    
    return this.getCart(userId);
  }
  
  async removeItem(userId, itemId) {
    const cartItem = await CartItem.findById(itemId);
    
    if (!cartItem) {
      throw new Error('Sản phẩm không có trong giỏ hàng');
    }
    
    // Kiểm tra quyền
    const cart = await Cart.findOne({ 
      _id: cartItem.cartId, 
      userId 
    });
    
    if (!cart) {
      throw new Error('Không có quyền thao tác');
    }
    
    await cartItem.deleteOne();
    
    return this.getCart(userId);
  }
  
  async clearCart(userId) {
    const cart = await Cart.findOne({ userId });
    
    if (cart) {
      await CartItem.deleteMany({ cartId: cart._id });
    }
    
    return { items: [], totalAmount: 0 };
  }
}

module.exports = new CartService();
```

---

### 4. REPOSITORIES (Data Access Layer - TÙY CHỌN)

**File:** `src/repositories/cartRepository.js`

**Nhiệm vụ:**
- CRUD operations với database
- Query phức tạp
- Tối ưu performance

**Khi nào dùng?**
- Dự án lớn, logic phức tạp
- Cần reuse các query
- Cần mock dễ dàng khi test

**Ví dụ:**
```javascript
const Cart = require('../models/Cart');
const CartItem = require('../models/CartItem');

class CartRepository {
  async findCartByUserId(userId) {
    return Cart.findOne({ userId });
  }
  
  async createCart(userId) {
    return Cart.create({ userId });
  }
  
  async findCartItemByVariant(cartId, variantId) {
    return CartItem.findOne({ cartId, variantId });
  }
  
  async getCartWithItems(cartId) {
    return CartItem.find({ cartId })
      .populate({
        path: 'variantId',
        populate: { 
          path: 'productId',
          populate: { path: 'images' }
        }
      });
  }
  
  async deleteAllCartItems(cartId) {
    return CartItem.deleteMany({ cartId });
  }
}

module.exports = new CartRepository();
```

**Service sẽ dùng Repository:**
```javascript
const cartRepository = require('../repositories/cartRepository');

class CartService {
  async getCart(userId) {
    let cart = await cartRepository.findCartByUserId(userId);
    
    if (!cart) {
      return { items: [], totalAmount: 0 };
    }
    
    const items = await cartRepository.getCartWithItems(cart._id);
    
    // ... tính toán
  }
}
```

---

### 5. MODELS (Data Layer)

**File:** `src/models/Cart.js`, `src/models/CartItem.js`

**Nhiệm vụ:**
- Định nghĩa schema (cấu trúc dữ liệu)
- Validation rules
- Relationships (references)
- Virtual fields
- Hooks (pre/post save)

**Ví dụ:**
```javascript
// src/models/Cart.js
const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Cart', cartSchema);

// src/models/CartItem.js
const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  cartId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cart',
    required: true
  },
  variantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductVariant',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  }
}, {
  timestamps: true
});

// Index để query nhanh hơn
cartItemSchema.index({ cartId: 1, variantId: 1 }, { unique: true });

module.exports = mongoose.model('CartItem', cartItemSchema);
```

---

## ✅ LỢI ÍCH CỦA LAYERED ARCHITECTURE

### 1. Separation of Concerns (Tách biệt trách nhiệm)
- Mỗi layer chỉ làm 1 việc
- Dễ tìm bug (biết bug ở layer nào)
- Dễ thay đổi (sửa 1 layer không ảnh hưởng layer khác)

### 2. Testability (Dễ test)
```javascript
// Test Service độc lập, không cần HTTP
describe('CartService', () => {
  it('should add item to cart', async () => {
    const result = await cartService.addItem('user123', 'variant456', 2);
    expect(result.items).toHaveLength(1);
  });
});

// Mock dễ dàng
jest.mock('../models/ProductVariant');
```

### 3. Reusability (Tái sử dụng)
```javascript
// Service có thể được dùng ở nhiều nơi
// Controller gọi
const cart = await cartService.addItem(...);

// Scheduler/Cron job gọi
const cart = await cartService.addItem(...);

// CLI command gọi
const cart = await cartService.addItem(...);
```

### 4. Maintainability (Dễ bảo trì)
- Code có cấu trúc rõ ràng
- Dễ onboard thành viên mới
- Dễ refactor

### 5. Scalability (Dễ mở rộng)
- Thêm feature mới không phá code cũ
- Có thể tách microservices sau này

---

## 🚫 SAI LẦM THƯỜNG GẶP

### ❌ Sai: Controller chứa business logic
```javascript
// BAD
exports.addToCart = async (req, res) => {
  const variant = await ProductVariant.findById(req.body.variantId);
  if (!variant) {
    return res.status(404).json({ message: 'Not found' });
  }
  
  let cart = await Cart.findOne({ userId: req.user.id });
  // ... 50 dòng logic ở đây
};
```

### ✅ Đúng: Controller gọi Service
```javascript
// GOOD
exports.addToCart = async (req, res) => {
  try {
    const cart = await cartService.addItem(
      req.user.id, 
      req.body.variantId, 
      req.body.quantity
    );
    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
```

### ❌ Sai: Service xử lý HTTP status
```javascript
// BAD
async addItem(userId, variantId, quantity) {
  const variant = await ProductVariant.findById(variantId);
  if (!variant) {
    return { status: 404, message: 'Not found' }; // WRONG!
  }
}
```

### ✅ Đúng: Service throw Error
```javascript
// GOOD
async addItem(userId, variantId, quantity) {
  const variant = await ProductVariant.findById(variantId);
  if (!variant) {
    throw new Error('Sản phẩm không tồn tại');
  }
}
```

---

## 🎯 KẾT LUẬN

**Quy tắc vàng:**
1. **Routes** → Định nghĩa đường dẫn
2. **Controllers** → Xử lý HTTP I/O
3. **Services** → Xử lý business logic
4. **Repositories** → Truy vấn database (tùy chọn)
5. **Models** → Định nghĩa schema

**Luồng dữ liệu:**
```
Client → Routes → Middlewares → Controller → Service → Repository → Model → Database
                                                           ↓
                                    Response ← ← ← ← ← ← ←
```

Áp dụng đúng Layered Architecture sẽ giúp dự án của bạn:
- ✅ Dễ đọc, dễ hiểu
- ✅ Dễ test
- ✅ Dễ bảo trì
- ✅ Dễ mở rộng
- ✅ Làm việc nhóm hiệu quả hơn
