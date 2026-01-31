# 🎓 HƯỚNG DẪN CHI TIẾT - QUY TRÌNH LÀM VIỆC NHÓM VỚI GIT

## 📋 MỤC LỤC
1. [Tổng quan Workflow](#tổng-quan-workflow)
2. [Ví dụ thực tế từng bước](#ví-dụ-thực-tế-từng-bước)
3. [Tình huống cụ thể](#tình-huống-cụ-thể)
4. [Giải đáp thắc mắc](#giải-đáp-thắc-mắc)

---

## 🎯 TỔNG QUAN WORKFLOW

### Hình ảnh tổng quát:

```
         GitHub Repository
              │
    ┌─────────┼─────────┐
    │         │         │
   main      dev    feature branches
    │         │         │
    │         │    ┌────┼────┬────┬────┐
    │         │    │    │    │    │    │
    │         │   M1   M2   M3   M4   M5
    │         │    │    │    │    │    │
    │         │    └────┴────┴────┴────┘
    │         │         │
    │         ◄─────────┘ (Pull Requests)
    │         │
    ◄─────────┘ (Release)

M1, M2, M3... = Thành viên 1, 2, 3...
```

### Luồng code:

```
Developer → feature branch → Pull Request → Review → Merge to dev → Test → Merge to main → Deploy
```

---

## 🚀 VÍ DỤ THỰC TẾ TỪNG BƯỚC

Giả sử nhóm có **5 người** và bạn là **Member 2** - làm Backend Products.

---

### 📅 NGÀY 1 (Thứ 2) - NHẬN TASK VÀ BẮT ĐẦU

#### Tình huống:
Leader vừa họp xong, phân công:
- **Bạn (Member 2):** Làm Product Backend (models, controllers, APIs)
- **Member 1:** Làm Product Frontend
- **Member 3, 4, 5:** Làm phần khác

#### Bước 1: Clone repository (lần đầu tiên)

```bash
# Mở Terminal/Command Prompt
cd Desktop  # hoặc thư mục nào bạn muốn

# Clone repository
git clone https://github.com/nguyenvana/zero-waste-ecommerce.git

# Di chuyển vào thư mục dự án
cd zero-waste-ecommerce

# Kiểm tra branches hiện có
git branch -a

# Output:
# * main
#   remotes/origin/HEAD -> origin/main
#   remotes/origin/main
#   remotes/origin/dev
```

**Giải thích:**
- `git clone`: Download toàn bộ code từ GitHub về máy bạn
- `remotes/origin/main`: Branch main trên GitHub
- `remotes/origin/dev`: Branch dev trên GitHub

#### Bước 2: Checkout vào branch dev

```bash
# Chuyển sang branch dev (nhánh phát triển chính)
git checkout dev

# Output:
# Switched to a new branch 'dev'
# branch 'dev' set up to track 'origin/dev'.

# Kiểm tra bạn đang ở branch nào
git branch

# Output:
#   main
# * dev    ← Dấu * nghĩa là đang ở branch này
```

**Giải thích:**
- Tất cả code mới sẽ được merge vào `dev` trước
- `main` chỉ dùng cho production/release

#### Bước 3: Pull code mới nhất

```bash
git pull origin dev

# Output:
# Already up to date.
# (Vì bạn vừa clone, nên đã là mới nhất)
```

**Giải thích:**
- `pull`: Lấy code mới nhất từ GitHub về
- **LÀM BƯỚC NÀY MỖI SÁNG** để có code mới nhất!

#### Bước 4: Tạo branch cho task của bạn

```bash
# Tạo branch mới từ dev
git checkout -b feature/products-backend

# Output:
# Switched to a new branch 'feature/products-backend'

# Kiểm tra
git branch

# Output:
#   main
#   dev
# * feature/products-backend    ← Đang ở đây
```

**Giải thích:**
- `checkout -b`: Tạo branch mới VÀ chuyển sang branch đó luôn
- `feature/products-backend`: Tên branch (quy ước: feature/ten-task)

#### Bước 5: Push branch lên GitHub (lần đầu)

```bash
git push -u origin feature/products-backend

# Output:
# Total 0 (delta 0), reused 0 (delta 0), pack-reused 0
# To https://github.com/nguyenvana/zero-waste-ecommerce.git
#  * [new branch]      feature/products-backend -> feature/products-backend
# branch 'feature/products-backend' set up to track 'origin/feature/products-backend'.
```

**Giải thích:**
- `push -u origin`: Push branch lên GitHub
- Sau lần đầu, chỉ cần `git push` (không cần `-u origin`)

---

### 📝 NGÀY 1 (Buổi sáng) - BẮT ĐẦU CODE

#### Bước 6: Tạo file Product.js

```bash
# Di chuyển vào thư mục models
cd backend/src/models

# Tạo file Product.js (dùng code editor)
# [Code Product model như đã thiết kế]
```

**File Product.js:**
```javascript
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: String,
  origin: String,
  material: String,
  ecoScore: { type: Number, min: 1, max: 5 },
  isRefillable: { type: Boolean, default: false },
  isReusable: { type: Boolean, default: false },
  // ... các field khác
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
```

#### Bước 7: Kiểm tra thay đổi

```bash
# Quay về thư mục gốc
cd ../../..  # về zero-waste-ecommerce/

# Xem file nào đã thay đổi
git status

# Output:
# On branch feature/products-backend
# Untracked files:
#   (use "git add <file>..." to include in what will be committed)
#         backend/src/models/Product.js
#
# nothing added to commit but untracked files present
```

**Giải thích:**
- `Untracked files`: File mới, chưa được Git theo dõi
- Màu đỏ: Chưa được add

#### Bước 8: Add file vào staging area

```bash
# Add file cụ thể
git add backend/src/models/Product.js

# Hoặc add tất cả
git add .

# Kiểm tra lại
git status

# Output:
# On branch feature/products-backend
# Changes to be committed:
#   (use "git restore --staged <file>..." to unstage)
#         new file:   backend/src/models/Product.js
```

**Giải thích:**
- File chuyển sang màu xanh: Đã sẵn sàng commit
- `Changes to be committed`: Những thay đổi sẽ được commit

#### Bước 9: Commit thay đổi

```bash
git commit -m "feat: Add Product model with zero-waste attributes"

# Output:
# [feature/products-backend 1a2b3c4] feat: Add Product model with zero-waste attributes
#  1 file changed, 50 insertions(+)
#  create mode 100644 backend/src/models/Product.js
```

**Giải thích:**
- `commit`: Lưu lại thay đổi vào lịch sử Git
- `-m "message"`: Tin nhắn mô tả thay đổi
- `1a2b3c4`: Mã hash của commit (unique)

#### Bước 10: Push lên GitHub

```bash
git push

# Output:
# Enumerating objects: 8, done.
# Counting objects: 100% (8/8), done.
# Writing objects: 100% (5/5), 1.23 KiB | 1.23 MiB/s, done.
# To https://github.com/nguyenvana/zero-waste-ecommerce.git
#    abc1234..def5678  feature/products-backend -> feature/products-backend
```

**Giải thích:**
- Code đã được đẩy lên GitHub
- Team khác có thể xem code của bạn trên GitHub

---

### ⏰ NGÀY 1 (Buổi chiều) - TIẾP TỤC CODE

#### Bước 11: Tạo thêm ProductController

```bash
# Tạo file productController.js
cd backend/src/controllers
# [Code controller]
```

#### Bước 12: Commit tiếp

```bash
cd ../../..  # về gốc

git status
# Output: modified: backend/src/controllers/productController.js

git add backend/src/controllers/productController.js

git commit -m "feat: Add product CRUD operations in controller"

git push
```

**Chu trình lặp lại:**
```
Code → git status → git add → git commit → git push
```

---

### 🌙 NGÀY 1 (Cuối ngày)

Bạn đã tạo:
- ✅ Product.js (model)
- ✅ productController.js
- ✅ productService.js
- ✅ productRoutes.js

```bash
# Xem lịch sử commits
git log --oneline

# Output:
# def5678 feat: Add product routes
# abc1234 feat: Add product service
# 9876543 feat: Add product CRUD operations in controller
# 1a2b3c4 feat: Add Product model with zero-waste attributes
```

---

### 📅 NGÀY 2 (Thứ 3 sáng) - UPDATE CODE MỚI

#### Tình huống:
Tối qua Leader đã merge PR của Member 1 (Frontend) vào `dev`.  
Bạn cần **pull code mới** để không bị lạc hậu.

#### Bước 13: Pull code mới từ dev

```bash
# 1. Chuyển về dev
git checkout dev

# Output:
# Switched to branch 'dev'
# Your branch is behind 'origin/dev' by 5 commits
# (Nghĩa là dev trên GitHub có 5 commits mới)

# 2. Pull code mới
git pull origin dev

# Output:
# Updating abc1234..xyz9876
# Fast-forward
#  frontend/src/pages/ProductList.jsx     | 150 ++++++++++++++++++
#  frontend/src/components/ProductCard.jsx | 80 ++++++++++
#  2 files changed, 230 insertions(+)
```

**Giải thích:**
- Leader đã merge code của Member 1
- Bây giờ `dev` có code Frontend mới
- Bạn vừa pull về máy

#### Bước 14: Merge dev vào branch của bạn

```bash
# 1. Chuyển về branch của bạn
git checkout feature/products-backend

# Output:
# Switched to branch 'feature/products-backend'

# 2. Merge code từ dev vào
git merge dev

# Output:
# Auto-merging backend/src/app.js
# CONFLICT (content): Merge conflict in backend/src/app.js
# Automatic merge failed; fix conflicts and then commit the result.
```

**Ối! Có CONFLICT!** 😱

---

### ⚠️ XỬ LÝ CONFLICT (QUAN TRỌNG!)

#### Tình huống Conflict:

**Nguyên nhân:**
- **Member 1** sửa file `app.js` thêm route Frontend
- **Bạn** cũng sửa file `app.js` thêm route Backend
- Cùng sửa 1 file → Conflict!

#### Bước 15: Xem file nào conflict

```bash
git status

# Output:
# On branch feature/products-backend
# You have unmerged paths.
#   (fix conflicts and run "git commit")
#
# Unmerged paths:
#   (use "git add <file>..." to mark resolution)
#         both modified:   backend/src/app.js    ← File conflict
```

#### Bước 16: Mở file và sửa conflict

**Mở `backend/src/app.js` trong VS Code:**

```javascript
// ... các import ...

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
<<<<<<< HEAD
// Code của BẠN (feature/products-backend)
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
=======
// Code từ DEV (của Member 1)
app.use('/api/cart', require('./routes/cartRoutes'));
>>>>>>> dev

// ... code tiếp theo ...
```

**Giải thích:**
- `<<<<<<< HEAD`: Code của BẠN
- `=======`: Phân cách
- `>>>>>>> dev`: Code từ DEV (của người khác)

#### Bước 17: Sửa thành:

```javascript
// ... các import ...

// Routes
app.use('/api/auth', require('./routes/authRoutes'));

// Product routes (của BẠN)
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));

// Cart routes (từ DEV - của Member 1)
app.use('/api/cart', require('./routes/cartRoutes'));

// ... code tiếp theo ...
```

**XÓA các dấu:**
- ❌ Xóa `<<<<<<< HEAD`
- ❌ Xóa `=======`
- ❌ Xóa `>>>>>>> dev`

#### Bước 18: Đánh dấu đã giải quyết conflict

```bash
# Add file đã sửa
git add backend/src/app.js

# Commit merge
git commit -m "merge: Resolve conflict in app.js between products and cart routes"

# Push lên GitHub
git push
```

**Giải thích:**
- `git add`: Đánh dấu "Tôi đã sửa xong conflict"
- `git commit`: Lưu lại việc merge
- Bây giờ branch của bạn đã có code mới nhất!

---

### 📅 NGÀY 3-4 - HOÀN THÀNH TASK

Bạn code tiếp...

```bash
# Mỗi ngày:
git checkout dev
git pull origin dev
git checkout feature/products-backend
git merge dev

# Code, code, code...
git add .
git commit -m "feat: ..."
git push
```

---

### ✅ NGÀY 5 (Thứ 6) - TẠO PULL REQUEST

#### Tình huống:
Bạn đã hoàn thành Product Backend. Giờ cần merge vào `dev`.

#### Bước 19: Push lần cuối

```bash
# Đảm bảo đã commit & push hết
git status

# Output:
# On branch feature/products-backend
# nothing to commit, working tree clean

# Pull dev mới nhất lần cuối
git checkout dev
git pull origin dev
git checkout feature/products-backend
git merge dev

# Nếu có conflict → giải quyết
# Không có conflict → push
git push
```

#### Bước 20: Tạo Pull Request trên GitHub

**Trên trình duyệt:**

1. **Vào repository:** https://github.com/nguyenvana/zero-waste-ecommerce

2. **Click tab "Pull requests"**

3. **Click "New pull request"**

4. **Chọn branches:**
   - **Base:** `dev` (merge VÀO đây)
   - **Compare:** `feature/products-backend` (từ branch này)

5. **Click "Create pull request"**

6. **Điền thông tin:**

```markdown
Title: [Feature] Add Product Backend Module

Description:
## 📝 Mô tả
Thêm backend cho quản lý sản phẩm zero-waste

## ✅ Thay đổi
- ✅ Product model với zero-waste attributes
- ✅ ProductVariant, Category, Certificate, Packaging models
- ✅ Product CRUD APIs
- ✅ Category management APIs
- ✅ Image upload với Cloudinary
- ✅ Search & filter logic
- ✅ Pagination

## 🧪 Testing
- Tested với Postman
- All APIs working
- No console errors

## 📸 Screenshots
[Attach Postman screenshots]
```

7. **Assign reviewers:** Chọn Team Leader

8. **Click "Create pull request"**

---

### 👀 REVIEW VÀ MERGE (Leader làm)

#### Leader sẽ:

```bash
# 1. Pull branch của bạn về
git fetch origin
git checkout feature/products-backend
git pull origin feature/products-backend

# 2. Chạy thử
cd backend
npm install  # Nếu có dependencies mới
npm run dev

# 3. Test APIs với Postman

# 4. Đọc code, comment nếu cần sửa
```

#### Nếu cần sửa:

**Leader comment trên PR:**
```
Please fix:
- [ ] Add validation for ecoScore (must be 1-5)
- [ ] Handle error when product not found
```

**Bạn sửa:**
```bash
# Sửa code trên branch feature/products-backend
git add .
git commit -m "fix: Add validation and error handling"
git push

# PR tự động update!
```

#### Khi OK → Leader merge:

**Trên GitHub PR:**
1. Click "Approve"
2. Click "Squash and merge"
3. Confirm merge
4. Delete branch `feature/products-backend` (optional)

---

### 🎉 SAU KHI MERGE - TẤT CẢ UPDATE

#### Bước 21: Tất cả thành viên pull code mới

```bash
# Member 1, 2, 3, 4, 5 đều làm:

git checkout dev
git pull origin dev

# Giờ dev đã có code Product Backend!

# Merge vào branch đang làm
git checkout feature/cart  # branch của từng người
git merge dev
```

---

## 🎬 VÍ DỤ TIMELINE THỰC TẾ

### Tuần 1:

**Thứ 2:**
- Member 1: Tạo `feature/products-frontend`
- Member 2: Tạo `feature/products-backend`

**Thứ 2-4:**
- Cả 2 code song song
- Mỗi ngày pull dev, merge vào branch mình

**Thứ 5:**
- Member 2 hoàn thành → Tạo PR
- Leader review → Merge `feature/products-backend` → `dev`

**Thứ 6:**
- Member 1 hoàn thành → Tạo PR
- Member 1 phải pull dev mới (đã có backend) → Merge vào branch
- Leader review → Merge `feature/products-frontend` → `dev`

**Cuối tuần:**
- `dev` đã có: Products Frontend + Backend
- Tất cả pull về để có code mới

---

## 📊 VISUALIZE WORKFLOW

### Timeline diagram:

```
Thứ 2:
dev: ─────────────────────────────────────────────────
       │                │
       ├─ M1: frontend ─┤
       ├─ M2: backend ──┤

Thứ 3:
dev: ─────────────────────────────────────────────────
       │                │
       ├─ M1: code... ──┤
       ├─ M2: code... ──┤

Thứ 4:
dev: ─────────────────────────────────────────────────
       │                │
       ├─ M1: code... ──┤
       ├─ M2: code... ──┤ (PR tạo)

Thứ 5:
dev: ──── MERGE M2 ────────────────────────────────────
       │                │
       ├─ M1: code... ──┤ (pull dev, merge)
       
Thứ 6:
dev: ──── MERGE M2 ──── MERGE M1 ──────────────────────
       
       [Tất cả pull dev mới]
```

---

## 🤔 GIẢI ĐÁP THẮC MẮC

### ❓ Tại sao phải pull dev mỗi ngày?

**Trả lời:**
Vì code của người khác có thể được merge vào `dev` hàng ngày.
Nếu không pull, bạn sẽ code trên version cũ → Conflict nhiều hơn khi merge sau.

**Ví dụ:**
```
Sáng thứ 2: dev có 10 commits
Chiều thứ 2: Leader merge PR → dev có 15 commits
Sáng thứ 3: Bạn không pull → vẫn đang ở 10 commits (CŨ!)
Thứ 6: Bạn tạo PR → Phải merge 5 commits còn thiếu → Nhiều conflicts!
```

### ❓ Khi nào nên commit?

**Trả lời:**
- ✅ Hoàn thành 1 tính năng nhỏ (ví dụ: 1 function, 1 component)
- ✅ Trước khi nghỉ trưa, tan làm
- ✅ Trước khi pull code mới
- ❌ KHÔNG commit code lỗi, không chạy được

**Ví dụ:**
```bash
# ✅ TốT
git commit -m "feat: Add product model"
git commit -m "feat: Add product controller"
git commit -m "feat: Add product routes"

# ❌ XẤU
[Code cả ngày, không commit]
git commit -m "Add products"  # Quá chung chung!
```

### ❓ Conflict thì phải làm sao?

**Trả lời:**
1. **KHÔNG PANIC!** Conflict là bình thường
2. Mở file conflict
3. Xem code của 2 bên (HEAD và dev)
4. Quyết định giữ lại gì, xóa gì
5. Xóa các dấu `<<<<`, `====`, `>>>>`
6. `git add` → `git commit` → Done!

**Tips:**
- Nếu không chắc → Hỏi người code phần conflict
- Dùng VS Code: Có nút "Accept Both Changes" rất tiện

### ❓ Làm sao biết ai đang làm gì?

**Trả lời:**
- Xem branches trên GitHub
- Daily standup meeting
- Discord/Slack channel
- GitHub Projects board

### ❓ Nếu push nhầm code lỗi thì sao?

**Trả lời:**
```bash
# Quay lại commit trước
git reset --soft HEAD~1

# Sửa code

# Commit lại
git commit -m "fix: ..."
git push -f  # Force push (CẨNTRỌNG!)
```

**LƯU Ý:** Chỉ force push trên branch CỦA MÌNH, không bao giờ force push lên `dev` hay `main`!

---

## 📝 CHECKLIST HÀNG NGÀY

### Mỗi sáng (5 phút):
- [ ] `git checkout dev`
- [ ] `git pull origin dev`
- [ ] `git checkout feature/your-branch`
- [ ] `git merge dev`
- [ ] Giải quyết conflicts (nếu có)

### Trong ngày:
- [ ] Code tính năng
- [ ] Test kỹ
- [ ] `git add .`
- [ ] `git commit -m "..."`
- [ ] `git push`

### Cuối ngày:
- [ ] Commit tất cả code
- [ ] Push lên GitHub
- [ ] Update tiến độ cho team

### Khi hoàn thành task:
- [ ] Pull dev mới nhất
- [ ] Merge vào branch
- [ ] Giải quyết conflicts
- [ ] Test lại toàn bộ
- [ ] Tạo Pull Request
- [ ] Assign reviewer

---

## 🎯 TÓM TẮT

### Workflow 1 sprint (1 tuần):

```
Thứ 2: Nhận task → Tạo branch → Bắt đầu code
Thứ 3-4: Code, commit, push hàng ngày
Thứ 5: Hoàn thành → Tạo PR
Thứ 6: Review → Merge → Tất cả pull code mới
```

### Các lệnh quan trọng nhất:

```bash
# Mỗi sáng
git checkout dev && git pull origin dev
git checkout feature/your-branch && git merge dev

# Mỗi khi code
git add . && git commit -m "..." && git push

# Khi xong task
# → Tạo PR trên GitHub
```

---

Bạn đã hiểu rõ chưa? Có phần nào còn thắc mắc không? 😊
