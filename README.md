# 🌱 Zero-Waste E-commerce Platform

> Website quản lý cửa hàng sản phẩm zero-waste tích hợp chatbot AI tư vấn lối sống xanh

## 📋 Mục lục

- [Giới thiệu](#giới-thiệu)
- [Tính năng](#tính-năng)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Cài đặt](#cài-đặt)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [API Documentation](#api-documentation)
- [Team](#team)
---

##  Giới thiệu

Zero-Waste E-commerce là nền tảng thương mại điện tử chuyên về sản phẩm thân thiện với môi trường, giúp người dùng dễ dàng tìm kiếm và mua sắm các sản phẩm bền vững. Hệ thống tích hợp chatbot AI để tư vấn lối sống xanh và gợi ý sản phẩm phù hợp.

###  Điểm đặc biệt

-  **Zero-Waste Focus**: Sản phẩm có thuộc tính đặc biệt về môi trường (ecoScore, materials, certifications)
-  **AI Chatbot**: Tư vấn lối sống xanh sử dụng Anthropic Claude API
-  **Eco Points**: Hệ thống điểm thưởng khuyến khích tiêu dùng bền vững
-  **Packaging Management**: Quản lý riêng biệt bao bì để đánh giá mức độ thân thiện môi trường

---

##  Tính năng

### Người dùng (Customer)

-  Đăng ký / Đăng nhập
-  Xem danh sách sản phẩm với filters (giá, ecoScore, vật liệu, chứng nhận...)
-  Xem chi tiết sản phẩm (thuộc tính zero-waste, reviews, variants)
-  Thêm vào giỏ hàng & checkout
-  Theo dõi đơn hàng
-  Đánh giá sản phẩm
-  Quản lý thông tin cá nhân
-  Tích điểm xanh (Eco Points)
-  Chat với AI chatbot về lối sống xanh

### Quản trị viên (Admin)

-  Dashboard với thống kê
-  Quản lý người dùng
-  Quản lý sản phẩm (CRUD)
  - Product variants (colors, sizes, volumes)
  - Zero-waste attributes (ecoScore, materials, certifications)
  - Packaging information
-  Quản lý danh mục sản phẩm (tree structure)
-  Quản lý đơn hàng
-  Quản lý đánh giá
-  Quản lý mã giảm giá
-  Cấu hình chatbot AI
-  Thống kê & báo cáo

---

##  Công nghệ sử dụng

### Backend

- **Runtime**: Node.js (v16+)
- **Framework**: Express.js
- **Database**: MongoDB (v4.4+)
- **ODM**: Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Joi
- **Image Upload**: Multer + Cloudinary

### Frontend

- **Framework**: React (v18+)
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **State Management**: Context API
- **HTTP Client**: Axios
- **Notifications**: React Toastify
- **Forms**: React Hook Form

### DevOps

- **Version Control**: Git + GitHub
- **Package Manager**: npm
- **Environment**: dotenv

---

##  Cài đặt

### Yêu cầu hệ thống

- Node.js >= 16.0.0
- MongoDB >= 4.4
- npm >= 7.0.0

### 1. Clone repository

```bash
git clone https://github.com/YOUR_USERNAME/zero-waste-ecommerce.git
cd zero-waste-ecommerce
```

### 2. Cài đặt Backend

```bash
cd backend
npm install
```

**Tạo file `.env`:**

```env
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/zero-waste-db
# Hoặc MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/zero-waste-db

# JWT
JWT_SECRET=your_jwt_secret_key_at_least_32_characters_long
JWT_EXPIRE=7d

# Cloudinary (optional)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AI Chatbot
ANTHROPIC_API_KEY=your_anthropic_api_key

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:5173
```

**Chạy backend:**

```bash
npm run dev
```

Backend sẽ chạy tại `http://localhost:5000`

### 3. Cài đặt Frontend

```bash
cd frontend
npm install
```

**Tạo file `.env`:**

```env
VITE_API_URL=http://localhost:5000/api
```

**Chạy frontend:**

```bash
npm run dev
```

Frontend sẽ chạy tại `http://localhost:5173`

### 4. Tạo Admin user đầu tiên

```bash
cd backend
node scripts/createAdmin.js
```

Hoặc sử dụng MongoDB shell/Compass để tạo user với `role: "admin"`.

---

## 📁 Cấu trúc dự án

```
zero-waste-ecommerce/
│
├── backend/                          # Node.js + Express API
│   ├── src/
│   │   ├── config/                   # Cấu hình
│   │   │   ├── database.js           # Kết nối MongoDB
│   │   │   ├── cloudinary.js         # Upload ảnh (nếu dùng)
│   │   │   └── env.js                # Biến môi trường
│   │   │
│   │   ├── models/                   # MongoDB Models (Mongoose Schema)
│   │   │   ├── User.js
│   │   │   ├── Product.js
│   │   │   ├── ProductVariant.js
│   │   │   ├── Category.js
│   │   │   ├── Cart.js
│   │   │   ├── CartItem.js
│   │   │   ├── Order.js
│   │   │   ├── OrderDetail.js
│   │   │   ├── Payment.js
│   │   │   ├── Delivery.js
│   │   │   ├── Review.js
│   │   │   ├── Promotion.js
│   │   │   ├── Certificate.js
│   │   │   ├── Packaging.js
│   │   │   ├── Image.js
│   │   │   ├── ChatSession.js
│   │   │   ├── ChatMessage.js
│   │   │   └── ChatbotConfig.js
│   │   │
│   │   ├── controllers/              # Xử lý logic nghiệp vụ
│   │   │   ├── authController.js     # Đăng ký, đăng nhập
│   │   │   ├── userController.js     # Quản lý user
│   │   │   ├── productController.js  # Quản lý sản phẩm
│   │   │   ├── categoryController.js
│   │   │   ├── cartController.js
│   │   │   ├── orderController.js
│   │   │   ├── reviewController.js
│   │   │   ├── promotionController.js
│   │   │   └── chatbotController.js
│   │   │
│   │   ├── services/                 # Business Logic Layer
│   │   │   ├── authService.js
│   │   │   ├── productService.js
│   │   │   ├── cartService.js
│   │   │   ├── orderService.js
│   │   │   ├── paymentService.js
│   │   │   ├── chatbotService.js
│   │   │   └── emailService.js
│   │   │
│   │   ├── repositories/             # Data Access Layer (tùy chọn)
│   │   │   ├── userRepository.js
│   │   │   ├── productRepository.js
│   │   │   └── orderRepository.js
│   │   │
│   │   ├── routes/                   # API Routes
│   │   │   ├── index.js              # Tổng hợp routes
│   │   │   ├── authRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   ├── productRoutes.js
│   │   │   ├── categoryRoutes.js
│   │   │   ├── cartRoutes.js
│   │   │   ├── orderRoutes.js
│   │   │   ├── reviewRoutes.js
│   │   │   ├── promotionRoutes.js
│   │   │   └── chatbotRoutes.js
│   │   │
│   │   ├── middlewares/              # Middleware
│   │   │   ├── auth.js               # Xác thực JWT
│   │   │   ├── authorize.js          # Phân quyền
│   │   │   ├── errorHandler.js       # Xử lý lỗi
│   │   │   ├── validator.js          # Validate dữ liệu
│   │   │   └── upload.js             # Upload file
│   │   │
│   │   ├── utils/                    # Tiện ích
│   │   │   ├── jwt.js                # Tạo/verify token
│   │   │   ├── bcrypt.js             # Mã hóa password
│   │   │   ├── constants.js          # Hằng số
│   │   │   └── helpers.js            # Hàm tiện ích
│   │   │
│   │   ├── validators/               # Validation schemas
│   │   │   ├── authValidator.js
│   │   │   ├── productValidator.js
│   │   │   └── orderValidator.js
│   │   │
│   │   └── app.js                    # Express app setup
│   │
│   ├── .env                          # Biến môi trường (KHÔNG commit)
│   ├── .env.example                  # Mẫu .env
│   ├── .gitignore
│   ├── package.json
│   ├── server.js                     # Entry point
│   └── README.md
│
├── frontend/                         # ReactJS
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.ico
│   │
│   ├── src/
│   │   ├── api/                      # API calls
│   │   │   ├── axios.js              # Axios config
│   │   │   ├── authApi.js
│   │   │   ├── productApi.js
│   │   │   ├── cartApi.js
│   │   │   ├── orderApi.js
│   │   │   └── chatbotApi.js
│   │   │
│   │   ├── components/               # Reusable components
│   │   │   ├── common/
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Input.jsx
│   │   │   │   ├── Card.jsx
│   │   │   │   ├── Modal.jsx
│   │   │   │   └── Loading.jsx
│   │   │   │
│   │   │   ├── layout/
│   │   │   │   ├── Header.jsx
│   │   │   │   ├── Footer.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   └── Navbar.jsx
│   │   │   │
│   │   │   ├── product/
│   │   │   │   ├── ProductCard.jsx
│   │   │   │   ├── ProductList.jsx
│   │   │   │   ├── ProductDetail.jsx
│   │   │   │   └── ProductFilter.jsx
│   │   │   │
│   │   │   ├── cart/
│   │   │   │   ├── CartItem.jsx
│   │   │   │   └── CartSummary.jsx
│   │   │   │
│   │   │   └── chatbot/
│   │   │       ├── ChatWidget.jsx
│   │   │       └── ChatMessage.jsx
│   │   │
│   │   ├── pages/                    # Page components
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── ProductList.jsx
│   │   │   ├── ProductDetail.jsx
│   │   │   ├── Cart.jsx
│   │   │   ├── Checkout.jsx
│   │   │   ├── OrderHistory.jsx
│   │   │   ├── Profile.jsx
│   │   │   │
│   │   │   └── admin/
│   │   │       ├── Dashboard.jsx
│   │   │       ├── ProductManagement.jsx
│   │   │       ├── OrderManagement.jsx
│   │   │       ├── UserManagement.jsx
│   │   │       └── Statistics.jsx
│   │   │
│   │   ├── contexts/                 # React Context
│   │   │   ├── AuthContext.jsx
│   │   │   ├── CartContext.jsx
│   │   │   └── ThemeContext.jsx
│   │   │
│   │   ├── hooks/                    # Custom hooks
│   │   │   ├── useAuth.js
│   │   │   ├── useCart.js
│   │   │   └── useProducts.js
│   │   │
│   │   ├── utils/                    # Utilities
│   │   │   ├── constants.js
│   │   │   ├── formatters.js
│   │   │   └── validators.js
│   │   │
│   │   ├── styles/                   # CSS/SCSS
│   │   │   ├── global.css
│   │   │   └── variables.css
│   │   │
│   │   ├── assets/                   # Images, icons
│   │   │   ├── images/
│   │   │   └── icons/
│   │   │
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   │
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── README.md
│
├── .gitignore                        # Git ignore chung
└── README.md                         # Documentation tổng
```

---

##  API Documentation

### Authentication

```
POST   /api/auth/register        - Đăng ký tài khoản
POST   /api/auth/login           - Đăng nhập
GET    /api/auth/me              - Lấy thông tin user hiện tại
PUT    /api/auth/profile         - Cập nhật thông tin
PUT    /api/auth/change-password - Đổi mật khẩu
POST   /api/auth/logout          - Đăng xuất
```

### Users (Admin)

```
GET    /api/users                - Danh sách users
GET    /api/users/stats          - Thống kê users
GET    /api/users/:id            - Chi tiết user
PUT    /api/users/:id            - Cập nhật user
DELETE /api/users/:id            - Xóa user
PUT    /api/users/:id/toggle-status - Khóa/Mở khóa user
```

### Products

```
GET    /api/products             - Danh sách sản phẩm
GET    /api/products/:id         - Chi tiết sản phẩm
POST   /api/products             - Tạo sản phẩm (Admin)
PUT    /api/products/:id         - Cập nhật sản phẩm (Admin)
DELETE /api/products/:id         - Xóa sản phẩm (Admin)
GET    /api/products/search      - Tìm kiếm sản phẩm
```

### Cart

```
GET    /api/cart                 - Xem giỏ hàng
POST   /api/cart/items           - Thêm vào giỏ
PUT    /api/cart/items/:id       - Cập nhật số lượng
DELETE /api/cart/items/:id       - Xóa khỏi giỏ
```

### Orders

```
GET    /api/orders               - Danh sách đơn hàng
GET    /api/orders/:id           - Chi tiết đơn hàng
POST   /api/orders               - Tạo đơn hàng
PUT    /api/orders/:id/status    - Cập nhật trạng thái (Admin)
```

**Chi tiết đầy đủ:** Xem file `API_DOCUMENTATION.md`

---

##  Team

- **Team Leader:** Lâm Thanh Thanh
- **Member:** Nguyễn Thị Tâm Minh
- **Member:** Lư Thanh Tùng


**Giảng viên hướng dẫn:** ThS. Võ Huỳnh Trâm

**Trường:** Đại học Cần Thơ

**Khóa:** Năm học 2025-2026

---

##  Acknowledgments

- Gemini API
- MongoDB
- React
- Express.js
- Tailwind CSS

---

**Made with 💚 by Zero-Waste Team**